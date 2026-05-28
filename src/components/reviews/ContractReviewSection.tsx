import { ReviewForm } from "@/components/reviews/ReviewForm";
import { getReviewEligibility } from "@/lib/reviews/service";
import type { Role } from "@prisma/client";

export async function ContractReviewSection({
  contractId,
  userId,
  role
}: {
  contractId: string;
  userId: string;
  role: Role;
}) {
  const res = await getReviewEligibility(userId, role, contractId);
  if (!res.ok) return null;

  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Leave a review
      </h2>
      <ReviewForm contractId={contractId} eligibility={res.data} />
    </section>
  );
}
