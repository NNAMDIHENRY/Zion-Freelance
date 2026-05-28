import type { Metadata } from "next";

const SITE_NAME = "Zion TeCHer Freelance";

export function siteOrigin() {
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function canonicalUrl(path = "/") {
  const base = siteOrigin();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p === "/" ? "" : p}`;
}

export function siteMetadata(opts: {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
  image?: string;
}): Metadata {
  const url = canonicalUrl(opts.path ?? "/");
  const image = opts.image ?? `${siteOrigin()}/og-default.png`;

  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: SITE_NAME,
      title: opts.title,
      description: opts.description,
      images: [{ url: image, width: 1200, height: 630, alt: opts.title }]
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [image]
    },
    robots: opts.noIndex ? { index: false, follow: false } : { index: true, follow: true }
  };
}

export function organizationJsonLd() {
  const url = siteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url,
    description:
      "Freelance marketplace with milestone contracts, escrow payments, and verified talent."
  };
}

export function websiteJsonLd() {
  const url = siteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}
