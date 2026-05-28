import { NextResponse } from "next/server";

import { submitAbuseReport } from "@/lib/admin/reports/service";
import { getSession } from "@/lib/auth/session";
import { submitAbuseReportSchema } from "@/lib/validators/admin";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = submitAbuseReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }

  const report = await submitAbuseReport(session.user.id, parsed.data);
  return NextResponse.json({ id: report.id }, { status: 201 });
}
