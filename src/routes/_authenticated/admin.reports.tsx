import { createFileRoute } from "@tanstack/react-router";
import { FileBarChart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: AdminReportsPage,
});

function AdminReportsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
          <FileBarChart className="size-6 text-primary" />
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Reports
          </h2>

          <p className="mt-1 text-muted-foreground">
            Generate business reports and export operational and analytical
            results.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8">
        <p className="text-sm text-muted-foreground">
          Reporting centre will be connected to the Python reporting engine.
        </p>
      </div>
    </div>
  );
}