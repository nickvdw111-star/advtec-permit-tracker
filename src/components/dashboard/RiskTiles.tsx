import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { ComplianceStatus } from "~/lib/status";

interface TileProps {
  label: string;
  value: number | string;
  highlight?: "red" | "amber" | "green";
  filterKey?: ComplianceStatus;
  active?: boolean;
}

function Tile({ label, value, highlight, filterKey, active }: TileProps) {
  const valueColour =
    highlight === "red"
      ? "text-red-600"
      : highlight === "amber"
        ? "text-amber-600"
        : highlight === "green"
          ? "text-green-600"
          : "text-[#1a3878]";

  const card = (
    <Card
      className={[
        "transition-all",
        filterKey ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : "",
        active ? "ring-2 ring-[#1a3878] shadow-md" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-slate-500">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${valueColour}`}>{value}</p>
        {filterKey && (
          <p className="mt-1 text-xs text-slate-400">
            {active ? "Click to clear filter" : "Click to filter"}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (!filterKey) return card;

  return (
    <Link href={active ? "/dashboard" : `/dashboard?filter=${filterKey}`}>
      {card}
    </Link>
  );
}

interface Props {
  total: number;
  expat: number;
  local: number;
  counts: Record<ComplianceStatus, number>;
  activeFilter?: ComplianceStatus;
}

export function RiskTiles({ total, expat, local, counts, activeFilter }: Props) {
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
        filterKey="COMPLIANT"
        active={activeFilter === "COMPLIANT"}
      />
      <Tile
        label="At Risk"
        value={counts.AT_RISK}
        highlight={counts.AT_RISK > 0 ? "amber" : undefined}
        filterKey="AT_RISK"
        active={activeFilter === "AT_RISK"}
      />
      <Tile
        label="Action Required"
        value={counts.ACTION_REQUIRED}
        highlight={counts.ACTION_REQUIRED > 0 ? "amber" : undefined}
        filterKey="ACTION_REQUIRED"
        active={activeFilter === "ACTION_REQUIRED"}
      />
      <Tile
        label="In Appeal"
        value={counts.IN_APPEAL}
        highlight={counts.IN_APPEAL > 0 ? "amber" : undefined}
        filterKey="IN_APPEAL"
        active={activeFilter === "IN_APPEAL"}
      />
      <Tile
        label="Expired"
        value={counts.EXPIRED}
        highlight={counts.EXPIRED > 0 ? "red" : undefined}
        filterKey="EXPIRED"
        active={activeFilter === "EXPIRED"}
      />
    </div>
  );
}
