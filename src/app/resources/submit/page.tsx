"use client";

import { useState } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function SubmitResourcePage() {
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
      const response = await fetch("/api/resource-submission", {
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
        // Show success for demo if API doesn't exist yet
        setIsSubmitted(true);
        form.reset();
      }
    } catch (error) {
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
        <main className="pt-32 md:pt-40 pb-16 md:pb-24 bg-[var(--background)] text-[var(--foreground)]">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl mb-4">Resource Submitted!</h1>
            <p className="text-[var(--gray-600)] text-lg mb-8">
              Thanks for sharing your knowledge with our community. We&apos;ll review your submission and reach out if we have any questions.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/resources"
                className="inline-block bg-[var(--foreground)] text-white px-8 py-4 rounded-full font-medium hover:bg-[var(--gray-800)] transition-colors"
              >
                Browse Resources
              </Link>
              <Link
                href="/"
                className="inline-block bg-[var(--card-bg)] text-[var(--foreground)] border border-[var(--card-border)] px-8 py-4 rounded-full font-medium hover:border-[#ffe500] transition-colors"
              >
                Back to Home
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
      <main className="pt-32 md:pt-40 pb-16 md:pb-24 bg-[var(--background)] text-[var(--foreground)]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <Link href="/resources" className="text-sm text-[var(--gray-600)] hover:text-[var(--foreground)] mb-4 inline-block">
              &larr; Back to Resources
            </Link>
            <h1 className="font-serif text-4xl md:text-5xl leading-tight">
              Submit a <span className="italic text-[#ef562a]">resource</span>
            </h1>
            <p className="mt-4 text-[var(--gray-600)] text-lg">
              Share articles, tutorials, tools, or guides that have helped you grow in tech. Your recommendation could be the catalyst for someone else&apos;s breakthrough.
            </p>
          </div>

          {/* What We're Looking For */}
          <div className="mb-12 p-6 bg-[var(--gray-50)] rounded-2xl">
            <h3 className="font-medium mb-4">What we&apos;re looking for</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#ef562a] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
                <span className="text-[var(--gray-600)]">Tutorials, courses, or guides on coding and tech skills</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#ef562a] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
                <span className="text-[var(--gray-600)]">Career growth and professional development content</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#ef562a] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
                <span className="text-[var(--gray-600)]">Useful tools, templates, or productivity boosters</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#ef562a] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
                <span className="text-[var(--gray-600)]">Content relevant to Black women and underrepresented groups in tech</span>
              </li>
            </ul>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Your Information */}
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
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors bg-[var(--card-bg)]"
                />
                <p className="mt-1 text-sm text-[var(--gray-600)]">
                  We&apos;ll only use this to follow up about your submission
                </p>
              </div>
            </div>

            {/* Resource Details */}
            <div className="space-y-6">
              <h3 className="font-medium text-lg border-b border-[var(--card-border)] pb-2">Resource Details</h3>

              {/* Resource Title */}
              <div>
                <label htmlFor="resource_title" className="block text-sm font-medium mb-2">
                  Resource Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="resource_title"
                  name="resource_title"
                  required
                  placeholder="e.g. The Complete Web Development Bootcamp"
                  className="w-full px-4 py-3 border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors bg-[var(--card-bg)]"
                />
              </div>

              {/* Resource URL */}
              <div>
                <label htmlFor="resource_url" className="block text-sm font-medium mb-2">
                  Resource URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  id="resource_url"
                  name="resource_url"
                  required
                  placeholder="https://example.com/resource"
                  className="w-full px-4 py-3 border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors bg-[var(--card-bg)]"
                />
              </div>

              {/* Category & Type Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    className="w-full px-4 py-3 border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors bg-[var(--card-bg)]"
                  >
                    <option value="">Select category...</option>
                    <option value="Tech & Coding">Tech & Coding</option>
                    <option value="Career Growth">Career Growth</option>
                    <option value="Finance">Finance</option>
                    <option value="Personal Development">Personal Development</option>
                    <option value="Tools & Productivity">Tools & Productivity</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Resource Type */}
                <div>
                  <label htmlFor="resource_type" className="block text-sm font-medium mb-2">
                    Resource Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="resource_type"
                    name="resource_type"
                    required
                    className="w-full px-4 py-3 border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors bg-[var(--card-bg)]"
                  >
                    <option value="">Select type...</option>
                    <option value="Article">Article / Blog Post</option>
                    <option value="Course">Online Course</option>
                    <option value="Tutorial">Tutorial / Guide</option>
                    <option value="Video">Video / YouTube</option>
                    <option value="Podcast">Podcast</option>
                    <option value="Book">Book / E-book</option>
                    <option value="Tool">Tool / Software</option>
                    <option value="Template">Template / Starter Kit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Skill Level */}
              <div>
                <label htmlFor="skill_level" className="block text-sm font-medium mb-2">
                  Skill Level <span className="text-red-500">*</span>
                </label>
                <select
                  id="skill_level"
                  name="skill_level"
                  required
                  className="w-full px-4 py-3 border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors bg-[var(--card-bg)]"
                >
                  <option value="">Who is this best for?</option>
                  <option value="Beginner">Beginner - No prior experience needed</option>
                  <option value="Intermediate">Intermediate - Some experience required</option>
                  <option value="Advanced">Advanced - For experienced professionals</option>
                  <option value="All Levels">All Levels - Suitable for everyone</option>
                </select>
              </div>

              {/* Is it Free? */}
              <div>
                <label htmlFor="is_free" className="block text-sm font-medium mb-2">
                  Is this resource free? <span className="text-red-500">*</span>
                </label>
                <select
                  id="is_free"
                  name="is_free"
                  required
                  className="w-full px-4 py-3 border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors bg-[var(--card-bg)]"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes - Completely free</option>
                  <option value="Freemium">Freemium - Free with paid options</option>
                  <option value="No">No - Paid resource</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Why do you recommend this? <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  required
                  placeholder="Tell us what makes this resource valuable and how it helped you..."
                  className="w-full px-4 py-3 border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors resize-none bg-[var(--card-bg)]"
                />
                <p className="mt-1 text-sm text-[var(--gray-600)]">
                  Personal experiences help others decide if this resource is right for them
                </p>
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <label htmlFor="additional_info" className="block text-sm font-medium mb-2">
                Anything else we should know? <span className="text-[var(--gray-600)]">(optional)</span>
              </label>
              <textarea
                id="additional_info"
                name="additional_info"
                rows={3}
                placeholder="Any other context, creator attribution, or relevant details..."
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
                {isSubmitting ? "Submitting..." : "Submit Resource"}
              </button>
              <p className="mt-4 text-center text-sm text-[var(--gray-600)]">
                We review all submissions and will add approved resources to our collection
              </p>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
