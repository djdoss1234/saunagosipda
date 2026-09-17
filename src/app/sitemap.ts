import { facilities } from "@/data/facilities";
import { siteOrigin } from "@/lib/site";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  const staticPaths = ["", "/search", "/map", "/visits", "/rankings", "/magazine", "/about", "/submit"];
  const featured = facilities.filter((f) => f.featured).map((f) => `/saunas/${f.id}`);
  return [...staticPaths, ...featured].map((path) => ({
    url: `${origin}${path}`,
    changeFrequency: path === "" || path === "/search" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/search" ? 0.9 : 0.6,
  }));
}
