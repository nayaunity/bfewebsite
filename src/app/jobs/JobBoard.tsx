"use client";

import { useState, useEffect, useCallback } from "react";
import deiCompanies from "@/data/dei-companies.json";

interface Job {
  id: string;
  company: string;
  companySlug: string;
  title: string;
  location: string;
  type: string;
  remote: boolean;
  salary: string;
  posted: string;
  tags: string[];
  href: string;
  category: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

const categories = [
  "All Jobs",
  "Software Engineering",
  "Data Science",
  "Product Management",
  "DevOps / SRE",
  "Design",
];

const mobileFilters = [
  { label: "All", value: "" },
  { label: "Full Stack", value: "software engineer,software developer" },
  { label: "Frontend", value: "frontend" },
  { label: "Backend", value: "backend" },
  { label: "Data", value: "data" },
  { label: "AI/ML", value: "machine learning" },
  { label: "Manager", value: "manager" },
  { label: "Designer", value: "design" },
];

export default function JobBoard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All Jobs");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [selectedMobileFilter, setSelectedMobileFilter] = useState("");
  const [isInternational, setIsInternational] = useState(false);

  const fetchJobs = useCallback(
    async (page = 1, append = false) => {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", "20");

        if (selectedCategory !== "All Jobs") {
          params.set("category", selectedCategory);
        }
        if (selectedCompany) {
          params.set("company", selectedCompany);
        }
        if (remoteOnly) {
          params.set("remote", "true");
        }
        if (selectedMobileFilter) {
          params.set("search", selectedMobileFilter);
        }
        if (isInternational) {
          params.set("region", "international");
        }

        const response = await fetch(`/api/jobs?${params.toString()}`);
        const data = await response.json();

        // Handle API errors gracefully
        if (!response.ok || !data.jobs) {
          console.error("API error:", data);
          if (!append) {
            setJobs([]);
            setPagination(null);
          }
          return;
        }

        if (append) {
          setJobs((prev) => [...prev, ...data.jobs]);
        } else {
          setJobs(data.jobs);
        }
        setPagination(data.pagination);
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedCategory, selectedCompany, remoteOnly, selectedMobileFilter, isInternational]
  );

  useEffect(() => {
    fetchJobs(1, false);
  }, [fetchJobs]);

  const handlePageChange = async (page: number) => {
    await fetchJobs(page, false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCompany(e.target.value);
  };

  const handleRemoteToggle = () => {
    setRemoteOnly((prev) => !prev);
  };

  const handleMobileFilterChange = (filter: string) => {
    setSelectedMobileFilter(filter);
  };

  const handleInternationalToggle = () => {
    setIsInternational((prev) => !prev);
  };

  const handleJobClick = (job: Job) => {
    // Fire and forget - log the click without blocking navigation
    fetch("/api/jobs/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: job.id,
        company: job.company,
        companySlug: job.companySlug,
        jobTitle: job.title,
        applyUrl: job.href,
      }),
    }).catch(() => {
      // Silently fail - don't block the user
    });

    // Open the job link in a new tab
    if (job.href) {
      window.open(job.href, "_blank", "noopener,noreferrer");
    }
  };

  // Get unique companies from DEI list that have supported ATS
  const companiesWithJobs = deiCompanies
    .filter((c) => c.atsType === "greenhouse" || c.atsType === "workday")
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      {/* Hero */}
      <section className="bg-[var(--background)] pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight">
              Find your <span className="italic text-[#ef562a]">next</span>
              <br />
              opportunity
            </h1>
            <p className="mt-6 text-xl text-[var(--gray-600)]">
              Explore roles at companies committed to diversity and inclusion in
              tech.
            </p>
          </div>

          {/* Mobile filter pills */}
          <div className="md:hidden mt-8">
            <div className="flex flex-wrap gap-2">
              {mobileFilters.map((filter) => (
                <button
                  key={filter.label}
                  onClick={() => handleMobileFilterChange(filter.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedMobileFilter === filter.value
                      ? "bg-[#ffe500] text-black"
                      : "bg-[var(--card-bg)] text-[var(--gray-600)] border border-[var(--card-border)]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
              <button
                onClick={handleRemoteToggle}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  remoteOnly
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-[var(--card-bg)] text-[var(--gray-600)] border border-[var(--card-border)]"
                }`}
              >
                Remote
              </button>
              <button
                onClick={handleInternationalToggle}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isInternational
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : "bg-[var(--card-bg)] text-[var(--gray-600)] border border-[var(--card-border)]"
                }`}
              >
                International
              </button>
            </div>
            {pagination && (
              <p className="mt-3 text-sm text-[var(--gray-600)]">
                {pagination.total} {isInternational ? "international" : "US"} job{pagination.total !== 1 ? "s" : ""} found
              </p>
            )}
          </div>

          {/* Filters - hidden on mobile */}
          <div className="hidden md:block mt-6 space-y-4">
            {/* Categories */}
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-[#ffe500] text-black"
                      : "bg-[var(--gray-100)] text-[var(--gray-600)] hover:bg-[var(--gray-200)]"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Additional Filters */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Company Filter */}
              <select
                value={selectedCompany}
                onChange={handleCompanyChange}
                className="px-4 py-2 rounded-lg border border-[var(--gray-200)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[#ef562a] focus:border-transparent"
              >
                <option value="">All Companies</option>
                {companiesWithJobs.map((company) => (
                  <option key={company.slug} value={company.slug}>
                    {company.name}
                  </option>
                ))}
              </select>

              {/* Remote Toggle */}
              <button
                onClick={handleRemoteToggle}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  remoteOnly
                    ? "bg-[#ffe500] text-black"
                    : "bg-[var(--gray-100)] text-[var(--gray-600)] hover:bg-[var(--gray-200)]"
                }`}
              >
                Remote Only
              </button>

              {/* International Toggle */}
              <button
                onClick={handleInternationalToggle}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  isInternational
                    ? "bg-[#ffe500] text-black"
                    : "bg-[var(--gray-100)] text-[var(--gray-600)] hover:bg-[var(--gray-200)]"
                }`}
              >
                International
              </button>

              {/* Job Count */}
              {pagination && (
                <span className="text-sm text-[var(--gray-600)]">
                  {pagination.total} {isInternational ? "international" : "US"} job{pagination.total !== 1 ? "s" : ""}{" "}
                  found
                </span>
              )}
            </div>
          </div>
        </div>
      </section>


      {/* Job Listings */}
      <section className="bg-[var(--gray-50)] pt-8 pb-16 md:pt-12 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl border border-[var(--card-border)] animate-pulse"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="h-4 bg-[var(--gray-200)] rounded w-24 mb-3" />
                      <div className="h-6 bg-[var(--gray-200)] rounded w-3/4 mb-3" />
                      <div className="h-4 bg-[var(--gray-200)] rounded w-1/2" />
                    </div>
                    <div className="h-6 bg-[var(--gray-200)] rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-[var(--gray-600)]">
                No jobs found matching your criteria.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("All Jobs");
                  setSelectedCompany("");
                  setRemoteOnly(false);
                  setSelectedMobileFilter("");
                  setIsInternational(false);
                }}
                className="mt-4 text-[#ef562a] hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => handleJobClick(job)}
                  className="block w-full text-left bg-[var(--card-bg)] p-6 md:p-8 rounded-2xl hover:shadow-lg transition-shadow group border border-[var(--card-border)] cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[#ef562a] font-medium">
                          {job.company}
                        </span>
                        {job.remote && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                            Remote
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-xl md:text-2xl group-hover:text-[#ef562a] transition-colors">
                        {job.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--gray-600)]">
                        <span>{job.location}</span>
                        <span className="w-1 h-1 bg-[var(--gray-200)] rounded-full"></span>
                        <span>{job.type}</span>
                        <span className="w-1 h-1 bg-[var(--gray-200)] rounded-full"></span>
                        <span>{job.posted}</span>
                      </div>
                      {job.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {job.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="text-xs px-3 py-1 bg-[var(--gray-100)] text-[var(--gray-600)] rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {job.salary && (
                        <span className="text-lg font-medium">{job.salary}</span>
                      )}
                      <svg
                        className="w-6 h-6 text-[var(--gray-200)] group-hover:text-[#ef562a] transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && !loading && (
            <div className="mt-12 flex justify-center items-center gap-1">
              {/* Previous Arrow */}
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || loadingMore}
                className="px-3 py-2 text-[var(--gray-600)] disabled:opacity-30 disabled:cursor-not-allowed hover:text-[var(--foreground)] transition-colors"
              >
                &larr;
              </button>

              {/* Page Numbers */}
              {(() => {
                const pages: (number | string)[] = [];
                const current = pagination.page;
                const total = pagination.totalPages;

                // Always show first page
                pages.push(1);

                // Add ellipsis if needed
                if (current > 3) {
                  pages.push("...");
                }

                // Show pages around current
                for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
                  if (!pages.includes(i)) {
                    pages.push(i);
                  }
                }

                // Add ellipsis if needed
                if (current < total - 2) {
                  pages.push("...");
                }

                // Always show last page
                if (total > 1 && !pages.includes(total)) {
                  pages.push(total);
                }

                return pages.map((page, index) =>
                  typeof page === "string" ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-[var(--gray-400)]">
                      {page}
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      disabled={loadingMore}
                      className={`px-3 py-2 font-medium transition-colors ${
                        page === current
                          ? "text-[#ef562a]"
                          : "text-[var(--gray-600)] hover:text-[var(--foreground)]"
                      } disabled:opacity-50`}
                    >
                      {page}
                    </button>
                  )
                );
              })()}

              {/* Next Arrow */}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages || loadingMore}
                className="px-3 py-2 text-[var(--gray-600)] disabled:opacity-30 disabled:cursor-not-allowed hover:text-[var(--foreground)] transition-colors"
              >
                &rarr;
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
