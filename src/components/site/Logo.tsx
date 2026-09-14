import { Link } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link to="/" className={cn("group flex items-center gap-2.5", className)} aria-label={siteConfig.name}>
      <span className="relative grid size-9 place-items-center rounded-lg bg-foreground text-background shadow-soft transition-transform group-hover:-rotate-6">
        <Wrench className="size-4" strokeWidth={2.5} />
        <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-accent" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-base font-bold tracking-tight">{siteConfig.shortName}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Auto Spare
          </span>
        </span>
      )}
    </Link>
  );
}
