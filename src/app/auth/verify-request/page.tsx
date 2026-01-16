import Link from "next/link";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Email icon */}
          <div className="mx-auto w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 text-neutral-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-serif font-bold text-neutral-900 mb-2">
            Check your email
          </h1>

          {/* Description */}
          <p className="text-neutral-600 mb-6">
            We sent you a sign-in link. Click the link in your email to continue.
          </p>

          {/* Tips */}
          <div className="bg-neutral-50 rounded-lg p-4 text-left text-sm text-neutral-600 mb-6">
            <p className="font-medium text-neutral-700 mb-2">
              Didn&apos;t receive the email?
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Check your spam folder</li>
              <li>Make sure you entered the correct email</li>
              <li>Wait a few minutes and try again</li>
            </ul>
          </div>

          {/* Back link */}
          <Link
            href="/auth/signin"
            className="inline-block text-sm font-medium text-neutral-900 hover:underline"
          >
            &larr; Try a different email
          </Link>
        </div>
      </div>
    </div>
  );
}
