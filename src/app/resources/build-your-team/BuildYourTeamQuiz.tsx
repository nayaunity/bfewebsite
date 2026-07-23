"use client";

import { useState } from "react";

type RoleId = 0 | 1 | 2 | 3 | 4;

interface Option {
  text: string;
  emoji: string;
  scores: Partial<Record<RoleId, number>>;
}

interface Question {
  question: string;
  options: Option[];
}

interface RoleResult {
  name: string;
  subtitle: string;
  tools: string;
  cost: string;
  description: string;
  tip: string;
  color: string;
  bg: string;
  icon: string;
}

const QUESTIONS: Question[] = [
  {
    question: "What drains the most of your time outside of actual work?",
    options: [
      { text: "Researching, planning, and making decisions", emoji: "🔍", scores: { 0: 3, 4: 1 } },
      { text: "Cleaning, organizing, and maintaining my space", emoji: "🧹", scores: { 1: 3 } },
      { text: "Cooking, grocery shopping, and meal prep", emoji: "🍳", scores: { 2: 3 } },
      { text: "Driving, commuting, and dealing with my car", emoji: "🚗", scores: { 3: 3 } },
      { text: "Scheduling, emails, and admin tasks", emoji: "📧", scores: { 4: 3, 0: 1 } },
    ],
  },
  {
    question: "When you finally get a free Saturday, how do you usually spend it?",
    options: [
      { text: "Deep cleaning and organizing the whole place", emoji: "🏠", scores: { 1: 3 } },
      { text: "Running errands, grocery store, meal prepping", emoji: "🛒", scores: { 2: 2, 3: 1 } },
      { text: "Catching up on emails, scheduling, and planning", emoji: "💻", scores: { 4: 3 } },
      { text: "Trying to research or figure something out I've been putting off", emoji: "📚", scores: { 0: 3 } },
      { text: "Driving around handling everything on my to-do list", emoji: "📋", scores: { 3: 3, 2: 1 } },
    ],
  },
  {
    question: "If someone handed you 2 extra hours right now, you'd:",
    options: [
      { text: "Work on a business idea or income-generating project", emoji: "💡", scores: { 0: 2, 4: 2 } },
      { text: "Actually relax without my apartment stressing me out", emoji: "😮‍💨", scores: { 1: 3 } },
      { text: "Skip cooking and put that time into something that matters", emoji: "⏰", scores: { 2: 3 } },
      { text: "Go somewhere without worrying about traffic or parking", emoji: "🚶", scores: { 3: 3 } },
      { text: "Knock out the admin and scheduling I keep putting off", emoji: "✅", scores: { 4: 3 } },
    ],
  },
  {
    question: "What frustrates you the most about your daily routine?",
    options: [
      { text: "I waste time on research and decisions that should be faster", emoji: "😤", scores: { 0: 3 } },
      { text: "My space is always cluttered and it kills my focus", emoji: "😵", scores: { 1: 3 } },
      { text: "I spend way too long on food. Shopping, cooking, cleanup", emoji: "😩", scores: { 2: 3 } },
      { text: "My commute and driving drain my best energy", emoji: "😴", scores: { 3: 3 } },
      { text: "I'm buried in busywork when I should be doing high-leverage stuff", emoji: "🤯", scores: { 4: 3, 0: 1 } },
    ],
  },
  {
    question: "How do you feel about paying to get your time back?",
    options: [
      { text: "I'm on a tight budget. Give me the cheapest option first", emoji: "💵", scores: { 0: 3 } },
      { text: "I'd pay for it if it gives me back real, productive time", emoji: "⚖️", scores: { 1: 2, 2: 2 } },
      { text: "I already spend on some convenience. I want to be smarter about it", emoji: "🧠", scores: { 2: 1, 3: 2, 4: 1 } },
      { text: "Take my money. I just want my time back", emoji: "💸", scores: { 3: 2, 4: 2 } },
    ],
  },
];

const ROLES: Record<RoleId, RoleResult> = {
  0: {
    name: "Your AI Ops Intern",
    subtitle: "The cheapest, highest-impact first hire",
    tools: "ChatGPT (free) + Perplexity ($20/mo) + Claude",
    cost: "$0 - $20/month",
    description: "Your first team member doesn't even need a salary. AI handles research, planning, admin, and decision-making for the cost of a lunch. Stop spending 3 hours comparing options or planning your week manually. Hand it to your AI intern and get a summary in 5 minutes.",
    tip: "Start with one task you repeat every week (meal planning, research, scheduling) and hand it to AI. Once you see how much time it saves, you'll wonder why you waited.",
    color: "#2563EB",
    bg: "#2563EB10",
    icon: "🤖",
  },
  1: {
    name: "Your Facilities Team",
    subtitle: "Protect your mental bandwidth",
    tools: "TaskRabbit + local cleaning service",
    cost: "$80 - $200/month",
    description: "A messy space drains your energy before you even start working. Hiring a cleaning service 1-2x a month isn't a luxury. It's protecting your focus. When your space is handled, you're not fighting clutter for mental bandwidth. You're sitting down in a clean room, ready to do real work.",
    tip: "Start with just 1x/month through TaskRabbit or a local service. Even that one session resets your environment and gives you a clean slate to think from.",
    color: "#059669",
    bg: "#05966910",
    icon: "✨",
  },
  2: {
    name: "Your Kitchen Staff",
    subtitle: "Stop trading dinner for dollars",
    tools: "DoorDash + meal prep services + grocery delivery",
    cost: "$200 - $500/month",
    description: "Cooking takes 1-2 hours a day when you factor in planning, shopping, cooking, and cleanup. That's 7-14 hours a week. If even half of that time goes toward work that generates income or builds your skills, the math works in your favor. This is not about being lazy. It's about doing the math on what your time is actually worth.",
    tip: "You don't need to DoorDash every meal. Start by outsourcing dinner 3-4 nights a week. That's your highest-energy hours protected for work that actually pays.",
    color: "#D97706",
    bg: "#D9770610",
    icon: "🍽️",
  },
  3: {
    name: "Your Transport Team",
    subtitle: "Turn dead time into deep work",
    tools: "Uber + Lyft",
    cost: "$200 - $500/month",
    description: "No car payment, no insurance, no gas, no parking stress, no maintenance. And here's the real unlock: you work from the backseat. Every ride becomes a mobile office. That commute time stops being dead time and starts being productive time. I personally don't have a car, and that decision alone protects an extra hour of deep work per day.",
    tip: "Track what you spend on your car monthly (payment, insurance, gas, parking, maintenance). You might find Uber is actually cheaper. And you get your time and energy back.",
    color: "#7C3AED",
    bg: "#7C3AED10",
    icon: "🚀",
  },
  4: {
    name: "Your Executive Assistant",
    subtitle: "Stop doing $15/hour work",
    tools: "Virtual assistant (Belay, Time Etc) + AI scheduling tools",
    cost: "$300 - $800/month",
    description: "If you're spending your days coordinating, emailing, scheduling, and doing admin, you're doing $15/hour work when you should be doing $100+/hour work. A virtual assistant handles the coordination so you can focus on the work that actually moves the needle. The ROI on this hire pays for itself the first week.",
    tip: "Start by logging every task you do for a week that doesn't require YOUR brain specifically. That list becomes your VA's job description.",
    color: "#DC2626",
    bg: "#DC262610",
    icon: "📋",
  },
};

const INCOME_TIERS = [
  { range: "Under $3K/month", hires: "Start here: AI tools (free-$20/mo). Your highest ROI first hire.", color: "#2563EB" },
  { range: "$3K - $5K/month", hires: "Add: Cleaning service 1-2x/month ($80-150). Protecting your focus pays for itself.", color: "#059669" },
  { range: "$5K - $10K/month", hires: "Add: Meal delivery 3-4x/week + rideshare for commutes. Reclaim 10+ hours/week.", color: "#D97706" },
  { range: "$10K+/month", hires: "Add: Virtual assistant + stack multiple hires. You're running a full team now.", color: "#DC2626" },
];

export default function BuildYourTeamQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(-1);
  const [answers, setAnswers] = useState<number[]>([]);
  const [scores, setScores] = useState<Record<RoleId, number>>({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 });
  const [showResult, setShowResult] = useState(false);

  const handleStart = () => {
    setCurrentQuestion(0);
  };

  const handleAnswer = (optionIndex: number) => {
    const question = QUESTIONS[currentQuestion];
    const option = question.options[optionIndex];

    const newScores = { ...scores };
    for (const [roleId, points] of Object.entries(option.scores)) {
      newScores[Number(roleId) as RoleId] += points;
    }
    setScores(newScores);
    setAnswers([...answers, optionIndex]);

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(-1);
    setAnswers([]);
    setScores({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 });
    setShowResult(false);
  };

  const getWinningRole = (): RoleId => {
    let maxScore = -1;
    let winner: RoleId = 0;
    for (const [id, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        winner = Number(id) as RoleId;
      }
    }
    return winner;
  };

  const getRunnerUp = (winner: RoleId): RoleId | null => {
    let maxScore = -1;
    let runnerUp: RoleId | null = null;
    for (const [id, score] of Object.entries(scores)) {
      const roleId = Number(id) as RoleId;
      if (roleId !== winner && score > maxScore) {
        maxScore = score;
        runnerUp = roleId;
      }
    }
    return runnerUp;
  };

  if (currentQuestion === -1) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 md:p-12 text-center">
          <div className="text-6xl mb-6">🏗️</div>
          <h2 className="font-serif text-3xl md:text-4xl mb-4">
            What should your <span className="italic text-[var(--accent)]">first hire</span> be?
          </h2>
          <p className="text-[var(--gray-600)] text-lg mb-2">
            I make $60K/month running my life like a startup. Answer 5 quick questions to find out which "team member" would give YOU the biggest time ROI right now.
          </p>
          <p className="text-[var(--gray-600)] text-sm mb-8">
            No fancy flex. Just math on what your time is worth. Takes about 60 seconds.
          </p>
          <button
            onClick={handleStart}
            className="bg-[#4d1b27] text-white px-8 py-4 rounded-full font-medium text-lg hover:bg-[#d94d25] transition-colors"
          >
            Build My Team
          </button>
        </div>
      </div>
    );
  }

  if (showResult) {
    const winnerId = getWinningRole();
    const winner = ROLES[winnerId];
    const runnerUpId = getRunnerUp(winnerId);
    const runnerUp = runnerUpId !== null ? ROLES[runnerUpId] : null;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div
          className="rounded-2xl p-8 md:p-12 border-2"
          style={{ borderColor: winner.color, backgroundColor: winner.bg }}
        >
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">{winner.icon}</div>
            <p className="text-sm font-medium uppercase tracking-wide mb-2" style={{ color: winner.color }}>
              Your First Hire
            </p>
            <h2 className="font-serif text-3xl md:text-4xl mb-2">{winner.name}</h2>
            <p className="text-[var(--gray-600)] italic mb-3">{winner.subtitle}</p>
            <p className="text-lg font-medium" style={{ color: winner.color }}>
              {winner.tools}
            </p>
          </div>

          <div className="space-y-6 text-[var(--foreground)]">
            <p className="text-lg leading-relaxed">{winner.description}</p>

            <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--card-border)]">
              <p className="text-sm font-medium text-[var(--gray-600)] mb-1">Investment</p>
              <p className="text-2xl font-bold" style={{ color: winner.color }}>{winner.cost}</p>
            </div>

            <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--card-border)]">
              <p className="text-sm font-medium text-[var(--gray-600)] mb-1">How to Start</p>
              <p className="text-[var(--foreground)]">{winner.tip}</p>
            </div>
          </div>
        </div>

        {runnerUp && (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
            <p className="text-sm font-medium text-[var(--gray-600)] mb-3">Your next hire after that</p>
            <div className="flex items-start gap-4">
              <span className="text-3xl">{runnerUp.icon}</span>
              <div>
                <h3 className="font-serif text-xl">{runnerUp.name}</h3>
                <p className="text-sm font-medium mb-1" style={{ color: runnerUp.color }}>{runnerUp.tools}</p>
                <p className="text-sm text-[var(--gray-600)]">{runnerUp.description}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 md:p-8">
          <h3 className="font-serif text-xl mb-4">The Full Roadmap: Who to Hire at Every Income Level</h3>
          <div className="space-y-4">
            {INCOME_TIERS.map((tier, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: tier.color }}
                />
                <div>
                  <p className="font-medium text-[var(--foreground)]">{tier.range}</p>
                  <p className="text-sm text-[var(--gray-600)]">{tier.hires}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

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

  const question = QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 md:p-10">
        <div className="mb-8">
          <div className="flex justify-between text-sm text-[var(--gray-600)] mb-2">
            <span>Question {currentQuestion + 1} of {QUESTIONS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-[var(--gray-100)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4d1b27] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <h2 className="font-serif text-2xl md:text-3xl mb-8">{question.question}</h2>

        <div className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
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
