import { Badge } from "~/components/ui/badge";
import type { ComplianceStatus } from "~/lib/status";

const CONFIG: Record<ComplianceStatus, { label: string; className: string }> = {
  COMPLIANT: {
    label: "Compliant",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  AT_RISK: {
    label: "At Risk",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  ACTION_REQUIRED: {
    label: "Action Required",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  IN_APPEAL: {
    label: "In Appeal",
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  EXEMPT: {
    label: "Exempt",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

export function StatusBadge({ status }: { status: ComplianceStatus }) {
  const { label, className } = CONFIG[status];
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
