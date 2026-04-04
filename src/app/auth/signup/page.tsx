"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SignUpForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/profile";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) return;

    setLoading(true);
    setError("");

    try {
      // Create account
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      // Auto sign in
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but sign-in failed. Try signing in manually.");
        setLoading(false);
      } else {
        window.location.href = callbackUrl;
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-6">
        <Link href="/" className="font-serif text-2xl font-bold">
          the<span className="text-[#ef562a]">BFE</span>
        </Link>
        <p className="text-sm text-[var(--gray-600)] mt-2">
          Create your account
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              First name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jane"
              required
              className="w-full px-4 py-3 text-sm rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#ef562a]/30 focus:border-[#ef562a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Last name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              required
              className="w-full px-4 py-3 text-sm rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#ef562a]/30 focus:border-[#ef562a]"
            />
          </div>
        </div>
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
            placeholder="At least 8 characters"
            required
            minLength={8}
            className="w-full px-4 py-3 text-sm rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#ef562a]/30 focus:border-[#ef562a]"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !firstName.trim() || !lastName.trim() || !email.trim() || !password}
          className="w-full py-3 text-sm font-medium rounded-lg bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-4 text-sm text-center text-[var(--gray-600)]">
        Already have an account?{" "}
        <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-[#ef562a] hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Suspense>
          <SignUpForm />
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
