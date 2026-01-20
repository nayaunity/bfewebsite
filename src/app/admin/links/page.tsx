import Link from "next/link";
import { prisma } from "@/lib/prisma";
import LinksTable from "./LinksTable";

export const dynamic = "force-dynamic";

export default async function AdminLinksPage() {
  const links = await prisma.link.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="pb-20 lg:pb-0">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Links
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {links.length} total links - drag to reorder
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/links/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Link
          </Link>
        </div>
      </div>

      <LinksTable links={links} />
    </div>
  );
}
