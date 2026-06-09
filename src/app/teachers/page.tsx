import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import { buttonVariants } from "~/components/ui/button";
import { TeacherList } from "~/components/teachers/TeacherList";

export default async function TeachersPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const where =
    session.user.role === "ADMIN" ? { schoolId: session.user.schoolId! } : {};

  const teachers = await db.teacher.findMany({
    where,
    include: { permits: true },
    orderBy: [{ surname: "asc" }, { name: "asc" }],
  });

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teachers</h1>
        {session.user.role === "ADMIN" && (
          <Link href="/teachers/new" className={buttonVariants()}>
            Add Teacher
          </Link>
        )}
      </div>
      <TeacherList teachers={teachers} />
    </main>
  );
}
