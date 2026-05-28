import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { getFreelancerProfileIdForUser } from "@/lib/projects/service";

const patchSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  issuer: z.string().trim().min(2).max(120).optional(),
  issueDate: z.string().optional(),
  expirationDate: z.string().nullable().optional(),
  credentialUrl: z.string().url().nullable().optional()
});

type Ctx = { params: Promise<{ certId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileId = await getFreelancerProfileIdForUser(session.user.id);
  if (!profileId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { certId } = await ctx.params;
  const existing = await prisma.freelancerCertification.findFirst({
    where: { id: certId, freelancerProfileId: profileId }
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }

  const d = parsed.data;
  await prisma.freelancerCertification.update({
    where: { id: certId },
    data: {
      title: d.title,
      issuer: d.issuer,
      issueDate: d.issueDate ? new Date(d.issueDate) : undefined,
      expirationDate:
        d.expirationDate === null ? null : d.expirationDate ? new Date(d.expirationDate) : undefined,
      credentialUrl: d.credentialUrl
    }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileId = await getFreelancerProfileIdForUser(session.user.id);
  if (!profileId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { certId } = await ctx.params;
  const res = await prisma.freelancerCertification.deleteMany({
    where: { id: certId, freelancerProfileId: profileId }
  });
  if (!res.count) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
