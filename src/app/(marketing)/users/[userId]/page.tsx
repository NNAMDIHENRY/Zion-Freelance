import { Role } from "@prisma/client";
import { notFound } from "next/navigation";

import { FreelancerPublicProfile } from "@/components/users/FreelancerPublicProfile";
import { getFreelancerPublicDetail } from "@/lib/profile/service";
import { recordProfileView } from "@/lib/profile/views";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getPublicUserProfile } from "@/lib/reviews/service";

export async function generateMetadata({
  params
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const user = await getPublicUserProfile(userId);
  if (!user) return { title: "Profile | Zion TeCHer" };
  return { title: `${user.name} | Zion TeCHer` };
}

export default async function PublicUserProfilePage({
  params
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const user = await getPublicUserProfile(userId);
  if (!user) notFound();

  if (user.role === Role.CLIENT) {
    const { redirect } = await import("next/navigation");
    redirect(`/clients/${userId}`);
  }

  if (user.role === Role.FREELANCER && user.freelancerProfile?.isPublic) {
    const session = await getServerSession(authOptions);
    const detail = await getFreelancerPublicDetail(userId);
    if (!detail) notFound();
    await recordProfileView({ viewedUserId: userId, viewerUserId: session?.user?.id });
    return <FreelancerPublicProfile data={detail} />;
  }

  notFound();
}
