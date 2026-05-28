import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { OpenConversationButton } from "@/components/messaging/OpenConversationButton";
import { ReportDialog } from "@/components/reports/ReportDialog";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { authOptions } from "@/lib/auth/options";
import { getPublicClientProfile } from "@/lib/clients/public";
import { recordProfileView } from "@/lib/profile/views";

export default async function ClientPublicProfilePage({
  params
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const session = await getServerSession(authOptions);
  const profile = await getPublicClientProfile(userId);

  if (!profile) notFound();

  await recordProfileView({
    viewedUserId: userId,
    viewerUserId: session?.user?.id
  });

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <header className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">
                {profile.companyName ?? profile.name}
              </h1>
              {profile.verified ? <VerifiedBadge /> : null}
            </div>
            <p className="text-sm text-muted-foreground">{profile.name}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {profile.profileViewCount.toLocaleString()} profile views · Member since{" "}
              {new Date(profile.memberSince).toLocaleDateString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {session?.user?.id && session.user.id !== userId ? (
              <>
                <OpenConversationButton mode="direct" targetUserId={userId} label="Message client" />
                <ReportDialog targetType="USER" targetId={userId} label="Report spam" />
              </>
            ) : null}
          </div>
        </div>
        {profile.bio ? <p className="text-sm leading-relaxed text-muted-foreground">{profile.bio}</p> : null}
        {profile.websiteUrl ? (
          <a href={profile.websiteUrl} className="text-sm font-medium text-primary hover:underline" target="_blank" rel="noreferrer">
            {profile.websiteUrl}
          </a>
        ) : null}
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Active", profile.stats.active],
          ["Completed", profile.stats.completed],
          ["Pending", profile.stats.pending],
          ["Closed", profile.stats.closed]
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-xl border border-border/60 bg-muted/20 p-4 text-center">
            <div className="text-2xl font-semibold">{value as number}</div>
            <div className="text-xs text-muted-foreground">{label as string} projects</div>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Projects</h2>
        <ul className="space-y-3">
          {profile.projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className="block rounded-xl border border-border/60 bg-card p-4 transition hover:border-violet-500/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{p.title}</span>
                  <span className="text-xs font-semibold uppercase text-muted-foreground">{p.status}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{p.budgetLabel}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
