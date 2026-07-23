"use client";

import { useState } from "react";

type LeakType = "A" | "B" | "C" | "D";
type IncomeTier = 1 | 2 | 3;

interface DiagnosticQuestion {
  question: string;
  options: { text: string; emoji: string }[];
}

const LEAK_LETTERS: LeakType[] = ["A", "B", "C", "D"];

const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  {
    question: "When you picture your last genuinely productive workday, what made it possible?",
    options: [
      { text: "I finally had a clear plan and knew exactly what to work on", emoji: "🗺️" },
      { text: "My space was clean and calm so my brain wasn't fighting clutter", emoji: "🧘" },
      { text: "I didn't have to stop and deal with food, errands, or life admin", emoji: "🙌" },
      { text: "Someone else handled the small tasks so I could stay in deep work", emoji: "🤝" },
    ],
  },
  {
    question: "What is the #1 thing that quietly eats your week right now?",
    options: [
      { text: "Research, deciding what to do, and organizing my own thoughts", emoji: "🔍" },
      { text: "Cleaning, tidying, laundry, and the physical maintenance of my life", emoji: "🧹" },
      { text: "Cooking, groceries, commuting, errands", emoji: "🛒" },
      { text: "Inbox, DMs, scheduling, posting, repetitive admin and follow-ups", emoji: "📧" },
    ],
  },
  {
    question: "Be honest. What do you tell yourself when you don't outsource something?",
    options: [
      { text: "\"I can figure it out myself, I just need to sit down and think\"", emoji: "🤔" },
      { text: "\"It's not that bad, I'll get to it this weekend\"", emoji: "😅" },
      { text: "\"Paying for that feels indulgent, like I'm being lazy\"", emoji: "😬" },
      { text: "\"It's faster to just do it myself than explain it to someone\"", emoji: "💨" },
    ],
  },
  {
    question: "If a free extra hour landed in your lap tomorrow, where does it currently leak?",
    options: [
      { text: "Into overthinking and re-planning instead of executing", emoji: "💭" },
      { text: "Into resetting a messy space before I can even start", emoji: "🌀" },
      { text: "Into food and transport logistics", emoji: "⏰" },
      { text: "Into repetitive tasks that don't grow my skills or income", emoji: "🔄" },
    ],
  },
  {
    question: "What's the real bottleneck between you and your next income level?",
    options: [
      { text: "I lack clarity. I don't know the right next move", emoji: "🧭" },
      { text: "I lack focus. My environment and energy are scattered", emoji: "🔋" },
      { text: "I lack time. The day disappears into life maintenance", emoji: "⏳" },
      { text: "I lack capacity. I'm the bottleneck for every single task", emoji: "🏗️" },
    ],
  },
  {
    question: "Which sentence stings the most because it's true?",
    options: [
      { text: "\"I'm busy but I can't tell if I'm working on the right things\"", emoji: "😶" },
      { text: "\"I can't think straight in the space I'm in\"", emoji: "😵‍💫" },
      { text: "\"I'm too drained from daily life to do income-generating work\"", emoji: "😩" },
      { text: "\"I'm doing $15/hr tasks when my time is worth way more\"", emoji: "💸" },
    ],
  },
  {
    question: "What would actually change your life if it were handled for you?",
    options: [
      { text: "A thinking partner for planning, research, and decisions", emoji: "🧠" },
      { text: "Walking into a clean, reset space I didn't have to fix", emoji: "✨" },
      { text: "Never cooking or commuting on a work-heavy day again", emoji: "🍽️" },
      { text: "A person who runs my admin, inbox, and repetitive ops", emoji: "📋" },
    ],
  },
];

const INCOME_OPTIONS: { label: string; description: string; emoji: string; tier: IncomeTier }[] = [
  {
    label: "Under $3K/month",
    description: "You're building. Cash is tight and every hire has to earn its keep.",
    emoji: "🌱",
    tier: 1,
  },
  {
    label: "$3K-$10K/month",
    description: "You have some room. This is where you make your first strategic paid hire.",
    emoji: "📈",
    tier: 2,
  },
  {
    label: "$10K+/month",
    description: "Your time is your scarcest asset. If you're still doing low-leverage tasks, you're actively losing money.",
    emoji: "🚀",
    tier: 3,
  },
];

interface ResultData {
  name: string;
  subtitle: string;
  diagnosis: string;
  tiers: Record<IncomeTier, string>;
  doThisToday: string;
  color: string;
  bg: string;
  icon: string;
  summaryRow: { coreProblem: string; tier1: string; tier2: string; tier3: string };
}

const RESULTS: Record<LeakType, ResultData> = {
  A: {
    name: "The Vision Fog",
    subtitle: "Your leak is clarity",
    diagnosis:
      "You're not lazy and you're not disorganized. You're spending founder-level brainpower on junior-level thinking. You re-plan, re-research, and second-guess instead of executing. Your first hire is a junior ops brain, not a cleaner or a driver. Clarity is your unlock.",
    tiers: {
      1: "Your first hire is a $20 Perplexity membership. Use it as your research and planning partner so you stop losing hours a week deciding what to do. Give it your goals every Monday and have it draft your week's roadmap. Highest-ROI $20 you'll spend.",
      2: "Keep Perplexity as your daily ops brain and add a monthly strategy/clarity session (coach, mastermind, or advisor) so your roadmap is set by someone ahead of you. You're paying to remove decision fatigue.",
      3: "Hire an online business manager or strategist who owns your roadmap and holds you to it, plus AI for daily execution. At your level, foggy weeks cost thousands. Buy clarity as a service.",
    },
    doThisToday:
      "Open Perplexity, paste your top 3 goals, and ask it to build your next 7-day roadmap. Notice how much lighter your brain feels.",
    color: "#2563EB",
    bg: "#2563EB10",
    icon: "🧭",
    summaryRow: {
      coreProblem: "Clarity",
      tier1: "$20 Perplexity membership",
      tier2: "Perplexity + monthly strategy session",
      tier3: "Business manager / strategist + AI",
    },
  },
  B: {
    name: "The Cluttered Founder",
    subtitle: "Your leak is focus and environment",
    diagnosis:
      "Your bottleneck isn't your plan. It's that you can't think straight in your own space. You lose the first hour of every session resetting your environment before your brain will cooperate. Your first hire is a facilities team.",
    tiers: {
      1: "Book a one-time deep clean or a private task-based cleaner once a month. You don't need weekly service. You need your brain to stop fighting clutter. Pair it with a cheap AI membership to plan around your reset days.",
      2: "Move to a bi-weekly cleaner. A reset space every two weeks means you protect focus consistently, not just once a month. Your highest-leverage paid hire right now.",
      3: "Weekly cleaning is non-negotiable, and consider laundry/errand services on top. You should never touch environmental maintenance. It's the cheapest hour you'll ever buy back.",
    },
    doThisToday:
      "Book one cleaning for this week. Even a single one-time session. Notice how fast you drop into deep work afterward.",
    color: "#059669",
    bg: "#05966910",
    icon: "✨",
    summaryRow: {
      coreProblem: "Focus / environment",
      tier1: "One-time or monthly cleaner",
      tier2: "Bi-weekly cleaner",
      tier3: "Weekly cleaner + laundry / errands",
    },
  },
  C: {
    name: "The Life-Admin Trap",
    subtitle: "Your leak is time",
    diagnosis:
      "Your day disappears into cooking, groceries, and commuting before you ever touch income work. You feel guilty spending on convenience, but that guilt is costing you your most valuable hours. Your first hire is a kitchen + transport team.",
    tiers: {
      1: "You don't need daily DoorDash. Start by batch-prepping or using grocery delivery to kill your two biggest time sinks, and reserve food/ride delivery for your heaviest work days only. Protect the hours, not the luxury.",
      2: "Make food + transport delivery a standing line item on deep-work days. DoorDash is your kitchen staff. Uber is your transport team. Work from the back seat. The extra hour of deep work is what funds the next tier.",
      3: "Outsource food and transport by default, and add errand/personal-assistant help. At $10K+, an hour lost to a grocery run is an expensive hour. Never cook or commute on a work day again.",
    },
    doThisToday:
      "Look at your busiest work day this week and pre-decide: food is handled by delivery, transport is handled by a ride. Remove the decision so you don't talk yourself out of it.",
    color: "#D97706",
    bg: "#D9770610",
    icon: "⏰",
    summaryRow: {
      coreProblem: "Time",
      tier1: "Grocery delivery + batch prep",
      tier2: "Standing food + transport delivery",
      tier3: "Full outsource + PA / errands",
    },
  },
  D: {
    name: "The Human Bottleneck",
    subtitle: "Your leak is capacity",
    diagnosis:
      "You are doing $15/hr work with a founder's brain. Inbox, DMs, scheduling, posting, follow-ups. You're the bottleneck for every task, and you tell yourself it's \"faster to just do it myself.\" It isn't. Your first hire is an ops person (starting with AI, graduating to a human).",
    tiers: {
      1: "Your ops hire is AI as your junior ops person. Use it to draft emails, repurpose content, and template your repetitive tasks. Build the systems now so that when you can afford a human, you just hand them the playbook.",
      2: "Time to make your first VA hire. A few hours a week for inbox, scheduling, and admin, with AI backing them up. The classic leverage jump. Document your tasks once, hand them off, get your capacity back.",
      3: "Hire a part-time or full-time ops/executive assistant who owns your day-to-day. If you're still in your own inbox at $10K+, you're the most expensive employee in your company. Delegate everything that isn't vision, roadmap, or income-generating work.",
    },
    doThisToday:
      "List every repetitive task you did this week. Circle the ones a VA or AI could do. That circled list is your first job description.",
    color: "#DC2626",
    bg: "#DC262610",
    icon: "📋",
    summaryRow: {
      coreProblem: "Capacity",
      tier1: "AI as junior ops",
      tier2: "First VA (few hrs/week) + AI",
      tier3: "Part/full-time ops or EA",
    },
  },
};

export default function BuildYourTeamQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(-1);
  const [answers, setAnswers] = useState<number[]>([]);
  const [incomeTier, setIncomeTier] = useState<IncomeTier | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleStart = () => setCurrentQuestion(0);

  const handleDiagnosticAnswer = (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);
    if (currentQuestion < 6) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setCurrentQuestion(7);
    }
  };

  const handleIncomeAnswer = (tier: IncomeTier) => {
    setIncomeTier(tier);
    setShowResult(true);
  };

  const handleRestart = () => {
    setCurrentQuestion(-1);
    setAnswers([]);
    setIncomeTier(null);
    setShowResult(false);
  };

  const getResult = (): { leakType: LeakType; wasTied: boolean } => {
    const counts: Record<LeakType, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const answerIndex of answers) {
      counts[LEAK_LETTERS[answerIndex]]++;
    }

    const maxCount = Math.max(...Object.values(counts));
    const winners = LEAK_LETTERS.filter((l) => counts[l] === maxCount);

    if (winners.length === 1) {
      return { leakType: winners[0], wasTied: false };
    }

    const q5Answer = LEAK_LETTERS[answers[4]];
    return { leakType: q5Answer, wasTied: true };
  };

  // INTRO
  if (currentQuestion === -1) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="text-6xl mb-6">🏗️</div>
            <h2 className="font-serif text-3xl md:text-4xl mb-4">
              The Founder of Your Life{" "}
              <span className="italic text-[var(--accent)]">Quiz</span>
            </h2>
          </div>

          <div className="space-y-4 text-[var(--gray-600)] text-base mb-8">
            <p>
              I make $60K a month running my life like a startup. The founder
              sets the vision and hires people to run the day-to-day. I do the
              same.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 bg-[var(--background)] p-3 rounded-xl border border-[var(--card-border)]">
                <span className="text-xl">🤖</span>
                <span>
                  <strong className="text-[var(--foreground)]">AI</strong> is my
                  junior ops person
                </span>
              </div>
              <div className="flex items-center gap-2 bg-[var(--background)] p-3 rounded-xl border border-[var(--card-border)]">
                <span className="text-xl">✨</span>
                <span>
                  <strong className="text-[var(--foreground)]">Cleaners</strong>{" "}
                  are my facilities team
                </span>
              </div>
              <div className="flex items-center gap-2 bg-[var(--background)] p-3 rounded-xl border border-[var(--card-border)]">
                <span className="text-xl">🍽️</span>
                <span>
                  <strong className="text-[var(--foreground)]">DoorDash</strong>{" "}
                  is my kitchen staff
                </span>
              </div>
              <div className="flex items-center gap-2 bg-[var(--background)] p-3 rounded-xl border border-[var(--card-border)]">
                <span className="text-xl">🚀</span>
                <span>
                  <strong className="text-[var(--foreground)]">Uber</strong> is
                  my transport team
                </span>
              </div>
            </div>
            <p>
              None of this is a flex. It's how I buy back time. I didn't do it
              all at once. I optimized for what would do me the greatest good at
              the time.
            </p>
            <p className="text-[var(--foreground)] font-medium">
              This quiz finds your greatest-good hire right now.
            </p>
          </div>

          <div className="text-center">
            <button
              onClick={handleStart}
              className="bg-[#4d1b27] text-white px-8 py-4 rounded-full font-medium text-lg hover:bg-[#d94d25] transition-colors"
            >
              Find My First Hire
            </button>
            <p className="mt-3 text-sm text-[var(--gray-600)]">
              8 questions. Takes about 90 seconds.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // RESULT
  if (showResult && incomeTier) {
    const { leakType, wasTied } = getResult();
    const result = RESULTS[leakType];
    const tierLabel =
      incomeTier === 1
        ? "Under $3K/month"
        : incomeTier === 2
          ? "$3K-$10K/month"
          : "$10K+/month";

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Main result */}
        <div
          className="rounded-2xl p-8 md:p-12 border-2"
          style={{ borderColor: result.color, backgroundColor: result.bg }}
        >
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">{result.icon}</div>
            <p
              className="text-sm font-medium uppercase tracking-wide mb-2"
              style={{ color: result.color }}
            >
              Your Leak Type
            </p>
            <h2 className="font-serif text-3xl md:text-4xl mb-2">
              {result.name}
            </h2>
            <p className="text-[var(--gray-600)] italic">{result.subtitle}</p>
          </div>

          <div className="space-y-6 text-[var(--foreground)]">
            <p className="text-lg leading-relaxed">{result.diagnosis}</p>

            <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--card-border)]">
              <p className="text-sm font-medium text-[var(--gray-600)] mb-1">
                Your Hire ({tierLabel})
              </p>
              <p className="text-[var(--foreground)] leading-relaxed">
                {result.tiers[incomeTier]}
              </p>
            </div>

            <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--card-border)]">
              <p className="text-sm font-medium text-[var(--gray-600)] mb-1">
                Do This Today
              </p>
              <p className="text-[var(--foreground)] leading-relaxed">
                {result.doThisToday}
              </p>
            </div>
          </div>
        </div>

        {/* Tie-break note */}
        {wasTied && (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
            <p className="text-sm text-[var(--gray-600)] leading-relaxed">
              <strong className="text-[var(--foreground)]">
                Your answers were mixed.
              </strong>{" "}
              Don't try to hire for all of it at once. That's the mistake that
              keeps people stuck. We used your answer to Question 5 (the real
              income bottleneck) to pick your result. Handle that single leak
              first, stabilize, then come back and re-take the quiz for hire #2.
            </p>
          </div>
        )}

        {/* Summary table */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 md:p-8">
          <h3 className="font-serif text-xl mb-4">
            All Leak Types at a Glance
          </h3>
          <div className="space-y-4">
            {LEAK_LETTERS.map((letter) => {
              const r = RESULTS[letter];
              const isYours = letter === leakType;
              return (
                <div
                  key={letter}
                  className={`p-4 rounded-xl border ${isYours ? "border-2" : "border-[var(--card-border)]"}`}
                  style={
                    isYours
                      ? { borderColor: r.color, backgroundColor: r.bg }
                      : {}
                  }
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{r.icon}</span>
                    <span className="font-medium text-[var(--foreground)]">
                      {r.name}
                    </span>
                    {isYours && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: r.color, color: "white" }}
                      >
                        You
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-[var(--gray-600)]">
                    <div>
                      <p className="font-medium text-[var(--foreground)] mb-0.5">
                        Under $3K
                      </p>
                      <p>{r.summaryRow.tier1}</p>
                    </div>
                    <div>
                      <p className="font-medium text-[var(--foreground)] mb-0.5">
                        $3K-$10K
                      </p>
                      <p>{r.summaryRow.tier2}</p>
                    </div>
                    <div>
                      <p className="font-medium text-[var(--foreground)] mb-0.5">
                        $10K+
                      </p>
                      <p>{r.summaryRow.tier3}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Closing */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 md:p-8 text-center">
          <p className="font-serif text-lg mb-4">
            Stop acting like free labor in your own life and start acting like
            the founder who decides what deserves your time.
          </p>
          <p className="text-sm text-[var(--gray-600)] mb-4">
            You don't need a full team tomorrow. Start with one hire. Optimize
            for what does you the greatest good right now, then build from there.
          </p>
          <p className="text-sm text-[var(--gray-600)]">
            Got your result? Screenshot your hire and tag me. I want to see
            which role you're filling first.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button
            onClick={handleRestart}
            className="px-6 py-3 rounded-full border border-[var(--card-border)] text-[var(--foreground)] font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            Retake Quiz
          </button>
          <a
            href="/resources"
            className="px-6 py-3 rounded-full bg-[#4d1b27] text-white font-medium hover:bg-[#d94d25] transition-colors text-center"
          >
            Explore More Resources
          </a>
        </div>
      </div>
    );
  }

  // INCOME QUESTION (Q8)
  if (currentQuestion === 7) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 md:p-10">
          <div className="mb-8">
            <div className="flex justify-between text-sm text-[var(--gray-600)] mb-2">
              <span>Question 8 of 8</span>
              <span>Almost done!</span>
            </div>
            <div className="w-full h-2 bg-[var(--gray-100)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4d1b27] rounded-full transition-all duration-500 ease-out"
                style={{ width: "100%" }}
              />
            </div>
          </div>

          <h2 className="font-serif text-2xl md:text-3xl mb-2">
            Roughly what are you earning per month right now?
          </h2>
          <p className="text-sm text-[var(--gray-600)] mb-8">
            This decides whether your top hire is a tool or a person.
          </p>

          <div className="space-y-3">
            {INCOME_OPTIONS.map((option, index) => (
              <button
                key={index}
                onClick={() => handleIncomeAnswer(option.tier)}
                className="w-full text-left p-4 md:p-5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] hover:border-[var(--accent)] hover:bg-[#4d1b2708] transition-all group"
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl flex-shrink-0 mt-0.5">
                    {option.emoji}
                  </span>
                  <div>
                    <span className="font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                      {option.label}
                    </span>
                    <p className="text-sm text-[var(--gray-600)] mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // DIAGNOSTIC QUESTIONS (Q1-Q7)
  const question = DIAGNOSTIC_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / 8) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 md:p-10">
        <div className="mb-8">
          <div className="flex justify-between text-sm text-[var(--gray-600)] mb-2">
            <span>
              Question {currentQuestion + 1} of 8
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-[var(--gray-100)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4d1b27] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <h2 className="font-serif text-2xl md:text-3xl mb-8">
          {question.question}
        </h2>

        <div className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleDiagnosticAnswer(index)}
              className="w-full text-left p-4 md:p-5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] hover:border-[var(--accent)] hover:bg-[#4d1b2708] transition-all group"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl flex-shrink-0">{option.emoji}</span>
                <span className="text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                  {option.text}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
