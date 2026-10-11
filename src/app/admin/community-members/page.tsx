import type Stripe from "stripe";
import { requireFullAdmin } from "@/lib/admin";
import { stripe, STRIPE_COMMUNITY } from "@/lib/stripe";
import { MarkButton } from "./MarkButton";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  email: string;
  name: string;
  status: string;
  startedAt: Date;
  periodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  invited: boolean;
  invitedAt: string | null;
  removed: boolean;
  source: string;
};

async function loadMembers(): Promise<{ rows: Row[]; error: string | null }> {
  if (!STRIPE_COMMUNITY.monthlyPriceId) {
    return { rows: [], error: "STRIPE_DP_MONTHLY_PRICE_ID is not set." };
  }
  try {
    const subs = await stripe.subscriptions.list({
      price: STRIPE_COMMUNITY.monthlyPriceId,
      status: "all",
      limit: 100,
      expand: ["data.customer"],
    });
    const rows: Row[] = subs.data.map((s) => {
      const c = s.customer as Stripe.Customer | Stripe.DeletedCustomer;
      const email = "email" in c ? c.email ?? "" : "";
      const name = "name" in c ? c.name ?? "" : "";
      const itemCpe = (s.items.data[0] as unknown as { current_period_end?: number })?.current_period_end;
      const rootCpe = (s as unknown as { current_period_end?: number }).current_period_end;
      const cpe = rootCpe ?? itemCpe;
      return {
        id: s.id,
        email,
        name,
        status: s.status,
        startedAt: new Date(s.created * 1000),
        periodEnd: cpe ? new Date(cpe * 1000) : null,
        cancelAtPeriodEnd: s.cancel_at_period_end === true,
        canceledAt: s.canceled_at ? new Date(s.canceled_at * 1000) : null,
        invited: s.metadata?.skool_invited === "true",
        invitedAt: s.metadata?.skool_invited_at ?? null,
        removed: s.metadata?.skool_removed === "true",
        source: s.metadata?.source ?? "",
      };
    });
    rows.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    return { rows, error: null };
  } catch (err) {
    return { rows: [], error: err instanceof Error ? err.message : String(err) };
  }
}

const ACTIVE = new Set(["active", "trialing", "past_due"]);

function fmt(d: Date | null) {
  return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
}

export default async function CommunityMembersPage() {
  await requireFullAdmin();
  const { rows, error } = await loadMembers();

  const needInvite = rows.filter((r) => ACTIVE.has(r.status) && !r.invited);
  const needRemoval = rows.filter((r) => !ACTIVE.has(r.status) && r.invited && !r.removed);
  const activeCount = rows.filter((r) => ACTIVE.has(r.status)).length;

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="font-serif text-2xl md:text-3xl text-[var(--foreground)]">
          Disgustingly Paid members
        </h1>
        <p className="text-sm text-[var(--gray-600)] mt-1">
          Billed through Stripe ($49 first month, then $99/month). Skool never
          charges them. Invite each new member for free from Skool&apos;s
          Settings, then Invite, then mark them invited here. When a
          subscription ends, remove them in Skool and mark it here.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-[var(--accent)]/40 bg-[var(--surface-warm)] p-4 text-sm text-[var(--foreground)]">
          Could not load from Stripe: {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
          <p className="text-sm text-[var(--gray-600)]">Active members</p>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{activeCount}</p>
        </div>
        <div className={`rounded-xl p-4 border-2 ${needInvite.length ? "border-[var(--accent)] bg-[var(--surface-warm)]" : "border-[var(--card-border)] bg-[var(--card-bg)]"}`}>
          <p className="text-sm text-[var(--gray-600)]">Waiting for Skool invite</p>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{needInvite.length}</p>
        </div>
        <div className={`rounded-xl p-4 border-2 ${needRemoval.length ? "border-[var(--accent)] bg-[var(--surface-warm)]" : "border-[var(--card-border)] bg-[var(--card-bg)]"}`}>
          <p className="text-sm text-[var(--gray-600)]">Ended, still in Skool</p>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{needRemoval.length}</p>
        </div>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--card-border)] flex items-center justify-between">
          <h2 className="font-semibold text-sm text-[var(--foreground)]">All subscriptions ({rows.length})</h2>
          <span className="text-xs text-[var(--gray-600)]">Source of truth: Stripe</span>
        </div>
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-sm text-[var(--gray-600)] text-center">No members yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-[var(--gray-600)] bg-[var(--gray-50)]">
                <tr>
                  <th className="px-4 py-2 font-medium">Member</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Started</th>
                  <th className="px-4 py-2 font-medium">Renews / ends</th>
                  <th className="px-4 py-2 font-medium">Skool</th>
                  <th className="px-4 py-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {rows.map((r) => {
                  const active = ACTIVE.has(r.status);
                  return (
                    <tr key={r.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--foreground)]">{r.email || "(no email)"}</p>
                        <p className="text-xs text-[var(--gray-600)]">{r.name}{r.source ? ` · via ${r.source}` : ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${active ? "bg-[var(--accent-green-bg)] text-[var(--accent-green-text)]" : "bg-[var(--gray-100)] text-[var(--gray-600)]"}`}>
                          {r.status}{r.cancelAtPeriodEnd ? " · cancels at period end" : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--gray-600)]">{fmt(r.startedAt)}</td>
                      <td className="px-4 py-3 text-[var(--gray-600)]">{r.canceledAt ? `ended ${fmt(r.canceledAt)}` : fmt(r.periodEnd)}</td>
                      <td className="px-4 py-3 text-xs text-[var(--gray-600)]">
                        {r.removed ? "removed" : r.invited ? `invited ${r.invitedAt ? fmt(new Date(r.invitedAt)) : ""}` : "not invited"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {active && !r.invited && (
                          <MarkButton subscriptionId={r.id} action="invited" label="Mark invited" />
                        )}
                        {!active && r.invited && !r.removed && (
                          <MarkButton subscriptionId={r.id} action="removed" label="Mark removed from Skool" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
