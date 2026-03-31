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
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const moveTicket = async (ticketId: string, newStatus: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket((prev) => prev ? { ...prev, status: newStatus } : null);
    }

    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticketId, status: newStatus }),
      });
      if (!res.ok) setTickets(initialTickets);
    } catch {
      setTickets(initialTickets);
    }
  };

  return (
    <>
      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const columnTickets = tickets.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className={`rounded-2xl border-t-4 ${col.color} bg-[var(--card-bg)] border border-[var(--card-border)] min-h-[300px]`}>
              <div className={`px-4 py-3 ${col.bg} rounded-t-xl border-b border-[var(--card-border)]`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[var(--foreground)]">{col.label}</h2>
                  <span className="text-xs font-medium text-[var(--gray-600)] bg-[var(--background)] px-2 py-0.5 rounded-full">
                    {columnTickets.length}
                  </span>
                </div>
              </div>

              <div className="p-3 space-y-3">
                {columnTickets.length === 0 && (
                  <p className="text-xs text-[var(--gray-600)] text-center py-6">No tickets</p>
                )}
                {columnTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`bg-[var(--background)] border rounded-xl p-3 hover:shadow-md transition-all cursor-pointer ${
                      selectedTicket?.id === ticket.id
                        ? "border-[#ef562a] ring-1 ring-[#ef562a]/30"
                        : "border-[var(--card-border)]"
                    }`}
                    onClick={() => setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-medium text-[var(--foreground)]">
                        {ticket.title}
                      </h3>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${TYPE_BADGES[ticket.type]?.class || "bg-gray-100 text-gray-700"}`}>
                        {TYPE_BADGES[ticket.type]?.label || ticket.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[var(--gray-600)]">
                      <span>{ticket.userName || ticket.userEmail.split("@")[0]}</span>
                      <span>{formatDate(ticket.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Panel - slides in when a ticket is selected */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedTicket(null)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="relative w-full max-w-lg bg-[var(--background)] shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-[var(--background)] border-b border-[var(--card-border)] px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Ticket Details</h2>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Title + Type */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-[var(--foreground)]">{selectedTicket.title}</h3>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${TYPE_BADGES[selectedTicket.type]?.class || "bg-gray-100 text-gray-700"}`}>
                    {TYPE_BADGES[selectedTicket.type]?.label || selectedTicket.type}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--gray-600)]">
                  <span>{selectedTicket.userName || selectedTicket.userEmail}</span>
                  <span>{formatDate(selectedTicket.createdAt)}</span>
                  {selectedTicket.page && (
                    <span className="bg-[var(--gray-50)] px-1.5 py-0.5 rounded">/{selectedTicket.page}</span>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <p className="text-xs font-medium text-[var(--gray-600)] uppercase tracking-wider mb-2">Description</p>
                <div className="bg-[var(--gray-50)] border border-[var(--card-border)] rounded-xl p-4">
                  <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
                    {selectedTicket.message}
                  </p>
                </div>
              </div>

              {/* Submitted by */}
              <div>
                <p className="text-xs font-medium text-[var(--gray-600)] uppercase tracking-wider mb-2">Submitted by</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#ef562a] flex items-center justify-center text-white text-xs font-bold">
                    {(selectedTicket.userName || selectedTicket.userEmail)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {selectedTicket.userName || "User"}
                    </p>
                    <p className="text-xs text-[var(--gray-600)]">{selectedTicket.userEmail}</p>
                  </div>
                </div>
              </div>

              {/* Status + Actions */}
              <div>
                <p className="text-xs font-medium text-[var(--gray-600)] uppercase tracking-wider mb-2">Status</p>
                <div className="flex gap-2">
                  {COLUMNS.map((col) => (
                    <button
                      key={col.key}
                      onClick={() => moveTicket(selectedTicket.id, col.key)}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                        selectedTicket.status === col.key
                          ? "border-[#ef562a] bg-[#ef562a] text-white"
                          : "border-[var(--card-border)] text-[var(--gray-600)] hover:bg-[var(--gray-50)]"
                      }`}
                    >
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
