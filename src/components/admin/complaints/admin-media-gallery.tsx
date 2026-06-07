import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminComplaintMediaRow } from "@/lib/repositories/admin-complaints";

function mediaLabel(stage: string) {
  return stage === "AFTER" ? "பின் படங்கள்" : "முன் படங்கள்";
}

export function AdminMediaGallery({ media }: { media: AdminComplaintMediaRow[] }) {
  const images = media.filter((item) => item.media_type.startsWith("image/"));
  const before = images.filter((item) => item.media_stage === "BEFORE");
  const after = images.filter((item) => item.media_stage === "AFTER");

  return (
    <Card>
      <CardHeader>
        <CardTitle>மீடியா</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {images.length === 0 ? (
          <p className="text-sm text-muted-foreground">புகைப்படங்கள் இல்லை.</p>
        ) : (
          <>
            {[before, after].map((group) => {
              const stage = group[0]?.media_stage ?? null;
              if (!stage || group.length === 0) {
                return null;
              }

              return (
                <div key={stage} className="space-y-3">
                  <p className="text-sm font-bold">{mediaLabel(stage)}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {group.map((item) => (
                      <a
                        key={item.id}
                        href={item.signed_url ?? item.file_url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="overflow-hidden rounded-lg border bg-background"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.signed_url ?? item.file_url ?? ""}
                          alt={item.caption ?? "Complaint media"}
                          className="h-48 w-full object-cover"
                        />
                        {item.caption ? <div className="border-t px-3 py-2 text-sm">{item.caption}</div> : null}
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {media.filter((item) => item.media_type.startsWith("video/")).length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-bold">வீடியோக்கள்</p>
            <div className="grid gap-3">
              {media
                .filter((item) => item.media_type.startsWith("video/"))
                .map((item) => (
                  <a key={item.id} href={item.signed_url ?? item.file_url ?? "#"} target="_blank" rel="noreferrer" className="rounded-lg border bg-background px-3 py-2 text-sm">
                    {item.caption ?? "Video"}
                  </a>
                ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
