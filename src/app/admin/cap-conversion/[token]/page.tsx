import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildDraft } from "@/lib/cap-conversion";
import SendButton from "./SendButton";

export const dynamic = "force-dynamic";

export default async function CapConversionApprovePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const digest = await prisma.capConversionDigest.findUnique({ where: { token } });
  if (!digest) notFound();

  const now = new Date();
  const expired = digest.expiresAt < now;
  const alreadyApproved = digest.status === "approved";

  const userIds = JSON.parse(digest.candidateUserIds) as string[];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, firstName: true, subscriptionTier: true, conversionEmailSentAt: true },
  });

  const drafts = [];
  for (const u of users) {
    const draft = await buildDraft(u.email, { createCoupon: false });
    drafts.push({
      ...draft,
      alreadySent: !!u.conversionEmailSentAt,
      tier: u.subscriptionTier,
    });
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-serif font-bold mb-2">Cap Conversion Digest</h1>
      <p className="text-sm text-[var(--gray-600)] mb-6">
        {drafts.length} candidate{drafts.length === 1 ? "" : "s"} · token{" "}
        <code className="text-xs bg-[var(--gray-100)] px-1.5 py-0.5 rounded">{token.slice(0, 8)}...</code>{" "}
        · expires {digest.expiresAt.toISOString().replace("T", " ").slice(0, 16)} UTC
      </p>

      {expired && (
        <div className="mb-6 p-4 rounded-lg border border-red-300 bg-red-50 text-red-900">
          This digest has expired. The candidates were not emailed. Run a manual send if you still want to reach them.
        </div>
      )}
      {alreadyApproved && (
        <div className="mb-6 p-4 rounded-lg border border-green-300 bg-green-50 text-green-900">
          Already approved and sent ({digest.sentCount} emails) at{" "}
          {digest.approvedAt?.toISOString().replace("T", " ").slice(0, 16)} UTC.
        </div>
      )}

      <div className="space-y-6">
        {drafts.map((d, i) => (
          <div
            key={d.userId}
            className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden"
          >
            <div className="px-5 py-3 bg-[var(--gray-50)] border-b border-[var(--card-border)] flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[var(--gray-600)]">DRAFT {i + 1}</span>
                <span className="ml-3 text-sm font-medium">{d.email}</span>
                {d.tier !== "free" && (
                  <span className="ml-2 text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded">
                    tier={d.tier} (will skip)
                  </span>
                )}
                {d.alreadySent && (
                  <span className="ml-2 text-xs text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
                    already sent (will skip)
                  </span>
                )}
              </div>
              <span className="text-xs text-[var(--gray-600)]">{d.primaryRole}</span>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-[var(--gray-600)] mb-2">
                <strong>Subject:</strong> {d.subject}
              </p>
              <div
                className="border border-[var(--gray-200)] rounded-lg p-4 bg-white"
                dangerouslySetInnerHTML={{ __html: d.html }}
              />
            </div>
          </div>
        ))}
      </div>

      {!expired && !alreadyApproved && (
        <div className="mt-8 flex items-center gap-4">
          <SendButton token={token} count={drafts.filter((d) => d.tier === "free" && !d.alreadySent).length} />
          <span className="text-sm text-[var(--gray-600)]">
            Sends a fresh 72h coupon per user. Deduped against past sends.
          </span>
        </div>
      )}
    </div>
  );
}
