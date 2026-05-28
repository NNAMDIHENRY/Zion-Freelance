import type { Metadata } from "next";
import "./globals.css";

import { AppProviders } from "@/components/providers/app-providers";

const siteUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Zion TeCHer Freelance — Hire vetted freelancers",
    template: "%s · Zion TeCHer Freelance"
  },
  description:
    "Hire vetted freelancers with milestone-backed contracts, escrow payments, and secure collaboration.",
  keywords: [
    "freelance marketplace",
    "hire freelancers",
    "milestone contracts",
    "escrow payments"
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Zion TeCHer Freelance",
    title: "Zion TeCHer Freelance",
    description:
      "Post projects, compare proposals, and pay by milestone with built-in escrow."
  },
  twitter: {
    card: "summary_large_image",
    title: "Zion TeCHer Freelance",
    description: "Milestone-backed freelance hiring with secure escrow."
  },
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

