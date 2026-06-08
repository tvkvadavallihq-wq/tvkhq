import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminComplaintMediaRow } from "@/lib/repositories/admin-complaints";

export function AdminMediaGallery({ media }: { media: AdminComplaintMediaRow[] }) {
  const images = media.filter((item) => item.media_type.startsWith("image/"));
  const videos = media.filter((item) => item.media_type.startsWith("video/"));

  return (
    <Card>
      <CardHeader>
        <CardTitle>மீடியா</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {images.length === 0 ? (
          <p className="text-sm text-muted-foreground">புகைப்படங்கள் இல்லை.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {images.map((item) => (
              <a
                key={item.id}
                href={item.file_url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="overflow-hidden rounded-lg border bg-background"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.file_url ?? ""}
                  alt="Complaint media"
                  className="h-48 w-full object-cover"
                />
              </a>
            ))}
          </div>
        )}

        {videos.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-bold">வீடியோக்கள்</p>
            <div className="grid gap-3">
              {videos.map((item) => (
                <a key={item.id} href={item.file_url ?? "#"} target="_blank" rel="noreferrer" className="rounded-lg border bg-background px-3 py-2 text-sm">
                  வீடியோ இணைப்பு
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
