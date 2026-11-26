"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="text-center max-w-md">
        <h1 className="page-title mb-4">
          Something went wrong
        </h1>
        <p className="mb-8 font-light leading-relaxed text-ink-soft">
          An unexpected error occurred. Trying again often clears it.
        </p>
        <button
          onClick={reset}
          className="btn btn-primary"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
