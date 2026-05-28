import { FreelancerPlanTier } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth/session";
import { createSubscriptionUpgradeSession } from "@/lib/subscriptions/service";

const bodySchema = z.object({
  tier: z
    .nativeEnum(FreelancerPlanTier)
    .refine((t) => t === FreelancerPlanTier.PLUS || t === FreelancerPlanTier.PRO, {
      message: "Invalid plan tier"
    })
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "FREELANCER") {
    return NextResponse.json({ error: "Freelancers only" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const res = await createSubscriptionUpgradeSession(session.user.id, parsed.data.tier);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: 400 });
  }
  return NextResponse.json({ checkoutUrl: res.data.checkoutUrl });
}
