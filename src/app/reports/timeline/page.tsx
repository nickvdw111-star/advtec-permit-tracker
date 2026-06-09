import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import {
  PermitTimeline,
  type TimelineDot,
} from "~/components/reports/PermitTimeline";

const MS_PER_DAY = 86_400_000;

// Show permits from 30 days ago through 18 months ahead
const START = new Date(Date.now() - 30 * MS_PER_DAY);
const END   = new Date(Date.now() + 548 * MS_PER_DAY);

export default async function TimelinePage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const teacherWhere =
    session.user.role === "ADMIN" ? { schoolId: session.user.schoolId! } : {};

  const permits = await db.permit.findMany({
    where: {
      endDate: { gte: START, lte: END },
      teacher: teacherWhere,
    },
    include: { teacher: true },
    orderBy: { endDate: "asc" },
  });

  // Also include already-expired permits (endDate < START) so nothing is hidden
  const expiredPermits = await db.permit.findMany({
    where: {
      endDate: { lt: START },
      teacher: teacherWhere,
    },
    include: { teacher: true },
    orderBy: { endDate: "asc" },
  });

  const now = Date.now();

  function toDot(p: (typeof permits)[number]): TimelineDot {
    const daysUntil = Math.round((new Date(p.endDate).getTime() - now) / MS_PER_DAY);
    return {
      teacherId: p.teacherId,
      teacherName: `${p.teacher.surname}, ${p.teacher.name}`,
      permitType: p.permitType as TimelineDot["permitType"],
      endDateLabel: new Date(p.endDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      daysUntil,
    };
  }

  const dots: TimelineDot[] = [
    ...expiredPermits.map(toDot),
    ...permits.map(toDot),
  ];

  const total    = dots.length;
  const expired  = dots.filter((d) => d.daysUntil < 0).length;
  const critical = dots.filter((d) => d.daysUntil >= 0 && d.daysUntil <= 90).length;
  const upcoming = dots.filter((d) => d.daysUntil > 90).length;

  return (
    <main className="mx-auto max-w-[1200px] space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a3878]">Permit Timeline</h1>
        <p className="mt-1 text-sm text-slate-500">
          Hover a dot to see teacher details · click to open their profile
        </p>
      </div>

      {/* Summary strip */}
      <div className="flex gap-6 rounded border bg-white px-6 py-4 text-sm">
        <div>
          <span className="text-slate-500">Showing</span>{" "}
          <span className="font-semibold text-[#1a3878]">{total}</span>{" "}
          <span className="text-slate-500">permits</span>
        </div>
        <div className="h-4 w-px self-center bg-slate-200" />
        <div>
          <span className="font-semibold text-red-600">{expired}</span>{" "}
          <span className="text-slate-500">expired</span>
        </div>
        <div className="h-4 w-px self-center bg-slate-200" />
        <div>
          <span className="font-semibold text-amber-600">{critical}</span>{" "}
          <span className="text-slate-500">expiring within 90 days</span>
        </div>
        <div className="h-4 w-px self-center bg-slate-200" />
        <div>
          <span className="font-semibold text-[#1a3878]">{upcoming}</span>{" "}
          <span className="text-slate-500">upcoming</span>
        </div>
      </div>

      <PermitTimeline dots={dots} />
    </main>
  );
}
