import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const ip = clientIp(req.headers);
  const limited = rateLimit(`marketplace-search:${ip}`, 60, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ freelancers: [], skills: [], categories: [] });
  }

  const [freelancers, skills, categories] = await Promise.all([
    prisma.freelancerProfile.findMany({
      where: {
        isPublic: true,
        OR: [
          { headline: { contains: q, mode: "insensitive" } },
          { bio: { contains: q, mode: "insensitive" } },
          { user: { name: { contains: q, mode: "insensitive" } } },
          { skills: { some: { skill: { name: { contains: q, mode: "insensitive" } } } } }
        ]
      },
      take: 6,
      select: {
        id: true,
        userId: true,
        headline: true,
        user: { select: { name: true } }
      }
    }),
    prisma.skill.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      take: 8,
      select: { slug: true, name: true }
    }),
    prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } }
        ]
      },
      take: 6,
      select: { slug: true, name: true }
    })
  ]);

  return NextResponse.json({
    freelancers: freelancers.map((f) => ({
      id: f.id,
      userId: f.userId,
      name: f.user.name ?? "Freelancer",
      headline: f.headline
    })),
    skills,
    categories
  });
}
