"use client";

import { Spinner } from "@/components/ui/spinner";
import { useDemo } from "@/features/auth/demo-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { ready, session } = useDemo();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!session) router.replace("/login");
    else router.replace(session.role === "manager" ? "/manager" : "/employee/attendance");
  }, [ready, router, session]);

  return <Spinner label="Opening workspace" />;
}
