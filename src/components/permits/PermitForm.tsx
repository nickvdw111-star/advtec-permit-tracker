"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  createPermit,
  updatePermit,
  type PermitInput,
} from "~/server/actions/permits";
import type { Permit } from "@prisma/client";

interface Props {
  teacherId: string;
  existing?: Permit;
  onDone: () => void;
}

function normalizeNextSteps(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "none") return undefined;
  return trimmed;
}

export function PermitForm({ teacherId, existing, onDone }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    const input: PermitInput = {
      teacherId,
      permitType: fd.get("permitType") as PermitInput["permitType"],
      startDate: new Date(fd.get("startDate") as string),
      endDate: new Date(fd.get("endDate") as string),
      workflowStatus:
        (fd.get("workflowStatus") as PermitInput["workflowStatus"]) ?? "NONE",
      comments: (fd.get("comments") as string) || undefined,
      nextSteps: normalizeNextSteps(fd.get("nextSteps") as string),
      nextStepsComplete: fd.get("nextStepsComplete") === "true",
    };

    if (existing) {
      await updatePermit(existing.id, input);
    } else {
      await createPermit(input);
    }

    setLoading(false);
    router.refresh();
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border p-4">
      <div className="space-y-1">
        <Label>Permit Type *</Label>
        <Select
          name="permitType"
          defaultValue={existing?.permitType ?? "PERMISSION_TO_TEACH"}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PERMISSION_TO_TEACH">
              Permission to Teach
            </SelectItem>
            <SelectItem value="PERMISSION_TO_WORK">
              Permission to Work
            </SelectItem>
            <SelectItem value="WORK_PERMIT">Work Permit</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Start Date *</Label>
          <Input
            name="startDate"
            type="date"
            defaultValue={existing?.startDate?.toISOString().slice(0, 10)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label>End Date *</Label>
          <Input
            name="endDate"
            type="date"
            defaultValue={existing?.endDate?.toISOString().slice(0, 10)}
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Workflow Status</Label>
        <Select
          name="workflowStatus"
          defaultValue={existing?.workflowStatus ?? "NONE"}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">None</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="IN_APPEAL">In Appeal</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Next Steps</Label>
        <Input
          name="nextSteps"
          defaultValue={existing?.nextSteps ?? ""}
          placeholder="Leave blank if no action needed"
        />
      </div>
      <div className="space-y-1">
        <Label>Next Steps Complete</Label>
        <Select
          name="nextStepsComplete"
          defaultValue={existing?.nextStepsComplete ? "true" : "false"}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="false">No</SelectItem>
            <SelectItem value="true">Yes</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading} size="sm">
          {loading ? "Saving…" : existing ? "Update" : "Add Permit"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
