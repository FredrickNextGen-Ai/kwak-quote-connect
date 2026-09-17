import { Link, useNavigate } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { useRef, useState } from "react";
import { Logo } from "./Logo";
import { WhatsAppIcon } from "./WhatsAppButton";
import { siteConfig, whatsappLink } from "@/lib/site-config";

function MngLink() {
  const navigate = useNavigate();
  const [clicks, setClicks] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    if (timer.current) clearTimeout(timer.current);
    const next = clicks + 1;
    if (next >= 3) {
      setClicks(0);
      navigate({ to: "/auth" });
      return;
    }
    setClicks(next);
    timer.current = setTimeout(() => setClicks(0), 800);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="font-semibold tracking-widest hover:text-foreground"
    >
      MNG
    </button>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-surface-strong/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Genuine, used and refurbished spare parts for Toyota, Nissan, Mazda, Subaru, Mitsubishi
            and more. Send us your list, get a quotation fast.
          </p>
          <a
            href={whatsappLink("Hello KWAK AUTO SPARE, I need a spare part.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-whatsapp px-4 py-2 text-sm font-semibold text-whatsapp-foreground"
          >
            <WhatsAppIcon className="size-4" /> Chat on WhatsApp
          </a>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Explore</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/" className="hover:text-primary">Home</Link></li>
            <li><Link to="/parts" className="hover:text-primary">Spare Parts Catalogue</Link></li>
            <li><Link to="/quote" className="hover:text-primary">Request a Quotation</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact & Location</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Visit us</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" />{siteConfig.addressLine}</li>
            <li className="flex items-start gap-2.5"><Phone className="mt-0.5 size-4 shrink-0 text-primary" /><a href={`tel:+${siteConfig.whatsappNumber}`}>{siteConfig.phoneDisplay}</a></li>
            <li className="flex items-start gap-2.5"><Mail className="mt-0.5 size-4 shrink-0 text-primary" /><a href={`mailto:${siteConfig.email}`} className="break-all">{siteConfig.email}</a></li>
            <li className="flex items-start gap-2.5"><Clock className="mt-0.5 size-4 shrink-0 text-primary" />{siteConfig.hours}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <MngLink />
        </div>
      </div>
    </footer>
  );
}
