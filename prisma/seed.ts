import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const companies = [
  { name: "Stripe", slug: "stripe" },
  { name: "Airbnb", slug: "airbnb" },
  { name: "Coinbase", slug: "coinbase" },
  { name: "Robinhood", slug: "robinhood" },
  { name: "Figma", slug: "figma" },
  { name: "Databricks", slug: "databricks" },
  { name: "Lyft", slug: "lyft" },
  { name: "Dropbox", slug: "dropbox" },
  { name: "Salesforce", slug: "salesforce" },
  { name: "Pinterest", slug: "pinterest" },
  { name: "Slack", slug: "slack" },
  { name: "Twilio", slug: "twilio" },
  { name: "Shopify", slug: "shopify" },
  { name: "Square", slug: "square" },
  { name: "Notion", slug: "notion" },
  { name: "Airtable", slug: "airtable" },
  { name: "Canva", slug: "canva" },
  { name: "Discord", slug: "discord" },
  { name: "Snap", slug: "snap" },
  { name: "Instacart", slug: "instacart" },
];

const categories = [
  "Software Engineering",
  "Data Science",
  "Product Management",
  "DevOps / SRE",
  "Design",
];

const jobTitles: Record<string, string[]> = {
  "Software Engineering": [
    "Senior Software Engineer",
    "Staff Software Engineer",
    "Principal Engineer",
    "Frontend Engineer",
    "Backend Engineer",
    "Full Stack Engineer",
    "Mobile Engineer",
    "Engineering Manager",
    "Software Architect",
    "Platform Engineer",
  ],
  "Data Science": [
    "Data Scientist",
    "Senior Data Scientist",
    "Staff Data Scientist",
    "Machine Learning Engineer",
    "ML Platform Engineer",
    "Data Engineer",
    "Analytics Engineer",
    "Research Scientist",
    "Applied Scientist",
    "Data Analyst",
  ],
  "Product Management": [
    "Product Manager",
    "Senior Product Manager",
    "Staff Product Manager",
    "Principal Product Manager",
    "Group Product Manager",
    "Director of Product",
    "Technical Product Manager",
    "Product Lead",
    "Growth Product Manager",
    "Platform Product Manager",
  ],
  "DevOps / SRE": [
    "Site Reliability Engineer",
    "Senior SRE",
    "Staff SRE",
    "DevOps Engineer",
    "Platform Engineer",
    "Infrastructure Engineer",
    "Cloud Engineer",
    "Security Engineer",
    "Systems Engineer",
    "Production Engineer",
  ],
  "Design": [
    "Product Designer",
    "Senior Product Designer",
    "Staff Designer",
    "Principal Designer",
    "UX Designer",
    "UI Designer",
    "Design Lead",
    "UX Researcher",
    "Visual Designer",
    "Design Systems Engineer",
  ],
};

const tagsByCategory: Record<string, string[][]> = {
  "Software Engineering": [
    ["TypeScript", "React", "Node.js"],
    ["Python", "Django", "PostgreSQL"],
    ["Go", "Kubernetes", "gRPC"],
    ["Java", "Spring Boot", "AWS"],
    ["Rust", "Systems", "Performance"],
    ["React Native", "iOS", "Android"],
    ["GraphQL", "REST", "API Design"],
    ["Distributed Systems", "Microservices"],
  ],
  "Data Science": [
    ["Python", "TensorFlow", "PyTorch"],
    ["SQL", "Spark", "Airflow"],
    ["Machine Learning", "Deep Learning"],
    ["NLP", "Computer Vision", "LLMs"],
    ["Statistics", "A/B Testing", "Experimentation"],
    ["Data Modeling", "ETL", "dbt"],
  ],
  "Product Management": [
    ["Roadmapping", "Strategy", "Execution"],
    ["B2B", "Enterprise", "SaaS"],
    ["B2C", "Consumer", "Growth"],
    ["Platform", "APIs", "Developer Tools"],
    ["Payments", "Fintech", "Commerce"],
    ["Mobile", "iOS", "Android"],
  ],
  "DevOps / SRE": [
    ["Kubernetes", "Docker", "Helm"],
    ["AWS", "GCP", "Azure"],
    ["Terraform", "Pulumi", "IaC"],
    ["Prometheus", "Grafana", "Observability"],
    ["CI/CD", "GitHub Actions", "Jenkins"],
    ["Linux", "Networking", "Security"],
  ],
  "Design": [
    ["Figma", "Design Systems", "UI"],
    ["User Research", "Prototyping", "Testing"],
    ["Mobile Design", "iOS", "Android"],
    ["Web Design", "Responsive", "Accessibility"],
    ["Motion Design", "Animation", "Interaction"],
    ["Brand", "Visual Design", "Typography"],
  ],
};

const locations = [
  "San Francisco, CA",
  "New York, NY",
  "Seattle, WA",
  "Austin, TX",
  "Los Angeles, CA",
  "Chicago, IL",
  "Boston, MA",
  "Denver, CO",
  "Remote - US",
  "Remote - Worldwide",
];

const salaryRanges = [
  "$120k - $160k",
  "$140k - $180k",
  "$150k - $200k",
  "$160k - $220k",
  "$180k - $250k",
  "$200k - $280k",
  "$220k - $300k",
  "$250k - $350k",
];

function generateSampleJobs(count: number) {
  const jobs = [];

  for (let i = 1; i <= count; i++) {
    const company = companies[Math.floor(Math.random() * companies.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const titles = jobTitles[category];
    const title = titles[Math.floor(Math.random() * titles.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const isRemote = location.includes("Remote") || Math.random() > 0.6;
    const tags = tagsByCategory[category][Math.floor(Math.random() * tagsByCategory[category].length)];
    const salary = salaryRanges[Math.floor(Math.random() * salaryRanges.length)];

    jobs.push({
      externalId: `seed-${i}`,
      company: company.name,
      companySlug: company.slug,
      title,
      location,
      type: "Full-time",
      remote: isRemote,
      salary,
      applyUrl: `https://${company.slug}.com/jobs/${i}`,
      category,
      tags: JSON.stringify(tags),
      source: "seed",
    });
  }

  return jobs;
}

async function main() {
  console.log("Seeding database with 100 sample jobs...");

  // Clear existing seed data
  await prisma.job.deleteMany({
    where: { source: "seed" },
  });

  const sampleJobs = generateSampleJobs(100);

  // Insert sample jobs
  for (const job of sampleJobs) {
    await prisma.job.create({
      data: {
        ...job,
        postedAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000), // Random date within last 14 days
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
