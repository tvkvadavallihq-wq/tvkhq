"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyTrackingButton({ trackingId }: { trackingId: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={async () => {
        await navigator.clipboard.writeText(trackingId);
      }}
    >
      <Copy className="size-4" />
      Copy
    </Button>
  );
}
