import Link from "next/link";
import { redirect } from "next/navigation";

import { PortfolioManager } from "@/components/profile/PortfolioManager";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth/session";
import { getProfileForUser } from "@/lib/profile/service";
import { listTaxonomyOptions } from "@/lib/projects/service";

export default async function ProfileEditPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/login");

  const [profile, taxonomy] = await Promise.all([
    getProfileForUser(session.user.id),
    listTaxonomyOptions()
  ]);
  if (!profile) redirect("/dashboard");

  const fp = profile.freelancerProfile;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/profile" className="text-primary hover:underline">
            Profile
          </Link>
          <span className="mx-2">/</span>
          <span>Edit</span>
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Edit profile</h1>
      </div>

      <ProfileEditForm
        role={session.user.role}
        skills={taxonomy.skills}
        initial={{
          name: profile.name,
          imageUrl: profile.imageUrl,
          headline: fp?.headline ?? undefined,
          bio: fp?.bio ?? undefined,
          hourlyRate: fp?.hourlyRate?.toString() ?? undefined,
          availability: fp?.availability,
          companyName: profile.clientProfile?.companyName ?? undefined,
          websiteUrl: profile.clientProfile?.websiteUrl ?? undefined,
          categorySlugs: fp?.categorySlugs ?? [],
          skillIds: fp?.skills.map((s) => s.skillId) ?? [],
          isPublic: fp?.isPublic
        }}
      />

      {session.user.role === Role.FREELANCER ? (
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
          <PortfolioManager initial={profile.portfolio} />
        </section>
      ) : null}
    </div>
  );
}
