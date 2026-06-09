import Link from "next/link";
import type { Permit, Teacher } from "@prisma/client";

type PermitWithTeacher = Permit & { teacher: Teacher };

function rowColour(endDate: Date): string {
  const days = (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (days <= 30) return "bg-red-50";
  if (days <= 90) return "bg-amber-50";
  return "bg-yellow-50";
}

export function UpcomingEvents({
  permits,
}: {
  permits: PermitWithTeacher[];
}) {
  return (
    <div className="overflow-hidden rounded border">
      <div className="bg-[#1a3878] px-4 py-2 text-sm font-semibold text-white">
        Upcoming Expirations (6 months)
      </div>
      {permits.length === 0 && (
        <p className="p-4 text-sm text-slate-400">
          No permits expiring in the next 6 months.
        </p>
      )}
      {permits.map((p) => (
        <div
          key={p.id}
          className={`flex items-center justify-between border-t px-4 py-2 text-sm ${rowColour(new Date(p.endDate))}`}
        >
          <Link
            href={`/teachers/${p.teacherId}`}
            className="font-medium hover:underline"
          >
            {p.teacher.surname}, {p.teacher.name}
          </Link>
          <span className="text-slate-500">
            {p.permitType.replace(/_/g, " ")}
          </span>
          <span>{new Date(p.endDate).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
}
