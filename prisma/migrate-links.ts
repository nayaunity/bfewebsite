import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Copy of the links data from src/data/links.ts
const links = [
  {
    id: "free-resources",
    title: "Free Resources Hub",
    description: "Access all my free guides, templates, and tools",
    url: "/resources",
    category: "Resources",
    featured: true,
  },
  {
    id: "community",
    title: "Join the Community",
    description: "Connect with other learners and pivoters",
    url: "/community",
    category: "Community",
    featured: true,
  },
  {
    id: "resume-template",
    title: "✨ Vision boards are cool, but have you ever created a gpt of you 1 year from now?",
    description: "",
    url: "https://theblackfemaleengineer.substack.com/p/dont-create-a-vision-board-create",
    category: "Life",
    featured: false,
  },
  {
    id: "tech-conferences",
    title: "🎤 Attend tech conferences for free!",
    description: "Join this membership community to save on tech conferences year round",
    url: "https://www.skool.com/bigstage/about?ref=8caf1280f64b43e19a63a7b7114a802c",
    category: "Career",
    featured: false,
  },
  {
    id: "cs-education",
    title: "🎓 Path to a free self-taught education in Computer Science!",
    description: "",
    url: "https://github.com/ossu/computer-science",
    category: "Learning",
    featured: false,
  },
  {
    id: "jobs",
    title: "Job Board",
    description: "Find opportunities at companies that value diversity",
    url: "/jobs",
    category: "Career",
    featured: false,
  },
  {
    id: "work-with-us",
    title: "Work With Us",
    description: "Partnership and collaboration opportunities",
    url: "/work-with-us",
    category: "Business",
    featured: false,
  },
  {
    id: "contact",
    title: "Get in Touch",
    description: "Questions? Let's connect",
    url: "/contact",
    category: "Contact",
    featured: false,
  },
];

async function migrateLinks() {
  console.log("Starting link migration...");

  try {
    // Check if links already exist
    const existingCount = await prisma.link.count();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing links in database.`);
      console.log("Skipping migration to avoid duplicates.");
      console.log("If you want to re-migrate, delete existing links first.");
      return;
    }

    // Insert links with order based on array index
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      await prisma.link.create({
        data: {
          title: link.title,
          description: link.description || null,
          url: link.url,
          category: link.category || null,
          featured: link.featured || false,
          order: i,
          isActive: true,
        },
      });
      console.log(`  Migrated: ${link.title}`);
    }

    console.log(`\nSuccessfully migrated ${links.length} links!`);
  } catch (error) {
    console.error("Error migrating links:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateLinks();
