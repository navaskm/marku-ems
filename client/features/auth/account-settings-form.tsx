"use client";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useCompanyData, useDemo } from "@/features/auth/demo-context";
import { useEffect, useState } from "react";

function cleanInitialPhone(raw?: string): string {
  if (!raw) return "";
  let val = raw.trim();
  const digits = val.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length > 10) {
    val = digits.slice(2);
  }
  return val;
}

export function AccountSettingsForm() {
  const { session, updateProfile } = useDemo();
  const { currentEmployee, employees } = useCompanyData();

  const activeEmployee =
    currentEmployee ??
    employees.find(
      (e) =>
        e.userId === session?.userId ||
        (session?.email && e.email.toLowerCase() === session.email.toLowerCase()),
    );

  const [email, setEmail] = useState(session?.email ?? activeEmployee?.email ?? "");
  const [phone, setPhone] = useState(cleanInitialPhone(activeEmployee?.phone));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (session?.email) {
      setEmail(session.email);
    }
  }, [session?.email]);

  useEffect(() => {
    if (activeEmployee?.phone) {
      setPhone(cleanInitialPhone(activeEmployee.phone));
    }
  }, [activeEmployee?.phone]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!cleanEmail) {
      setError("Email address is required.");
      return;
    }
    if (!cleanEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (!cleanPhone) {
      setError("Phone number is required.");
      return;
    }

    const digits = cleanPhone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    const submissionPhone = digits.length >= 10 ? `+91 ${digits.slice(-10)}` : cleanPhone;

    setPending(true);
    try {
      const err = await updateProfile({ email: cleanEmail, phone: submissionPhone });
      if (err) {
        setError(err);
      } else {
        setMessage("Email and phone updated in database. Use these new credentials next time you sign in.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update account details.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
      <Field label="Sign-in email">
        <Input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@company.demo"
        />
      </Field>

      <Field label="Phone number">
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-semibold text-slate-500">
            <span>+91</span>
            <span className="ml-2.5 h-4 w-px bg-slate-200" />
          </div>
          <Input
            type="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(event) => {
              let val = event.target.value.replace(/[^\d\s+]/g, "");
              const d = val.replace(/\D/g, "");
              if (d.startsWith("91") && d.length > 10) {
                val = d.slice(2);
              }
              setPhone(val);
            }}
            placeholder="98765 43210"
            className="pl-16"
          />
        </div>
      </Field>

      <div className="sm:col-span-2">
        {error ? <p role="alert" className="mb-3 text-sm text-rose-600">{error}</p> : null}
        {message ? <p role="status" className="mb-3 text-sm text-emerald-700">{message}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save email & phone"}
        </Button>
      </div>
    </form>
  );
}
