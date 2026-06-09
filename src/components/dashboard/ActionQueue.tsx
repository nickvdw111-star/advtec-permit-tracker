import Link from "next/link";
import { StatusBadge } from "~/components/teachers/StatusBadge";
import type { ComplianceStatus } from "~/lib/status";
import type { Teacher } from "@prisma/client";

type QueueEntry = Teacher & { status: ComplianceStatus };

export function ActionQueue({ entries }: { entries: QueueEntry[] }) {
  return (
    <div className="overflow-hidden rounded border">
      <div className="bg-slate-100 px-4 py-2 text-sm font-semibold">
        Action Queue
      </div>
      {entries.length === 0 && (
        <p className="p-4 text-sm text-slate-400">No outstanding actions.</p>
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
