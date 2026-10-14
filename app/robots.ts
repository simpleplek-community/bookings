import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
      // Explicitly welcome AI Answer Engine bots (Perplexity, GPTBot, ClaudeBot, Google-Extended)
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
          "Google-Extended",
          "Applebot-Extended",
        ],
        allow: ["/", "/faq", "/bookings", "/subscribe"],
      },
    ],
    sitemap: "https://simpleplek.com/sitemap.xml",
  };
}
