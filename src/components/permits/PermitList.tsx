"use client";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { PermitForm } from "~/components/permits/PermitForm";
import type { Permit } from "@prisma/client";

const PERMIT_LABELS: Record<string, string> = {
  PERMISSION_TO_TEACH: "Permission to Teach",
  PERMISSION_TO_WORK: "Permission to Work",
  WORK_PERMIT: "Work Permit",
};

function expiryColour(endDate: Date): string {
  const days = (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (days < 0) return "text-red-600 font-medium";
  if (days <= 30) return "text-red-500";
  if (days <= 90) return "text-amber-500";
  if (days <= 180) return "text-yellow-600";
  return "text-green-600";
}

interface Props {
  teacherId: string;
  permits: Permit[];
  canEdit: boolean;
}

export function PermitList({ teacherId, permits, canEdit }: Props) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {permits.map((p) => (
        <div key={p.id} className="space-y-2 rounded border p-4">
          {editing === p.id ? (
            <PermitForm
              teacherId={teacherId}
              existing={p}
              onDone={() => setEditing(null)}
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {PERMIT_LABELS[p.permitType]}
                </span>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(p.id)}
                  >
                    Edit
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span>Start: {new Date(p.startDate).toLocaleDateString()}</span>
                <span className={expiryColour(new Date(p.endDate))}>
                  Expires: {new Date(p.endDate).toLocaleDateString()}
                </span>
                {p.workflowStatus !== "NONE" && (
                  <Badge variant="outline">
                    {p.workflowStatus.replace("_", " ")}
                  </Badge>
                )}
                {p.nextSteps && (
                  <span className="col-span-2 text-slate-600">
                    Next: {p.nextSteps}
                    {p.nextStepsComplete ? " ✓" : ""}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      ))}

      {canEdit && !adding && (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          Add Permit
        </Button>
      )}
      {adding && (
        <PermitForm teacherId={teacherId} onDone={() => setAdding(false)} />
      )}
    </div>
  );
}
