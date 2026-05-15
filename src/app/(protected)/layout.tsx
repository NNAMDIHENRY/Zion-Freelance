import { redirect } from "next/navigation";

import { DashboardLayout } from "@/components/dashboard/layout/DashboardLayout";
import { getSession } from "@/lib/auth/session";

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = session.user;

  return (
    <DashboardLayout
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role
      }}
    >
      {children}
    </DashboardLayout>
  );
}
