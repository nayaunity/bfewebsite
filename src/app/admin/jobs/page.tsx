import Link from "next/link";
import { prisma } from "@/lib/prisma";
import JobsTable from "./JobsTable";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function AdminJobsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const page = parseInt(params.page || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { title: { contains: search } },
          { company: { contains: search } },
          { location: { contains: search } },
        ],
      }
    : {};

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { scrapedAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        createdBy: {
          select: { email: true },
        },
      },
    }),
    prisma.job.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="pb-20 lg:pb-0">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Jobs
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {total} total jobs
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/jobs/new"
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
            Add Job
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <form method="GET" className="flex gap-2">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search jobs..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-black focus:border-transparent"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Search
          </button>
          {search && (
            <Link
              href="/admin/jobs"
              className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Jobs Table */}
      <JobsTable jobs={jobs} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {offset + 1} to {Math.min(offset + limit, total)} of {total}
          </div>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/jobs?page=${page - 1}${search ? `&search=${search}` : ""}`}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/jobs?page=${page + 1}${search ? `&search=${search}` : ""}`}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
