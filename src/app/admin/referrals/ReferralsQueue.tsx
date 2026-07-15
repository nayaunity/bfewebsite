"use client";

import { useMemo, useState } from "react";

type ReferralStatus =
  | "preview"
  | "queued"
  | "packet_ready"
  | "awaiting_send"
  | "sent"
  | "follow_up_due"
  | "intro_made"
  | "interview"
  | "offer"
  | "hired"
  | "closed_no_response"
  | "closed_declined";

interface ReferralRequestRecord {
  id: string;
  status: string;
  packetJson: string;
  adminNotes: string | null;
  priority: number;
  resumeName: string | null;
  resumeUrl: string | null;
  submittedAt: string | null;
  followUpDueAt: string | null;
  sentAt: string | null;
  introMadeAt: string | null;
  interviewAt: string | null;
  offerAt: string | null;
  hiredAt: string | null;
  closedAt: string | null;
  outcomeNote: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    subscriptionTier: string;
    subscriptionStatus: string;
  };
  job: {
    id: string;
    title: string;
    company: string;
    companySlug: string;
    applyUrl: string;
    location: string;
    postedAt: string | null;
  };
  connection: {
    id: string;
    fullName: string;
    headline: string | null;
    currentCompany: string | null;
    profileUrl: string;
    avatarUrl: string | null;
  };
  resume: {
    id: string;
    fileName: string;
    blobUrl: string;
  } | null;
  events: Array<{
    id: string;
    type: string;
    message: string;
    metadata: string | null;
    createdAt: string;
  }>;
}

interface ReferralPacket {
  subjectLine: string;
  suggestedMessage: string;
  whyMeBullets: string[];
  followUpChecklist: string[];
  connectionContext: string;
  recommendedResumeName: string | null;
}

const STATUS_OPTIONS: ReferralStatus[] = [
  "preview",
  "queued",
  "packet_ready",
  "awaiting_send",
  "sent",
  "follow_up_due",
  "intro_made",
  "interview",
  "offer",
  "hired",
  "closed_no_response",
  "closed_declined",
];

const STATUS_LABELS: Record<ReferralStatus, string> = {
  preview: "Preview",
  queued: "Queued",
  packet_ready: "Packet Ready",
  awaiting_send: "Awaiting Send",
  sent: "Sent",
  follow_up_due: "Follow-Up Due",
  intro_made: "Intro Made",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  closed_no_response: "Closed: No Response",
  closed_declined: "Closed: Declined",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Denver",
  });
}

function parsePacket(packetJson: string): ReferralPacket | null {
  try {
    return JSON.parse(packetJson) as ReferralPacket;
  } catch {
    return null;
  }
}

function coerceStatus(status: string): ReferralStatus {
  return STATUS_OPTIONS.includes(status as ReferralStatus)
    ? (status as ReferralStatus)
    : "preview";
}

export default function ReferralsQueue({ initialRequests }: { initialRequests: ReferralRequestRecord[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(initialRequests[0]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return requests.filter((request) => {
      if (statusFilter !== "all" && request.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const query = search.toLowerCase();
      return [
        request.job.company,
        request.job.title,
        request.connection.fullName,
        request.user.email,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [requests, search, statusFilter]);

  const selected = filtered.find((request) => request.id === selectedId)
    ?? requests.find((request) => request.id === selectedId)
    ?? filtered[0]
    ?? null;

  const selectedPacket = selected ? parsePacket(selected.packetJson) : null;

  const saveChanges = async (requestId: string, payload: {
    status?: ReferralStatus;
    adminNotes?: string | null;
    priority?: number;
  }) => {
    setSaving(true);
    setError(null);
    setFlash(null);
    try {
      const res = await fetch(`/api/admin/referrals/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update referral");
      setRequests((current) => current.map((item) => (item.id === requestId ? data.request : item)));
      setFlash("Referral queue updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update referral");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)]">
        <div className="border-b border-[var(--card-border)] px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Queue ({filtered.length})</h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by company, role, user..."
                className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
              >
                <option value="all">All statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="max-h-[72vh] overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <p className="rounded-xl bg-[var(--gray-50)] px-4 py-6 text-center text-sm text-[var(--gray-600)]">
              No referral requests match this filter.
            </p>
          ) : (
            filtered.map((request) => (
              <button
                key={request.id}
                type="button"
                onClick={() => setSelectedId(request.id)}
                className={`mb-3 w-full rounded-2xl border p-4 text-left transition-colors ${
                  selectedId === request.id
                    ? "border-[var(--accent)] bg-[#4d1b27]/5"
                    : "border-[var(--card-border)] hover:bg-[var(--gray-50)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {request.job.company} · {request.job.title}
                    </p>
                    <p className="mt-1 text-xs text-[var(--gray-600)]">
                      {request.connection.fullName} · {request.user.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-[var(--accent)]">P{request.priority}</p>
                    <p className="mt-1 text-[11px] text-[var(--gray-600)]">{STATUS_LABELS[coerceStatus(request.status)]}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-[var(--gray-600)]">
                  <span>Submitted {formatDate(request.submittedAt)}</span>
                  <span>Updated {formatDate(request.updatedAt)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 sm:p-6">
        {!selected ? (
          <div className="rounded-2xl bg-[var(--gray-50)] p-5 text-sm text-[var(--gray-600)]">
            Select a referral request to review the packet, adjust status, and leave concierge notes.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--gray-600)]">Referral detail</p>
                <h2 className="mt-1 font-serif text-2xl text-[var(--foreground)]">{selected.job.company}</h2>
                <p className="text-sm text-[var(--gray-600)]">
                  {selected.job.title} · {selected.connection.fullName} · {selected.user.email}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-[var(--gray-600)]">
                  Priority
                  <input
                    type="number"
                    min={0}
                    max={5}
                    defaultValue={selected.priority}
                    onBlur={(event) => {
                      const next = Number(event.target.value);
                      if (!Number.isFinite(next) || next === selected.priority) return;
                      void saveChanges(selected.id, { priority: next });
                    }}
                    className="mt-1 block w-20 rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
                  />
                </label>
                <label className="text-sm text-[var(--gray-600)]">
                  Status
                  <select
                    value={coerceStatus(selected.status)}
                    onChange={(event) => void saveChanges(selected.id, { status: event.target.value as ReferralStatus })}
                    className="mt-1 block rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {flash && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {flash}
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-[var(--gray-50)] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--gray-600)]">Candidate</p>
                <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                  {[selected.user.firstName, selected.user.lastName].filter(Boolean).join(" ") || selected.user.email}
                </p>
                <p className="text-sm text-[var(--gray-600)]">{selected.user.email}</p>
                <p className="mt-2 text-xs text-[var(--gray-600)]">
                  {selected.user.subscriptionTier.toUpperCase()} · {selected.user.subscriptionStatus}
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--gray-50)] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--gray-600)]">Connection</p>
                <p className="mt-2 text-sm font-medium text-[var(--foreground)]">{selected.connection.fullName}</p>
                <p className="text-sm text-[var(--gray-600)]">{selected.connection.headline || "LinkedIn connection"}</p>
                <a href={selected.connection.profileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-[var(--accent)] hover:underline">
                  Open LinkedIn profile
                </a>
              </div>
            </div>

            {selectedPacket && (
              <>
                <div className="rounded-2xl border border-[var(--card-border)] p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--gray-600)]">Suggested outreach</p>
                  <p className="mt-2 text-sm font-medium text-[var(--foreground)]">{selectedPacket.subjectLine}</p>
                  <textarea
                    readOnly
                    value={selectedPacket.suggestedMessage}
                    className="mt-3 h-56 w-full rounded-xl border border-[var(--card-border)] bg-[var(--gray-50)] px-3 py-3 text-sm text-[var(--foreground)]"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--card-border)] p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--gray-600)]">Why-me bullets</p>
                    <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
                      {selectedPacket.whyMeBullets.map((bullet) => (
                        <li key={bullet} className="flex gap-2">
                          <span className="mt-1 text-[var(--accent)]">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-[var(--card-border)] p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--gray-600)]">Follow-up checklist</p>
                    <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
                      {selectedPacket.followUpChecklist.map((bullet) => (
                        <li key={bullet} className="flex gap-2">
                          <span className="mt-1 text-[var(--accent)]">✓</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--gray-600)]">
                Concierge notes
              </label>
              <textarea
                defaultValue={selected.adminNotes || ""}
                onBlur={(event) => {
                  const next = event.target.value.trim();
                  if (next === (selected.adminNotes || "")) return;
                  void saveChanges(selected.id, { adminNotes: next || null });
                }}
                className="mt-2 h-32 w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-3 text-sm text-[var(--foreground)]"
              />
            </div>

            <div className="rounded-2xl bg-[var(--gray-50)] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--gray-600)]">Timeline</p>
              <div className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
                {selected.events.map((event) => (
                  <div key={event.id} className="flex items-start justify-between gap-3">
                    <span>{event.message}</span>
                    <span className="shrink-0 text-xs text-[var(--gray-600)]">{formatDate(event.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {saving && (
          <p className="mt-4 text-xs text-[var(--gray-600)]">Saving changes…</p>
        )}
      </section>
    </div>
  );
}
