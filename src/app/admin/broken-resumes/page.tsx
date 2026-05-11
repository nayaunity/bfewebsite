import { prisma } from "@/lib/prisma";
import { requireFullAdmin } from "@/lib/admin";
import { NudgeButton } from "./NudgeButton";

export const dynamic = "force-dynamic";

async function findBrokenResumes() {
  // Pull every paying user with at least one resume URL on file (either
  // legacy User.resumeUrl or one of the UserResume rows).
  const users = await prisma.user.findMany({
    where: {
      subscriptionTier: { in: ["starter", "pro"] },
      subscriptionStatus: { in: ["active", "trialing"] },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      resumeUrl: true,
      resumeName: true,
      resumes: {
        select: { id: true, fileName: true, blobUrl: true, uploadedAt: true },
        orderBy: { uploadedAt: "desc" },
      },
    },
  });

  const broken: Array<{
    id: string;
    email: string;
    name: string;
    tier: string;
    status: string;
    deadUrls: string[];
    aliveCount: number;
  }> = [];

  await Promise.all(
    users.map(async (u) => {
      const urls = new Set<string>();
      if (u.resumeUrl) urls.add(u.resumeUrl);
      for (const r of u.resumes) urls.add(r.blobUrl);
      if (urls.size === 0) return; // never uploaded; not the "broken" case

      const results = await Promise.all(
        [...urls].map(async (url) => {
          try {
            const r = await fetch(url, {
              method: "HEAD",
              signal: AbortSignal.timeout(5000),
              cache: "no-store",
            });
            return { url, ok: r.ok };
          } catch {
            return { url, ok: false };
          }
        }),
      );

      const deadUrls = results.filter((r) => !r.ok).map((r) => r.url);
      const aliveCount = results.filter((r) => r.ok).length;
      if (deadUrls.length === 0) return;
      // Only flag if EVERY URL is dead (a user with one working resume isn't
      // really broken; the matcher will pick the working one).
      if (aliveCount > 0) return;

      broken.push({
        id: u.id,
        email: u.email,
        name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email,
        tier: u.subscriptionTier || "free",
        status: u.subscriptionStatus || "inactive",
        deadUrls,
        aliveCount,
      });
    }),
  );

  return { totalChecked: users.length, broken };
}

export default async function BrokenResumesPage() {
  await requireFullAdmin();
  const { totalChecked, broken } = await findBrokenResumes();

  return (
    <div className="pb-20 lg:pb-0">
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl text-[var(--foreground)]">
          Broken Resumes
        </h1>
        <p className="mt-2 text-[var(--gray-600)]">
          Paying users whose resume blob URL returns 404. Checked{" "}
          {totalChecked} paying users; {broken.length} are broken.
        </p>
      </div>

      {broken.length === 0 ? (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-8 text-center text-[var(--gray-600)]">
          All paying users have healthy resume URLs.
        </div>
      ) : (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--gray-50)] text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Tier</th>
                <th className="px-4 py-3 font-semibold">Dead URLs</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {broken.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-[var(--card-border)]"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-[var(--gray-600)]">
                      {u.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[var(--gray-100)] px-2 py-0.5 text-xs">
                      {u.tier} / {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--gray-600)]">
                    {u.deadUrls.length} dead
                  </td>
                  <td className="px-4 py-3 text-right">
                    <NudgeButton email={u.email} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
