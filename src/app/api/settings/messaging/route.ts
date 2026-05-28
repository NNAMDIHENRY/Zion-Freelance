import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

const patchSchema = z.object({
  allowMessagesFromEveryone: z.boolean()
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { allowMessagesFromEveryone: true }
  });

  return NextResponse.json({
    allowMessagesFromEveryone: user?.allowMessagesFromEveryone ?? true
  });
}

export async function PATCH(req: Request) {
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

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { allowMessagesFromEveryone: parsed.data.allowMessagesFromEveryone }
  });

  return NextResponse.json(parsed.data);
}
