"use client";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ApiError, apiLogout, apiSetPassword } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SetupPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const query = new URLSearchParams(window.location.search);
    const uid = query.get("uid");
    const token = query.get("token");
    if (!uid || !token) {
      setError("This password setup link is invalid or expired.");
      return;
    }
    setPending(true);
    try {
      await apiSetPassword(uid, token, password);
      apiLogout();
      window.history.replaceState(null, "", "/setup-password");
      setComplete(true);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to set your password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-slate-900">Set your password</h1>
        <p className="mt-2 text-sm text-slate-600">Choose a private password for your Workline account.</p>
        {complete ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-emerald-700">Your password is set. You can sign in now.</p>
            <Button className="w-full" onClick={() => router.replace("/login")}>Continue to sign in</Button>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <Field label="New password">
              <Input type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            </Field>
            <Field label="Confirm password">
              <Input type="password" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </Field>
            {error ? <p role="alert" className="text-sm text-rose-600">{error}</p> : null}
            <Button className="w-full" type="submit" disabled={pending}>{pending ? "Saving..." : "Set password"}</Button>
          </form>
        )}
      </section>
    </main>
  );
}
