import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/alerts")({
  component: AdminAlertsPage,
});

function AdminAlertsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
          <Bell className="size-6 text-primary" />
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Alerts & Automation
          </h2>

          <p className="mt-1 text-muted-foreground">
            Monitor operational events and manage automated manager
            notifications.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8">
        <p className="text-sm text-muted-foreground">
          Telegram notifications and automated alerts will be connected here.
        </p>
      </div>
    </div>
  );
}