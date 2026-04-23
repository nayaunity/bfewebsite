"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ROLE_OPTIONS } from "@/lib/role-options";

const TOTAL_STEPS = 22;

const JOB_PRIORITIES = [
  "Work-life balance", "Meaningful work", "Experienced leaders",
  "Top investors", "Wear many hats", "Great benefits",
  "Stable company", "Work with smart people", "Challenging work",
  "Growing fast", "Cool startup", "Innovative technology", "Great pay",
];

const TIMELINE_OPTIONS = [
  { label: "1 month", subtitle: "Need a job asap!", icon: "⚡" },
  { label: "3 months", subtitle: "I have some time", icon: "📅" },
  { label: "6 months", subtitle: "Maximize my options", icon: "🌐" },
  { label: "12 months+", subtitle: "I'm open to anything", icon: "📆" },
];

const EXPERIENCE_LEVELS = [
  { label: "Internship", subtitle: "Not yet graduated" },
  { label: "Entry Level & Graduate", subtitle: "0 years, some internship experience" },
  { label: "Junior (1-2 years)", subtitle: "" },
  { label: "Mid Level (3-5 years)", subtitle: "" },
  { label: "Senior (6-9 years)", subtitle: "" },
  { label: "Expert & Leadership (10+ years)", subtitle: "" },
];

const LOCATIONS = [
  "Remote US", "New York", "San Francisco", "Austin", "Chicago",
  "Los Angeles", "Seattle", "Denver", "Boston", "Atlanta",
  "Miami", "Washington DC",
];

const GOALS = [
  { label: "Land a job ASAP", icon: "⏰" },
  { label: "Make more money", icon: "💰" },
  { label: "Land my dream job", icon: "👍" },
  { label: "Change careers/industries", icon: "🔄" },
];

const BLOCKERS = [
  { label: "Can't land interviews", icon: "😞" },
  { label: "Lack of great job offers", icon: "💡" },
  { label: "Not applying enough", icon: "📧" },
  { label: "Not ready yet", icon: "📝" },
  { label: "Something else", icon: "" },
];

interface WizardData {
  lookingForJob: string;
  priorities: string[];
  triedOtherApps: string;
  timeline: string;
  interviewGoal: number;
  roles: string[];
  experience: string[];
  locations: string[];
  minSalary: number;
  goal: string;
  blocker: string;
  firstName: string;
  lastName: string;
}

export default function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({
    lookingForJob: "",
    priorities: [],
    triedOtherApps: "",
    timeline: "",
    interviewGoal: 10,
    roles: [],
    experience: [],
    locations: [],
    minSalary: 80000,
    goal: "",
    blocker: "",
    firstName: "",
    lastName: "",
  });
  const [showMoreLocations, setShowMoreLocations] = useState(false);

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  const next = useCallback(() => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  }, [step]);

  const back = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  // Auto-advance from the "Creating plan" step after animation
  useEffect(() => {
    if (step === 15) {
      const timer = setTimeout(() => {
        next();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [step, next]);

  const canAdvance = useCallback((): boolean => {
    switch (step) {
      case 0: return !!data.lookingForJob;
      case 1: return data.priorities.length >= 1;
      case 2: return !!data.triedOtherApps;
      case 3: return true;
      case 4: return !!data.timeline;
      case 5: return true;
      case 6: return true;
      case 7: return data.roles.length > 0;
      case 8: return data.experience.length > 0;
      case 9: return data.locations.length > 0;
      case 10: return true;
      case 11: return true;
      case 12: return !!data.goal;
      case 13: return !!data.blocker;
      case 14: return true;
      case 15: return false; // auto-advances
      default: return true;
    }
  }, [step, data]);

  const toggleArray = (key: keyof WizardData, value: string, max?: number) => {
    setData((prev) => {
      const arr = prev[key] as string[];
      if (arr.includes(value)) {
        return { ...prev, [key]: arr.filter((v) => v !== value) };
      }
      if (max && arr.length >= max) return prev;
      return { ...prev, [key]: [...arr, value] };
    });
  };

  const handleCreateAccount = () => {
    localStorage.setItem("onboarding_data", JSON.stringify(data));
    sessionStorage.setItem("onboarding_data", JSON.stringify(data));
    window.location.href = "/auth/signin?callbackUrl=" + encodeURIComponent("/profile?onboarding=complete");
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderProgressBar = () => (
    <div className="flex items-center gap-3 mb-8">
      {step > 0 && (
        <button
          onClick={back}
          className="flex items-center gap-1 text-sm text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors px-2 py-1 rounded-lg hover:bg-[var(--gray-50)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}
      <div className="flex-1 h-1.5 bg-[var(--gray-100)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--foreground)] rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );

  const renderNextButton = (label = "Next", onClick?: () => void) => (
    <button
      onClick={onClick || next}
      disabled={!canAdvance()}
      className={`w-full py-4 text-base font-medium rounded-xl transition-all ${
        canAdvance()
          ? "bg-[var(--foreground)] text-[var(--background)] hover:opacity-90"
          : "bg-[var(--gray-100)] text-[var(--gray-600)] cursor-not-allowed"
      }`}
    >
      {label}
    </button>
  );

  const renderYesNo = (key: keyof WizardData) => (
    <div className="space-y-3">
      {["Yes", "No"].map((opt) => (
        <button
          key={opt}
          onClick={() => { setData((p) => ({ ...p, [key]: opt })); setTimeout(next, 300); }}
          className={`w-full py-4 px-6 rounded-xl border text-base font-medium flex items-center justify-center gap-2 transition-all ${
            data[key] === opt
              ? "border-[#ef562a] bg-[#ef562a]/5 text-[#ef562a]"
              : "border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--gray-200)]"
          }`}
        >
          {opt === "Yes" ? "👍" : "✖"} {opt}
        </button>
      ))}
    </div>
  );

  const renderCards = (options: Array<{label: string; subtitle?: string; icon?: string}>, key: keyof WizardData) => (
    <div className="space-y-3">
      {options.map((opt) => (
        <button
          key={opt.label}
          onClick={() => { setData((p) => ({ ...p, [key]: opt.label })); setTimeout(next, 300); }}
          className={`w-full py-4 px-6 rounded-xl border text-left transition-all ${
            data[key] === opt.label
              ? "border-[#ef562a] bg-[#ef562a]/5"
              : "border-[var(--card-border)] hover:border-[var(--gray-200)]"
          }`}
        >
          <div className="flex items-center gap-3">
            {opt.icon && <span className="text-lg">{opt.icon}</span>}
            <div>
              <p className="font-medium text-[var(--foreground)]">{opt.label}</p>
              {opt.subtitle && <p className="text-sm text-[var(--gray-600)]">{opt.subtitle}</p>}
            </div>
          </div>
        </button>
      ))}
    </div>
  );

  // ============================================================================
  // STEP RENDERS
  // ============================================================================

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <h1 className="font-serif text-3xl md:text-4xl text-center text-[var(--foreground)] mb-8">
              Are you looking for a new job?
            </h1>
            {renderYesNo("lookingForJob")}
          </>
        );

      case 1: {
        const maxReached = data.priorities.length >= 3;
        return (
          <>
            <h1 className="font-serif text-3xl md:text-4xl text-center text-[var(--foreground)] mb-2">
              What&apos;s most important in a new job?
            </h1>
            <p className="text-center text-[var(--gray-600)] mb-6">Choose up to 3</p>
            <div className="flex flex-wrap justify-center gap-2">
              {JOB_PRIORITIES.map((p) => {
                const selected = data.priorities.includes(p);
                const disabled = maxReached && !selected;
                return (
                  <button
                    key={p}
                    onClick={() => toggleArray("priorities", p, 3)}
                    disabled={disabled}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                      selected
                        ? "border-[#ef562a] bg-[#ef562a]/5 text-[#ef562a]"
                        : disabled
                          ? "border-[var(--card-border)] text-[var(--gray-200)] cursor-not-allowed opacity-40"
                          : "border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--gray-200)]"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </>
        );
      }

      case 2:
        return (
          <>
            <h1 className="font-serif text-3xl md:text-4xl text-center text-[var(--foreground)] mb-8">
              Have you tried other job search apps?
            </h1>
            {renderYesNo("triedOtherApps")}
          </>
        );

      case 3:
        return (
          <>
            <h1 className="font-serif text-3xl md:text-4xl text-center text-[var(--foreground)] mb-6">
              Our goal is to help you land a great job <span className="text-[#ef562a]">10x faster</span>.
            </h1>
            <div className="bg-[var(--gray-50)] rounded-2xl p-6 border border-[var(--card-border)]">
              <p className="text-sm font-medium text-[var(--foreground)] mb-4">Job Offers</p>
              <div className="h-32 flex items-end justify-between gap-2">
                <div className="flex-1 bg-red-200 rounded-t-lg" style={{ height: "30%" }} />
                <div className="flex-1 bg-red-200 rounded-t-lg" style={{ height: "35%" }} />
                <div className="flex-1 bg-red-200 rounded-t-lg" style={{ height: "40%" }} />
                <div className="flex-1 bg-[#ef562a] rounded-t-lg" style={{ height: "55%" }} />
                <div className="flex-1 bg-[#ef562a] rounded-t-lg" style={{ height: "70%" }} />
                <div className="flex-1 bg-[#ef562a] rounded-t-lg" style={{ height: "90%" }} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-[var(--gray-600)]">
                <span>Month 0</span>
                <span>Month 3</span>
              </div>
              <div className="flex justify-between mt-1 text-xs">
                <span className="text-red-400">Traditional Job Search</span>
                <span className="text-[#ef562a] font-medium">the<span className="font-bold">BFE</span></span>
              </div>
              <p className="text-sm text-[var(--gray-600)] mt-4 text-center">
                Interviews are usually delayed at first, but after 1 week the results are clear.
              </p>
            </div>
          </>
        );

      case 4:
        return (
          <>
            <h1 className="font-serif text-3xl md:text-4xl text-center text-[var(--foreground)] mb-2">
              When do you need a new job?
            </h1>
            <p className="text-center text-[var(--gray-600)] mb-6">This will be used to calibrate your custom plan.</p>
            {renderCards(TIMELINE_OPTIONS, "timeline")}
          </>
        );

      case 5:
        return (
          <>
            <h1 className="font-serif text-3xl md:text-4xl text-center text-[var(--foreground)] mb-2">
              How many interviews would you like?
            </h1>
            <p className="text-center text-[var(--gray-600)] mb-8">It takes about 10 interviews to get 1 offer.</p>
            <div className="text-center mb-2">
              <p className="text-5xl font-bold text-[var(--foreground)]">{data.interviewGoal} interviews</p>
              <p className="text-[var(--gray-600)] mt-1">&#8776; {Math.round(data.interviewGoal * 50)} applications</p>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              value={data.interviewGoal}
              onChange={(e) => setData((p) => ({ ...p, interviewGoal: parseInt(e.target.value) }))}
              className="w-full h-2 bg-[var(--gray-100)] rounded-lg appearance-none cursor-pointer accent-[var(--foreground)]"
            />
          </>
        );

      case 6:
        return (
          <div className="text-center">
            <h1 className="font-serif text-4xl md:text-5xl text-[var(--foreground)] mb-4">
              Getting<br />
              <span className="text-[#ef562a]">{data.interviewGoal} interviews</span> is<br />
              totally achievable!
            </h1>
            <p className="text-[var(--gray-600)]">
              Based on our data, it takes ~{Math.round(data.interviewGoal * 50)} applications
            </p>
          </div>
        );

      case 7:
        return (
          <>
            <h1 className="font-serif text-3xl md:text-4xl text-center text-[var(--foreground)] mb-2">
              What kind of jobs are you looking for?
            </h1>
            <p className="text-center text-[var(--gray-600)] mb-6">Select all that apply</p>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {ROLE_OPTIONS.map((role) => {
                const selected = data.roles.includes(role.label);
                return (
                  <button
                    key={role.label}
                    onClick={() => toggleArray("roles", role.label)}
                    className={`w-full py-3 px-4 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      selected
                        ? "border-[#ef562a] bg-[#ef562a]/5"
                        : "border-[var(--card-border)] hover:border-[var(--gray-200)]"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      selected ? "border-[#ef562a] bg-[#ef562a]" : "border-[var(--gray-200)]"
                    }`}>
                      {selected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-[var(--foreground)]">{role.label}</p>
                      <p className="text-xs text-[var(--gray-600)]">{role.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        );

      case 8:
        return (
          <>
            <h1 className="font-serif text-3xl md:text-4xl text-center text-[var(--foreground)] mb-2">
              How much experience do you have?
            </h1>
            <p className="text-center text-[var(--gray-600)] mb-6">Choose up to 2</p>
            <div className="space-y-3">
              {EXPERIENCE_LEVELS.map((exp) => {
                const selected = (data.experience as string[]).includes(exp.label);
                return (
                  <button
                    key={exp.label}
                    onClick={() => toggleArray("experience", exp.label, 2)}
                    className={`w-full py-4 px-6 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      selected
                        ? "border-[#ef562a] bg-[#ef562a]/5"
                        : "border-[var(--card-border)] hover:border-[var(--gray-200)]"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      selected ? "border-[#ef562a] bg-[#ef562a]" : "border-[var(--gray-200)]"
                    }`}>
                      {selected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-[var(--foreground)]">{exp.label}</span>
                      {exp.subtitle && <p className="text-xs text-[var(--gray-600)]">{exp.subtitle}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        );

      case 9: {
        const visibleLocations = showMoreLocations ? LOCATIONS : LOCATIONS.slice(0, 5);
        return (
          <>
            <h1 className="font-serif text-3xl md:text-4xl text-center text-[var(--foreground)] mb-6">
              Where do you want to work?
            </h1>
            <div className="space-y-3">
              {visibleLocations.map((loc) => {
                const selected = data.locations.includes(loc);
                return (
                  <button
                    key={loc}
                    onClick={() => toggleArray("locations", loc)}
                    className={`w-full py-4 px-6 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      selected
                        ? "border-[#ef562a] bg-[#ef562a]/5"
                        : "border-[var(--card-border)] hover:border-[var(--gray-200)]"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      selected ? "border-[#ef562a] bg-[#ef562a]" : "border-[var(--gray-200)]"
                    }`}>
                      {selected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium text-[var(--foreground)]">{loc}</span>
                  </button>
                );
              })}
            </div>
            {!showMoreLocations && (
              <button
                onClick={() => setShowMoreLocations(true)}
                className="w-full mt-3 text-sm text-[#ef562a] hover:underline text-center"
              >
                View More Locations
              </button>
            )}
          </>
        );
      }

      case 10:
        return (
          <>
            <h1 className="font-serif text-3xl md:text-4xl text-center text-[var(--foreground)] mb-2">
              Minimum annual base salary?
            </h1>
            <p className="text-center text-[var(--gray-600)] mb-8">This will only be used to match you with the right jobs.</p>
            <p className="text-5xl font-bold text-center text-[var(--foreground)] mb-4">
              ${(data.minSalary / 1000).toFixed(0)}k/yr
            </p>
            <input
              type="range"
              min={30000}
              max={300000}
              step={5000}
              value={data.minSalary}
              onChange={(e) => setData((p) => ({ ...p, minSalary: parseInt(e.target.value) }))}
              className="w-full h-2 bg-[var(--gray-100)] rounded-lg appearance-none cursor-pointer accent-[var(--foreground)]"
            />
          </>
        );

      case 11:
        return (
          <>
            <h1 className="font-serif text-3xl md:text-4xl text-center text-[var(--foreground)] mb-6">
              Land <span className="text-[#ef562a]">10x more interviews</span> with theBFE
            </h1>
            <div className="bg-[var(--gray-50)] rounded-2xl p-6 border border-[var(--card-border)]">
              <div className="flex justify-center gap-4 mb-4">
                <div className="bg-[var(--gray-100)] rounded-xl p-4 text-center flex-1">
                  <p className="text-xs text-[var(--gray-600)] mb-2">Without theBFE</p>
                  <div className="h-16 bg-[var(--gray-200)] rounded-lg" />
                </div>
                <div className="bg-[#ef562a] rounded-xl p-4 text-center flex-1">
                  <p className="text-xs text-white/70 mb-2">With theBFE</p>
                  <p className="text-2xl font-bold text-white">10x</p>
                  <p className="text-xs text-white/70">more interviews</p>
                </div>
              </div>
              <p className="text-sm text-[var(--gray-600)] text-center">
                We apply to far more high-match jobs than you could on your own, dramatically increasing your interview rate.
              </p>
            </div>
          </>
        );

      case 12:
        return (
          <>
            <h1 className="font-serif text-3xl md:text-4xl text-center text-[var(--foreground)] mb-2">
              What&apos;s your goal?
            </h1>
            <p className="text-center text-[var(--gray-600)] mb-6">This will be used to match you with the right jobs.</p>
            {renderCards(GOALS, "goal")}
          </>
        );

      case 13:
        return (
          <>
            <h1 className="font-serif text-3xl md:text-4xl text-center text-[var(--foreground)] mb-2">
              What&apos;s stopping you from reaching your goals?
            </h1>
            <p className="text-center text-[var(--gray-600)] mb-6">This will be used to match you with the right jobs.</p>
            {renderCards(BLOCKERS, "blocker")}
          </>
        );

      case 14: {
        const months = ({ "1 month": 1, "3 months": 3, "6 months": 6, "12 months+": 12 } as Record<string, number>)[data.timeline] || 3;
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() + months);
        const dateStr = targetDate.toLocaleDateString("en-US", { month: "long", day: "numeric" });
        return (
          <>
            <h1 className="font-serif text-3xl md:text-4xl text-center text-[var(--foreground)] mb-6">
              You have great potential to <span className="text-[#ef562a]">crush your goal</span>
            </h1>
            <div className="bg-[var(--gray-50)] rounded-2xl p-6 border border-[var(--card-border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--foreground)]">Interviews</span>
                <span className="text-xs font-medium text-[#ef562a] bg-[#ef562a]/10 px-2 py-1 rounded">{dateStr} - Offer</span>
              </div>
              <div className="h-24 flex items-end gap-1">
                {[15, 20, 30, 45, 60, 80, 95].map((h, i) => (
                  <div key={i} className="flex-1 bg-[#ef562a]/20 rounded-t" style={{ height: `${h}%` }}>
                    <div className="w-full bg-[#ef562a]/40 rounded-t" style={{ height: "60%" }} />
                  </div>
                ))}
              </div>
              <p className="text-sm text-[var(--gray-600)] mt-4 text-center">
                Interviews are usually delayed at first, but after 1 week you can start getting lots of interest!
              </p>
            </div>
          </>
        );
      }

      // Creating plan — animated loading
      case 15:
        return (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 bg-[var(--gray-50)] rounded-2xl px-8 py-5 border border-[var(--card-border)] mb-10">
              <div className="font-serif text-xl font-bold">
                the<span className="text-[#ef562a]">BFE</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#ef562a] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-[#ef562a] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-[#ef562a] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
            <h2 className="font-serif text-2xl text-[var(--foreground)] mb-3">
              Creating your custom plan...
            </h2>
            <p className="text-[var(--gray-600)] text-sm">
              Analyzing your preferences to find the best matches
            </p>
            <div className="mt-8 max-w-xs mx-auto">
              <div className="h-1.5 bg-[var(--gray-100)] rounded-full overflow-hidden">
                <div className="h-full bg-[#ef562a] rounded-full animate-[loading_3s_ease-in-out_forwards]" />
              </div>
            </div>
            <style jsx>{`
              @keyframes loading {
                0% { width: 0%; }
                50% { width: 70%; }
                100% { width: 100%; }
              }
            `}</style>
          </div>
        );

      case 16:
        return (
          <>
            <p className="text-xs font-medium text-[var(--gray-600)] uppercase tracking-wider text-center mb-4">HOW IT WORKS</p>
            <h1 className="font-serif text-3xl md:text-4xl text-center text-[var(--foreground)] mb-2">
              BFE finds + matches you to the best jobs
            </h1>
            <p className="text-center text-[var(--gray-600)] mb-6">
              Our system scans job listings across the web — uncovering roles that match your skills, goals, and pay range.
            </p>
            <div className="bg-[var(--gray-50)] rounded-2xl p-6 border border-[var(--card-border)]">
              <div className="flex gap-2 text-xs mb-4">
                <span className="font-medium text-[var(--foreground)]">Job Matches</span>
                <span className="text-[var(--gray-600)]">&gt;</span>
                <span className="text-[var(--gray-600)]">Applying</span>
                <span className="text-[var(--gray-600)]">&gt;</span>
                <span className="text-[var(--gray-600)]">Applied</span>
              </div>
              <div className="space-y-3">
                <div className="bg-[var(--background)] rounded-lg p-3 border border-[var(--card-border)] flex justify-between">
                  <div className="space-y-1"><div className="h-2 w-32 bg-[var(--gray-200)] rounded" /><div className="h-2 w-24 bg-[var(--gray-100)] rounded" /></div>
                  <span className="text-xs font-medium text-green-600">96% match</span>
                </div>
                <div className="bg-[var(--background)] rounded-lg p-3 border border-[var(--card-border)] flex justify-between">
                  <div className="space-y-1"><div className="h-2 w-28 bg-[var(--gray-200)] rounded" /><div className="h-2 w-20 bg-[var(--gray-100)] rounded" /></div>
                  <span className="text-xs font-medium text-green-600">95% match</span>
                </div>
              </div>
            </div>
          </>
        );

      case 17:
        return (
          <>
            <p className="text-xs font-medium text-[var(--gray-600)] uppercase tracking-wider text-center mb-4">HOW IT WORKS</p>
            <h1 className="font-serif text-3xl md:text-4xl text-center text-[var(--foreground)] mb-2">
              BFE fills out applications for you
            </h1>
            <p className="text-center text-[var(--gray-600)] mb-6">
              You get applied to vetted, high-match jobs — directly on the company website, tailoring each application.
            </p>
            <div className="bg-[var(--gray-50)] rounded-2xl p-6 border border-[var(--card-border)]">
              <div className="flex gap-2 text-xs mb-4">
                <span className="text-[var(--gray-600)]">Job Matches</span>
                <span className="text-[#ef562a]">&gt;</span>
                <span className="font-medium text-[#ef562a]">Applying</span>
                <span className="text-[var(--gray-600)]">&gt;</span>
                <span className="text-[var(--gray-600)]">Applied</span>
              </div>
              <div className="bg-[var(--background)] rounded-lg p-3 border border-[var(--card-border)] flex justify-between items-center">
                <div className="space-y-1"><div className="h-2 w-32 bg-[var(--gray-200)] rounded" /><div className="h-2 w-24 bg-[var(--gray-100)] rounded" /></div>
                <span className="text-xs text-[var(--gray-600)] flex items-center gap-1">
                  <span className="w-3 h-3 border-2 border-[var(--gray-200)] border-t-[#ef562a] rounded-full animate-spin" />
                  Applying...
                </span>
              </div>
            </div>
          </>
        );

      case 18:
        return (
          <>
            <p className="text-xs font-medium text-[var(--gray-600)] uppercase tracking-wider text-center mb-4">HOW IT WORKS</p>
            <h1 className="font-serif text-3xl md:text-4xl text-center text-[var(--foreground)] mb-2">
              Autopilot applies while you sleep
            </h1>
            <p className="text-center text-[var(--gray-600)] mb-6">
              BFE works around the clock so you wake up to fresh applications submitted overnight. Being early gives you a real edge.
            </p>
            <div className="bg-[var(--gray-50)] rounded-2xl p-6 border border-[var(--card-border)] text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-10 h-5 bg-[#ef562a] rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5" />
                </div>
                <span className="font-medium text-[var(--foreground)]">Autopilot</span>
              </div>
              <div className="space-y-2 text-left">
                <div className="bg-[var(--background)] rounded-lg p-3 border border-[var(--card-border)]">
                  <div className="flex justify-between items-center">
                    <div><div className="h-2 w-28 bg-[var(--gray-200)] rounded mb-1" /><span className="text-[10px] text-[var(--gray-600)]">Applied at <strong>3:42 AM</strong></span></div>
                    <span className="text-xs text-green-600">Applied</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      case 19:
        return (
          <>
            <p className="text-xs font-medium text-[var(--gray-600)] uppercase tracking-wider text-center mb-4">HOW IT WORKS</p>
            <h1 className="font-serif text-3xl md:text-4xl text-center text-[var(--foreground)] mb-2">
              Your job search, handled for you.
            </h1>
            <p className="text-center text-[var(--gray-600)] mb-6">
              BFE handles your job search while you focus on what matters most. It applies, tracks, and manages everything so interviews come to you.
            </p>
            <div className="bg-[var(--gray-50)] rounded-2xl p-6 border border-[var(--card-border)]">
              <div className="flex gap-2 text-xs mb-4">
                <span className="text-[var(--gray-600)]">Job Matches</span>
                <span className="text-[var(--gray-600)]">&gt;</span>
                <span className="text-[var(--gray-600)]">Applying</span>
                <span className="text-green-600">&gt;</span>
                <span className="font-medium text-green-600">Applied</span>
              </div>
              <div className="space-y-3">
                <div className="bg-[var(--background)] rounded-lg p-3 border border-[var(--card-border)] flex justify-between">
                  <div className="h-2 w-32 bg-[var(--gray-200)] rounded mt-1" />
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">Applied</span>
                </div>
                <div className="bg-[var(--background)] rounded-lg p-3 border border-[var(--card-border)] flex justify-between">
                  <div className="h-2 w-28 bg-[var(--gray-200)] rounded mt-1" />
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Interview</span>
                </div>
              </div>
            </div>
          </>
        );

      case 20: {
        const months = ({ "1 month": 1, "3 months": 3, "6 months": 6, "12 months+": 12 } as Record<string, number>)[data.timeline] || 3;
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() + months);
        const dateStr = targetDate.toLocaleDateString("en-US", { month: "long", day: "numeric" });
        return (
          <div className="text-center">
            <div className="text-4xl mb-4">🌿 🎉 🌿</div>
            <h1 className="font-serif text-3xl md:text-4xl text-[var(--foreground)] mb-4">
              Congratulations, your custom plan is ready!
            </h1>
            <p className="text-xs text-[#ef562a] uppercase tracking-wider font-medium">YOUR GOAL</p>
            <p className="text-lg text-[var(--foreground)]">Land a job by <span className="text-[#ef562a] font-bold">{dateStr}</span></p>
            <p className="font-serif text-xl text-[var(--foreground)] mt-6 mb-4">BFE applies <em>for</em> you:</p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {data.roles.slice(0, 2).map((r) => (
                <span key={r} className="px-3 py-1 bg-[var(--gray-50)] rounded-full text-sm border border-[var(--card-border)]">{r}</span>
              ))}
              {data.experience[0] && (
                <span className="px-3 py-1 bg-[var(--gray-50)] rounded-full text-sm border border-[var(--card-border)]">{data.experience[0]}</span>
              )}
              <span className="px-3 py-1 bg-[var(--gray-50)] rounded-full text-sm border border-[var(--card-border)]">${(data.minSalary/1000).toFixed(0)}K+</span>
              {data.locations[0] && (
                <span className="px-3 py-1 bg-[var(--gray-50)] rounded-full text-sm border border-[var(--card-border)]">{data.locations[0]}{data.locations.length > 1 ? ` + ${data.locations.length - 1} more` : ""}</span>
              )}
            </div>
          </div>
        );
      }

      case 21: {
        const months = ({ "1 month": 1, "3 months": 3, "6 months": 6, "12 months+": 12 } as Record<string, number>)[data.timeline] || 3;
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() + months);
        const dateStr = targetDate.toLocaleDateString("en-US", { month: "long", day: "numeric" });
        return (
          <div className="bg-[var(--gray-50)] rounded-2xl p-8 border border-[var(--card-border)]">
            <h1 className="font-serif text-3xl text-center text-[var(--foreground)] mb-8">Your Timeline</h1>
            <div className="space-y-6 text-center">
              <div>
                <p className="font-bold text-lg text-[var(--foreground)]">Today</p>
                <p className="font-medium text-[var(--foreground)]">Get applied to 100&apos;s of great jobs</p>
                <p className="text-sm text-[var(--gray-600)]">You have full control over which jobs BFE applies you to.</p>
              </div>
              <div className="text-2xl text-[var(--gray-200)]">&darr;</div>
              <div>
                <p className="font-bold text-lg text-[var(--foreground)]">This week</p>
                <p className="font-medium text-[var(--foreground)]">Set it and forget it!</p>
                <p className="text-sm text-[var(--gray-600)]">BFE applies to the freshest jobs daily while you prep for interviews.</p>
              </div>
              <div className="text-2xl text-[var(--gray-200)]">&darr;</div>
              <div>
                <p className="font-bold text-lg text-[var(--foreground)]">This month</p>
                <p className="font-medium text-[var(--foreground)]">Start landing interviews</p>
                <p className="text-sm text-[var(--gray-600)]">BFE users average 2-5x more interviews than traditional job searchers.</p>
              </div>
              <div className="text-2xl text-[var(--gray-200)]">&darr;</div>
              <div>
                <p className="font-bold text-lg text-[#ef562a]">{dateStr}</p>
                <p className="font-medium text-[#ef562a]">Land that job.</p>
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--card-border)]">
        <Link href="/" className="font-serif text-xl font-bold">
          the<span className="text-[#ef562a]">BFE</span>
        </Link>
        <Link href="/auth/signin" className="text-sm text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors">
          Log in
        </Link>
      </header>

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">
        {step !== 15 && renderProgressBar()}
        <div className="flex-1 flex flex-col justify-center">
          {renderStep()}
        </div>
        {step !== 15 && (
          <div className="pt-6">
            {step === 21 ? (
              <button
                onClick={handleCreateAccount}
                className="w-full py-4 text-base font-medium rounded-xl bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                ⚡ Start Applying
              </button>
            ) : (
              renderNextButton()
            )}
          </div>
        )}
      </div>
    </div>
  );
}
