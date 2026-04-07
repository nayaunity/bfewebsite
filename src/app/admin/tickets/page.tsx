import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import TicketKanban from "./TicketKanban";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage() {
  await requireAdmin();

  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, firstName: true, lastName: true } },
    },
  });

  return (
    <div className="pb-20 lg:pb-0">
      <div className="mb-6">
        <h1 className="font-serif text-2xl md:text-3xl text-[var(--foreground)]">
          Support Tickets
        </h1>
        <p className="mt-1 text-sm text-[var(--gray-600)]">
          {tickets.length} total tickets from beta users
        </p>
      </div>

      <TicketKanban initialTickets={tickets.map((t) => ({
        id: t.id,
        title: t.title,
        message: t.message,
        type: t.type,
        status: t.status,
        page: t.page,
        createdAt: t.createdAt.toISOString(),
        userEmail: t.user.email,
        userName: [t.user.firstName, t.user.lastName].filter(Boolean).join(" ") || null,
      }))} />
    </div>
  );
}
