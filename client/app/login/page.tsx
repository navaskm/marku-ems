"use client";

import { LoginForm } from "@/features/auth/login-form";
import { Spinner } from "@/components/ui/spinner";
import { useDemo } from "@/features/auth/demo-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { ready, session } = useDemo();
  const router = useRouter();

  useEffect(() => {
    if (!ready || !session) return;
    router.replace(session.role === "manager" ? "/manager" : "/employee");
  }, [ready, router, session]);

  if (!ready) return <Spinner />;
  return <LoginForm />;
}
