import { db } from "~/server/db";

interface LogAuditParams {
  entityType: "teacher" | "permit";
  entityId: string;
  userId: string;
  teacherId?: string;
  permitId?: string;
  action: "created" | "updated" | "deleted";
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
}

export async function logAudit(params: LogAuditParams) {
  await db.auditLog.create({ data: params });
}
