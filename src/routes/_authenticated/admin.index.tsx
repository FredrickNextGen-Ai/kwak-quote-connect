import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  FileText,
  Package,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { adminQuotationsQuery } from "@/lib/admin";
import { adminCustomersQuery } from "@/lib/admin";
import { adminProductsQuery } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

type Period = "all" | "today" | "7d" | "30d" | "quarter" | "year";

function AdminDashboard() {
  const [period, setPeriod] = useState<Period>("all");

  const quotationsQuery = useQuery(adminQuotationsQuery);
  const customersQuery = useQuery(adminCustomersQuery);
  const productsQuery = useQuery(adminProductsQuery);

  const quotations = quotationsQuery.data ?? [];
  const customers = customersQuery.data ?? [];
  const products = productsQuery.data ?? [];

  const periodStart = useMemo(() => {
    const now = new Date();

    switch (period) {
      case "all":
        return undefined;

      case "today": {
        const date = new Date(now);
        date.setHours(0, 0, 0, 0);
        return date;
      }

      case "7d": {
        const date = new Date(now);
        date.setDate(date.getDate() - 7);
        return date;
      }

      case "30d": {
        const date = new Date(now);
        date.setDate(date.getDate() - 30);
        return date;
      }

      case "quarter": {
        const date = new Date(now);
        const quarterStartMonth =
          Math.floor(date.getMonth() / 3) * 3;

        return new Date(
          date.getFullYear(),
          quarterStartMonth,
          1,
        );
      }

      case "year":
        return new Date(now.getFullYear(), 0, 1);
    }
  }, [period]);

  const filteredQuotations = useMemo(() => {
    return quotations.filter((quotation) => {
      return (
        !periodStart ||
        new Date(quotation.created_at) >= periodStart
      );
    });
  }, [quotations, periodStart]);

  const pendingQuotations = filteredQuotations.filter(
    (quotation) => quotation.status === "Pending",
  );

  const quotedQuotations = filteredQuotations.filter(
    (quotation) => quotation.status === "Quoted",
  );

  const completedQuotations = filteredQuotations.filter(
    (quotation) => quotation.status === "Completed",
  );

  const cancelledQuotations = filteredQuotations.filter(
    (quotation) => quotation.status === "Cancelled",
  );

  const quotationValue = filteredQuotations.reduce(
    (total, quotation) => {
      const items = quotation.quotation_items ?? [];

      const value = items.reduce(
        (itemTotal, item) => {
          const quantity = Number(item.quantity ?? 0);
          const unitPrice = Number(item.unit_price ?? 0);

          return itemTotal + quantity * unitPrice;
        },
        0,
      );

      return total + value - Number(quotation.discount ?? 0);
    },
    0,
  );

  const completionRate =
    filteredQuotations.length > 0
      ? (completedQuotations.length /
          filteredQuotations.length) *
        100
      : 0;

  const cancellationRate =
    filteredQuotations.length > 0
      ? (cancelledQuotations.length /
          filteredQuotations.length) *
        100
      : 0;

  const isLoading =
    quotationsQuery.isLoading ||
    customersQuery.isLoading ||
    productsQuery.isLoading;

  const hasError =
    quotationsQuery.isError ||
    customersQuery.isError ||
    productsQuery.isError;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardHeader
          period={period}
          setPeriod={setPeriod}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl border border-border bg-card"
            />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-2xl border border-border bg-card" />
          <div className="h-80 animate-pulse rounded-2xl border border-border bg-card" />
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="font-semibold text-destructive">
          Dashboard data could not be loaded
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Please refresh the page and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardHeader
        period={period}
        setPeriod={setPeriod}
      />

      {/* KPI cards */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            title="Quotations"
            value={filteredQuotations.length}
            description={`${quotations.length} total records`}
            icon={FileText}
          />

          <KpiCard
            title="Customers"
            value={customers.length}
            description="Registered customers"
            icon={Users}
          />

          <KpiCard
            title="Products"
            value={products.length}
            description="Catalogue products"
            icon={Package}
          />

          <KpiCard
            title="Pending"
            value={pendingQuotations.length}
            description="Require attention"
            icon={Clock3}
          />

          <KpiCard
            title="Quotation Value"
            value={formatCurrency(quotationValue)}
            description="Based on requested items"
            icon={Wallet}
          />
        </div>
      </section>

      {/* Performance */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">
            Performance overview
          </h2>

          <p className="text-sm text-muted-foreground">
            Current quotation activity for the selected period.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Status distribution */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-6">
              <h3 className="font-semibold">
                Quotation status
              </h3>

              <p className="text-sm text-muted-foreground">
                Distribution of requests by workflow status.
              </p>
            </div>

            <div className="space-y-4">
              <StatusRow
                label="Pending"
                count={pendingQuotations.length}
                total={filteredQuotations.length}
              />

              <StatusRow
                label="Quoted"
                count={quotedQuotations.length}
                total={filteredQuotations.length}
              />

              <StatusRow
                label="Completed"
                count={completedQuotations.length}
                total={filteredQuotations.length}
              />

              <StatusRow
                label="Cancelled"
                count={cancelledQuotations.length}
                total={filteredQuotations.length}
              />
            </div>
          </div>

          {/* Operational performance */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-6">
              <h3 className="font-semibold">
                Operational performance
              </h3>

              <p className="text-sm text-muted-foreground">
                Key workflow indicators for the selected period.
              </p>
            </div>

            <div className="space-y-5">
              <PerformanceMetric
                label="Completion rate"
                value={`${completionRate.toFixed(1)}%`}
                positive={completionRate >= 50}
              />

              <PerformanceMetric
                label="Cancellation rate"
                value={`${cancellationRate.toFixed(1)}%`}
                positive={cancellationRate <= 10}
              />

              <PerformanceMetric
                label="Pending workload"
                value={String(pendingQuotations.length)}
                positive={pendingQuotations.length === 0}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Attention + recent activity */}
      <section>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Attention */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-5">
              <h3 className="font-semibold">
                Requires attention
              </h3>

              <p className="text-sm text-muted-foreground">
                Quotations currently waiting for manager action.
              </p>
            </div>

            {pendingQuotations.length === 0 ? (
              <EmptyState
                title="No pending quotations"
                message="There are no pending requests for this period."
              />
            ) : (
              <div className="space-y-3">
                {pendingQuotations
                  .slice(0, 5)
                  .map((quotation) => (
                    <div
                      key={quotation.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-border p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {quotation.quotation_number}
                        </p>

                        <p className="truncate text-xs text-muted-foreground">
                          {quotation.customers?.full_name ??
                            "Unknown customer"}
                        </p>
                      </div>

                      <div className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                        Pending
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-5">
              <h3 className="font-semibold">
                Recent quotations
              </h3>

              <p className="text-sm text-muted-foreground">
                Latest quotation activity.
              </p>
            </div>

            {quotations.length === 0 ? (
              <EmptyState
                title="No quotations yet"
                message="Customer quotation requests will appear here."
              />
            ) : (
              <div className="space-y-3">
                {quotations.slice(0, 5).map((quotation) => (
                  <div
                    key={quotation.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {quotation.quotation_number}
                      </p>

                      <p className="truncate text-xs text-muted-foreground">
                        {quotation.customers?.full_name ??
                          "Unknown customer"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-medium">
                        {quotation.status}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(quotation.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Analytics placeholder */}
      <section className="rounded-2xl border border-dashed border-border bg-card p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">
              Analytics engine
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Detailed trends, cross-sectional analysis and visual
              intelligence will be connected in Phase 6 and Phase 7.
            </p>
          </div>

          <div className="rounded-full bg-secondary px-4 py-2 text-xs font-medium">
            Coming in Analytics
          </div>
        </div>
      </section>
    </div>
  );
}

function DashboardHeader({
  period,
  setPeriod,
}: {
  period: Period;
  setPeriod: (period: Period) => void;
}) {
  const options: {
    value: Period;
    label: string;
  }[] = [
    { value: "all", label: "All" },
    { value: "today", label: "Today" },
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "quarter", label: "Quarter" },
    { value: "year", label: "Year" },
  ];

  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm font-medium text-primary">
          Business overview
        </p>

        <h2 className="mt-1 text-3xl font-bold tracking-tight">
          Manager Dashboard
        </h2>

        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Monitor quotation activity, customer activity and operational
          performance from one place.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = period === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriod(option.value)}
              className={[
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground",
              ].join(" ")}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}

function KpiCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: typeof FileText;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight">
            {value}
          </p>
        </div>

        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="size-5 text-primary" />
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function StatusRow({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const percentage =
    total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>

        <span className="text-muted-foreground">
          {count} · {percentage.toFixed(0)}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{
            width: `${Math.min(percentage, 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

function PerformanceMetric({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border p-4">
      <span className="text-sm font-medium">
        {label}
      </span>

      <div className="flex items-center gap-2">
        {positive ? (
          <ArrowUpRight className="size-4 text-primary" />
        ) : (
          <ArrowDownRight className="size-4 text-muted-foreground" />
        )}

        <span className="font-semibold">
          {value}
        </span>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-center">
      <p className="text-sm font-medium">
        {title}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}