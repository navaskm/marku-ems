"use client";

import { useDemo } from "@/features/auth/demo-context";
import { ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function LoginForm() {
  const { login } = useDemo();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!email.trim()) nextErrors.email = "Email is required.";
    else if (!email.includes("@")) nextErrors.email = "Enter a valid email address.";
    const rawDigits = phone.replace(/\D/g, "");
    if (!phone.trim()) nextErrors.phone = "Phone number is required.";
    else if (rawDigits.length !== 10 && rawDigits.length !== 12) nextErrors.phone = "Enter a valid 10-digit mobile number.";
    if (!password) nextErrors.password = "Password is required.";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    const submissionPhone = rawDigits.length >= 10 ? `+91 ${rawDigits.slice(-10)}` : phone.trim();
    const result = await login({ email, phone: submissionPhone, password });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace(result.role === "manager" ? "/manager" : "/employee");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-page px-4 py-6 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#d8f1ed]/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-24 h-[30rem] w-[30rem] rounded-full bg-[#e8f7f5] blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-7xl overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl shadow-slate-300/40 lg:min-h-[calc(100vh-6rem)] lg:grid-cols-[minmax(0,1.1fr)_minmax(440px,0.9fr)]">
        <section className="relative hidden overflow-hidden bg-brand-text p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(23,183,165,0.26),transparent_38%),radial-gradient(circle_at_90%_100%,rgba(232,247,245,0.16),transparent_38%)]" />
          <div className="absolute -right-24 top-20 h-72 w-72 rounded-full border border-white/10 bg-primary/10 blur-2xl" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <Image src="/MarkU-Logo.png" alt="MarkU logo" width={44} height={44} className="h-11 w-11 rounded-2xl bg-white object-contain p-1 shadow-lg shadow-black/20" priority />
              <div>
                <p className="text-sm font-semibold tracking-wide text-white">MarkU</p>
              <p className="text-xs text-[#b7dfd9]">Employee management system</p>
              </div>
            </div>

            <div className="mt-24 max-w-xl xl:mt-32">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-indigo-100 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                One calm place for your workday
              </div>
              <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight xl:text-6xl">
                Make every workday easier to manage.
              </h1>
              <p className="mt-6 max-w-md text-base leading-7 text-slate-300 xl:text-lg">
                Keep attendance, leave, people, and company updates together in one clear workspace.
              </p>
            </div>
          </div>

          <div className="relative grid max-w-xl grid-cols-2 gap-3 xl:gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm xl:p-5">
              <p className="text-2xl font-semibold xl:text-3xl">2,480+</p>
              <p className="mt-1 text-xs text-slate-300 xl:text-sm">Workdays organized</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm xl:p-5">
              <p className="text-2xl font-semibold xl:text-3xl">98.6%</p>
              <p className="mt-1 text-xs text-slate-300 xl:text-sm">On-time check-ins</p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-5 sm:p-8 lg:p-10 xl:p-16">
          <div className="w-full max-w-lg">
            <div className="mb-8 lg:mb-10">
              <div className="mb-6 flex items-center gap-3 lg:hidden">
                <Image src="/MarkU-Logo.png" alt="MarkU logo" width={40} height={40} className="h-10 w-10 rounded-xl object-contain shadow-lg shadow-indigo-200" />
                <div>
                  <p className="font-semibold text-slate-950">MarkU</p>
                  <p className="text-xs text-slate-500">Employee management system</p>
                </div>
              </div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Welcome back</p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Sign in to your workspace</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
                Access your people, attendance, and team updates from one place.
              </p>
            </div>

            <form className="space-y-5" onSubmit={submit}>
              <Field label="Work email" error={fieldErrors.email}>
                <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.demo" className="h-12 rounded-xl px-4" />
              </Field>
              <Field label="Phone number" error={fieldErrors.phone}>
                <div className="relative flex items-center">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-semibold text-slate-600">
                    <span>+91</span>
                    <span className="ml-2.5 h-4 w-px bg-slate-300" />
                  </div>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(event) => {
                      let val = event.target.value.replace(/[^\d\s]/g, "");
                      const digits = val.replace(/\D/g, "");
                      if (digits.startsWith("91") && digits.length > 10) {
                        val = digits.slice(2);
                      }
                      setPhone(val);
                    }}
                    placeholder="98765 43210"
                    maxLength={11}
                    className="h-12 rounded-xl pl-16 pr-4"
                  />
                </div>
              </Field>
              <Field label="Password" error={fieldErrors.password}>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 rounded-xl px-4 pr-12"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-slate-700"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              {error ? <p className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}
              <Button type="submit" className="h-12 w-full rounded-xl text-sm shadow-lg shadow-indigo-200" size="lg" disabled={pending}>
                {pending ? "Signing in..." : "Continue to workspace"}
                {!pending ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>
            </form>

            <div className="mt-8 flex items-start gap-3 border-t border-slate-100 pt-6 text-xs leading-5 text-slate-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <p>Your workspace data is kept private and available only to your company account.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
