"use server";
import { revalidatePath } from "next/cache";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import { logAudit } from "~/lib/audit";
import type { PermitType, WorkflowStatus } from "@prisma/client";

export interface PermitInput {
  teacherId: string;
  permitType: PermitType;
  startDate: Date;
  endDate: Date;
  workflowStatus?: WorkflowStatus;
  submittedToAgentDate?: Date;
  submittedToGovtDate?: Date;
  comments?: string;
  nextSteps?: string;
  nextStepsComplete?: boolean;
}

export async function createPermit(input: PermitInput) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") throw new Error("Forbidden");

  const permit = await db.permit.create({ data: input });

  await logAudit({
    entityType: "permit",
    entityId: permit.id,
    userId: session.user.id,
    teacherId: input.teacherId,
    permitId: permit.id,
    action: "created",
  });

  revalidatePath(`/teachers/${input.teacherId}`);
  return permit;
}

export async function updatePermit(id: string, input: Partial<PermitInput>) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") throw new Error("Forbidden");

  const before = await db.permit.findUniqueOrThrow({ where: { id } });

  const permit = await db.permit.update({ where: { id }, data: input });

  const changed = (Object.keys(input) as (keyof typeof input)[]).filter(
    (k) =>
      String(before[k as keyof typeof before]) !== String(input[k]),
  );

  for (const field of changed) {
    await logAudit({
      entityType: "permit",
      entityId: id,
      userId: session.user.id,
      teacherId: before.teacherId,
      permitId: id,
      action: "updated",
      fieldChanged: field,
      oldValue: String(before[field as keyof typeof before] ?? ""),
      newValue: String(input[field] ?? ""),
    });
  }

  revalidatePath(`/teachers/${before.teacherId}`);
  return permit;
}
