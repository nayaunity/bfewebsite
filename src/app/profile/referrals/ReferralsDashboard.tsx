"use client";

import Link from "next/link";
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

interface AccessSummary {
  canPreview: boolean;
  canSubmitLive: boolean;
  previewReason: string | null;
  liveReason: string | null;
  tier: string;
  subscriptionStatus: string;
  monthlyUsed: number;
  monthlyLimit: number;
  concurrentUsed: number;
  concurrentLimit: number;
}

interface WarmMatch {
  jobId: string;
  title: string;
  company: string;
  companySlug: string;
  location: string;
  applyUrl: string;
  postedAt: string | null;
  score: number;
  matchReason: string;
  connection: {
    id: string;
    fullName: string;
    headline: string | null;
    currentCompany: string | null;
    companySlug: string | null;
    location: string | null;
    profileUrl: string;
    avatarUrl: string | null;
    status: string;
    lastSyncedAt: string;
  };
}

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

const STATUS_STYLES: Record<ReferralStatus, string> = {
  preview: "bg-[var(--gray-100)] text-[var(--gray-700)]",
  queued: "bg-blue-100 text-blue-700",
  packet_ready: "bg-violet-100 text-violet-700",
  awaiting_send: "bg-amber-100 text-amber-800",
  sent: "bg-[#ef562a]/10 text-[#ef562a]",
  follow_up_due: "bg-yellow-100 text-yellow-800",
  intro_made: "bg-cyan-100 text-cyan-800",
  interview: "bg-emerald-100 text-emerald-800",
  offer: "bg-fuchsia-100 text-fuchsia-800",
  hired: "bg-green-100 text-green-800",
  closed_no_response: "bg-[var(--gray-100)] text-[var(--gray-700)]",
  closed_declined: "bg-rose-100 text-rose-700",
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

function formatShortDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

function parsePacket(packetJson: string): ReferralPacket | null {
  try {
    return JSON.parse(packetJson) as ReferralPacket;
  } catch {
    return null;
  }
}

function nextActionsForStatus(status: ReferralStatus): ReferralStatus[] {
  switch (status) {
    case "preview":
      return ["queued"];
    case "queued":
    case "packet_ready":
    case "awaiting_send":
      return ["sent"];
    case "sent":
      return ["follow_up_due", "intro_made", "closed_no_response"];
    case "follow_up_due":
      return ["intro_made", "closed_no_response"];
    case "intro_made":
      return ["interview", "closed_declined"];
    case "interview":
      return ["offer", "closed_declined"];
    case "offer":
      return ["hired", "closed_declined"];
    default:
      return [];
  }
}

function coerceStatus(status: string): ReferralStatus {
  return STATUS_OPTIONS.includes(status as ReferralStatus)
    ? (status as ReferralStatus)
    : "preview";
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

export default function ReferralsDashboard({
  initialAccess,
  initialWarmMatches,
  initialRequests,
  connectionsTotal,
  activeConnections,
  lastSyncRun,
  totalActiveJobs,
  backendReady,
  backendMessage,
}: {
  initialAccess: AccessSummary;
  initialWarmMatches: WarmMatch[];
  initialRequests: ReferralRequestRecord[];
  connectionsTotal: number;
  activeConnections: number;
  lastSyncRun: {
    status: string;
    startedAt: string;
    completedAt: string | null;
    connectionsSeen: number;
    connectionsUpserted: number;
  } | null;
  totalActiveJobs: number;
  backendReady: boolean;
  backendMessage: string | null;
}) {
  const [access, setAccess] = useState(initialAccess);
  const [requests, setRequests] = useState(initialRequests);
  const [warmMatches] = useState(initialWarmMatches);
  const [selectedId, setSelectedId] = useState<string | null>(initialRequests[0]?.id ?? null);
  const [tokenInfo, setTokenInfo] = useState<{
    token: string;
    expiresAt: string;
    syncUrl: string;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const sortedRequests = useMemo(
    () => [...requests].sort((left, right) => right.priority - left.priority || right.updatedAt.localeCompare(left.updatedAt)),
    [requests]
  );

  const activeRequests = sortedRequests.filter((request) => coerceStatus(request.status) !== "preview");
  const previewRequests = sortedRequests.filter((request) => coerceStatus(request.status) === "preview");
  const selectedRequest = sortedRequests.find((request) => request.id === selectedId) ?? sortedRequests[0] ?? null;
  const selectedPacket = selectedRequest ? parsePacket(selectedRequest.packetJson) : null;

  const upsertRequest = (record: ReferralRequestRecord) => {
    setRequests((current) => {
      const existing = current.find((item) => item.id === record.id);
      if (!existing) return [record, ...current];
      return current.map((item) => (item.id === record.id ? record : item));
    });
    setSelectedId(record.id);
  };

  const handleGenerateToken = async () => {
    if (!backendReady) {
      setError(backendMessage || "Referral Assist is still provisioning.");
      return;
    }

    setLoadingToken(true);
    setError(null);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/referrals/linkedin/token", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate token");
      setTokenInfo({
        token: data.token,
        expiresAt: data.expiresAt,
        syncUrl: data.syncUrl,
      });
      setStatusMessage("Extension token ready. Paste it into the LinkedIn sync extension.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate token");
    } finally {
      setLoadingToken(false);
    }
  };

  const handleCopyToken = async () => {
    if (!tokenInfo) return;
    try {
      await navigator.clipboard.writeText(tokenInfo.token);
      setStatusMessage("Token copied to your clipboard.");
    } catch {
      setError("Couldn’t copy automatically. You can still copy the token manually.");
    }
  };

  const handlePreview = async (match: WarmMatch) => {
    if (!backendReady) {
      setError(backendMessage || "Referral Assist is still provisioning.");
      return;
    }

    setLoadingPreviewId(match.jobId);
    setError(null);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/referrals/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: match.jobId,
          connectionId: match.connection.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create packet");
      upsertRequest(data.request as ReferralRequestRecord);
      setAccess(data.access as AccessSummary);
      setStatusMessage(`Packet ready for ${match.company}. Review it below.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create preview");
    } finally {
      setLoadingPreviewId(null);
    }
  };

  const handleStatusUpdate = async (requestId: string, status: ReferralStatus) => {
    setUpdatingId(requestId);
    setError(null);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/referrals/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update referral");
      upsertRequest(data.request as ReferralRequestRecord);
      if (data.access) setAccess(data.access as AccessSummary);
      setStatusMessage(`Referral updated to ${STATUS_LABELS[status].toLowerCase()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update referral");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {!backendReady && backendMessage && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {backendMessage}
        </div>
      )}

      {!access.canPreview && (
        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--gray-600)]">Paid add-on lane</p>
              <h2 className="mt-1 font-serif text-2xl text-[var(--foreground)]">Referrals are included on paid plans.</h2>
              <p className="mt-2 max-w-2xl text-sm text-[var(--gray-600)]">
                Upgrade to Starter or Pro to sync LinkedIn connections, generate referral packets, and track warm intros beside your auto-apply pipeline.
              </p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full bg-[#ef562a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#d84a21]"
            >
              View paid plans
            </Link>
          </div>
        </section>
      )}

      {statusMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {statusMessage}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--gray-600)]">LinkedIn sync</p>
              <h2 className="mt-1 font-serif text-2xl text-[var(--foreground)]">Bring your network in once.</h2>
              <p className="mt-2 text-sm text-[var(--gray-600)]">
                Sync your first-degree connections, then we’ll surface BFE jobs where you already know someone on the inside.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="/downloads/bfe-linkedin-sync-extension.zip"
                download
                className="inline-flex items-center justify-center rounded-full border border-[var(--card-border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--gray-50)]"
              >
                Download extension
              </a>
              <button
                type="button"
                onClick={handleGenerateToken}
                disabled={loadingToken || !access.canPreview || !backendReady}
                className="rounded-full bg-[var(--foreground)] px-4 py-2.5 text-sm font-medium text-[var(--background)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingToken ? "Generating..." : "Generate extension token"}
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-[var(--gray-50)] p-4">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--gray-600)]">Connections</p>
              <p className="mt-2 font-serif text-4xl text-[var(--foreground)]">{activeConnections}</p>
              <p className="mt-1 text-xs text-[var(--gray-600)]">{connectionsTotal} total synced profiles</p>
            </div>
            <div className="rounded-2xl bg-[var(--gray-50)] p-4">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--gray-600)]">Live requests</p>
              <p className="mt-2 font-serif text-4xl text-[var(--foreground)]">
                {access.concurrentUsed}/{access.concurrentLimit}
              </p>
              <p className="mt-1 text-xs text-[var(--gray-600)]">in-flight right now</p>
            </div>
            <div className="rounded-2xl bg-[var(--gray-50)] p-4">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--gray-600)]">This period</p>
              <p className="mt-2 font-serif text-4xl text-[var(--foreground)]">
                {access.monthlyUsed}/{access.monthlyLimit}
              </p>
              <p className="mt-1 text-xs text-[var(--gray-600)]">{access.tier.toUpperCase()} request allowance</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-[var(--card-border)] p-4">
            <p className="text-sm font-medium text-[var(--foreground)]">How to sync</p>
            <ol className="mt-2 space-y-2 text-sm text-[var(--gray-600)]">
              <li>1. Click <strong>Download extension</strong> above. After the zip downloads, double-click it so Finder creates an unzipped <code>linkedin-sync</code> folder.</li>
              <li>2. In Chrome, open <code>chrome://extensions</code>, turn on Developer mode, click <strong>Load unpacked</strong>, and in Finder select that unzipped <code>linkedin-sync</code> folder, usually in Downloads.</li>
              <li>3. On this page, click <strong>Generate extension token</strong>, then copy the token.</li>
              <li>4. In LinkedIn, open a page with visible profile cards, like <strong>My Network</strong>, search results, or people results.</li>
              <li>5. Open the extension, confirm the App URL is <code>https://www.theblackfemaleengineer.com</code>, paste the token, click <strong>Scan page</strong>, then click <strong>Sync captured</strong>.</li>
              <li>6. Come back here and refresh to see warm matches. Repeat on more LinkedIn pages if you want to capture more connections.</li>
            </ol>
            <p className="mt-3 text-xs text-[var(--gray-600)]">
              The extension only captures the profile cards currently visible on the page, not your full LinkedIn network all at once.
            </p>
            {tokenInfo && (
              <div className="mt-4 rounded-xl bg-[var(--gray-50)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-[var(--foreground)]">Token expires {formatDate(tokenInfo.expiresAt)}</p>
                    <p className="mt-1 text-[11px] text-[var(--gray-600)] break-all">{tokenInfo.syncUrl}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="rounded-full border border-[var(--card-border)] px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--gray-50)]"
                  >
                    Copy token
                  </button>
                </div>
                <textarea
                  readOnly
                  value={tokenInfo.token}
                  className="mt-3 h-24 w-full rounded-xl border border-[var(--card-border)] bg-white px-3 py-2 text-xs text-[var(--foreground)]"
                />
              </div>
            )}
            {lastSyncRun && (
              <p className="mt-4 text-xs text-[var(--gray-600)]">
                Last sync: {lastSyncRun.status} · {lastSyncRun.connectionsUpserted}/{lastSyncRun.connectionsSeen} profiles upserted · started {formatDate(lastSyncRun.startedAt)}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 sm:p-6">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--gray-600)]">Why this lane matters</p>
          <h2 className="mt-1 font-serif text-2xl text-[var(--foreground)]">Referrals help the best jobs find you faster.</h2>
          <p className="mt-2 text-sm text-[var(--gray-600)]">
            We keep auto-apply running for breadth while this lane helps you use trust, context, and timing where you already have network leverage.
          </p>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl bg-[var(--gray-50)] p-4">
              <p className="text-sm font-medium text-[var(--foreground)]">Warm-match coverage</p>
              <p className="mt-1 text-sm text-[var(--gray-600)]">
                {warmMatches.length} warm opportunities surfaced across {totalActiveJobs} active BFE catalog jobs.
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--gray-50)] p-4">
              <p className="text-sm font-medium text-[var(--foreground)]">Trial behavior</p>
              <p className="mt-1 text-sm text-[var(--gray-600)]">
                Trial users can sync and preview. Live referral requests unlock after the subscription converts.
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--gray-50)] p-4">
              <p className="text-sm font-medium text-[var(--foreground)]">Parallel strategy</p>
              <p className="mt-1 text-sm text-[var(--gray-600)]">
                Keep your pipeline full in <Link href="/profile/applications" className="text-[#ef562a] hover:underline">Applications</Link> while you push your highest-signal roles through referrals.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--gray-600)]">Warm matches</p>
              <h2 className="mt-1 font-serif text-2xl text-[var(--foreground)]">Jobs where you know someone.</h2>
            </div>
            <Link href="/profile/applications" className="text-sm text-[#ef562a] hover:underline">
              Back to applications
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {warmMatches.length === 0 ? (
              <div className="rounded-2xl bg-[var(--gray-50)] p-5 text-sm text-[var(--gray-600)]">
                {backendReady
                  ? "Sync LinkedIn first and we’ll surface jobs where your network and our catalog overlap."
                  : backendMessage || "Referral Assist is still provisioning."}
              </div>
            ) : (
              warmMatches.map((match) => (
                <div key={`${match.jobId}:${match.connection.id}`} className="rounded-2xl border border-[var(--card-border)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[#ef562a]/10 px-2 py-1 text-[11px] font-semibold text-[#ef562a]">
                          {match.score}% warm
                        </span>
                        <span className="text-[11px] text-[var(--gray-600)]">{match.matchReason}</span>
                      </div>
                      <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">{match.title}</h3>
                      <p className="text-sm text-[var(--gray-600)]">
                        {match.company} · {match.location}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={loadingPreviewId === match.jobId || !access.canPreview || !backendReady}
                      onClick={() => handlePreview(match)}
                      className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loadingPreviewId === match.jobId ? "Building..." : "Generate packet"}
                    </button>
                  </div>

                  <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[var(--gray-50)] p-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ffe500] text-sm font-semibold text-black">
                      {initials(match.connection.fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">{match.connection.fullName}</p>
                      <p className="truncate text-xs text-[var(--gray-600)]">
                        {match.connection.headline || "LinkedIn connection"}{match.connection.location ? ` · ${match.connection.location}` : ""}
                      </p>
                    </div>
                    <a
                      href={match.connection.profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-[#ef562a] hover:underline"
                    >
                      LinkedIn
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
          {!access.canPreview && access.previewReason && (
            <p className="mt-4 text-sm text-[var(--gray-600)]">{access.previewReason}</p>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 sm:p-6">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--gray-600)]">Packet builder</p>
          <h2 className="mt-1 font-serif text-2xl text-[var(--foreground)]">Your ask, prepped and tracked.</h2>

          {!selectedRequest || !selectedPacket ? (
            <div className="mt-5 rounded-2xl bg-[var(--gray-50)] p-5 text-sm text-[var(--gray-600)]">
              {backendReady
                ? "Generate a packet from a warm match and it’ll appear here with a suggested ask, “why me” bullets, and a follow-up checklist."
                : backendMessage || "Referral Assist is still provisioning."}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[coerceStatus(selectedRequest.status)]}`}>
                    {STATUS_LABELS[coerceStatus(selectedRequest.status)]}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                    {selectedRequest.job.title} · {selectedRequest.job.company}
                  </h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Connected to {selectedRequest.connection.fullName}
                  </p>
                </div>
                <a
                  href={selectedRequest.job.applyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[var(--card-border)] px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--gray-50)]"
                >
                  Open job
                </a>
              </div>

              <div className="rounded-2xl bg-[var(--gray-50)] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--gray-600)]">Connection context</p>
                <p className="mt-2 text-sm text-[var(--foreground)]">{selectedPacket.connectionContext}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--card-border)] p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--gray-600)]">Why me bullets</p>
                  <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
                    {selectedPacket.whyMeBullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <span className="mt-1 text-[#ef562a]">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-[var(--card-border)] p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--gray-600)]">Follow-up checklist</p>
                  <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
                    {selectedPacket.followUpChecklist.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1 text-[#ef562a]">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--card-border)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--gray-600)]">Suggested outreach</p>
                    <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{selectedPacket.subjectLine}</p>
                  </div>
                  {selectedRequest.resumeName && (
                    <span className="rounded-full bg-[var(--gray-50)] px-3 py-1 text-xs text-[var(--gray-700)]">
                      {selectedRequest.resumeName}
                    </span>
                  )}
                </div>
                <textarea
                  readOnly
                  value={selectedPacket.suggestedMessage}
                  className="mt-3 h-64 w-full rounded-xl border border-[var(--card-border)] bg-[var(--gray-50)] px-3 py-3 text-sm text-[var(--foreground)]"
                />
              </div>

              {selectedRequest.adminNotes && (
                <div className="rounded-2xl border border-dashed border-[var(--card-border)] p-4 text-sm text-[var(--gray-700)]">
                  <p className="font-medium text-[var(--foreground)]">Concierge notes</p>
                  <p className="mt-2 whitespace-pre-wrap">{selectedRequest.adminNotes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {nextActionsForStatus(coerceStatus(selectedRequest.status)).map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={updatingId === selectedRequest.id || (status === "queued" && !access.canSubmitLive)}
                    onClick={() => handleStatusUpdate(selectedRequest.id, status)}
                    className="rounded-full bg-[#ef562a] px-4 py-2 text-sm font-medium text-white hover:bg-[#d84a21] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {status === "queued" ? "Submit live request" : `Mark ${STATUS_LABELS[status].toLowerCase()}`}
                  </button>
                ))}
              </div>

              {coerceStatus(selectedRequest.status) === "preview" && access.liveReason && (
                <p className="text-sm text-[var(--gray-600)]">{access.liveReason}</p>
              )}

              <div className="rounded-2xl bg-[var(--gray-50)] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--gray-600)]">Recent timeline</p>
                <div className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
                  {selectedRequest.events.length === 0 ? (
                    <p className="text-[var(--gray-600)]">No updates yet.</p>
                  ) : (
                    selectedRequest.events.map((event) => (
                      <div key={event.id} className="flex items-start justify-between gap-3">
                        <span>{event.message}</span>
                        <span className="shrink-0 text-xs text-[var(--gray-600)]">{formatDate(event.createdAt)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--gray-600)]">Request board</p>
            <h2 className="mt-1 font-serif text-2xl text-[var(--foreground)]">Everything in motion.</h2>
          </div>
          <p className="text-sm text-[var(--gray-600)]">
            {activeRequests.length} live · {previewRequests.length} preview
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {[...activeRequests, ...previewRequests].map((request) => (
            <button
              key={request.id}
              type="button"
              onClick={() => setSelectedId(request.id)}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                  selectedId === request.id
                    ? "border-[#ef562a] bg-[#ef562a]/5"
                    : "border-[var(--card-border)] hover:bg-[var(--gray-50)]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[coerceStatus(request.status)]}`}>
                      {STATUS_LABELS[coerceStatus(request.status)]}
                    </div>
                  <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">
                    {request.job.company} · {request.job.title}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--gray-600)]">
                    {request.connection.fullName}{request.connection.headline ? ` · ${request.connection.headline}` : ""}
                  </p>
                </div>
                <span className="text-xs text-[var(--gray-600)]">{formatShortDate(request.updatedAt)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--gray-600)]">
                <span>Priority {request.priority}</span>
                <span>Submitted {formatShortDate(request.submittedAt)}</span>
                <span>Follow-up {formatShortDate(request.followUpDueAt)}</span>
              </div>
            </button>
          ))}
          {requests.length === 0 && (
            <div className="rounded-2xl bg-[var(--gray-50)] p-5 text-sm text-[var(--gray-600)]">
              No referral requests yet. Generate a packet from a warm match to start your board.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
