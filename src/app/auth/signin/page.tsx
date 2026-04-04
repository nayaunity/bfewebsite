"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/profile";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password. Try again or use a magic link.");
      setLoading(false);
    } else {
      window.location.href = callbackUrl;
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    await signIn("resend", {
      email: email.trim().toLowerCase(),
      callbackUrl,
      redirect: false,
    });

    setMagicLinkSent(true);
    setLoading(false);
  };

  if (magicLinkSent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </div>
        <h2 className="font-serif text-xl text-[var(--foreground)] mb-2">Check your email</h2>
        <p className="text-sm text-[var(--gray-600)] mb-4">
          We sent a sign-in link to <strong>{email}</strong>
        </p>
        <p className="text-xs text-[var(--gray-600)]">
          Check your spam folder if you don&apos;t see it.
        </p>
        <button
          onClick={() => { setMagicLinkSent(false); setShowMagicLink(false); }}
          className="mt-4 text-sm text-[#ef562a] hover:underline"
        >
          Try a different method
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-6">
        <Link href="/" className="font-serif text-2xl font-bold">
          the<span className="text-[#ef562a]">BFE</span>
        </Link>
        <p className="text-sm text-[var(--gray-600)] mt-2">
          Sign in to your account
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {!showMagicLink ? (
        <>
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 text-sm rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#ef562a]/30 focus:border-[#ef562a]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={8}
                className="w-full px-4 py-3 text-sm rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#ef562a]/30 focus:border-[#ef562a]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full py-3 text-sm font-medium rounded-lg bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <button
              onClick={() => setShowMagicLink(true)}
              className="text-sm text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors"
            >
              Or sign in with magic link instead
            </button>
            <p className="text-sm text-[var(--gray-600)]">
              Don&apos;t have an account?{" "}
              <Link href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-[#ef562a] hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </>
      ) : (
        <>
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 text-sm rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#ef562a]/30 focus:border-[#ef562a]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-3 text-sm font-medium rounded-lg bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Magic Link"}
            </button>
          </form>
          <p className="text-xs text-[var(--gray-600)] text-center mt-3">
            A sign-in link will be sent to your email. No password needed.
          </p>
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowMagicLink(false)}
              className="text-sm text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors"
            >
              Back to password sign in
            </button>
          </div>
        </>
      )}
    </>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Suspense>
          <SignInForm />
        </Suspense>
      </div>
      <Link
        href="/"
        className="mt-8 text-sm text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors"
      >
        &larr; Back to home
      </Link>
    </div>
  );
}
