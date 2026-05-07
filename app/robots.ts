import type { MetadataRoute } from "next";
import { baseUrl } from "@/lib/i18n/urls";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/*/dashboard", "/report", "/*/report"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
