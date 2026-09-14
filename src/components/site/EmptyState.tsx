import type { ReactNode } from "react";
import { PackageSearch } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = PackageSearch,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="surface-card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
        <Icon className="size-7" />
      </span>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
