import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p> : null}
      <h2 className="text-2xl font-black tracking-normal sm:text-3xl">{title}</h2>
      {description ? <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
    </div>
  );
}
