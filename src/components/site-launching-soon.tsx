import { Card, CardContent } from "@/components/ui/card";
import { SITE_LAUNCH_MESSAGE } from "@/lib/site-launch-message";

export function SiteLaunchingSoon() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff8ed] px-4 py-10">
      <Card className="max-w-3xl border-[#f4d08a] bg-white shadow-[0_18px_60px_rgba(91,0,0,0.14)]">
        <CardContent className="p-6 text-center sm:p-10">
          <p className="text-sm font-black uppercase tracking-normal text-primary">TVK Vadavalli HQ</p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-[#7a0d0d] sm:text-5xl">
            Launching soon
          </h1>
          <p className="mt-6 text-base font-semibold leading-8 text-foreground sm:text-lg">
            {SITE_LAUNCH_MESSAGE}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
