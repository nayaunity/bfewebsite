"use client";

import { useState } from "react";

type StackId = 0 | 1 | 2 | 3 | 4 | 5;

interface Option {
  text: string;
  emoji: string;
  scores: Partial<Record<StackId, number>>;
}

interface Question {
  question: string;
  options: Option[];
}

interface StackResult {
  name: string;
  tools: string;
  description: string;
  income: string;
  tip: string;
  color: string;
  bg: string;
  icon: string;
}

const QUESTIONS: Question[] = [
  {
    question: "What sounds most fun to work on?",
    options: [
      { text: "Designing planners, templates, and visual products", emoji: "🎨", scores: { 0: 3, 2: 1, 5: 1 } },
      { text: "Writing emails, blog posts, and product descriptions", emoji: "✍️", scores: { 4: 3, 1: 1 } },
      { text: "Building organized systems and dashboards people can use", emoji: "🧠", scores: { 1: 3, 3: 1 } },
      { text: "Helping small businesses show up online", emoji: "📱", scores: { 5: 3, 3: 1 } },
      { text: "Creating art, graphics, and cool merch designs", emoji: "🖼️", scores: { 2: 3, 0: 1 } },
    ],
  },
  {
    question: "What kind of income are you after?",
    options: [
      { text: "Passive income. Build it once, sell it on repeat", emoji: "💰", scores: { 0: 2, 1: 2, 2: 2 } },
      { text: "Recurring monthly clients who pay me every month", emoji: "🔁", scores: { 3: 2, 5: 2 } },
      { text: "Quick freelance projects whenever I want them", emoji: "⚡", scores: { 4: 3 } },
    ],
  },
  {
    question: "How comfortable are you with technology?",
    options: [
      { text: "Total beginner. I mostly use my phone", emoji: "📱", scores: { 0: 2, 2: 2, 5: 2 } },
      { text: "I know the basics. Canva, Google Docs, that kind of thing", emoji: "💻", scores: { 0: 1, 1: 2, 4: 2, 5: 1 } },
      { text: "Pretty comfortable. I pick up new tools fast", emoji: "🚀", scores: { 1: 1, 3: 2, 4: 1 } },
    ],
  },
  {
    question: "How do you prefer to work?",
    options: [
      { text: "Solo. Just me and my laptop", emoji: "🎧", scores: { 0: 2, 1: 2, 2: 2, 4: 1 } },
      { text: "One-on-one with clients. I like building relationships", emoji: "🤝", scores: { 3: 2, 5: 2 } },
      { text: "A mix of both depending on the day", emoji: "⚖️", scores: { 4: 1, 5: 1, 3: 1, 0: 1 } },
    ],
  },
  {
    question: "What matters most to you right now?",
    options: [
      { text: "Making money while I sleep", emoji: "😴", scores: { 0: 2, 1: 2, 2: 2 } },
      { text: "Building steady monthly income I can count on", emoji: "📈", scores: { 3: 2, 5: 2 } },
      { text: "Getting paid fast for individual projects", emoji: "💸", scores: { 4: 3 } },
      { text: "Having creative freedom over my work", emoji: "✨", scores: { 2: 2, 0: 1, 5: 1 } },
    ],
  },
];

const STACKS: Record<StackId, StackResult> = {
  0: {
    name: "The Digital Product Designer",
    tools: "Canva + Etsy + Pinterest",
    description: "You create digital planners, wedding templates, social media kits, and niche design products. Start with a specific audience (real estate agents, ER nurses, dog moms) and build the exact kit they would actually pay for. Niche templates sell on repeat.",
    income: "$500 - $3,000+/month",
    tip: "Don't start with \"a template.\" Start with who it's for. The more specific, the better it sells.",
    color: "#4d1b27",
    bg: "#4d1b2710",
    icon: "🎨",
  },
  1: {
    name: "The Systems Builder",
    tools: "ChatGPT + Notion",
    description: "You build custom Notion templates and \"second brain\" systems. People pay for systems that make their lives feel less chaotic. Build the template once, then sell the same digital product over and over on Gumroad or Etsy.",
    income: "$500 - $2,500+/month",
    tip: "The best-selling Notion templates solve a specific pain. \"Student semester planner\" beats \"life dashboard\" every time.",
    color: "#2563EB",
    bg: "#2563EB10",
    icon: "🧠",
  },
  2: {
    name: "The Creative Merch Maker",
    tools: "Midjourney / Ideogram + Printify / Redbubble",
    description: "You create art, tees, mugs, and print-on-demand products using AI image tools. You make the designs. The platforms handle production, shipping, and fulfillment.",
    income: "$300 - $2,000+/month",
    tip: "Check each platform's AI content rules before listing. They change often. Focus on designs that connect with a specific community.",
    color: "#7C3AED",
    bg: "#7C3AED10",
    icon: "🖼️",
  },
  3: {
    name: "The AI Bookkeeper",
    tools: "ChatGPT + QuickBooks / Xero",
    description: "You help small business owners with AI-assisted bookkeeping. The tools handle the numbers. You bring the human side: communication, consistency, and making people feel less overwhelmed. One client can turn into $300-$800/month because bookkeeping is recurring.",
    income: "$1,000 - $5,000+/month",
    tip: "Start with 2-3 small business clients. Word of mouth in local business communities spreads fast.",
    color: "#059669",
    bg: "#05966910",
    icon: "📊",
  },
  4: {
    name: "The Freelance Writer",
    tools: "ChatGPT + Fiverr / Upwork",
    description: "You write resume rewrites, blog posts, product descriptions, and email sequences for Shopify stores. AI helps with speed. You make it sound human, clear, and useful. A lot of people are charging for writing without starting from scratch anymore.",
    income: "$500 - $3,000+/month",
    tip: "Specialize in one type of writing (Shopify product descriptions, LinkedIn bios, welcome email sequences) to charge more.",
    color: "#D97706",
    bg: "#D9770610",
    icon: "✍️",
  },
  5: {
    name: "The Social Media Manager",
    tools: "Canva + Your DMs",
    description: "You find local businesses, DM them, and manage their social media content. Most small businesses just want someone reliable who can help them show up online consistently. You can do this and charge $400-$1,200 per client.",
    income: "$800 - $3,600+/month",
    tip: "Start with businesses you already buy from. Walk in, show them what their Instagram could look like, and offer a free week.",
    color: "#DC2626",
    bg: "#DC262610",
    icon: "📱",
  },
};

export default function AIMoneyQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(-1);
  const [answers, setAnswers] = useState<number[]>([]);
  const [scores, setScores] = useState<Record<StackId, number>>({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [showResult, setShowResult] = useState(false);

  const handleStart = () => {
    setCurrentQuestion(0);
  };

  const handleAnswer = (optionIndex: number) => {
    const question = QUESTIONS[currentQuestion];
    const option = question.options[optionIndex];

    const newScores = { ...scores };
    for (const [stackId, points] of Object.entries(option.scores)) {
      newScores[Number(stackId) as StackId] += points;
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
    setScores({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    setShowResult(false);
  };

  const getWinningStack = (): StackId => {
    let maxScore = -1;
    let winner: StackId = 0;
    for (const [id, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        winner = Number(id) as StackId;
      }
    }
    return winner;
  };

  const getRunnerUp = (winner: StackId): StackId | null => {
    let maxScore = -1;
    let runnerUp: StackId | null = null;
    for (const [id, score] of Object.entries(scores)) {
      const stackId = Number(id) as StackId;
      if (stackId !== winner && score > maxScore) {
        maxScore = score;
        runnerUp = stackId;
      }
    }
    return runnerUp;
  };

  if (currentQuestion === -1) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 md:p-12 text-center">
          <div className="text-6xl mb-6">🤖</div>
          <h2 className="font-serif text-3xl md:text-4xl mb-4">
            Which AI Money Stack <span className="italic text-[#4d1b27]">fits you?</span>
          </h2>
          <p className="text-[var(--gray-600)] text-lg mb-2">
            Answer 5 quick questions to find out which AI tools + business model matches your skills, style, and goals.
          </p>
          <p className="text-[var(--gray-600)] text-sm mb-8">
            No tech knowledge required. Takes about 60 seconds.
          </p>
          <button
            onClick={handleStart}
            className="bg-[#4d1b27] text-white px-8 py-4 rounded-full font-medium text-lg hover:bg-[#d94d25] transition-colors"
          >
            Start the Quiz
          </button>
        </div>
      </div>
    );
  }

  if (showResult) {
    const winnerId = getWinningStack();
    const winner = STACKS[winnerId];
    const runnerUpId = getRunnerUp(winnerId);
    const runnerUp = runnerUpId !== null ? STACKS[runnerUpId] : null;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div
          className="rounded-2xl p-8 md:p-12 border-2"
          style={{ borderColor: winner.color, backgroundColor: winner.bg }}
        >
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">{winner.icon}</div>
            <p className="text-sm font-medium uppercase tracking-wide mb-2" style={{ color: winner.color }}>
              Your Best Fit
            </p>
            <h2 className="font-serif text-3xl md:text-4xl mb-2">{winner.name}</h2>
            <p className="text-lg font-medium" style={{ color: winner.color }}>
              {winner.tools}
            </p>
          </div>

          <div className="space-y-6 text-[var(--foreground)]">
            <p className="text-lg leading-relaxed">{winner.description}</p>

            <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--card-border)]">
              <p className="text-sm font-medium text-[var(--gray-600)] mb-1">Potential Income</p>
              <p className="text-2xl font-bold" style={{ color: winner.color }}>{winner.income}</p>
            </div>

            <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--card-border)]">
              <p className="text-sm font-medium text-[var(--gray-600)] mb-1">Pro Tip</p>
              <p className="text-[var(--foreground)]">{winner.tip}</p>
            </div>
          </div>
        </div>

        {runnerUp && (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
            <p className="text-sm font-medium text-[var(--gray-600)] mb-3">Also worth exploring</p>
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

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button
            onClick={handleRestart}
            className="px-6 py-3 rounded-full border border-[var(--card-border)] text-[var(--foreground)] font-medium hover:border-[#4d1b27] hover:text-[#4d1b27] transition-colors"
          >
            Retake Quiz
          </button>
          <a
            href="/blog"
            className="px-6 py-3 rounded-full bg-[#4d1b27] text-white font-medium hover:bg-[#d94d25] transition-colors text-center"
          >
            Read More on the Blog
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
              className="w-full text-left p-4 md:p-5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] hover:border-[#4d1b27] hover:bg-[#4d1b2708] transition-all group"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl flex-shrink-0">{option.emoji}</span>
                <span className="text-[var(--foreground)] group-hover:text-[#4d1b27] transition-colors">
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
