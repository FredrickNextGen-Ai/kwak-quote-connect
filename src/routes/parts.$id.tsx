import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Plus } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { AvailabilityBadge, ProductCard } from "@/components/site/ProductCard";
import { EmptyState } from "@/components/site/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/site/WhatsAppButton";
import { productQuery, productsQuery } from "@/lib/catalog";
import { useQuote } from "@/lib/quote-store";
import { formatPrice, vehicleLine, whatsappLink } from "@/lib/site-config";

export const Route = createFileRoute("/parts/$id")({
  head: () => ({
    meta: [
      { title: "Spare part details — KWAK AUTO SPARE" },
      {
        name: "description",
        content: "View spare part details, fitment and OEM number, then add it to your quote.",
      },
      { property: "og:title", content: "Spare part details — KWAK AUTO SPARE" },
      { property: "og:description", content: "Part details, fitment and quotation request." },
    ],
  }),
  component: PartDetail,
});

function PartDetail() {
  const { id } = Route.useParams();
  const product = useQuery(productQuery(id));
  const all = useQuery(productsQuery);
  const { add, has } = useQuote();

  if (product.isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-7xl animate-pulse px-4 py-10 sm:px-6">
          <div className="h-80 rounded-2xl bg-secondary" />
        </div>
      </SiteLayout>
    );
  }

  const p = product.data;
  if (!p) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <EmptyState
            title="Part not found"
            description="This part may have been removed."
            action={
              <Button asChild className="rounded-full">
                <Link to="/parts">Back to catalogue</Link>
              </Button>
            }
          />
        </div>
      </SiteLayout>
    );
  }

  const related = (all.data ?? [])
    .filter((x) => x.id !== p.id && x.category_id === p.category_id)
    .slice(0, 4);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link
          to="/parts"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to parts
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="surface-card overflow-hidden">
            {p.image ? (
              <img src={p.image} alt={p.name} className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="grid aspect-[4/3] place-items-center text-muted-foreground">
                No image
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full">{p.condition}</Badge>
              <AvailabilityBadge value={p.availability} />
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold">{p.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {vehicleLine(p) || "Universal fit"}
              {p.oem ? ` · OEM ${p.oem}` : ""}
            </p>
            <p className="mt-4 font-display text-3xl font-bold">{formatPrice(p.price)}</p>
            {p.description && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="rounded-full"
                variant={has(p.id) ? "secondary" : "default"}
                onClick={() =>
                  add({
                    productId: p.id,
                    name: p.name,
                    image: p.image,
                    vehicle: vehicleLine(p),
                    oem: p.oem,
                    price: p.price,
                  })
                }
              >
                {has(p.id) ? <Check className="size-4" /> : <Plus className="size-4" />}
                {has(p.id) ? "In your quote" : "Add to Quote"}
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <a
                  href={whatsappLink(`Hello KWAK AUTO SPARE, I'm interested in: ${p.name}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon className="size-4 text-whatsapp" /> Ask on WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl font-bold">Related parts</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {related.map((r, i) => (
                <ProductCard key={r.id} product={r} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </SiteLayout>
  );
}
