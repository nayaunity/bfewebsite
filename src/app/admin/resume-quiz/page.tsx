import { prisma } from "@/lib/prisma";
import { requireFullAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const LEGACY_LABELS: Record<string, string> = {
  doePlatformUsers: "DoE Platform Scale",
  agentAccuracy: "AI Agent Accuracy",
  llmBakeoff: "LLM Bake-Off",
  dealsPipeline: "Pipeline Deals",
  onboardingSpeed: "Onboarding Speed-Up",
  uspsScale: "USPS Scale & Releases",
  integrationCount: "Integration Count",
  slalomWins: "Slalom Client Wins",
  pegaTeamScale: "Pega Team Scale",
  superpowerMoment: "Superpower Moment",
};

function formatDate(date: Date) {
  return new Date(date).toLocaleString("en-US", {
    timeZone: "America/Denver",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function getQuizData() {
  const allUsers = await prisma.user.findMany({
    where: { applicationAnswers: { not: null } },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      applicationAnswers: true,
      subscriptionTier: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter to users who actually completed the resume quiz
  const usersWithQuiz = allUsers
    .map((u) => {
      let quiz: Record<string, string> | null = null;
      let submittedAt: string | null = null;
      let dynamicLabels: Record<string, string> = {};
      let rewriteUrl: string | null = null;
      try {
        const parsed = JSON.parse(u.applicationAnswers || "{}");
        if (parsed.resumeQuiz) {
          submittedAt = parsed.resumeQuiz.submittedAt || null;
          const { submittedAt: _, ...answers } = parsed.resumeQuiz;
          quiz = answers;
        }
        if (parsed.resumeQuizQuestions) {
          for (const q of parsed.resumeQuizQuestions) {
            dynamicLabels[q.id] = q.label;
          }
        }
        if (parsed.resumeRewrite?.htmlUrl) {
          rewriteUrl = parsed.resumeRewrite.htmlUrl;
        }
      } catch {}
      return { ...u, quiz, submittedAt, dynamicLabels, rewriteUrl };
    })
    .filter((u) => u.quiz !== null);

  const totalUsers = await prisma.user.count();

  return { usersWithQuiz, totalUsers };
}

export default async function ResumeQuizAdminPage() {
  await requireFullAdmin();
  const { usersWithQuiz, totalUsers } = await getQuizData();

  return (
    <div className="pb-20 lg:pb-0">
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl text-[var(--foreground)]">
          Resume Quiz
        </h1>
        <p className="mt-2 text-[var(--gray-600)]">
          {usersWithQuiz.length} of {totalUsers} users completed the resume quiz
        </p>
      </div>

      {usersWithQuiz.length === 0 ? (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--gray-100)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--gray-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-[var(--foreground)]">No quiz responses yet</p>
          <p className="text-sm text-[var(--gray-600)] mt-1">
            Responses will appear here once users complete the resume quiz on their dashboard.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {usersWithQuiz.map((user) => (
            <div
              key={user.id}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden"
            >
              {/* User header */}
              <div className="px-6 py-4 border-b border-[var(--card-border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--gray-800)] flex items-center justify-center text-white text-sm font-medium">
                    {(user.firstName?.[0] || "").toUpperCase()}
                    {(user.lastName?.[0] || "").toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--foreground)]">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        user.subscriptionTier === "pro"
                          ? "bg-purple-100 text-purple-700"
                          : user.subscriptionTier === "starter"
                          ? "bg-[#ef562a]/10 text-[#ef562a]"
                          : "bg-[var(--gray-100)] text-[var(--gray-600)]"
                      }`}>
                        {user.subscriptionTier}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--gray-600)]">{user.email}</span>
                  </div>
                </div>
                {user.submittedAt && (
                  <span className="text-xs text-[var(--gray-600)]">
                    Submitted {formatDate(new Date(user.submittedAt))}
                  </span>
                )}
              </div>

              {/* Quiz answers */}
              <div className="px-6 py-4 space-y-4">
                {Object.entries(user.quiz || {}).map(([key, value]) => {
                  if (!value || typeof value !== "string") return null;
                  const label =
                    user.dynamicLabels[key] || LEGACY_LABELS[key] || key;
                  return (
                    <div key={key}>
                      <span className="text-xs font-semibold text-[var(--gray-600)] uppercase tracking-wider">
                        {label}
                      </span>
                      <p className="mt-1 text-sm text-[var(--foreground)] leading-relaxed">
                        {value}
                      </p>
                    </div>
                  );
                })}
                {user.rewriteUrl && (
                  <div className="pt-3 border-t border-[var(--card-border)]">
                    <a
                      href={user.rewriteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#ef562a] hover:underline"
                    >
                      View Rewritten Resume
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
