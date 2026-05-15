"use client";

import { ProjectStatus } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { FormTextArea, FormTextInput } from "@/components/dashboard/ui/Form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createProject, removeProjectAttachment, updateProject } from "@/lib/projects/actions";
import { statusLabel } from "@/lib/projects/formatting";
import { cn } from "@/lib/utils";

import { SkillMultiSelect } from "./SkillMultiSelect";
import type { ProjectFormInitial, TaxonomyOption } from "./project-types";
import type { ProjectWritePayload } from "@/lib/validators/project";

const STATUS_OPTIONS: ProjectStatus[] = [
  ProjectStatus.DRAFT,
  ProjectStatus.OPEN,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.COMPLETED,
  ProjectStatus.CANCELLED
];

type ProjectFormProps = {
  mode: "create" | "edit";
  categories: TaxonomyOption[];
  skills: TaxonomyOption[];
  initial?: ProjectFormInitial;
};

export function ProjectForm({ mode, categories, skills, initial }: ProjectFormProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const [skillIds, setSkillIds] = React.useState<string[]>(initial?.skillIds ?? []);
  const [budgetIsRange, setBudgetIsRange] = React.useState(initial?.budgetIsRange ?? false);
  const [pickedFiles, setPickedFiles] = React.useState<File[]>([]);
  const [localAttachments, setLocalAttachments] = React.useState(initial?.attachments ?? []);

  async function uploadNewFiles(projectId: string) {
    if (pickedFiles.length === 0) return;
    const fd = new FormData();
    for (const f of pickedFiles) fd.append("files", f);
    const res = await fetch(`/api/projects/${projectId}/attachments`, { method: "POST", body: fd });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(typeof j.error === "string" ? j.error : "Upload failed");
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setFormError(null);
    setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const categoryId = String(fd.get("categoryId") ?? "").trim();
    const budgetMin = String(fd.get("budgetMin") ?? "").trim();
    const budgetMax = String(fd.get("budgetMax") ?? "").trim();
    const deadline = String(fd.get("deadline") ?? "").trim();
    const status = String(fd.get("status") ?? "") as ProjectStatus;

    const payload: ProjectWritePayload = {
      title,
      description,
      categoryId,
      skillIds,
      budgetMin,
      budgetIsRange,
      deadline: deadline || undefined,
      status,
      ...(budgetIsRange ? { budgetMax } : {})
    };

    try {
      if (mode === "create") {
        const r = await createProject(payload);
        if (!r.ok) {
          setFormError(r.error);
          if (r.fieldErrors) {
            const flat: Record<string, string> = {};
            for (const [k, v] of Object.entries(r.fieldErrors)) flat[k] = v[0] ?? "";
            setFieldErrors(flat);
          }
          return;
        }
        await uploadNewFiles(r.id);
        router.push(`/dashboard/projects/${r.id}`);
        router.refresh();
        return;
      }
      if (!initial?.id) return;
      const u = await updateProject(initial.id, payload);
      if (!u.ok) {
        setFormError(u.error);
        if (u.fieldErrors) {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(u.fieldErrors)) flat[k] = v[0] ?? "";
          setFieldErrors(flat);
        }
        return;
      }
      await uploadNewFiles(initial.id);
      setPickedFiles([]);
      router.refresh();
      router.push(`/dashboard/projects/${initial.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files;
    if (!f?.length) return;
    setPickedFiles((prev) => [...prev, ...Array.from(f)]);
    e.target.value = "";
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {formError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-subtle lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Basics</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormTextInput
                name="title"
                label="Title"
                defaultValue={initial?.title}
                required
                error={fieldErrors.title}
              />
            </div>
            <div className="sm:col-span-2">
              <FormTextArea
                name="description"
                label="Description"
                defaultValue={initial?.description}
                required
                error={fieldErrors.description}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Category</Label>
              <select
                name="categoryId"
                defaultValue={initial?.categoryId ?? ""}
                className={cn(
                  "mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
                required
              >
                <option value="" disabled>
                  Select category
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldErrors.categoryId ? (
                <p className="mt-2 text-xs font-medium text-destructive">{fieldErrors.categoryId}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="status" className="text-sm font-medium">
                Status
              </Label>
              <select
                id="status"
                name="status"
                defaultValue={initial?.status ?? ProjectStatus.DRAFT}
                className={cn(
                  "mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
                {initial?.status === ProjectStatus.CLOSED ? (
                  <option value={ProjectStatus.CLOSED}>{statusLabel(ProjectStatus.CLOSED)}</option>
                ) : null}
              </select>
              {fieldErrors.status ? (
                <p className="mt-2 text-xs font-medium text-destructive">{fieldErrors.status}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Scope</h2>
          <SkillMultiSelect
            options={skills}
            value={skillIds}
            onChange={setSkillIds}
            error={fieldErrors.skillIds}
          />
        </div>

        <div className="space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Budget & time</h2>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={budgetIsRange}
              onChange={(e) => setBudgetIsRange(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <span>Budget is a range (min / max)</span>
          </label>
          <FormTextInput
            name="budgetMin"
            label={budgetIsRange ? "Minimum budget" : "Budget"}
            defaultValue={initial?.budgetMin}
            required
            error={fieldErrors.budgetMin}
            inputMode="decimal"
          />
          {budgetIsRange ? (
            <FormTextInput
              name="budgetMax"
              label="Maximum budget"
              defaultValue={initial?.budgetMax ?? ""}
              required
              error={fieldErrors.budgetMax}
              inputMode="decimal"
            />
          ) : null}
          <div>
            <Label htmlFor="deadline" className="text-sm font-medium">
              Deadline
            </Label>
            <input
              id="deadline"
              name="deadline"
              type="date"
              defaultValue={initial?.deadline ?? ""}
              className={cn(
                "mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            />
            {fieldErrors.deadline ? (
              <p className="mt-2 text-xs font-medium text-destructive">{fieldErrors.deadline}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Optional milestone date.</p>
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-subtle lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Attachments</h2>
          <div>
            <Label htmlFor="files" className="text-sm font-medium">
              Add files
            </Label>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
              Stores metadata only (name, size, MIME type); binary storage is wired later.
            </p>
            <input id="files" type="file" multiple className="mt-3 block text-sm" onChange={onFilesChange} />
          </div>
          {pickedFiles.length ? (
            <ul className="divide-y divide-border/60 rounded-xl border border-border/60">
              {pickedFiles.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="min-w-0 truncate">{f.name}</span>
                  <button
                    type="button"
                    className="shrink-0 text-xs text-destructive"
                    onClick={() => setPickedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {localAttachments.length ? (
            <ul className="divide-y divide-border/60 rounded-xl border border-border/60">
              {localAttachments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="min-w-0 truncate">{a.originalName}</span>
                  <button
                    type="button"
                    className="shrink-0 text-xs text-destructive disabled:opacity-50"
                    disabled={pending || mode === "create"}
                    onClick={async () => {
                      if (!initial?.id) return;
                      setPending(true);
                      const r = await removeProjectAttachment(initial.id, a.id);
                      setPending(false);
                      if (!r.ok) setFormError(r.error);
                      else setLocalAttachments((prev) => prev.filter((x) => x.id !== a.id));
                    }}
                  >
                    Detach
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || skillIds.length === 0}>
          {pending ? "Saving…" : mode === "create" ? "Create project" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link
            href={mode === "edit" && initial?.id ? `/dashboard/projects/${initial.id}` : "/dashboard/projects"}
          >
            Cancel
          </Link>
        </Button>
      </div>
    </form>
  );
}
