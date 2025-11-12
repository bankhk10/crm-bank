"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload.error ?? "ไม่สามารถสร้างบัญชีได้");
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      });

      if (result?.ok) {
        router.push("/dashboard/aggregateReport");
        router.refresh();
      } else {
        router.push("/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <input
        className="w-full rounded border px-3 py-2"
        onChange={(event) => setName(event.target.value)}
        placeholder="Full name"
        required
        value={name}
      />
      <input
        autoComplete="email"
        className="w-full rounded border px-3 py-2"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        required
        type="email"
        value={email}
      />
      <input
        autoComplete="new-password"
        className="w-full rounded border px-3 py-2"
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        required
        type="password"
        value={password}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        className="w-full rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-70"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Signing up..." : "Sign up"}
      </button>
    </form>
  );
}
