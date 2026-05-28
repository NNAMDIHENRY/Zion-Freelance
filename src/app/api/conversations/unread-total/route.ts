import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { countUnreadInboundMessages } from "@/lib/messaging/unread-global";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unread = await countUnreadInboundMessages(session.user.id);

  return NextResponse.json({ unread });
}
