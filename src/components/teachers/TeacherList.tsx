"use client";
import { useState } from "react";
import Link from "next/link";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { StatusBadge } from "~/components/teachers/StatusBadge";
import { calculateTeacherStatus } from "~/lib/status";
import type { Teacher, Permit } from "@prisma/client";

type TeacherWithPermits = Teacher & { permits: Permit[] };

export function TeacherList({ teachers }: { teachers: TeacherWithPermits[] }) {
  const [search, setSearch] = useState("");

  const filtered = teachers.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.surname.toLowerCase().includes(q) ||
      t.employeeNo.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by name or employee number…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Surname</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Employee No.</TableHead>
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
                  className="font-medium hover:underline"
                >
                  {t.surname}
                </Link>
              </TableCell>
              <TableCell>{t.name}</TableCell>
              <TableCell>{t.employeeNo}</TableCell>
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
              <TableCell colSpan={5} className="text-center text-slate-400">
                No teachers found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
