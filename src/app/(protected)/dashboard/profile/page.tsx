import Image from "next/image";
import Link from "next/link";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { KycVerificationButton } from "@/components/kyc/KycVerificationButton";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { getKycStatusForUser } from "@/lib/kyc/service";
import { getProfileForUser } from "@/lib/profile/service";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/login");

  const [profile, kyc] = await Promise.all([
    getProfileForUser(session.user.id),
    getKycStatusForUser(session.user.id)
  ]);
  if (!profile) redirect("/dashboard");

  const fp = profile.freelancerProfile;
  const cp = profile.clientProfile;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            How others see you on the marketplace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <KycVerificationButton
            identityVerified={kyc.identityVerified}
            kycStatus={kyc.submission?.status ?? null}
          />
          <Button asChild variant="outline">
            <Link href="/dashboard/profile/edit">Edit profile</Link>
          </Button>
        </div>
      </div>

      <section className="flex flex-col gap-6 rounded-2xl border border-border/60 bg-card p-6 shadow-subtle sm:flex-row">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-primary/10">
          {profile.imageUrl ? (
            <Image src={profile.imageUrl} alt="" fill className="object-cover" unoptimized />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-primary">
              {profile.name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 space-y-2">
          <h2 className="text-xl font-semibold">{profile.name}</h2>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
          {fp?.headline ? <p className="text-sm">{fp.headline}</p> : null}
          {fp?.bio ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{fp.bio}</p>
          ) : null}
          {cp?.companyName ? (
            <p className="text-sm text-muted-foreground">Company: {cp.companyName}</p>
          ) : null}
          {session.user.role === Role.FREELANCER ? (
            <Link href={`/users/${profile.id}`} className="text-sm font-medium text-primary hover:underline">
              View public profile
            </Link>
          ) : null}
        </div>
      </section>

      {fp?.skills.length ? (
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Skills</h3>
          <ul className="mt-4 flex flex-wrap gap-2">
            {fp.skills.map((s) => (
              <li
                key={s.skill.id}
                className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium"
              >
                {s.skill.name}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
