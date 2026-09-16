import { createFileRoute } from "@tanstack/react-router";
import { siteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

const ROWS: { label: string; value: string }[] = [
  { label: "Business name", value: siteConfig.name },
  { label: "WhatsApp number", value: siteConfig.phoneDisplay },
  { label: "Email", value: siteConfig.email },
  { label: "Address", value: siteConfig.addressLine },
  { label: "Opening hours", value: siteConfig.hours },
  { label: "Currency", value: siteConfig.currency },
];

function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Settings</h1>
      <div className="surface-card divide-y divide-border">
        {ROWS.map((r) => (
          <div key={r.label} className="flex flex-wrap justify-between gap-2 p-4 text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="font-medium">{r.value}</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        These business details appear across the website, WhatsApp links and quotations. Ask your
        developer to update them if anything changes.
      </p>
    </div>
  );
}
