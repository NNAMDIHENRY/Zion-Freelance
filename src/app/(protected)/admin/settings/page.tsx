import Link from "next/link";
import { Role } from "@prisma/client";

import { requireRole } from "@/lib/auth/guard";

export default async function AdminSettingsPage() {
  await requireRole([Role.ADMIN]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">System settings</h1>
      <p className="text-sm text-muted-foreground">
        Operational data and moderation tools are available in dedicated admin sections.
      </p>
      <ul className="list-inside list-disc space-y-2 text-sm">
        <li>
          <Link href="/admin/marketing" className="text-primary hover:underline">
            Popups &amp; homepage banners
          </Link>
        </li>
        <li>
          <Link href="/admin/contacts" className="text-primary hover:underline">
            Registration contacts
          </Link>
        </li>
        <li>
          <Link href="/admin/reports" className="text-primary hover:underline">
            Abuse reports
          </Link>
        </li>
        <li>
          <Link href="/admin/disputes" className="text-primary hover:underline">
            Disputes
          </Link>
        </li>
      </ul>
    </div>
  );
}
