import { redirect } from "next/navigation";

import { JobForm } from "@/components/jobs/JobForm";
import { requireVerifiedPoster } from "@/lib/jobs/auth";
import { listJobTaxonomy, seedDefaultJobCategoriesIfEmpty } from "@/lib/jobs/service";

export const metadata = { title: "Post a job | Dashboard" };

export default async function NewJobPage() {
  const auth = await requireVerifiedPoster();
  if (!auth.ok) redirect("/auth/verify-email");

  await seedDefaultJobCategoriesIfEmpty();
  const taxonomy = await listJobTaxonomy();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Post a job</h1>
      <JobForm mode="create" taxonomy={taxonomy} />
    </div>
  );
}
