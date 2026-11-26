"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

// Create a separate component that uses useSearchParams
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { status } = useSession();
  const searchParams = useSearchParams();

  // If already authenticated, redirect to admin
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/admin");
    }

    // Check for error in URL
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(`Authentication failed: ${errorParam}`);
    }
  }, [status, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError(`Login failed: ${result.error}`);
        console.error("Login error:", result.error);
      } else if (result?.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        setError("Unexpected response from authentication server");
      }
    } catch (error) {
      console.error("Login exception:", error);
      setError(
        `An error occurred: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="card panel-pad w-full max-w-md">
        <h1 className="section-title mb-6 text-center">Admin Login</h1>

        {error && <div className="notice-error mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="input-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="input-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary btn-block"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

      </div>
    </div>
  );
}

// Main component with Suspense
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canvas">
          <div className="spinner h-10 w-10" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
