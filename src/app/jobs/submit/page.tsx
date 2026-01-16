"use client";

import { useState } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function SubmitJobPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("https://formspree.io/f/YOUR_FORM_ID", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        setIsSubmitted(true);
        form.reset();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <>
        <Navigation />
        <main className="pt-32 md:pt-40 pb-16 md:pb-24">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl mb-4">Thank you!</h1>
            <p className="text-gray-600 text-lg mb-8">
              Your job submission has been received. We&apos;ll review it and add it to our board if it&apos;s a good fit for our community.
            </p>
            <Link
              href="/jobs"
              className="inline-block bg-black text-white px-8 py-4 rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              Back to Job Board
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="pt-32 md:pt-40 pb-16 md:pb-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <Link href="/jobs" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
              &larr; Back to Job Board
            </Link>
            <h1 className="font-serif text-4xl md:text-5xl leading-tight">
              Submit a <span className="italic text-[#ef562a]">job</span>
            </h1>
            <p className="mt-4 text-gray-600 text-lg">
              Know of a great opportunity? Share it with our community of 200K+ tech professionals.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Submitter Type */}
            <div>
              <label className="block text-sm font-medium mb-3">I am a...</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="submitter_type"
                    value="Company/Recruiter"
                    required
                    className="w-4 h-4 text-[#ef562a] focus:ring-[#ef562a]"
                  />
                  <span>Company / Recruiter</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="submitter_type"
                    value="Community Member"
                    className="w-4 h-4 text-[#ef562a] focus:ring-[#ef562a]"
                  />
                  <span>Community Member</span>
                </label>
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label htmlFor="company" className="block text-sm font-medium mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="company"
                name="company"
                required
                placeholder="e.g. Microsoft"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors"
              />
            </div>

            {/* Job Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                placeholder="e.g. Senior Software Engineer"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors"
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                required
                placeholder="e.g. San Francisco, CA or Remote"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors"
              />
            </div>

            {/* Remote & Job Type Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Remote */}
              <div>
                <label htmlFor="remote" className="block text-sm font-medium mb-2">
                  Remote? <span className="text-red-500">*</span>
                </label>
                <select
                  id="remote"
                  name="remote"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors bg-white"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes - Fully Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="No">No - On-site</option>
                </select>
              </div>

              {/* Job Type */}
              <div>
                <label htmlFor="job_type" className="block text-sm font-medium mb-2">
                  Job Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="job_type"
                  name="job_type"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors bg-white"
                >
                  <option value="">Select...</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
            </div>

            {/* Salary Range */}
            <div>
              <label htmlFor="salary" className="block text-sm font-medium mb-2">
                Salary Range <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                id="salary"
                name="salary"
                placeholder="e.g. $120K - $180K"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors"
              />
            </div>

            {/* Job URL */}
            <div>
              <label htmlFor="job_url" className="block text-sm font-medium mb-2">
                Link to Job Posting <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                id="job_url"
                name="job_url"
                required
                placeholder="https://careers.company.com/job/123"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors"
              />
              <p className="mt-1 text-sm text-gray-500">
                Direct link to the job posting so we can verify it&apos;s active
              </p>
            </div>

            {/* Skills/Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium mb-2">
                Skills / Tags <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                placeholder="e.g. Python, React, AWS, Machine Learning"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors"
              />
              <p className="mt-1 text-sm text-gray-500">
                Comma-separated list of relevant skills
              </p>
            </div>

            {/* Submitter Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Your Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="you@company.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors"
              />
              <p className="mt-1 text-sm text-gray-500">
                We&apos;ll only contact you if we have questions about the listing
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#f5dc00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Job"}
              </button>
            </div>
          </form>

          {/* Note */}
          <div className="mt-12 p-6 bg-gray-50 rounded-2xl">
            <h3 className="font-medium mb-2">What happens next?</h3>
            <p className="text-sm text-gray-600">
              We review every submission to ensure it&apos;s a good fit for our community.
              If approved, your job will appear on our board within 24-48 hours.
              We prioritize roles at companies committed to diversity and inclusion.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
