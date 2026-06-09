"use client";
import { useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { StatusBadge } from "~/components/teachers/StatusBadge";
import { calculateTeacherStatus, type ComplianceStatus } from "~/lib/status";
import type { Teacher, Permit } from "@prisma/client";

type TeacherWithPermits = Teacher & { permits: Permit[] };

const STATUS_OPTIONS: { value: ComplianceStatus | "ALL"; label: string }[] = [
  { value: "ALL",             label: "All statuses" },
  { value: "COMPLIANT",       label: "Compliant" },
  { value: "AT_RISK",         label: "At Risk" },
  { value: "ACTION_REQUIRED", label: "Action Required" },
  { value: "IN_PROGRESS",     label: "In Progress" },
  { value: "IN_APPEAL",       label: "In Appeal" },
  { value: "EXPIRED",         label: "Expired" },
  { value: "EXEMPT",          label: "Exempt" },
];

const TYPE_OPTIONS = [
  { value: "ALL",   label: "All types" },
  { value: "EXPAT", label: "Expat" },
  { value: "LOCAL", label: "Local" },
];

function fmt(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB");
}

function permitEnd(permits: Permit[], type: string): string {
  const p = permits.find((p) => p.permitType === type);
  return p ? fmt(p.endDate) : "";
}

function permitStatus(permits: Permit[], type: string): string {
  const p = permits.find((p) => p.permitType === type);
  return p ? p.workflowStatus : "";
}

function toRows(teachers: TeacherWithPermits[]) {
  return teachers.map((t) => ({
    Surname:              t.surname,
    Name:                 t.name,
    "Employee No.":       t.employeeNo,
    "Standard / Subject": t.subject,
    Department:           t.department,
    Type:                 t.teacherType === "EXPAT" ? "Expat" : "Local",
    "Country of Origin":  t.countryOfOrigin,
    Gender:               t.gender,
    "Date of Birth":      fmt(t.dateOfBirth),
    "Employment Start":   fmt(t.employmentStartDate),
    "Contract Start":     fmt(t.contractStart),
    "Contract End":       fmt(t.contractEnd),
    Status:               calculateTeacherStatus(t.teacherType, t.permits),
    "PTT Expiry":         permitEnd(t.permits, "PERMISSION_TO_TEACH"),
    "PTT Workflow":       permitStatus(t.permits, "PERMISSION_TO_TEACH"),
    "PTW Expiry":         permitEnd(t.permits, "PERMISSION_TO_WORK"),
    "PTW Workflow":       permitStatus(t.permits, "PERMISSION_TO_WORK"),
    "WP Expiry":          permitEnd(t.permits, "WORK_PERMIT"),
    "WP Workflow":        permitStatus(t.permits, "WORK_PERMIT"),
    Notes:                t.notes ?? "",
  }));
}

function exportCSV(teachers: TeacherWithPermits[], filename: string) {
  const rows  = toRows(teachers);
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]!);
  const lines   = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => `"${String(r[h as keyof typeof r] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportExcel(teachers: TeacherWithPermits[], filename: string) {
  const rows = toRows(teachers);
  const ws   = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws["!cols"] = [
    { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 22 }, { wch: 18 },
    { wch: 8  }, { wch: 18 }, { wch: 8  }, { wch: 12 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 14 },
    { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 36 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Teachers");
  XLSX.writeFile(wb, filename);
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function TeacherList({ teachers }: { teachers: TeacherWithPermits[] }) {
  const [search,       setSearch] = useState("");
  const [statusFilter, setStatus] = useState<ComplianceStatus | "ALL">("ALL");
  const [typeFilter,   setType]   = useState<"ALL" | "EXPAT" | "LOCAL">("ALL");

  const filtered = teachers.filter((t) => {
    const q      = search.toLowerCase();
    const status = calculateTeacherStatus(t.teacherType, t.permits);

    const matchSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.surname.toLowerCase().includes(q) ||
      t.employeeNo.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q);

    const matchStatus = statusFilter === "ALL" || status === statusFilter;
    const matchType   = typeFilter   === "ALL" || t.teacherType === typeFilter;

    return matchSearch && matchStatus && matchType;
  });

  const activeFilters =
    (statusFilter !== "ALL" ? 1 : 0) + (typeFilter !== "ALL" ? 1 : 0);

  const stamp = dateStamp();

  return (
    <div className="space-y-4">
      {/* Filter + export bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search name, employee no. or subject…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatus(v as typeof statusFilter)}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={typeFilter}
          onValueChange={(v) => setType(v as typeof typeFilter)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {activeFilters > 0 && (
          <button
            onClick={() => { setStatus("ALL"); setType("ALL"); }}
            className="text-xs text-[#1a3878] underline underline-offset-2 hover:no-underline"
          >
            Clear filters
          </button>
        )}

        {/* Export buttons */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-slate-400">
            {filtered.length} of {teachers.length} teachers
          </span>
          <div className="h-4 w-px bg-slate-200" />
          <button
            onClick={() => exportCSV(filtered, `teachers-${stamp}.csv`)}
            className="rounded border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:border-[#1a3878] hover:text-[#1a3878] transition-colors"
          >
            CSV
          </button>
          <button
            onClick={() => exportExcel(filtered, `teachers-${stamp}.xlsx`)}
            className="rounded border border-[#1a3878] bg-[#1a3878] px-3 py-1 text-xs font-medium text-white hover:bg-[#15306a] transition-colors"
          >
            Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Surname</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Employee No.</TableHead>
            <TableHead>Standard / Subject</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <Link
                  href={`/teachers/${t.id}`}
                  className="font-medium text-[#1a3878] hover:underline"
                >
                  {t.surname}
                </Link>
              </TableCell>
              <TableCell>{t.name}</TableCell>
              <TableCell className="text-slate-500">{t.employeeNo}</TableCell>
              <TableCell className="text-slate-600">{t.subject || "—"}</TableCell>
              <TableCell>
                {t.teacherType === "EXPAT" ? "Expat" : "Local"}
              </TableCell>
              <TableCell>
                <StatusBadge
                  status={calculateTeacherStatus(t.teacherType, t.permits)}
                />
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-slate-400">
                No teachers match the current filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
