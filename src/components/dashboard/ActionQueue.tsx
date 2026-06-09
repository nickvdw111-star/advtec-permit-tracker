import Link from "next/link";
import { StatusBadge } from "~/components/teachers/StatusBadge";
import type { ComplianceStatus } from "~/lib/status";
import type { Teacher } from "@prisma/client";

type QueueEntry = Teacher & { status: ComplianceStatus };

const TITLES: Partial<Record<ComplianceStatus, string>> = {
  EXPIRED: "Expired Permits",
  IN_APPEAL: "In Appeal",
  ACTION_REQUIRED: "Action Required",
  AT_RISK: "At Risk (Expiring Soon)",
  COMPLIANT: "Compliant Teachers",
  IN_PROGRESS: "In Progress",
  EXEMPT: "Exempt Teachers",
};

interface Props {
  entries: QueueEntry[];
  activeFilter?: ComplianceStatus;
}

export function ActionQueue({ entries, activeFilter }: Props) {
  const title = activeFilter ? (TITLES[activeFilter] ?? activeFilter) : "Action Queue";

  return (
    <div className="overflow-hidden rounded border">
      <div className="bg-[#1a3878] px-4 py-2 text-sm font-semibold text-white">
        {title}
        {activeFilter && (
          <span className="ml-2 text-xs font-normal text-blue-200">
            — {entries.length} teacher{entries.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      {entries.length === 0 && (
        <p className="p-4 text-sm text-slate-400">No teachers in this category.</p>
      )}
      {entries.map((t) => (
        <div
          key={t.id}
          className="flex items-center justify-between border-t px-4 py-2 text-sm"
        >
          <Link
            href={`/teachers/${t.id}`}
            className="font-medium hover:underline"
          >
            {t.surname}, {t.name}
          </Link>
          <StatusBadge status={t.status} />
        </div>
      ))}
    </div>
  );
}
