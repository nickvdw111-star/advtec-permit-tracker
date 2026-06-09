import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { ComplianceStatus } from "~/lib/status";

interface TileProps {
  label: string;
  value: number | string;
  highlight?: "red" | "amber" | "green";
}

function Tile({ label, value, highlight }: TileProps) {
  const colour =
    highlight === "red"
      ? "text-red-600"
      : highlight === "amber"
        ? "text-amber-600"
        : highlight === "green"
          ? "text-green-600"
          : "text-slate-800";
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-slate-500">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${colour}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

interface Props {
  total: number;
  expat: number;
  local: number;
  counts: Record<ComplianceStatus, number>;
}

export function RiskTiles({ total, expat, local, counts }: Props) {
  const compliantPct =
    expat > 0 ? Math.round((counts.COMPLIANT / expat) * 100) : 0;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Tile label="Total Teachers" value={total} />
      <Tile label="Expat" value={expat} />
      <Tile label="Local" value={local} />
      <Tile
        label="% Compliant"
        value={`${compliantPct}%`}
        highlight={compliantPct >= 80 ? "green" : "amber"}
      />
      <Tile
        label="At Risk"
        value={counts.AT_RISK}
        highlight={counts.AT_RISK > 0 ? "amber" : undefined}
      />
      <Tile
        label="Action Required"
        value={counts.ACTION_REQUIRED}
        highlight={counts.ACTION_REQUIRED > 0 ? "amber" : undefined}
      />
      <Tile
        label="In Appeal"
        value={counts.IN_APPEAL}
        highlight={counts.IN_APPEAL > 0 ? "amber" : undefined}
      />
      <Tile
        label="Expired"
        value={counts.EXPIRED}
        highlight={counts.EXPIRED > 0 ? "red" : undefined}
      />
    </div>
  );
}
