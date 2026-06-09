/**
 * Import teacher and permit data from
 * "Permit_status_localisation_4_March_2026.xlsx" — Primary School (2) sheet.
 *
 * Usage:
 *   npx tsx scripts/import-teachers.ts [path/to/file.xlsx]
 *
 * Idempotent: upserts teachers by employeeNo; skips existing permits by type.
 */

import { PrismaClient } from "@prisma/client";
import { createRequire } from "module";
import * as path from "path";

// xlsx is CJS — use createRequire for reliable interop in ESM context
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const XLSX = require("xlsx") as typeof import("xlsx");

const db = new PrismaClient();

const DEFAULT_XLSX_PATH =
  "/home/kelner/amori3/Efforts/Project folder/Advtec/Permit_status_localisation_4_March_2026.xlsx";

// Column indices in "Primary School (2)"
const COL = {
  SURNAME: 1,
  NAME: 2,
  SUBJECT: 3,
  EMPLOYEE_NO: 4,
  COUNTRY: 5,
  DATE_OF_BIRTH: 6,
  EMPLOYMENT_START: 7,
  PERFORMANCE_RATING: 9,
  CONTRACT_START: 10,
  CONTRACT_END: 11,
  PTT_START: 12,
  PTT_END: 13,
  PTW_START: 14,
  PTW_END: 15,
  WP_START: 16,
  WP_END: 17,
  COMMENTS: 18,
  NEXT_STEPS: 26,
};

function excelSerialToDate(serial: number): Date {
  // Excel epoch offset: serial 1 = 1900-01-01 with Lotus 1-2-3 leap bug
  return new Date((serial - 25569) * 86400 * 1000);
}

function parseDate(val: unknown): Date | null {
  if (val == null) return null;
  if (typeof val === "number") return excelSerialToDate(val);
  if (typeof val === "string") {
    const s = val.trim();
    if (!s || s.toUpperCase() === "N/A") return null;
    // DD/MM/YYYY
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      return new Date(parseInt(m[3]!), parseInt(m[2]!) - 1, parseInt(m[1]!));
    }
    // Try ISO
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function isNA(val: unknown): boolean {
  return typeof val === "string" && val.trim().toUpperCase() === "N/A";
}

function inferWorkflowStatus(
  comments: string,
): "NONE" | "IN_PROGRESS" | "IN_APPEAL" {
  const lower = comments.toLowerCase();
  if (lower.includes("appeal")) return "IN_APPEAL";
  if (
    lower.includes("awaiting") ||
    lower.includes("applied") ||
    lower.includes("submitted") ||
    lower.includes("in process") ||
    lower.includes("in progress") ||
    lower.includes("extending")
  )
    return "IN_PROGRESS";
  return "NONE";
}

async function main() {
  const filePath = process.argv[2]
    ? path.resolve(process.argv[2])
    : DEFAULT_XLSX_PATH;

  console.log("Reading:", filePath);

  const school = await db.school.findFirst({
    where: { name: { contains: "GIS" } },
  });
  if (!school)
    throw new Error(
      "GIS school not found in database — run `npx prisma db seed` first",
    );
  console.log("School:", school.name, "(id:", school.id + ")");

  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets["Primary School (2)"];
  if (!ws)
    throw new Error(
      'Sheet "Primary School (2)" not found in the workbook',
    );

  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
  // row 0 = column group headers, row 1 = start/end sub-headers, row 2+ = data
  const dataRows = rows.slice(2);

  let teachersCreated = 0;
  let teachersUpdated = 0;
  let teachersSkipped = 0;
  let permitsAdded = 0;

  for (const rawRow of dataRows) {
    const row = rawRow as unknown[];

    const surname = String(row[COL.SURNAME] ?? "").trim();
    const name = String(row[COL.NAME] ?? "").trim();
    const employeeNoRaw = row[COL.EMPLOYEE_NO];

    if (!surname || !name || employeeNoRaw == null) {
      teachersSkipped++;
      continue;
    }

    const employeeNo = String(employeeNoRaw).trim();
    const subject = String(row[COL.SUBJECT] ?? "").trim() || "Unknown";
    const countryOfOrigin = String(row[COL.COUNTRY] ?? "Unknown").trim();
    const dob = parseDate(row[COL.DATE_OF_BIRTH]);
    const empStart = parseDate(row[COL.EMPLOYMENT_START]);
    const perfRating =
      row[COL.PERFORMANCE_RATING] != null
        ? String(row[COL.PERFORMANCE_RATING])
        : null;
    const contractStart = parseDate(row[COL.CONTRACT_START]);
    const contractEnd = parseDate(row[COL.CONTRACT_END]);
    const comments = String(row[COL.COMMENTS] ?? "").trim() || null;
    const nextSteps = String(row[COL.NEXT_STEPS] ?? "").trim() || null;

    const teacherType: "EXPAT" | "LOCAL" =
      countryOfOrigin.toLowerCase() === "botswana" ? "LOCAL" : "EXPAT";

    // Combine comments and next steps into teacher notes for visibility
    const noteParts = [comments, nextSteps].filter(Boolean);

    const teacherData = {
      surname,
      name,
      employeeNo,
      schoolId: school.id,
      department: "Primary School",
      subject,
      countryOfOrigin,
      dateOfBirth: dob ?? new Date("1970-01-01"),
      employmentStartDate: empStart ?? new Date("2000-01-01"),
      contractStart,
      contractEnd,
      teacherType,
      gender: "Unknown",
      performanceRating: perfRating,
      notes: noteParts.length > 0 ? noteParts.join(" | ") : null,
    };

    let teacher;
    const existing = await db.teacher.findUnique({ where: { employeeNo } });
    if (existing) {
      teacher = await db.teacher.update({
        where: { employeeNo },
        data: teacherData,
      });
      teachersUpdated++;
    } else {
      teacher = await db.teacher.create({ data: teacherData });
      teachersCreated++;
    }

    const wfStatus = inferWorkflowStatus(comments ?? "");
    const fallbackStart = teacher.employmentStartDate;

    const upsertPermit = async (
      permitType: "PERMISSION_TO_TEACH" | "PERMISSION_TO_WORK" | "WORK_PERMIT",
      startRaw: unknown,
      endRaw: unknown,
    ) => {
      // Skip if "N/A"
      if (isNA(startRaw) || isNA(endRaw)) return;
      const endDate = parseDate(endRaw);
      if (!endDate) return;
      const startDate = parseDate(startRaw) ?? fallbackStart;

      const existing = await db.permit.findFirst({
        where: { teacherId: teacher.id, permitType },
      });
      if (!existing) {
        await db.permit.create({
          data: {
            teacherId: teacher.id,
            permitType,
            startDate,
            endDate,
            workflowStatus: wfStatus,
            comments: comments ?? null,
            nextSteps: nextSteps ?? null,
          },
        });
        permitsAdded++;
      }
    };

    await upsertPermit(
      "PERMISSION_TO_TEACH",
      row[COL.PTT_START],
      row[COL.PTT_END],
    );
    await upsertPermit(
      "PERMISSION_TO_WORK",
      row[COL.PTW_START],
      row[COL.PTW_END],
    );
    await upsertPermit("WORK_PERMIT", row[COL.WP_START], row[COL.WP_END]);

    console.log(
      `  ${existing ? "~" : "+"} ${surname}, ${name} [${employeeNo}] (${teacherType})`,
    );
  }

  console.log("");
  console.log("Done:");
  console.log(`  Teachers created: ${teachersCreated}`);
  console.log(`  Teachers updated: ${teachersUpdated}`);
  console.log(`  Teachers skipped (blank rows): ${teachersSkipped}`);
  console.log(`  Permits added: ${permitsAdded}`);

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
