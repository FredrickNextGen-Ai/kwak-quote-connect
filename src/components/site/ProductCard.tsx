import { Link } from "@tanstack/react-router";
import { Check, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuote } from "@/lib/quote-store";
import type { Product } from "@/lib/catalog";
import { formatPrice, vehicleLine } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function AvailabilityBadge({ value, className }: { value: string; className?: string }) {
  const tone =
    value === "Available" || value === "In Stock"
      ? "bg-success/15 text-success border-success/30"
      : value === "On Order"
        ? "bg-warning/20 text-warning-foreground border-warning/40 dark:text-warning"
        : "bg-destructive/10 text-destructive border-destructive/30";
  return (
    <Badge variant="outline" className={cn("rounded-full font-semibold", tone, className)}>
      {value}
    </Badge>
  );
}

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { add, has } = useQuote();
  const inQuote = has(product.id);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.04 }}
      className="group surface-card flex flex-col overflow-hidden transition-shadow hover:shadow-lift"
    >
      <Link to="/parts/$id" params={{ id: product.id }} className="relative block aspect-[4/3] overflow-hidden bg-secondary">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">No image</div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Badge className="rounded-full bg-foreground/85 text-background backdrop-blur">{product.condition}</Badge>
        </div>
        <AvailabilityBadge value={product.availability} className="absolute right-3 top-3 bg-surface/90 backdrop-blur" />
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium text-muted-foreground">{vehicleLine(product) || "Universal fit"}</p>
        <Link to="/parts/$id" params={{ id: product.id }} className="line-clamp-2 font-display text-base font-semibold leading-snug hover:text-primary">
          {product.name}
        </Link>
        {product.oem && <p className="text-xs text-muted-foreground">OEM {product.oem}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <span className={cn("font-display text-lg font-bold", product.price === null && "text-sm font-semibold text-muted-foreground")}>
            {formatPrice(product.price)}
          </span>
          <Button
            size="sm"
            variant={inQuote ? "secondary" : "default"}
            className="rounded-full"
            onClick={() =>
              add({
                productId: product.id,
                name: product.name,
                image: product.image,
                vehicle: vehicleLine(product),
                oem: product.oem,
                price: product.price,
              })
            }
          >
            {inQuote ? <Check className="size-4" /> : <Plus className="size-4" />}
            {inQuote ? "Added" : "Add to Quote"}
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface-card animate-pulse overflow-hidden">
          <div className="aspect-[4/3] bg-secondary" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/2 rounded bg-secondary" />
            <div className="h-4 w-4/5 rounded bg-secondary" />
            <div className="h-6 w-1/3 rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}
