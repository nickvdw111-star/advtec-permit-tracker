"use server";
import { revalidatePath } from "next/cache";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import { logAudit } from "~/lib/audit";

export interface TeacherInput {
  surname: string;
  name: string;
  employeeNo: string;
  schoolId: string;
  department: string;
  subject: string;
  countryOfOrigin: string;
  dateOfBirth: Date;
  employmentStartDate: Date;
  contractStart?: Date;
  contractEnd?: Date;
  teacherType: "EXPAT" | "LOCAL";
  gender: string;
  performanceRating?: string;
  notes?: string;
}

export async function createTeacher(input: TeacherInput) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const schoolId =
    session.user.role === "ADMIN" ? session.user.schoolId! : input.schoolId;

  const teacher = await db.teacher.create({
    data: { ...input, schoolId },
  });

  await logAudit({
    entityType: "teacher",
    entityId: teacher.id,
    userId: session.user.id,
    teacherId: teacher.id,
    action: "created",
  });

  revalidatePath("/teachers");
  return teacher;
}

export async function updateTeacher(id: string, input: Partial<TeacherInput>) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  if (session.user.role === "OPS_MANAGER") throw new Error("Forbidden");

  const before = await db.teacher.findUniqueOrThrow({ where: { id } });

  const teacher = await db.teacher.update({
    where: { id },
    data: input,
  });

  const changed = (Object.keys(input) as (keyof typeof input)[]).filter(
    (k) => String(before[k]) !== String(input[k]),
  );

  for (const field of changed) {
    await logAudit({
      entityType: "teacher",
      entityId: id,
      userId: session.user.id,
      teacherId: id,
      action: "updated",
      fieldChanged: field,
      oldValue: String(before[field] ?? ""),
      newValue: String(input[field] ?? ""),
    });
  }

  revalidatePath(`/teachers/${id}`);
  return teacher;
}
