"use client";

import * as React from "react";
import { toast } from "sonner";

import { FormTextArea, FormTextInput } from "@/components/dashboard/ui/Form";
import { Button } from "@/components/ui/button";
import { submitJobApplication } from "@/lib/jobs/actions";

export function JobApplicationForm({
  jobId,
  defaultName,
  defaultEmail
}: {
  jobId: string;
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [pending, setPending] = React.useState(false);
  const [applicationId, setApplicationId] = React.useState<string | null>(null);
  const [cvFile, setCvFile] = React.useState<File | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const r = await submitJobApplication({
      jobId,
      fullName: String(fd.get("fullName") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? "") || undefined,
      coverLetter: String(fd.get("coverLetter") ?? ""),
      portfolioUrl: String(fd.get("portfolioUrl") ?? "") || undefined,
      linkedInUrl: String(fd.get("linkedInUrl") ?? "") || undefined,
      githubUrl: String(fd.get("githubUrl") ?? "") || undefined,
      yearsExperience: fd.get("yearsExperience")
        ? Number(fd.get("yearsExperience"))
        : undefined,
      availability: String(fd.get("availability") ?? "") || undefined,
      expectedSalary: String(fd.get("expectedSalary") ?? "") || undefined
    });
    setPending(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    setApplicationId(r.applicationId);
    if (cvFile) {
      const uploadFd = new FormData();
      uploadFd.append("file", cvFile);
      uploadFd.append("purpose", "cv");
      const up = await fetch(`/api/job-applications/${r.applicationId}/attachments`, {
        method: "POST",
        body: uploadFd
      });
      if (!up.ok) toast.error("Application submitted but CV upload failed");
    }
    toast.success("Application submitted");
  }

  if (applicationId) {
    return (
      <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-800 dark:text-emerald-300">
        Your application was submitted. Track status in your dashboard.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormTextInput name="fullName" label="Full name" required defaultValue={defaultName} />
      <FormTextInput name="email" label="Email" type="email" required defaultValue={defaultEmail} />
      <FormTextInput name="phone" label="Phone" />
      <FormTextArea name="coverLetter" label="Cover letter (>50 Chars)" required rows={6} />
      <FormTextInput name="portfolioUrl" label="Portfolio URL" type="url" />
      <FormTextInput name="linkedInUrl" label="LinkedIn URL" type="url" />
      <FormTextInput name="githubUrl" label="GitHub URL" type="url" />
      <FormTextInput name="yearsExperience" label="Years of experience" type="number" min={0} />
      <FormTextInput name="availability" label="Availability" />
      <FormTextInput name="expectedSalary" label="Expected salary" />
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="cv">
          CV / Resume (PDF, DOC, DOCX)
        </label>
        <input
          id="cv"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm"
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Submitting…" : "Submit application"}
      </Button>
    </form>
  );
}
