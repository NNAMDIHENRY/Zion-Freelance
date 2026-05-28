import type { Metadata } from "next";

import { MarketingBanners } from "@/components/marketing/MarketingBanners";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { siteMetadata } from "@/lib/seo/site";

export const metadata: Metadata = siteMetadata({
  title: "Zion TeCHer Freelance Marketplace",
  description:
    "Hire vetted designers, developers, writers, and more. Post projects, compare proposals, and collaborate securely.",
  path: "/"
});

export default function MarketingLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <MarketingBanners />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
