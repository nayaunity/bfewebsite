import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

// Get database connection from environment
const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

let prisma: PrismaClient;

if (url && (url.startsWith("libsql://") || url.startsWith("https://"))) {
  const adapter = new PrismaLibSQL({
    url,
    authToken: authToken || undefined,
    intMode: "number",
  });
  prisma = new PrismaClient({ adapter });
} else {
  prisma = new PrismaClient();
}

// Get start of a specific day in Denver timezone
function getDayStartDenver(daysAgo: number): Date {
  const now = new Date();
  const denverTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Denver" }));
  const denverMidnight = new Date(denverTime.getFullYear(), denverTime.getMonth(), denverTime.getDate());
  denverMidnight.setDate(denverMidnight.getDate() - daysAgo);
  const offset = denverTime.getTime() - now.getTime();
  return new Date(denverMidnight.getTime() - offset);
}

// Format date as YYYY-MM-DD in Denver timezone
function formatDateDenver(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Denver" });
}

async function backfillAnalytics(days: number) {
  console.log(`Backfilling analytics for the last ${days} days...`);

  for (let i = 1; i <= days; i++) {
    const dayStart = getDayStartDenver(i);
    const dayEnd = getDayStartDenver(i - 1);
    const dateStr = formatDateDenver(dayStart);

    // Check if already exists
    const existing = await prisma.dailyAnalytics.findUnique({
      where: { date: dateStr },
    });

    if (existing) {
      console.log(`  ${dateStr}: Already exists, skipping`);
      continue;
    }

    // Compute analytics
    const [visitors, blogViews, linkClicks, jobClicks] = await Promise.all([
      prisma.pagePresence.groupBy({
        by: ["visitorId"],
        where: {
          lastSeenAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
        _count: true,
      }).then((r) => r.length),

      prisma.blogView.count({
        where: {
          viewedAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      }),

      prisma.linkClick.count({
        where: {
          clickedAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      }),

      prisma.jobClick.count({
        where: {
          clickedAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      }),
    ]);

    // Store
    await prisma.dailyAnalytics.create({
      data: {
        date: dateStr,
        visitors,
        blogViews,
        linkClicks,
        jobClicks,
      },
    });

    console.log(`  ${dateStr}: visitors=${visitors}, blogViews=${blogViews}, linkClicks=${linkClicks}, jobClicks=${jobClicks}`);
  }

  console.log("Backfill complete!");
}

// Backfill last 30 days
backfillAnalytics(30)
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
