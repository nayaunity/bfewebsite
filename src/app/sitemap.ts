import type { MetadataRoute } from "next";
import { getAllPostsMeta } from "@/lib/blog";
import { getCourse } from "@/lib/courses";
import { getAllMemberSlugs } from "@/data/communityMembers";

const BASE_URL = "https://www.theblackfemaleengineer.com";

const COURSE_IDS = [
  "break-into-tech",
  "web-development",
  "system-design",
  "interview-prep",
  "resume-linkedin",
  "personal-branding",
  "gaining-experience",
  "github-essentials",
  "salary-negotiation",
  "claude-code-101",
  "claude-code",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    "",
    "/blog",
    "/jobs",
    "/resources",
    "/about",
    "/community",
    "/contact",
    "/work-with-us",
    "/claude-code-cohort",
    "/links",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
    priority: path === "" ? 1 : 0.8,
  }));

  // Blog posts (dynamic from DB)
  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await getAllPostsMeta();
    blogEntries = posts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt || post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch {
    // Silently handle DB errors during build
  }

  // Job detail pages
  const jobPages = [
    "/jobs/airbnb-connect-apprenticeship",
    "/jobs/ibm-software-engineer-apprentice",
    "/jobs/pinterest-apprenticeship",
    "/jobs/nomura-risk-technology-analyst",
    "/jobs/nomura-client-services-summer-analyst",
    "/jobs/nomura-summer-analyst-program",
    "/jobs/dei-companies",
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Resource course hub pages + lesson pages
  const resourceEntries: MetadataRoute.Sitemap = [];
  for (const courseId of COURSE_IDS) {
    resourceEntries.push({
      url: `${BASE_URL}/resources/${courseId}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    });

    const course = getCourse(courseId);
    if (course) {
      for (const mod of course.modules) {
        for (const lesson of mod.lessons) {
          resourceEntries.push({
            url: `${BASE_URL}/resources/${courseId}/${lesson.slug}`,
            lastModified: new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.6,
          });
        }
      }
    }
  }

  // Member pages
  const memberEntries = getAllMemberSlugs().map((slug) => ({
    url: `${BASE_URL}/members/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...blogEntries,
    ...jobPages,
    ...resourceEntries,
    ...memberEntries,
  ];
}
