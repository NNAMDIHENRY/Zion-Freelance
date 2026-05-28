import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { getPublicProject } from "@/lib/projects/public";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getPublicProject(id);

  if (!project) {
    return { title: "Project | Zion TeCHer" };
  }

  return {
    title: `${project.title} | Zion TeCHer`,
  };
}

export default async function PublicProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  const project = await getPublicProject(id);

  if (!project) {
    notFound();
  }

  const isFreelancer = session?.user?.role === "FREELANCER";
  const isLoggedIn = !!session;

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <header className="space-y-3">
        <p className="text-sm text-muted-foreground">
          <Link href="/projects" className="text-primary hover:underline">
            Open projects
          </Link>

          {project.category ? (
            <>
              <span className="mx-2">/</span>
              <Link
                href={`/categories/${project.category.slug}`}
                className="text-primary hover:underline"
              >
                {project.category.name}
              </Link>
            </>
          ) : null}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            {project.title}
          </h1>
          {project.status === "COMPLETED" ? (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              Completed
            </span>
          ) : project.status === "CLOSED" ? (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              Closed
            </span>
          ) : null}
        </div>

        <p className="text-sm text-muted-foreground">
          {project.budgetLabel}
          {project.deadline
            ? ` · Deadline ${new Date(project.deadline).toLocaleDateString()}`
            : ""}
        </p>

        <p className="text-sm">
          Posted by{" "}
          <Link
            href={`/users/${project.client.userId}`}
            className="font-medium text-primary hover:underline"
          >
            {project.client.companyName ?? project.client.name}
          </Link>
        </p>
      </header>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Brief
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
          {project.description}
        </p>
      </section>

      {project.skills.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Skills
          </h2>

          <ul className="flex flex-wrap gap-2">
            {project.skills.map((skill) => (
              <li
                key={skill.id}
                className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {skill.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      {project.attachments.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Attachments
          </h2>

          <ul className="space-y-2 text-sm">
            {project.attachments.map((attachment) => (
              <li key={attachment.id}>
                <a
                  href={`/api/uploads/${attachment.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {attachment.originalName}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        {project.status === "OPEN" && isFreelancer ? (
          <Link
          href={`/projects/${project.id}/proposal`}
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Submit Proposal
          </Link>
        ) : project.status === "OPEN" && !isLoggedIn ? (
          <>
            <Link
              href="/auth/register"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              Sign up to submit a proposal
            </Link>

            <Link
              href="/auth/login"
              className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium hover:bg-muted"
            >
              Sign in
            </Link>
          </>
        ) : null}
      </div>
    </main>
  );
}