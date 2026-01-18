export const MICRO_WIN_PROMPTS = {
  clicked: {
    id: "clicked",
    prompt: "What clicked for you this week?",
    placeholder: "Something finally made sense when...",
    emoji: "💡",
  },
  made_sense: {
    id: "made_sense",
    prompt: "What finally made sense?",
    placeholder: "I understood it when I realized...",
    emoji: "🎯",
  },
  stopped_doing: {
    id: "stopped_doing",
    prompt: "What did you stop doing?",
    placeholder: "I stopped trying to... and instead...",
    emoji: "🛑",
  },
  small_win: {
    id: "small_win",
    prompt: "What's a small win you had?",
    placeholder: "Today I managed to...",
    emoji: "🏆",
  },
} as const;

export type PromptType = keyof typeof MICRO_WIN_PROMPTS;

export const PROMPT_TYPES = Object.keys(MICRO_WIN_PROMPTS) as PromptType[];

export const MAX_CONTENT_LENGTH = 280;

export function isValidPromptType(value: string): value is PromptType {
  return value in MICRO_WIN_PROMPTS;
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`;
}
