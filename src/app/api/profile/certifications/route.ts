import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { getFreelancerProfileIdForUser } from "@/lib/projects/service";

const certSchema = z.object({
  title: z.string().trim().min(2).max(120),
  issuer: z.string().trim().min(2).max(120),
  issueDate: z.string().datetime({ offset: true }).or(z.string().date()),
  expirationDate: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
  credentialUrl: z.string().url().optional().nullable()
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileId = await getFreelancerProfileIdForUser(session.user.id);
  if (!profileId) return NextResponse.json({ certifications: [] });

  const rows = await prisma.freelancerCertification.findMany({
    where: { freelancerProfileId: profileId },
    orderBy: { issueDate: "desc" }
  });

  return NextResponse.json({
    certifications: rows.map((r) => ({
      id: r.id,
      title: r.title,
      issuer: r.issuer,
      issueDate: r.issueDate.toISOString(),
      expirationDate: r.expirationDate?.toISOString() ?? null,
      credentialUrl: r.credentialUrl
    }))
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileId = await getFreelancerProfileIdForUser(session.user.id);
  if (!profileId) return NextResponse.json({ error: "Freelancer profile required" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = certSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }

  const row = await prisma.freelancerCertification.create({
    data: {
      freelancerProfileId: profileId,
      title: parsed.data.title,
      issuer: parsed.data.issuer,
      issueDate: new Date(parsed.data.issueDate),
      expirationDate: parsed.data.expirationDate ? new Date(parsed.data.expirationDate) : null,
      credentialUrl: parsed.data.credentialUrl ?? null
    }
  });

  return NextResponse.json({ id: row.id }, { status: 201 });
}
