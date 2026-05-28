import type { MetadataRoute } from "next";

import { siteOrigin } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteOrigin();
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/freelancers",
          "/jobs",
          "/jobs/",
          "/users/",
          "/categories",
          "/search",
          "/pricing",
          "/about",
          "/contact",
          "/projects"
        ],
        disallow: ["/dashboard", "/admin", "/client", "/freelancer", "/api/", "/auth/"]
      }
    ],
    sitemap: `${base}/sitemap.xml`
  };
}
