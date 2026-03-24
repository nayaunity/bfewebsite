import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get the admin user (site owner)
  const user = await prisma.user.findFirst({
    where: { role: "admin" },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      resumeUrl: true,
      resumeName: true,
      usState: true,
      workAuthorized: true,
      needsSponsorship: true,
      countryOfResidence: true,
    },
  });

  if (!user) {
    console.log(JSON.stringify({ error: "No admin user found" }));
    return;
  }

  // Check profile completeness
  const missing: string[] = [];
  if (!user.firstName) missing.push("firstName");
  if (!user.lastName) missing.push("lastName");
  if (!user.email) missing.push("email");
  if (!user.phone) missing.push("phone");
  if (!user.resumeUrl) missing.push("resume");

  if (missing.length > 0) {
    console.log(JSON.stringify({ error: `Incomplete profile. Missing: ${missing.join(", ")}` }));
    return;
  }

  // Get all active Greenhouse jobs not yet applied to by this user
  const appliedJobIds = await prisma.jobApplication.findMany({
    where: {
      userId: user.id,
      status: { in: ["submitted", "pending"] },
    },
    select: { jobId: true },
  });

  const appliedSet = new Set(appliedJobIds.map((a) => a.jobId));

  const allJobs = await prisma.job.findMany({
    where: {
      source: "greenhouse",
      isActive: true,
    },
    select: {
      id: true,
      externalId: true,
      company: true,
      companySlug: true,
      title: true,
      location: true,
      applyUrl: true,
    },
  });

  const eligibleJobs = allJobs.filter((j) => !appliedSet.has(j.id));

  console.log(
    JSON.stringify({
      profile: {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        resumeUrl: user.resumeUrl,
        resumeName: user.resumeName,
        usState: user.usState,
        workAuthorized: user.workAuthorized,
        needsSponsorship: user.needsSponsorship,
        countryOfResidence: user.countryOfResidence,
      },
      jobs: eligibleJobs,
      totalEligible: eligibleJobs.length,
    })
  );
}

main().finally(() => prisma.$disconnect());
