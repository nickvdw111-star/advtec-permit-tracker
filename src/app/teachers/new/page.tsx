import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { TeacherForm } from "~/components/teachers/TeacherForm";

export default async function NewTeacherPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Add Teacher</h1>
      <TeacherForm schoolId={session.user.schoolId!} />
    </main>
  );
}
