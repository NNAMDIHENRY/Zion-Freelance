import { NextResponse } from "next/server";

import { syncMarketplaceTaxonomy } from "@/lib/marketplace/taxonomy";
import { listTaxonomyOptions } from "@/lib/projects/service";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const ip = clientIp(req.headers);
  const limited = rateLimit(`taxonomy:${ip}`, 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    await syncMarketplaceTaxonomy();
    const { skills, categories } = await listTaxonomyOptions();
    return NextResponse.json({ skills, categories });
  } catch (error) {
    console.error("taxonomy", error);
    return NextResponse.json({ error: "Failed to load taxonomy" }, { status: 500 });
  }
}
