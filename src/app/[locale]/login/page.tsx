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
      console.log("Attempting to sign in with email:", email);

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      console.log("Sign in result:", result);

      if (result?.error) {
        setError(`Login failed: ${result.error}`);
        console.error("Login error:", result.error);
      } else if (result?.ok) {
        console.log("Login successful, redirecting to admin");
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Debug info in development */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <p>
              <strong>Debug Info:</strong>
            </p>
            <p>Status: {status}</p>
            <p>NEXTAUTH_URL: {process.env.NEXTAUTH_URL || "Not set"}</p>
            <p>
              NEXTAUTH_SECRET: {process.env.NEXTAUTH_SECRET ? "Set" : "Not set"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Main component with Suspense
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
