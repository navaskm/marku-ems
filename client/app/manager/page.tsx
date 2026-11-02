"use client";

import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ManagerEntryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/manager/employees");
  }, [router]);

  return <Spinner label="Opening manager workspace" />;
}
