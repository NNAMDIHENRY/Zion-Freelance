import { notFound, redirect } from "next/navigation";

import { JobForm, type JobFormInitial } from "@/components/jobs/JobForm";
import { requireVerifiedPoster } from "@/lib/jobs/auth";
import { prisma } from "@/lib/db";
import { listJobTaxonomy } from "@/lib/jobs/service";

export const metadata = { title: "Edit job | Dashboard" };

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireVerifiedPoster();
  if (!auth.ok) redirect("/auth/verify-email");

  const { id } = await params;
  const job = await prisma.job.findFirst({
    where: { id, posterId: auth.userId },
    include: { skills: true }
  });
  if (!job) notFound();

  const taxonomy = await listJobTaxonomy();
  const initial: JobFormInitial = {
    id: job.id,
    title: job.title,
    shortDescription: job.shortDescription,
    fullDescription: job.fullDescription,
    categoryId: job.categoryId,
    skillIds: job.skills.map((s) => s.skillId),
    status: job.status,
    workMode: job.workMode,
    employmentType: job.employmentType,
    experienceLevel: job.experienceLevel,
    companyName: job.companyName,
    country: job.country ?? undefined,
    city: job.city ?? undefined
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit job</h1>
      <JobForm mode="edit" taxonomy={taxonomy} initial={initial} />
    </div>
  );
}
