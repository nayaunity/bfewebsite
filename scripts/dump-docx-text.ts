/**
 * Fetch the two affected users' resume DOCX files and dump the mammoth-extracted
 * text so I can extract structured fields by hand (no ANTHROPIC_API_KEY needed).
 *
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/dump-docx-text.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import mammoth from "mammoth";

const TARGETS = [
  { id: "8e645d98-2f45-479d-8b98-1f6e7a7a031e", label: "Chantil Wright" },
  { id: "31332ea5-99b2-440a-80bb-42fd5bb249e7", label: "Jessica Nwanze" },
];

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (url && (url.startsWith("libsql://") || url.startsWith("https://"))) {
    const adapter = new PrismaLibSQL({
      url: url.trim().replace(/\/+$/, ""),
      authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
      intMode: "number",
    });
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}

const prisma = createPrismaClient();

async function main() {
  for (const t of TARGETS) {
    console.log(`\n\n======================================================================`);
    console.log(`${t.label} (${t.id})`);
    console.log(`======================================================================`);

    const user = await prisma.user.findUnique({
      where: { id: t.id },
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true,
        linkedinUrl: true, currentTitle: true, targetRole: true,
        yearsOfExperience: true, degree: true, school: true,
        city: true, usState: true, countryOfResidence: true,
        remotePreference: true, workLocations: true, resumeUrl: true,
      },
    });
    if (!user) { console.log("NOT FOUND"); continue; }

    console.log(`CURRENT PROFILE:`);
    console.log(JSON.stringify({
      firstName: user.firstName, lastName: user.lastName, phone: user.phone,
      linkedinUrl: user.linkedinUrl, currentTitle: user.currentTitle,
      targetRole: user.targetRole, yearsOfExperience: user.yearsOfExperience,
      degree: user.degree, school: user.school,
      city: user.city, usState: user.usState, countryOfResidence: user.countryOfResidence,
      remotePreference: user.remotePreference, workLocations: user.workLocations,
    }, null, 2));

    if (!user.resumeUrl) { console.log("NO RESUME URL"); continue; }
    const res = await fetch(user.resumeUrl);
    const buf = Buffer.from(await res.arrayBuffer());
    const result = await mammoth.extractRawText({ buffer: buf });
    console.log(`\n--- RESUME TEXT (${result.value.length} chars) ---`);
    console.log(result.value);
    console.log(`--- END RESUME TEXT ---`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
