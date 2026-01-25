"use client";

import { useState } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import deiCompanies from "@/data/dei-companies.json";

type Company = {
  name: string;
  slug: string;
  careersUrl: string;
  industry: string;
};

export default function DEICompaniesPage() {
  const companies = deiCompanies as Company[];
  const industries = ["All", ...Array.from(new Set(companies.map((c) => c.industry)))];
  const [selectedIndustry, setSelectedIndustry] = useState("All");

  const filteredCompanies =
    selectedIndustry === "All"
      ? companies
      : companies.filter((c) => c.industry === selectedIndustry);

  return (
    <>
      <Navigation />
      <main className="pt-32 md:pt-40 bg-[var(--background)] text-[var(--foreground)]">
        {/* Hero */}
        <section className="bg-[var(--background)] pb-12 md:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back Link */}
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 text-[var(--gray-600)] hover:text-[#ef562a] transition-colors mb-8"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Jobs
            </Link>

            <div className="max-w-3xl">
              <span className="text-sm tracking-widest text-[var(--gray-600)]">
                DEI DIRECTORY
              </span>
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight mt-4">
                Companies committed to{" "}
                <span className="italic text-[#ef562a]">DEI</span>
              </h1>
              <p className="mt-6 text-xl text-[var(--gray-600)]">
                Explore {companies.length} companies known for their dedication to
                diversity, equity, and inclusion. Click any company to view their
                careers page.
              </p>
            </div>

            {/* Industry Filters */}
            <div className="mt-10 flex flex-wrap gap-3">
              {industries.map((industry) => (
                <button
                  key={industry}
                  onClick={() => setSelectedIndustry(industry)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedIndustry === industry
                      ? "bg-[#ffe500] text-black"
                      : "bg-[var(--gray-100)] text-[var(--gray-600)] hover:bg-[var(--gray-200)]"
                  }`}
                >
                  {industry}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Company Grid */}
        <section className="bg-[var(--gray-50)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company) => (
                <a
                  key={company.slug}
                  href={company.careersUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--card-border)] hover:border-[#ffe500] hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-xs px-3 py-1 bg-[var(--gray-100)] text-[var(--gray-600)] rounded-full">
                      {company.industry}
                    </span>
                    <svg
                      className="w-5 h-5 text-[var(--gray-200)] group-hover:text-[#ef562a] transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </div>
                  <h3 className="font-serif text-xl md:text-2xl group-hover:text-[#ef562a] transition-colors">
                    {company.name}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--gray-600)]">
                    View careers at {company.name}
                  </p>
                </a>
              ))}
            </div>

            {filteredCompanies.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[var(--gray-600)]">
                  No companies found in this industry.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-[var(--background)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[var(--card-bg)] rounded-3xl p-8 md:p-12 border border-[var(--card-border)] text-center">
              <h2 className="font-serif text-3xl md:text-4xl">
                Know a DEI-committed company?
              </h2>
              <p className="mt-4 text-[var(--gray-600)] max-w-2xl mx-auto">
                Help me grow this directory by suggesting companies that are
                making real strides in diversity, equity, and inclusion.
              </p>
              <a
                href="mailto:hello@bfepartnerships.com?subject=DEI Company Suggestion"
                className="inline-flex items-center gap-2 mt-8 bg-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#f5dc00] transition-colors"
              >
                Suggest a Company
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
