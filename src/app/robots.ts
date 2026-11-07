import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/admin/*",
          "/*/admin/",
          "/*/admin/*",
          "/api/",
          "/api/*",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin/",
          "/admin/*",
          "/*/admin/",
          "/*/admin/*",
          "/api/",
          "/api/*",
        ],
      },
    ],
    sitemap: "https://padonde.lat/sitemap.xml",
  };
}
