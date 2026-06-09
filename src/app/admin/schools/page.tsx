import { redirect } from "next/navigation";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import { createSchool } from "~/server/actions/schools";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default async function SchoolsPage() {
  const session = await auth();
  if (!session || session.user.role !== "OPS_MANAGER") redirect("/dashboard");

  const schools = await db.school.findMany({
    include: { _count: { select: { teachers: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Schools</h1>
      <ul className="mb-8 space-y-2">
        {schools.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between rounded border px-4 py-2"
          >
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-slate-500">{s.location}</p>
            </div>
            <span className="text-sm text-slate-400">
              {s._count.teachers} teachers
            </span>
          </li>
        ))}
      </ul>
      <form
        action={async (fd: FormData) => {
          "use server";
          await createSchool(
            fd.get("name") as string,
            (fd.get("location") as string) || undefined,
          );
        }}
        className="space-y-3 rounded border p-4"
      >
        <h2 className="font-semibold">Add School</h2>
        <div className="space-y-1">
          <Label htmlFor="name">School Name *</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" />
        </div>
        <Button type="submit">Add School</Button>
      </form>
    </main>
  );
}
