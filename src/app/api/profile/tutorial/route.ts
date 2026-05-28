import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

const schema = z.object({
  role: z.enum([Role.CLIENT, Role.FREELANCER])
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data:
      parsed.data.role === Role.CLIENT
        ? { tutorialClientCompletedAt: new Date() }
        : { tutorialFreelancerCompletedAt: new Date() }
  });

  return NextResponse.json({ ok: true });
}
