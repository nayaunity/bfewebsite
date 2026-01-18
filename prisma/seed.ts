import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sampleJobs = [
  {
    externalId: "seed-1",
    company: "Stripe",
    companySlug: "stripe",
    title: "Senior Software Engineer",
    location: "San Francisco, CA",
    type: "Full-time",
    remote: true,
    salary: "$180k - $250k",
    applyUrl: "https://stripe.com/jobs/1",
    category: "Software Engineering",
    tags: JSON.stringify(["Backend", "Go", "Distributed Systems"]),
    source: "seed",
  },
  {
    externalId: "seed-2",
    company: "Airbnb",
    companySlug: "airbnb",
    title: "Staff Data Scientist",
    location: "Remote - US",
    type: "Full-time",
    remote: true,
    salary: "$200k - $280k",
    applyUrl: "https://airbnb.com/jobs/2",
    category: "Data Science",
    tags: JSON.stringify(["Python", "Machine Learning", "SQL"]),
    source: "seed",
  },
  {
    externalId: "seed-3",
    company: "Coinbase",
    companySlug: "coinbase",
    title: "Product Manager, Payments",
    location: "New York, NY",
    type: "Full-time",
    remote: false,
    salary: "$170k - $220k",
    applyUrl: "https://coinbase.com/jobs/3",
    category: "Product Management",
    tags: JSON.stringify(["Crypto", "Payments", "B2C"]),
    source: "seed",
  },
  {
    externalId: "seed-4",
    company: "Robinhood",
    companySlug: "robinhood",
    title: "Senior DevOps Engineer",
    location: "Menlo Park, CA",
    type: "Full-time",
    remote: true,
    salary: "$160k - $210k",
    applyUrl: "https://robinhood.com/jobs/4",
    category: "DevOps / SRE",
    tags: JSON.stringify(["Kubernetes", "AWS", "Terraform"]),
    source: "seed",
  },
  {
    externalId: "seed-5",
    company: "Figma",
    companySlug: "figma",
    title: "Senior Product Designer",
    location: "San Francisco, CA",
    type: "Full-time",
    remote: false,
    salary: "$150k - $200k",
    applyUrl: "https://figma.com/jobs/5",
    category: "Design",
    tags: JSON.stringify(["UI/UX", "Design Systems", "Prototyping"]),
    source: "seed",
  },
  {
    externalId: "seed-6",
    company: "Databricks",
    companySlug: "databricks",
    title: "Software Engineer, Frontend",
    location: "Remote - US",
    type: "Full-time",
    remote: true,
    salary: "$140k - $190k",
    applyUrl: "https://databricks.com/jobs/6",
    category: "Software Engineering",
    tags: JSON.stringify(["React", "TypeScript", "GraphQL"]),
    source: "seed",
  },
  {
    externalId: "seed-7",
    company: "Lyft",
    companySlug: "lyft",
    title: "Machine Learning Engineer",
    location: "San Francisco, CA",
    type: "Full-time",
    remote: false,
    salary: "$175k - $240k",
    applyUrl: "https://lyft.com/jobs/7",
    category: "Data Science",
    tags: JSON.stringify(["ML", "Python", "TensorFlow"]),
    source: "seed",
  },
  {
    externalId: "seed-8",
    company: "Dropbox",
    companySlug: "dropbox",
    title: "Engineering Manager",
    location: "Remote - US",
    type: "Full-time",
    remote: true,
    salary: "$200k - $280k",
    applyUrl: "https://dropbox.com/jobs/8",
    category: "Software Engineering",
    tags: JSON.stringify(["Leadership", "Backend", "Distributed Systems"]),
    source: "seed",
  },
  {
    externalId: "seed-9",
    company: "Salesforce",
    companySlug: "salesforce",
    title: "Site Reliability Engineer",
    location: "Seattle, WA",
    type: "Full-time",
    remote: true,
    salary: "$155k - $205k",
    applyUrl: "https://salesforce.com/jobs/9",
    category: "DevOps / SRE",
    tags: JSON.stringify(["SRE", "Linux", "Monitoring"]),
    source: "seed",
  },
  {
    externalId: "seed-10",
    company: "Pinterest",
    companySlug: "pinterest",
    title: "Senior Product Designer",
    location: "Remote - US",
    type: "Full-time",
    remote: true,
    salary: "$145k - $195k",
    applyUrl: "https://pinterest.com/jobs/10",
    category: "Design",
    tags: JSON.stringify(["Mobile", "User Research", "Figma"]),
    source: "seed",
  },
];

async function main() {
  console.log("Seeding database...");

  // Clear existing seed data
  await prisma.job.deleteMany({
    where: { source: "seed" },
  });

  // Insert sample jobs
  for (const job of sampleJobs) {
    await prisma.job.create({
      data: {
        ...job,
        postedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last 7 days
        isActive: true,
      },
    });
  }

  console.log(`Seeded ${sampleJobs.length} jobs`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
