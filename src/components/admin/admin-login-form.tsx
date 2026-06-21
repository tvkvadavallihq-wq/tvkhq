"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function AdminLoginForm({ siteActive = true }: { siteActive?: boolean }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const payload = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "உள்நுழைவு முடியவில்லை.");
      }
    },
    onSuccess() {
      router.replace(siteActive ? "/admin/dashboard" : "/admin/login");
      router.refresh();
    },
  });

  return (
    <Card>
      <CardContent className="pt-5">
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <Field id="username" label="Username">
            <Input id="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} />
          </Field>
          <Field id="password" label="கடவுச்சொல்">
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          {mutation.error ? <p className="text-sm font-semibold text-destructive">{mutation.error.message}</p> : null}
          <Button type="submit" disabled={mutation.isPending || !username || !password}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
            உள்நுழை
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
