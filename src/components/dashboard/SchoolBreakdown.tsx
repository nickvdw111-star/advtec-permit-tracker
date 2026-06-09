import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

interface SchoolRow {
  id: string;
  name: string;
  totalExpat: number;
  compliant: number;
  atRisk: number;
  expired: number;
}

export function SchoolBreakdown({ rows }: { rows: SchoolRow[] }) {
  return (
    <div className="overflow-hidden rounded border">
      <div className="bg-slate-100 px-4 py-2 text-sm font-semibold">
        Risk by School
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>School</TableHead>
            <TableHead>Expat Teachers</TableHead>
            <TableHead>Compliant</TableHead>
            <TableHead>At Risk</TableHead>
            <TableHead>Expired</TableHead>
            <TableHead>% Compliant</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell>{r.totalExpat}</TableCell>
              <TableCell>{r.compliant}</TableCell>
              <TableCell>{r.atRisk}</TableCell>
              <TableCell
                className={r.expired > 0 ? "font-medium text-red-600" : ""}
              >
                {r.expired}
              </TableCell>
              <TableCell>
                {r.totalExpat > 0
                  ? Math.round((r.compliant / r.totalExpat) * 100)
                  : 0}
                %
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
