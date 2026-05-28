"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function updateEmailUpdatesPreference(enabled: boolean) {
  const session = await getSession();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { receiveEmailUpdates: enabled }
  });

  revalidatePath("/dashboard/settings");
  return { ok: true as const };
}
