"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Step = "email" | "signin" | "set_password" | "create_account" | "magic_link_sent";

function AuthForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/profile";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        // Retry with absolute URL if redirect ate the response
        const retry = await fetch("https://www.theblackfemaleengineer.com/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        });
        data = await retry.json();
      }

      if (data.status === "has_password") {
        setFirstName(data.firstName || "");
        setStep("signin");
      } else if (data.status === "needs_password") {
        setFirstName(data.firstName || "");
        setStep("set_password");
      } else {
        setStep("create_account");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Incorrect password. Try again or use a magic link.");
      setLoading(false);
    } else {
      window.location.href = callbackUrl;
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        const retry = await fetch("https://www.theblackfemaleengineer.com/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        });
        data = await retry.json();
      }

      if (data.success) {
        // Auto sign in with new password
        const result = await signIn("credentials", {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        });
        if (result?.error) {
          setError("Password set but sign-in failed. Try signing in.");
          setLoading(false);
        } else {
          window.location.href = callbackUrl;
        }
      } else {
        setError(data.error || "Failed to set password.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        const retry = await fetch("https://www.theblackfemaleengineer.com/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        });
        data = await retry.json();
      }

      if (data.success) {
        const result = await signIn("credentials", {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        });
        if (result?.error) {
          setError("Account created but sign-in failed. Try signing in.");
          setLoading(false);
        } else {
          window.location.href = callbackUrl;
        }
      } else {
        setError(data.error || "Failed to create account.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    setLoading(true);
    setError("");
    await signIn("resend", {
      email: email.trim().toLowerCase(),
      callbackUrl,
      redirect: false,
    });
    setStep("magic_link_sent");
    setLoading(false);
  };

  if (step === "magic_link_sent") {
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
          onClick={() => { setStep("email"); setPassword(""); setError(""); }}
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
          {step === "email" && "Enter your email to get started"}
          {step === "signin" && (firstName ? `Welcome back, ${firstName}` : "Welcome back")}
          {step === "set_password" && "Create a password to speed up sign in"}
          {step === "create_account" && "Create your account"}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {step === "email" && (
        <form onSubmit={checkEmail} className="space-y-4">
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
              autoFocus
              className="w-full px-4 py-3 text-sm rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#ef562a]/30 focus:border-[#ef562a]"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full py-3 text-sm font-medium rounded-lg bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Checking..." : "Continue"}
          </button>
        </form>
      )}

      {step === "signin" && (
        <>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="px-4 py-3 text-sm rounded-lg bg-[var(--gray-50)] text-[var(--foreground)] border border-[var(--card-border)]">
              {email}
              <button type="button" onClick={() => { setStep("email"); setPassword(""); setError(""); }} className="ml-2 text-[#ef562a] text-xs hover:underline">change</button>
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
                autoFocus
                className="w-full px-4 py-3 text-sm rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#ef562a]/30 focus:border-[#ef562a]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 text-sm font-medium rounded-lg bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <button
            onClick={handleMagicLink}
            disabled={loading}
            className="mt-3 w-full text-sm text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors text-center"
          >
            Or sign in with magic link instead
          </button>
        </>
      )}

      {step === "set_password" && (
        <>
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div className="px-4 py-3 text-sm rounded-lg bg-[var(--gray-50)] text-[var(--foreground)] border border-[var(--card-border)]">
              {email}
              <button type="button" onClick={() => { setStep("email"); setPassword(""); setError(""); }} className="ml-2 text-[#ef562a] text-xs hover:underline">change</button>
            </div>
            <p className="text-xs text-[var(--gray-600)]">
              You previously signed in with a magic link. Set a password so you can sign in faster next time.
            </p>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Create a password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                autoFocus
                minLength={8}
                className="w-full px-4 py-3 text-sm rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#ef562a]/30 focus:border-[#ef562a]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !password || password.length < 8}
              className="w-full py-3 text-sm font-medium rounded-lg bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Setting password..." : "Set Password & Sign In"}
            </button>
          </form>
          <button
            onClick={handleMagicLink}
            disabled={loading}
            className="mt-3 w-full text-sm text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors text-center"
          >
            Or sign in with magic link instead
          </button>
        </>
      )}

      {step === "create_account" && (
        <>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="px-4 py-3 text-sm rounded-lg bg-[var(--gray-50)] text-[var(--foreground)] border border-[var(--card-border)]">
              {email}
              <button type="button" onClick={() => { setStep("email"); setPassword(""); setError(""); }} className="ml-2 text-[#ef562a] text-xs hover:underline">change</button>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Create a password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                autoFocus
                minLength={8}
                className="w-full px-4 py-3 text-sm rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#ef562a]/30 focus:border-[#ef562a]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !password || password.length < 8}
              className="w-full py-3 text-sm font-medium rounded-lg bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
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
          <AuthForm />
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
