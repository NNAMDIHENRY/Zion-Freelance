import { Role } from "@prisma/client";

import { RegistrationContactsTable } from "@/components/admin/RegistrationContactsTable";
import { listRegistrationContacts } from "@/lib/admin/contacts/service";
import { requireRole } from "@/lib/auth/guard";

export default async function AdminContactsPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  await requireRole([Role.ADMIN]);
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const result = await listRegistrationContacts({ page, q: sp.q });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Registration contacts</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Email and phone captured at signup for support and compliance.
        </p>
      </header>
      <RegistrationContactsTable data={result} query={sp.q ?? ""} />
    </div>
  );
}
