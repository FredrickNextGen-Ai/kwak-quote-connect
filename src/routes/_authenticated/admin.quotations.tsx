import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminQuotationsQuery, updateQuotationStatus } from "@/lib/admin";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { QUOTATION_STATUSES, formatPrice, whatsappLink } from "@/lib/site-config";
import { downloadBlob, generateQuotationPdf } from "@/lib/api/quotation-pdf";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/quotations")({
  component: QuotationsPage,
});

function QuotationsPage() {
  const qc = useQueryClient();
  const quotations = useQuery(adminQuotationsQuery);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateQuotationStatus(id, status),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin", "quotations"] });
    },
    onError: (e: Error) => toast.error("Could not update", { description: e.message }),
  });

  async function handlePdf(id: string, number: string) {
    try {
      const { data } = await supabase.auth.getSession();
      const blob = await generateQuotationPdf(id, data.session?.access_token);
      downloadBlob(blob, `${number}.pdf`);
    } catch (e) {
      toast.error("PDF not available yet", { description: (e as Error).message });
    }
  }

  const list = quotations.data ?? [];

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Quotation requests</h1>
      {quotations.isLoading && <Skeleton className="h-48 w-full" />}
      {!quotations.isLoading && list.length === 0 && (
        <p className="text-sm text-muted-foreground">No quotation requests yet.</p>
      )}

      <div className="space-y-4">
        {list.map((q) => (
          <div key={q.id} className="surface-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-semibold">{q.quotation_number}</p>
                <p className="text-sm text-muted-foreground">
                  {q.customers?.full_name ?? "Unknown"} · {q.customers?.phone ?? "—"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {[q.vehicle_make, q.vehicle_model, q.vehicle_year].filter(Boolean).join(" · ") ||
                    "No vehicle details"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={q.status}
                  onValueChange={(status) => statusMutation.mutate({ id: q.id, status })}
                >
                  <SelectTrigger className="h-9 w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUOTATION_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => handlePdf(q.id, q.quotation_number)}
                >
                  PDF
                </Button>
                {q.customers?.phone && (
                  <Button size="sm" variant="outline" className="rounded-full" asChild>
                    <a
                      href={whatsappLink(
                        `Hello ${q.customers.full_name}, about your quotation ${q.quotation_number}.`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </div>

            <ul className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
              {(q.quotation_items ?? []).map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span>
                    {item.product_name ?? "Part"} × {item.quantity}
                  </span>
                  <span className="text-muted-foreground">{formatPrice(item.unit_price)}</span>
                </li>
              ))}
            </ul>

            {q.message && <p className="mt-3 text-sm text-muted-foreground">“{q.message}”</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
