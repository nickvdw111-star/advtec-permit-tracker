import type { Permit, TeacherType } from "@prisma/client";

const PERMIT_LABELS: Record<string, string> = {
  PERMISSION_TO_TEACH: "Permission to Teach",
  PERMISSION_TO_WORK: "Permission to Work",
  WORK_PERMIT: "Work Permit",
};

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

export function getStatusReason(
  teacherType: TeacherType,
  permits: Permit[],
): string | null {
  if (teacherType === "LOCAL") return null;

  if (permits.length === 0)
    return "No permits on file — add permits in the Permits tab.";

  const now = new Date();

  const expired = permits.filter(
    (p) => p.workflowStatus === "NONE" && p.endDate < now,
  );
  if (expired.length > 0)
    return `Expired: ${expired.map((p) => PERMIT_LABELS[p.permitType]).join(", ")}.`;

  const inAppeal = permits.filter((p) => p.workflowStatus === "IN_APPEAL");
  if (inAppeal.length > 0)
    return `Appeal in progress: ${inAppeal.map((p) => PERMIT_LABELS[p.permitType]).join(", ")}.`;

  const needsAction = permits.filter((p) => p.nextSteps && !p.nextStepsComplete);
  if (needsAction.length > 0)
    return needsAction
      .map((p) => `${PERMIT_LABELS[p.permitType]}: ${p.nextSteps}`)
      .join(" · ");

  const atRisk = permits.filter(
    (p) =>
      p.endDate >= now &&
      p.endDate.getTime() - now.getTime() <= SIX_MONTHS_MS,
  );
  if (atRisk.length > 0)
    return `Expiring soon: ${atRisk.map((p) => PERMIT_LABELS[p.permitType]).join(", ")}.`;

  const inProgress = permits.filter((p) => p.workflowStatus === "IN_PROGRESS");
  if (inProgress.length > 0)
    return `Awaiting outcome: ${inProgress.map((p) => PERMIT_LABELS[p.permitType]).join(", ")}.`;

  return null;
}
