import { prisma } from "@/lib/prisma";
import { requireFullAdmin } from "@/lib/admin";
import { QuizCard } from "./QuizCard";

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

function formatDate(date: Date | string) {
  return new Date(date).toLocaleString("en-US", {
    timeZone: "America/Denver",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type QuizStage = "eligible" | "questions_generated" | "quiz_completed" | "rewrite_ready";

interface QuizQuestion {
  id: string;
  label: string;
  question: string;
}

interface QuizUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
  createdAt: Date;
  stage: QuizStage;
  questionCount: number;
  answeredCount: number;
  questions: QuizQuestion[];
  answers: Record<string, string>;
  rewriteUrl: string | null;
  rewriteCreatedAt: string | null;
  submittedAt: string | null;
}

async function getQuizData() {
  const allUsers = await prisma.user.findMany({
    where: {
      OR: [
        { subscriptionStatus: "active" },
        { subscriptionStatus: "trialing" },
      ],
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      applicationAnswers: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      resumeUrl: true,
      createdAt: true,
      resumes: { select: { id: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const quizUsers: QuizUser[] = allUsers
    .filter((u) => u.resumeUrl || u.resumes.length > 0)
    .map((u) => {
      let answers: Record<string, string> = {};
      let submittedAt: string | null = null;
      let questions: QuizQuestion[] = [];
      let rewriteUrl: string | null = null;
      let rewriteCreatedAt: string | null = null;
      let questionCount = 0;
      let answeredCount = 0;
      let stage: QuizStage = "eligible";

      try {
        const parsed = JSON.parse(u.applicationAnswers || "{}");

        if (parsed.resumeQuizQuestions?.length > 0) {
          questionCount = parsed.resumeQuizQuestions.length;
          stage = "questions_generated";
          questions = parsed.resumeQuizQuestions.map(
            (q: { id: string; label: string; question: string }) => ({
              id: q.id,
              label: q.label,
              question: q.question,
            })
          );
        }

        if (parsed.resumeQuiz) {
          submittedAt = parsed.resumeQuiz.submittedAt || null;
          const { submittedAt: _, ...raw } = parsed.resumeQuiz;
          answers = raw as Record<string, string>;
          answeredCount = Object.values(answers).filter(
            (v) => typeof v === "string" && v.trim()
          ).length;
          stage = "quiz_completed";
        }

        if (parsed.resumeRewrite?.pdfUrl || parsed.resumeRewrite?.htmlUrl) {
          rewriteUrl = parsed.resumeRewrite.pdfUrl || parsed.resumeRewrite.htmlUrl;
          rewriteCreatedAt = parsed.resumeRewrite.createdAt || null;
          stage = "rewrite_ready";
        }
      } catch {}

      // For legacy submissions without stored questions, synthesize from answer keys
      if (questions.length === 0 && Object.keys(answers).length > 0) {
        questions = Object.keys(answers).map((key) => ({
          id: key,
          label: LEGACY_LABELS[key] || key,
          question: "",
        }));
        questionCount = questions.length;
      }

      return {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        subscriptionTier: u.subscriptionTier,
        subscriptionStatus: u.subscriptionStatus,
        createdAt: u.createdAt,
        stage,
        questionCount,
        answeredCount,
        questions,
        answers,
        rewriteUrl,
        rewriteCreatedAt,
        submittedAt,
      };
    });

  const totalEligible = quizUsers.length;
  const questionsGenerated = quizUsers.filter(
    (u) => u.stage !== "eligible"
  ).length;
  const quizCompleted = quizUsers.filter(
    (u) => u.stage === "quiz_completed" || u.stage === "rewrite_ready"
  ).length;
  const rewriteReady = quizUsers.filter(
    (u) => u.stage === "rewrite_ready"
  ).length;

  return {
    quizUsers,
    funnel: { totalEligible, questionsGenerated, quizCompleted, rewriteReady },
  };
}

const STAGE_CONFIG: Record<
  QuizStage,
  { label: string; color: string; bg: string }
> = {
  eligible: {
    label: "Not started",
    color: "text-[var(--gray-600)]",
    bg: "bg-[var(--gray-100)]",
  },
  questions_generated: {
    label: "Questions generated",
    color: "text-blue-700",
    bg: "bg-blue-50",
  },
  quiz_completed: {
    label: "Quiz completed",
    color: "text-amber-700",
    bg: "bg-amber-50",
  },
  rewrite_ready: {
    label: "Rewrite ready",
    color: "text-green-700",
    bg: "bg-green-50",
  },
};

export default async function ResumeQuizAdminPage() {
  await requireFullAdmin();
  const { quizUsers, funnel } = await getQuizData();

  const activeUsers = quizUsers.filter(
    (u) => u.stage !== "eligible"
  );
  const notStarted = quizUsers.filter((u) => u.stage === "eligible");

  return (
    <div className="pb-20 lg:pb-0">
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl text-[var(--foreground)]">
          Resume Quiz
        </h1>
        <p className="mt-2 text-[var(--gray-600)]">
          Personalized impact quiz and AI resume rewrite
        </p>
      </div>

      {/* Funnel stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
          <p className="text-xs font-medium text-[var(--gray-600)] uppercase tracking-wider">
            Eligible
          </p>
          <p className="text-3xl font-serif text-[var(--foreground)] mt-1">
            {funnel.totalEligible}
          </p>
          <p className="text-xs text-[var(--gray-600)] mt-1">
            paying/trialing with resume
          </p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
          <p className="text-xs font-medium text-[var(--gray-600)] uppercase tracking-wider">
            Started
          </p>
          <p className="text-3xl font-serif text-[var(--foreground)] mt-1">
            {funnel.questionsGenerated}
          </p>
          <p className="text-xs text-[var(--gray-600)] mt-1">
            {funnel.totalEligible > 0
              ? `${Math.round((funnel.questionsGenerated / funnel.totalEligible) * 100)}% of eligible`
              : ""}
          </p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
          <p className="text-xs font-medium text-[var(--gray-600)] uppercase tracking-wider">
            Submitted
          </p>
          <p className="text-3xl font-serif text-[var(--foreground)] mt-1">
            {funnel.quizCompleted}
          </p>
          <p className="text-xs text-[var(--gray-600)] mt-1">
            {funnel.questionsGenerated > 0
              ? `${Math.round((funnel.quizCompleted / funnel.questionsGenerated) * 100)}% completion`
              : ""}
          </p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
          <p className="text-xs font-medium text-[var(--gray-600)] uppercase tracking-wider">
            Rewritten
          </p>
          <p className="text-3xl font-serif text-[var(--foreground)] mt-1">
            {funnel.rewriteReady}
          </p>
          <p className="text-xs text-[var(--gray-600)] mt-1">
            AI resume delivered
          </p>
        </div>
      </div>

      {/* Users who interacted */}
      {activeUsers.length > 0 && (
        <div className="mb-8">
          <h2 className="font-serif text-xl text-[var(--foreground)] mb-4">
            Active ({activeUsers.length})
          </h2>
          <div className="space-y-4">
            {activeUsers.map((user) => {
              const stageConf = STAGE_CONFIG[user.stage];
              return (
                <QuizCard
                  key={user.id}
                  user={{
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    subscriptionTier: user.subscriptionTier,
                    subscriptionStatus: user.subscriptionStatus,
                    stage: user.stage,
                    stageLabel: stageConf.label,
                    stageBg: stageConf.bg,
                    stageColor: stageConf.color,
                    questionCount: user.questionCount,
                    answeredCount: user.answeredCount,
                    questions: user.questions,
                    answers: user.answers,
                    rewriteUrl: user.rewriteUrl,
                    rewriteCreatedAt: user.rewriteCreatedAt
                      ? formatDate(user.rewriteCreatedAt)
                      : null,
                    submittedAt: user.submittedAt
                      ? formatDate(user.submittedAt)
                      : null,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Not started */}
      {notStarted.length > 0 && (
        <div>
          <h2 className="font-serif text-xl text-[var(--foreground)] mb-4">
            Not Started ({notStarted.length})
          </h2>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-left text-xs text-[var(--gray-600)] uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium">Plan</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {notStarted.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[var(--card-border)] last:border-0"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[var(--gray-200)] flex items-center justify-center text-[var(--gray-600)] text-xs font-medium">
                          {(user.firstName?.[0] || "").toUpperCase()}
                          {(user.lastName?.[0] || "").toUpperCase()}
                        </div>
                        <div>
                          <span className="text-[var(--foreground)]">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="block text-xs text-[var(--gray-600)]">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          user.subscriptionTier === "pro"
                            ? "bg-purple-100 text-purple-700"
                            : user.subscriptionTier === "starter"
                              ? "bg-[#ef562a]/10 text-[#ef562a]"
                              : "bg-[var(--gray-100)] text-[var(--gray-600)]"
                        }`}
                      >
                        {user.subscriptionTier}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {user.subscriptionStatus === "trialing" ? (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">
                          trial
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-50 text-green-700">
                          active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-[var(--gray-600)]">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {quizUsers.length === 0 && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--gray-100)] flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[var(--gray-600)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-[var(--foreground)]">
            No eligible users yet
          </p>
          <p className="text-sm text-[var(--gray-600)] mt-1">
            Users need an active subscription (or trial) and a resume to access
            the quiz.
          </p>
        </div>
      )}
    </div>
  );
}
