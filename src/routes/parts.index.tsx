import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard, ProductGridSkeleton } from "@/components/site/ProductCard";
import { EmptyState } from "@/components/site/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoriesQuery, productsQuery } from "@/lib/catalog";
import { AVAILABILITIES, CONDITIONS } from "@/lib/site-config";

type PartsSearch = { category?: string; q?: string };

export const Route = createFileRoute("/parts/")({
  validateSearch: (search: Record<string, unknown>): PartsSearch => ({
    ...(typeof search["category"] === "string" && search["category"]
      ? { category: search["category"] as string }
      : {}),
    ...(typeof search["q"] === "string" && search["q"] ? { q: search["q"] as string } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Spare Parts Catalogue — KWAK AUTO SPARE" },
      {
        name: "description",
        content:
          "Search car spare parts by category, make, condition and availability. Add items to your quote basket.",
      },
      { property: "og:title", content: "Spare Parts Catalogue — KWAK AUTO SPARE" },
      { property: "og:description", content: "Search spare parts and request a quotation." },
    ],
  }),
  component: PartsPage,
});

const ALL = "all";

function PartsPage() {
  const params = Route.useSearch();
  const categories = useQuery(categoriesQuery);
  const products = useQuery(productsQuery);

  const [q, setQ] = useState(params.q ?? "");
  const [category, setCategory] = useState(params.category || ALL);
  const [make, setMake] = useState(ALL);
  const [condition, setCondition] = useState(ALL);
  const [availability, setAvailability] = useState(ALL);
  const [sort, setSort] = useState("newest");

  const makes = useMemo(
    () => [...new Set((products.data ?? []).map((p) => p.make).filter(Boolean))].sort() as string[],
    [products.data],
  );

  const categoryId = useMemo(
    () => (categories.data ?? []).find((c) => c.slug === category)?.id,
    [categories.data, category],
  );

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = (products.data ?? []).filter((p) => {
      if (categoryId && p.category_id !== categoryId) return false;
      if (make !== ALL && p.make !== make) return false;
      if (condition !== ALL && p.condition !== condition) return false;
      if (availability !== ALL && p.availability !== availability) return false;
      if (term) {
        const hay = `${p.name} ${p.oem ?? ""} ${p.make ?? ""} ${p.model ?? ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => (a.price ?? 1e12) - (b.price ?? 1e12));
    if (sort === "price-desc") list = [...list].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products.data, categoryId, make, condition, availability, q, sort]);

  const reset = () => {
    setQ("");
    setCategory(ALL);
    setMake(ALL);
    setCondition(ALL);
    setAvailability(ALL);
    setSort("newest");
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Spare parts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {products.isLoading ? "Loading parts…" : `${results.length} parts available`}
        </p>

        <div className="surface-card mt-6 grid gap-3 p-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="relative md:col-span-3 lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search part, OEM or model"
              className="pl-9"
              aria-label="Search parts"
            />
          </div>
          <FilterSelect value={category} onChange={setCategory} label="Category">
            {(categories.data ?? []).map((c) => (
              <SelectItem key={c.id} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </FilterSelect>
          <FilterSelect value={make} onChange={setMake} label="Make">
            {makes.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </FilterSelect>
          <FilterSelect value={condition} onChange={setCondition} label="Condition">
            {CONDITIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </FilterSelect>
          <FilterSelect value={availability} onChange={setAvailability} label="Availability">
            {AVAILABILITIES.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </FilterSelect>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[190px]" aria-label="Sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="price-asc">Price: low to high</SelectItem>
              <SelectItem value="price-desc">Price: high to low</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={reset}>
            Clear filters
          </Button>
        </div>

        <div className="mt-6">
          {products.isLoading ? (
            <ProductGridSkeleton />
          ) : results.length === 0 ? (
            <EmptyState
              title="No parts match your search"
              description="Try a different keyword or clear the filters — or message us and we'll source it."
              action={
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/contact">Request a part</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {results.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}

function FilterSelect({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {label.toLowerCase()}</SelectItem>
        {children}
      </SelectContent>
    </Select>
  );
}
