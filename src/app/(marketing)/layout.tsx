import type { Metadata } from "next";

import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";

export const metadata: Metadata = {
  description:
    "Zion TeCHer is a premium freelance marketplace for clients and freelancers—structured proposals, secure collaboration, and trustworthy outcomes.",
  openGraph: {
    title: "Zion TeCHer Freelance Marketplace",
    description:
      "Hire vetted designers, developers, writers, and more. Post projects, compare proposals, and collaborate securely."
  }
};

export default function MarketingLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
