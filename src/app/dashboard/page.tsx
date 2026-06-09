import { redirect } from "next/navigation";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import { calculateTeacherStatus, type ComplianceStatus } from "~/lib/status";
import { RiskTiles } from "~/components/dashboard/RiskTiles";
import { UpcomingEvents } from "~/components/dashboard/UpcomingEvents";
import { ActionQueue } from "~/components/dashboard/ActionQueue";
import { SchoolBreakdown } from "~/components/dashboard/SchoolBreakdown";

const SIX_MONTHS = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000);

const QUEUE_STATUSES: ComplianceStatus[] = [
  "EXPIRED",
  "IN_APPEAL",
  "ACTION_REQUIRED",
];
const STATUS_SEVERITY: Record<string, number> = {
  EXPIRED: 0,
  IN_APPEAL: 1,
  ACTION_REQUIRED: 2,
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const where =
    session.user.role === "ADMIN" ? { schoolId: session.user.schoolId! } : {};

  const teachers = await db.teacher.findMany({
    where,
    include: { permits: true },
  });

  const counts: Record<ComplianceStatus, number> = {
    COMPLIANT: 0,
    AT_RISK: 0,
    ACTION_REQUIRED: 0,
    IN_PROGRESS: 0,
    IN_APPEAL: 0,
    EXPIRED: 0,
    EXEMPT: 0,
  };

  const teachersWithStatus = teachers.map((t) => {
    const status = calculateTeacherStatus(t.teacherType, t.permits);
    counts[status]++;
    return { ...t, status };
  });

  const expat = teachers.filter((t) => t.teacherType === "EXPAT").length;
  const local = teachers.length - expat;

  const upcomingPermits = await db.permit.findMany({
    where: {
      endDate: { lte: SIX_MONTHS, gte: new Date() },
      teacher: where,
    },
    include: { teacher: true },
    orderBy: { endDate: "asc" },
  });

  const actionQueue = teachersWithStatus
    .filter((t) => QUEUE_STATUSES.includes(t.status))
    .sort(
      (a, b) =>
        (STATUS_SEVERITY[a.status] ?? 99) - (STATUS_SEVERITY[b.status] ?? 99),
    );

  const isOpsManager = session.user.role === "OPS_MANAGER";
  let schoolRows: {
    id: string;
    name: string;
    totalExpat: number;
    compliant: number;
    atRisk: number;
    expired: number;
  }[] = [];

  if (isOpsManager) {
    const schools = await db.school.findMany({
      include: { teachers: { include: { permits: true } } },
    });
    schoolRows = schools.map((s) => {
      const statuses = s.teachers.map((t) =>
        calculateTeacherStatus(t.teacherType, t.permits),
      );
      return {
        id: s.id,
        name: s.name,
        totalExpat: s.teachers.filter((t) => t.teacherType === "EXPAT").length,
        compliant: statuses.filter((st) => st === "COMPLIANT").length,
        atRisk: statuses.filter((st) => st === "AT_RISK").length,
        expired: statuses.filter((st) => st === "EXPIRED").length,
      };
    });
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6">
      <h1 className="text-2xl font-bold">Compliance Dashboard</h1>
      <RiskTiles
        total={teachers.length}
        expat={expat}
        local={local}
        counts={counts}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UpcomingEvents permits={upcomingPermits} />
        <ActionQueue entries={actionQueue} />
      </div>
      {isOpsManager && <SchoolBreakdown rows={schoolRows} />}
    </main>
  );
}
