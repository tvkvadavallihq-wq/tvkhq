"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export function AdminSignOutButton() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "வெளியேற முடியவில்லை.");
      }
    },
    onSuccess() {
      router.replace("/admin/login");
      router.refresh();
    },
  });

  return (
    <Button variant="outline" size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
      <LogOut className="size-4" />
      வெளியேறு
    </Button>
  );
}
