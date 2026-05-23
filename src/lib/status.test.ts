import { describe, it, expect } from "vitest";
import { calculateTeacherStatus } from "./status";
import type { Permit } from "@prisma/client";

function makePermit(overrides: Partial<Permit> = {}): Permit {
  const future = new Date();
  future.setFullYear(future.getFullYear() + 2);
  return {
    id: "p1",
    teacherId: "t1",
    permitType: "PERMISSION_TO_TEACH",
    startDate: new Date("2024-01-01"),
    endDate: future,
    workflowStatus: "NONE",
    submittedToAgentDate: null,
    submittedToGovtDate: null,
    comments: null,
    nextSteps: null,
    nextStepsComplete: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("calculateTeacherStatus", () => {
  it("returns EXEMPT for LOCAL teacher with permits", () => {
    expect(calculateTeacherStatus("LOCAL", [makePermit()])).toBe("EXEMPT");
  });

  it("returns EXEMPT for LOCAL teacher with no permits", () => {
    expect(calculateTeacherStatus("LOCAL", [])).toBe("EXEMPT");
  });

  it("returns ACTION_REQUIRED for EXPAT with no permits", () => {
    expect(calculateTeacherStatus("EXPAT", [])).toBe("ACTION_REQUIRED");
  });

  it("returns COMPLIANT when all permits valid >6 months", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 2);
    expect(calculateTeacherStatus("EXPAT", [makePermit({ endDate: future })])).toBe("COMPLIANT");
  });

  it("returns AT_RISK when a permit expires within 6 months", () => {
    const soon = new Date();
    soon.setMonth(soon.getMonth() + 3);
    expect(calculateTeacherStatus("EXPAT", [makePermit({ endDate: soon })])).toBe("AT_RISK");
  });

  it("returns EXPIRED when a permit has lapsed", () => {
    expect(calculateTeacherStatus("EXPAT", [makePermit({ endDate: new Date("2020-01-01") })])).toBe("EXPIRED");
  });

  it("returns IN_APPEAL when workflowStatus is IN_APPEAL", () => {
    expect(calculateTeacherStatus("EXPAT", [makePermit({ workflowStatus: "IN_APPEAL" })])).toBe("IN_APPEAL");
  });

  it("returns IN_PROGRESS when workflowStatus is IN_PROGRESS", () => {
    expect(calculateTeacherStatus("EXPAT", [makePermit({ workflowStatus: "IN_PROGRESS" })])).toBe("IN_PROGRESS");
  });

  it("returns ACTION_REQUIRED for incomplete next steps on a valid permit", () => {
    expect(
      calculateTeacherStatus("EXPAT", [makePermit({ nextSteps: "Submit renewal", nextStepsComplete: false })])
    ).toBe("ACTION_REQUIRED");
  });

  it("ignores completed next steps", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 2);
    expect(
      calculateTeacherStatus("EXPAT", [makePermit({ nextSteps: "Done", nextStepsComplete: true, endDate: future })])
    ).toBe("COMPLIANT");
  });

  it("EXPIRED beats IN_APPEAL (priority rule)", () => {
    expect(
      calculateTeacherStatus("EXPAT", [
        makePermit({ endDate: new Date("2020-01-01") }),
        makePermit({ workflowStatus: "IN_APPEAL" }),
      ])
    ).toBe("EXPIRED");
  });

  it("IN_APPEAL beats AT_RISK (priority rule)", () => {
    const soon = new Date();
    soon.setMonth(soon.getMonth() + 2);
    expect(
      calculateTeacherStatus("EXPAT", [
        makePermit({ endDate: soon }),
        makePermit({ workflowStatus: "IN_APPEAL" }),
      ])
    ).toBe("IN_APPEAL");
  });
});
