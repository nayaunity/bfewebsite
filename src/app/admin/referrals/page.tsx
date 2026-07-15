import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ReferralsQueue from "./ReferralsQueue";
import { isReferralAssistEnabledForEmail } from "@/lib/referrals/beta";
import { getReferralBackendStatus } from "@/lib/referrals/runtime";

export const dynamic = "force-dynamic";

const include = {
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      subscriptionTier: true,
      subscriptionStatus: true,
    },
  },
  job: {
    select: {
      id: true,
      title: true,
      company: true,
      companySlug: true,
      applyUrl: true,
      location: true,
      postedAt: true,
    },
  },
  connection: {
    select: {
      id: true,
      fullName: true,
      headline: true,
      currentCompany: true,
      profileUrl: true,
      avatarUrl: true,
    },
  },
  resume: {
    select: {
      id: true,
      fileName: true,
      blobUrl: true,
    },
  },
  events: {
    orderBy: { createdAt: "desc" as const },
    take: 10,
    select: {
      id: true,
      type: true,
      message: true,
      metadata: true,
      createdAt: true,
    },
  },
};

export default async function AdminReferralsPage() {
  const { user, role } = await requireAdmin();
  if (!isReferralAssistEnabledForEmail(user.email)) {
    redirect("/admin/auto-apply");
  }
  if (role === "contributor") {
    redirect("/admin/jobs");
  }

  const backend = await getReferralBackendStatus();
  if (!backend.ready) {
    return (
      <div className="pb-20 lg:pb-0">
        <div className="mb-6">
          <h1 className="font-serif text-2xl md:text-3xl text-[var(--foreground)]">Referrals Queue</h1>
          <p className="mt-1 text-sm text-[var(--gray-600)]">
            Concierge review for user-generated referral packets and live request progress.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          {backend.message}
        </div>
      </div>
    );
  }

  const [requests, totals] = await Promise.all([
    prisma.referralRequest.findMany({
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      include,
    }),
    prisma.referralRequest.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const total = requests.length;
  const live = requests.filter((request) => !["preview", "hired", "closed_no_response", "closed_declined"].includes(request.status)).length;
  const interviews = requests.filter((request) => request.status === "interview").length;
  const hired = requests.filter((request) => request.status === "hired").length;

  return (
    <div className="pb-20 lg:pb-0">
      <div className="mb-6">
        <h1 className="font-serif text-2xl md:text-3xl text-[var(--foreground)]">Referrals Queue</h1>
        <p className="mt-1 text-sm text-[var(--gray-600)]">
          Concierge review for user-generated referral packets and live request progress.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
          <p className="text-2xl font-bold text-[var(--foreground)]">{total}</p>
          <p className="text-xs text-[var(--gray-600)]">Total requests</p>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
          <p className="text-2xl font-bold text-[var(--accent)]">{live}</p>
          <p className="text-xs text-[var(--gray-600)]">Live queue</p>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
          <p className="text-2xl font-bold text-emerald-700">{interviews}</p>
          <p className="text-xs text-[var(--gray-600)]">Interview stage</p>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
          <p className="text-2xl font-bold text-green-700">{hired}</p>
          <p className="text-xs text-[var(--gray-600)]">Hired</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-xs text-[var(--gray-600)]">
        {totals.map((row) => `${row.status}: ${row._count}`).join(" · ")}
      </div>

      <ReferralsQueue
        initialRequests={requests.map((request) => ({
          ...request,
          submittedAt: request.submittedAt?.toISOString() || null,
          followUpDueAt: request.followUpDueAt?.toISOString() || null,
          sentAt: request.sentAt?.toISOString() || null,
          introMadeAt: request.introMadeAt?.toISOString() || null,
          interviewAt: request.interviewAt?.toISOString() || null,
          offerAt: request.offerAt?.toISOString() || null,
          hiredAt: request.hiredAt?.toISOString() || null,
          closedAt: request.closedAt?.toISOString() || null,
          createdAt: request.createdAt.toISOString(),
          updatedAt: request.updatedAt.toISOString(),
          job: {
            ...request.job,
            postedAt: request.job.postedAt?.toISOString() || null,
          },
          events: request.events.map((event) => ({
            ...event,
            createdAt: event.createdAt.toISOString(),
          })),
        }))}
      />
    </div>
  );
}
