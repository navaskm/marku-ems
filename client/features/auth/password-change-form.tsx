"use client";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ApiError, apiChangePassword } from "@/lib/api";
import { useState } from "react";

export function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setPending(true);
    try {
      await apiChangePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password changed. Other sign-ins have been invalidated.");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to change your password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
      <Field label="Current password">
        <Input type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
      </Field>
      <div className="hidden sm:block" />
      <Field label="New password">
        <Input type="password" autoComplete="new-password" required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
      </Field>
      <Field label="Confirm new password">
        <Input type="password" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
      </Field>
      <div className="sm:col-span-2">
        {error ? <p role="alert" className="mb-3 text-sm text-rose-600">{error}</p> : null}
        {message ? <p role="status" className="mb-3 text-sm text-emerald-700">{message}</p> : null}
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Change password"}</Button>
      </div>
    </form>
  );
}
