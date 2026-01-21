import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function getUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      createdAt: true,
      emailVerified: true,
    },
  });

  return users;
}

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="pb-20 lg:pb-0">
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl text-[var(--foreground)]">
          Registered Users
        </h1>
        <p className="mt-2 text-[var(--gray-600)]">
          {users.length} total users
        </p>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
        {users.length === 0 ? (
          <p className="px-4 py-8 text-center text-[var(--gray-600)]">
            No registered users yet
          </p>
        ) : (
          <div className="divide-y divide-[var(--card-border)]">
            {users.map((user) => (
              <div
                key={user.id}
                className="px-4 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--gray-100)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--gray-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[var(--foreground)] truncate">
                      {user.email}
                    </p>
                    <p className="text-sm text-[var(--gray-600)]">
                      Joined {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  {user.emailVerified ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--gray-100)] text-[var(--gray-600)]">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
