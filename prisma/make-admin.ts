import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function makeAdmin(email: string) {
  if (!email) {
    console.error("Usage: npx tsx prisma/make-admin.ts <email>");
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`User with email "${email}" not found.`);
      console.log("Make sure the user has signed in at least once.");
      process.exit(1);
    }

    if (user.role === "admin") {
      console.log(`User "${email}" is already an admin.`);
      process.exit(0);
    }

    await prisma.user.update({
      where: { email },
      data: { role: "admin" },
    });

    console.log(`Successfully made "${email}" an admin!`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
makeAdmin(email);
