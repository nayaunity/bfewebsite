"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/resources/system-design";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("resend", {
        email,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError("Something went wrong. Please try again.");
        setIsLoading(false);
      } else {
        // Redirect to verify-request page
        window.location.href = "/auth/verify-request";
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Sign in form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[var(--foreground)] mb-2"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={isLoading}
            className="w-full px-4 py-3 border border-[var(--card-border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !email}
          className="w-full py-3 px-4 bg-[var(--foreground)] text-[var(--background)] font-medium rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Sending link...
            </span>
          ) : (
            "Continue with Email"
          )}
        </button>
      </form>
    </>
  );
}

function SignInFormFallback() {
  return (
    <div className="space-y-6">
      <div className="h-20 bg-[var(--gray-100)] rounded-lg animate-pulse" />
      <div className="h-12 bg-[var(--gray-100)] rounded-lg animate-pulse" />
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--gray-50)] px-4">
      <div className="w-full max-w-md">
        <div className="bg-[var(--card-bg)] rounded-2xl shadow-lg p-8 border border-[var(--card-border)]">
          {/* Logo / Brand */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="font-serif text-2xl font-bold text-[var(--foreground)]">
                BFE
              </h1>
            </Link>
            <p className="mt-2 text-[var(--gray-600)] text-sm">
              Sign in to track your learning progress
            </p>
          </div>

          <Suspense fallback={<SignInFormFallback />}>
            <SignInForm />
          </Suspense>

          {/* Info text */}
          <p className="mt-6 text-center text-sm text-[var(--gray-600)]">
            We&apos;ll send you a magic link to sign in. No password needed.
          </p>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            href="/resources/system-design"
            className="text-sm text-[var(--gray-600)] hover:text-[var(--foreground)]"
          >
            &larr; Back to course
          </Link>
        </div>
      </div>
    </div>
  );
}
