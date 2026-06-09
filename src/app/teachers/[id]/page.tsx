import { notFound, redirect } from "next/navigation";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import { calculateTeacherStatus, getStatusReason } from "~/lib/status";
import { StatusBadge } from "~/components/teachers/StatusBadge";
import { TeacherForm } from "~/components/teachers/TeacherForm";
import { PermitList } from "~/components/permits/PermitList";
import { AuditLog } from "~/components/audit/AuditLog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const teacher = await db.teacher.findUnique({
    where: { id },
    include: {
      permits: true,
      auditLogs: {
        include: { user: true },
        orderBy: { timestamp: "desc" },
      },
    },
  });

  if (!teacher) notFound();

  if (
    session.user.role === "ADMIN" &&
    teacher.schoolId !== session.user.schoolId
  ) {
    redirect("/teachers");
  }

  const status = calculateTeacherStatus(teacher.teacherType, teacher.permits);
  const reason = getStatusReason(teacher.teacherType, teacher.permits);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {teacher.surname}, {teacher.name}
          </h1>
          <p className="text-slate-500">
            {teacher.employeeNo} · {teacher.subject}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={status} />
          {reason && (
            <p className="max-w-[220px] text-right text-xs text-slate-500">
              {reason}
            </p>
          )}
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="permits">
            Permits ({teacher.permits.length})
          </TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          {session.user.role === "ADMIN" ? (
            <TeacherForm schoolId={teacher.schoolId} existing={teacher} />
          ) : (
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Country of Origin</dt>
                <dd>{teacher.countryOfOrigin}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Teacher Type</dt>
                <dd>{teacher.teacherType}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Department</dt>
                <dd>{teacher.department}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Gender</dt>
                <dd>{teacher.gender}</dd>
              </div>
            </dl>
          )}
        </TabsContent>

        <TabsContent value="permits" className="mt-4">
          <PermitList
            teacherId={teacher.id}
            permits={teacher.permits}
            canEdit={session.user.role === "ADMIN"}
          />
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <AuditLog entries={teacher.auditLogs} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
