"use client";

import { useState } from "react";

interface Ticket {
  id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  page: string | null;
  createdAt: string;
  userEmail: string;
  userName: string | null;
}

const COLUMNS = [
  { key: "new", label: "New", color: "border-blue-400", bg: "bg-blue-50" },
  { key: "in-progress", label: "In Progress", color: "border-yellow-400", bg: "bg-yellow-50" },
  { key: "done", label: "Done", color: "border-green-400", bg: "bg-green-50" },
];

const TYPE_BADGES: Record<string, { label: string; class: string }> = {
  bug: { label: "Bug", class: "bg-red-100 text-red-700" },
  feature: { label: "Feature", class: "bg-purple-100 text-purple-700" },
  question: { label: "Question", class: "bg-blue-100 text-blue-700" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Denver",
  });
}

export default function TicketKanban({ initialTickets }: { initialTickets: Ticket[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const moveTicket = async (ticketId: string, newStatus: string) => {
    // Optimistic update
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticketId, status: newStatus }),
      });

      if (!res.ok) {
        // Revert on failure
        setTickets((prev) =>
          prev.map((t) => {
            const original = initialTickets.find((it) => it.id === t.id);
            return t.id === ticketId && original ? { ...t, status: original.status } : t;
          })
        );
      }
    } catch {
      // Revert
      setTickets(initialTickets);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map((col) => {
        const columnTickets = tickets.filter((t) => t.status === col.key);
        return (
          <div key={col.key} className={`rounded-2xl border-t-4 ${col.color} bg-[var(--card-bg)] border border-[var(--card-border)] min-h-[300px]`}>
            {/* Column Header */}
            <div className={`px-4 py-3 ${col.bg} rounded-t-xl border-b border-[var(--card-border)]`}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--foreground)]">{col.label}</h2>
                <span className="text-xs font-medium text-[var(--gray-600)] bg-[var(--background)] px-2 py-0.5 rounded-full">
                  {columnTickets.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="p-3 space-y-3">
              {columnTickets.length === 0 && (
                <p className="text-xs text-[var(--gray-600)] text-center py-6">No tickets</p>
              )}
              {columnTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
                >
                  {/* Type badge + title */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <svg className={`w-3 h-3 transition-transform ${expandedId === ticket.id ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <h3 className="text-sm font-medium text-[var(--foreground)]">
                        {ticket.title}
                      </h3>
                    </div>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${TYPE_BADGES[ticket.type]?.class || "bg-gray-100 text-gray-700"}`}>
                      {TYPE_BADGES[ticket.type]?.label || ticket.type}
                    </span>
                  </div>

                  {/* Message - always show preview, full on expand */}
                  <p className={`text-xs text-[var(--gray-600)] mb-3 whitespace-pre-wrap bg-[var(--gray-50)] rounded-lg p-2 ${expandedId === ticket.id ? "" : "line-clamp-2"}`}>
                    {ticket.message}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-[10px] text-[var(--gray-600)]">
                    <span>{ticket.userName || ticket.userEmail.split("@")[0]}</span>
                    <span>{formatDate(ticket.createdAt)}</span>
                  </div>

                  {ticket.page && (
                    <span className="inline-block mt-1 text-[10px] text-[var(--gray-600)] bg-[var(--gray-50)] px-1.5 py-0.5 rounded">
                      /{ticket.page}
                    </span>
                  )}

                  {/* Move buttons */}
                  <div className="flex gap-1 mt-2 pt-2 border-t border-[var(--card-border)]">
                    {COLUMNS.filter((c) => c.key !== ticket.status).map((target) => (
                      <button
                        key={target.key}
                        onClick={() => moveTicket(ticket.id, target.key)}
                        className="flex-1 text-[10px] font-medium py-1 rounded-md border border-[var(--card-border)] text-[var(--gray-600)] hover:bg-[var(--gray-50)] transition-colors"
                      >
                        {target.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
