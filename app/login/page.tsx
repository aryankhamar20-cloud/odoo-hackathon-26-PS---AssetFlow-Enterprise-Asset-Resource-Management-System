"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto mt-24 max-w-sm rounded-lg border border-border bg-paper-raised p-6">
      <h1 className="font-display text-2xl font-bold mb-4">Log in</h1>
      <form onSubmit={handleLogin} className="space-y-3">
        <input
          className="w-full rounded border border-border px-3 py-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded border border-border px-3 py-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-status-lost text-sm">{error}</p>}
        <button className="w-full rounded bg-teal py-2 text-white" type="submit">
          Log In
        </button>
      </form>
      <a href="/signup" className="mt-3 block text-center text-sm text-teal">
        Need an account? Sign up
      </a>
    </div>
  );
}
