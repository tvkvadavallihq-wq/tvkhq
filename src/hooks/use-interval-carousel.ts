"use client";

import { useEffect, useState } from "react";

export function useIntervalCarousel(length: number, intervalMs = 5000) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (length <= 1) {
      setIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs, length]);

  return { index, setIndex };
}
