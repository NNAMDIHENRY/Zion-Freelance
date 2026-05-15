import Link from "next/link";

import { ProjectForm } from "@/components/projects/ProjectForm";
import { getSession } from "@/lib/auth/session";
import { listTaxonomyOptions } from "@/lib/projects/service";

export default async function NewProjectPage() {
  const session = await getSession();
  if (!session?.user) return null;

  const { categories, skills } = await listTaxonomyOptions();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New project</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <Link href="/dashboard/projects" className="text-primary underline-offset-4 hover:underline">
            Back to projects
          </Link>
        </p>
      </div>
      <ProjectForm mode="create" categories={categories} skills={skills} />
    </div>
  );
}
