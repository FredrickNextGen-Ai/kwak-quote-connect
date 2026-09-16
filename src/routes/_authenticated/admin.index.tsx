import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminCustomersQuery, adminProductsQuery, adminQuotationsQuery } from "@/lib/admin";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Stat({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="surface-card p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-16" />
      ) : (
        <p className="font-display mt-2 text-3xl font-bold">{value}</p>
      )}
    </div>
  );
}

function Dashboard() {
  const quotations = useQuery(adminQuotationsQuery);
  const customers = useQuery(adminCustomersQuery);
  const products = useQuery(adminProductsQuery);

  const list = quotations.data ?? [];
  const pending = list.filter((q) => q.status === "Pending").length;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Quotations" value={list.length} loading={quotations.isLoading} />
        <Stat label="Pending" value={pending} loading={quotations.isLoading} />
        <Stat label="Customers" value={customers.data?.length ?? 0} loading={customers.isLoading} />
        <Stat label="Products" value={products.data?.length ?? 0} loading={products.isLoading} />
      </div>

      <div className="surface-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Latest quotations</h2>
          <Link to="/admin/quotations" className="text-sm text-muted-foreground hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {quotations.isLoading && <Skeleton className="h-24 w-full" />}
          {!quotations.isLoading && list.length === 0 && (
            <p className="text-sm text-muted-foreground">No quotation requests yet.</p>
          )}
          {list.slice(0, 5).map((q) => (
            <div
              key={q.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-4 py-3 text-sm"
            >
              <span className="font-semibold">{q.quotation_number}</span>
              <span className="text-muted-foreground">{q.customers?.full_name ?? "—"}</span>
              <span className="text-muted-foreground">{q.quotation_items?.length ?? 0} items</span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                {q.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
