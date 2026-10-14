import { siteOrigin } from "@/lib/site";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  return ["", "/feed", "/saunas", "/about"].map((path) => ({
    url: `${origin}${path}`,
    changeFrequency: path === "/feed" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.6,
  }));
}
