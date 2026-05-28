import type { Metadata } from "next";

import { MarketingHomePage } from "@/lib/marketing/home-page";
import { organizationJsonLd, siteMetadata, websiteJsonLd } from "@/lib/seo/site";

export const metadata: Metadata = siteMetadata({
  title: "Hire global talent with confidence",
  description:
    "Post projects, compare proposals, and hire vetted freelancers with escrow milestones and secure collaboration.",
  path: "/"
});

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
      />
      <MarketingHomePage />
    </>
  );
}
