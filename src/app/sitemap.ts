import { MetadataRoute } from "next";
import { CHALLENGES } from "@/data/challenges";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://aiodyssey.in";

  const staticRoutes = [
    "",
    "/about",
    "/challenges",
    "/schedule",
    "/journey",
    "/rules",
    "/judging",
    "/prizes",
    "/organizers",
    "/mentors",
    "/sponsors",
    "/venue",
    "/contact",
    "/register",
    "/live",
    "/winners",
    "/gallery",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8
  }));

  const challengeRoutes = CHALLENGES.map((challenge) => ({
    url: `${baseUrl}/challenges/${challenge.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7
  }));

  return [...staticRoutes, ...challengeRoutes];
}
