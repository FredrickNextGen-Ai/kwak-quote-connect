import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/site/WhatsAppButton";
import { siteConfig, whatsappLink } from "@/lib/site-config";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact KWAK AUTO SPARE — Nairobi Spare Parts" },
      {
        name: "description",
        content:
          "Call, email or WhatsApp KWAK AUTO SPARE on Kirinyaga Road, Nairobi for spare parts and quotations.",
      },
      { property: "og:title", content: "Contact KWAK AUTO SPARE" },
      { property: "og:description", content: "Reach us on WhatsApp, phone or email." },
    ],
  }),
  component: ContactPage,
});

const ITEMS = [
  { icon: Phone, label: "Phone", value: siteConfig.phoneDisplay, href: `tel:+${siteConfig.whatsappNumber}` },
  { icon: Mail, label: "Email", value: siteConfig.email, href: `mailto:${siteConfig.email}` },
  { icon: MapPin, label: "Shop", value: siteConfig.addressLine },
  { icon: Clock, label: "Open", value: siteConfig.hours },
];

function ContactPage() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Get in touch</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Tell us the part, your vehicle make, model and year — we reply fast with availability and
          pricing.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {ITEMS.map((item) => (
            <div key={item.label} className="surface-card flex items-start gap-3 p-5">
              <item.icon className="mt-0.5 size-5 text-primary" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                {item.href ? (
                  <a href={item.href} className="text-sm font-semibold hover:text-primary">
                    {item.value}
                  </a>
                ) : (
                  <p className="text-sm font-semibold">{item.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <Button asChild size="lg" className="mt-8 rounded-full bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90">
          <a
            href={whatsappLink("Hello KWAK AUTO SPARE, I need a spare part.")}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon className="size-5" /> Message us on WhatsApp
          </a>
        </Button>
      </div>
    </SiteLayout>
  );
}
