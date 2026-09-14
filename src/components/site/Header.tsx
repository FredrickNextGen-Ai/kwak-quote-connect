import { Link } from "@tanstack/react-router";
import { ClipboardList, Menu, Phone } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { WhatsAppIcon } from "./WhatsAppButton";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useQuote } from "@/lib/quote-store";
import { siteConfig, whatsappLink } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", exact: true },
  { to: "/parts", label: "Spare Parts" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const { count } = useQuote();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: "exact" in item && item.exact }}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={whatsappLink("Hello KWAK AUTO SPARE, I need a spare part.")}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-secondary lg:inline-flex"
          >
            <WhatsAppIcon className="size-4 text-whatsapp" />
            {siteConfig.phoneDisplay}
          </a>
          <ThemeToggle />
          <Button asChild variant="default" size="sm" className="relative h-9 rounded-full px-3 sm:px-4">
            <Link to="/quote" aria-label={`Quote basket, ${count} items`}>
              <ClipboardList className="size-4" />
              <span className="hidden sm:inline">Quote</span>
              <span
                className={cn(
                  "grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-foreground",
                  count === 0 && "opacity-70",
                )}
              >
                {count}
              </span>
            </Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full md:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex h-full flex-col">
                <div className="border-b border-border p-5">
                  <Logo />
                </div>
                <nav className="flex flex-col gap-1 p-3" aria-label="Mobile">
                  {NAV.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      activeOptions={{ exact: "exact" in item && item.exact }}
                      className="rounded-lg px-4 py-3 text-base font-medium text-foreground transition hover:bg-secondary"
                      activeProps={{ className: "bg-secondary" }}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    to="/quote"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-4 py-3 text-base font-medium text-foreground transition hover:bg-secondary"
                  >
                    My Quote ({count})
                  </Link>
                </nav>
                <div className="mt-auto space-y-2 border-t border-border p-4">
                  <a
                    href={whatsappLink("Hello KWAK AUTO SPARE, I need a spare part.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-lg bg-whatsapp px-4 py-3 text-sm font-semibold text-whatsapp-foreground"
                  >
                    <WhatsAppIcon className="size-4" /> WhatsApp us
                  </a>
                  <a
                    href={`tel:+${siteConfig.whatsappNumber}`}
                    className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-semibold"
                  >
                    <Phone className="size-4" /> {siteConfig.phoneDisplay}
                  </a>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
