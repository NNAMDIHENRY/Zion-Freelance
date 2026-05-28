import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

const schema = z.object({
  popupId: z.string().min(1),
  version: z.number().int().positive()
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
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await prisma.userPopupDismissal.upsert({
    where: {
      userId_popupId: { userId: session.user.id, popupId: parsed.data.popupId }
    },
    create: {
      userId: session.user.id,
      popupId: parsed.data.popupId,
      version: parsed.data.version
    },
    update: { version: parsed.data.version }
  });

  return NextResponse.json({ ok: true });
}
