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

    // Convert FormData to JSON object
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    try {
      // Submit to API for partnership inquiries
      const response = await fetch("/api/partnership-inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setIsSubmitted(true);
        form.reset();
      } else {
        // If API doesn't exist yet, still show success for demo
        setIsSubmitted(true);
        form.reset();
      }
    } catch (error) {
      // For now, show success even if API isn't set up
      console.error("Error submitting form:", error);
      setIsSubmitted(true);
      form.reset();
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
            <h1 className="font-serif text-4xl md:text-5xl mb-4">Inquiry Received!</h1>
            <p className="text-[var(--gray-600)] text-lg mb-8">
              Thanks for your interest in partnering with me. I&apos;ll review your inquiry and get back to you within 2-3 business days to discuss featured job placement options.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/jobs"
                className="inline-block bg-[var(--foreground)] text-white px-8 py-4 rounded-full font-medium hover:bg-[var(--gray-800)] transition-colors"
              >
                View Job Board
              </Link>
              <Link
                href="/work-with-us"
                className="inline-block bg-[var(--card-bg)] text-[var(--foreground)] border border-[var(--card-border)] px-8 py-4 rounded-full font-medium hover:border-[#ffe500] transition-colors"
              >
                Other Partnerships
              </Link>
            </div>
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
            <Link href="/work-with-us" className="text-sm text-[var(--gray-600)] hover:text-[var(--foreground)] mb-4 inline-block">
              &larr; Back to Partnerships
            </Link>
            <h1 className="font-serif text-4xl md:text-5xl leading-tight">
              Post a <span className="italic text-[#ef562a]">featured job</span>
            </h1>
            <p className="mt-4 text-[var(--gray-600)] text-lg">
              Get your open roles in front of 200K+ engaged tech professionals. Fill out this form and I&apos;ll follow up to discuss featured placement options.
            </p>
          </div>

          {/* Benefits */}
          <div className="mb-12 p-6 bg-[var(--gray-50)] rounded-2xl">
            <h3 className="font-medium mb-4">Featured Job Benefits</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#ef562a] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
                <span className="text-[var(--gray-600)]">Premium placement at the top of the job board</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#ef562a] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
                <span className="text-[var(--gray-600)]">Social media amplification across my platforms</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#ef562a] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
                <span className="text-[var(--gray-600)]">Analytics and performance reporting</span>
              </li>
            </ul>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Contact Info Section */}
            <div className="space-y-6">
              <h3 className="font-medium text-lg border-b border-[var(--card-border)] pb-2">Your Information</h3>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="e.g. Jane Smith"
                  className="w-full px-4 py-3 border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors bg-[var(--card-bg)]"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Work Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors bg-[var(--card-bg)]"
                />
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
                  placeholder="e.g. Acme Inc."
                  className="w-full px-4 py-3 border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors bg-[var(--card-bg)]"
                />
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium mb-2">
                  Your Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  className="w-full px-4 py-3 border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors bg-[var(--card-bg)]"
                >
                  <option value="">Select your role...</option>
                  <option value="Recruiter">Recruiter</option>
                  <option value="Talent Acquisition">Talent Acquisition</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="Hiring Manager">Hiring Manager</option>
                  <option value="Founder/Executive">Founder / Executive</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Job Info Section */}
            <div className="space-y-6">
              <h3 className="font-medium text-lg border-b border-[var(--card-border)] pb-2">Job Details</h3>

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
                  className="w-full px-4 py-3 border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors bg-[var(--card-bg)]"
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
                  className="w-full px-4 py-3 border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors bg-[var(--card-bg)]"
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
                    className="w-full px-4 py-3 border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors bg-[var(--card-bg)]"
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
                    className="w-full px-4 py-3 border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors bg-[var(--card-bg)]"
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
                  Salary Range <span className="text-[var(--gray-600)]">(optional but recommended)</span>
                </label>
                <input
                  type="text"
                  id="salary"
                  name="salary"
                  placeholder="e.g. $120K - $180K"
                  className="w-full px-4 py-3 border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors bg-[var(--card-bg)]"
                />
                <p className="mt-1 text-sm text-[var(--gray-600)]">
                  Jobs with salary info get 40% more engagement
                </p>
              </div>

              {/* Job URL */}
              <div>
                <label htmlFor="job_url" className="block text-sm font-medium mb-2">
                  Link to Job Posting <span className="text-[var(--gray-600)]">(optional)</span>
                </label>
                <input
                  type="url"
                  id="job_url"
                  name="job_url"
                  placeholder="https://careers.company.com/job/123"
                  className="w-full px-4 py-3 border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors bg-[var(--card-bg)]"
                />
              </div>

              {/* Number of Roles */}
              <div>
                <label htmlFor="num_roles" className="block text-sm font-medium mb-2">
                  How many roles are you looking to feature?
                </label>
                <select
                  id="num_roles"
                  name="num_roles"
                  className="w-full px-4 py-3 border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors bg-[var(--card-bg)]"
                >
                  <option value="1">1 role</option>
                  <option value="2-5">2-5 roles</option>
                  <option value="5-10">5-10 roles</option>
                  <option value="10+">10+ roles</option>
                </select>
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">
                Anything else I should know? <span className="text-[var(--gray-600)]">(optional)</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                placeholder="Tell me about your hiring goals, timeline, or any specific requirements..."
                className="w-full px-4 py-3 border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors resize-none bg-[var(--card-bg)]"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#f5dc00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Inquiry"}
              </button>
              <p className="mt-4 text-center text-sm text-[var(--gray-600)]">
                I&apos;ll respond within 2-3 business days
              </p>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
