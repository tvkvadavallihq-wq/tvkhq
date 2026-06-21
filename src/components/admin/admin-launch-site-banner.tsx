"use client";

import { useMutation } from "@tanstack/react-query";
import { Rocket, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SITE_LAUNCH_MESSAGE } from "@/lib/site-launch-message";

const celebrationDurationMs = 2600;
const confettiColors = ["#b91c1c", "#f59e0b", "#16a34a", "#2563eb", "#eab308", "#ec4899", "#ffffff"];

function playWhistle() {
  const AudioContextClass = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const vibrato = context.createOscillator();
  const vibratoGain = context.createGain();
  const now = context.currentTime;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(1250, now);
  oscillator.frequency.exponentialRampToValueAtTime(2050, now + 0.45);
  oscillator.frequency.exponentialRampToValueAtTime(1450, now + 1.05);
  oscillator.frequency.exponentialRampToValueAtTime(2250, now + 1.55);
  oscillator.frequency.exponentialRampToValueAtTime(1600, now + 2);

  vibrato.type = "sine";
  vibrato.frequency.setValueAtTime(11, now);
  vibratoGain.gain.setValueAtTime(65, now);
  vibrato.connect(vibratoGain);
  vibratoGain.connect(oscillator.frequency);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 1.85);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 2);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  vibrato.start(now);
  oscillator.stop(now + 2.05);
  vibrato.stop(now + 2.05);

  window.setTimeout(() => void context.close(), 2300);
}

export function AdminLaunchSiteBanner({ canLaunch }: { canLaunch: boolean }) {
  const router = useRouter();
  const [isCelebrating, setIsCelebrating] = useState(false);
  const celebrationTimer = useRef<number | null>(null);
  const confetti = useMemo(
    () =>
      Array.from({ length: 92 }, (_, index) => ({
        id: index,
        left: `${(index * 37) % 100}%`,
        color: confettiColors[index % confettiColors.length],
        delay: `${(index % 18) * 0.055}s`,
        duration: `${1.8 + (index % 8) * 0.11}s`,
        size: `${7 + (index % 5) * 2}px`,
        drift: `${((index % 13) - 6) * 12}px`,
        rotation: `${(index * 29) % 360}deg`,
      })),
    [],
  );

  useEffect(() => {
    return () => {
      if (celebrationTimer.current !== null) {
        window.clearTimeout(celebrationTimer.current);
      }
    };
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/site-active/launch", { method: "POST" });
      const payload = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Launch செய்ய முடியவில்லை.");
      }
    },
    onSuccess() {
      window.setTimeout(() => {
        router.replace("/admin/dashboard");
        router.refresh();
      }, celebrationDurationMs);
    },
    onError() {
      if (celebrationTimer.current !== null) {
        window.clearTimeout(celebrationTimer.current);
      }
      setIsCelebrating(false);
    },
  });

  function startLaunch() {
    setIsCelebrating(true);
    playWhistle();
    if (celebrationTimer.current !== null) {
      window.clearTimeout(celebrationTimer.current);
    }
    celebrationTimer.current = window.setTimeout(() => setIsCelebrating(false), celebrationDurationMs);
    mutation.mutate();
  }

  return (
    <Card className="relative overflow-hidden border-[#f4d08a] bg-gradient-to-br from-[#fff7e6] via-white to-[#ffe8d0] shadow-[0_18px_60px_rgba(91,0,0,0.16)]">
      {isCelebrating ? (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
          {confetti.map((piece) => (
            <span
              key={piece.id}
              className="launch-confetti-piece"
              style={{
                left: piece.left,
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                animationDelay: piece.delay,
                animationDuration: piece.duration,
                "--launch-drift": piece.drift,
                "--launch-rotation": piece.rotation,
              } as React.CSSProperties}
            />
          ))}
        </div>
      ) : null}
      <CardContent className="p-6 text-center sm:p-10">
        <p className="text-sm font-black uppercase tracking-normal text-primary">Site is inactive</p>
        <h1 className="mt-3 text-3xl font-black leading-tight text-[#7a0d0d] sm:text-5xl">
          Launch TVK Vadavalli HQ
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-base font-semibold leading-8 text-foreground">
          {SITE_LAUNCH_MESSAGE}
        </p>
        {mutation.error ? <p className="mt-5 text-sm font-semibold text-destructive">{mutation.error.message}</p> : null}
        <div className="mt-7">
          <Button
            type="button"
            size="lg"
            className="h-14 px-8 text-base font-black"
            disabled={!canLaunch || mutation.isPending || isCelebrating}
            onClick={startLaunch}
          >
            {mutation.isPending || isCelebrating ? <Loader2 className="size-5 animate-spin" /> : <Rocket className="size-5" />}
            Launch TVK Vadavalli HQ
          </Button>
        </div>
        {!canLaunch ? (
          <p className="mt-4 text-sm font-semibold text-muted-foreground">
            Launch செய்ய super admin login தேவை.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
