import type { Permit, TeacherType } from "@prisma/client";

export type ComplianceStatus =
  | "COMPLIANT"
  | "AT_RISK"
  | "ACTION_REQUIRED"
  | "IN_PROGRESS"
  | "IN_APPEAL"
  | "EXPIRED"
  | "EXEMPT";

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

function getPermitEffectiveStatus(permit: Permit) {
  if (permit.workflowStatus === "IN_APPEAL") return "IN_APPEAL";
  if (permit.workflowStatus === "IN_PROGRESS") return "IN_PROGRESS";

  const now = new Date();
  if (permit.endDate < now) return "EXPIRED";
  if (permit.endDate.getTime() - now.getTime() <= SIX_MONTHS_MS) return "AT_RISK";
  if (permit.nextSteps && !permit.nextStepsComplete) return "ACTION_REQUIRED";

  return "VALID";
}

const PRIORITY: ComplianceStatus[] = [
  "EXPIRED", "IN_APPEAL", "ACTION_REQUIRED", "AT_RISK", "IN_PROGRESS",
];

export function calculateTeacherStatus(
  teacherType: TeacherType,
  permits: Permit[]
): ComplianceStatus {
  if (teacherType === "LOCAL") return "EXEMPT";
  if (permits.length === 0) return "ACTION_REQUIRED";

  const statuses = permits.map(getPermitEffectiveStatus);

  for (const status of PRIORITY) {
    if ((statuses as string[]).includes(status)) return status;
  }

  return "COMPLIANT";
}
