import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const clientProfile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true }
  });
  if (!clientProfile) {
    return NextResponse.json({ users: [] });
  }

  const freelancers = await prisma.user.findMany({
    where: {
      role: Role.FREELANCER,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } }
      ],
      freelancerProfile: {
        isPublic: true,
        proposals: {
          some: { project: { clientId: clientProfile.id } }
        }
      }
    },
    take: 12,
    select: { id: true, name: true, email: true, role: true }
  });

  return NextResponse.json({ users: freelancers });
}
