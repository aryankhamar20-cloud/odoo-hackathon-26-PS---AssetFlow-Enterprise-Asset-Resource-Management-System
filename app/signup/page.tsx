"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// Signup always creates an Employee — role assignment happens ONLY via
// Admin > Employee Directory. Do not add a role selector here.
export default function SignupPage() {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) {
      setError(error?.message ?? "Signup failed");
      return;
    }
    const { error: insertError } = await supabase.from("employees").insert({
      auth_user_id: data.user.id,
      name,
      email,
      role: "employee",
      status: "active",
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto mt-24 max-w-sm rounded-lg border border-border bg-paper-raised p-6">
      <h1 className="font-display text-2xl font-bold mb-4">Sign up</h1>
      <form onSubmit={handleSignup} className="space-y-3">
        <input
          className="w-full rounded border border-border px-3 py-2"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
          Create Account
        </button>
      </form>
    </div>
  );
}
