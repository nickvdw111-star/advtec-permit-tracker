import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { AuditLog as AuditLogType, User } from "@prisma/client";

type AuditEntry = AuditLogType & { user: User };

export function AuditLog({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-400">No audit entries yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Timestamp</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Field</TableHead>
          <TableHead>Old Value</TableHead>
          <TableHead>New Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((e) => (
          <TableRow key={e.id}>
            <TableCell className="text-xs">
              {new Date(e.timestamp).toLocaleString()}
            </TableCell>
            <TableCell>{e.user.name}</TableCell>
            <TableCell>{e.action}</TableCell>
            <TableCell>{e.fieldChanged ?? "—"}</TableCell>
            <TableCell className="max-w-[120px] truncate">
              {e.oldValue ?? "—"}
            </TableCell>
            <TableCell className="max-w-[120px] truncate">
              {e.newValue ?? "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
