import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
const adapter = new PrismaLibSQL({ url: process.env.DATABASE_URL!, authToken: process.env.DATABASE_AUTH_TOKEN, intMode: 'number' });
const prisma = new PrismaClient({ adapter });

async function head(url: string): Promise<number> {
  try {
    const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
    return r.status;
  } catch {
    return 0;
  }
}

async function main() {
  // Pull every user with any resume URL (legacy or new)
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { resumeUrl: { not: null } },
        { resumes: { some: {} } },
      ],
    },
    select: {
      id: true, email: true, subscriptionTier: true, subscriptionStatus: true,
      resumeUrl: true,
      resumes: { select: { blobUrl: true, fileName: true } },
    },
  });
  console.log('Total users with at least one resume URL: ' + users.length);

  let dead = 0; let alive = 0; let mixed = 0; let totalUrls = 0;
  const deadUsers: { email: string; tier: string; status: string; deadCount: number; aliveCount: number; sample: string }[] = [];

  for (const u of users) {
    const urls = new Set<string>();
    if (u.resumeUrl) urls.add(u.resumeUrl);
    for (const r of u.resumes) urls.add(r.blobUrl);
    if (urls.size === 0) continue;
    totalUrls += urls.size;

    const results: { url: string; status: number }[] = [];
    for (const url of urls) {
      const s = await head(url);
      results.push({ url, status: s });
    }
    const deadCount = results.filter(r => r.status === 404 || r.status === 0).length;
    const aliveCount = results.filter(r => r.status === 200).length;
    if (deadCount > 0 && aliveCount === 0) dead++;
    else if (aliveCount > 0 && deadCount === 0) alive++;
    else mixed++;

    if (deadCount > 0) {
      deadUsers.push({
        email: u.email,
        tier: u.subscriptionTier ?? 'free',
        status: u.subscriptionStatus ?? 'inactive',
        deadCount,
        aliveCount,
        sample: results.find(r => r.status === 404)?.url ?? '',
      });
    }
  }

  console.log('\nResume URL audit:');
  console.log('  users w/ all URLs alive: ' + alive);
  console.log('  users w/ all URLs dead: ' + dead);
  console.log('  users w/ mixed (some alive, some dead): ' + mixed);
  console.log('  total URLs checked: ' + totalUrls);

  console.log('\n--- Users with dead resume URLs ---');
  // sort: paying first, then by tier
  const tierOrder: Record<string, number> = { pro: 0, starter: 1, free: 2 };
  deadUsers.sort((a, b) => (tierOrder[a.tier] ?? 99) - (tierOrder[b.tier] ?? 99));
  for (const u of deadUsers) {
    console.log('  [' + u.tier + '/' + u.status + '] ' + u.email + ' :: dead=' + u.deadCount + ' alive=' + u.aliveCount);
  }
}
main().finally(() => prisma.$disconnect());
