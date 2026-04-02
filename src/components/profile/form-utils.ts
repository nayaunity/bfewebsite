export const inputClass =
  "w-full px-3 py-2.5 text-sm rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#ef562a]/30 focus:border-[#ef562a] placeholder:text-[var(--gray-600)]/50";

export const selectClass = inputClass;

export const textareaClass =
  "w-full px-3 py-2.5 text-sm rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#ef562a]/30 focus:border-[#ef562a] placeholder:text-[var(--gray-600)]/50 resize-vertical min-h-[80px]";

export const labelClass = "block text-sm font-medium text-[var(--foreground)] mb-1";

export const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming",
];

export const REMOTE_OPTIONS = [
  "Remote",
  "Hybrid",
  "On-site",
  "Remote or Hybrid",
];

export const PRONOUNS_OPTIONS = [
  "She/Her",
  "He/Him",
  "They/Them",
  "She/They",
  "He/They",
  "Other",
  "Prefer not to say",
];

export async function saveProfileFields(
  fields: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const data = await response.json();
    if (!response.ok) {
      return { ok: false, error: data.error || "Failed to save" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to save" };
  }
}
