import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";

export const Route = createFileRoute(
  "/_authenticated/admin/forecasting",
)({
  component: AdminForecastingPage,
});

function AdminForecastingPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
          <TrendingUp className="size-6 text-primary" />
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Forecasting
          </h2>

          <p className="mt-1 text-muted-foreground">
            Project quotation and product demand using historical business
            data.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8">
        <p className="text-sm text-muted-foreground">
          Forecasting engine will be connected to Python later.
        </p>
      </div>
    </div>
  );
}