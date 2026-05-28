import { Role } from "@prisma/client";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PaymentMonitoringPanel } from "@/components/admin/PaymentMonitoringPanel";
import { requireRole } from "@/lib/auth/guard";
import {
  getPaymentMonitoringSummary,
  listAdminPayments
} from "@/lib/admin/payments/service";
import { adminPaymentListSchema } from "@/lib/validators/admin";

export default async function AdminPaymentsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole([Role.ADMIN]);
  const sp = await searchParams;
  const parsed = adminPaymentListSchema.safeParse({
    status: sp.status,
    page: sp.page,
    pageSize: sp.pageSize
  });
  const input = parsed.success ? parsed.data : adminPaymentListSchema.parse({});
  const [summary, payments] = await Promise.all([
    getPaymentMonitoringSummary(),
    listAdminPayments(input)
  ]);

  return (
    <main className="space-y-8">
      <AdminPageHeader
        title="Payment monitoring"
        description="Platform volume, pending settlements, and suspicious activity."
        crumbs={[{ label: "Payments" }]}
      />
      <PaymentMonitoringPanel summary={summary} payments={payments.items} />
    </main>
  );
}
