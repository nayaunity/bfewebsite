"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const response = await fetch("/api/jobs?limit=6");
        const data = await response.json();
        setJobs(data.jobs || []);
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, []);

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

  return (
    <section id="jobs" className="bg-[var(--gray-50)] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl">
            <span className="italic">find your</span> NEXT ROLE
          </h2>
          <p className="mt-4 text-[var(--gray-600)] max-w-xl mx-auto">
            Explore opportunities at companies committed to diversity and inclusion.
          </p>
        </div>

        {/* Jobs Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeleton
            [...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--card-border)] animate-pulse"
              >
                <div className="h-4 bg-[var(--gray-200)] rounded w-20 mb-3" />
                <div className="h-6 bg-[var(--gray-200)] rounded w-3/4 mb-4" />
                <div className="h-4 bg-[var(--gray-200)] rounded w-1/2" />
              </div>
            ))
          ) : jobs.length > 0 ? (
            jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => handleJobClick(job)}
                className="bg-[var(--card-bg)] p-6 rounded-2xl hover:shadow-lg transition-shadow group border border-[var(--card-border)] text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#ef562a] text-sm font-medium">{job.company}</span>
                  {job.remote && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                      Remote
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-xl mt-2 group-hover:text-[#ef562a] transition-colors">
                  {job.title}
                </h3>
                <div className="mt-4 flex items-center gap-3 text-sm text-[var(--gray-600)]">
                  <span>{job.location}</span>
                  <span className="w-1 h-1 bg-[var(--gray-200)] rounded-full"></span>
                  <span>{job.type}</span>
                </div>
              </button>
            ))
          ) : (
            // Empty state
            <div className="col-span-full text-center py-8 text-[var(--gray-600)]">
              No jobs available at the moment. Check back soon!
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/jobs"
            className="inline-block bg-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#f5dc00] transition-colors"
          >
            View All Jobs
          </Link>
        </div>

        {/* For Employers */}
        <div className="mt-20 text-center border-t border-[var(--card-border)] pt-12">
          <p className="text-sm tracking-wide mb-4">ARE YOU HIRING?</p>
          <Link
            href="/jobs/submit"
            className="inline-block border-2 border-[#ffe500] text-[var(--foreground)] px-8 py-4 rounded-full font-medium hover:bg-[#ffe500] hover:text-black transition-colors"
          >
            Post a Job
          </Link>
        </div>
      </div>
    </section>
  );
}
