"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  createTeacher,
  updateTeacher,
  type TeacherInput,
} from "~/server/actions/teachers";
import type { Teacher } from "@prisma/client";

interface Props {
  schoolId: string;
  existing?: Teacher;
}

export function TeacherForm({ schoolId, existing }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);

    const input: TeacherInput = {
      surname: fd.get("surname") as string,
      name: fd.get("name") as string,
      employeeNo: fd.get("employeeNo") as string,
      schoolId,
      department: fd.get("department") as string,
      subject: fd.get("subject") as string,
      countryOfOrigin: fd.get("countryOfOrigin") as string,
      dateOfBirth: new Date(fd.get("dateOfBirth") as string),
      employmentStartDate: new Date(fd.get("employmentStartDate") as string),
      teacherType: fd.get("teacherType") as "EXPAT" | "LOCAL",
      gender: fd.get("gender") as string,
      notes: (fd.get("notes") as string) || undefined,
    };

    try {
      if (existing) {
        await updateTeacher(existing.id, input);
        router.push(`/teachers/${existing.id}`);
      } else {
        const t = await createTeacher(input);
        router.push(`/teachers/${t.id}`);
      }
    } catch {
      setError("Failed to save teacher.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="surname">Surname *</Label>
          <Input
            id="surname"
            name="surname"
            defaultValue={existing?.surname}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={existing?.name}
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="employeeNo">Employee No. *</Label>
        <Input
          id="employeeNo"
          name="employeeNo"
          defaultValue={existing?.employeeNo}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="department">Department *</Label>
          <Input
            id="department"
            name="department"
            defaultValue={existing?.department}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="subject">Subject *</Label>
          <Input
            id="subject"
            name="subject"
            defaultValue={existing?.subject}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="countryOfOrigin">Country of Origin *</Label>
          <Input
            id="countryOfOrigin"
            name="countryOfOrigin"
            defaultValue={existing?.countryOfOrigin}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="gender">Gender *</Label>
          <Input
            id="gender"
            name="gender"
            defaultValue={existing?.gender}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            defaultValue={existing?.dateOfBirth?.toISOString().slice(0, 10)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="employmentStartDate">Employment Start *</Label>
          <Input
            id="employmentStartDate"
            name="employmentStartDate"
            type="date"
            defaultValue={existing?.employmentStartDate
              ?.toISOString()
              .slice(0, 10)}
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Teacher Type *</Label>
        <Select
          name="teacherType"
          defaultValue={existing?.teacherType ?? "EXPAT"}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EXPAT">Expat</SelectItem>
            <SelectItem value="LOCAL">Local (Batswana)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" defaultValue={existing?.notes ?? ""} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : existing ? "Save Changes" : "Add Teacher"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
