import Link from "next/link";

import { Role } from "@prisma/client";

import { KycVerificationButton } from "@/components/kyc/KycVerificationButton";
import { EmailUpdatesToggle } from "@/components/settings/EmailUpdatesToggle";
import { getKycStatusForUser } from "@/lib/kyc/service";
import { MessagingPrivacyToggle } from "@/components/settings/MessagingPrivacyToggle";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/login");

  const [user, kyc] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { receiveEmailUpdates: true, allowMessagesFromEveryone: true }
    }),
    getKycStatusForUser(session.user.id)
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Account settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your account, notifications, and security preferences.
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Profile
        </h2>
        <p className="text-sm text-muted-foreground">{session.user.email}</p>
        <div className="flex flex-wrap gap-2">
          <KycVerificationButton
            identityVerified={kyc.identityVerified}
            kycStatus={kyc.submission?.status ?? null}
          />
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/profile/edit">Edit profile</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Email
        </h2>
        <EmailUpdatesToggle initial={user?.receiveEmailUpdates ?? true} />
      </section>

      {session.user.role === Role.FREELANCER ? (
        <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Freelancer plan
          </h2>
          <p className="text-sm text-muted-foreground">
            Upgrade for higher search visibility. Client posting stays unlimited.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/settings/plan">Manage plan</Link>
          </Button>
        </section>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Messaging
        </h2>
        <MessagingPrivacyToggle initial={user?.allowMessagesFromEveryone ?? true} />
      </section>

      <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Notifications
        </h2>
        <p className="text-sm text-muted-foreground">
          Control email and in-app alerts by category.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/settings/notifications">Notification preferences</Link>
        </Button>
      </section>

      <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Security
        </h2>
        <p className="text-sm text-muted-foreground">
          Reset your password via email if you need to change it.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/auth/forgot-password">Reset password</Link>
        </Button>
      </section>
    </div>
  );
}
