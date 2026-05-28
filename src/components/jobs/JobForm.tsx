"use client";

import {
  EmploymentType,
  ExperienceLevel,
  JobStatus,
  SalaryType,
  WorkMode
} from "@prisma/client";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { SkillMultiSelect } from "@/components/projects/SkillMultiSelect";
import type { TaxonomyOption } from "@/components/projects/project-types";
import { CountrySelect } from "@/components/forms/CountrySelect";
import { FormTextArea, FormTextInput } from "@/components/dashboard/ui/Form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createJob, updateJob } from "@/lib/jobs/actions";

type Taxonomy = {
  categories: TaxonomyOption[];
  skills: TaxonomyOption[];
};

export type JobFormInitial = {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  categoryId: string;
  skillIds: string[];
  status: JobStatus;
  workMode: WorkMode;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  companyName: string;
  country?: string;
  city?: string;
};

export function JobForm({
  mode,
  taxonomy,
  initial
}: {
  mode: "create" | "edit";
  taxonomy: Taxonomy;
  initial?: JobFormInitial;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [skillIds, setSkillIds] = React.useState<string[]>(initial?.skillIds ?? []);
  const [country, setCountry] = React.useState(initial?.country ?? "");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: String(fd.get("title") ?? ""),
      shortDescription: String(fd.get("shortDescription") ?? ""),
      fullDescription: String(fd.get("fullDescription") ?? ""),
      categoryId: String(fd.get("categoryId") ?? ""),
      skillIds,
      status: String(fd.get("status") ?? JobStatus.DRAFT) as JobStatus,
      workMode: String(fd.get("workMode") ?? WorkMode.REMOTE) as WorkMode,
      employmentType: String(fd.get("employmentType") ?? EmploymentType.FULL_TIME) as EmploymentType,
      experienceLevel: String(fd.get("experienceLevel") ?? ExperienceLevel.MID) as ExperienceLevel,
      companyName: String(fd.get("companyName") ?? ""),
      country: country || undefined,
      city: String(fd.get("city") ?? "") || undefined,
      salaryMin: String(fd.get("salaryMin") ?? "") || undefined,
      salaryMax: String(fd.get("salaryMax") ?? "") || undefined,
      salaryType: (fd.get("salaryType") as SalaryType) || undefined,
      applicationDeadline: String(fd.get("applicationDeadline") ?? "") || undefined
    };

    const r =
      mode === "create"
        ? await createJob(payload)
        : await updateJob(initial!.id, payload);

    setPending(false);
    if (!r.ok) {
      if (r.fieldErrors) setFieldErrors(r.fieldErrors);
      toast.error(r.error);
      return;
    }
    toast.success(mode === "create" ? "Job created" : "Job updated");
    router.push("/dashboard/jobs");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-8">
      <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="text-lg font-semibold">Job details</h2>
        <FormTextInput
          name="title"
          label="Job title"
          required
          defaultValue={initial?.title}
          error={fieldErrors.title?.[0]}
        />
        <FormTextInput
          name="shortDescription"
          label="Short description"
          required
          defaultValue={initial?.shortDescription}
        />
        <FormTextArea
          name="fullDescription"
          label="Full description"
          required
          rows={8}
          defaultValue={initial?.fullDescription}
        />
        <div className="space-y-2">
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            name="categoryId"
            required
            defaultValue={initial?.categoryId}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select category</option>
            {taxonomy.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <SkillMultiSelect
          options={taxonomy.skills}
          value={skillIds}
          onChange={setSkillIds}
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="text-lg font-semibold">Company & location</h2>
        <FormTextInput name="companyName" label="Company name" required defaultValue={initial?.companyName} />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="workMode">Work mode</Label>
            <select
              id="workMode"
              name="workMode"
              defaultValue={initial?.workMode ?? WorkMode.REMOTE}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {Object.values(WorkMode).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <CountrySelect
            name="country"
            value={country}
            onChange={setCountry}
            error={fieldErrors.country?.[0]}
          />
          <FormTextInput
            name="city"
            label="City"
            defaultValue={initial?.city}
            error={fieldErrors.city?.[0]}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="employmentType">Employment type</Label>
            <select
              id="employmentType"
              name="employmentType"
              defaultValue={initial?.employmentType ?? EmploymentType.FULL_TIME}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {Object.values(EmploymentType).map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="experienceLevel">Experience level</Label>
            <select
              id="experienceLevel"
              name="experienceLevel"
              defaultValue={initial?.experienceLevel ?? ExperienceLevel.MID}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {Object.values(ExperienceLevel).map((l) => (
                <option key={l} value={l}>
                  {l.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="text-lg font-semibold">Compensation</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormTextInput name="salaryMin" label="Salary min" />
          <FormTextInput name="salaryMax" label="Salary max" />
          <div className="space-y-2">
            <Label htmlFor="salaryType">Salary type</Label>
            <select
              id="salaryType"
              name="salaryType"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {Object.values(SalaryType).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <FormTextInput name="applicationDeadline" label="Application deadline" type="datetime-local" />
      </section>

      <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="text-lg font-semibold">Publishing</h2>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={initial?.status ?? JobStatus.DRAFT}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {[JobStatus.DRAFT, JobStatus.PENDING, JobStatus.ACTIVE].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Active jobs require admin approval before appearing publicly.
          </p>
        </div>
      </section>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : mode === "create" ? "Create job" : "Save changes"}
      </Button>
    </form>
  );
}
