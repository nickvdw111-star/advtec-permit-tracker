"use server";
import { revalidatePath } from "next/cache";
import { db } from "~/server/db";
import { auth } from "~/server/auth";

export async function createSchool(name: string, location?: string) {
  const session = await auth();
  if (!session || session.user.role !== "OPS_MANAGER")
    throw new Error("Forbidden");

  const school = await db.school.create({ data: { name, location } });
  revalidatePath("/admin/schools");
  return school;
}
