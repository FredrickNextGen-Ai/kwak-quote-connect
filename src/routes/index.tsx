import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck, Truck, Wrench } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { CategoryIcon } from "@/components/site/CategoryIcon";
import { ProductCard, ProductGridSkeleton } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { categoriesQuery, featuredProductsQuery } from "@/lib/catalog";
import { siteConfig, whatsappLink } from "@/lib/site-config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KWAK AUTO SPARE — Quality Car Spare Parts in Nairobi" },
      {
        name: "description",
        content:
          "Browse genuine and quality car spare parts in Nairobi. Add parts to a quote basket and get a fast quotation on WhatsApp.",
      },
      { property: "og:title", content: "KWAK AUTO SPARE — Car Spare Parts in Nairobi" },
      {
        property: "og:description",
        content: "Find the right spare parts fast and request a free quotation.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const categories = useQuery(categoriesQuery);
  const featured = useQuery(featuredProductsQuery);

  return (
    <SiteLayout>
      <section className="relative overflow-hidden border-b border-border">
        <img
          src="/images/hero-parts.jpg"
          alt="Car spare parts workshop"
          className="absolute inset-0 size-full object-cover opacity-25"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {siteConfig.addressLine}
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight sm:text-6xl">
            {siteConfig.tagline}
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            Genuine, refurbished and quality used parts for most makes. Build your list, send it
            over, and we reply with a clear quotation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/parts">
                Browse spare parts <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <a
                href={whatsappLink("Hello KWAK AUTO SPARE, I need a spare part.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                Chat on WhatsApp
              </a>
            </Button>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Verified quality", text: "Parts checked before sale" },
              { icon: Wrench, title: "Right fitment", text: "Matched to your make & model" },
              { icon: Truck, title: "Fast delivery", text: "Countrywide dispatch" },
            ].map((f) => (
              <li key={f.title} className="surface-card flex items-center gap-3 p-4">
                <f.icon className="size-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="font-display text-2xl font-bold">Shop by category</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {(categories.data ?? []).map((c) => (
            <Link
              key={c.id}
              to="/parts"
              search={{ category: c.slug }}
              className="surface-card flex items-center gap-3 p-4 transition hover:shadow-lift"
            >
              <CategoryIcon name={c.icon} className="size-5 text-primary" />
              <span className="text-sm font-semibold">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold">Featured parts</h2>
          <Link to="/parts" className="text-sm font-semibold text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-6">
          {featured.isLoading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {(featured.data ?? []).map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
