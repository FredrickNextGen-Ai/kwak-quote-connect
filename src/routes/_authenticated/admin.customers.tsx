import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminCustomersQuery } from "@/lib/admin";
import { Skeleton } from "@/components/ui/skeleton";
import { whatsappLink } from "@/lib/site-config";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  const customers = useQuery(adminCustomersQuery);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Customers</h1>
      {customers.isLoading && <Skeleton className="h-40 w-full" />}
      {!customers.isLoading && (customers.data?.length ?? 0) === 0 && (
        <p className="text-sm text-muted-foreground">No customers yet.</p>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {(customers.data ?? []).map((c) => (
          <div key={c.id} className="surface-card p-4">
            <p className="font-semibold">{c.full_name}</p>
            <p className="text-sm text-muted-foreground">{c.phone}</p>
            {c.email && <p className="text-sm text-muted-foreground">{c.email}</p>}
            <div className="mt-3 flex gap-3 text-sm">
              <a className="hover:underline" href={`tel:${c.phone}`}>
                Call
              </a>
              <a
                className="hover:underline"
                target="_blank"
                rel="noopener noreferrer"
                href={whatsappLink(`Hello ${c.full_name}, regarding your spare parts request.`)}
              >
                WhatsApp
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
