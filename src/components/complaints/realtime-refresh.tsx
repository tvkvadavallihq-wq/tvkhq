"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function RealtimeRefresh({
  complaintId,
  trackingId,
  watchAll = false,
}: {
  complaintId?: string;
  trackingId?: string;
  watchAll?: boolean;
}) {
  const router = useRouter();
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const scheduleRefresh = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        router.refresh();
      }, 600);
    };

    const channel = supabase.channel(`complaints-${complaintId ?? trackingId ?? "public"}`);

    if (watchAll) {
      channel.on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, scheduleRefresh);
      channel.on("postgres_changes", { event: "*", schema: "public", table: "complaint_status_history" }, scheduleRefresh);
      channel.on("postgres_changes", { event: "*", schema: "public", table: "complaint_assignments" }, scheduleRefresh);
      channel.on("postgres_changes", { event: "*", schema: "public", table: "complaint_media" }, scheduleRefresh);
    } else if (complaintId) {
      channel.on("postgres_changes", { event: "*", schema: "public", table: "complaints", filter: `id=eq.${complaintId}` }, scheduleRefresh);
      channel.on("postgres_changes", { event: "*", schema: "public", table: "complaint_status_history", filter: `complaint_id=eq.${complaintId}` }, scheduleRefresh);
      channel.on("postgres_changes", { event: "*", schema: "public", table: "complaint_assignments", filter: `complaint_id=eq.${complaintId}` }, scheduleRefresh);
      channel.on("postgres_changes", { event: "*", schema: "public", table: "complaint_media", filter: `complaint_id=eq.${complaintId}` }, scheduleRefresh);
    } else if (trackingId) {
      channel.on("postgres_changes", { event: "*", schema: "public", table: "complaints", filter: `complaint_number=eq.${trackingId}` }, scheduleRefresh);
    }

    channel.subscribe();

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      void supabase.removeChannel(channel);
    };
  }, [complaintId, router, trackingId, watchAll]);

  return null;
}
