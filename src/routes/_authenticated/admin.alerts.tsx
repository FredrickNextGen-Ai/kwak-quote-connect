import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  Send,
  ArrowRight,
  Car,
  UserRound,
  Package,
  CircleDollarSign,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  adminQuotationsQuery,
  type Quotation,
} from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/alerts")({
  component: AdminAlertsPage,
});

type AlertFilter =
  | "all"
  | "pending"
  | "reviewing"
  | "quoted"
  | "completed";

function AdminAlertsPage() {
  const {
    data: quotations = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery(adminQuotationsQuery);

  const [readAlerts, setReadAlerts] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] =
    useState<AlertFilter>("all");

  const pendingQuotations = useMemo(
    () =>
      quotations.filter(
        (quotation) =>
          quotation.status.toLowerCase() === "pending",
      ),
    [quotations],
  );

  const reviewingQuotations = useMemo(
    () =>
      quotations.filter(
        (quotation) =>
          quotation.status.toLowerCase() === "reviewing",
      ),
    [quotations],
  );

  const quotedQuotations = useMemo(
    () =>
      quotations.filter(
        (quotation) =>
          quotation.status.toLowerCase() === "quoted",
      ),
    [quotations],
  );

  const completedQuotations = useMemo(
    () =>
      quotations.filter(
        (quotation) =>
          quotation.status.toLowerCase() === "completed",
      ),
    [quotations],
  );

  const unreadPendingCount = pendingQuotations.filter(
    (quotation) => !readAlerts.has(quotation.id),
  ).length;

  const urgentPendingCount = pendingQuotations.filter(
    (quotation) => getPendingAge(quotation.created_at) >= 24,
  ).length;

  const filteredQuotations = useMemo(() => {
    const filtered =
      activeFilter === "all"
        ? [...quotations]
        : quotations.filter(
            (quotation) =>
              quotation.status.toLowerCase() === activeFilter,
          );

    return filtered.sort((a, b) => {
      const aPending =
        a.status.toLowerCase() === "pending";
      const bPending =
        b.status.toLowerCase() === "pending";

      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });
  }, [quotations, activeFilter]);

  function markAsRead(id: string) {
    setReadAlerts((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }

  function markAllAsRead() {
    setReadAlerts((current) => {
      const next = new Set(current);

      pendingQuotations.forEach((quotation) => {
        next.add(quotation.id);
      });

      return next;
    });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Bell className="size-6 text-primary" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">
                Quotation Alerts
              </h2>

              {!isLoading && unreadPendingCount > 0 && (
                <span className="rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground">
                  {unreadPendingCount} action required
                </span>
              )}
            </div>

            <p className="mt-1 max-w-2xl text-muted-foreground">
              Monitor customer quotation requests and prioritize
              enquiries that need manager attention.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`size-4 ${
              isFetching ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {/* Error */}
      {isError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 text-destructive" />

            <div>
              <h3 className="font-semibold">
                Unable to load quotation alerts
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : "Something went wrong while loading quotations."}
              </p>

              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={AlertCircle}
          label="New Quotations"
          value={isLoading ? "—" : pendingQuotations.length}
          description="Require manager attention"
          emphasis={
            pendingQuotations.length > 0
              ? "danger"
              : "normal"
          }
        />

        <SummaryCard
          icon={Clock3}
          label="Awaiting Review"
          value={isLoading ? "—" : reviewingQuotations.length}
          description="Currently being reviewed"
        />

        <SummaryCard
          icon={FileText}
          label="Quoted"
          value={isLoading ? "—" : quotedQuotations.length}
          description="Quotation prepared"
        />

        <SummaryCard
          icon={CheckCircle2}
          label="Completed"
          value={isLoading ? "—" : completedQuotations.length}
          description="Completed requests"
        />
      </div>

      {/* Urgent quotation notice */}
      {!isLoading && pendingQuotations.length > 0 && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                <Bell className="size-5 text-destructive" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">
                    Pending quotations need attention
                  </h3>

                  {urgentPendingCount > 0 && (
                    <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                      {urgentPendingCount} over 24h
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  There{" "}
                  {pendingQuotations.length === 1
                    ? "is"
                    : "are"}{" "}
                  <strong className="text-foreground">
                    {pendingQuotations.length}
                  </strong>{" "}
                  pending quotation
                  {pendingQuotations.length === 1
                    ? ""
                    : "s"} waiting for review.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveFilter("pending")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Review pending
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Activity */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-semibold">
                Quotation Activity
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Newest quotation requests and current status.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={activeFilter === "all"}
                onClick={() => setActiveFilter("all")}
              >
                All
              </FilterButton>

              <FilterButton
                active={activeFilter === "pending"}
                onClick={() => setActiveFilter("pending")}
                count={pendingQuotations.length}
                danger
              >
                New
              </FilterButton>

              <FilterButton
                active={activeFilter === "reviewing"}
                onClick={() => setActiveFilter("reviewing")}
                count={reviewingQuotations.length}
              >
                Reviewing
              </FilterButton>

              <FilterButton
                active={activeFilter === "quoted"}
                onClick={() => setActiveFilter("quoted")}
                count={quotedQuotations.length}
              >
                Quoted
              </FilterButton>

              <FilterButton
                active={activeFilter === "completed"}
                onClick={() => setActiveFilter("completed")}
                count={completedQuotations.length}
              >
                Completed
              </FilterButton>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/20 px-5 py-3">
          <p className="text-xs text-muted-foreground">
            {isLoading
              ? "Loading quotations..."
              : `${filteredQuotations.length} quotation${
                  filteredQuotations.length === 1
                    ? ""
                    : "s"
                }`}
          </p>

          {pendingQuotations.length > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-xs font-medium text-primary hover:underline"
            >
              Mark new quotations as read
            </button>
          )}
        </div>

        <div className="divide-y divide-border">
          {isLoading ? (
            <QuotationSkeletonList />
          ) : filteredQuotations.length === 0 ? (
            <EmptyQuotationState filter={activeFilter} />
          ) : (
            filteredQuotations.map((quotation) => (
              <QuotationAlert
                key={quotation.id}
                quotation={quotation}
                read={readAlerts.has(quotation.id)}
                onRead={() => markAsRead(quotation.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Telegram */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Send className="size-5 text-primary" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">
                  Telegram Quotation Notifications
                </h3>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Telegram is used as the manager's external
                notification channel for quotation reporting and
                alerts.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
            <p className="font-medium">
              Manager notifications
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Connected through the Python Telegram service
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuotationAlert({
  quotation,
  read,
  onRead,
}: {
  quotation: Quotation;
  read: boolean;
  onRead: () => void;
}) {
  const status = quotation.status.toLowerCase();
  const isPending = status === "pending";
  const pendingHours = getPendingAge(
    quotation.created_at,
  );

  const customerName =
    quotation.customers?.full_name || "Customer";

  const vehicle = [
    quotation.vehicle_make,
    quotation.vehicle_model,
    quotation.vehicle_year,
  ]
    .filter(Boolean)
    .join(" ");

  const itemCount = quotation.quotation_items?.length ?? 0;

  const quotationValue = calculateQuotationValue(
    quotation,
  );

  return (
    <div
      className={`p-5 transition-colors ${
        isPending && !read
          ? "bg-destructive/[0.025]"
          : "bg-card"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
            isPending
              ? "bg-destructive/10"
              : "bg-primary/10"
          }`}
        >
          {isPending ? (
            <Bell className="size-5 text-destructive" />
          ) : (
            <FileText className="size-5 text-primary" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold">
              {isPending
                ? `New quotation — ${quotation.quotation_number}`
                : `Quotation — ${quotation.quotation_number}`}
            </h4>

            {!read && isPending && (
              <span className="size-2 rounded-full bg-destructive" />
            )}

            <StatusBadge status={quotation.status} />

            {isPending && pendingHours >= 24 && (
              <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                Waiting over 24h
              </span>
            )}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <DetailItem
              icon={UserRound}
              label="Customer"
              value={customerName}
            />

            <DetailItem
              icon={Car}
              label="Vehicle"
              value={vehicle || "Not specified"}
            />

            <DetailItem
              icon={Package}
              label="Items"
              value={`${itemCount} item${
                itemCount === 1 ? "" : "s"
              }`}
            />

            <DetailItem
              icon={CircleDollarSign}
              label="Value"
              value={
                quotationValue > 0
                  ? formatCurrency(quotationValue)
                  : "Not priced"
              }
            />

            <DetailItem
              icon={Clock3}
              label="Received"
              value={formatRelativeTime(
                quotation.created_at,
              )}
            />
          </div>

          {quotation.message && (
            <div className="mt-4 rounded-xl border border-border bg-muted/30 px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">
                Customer message
              </p>

              <p className="mt-1 line-clamp-2 text-sm">
                {quotation.message}
              </p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col">
          <a
            href="/admin/quotations"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Review
            <ArrowRight className="size-4" />
          </a>

          {!read && (
            <button
              type="button"
              onClick={onRead}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <CheckCircle2 className="size-4" />
              Mark read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
  emphasis = "normal",
}: {
  icon: typeof Bell;
  label: string;
  value: string | number;
  description: string;
  emphasis?: "normal" | "danger";
}) {
  return (
    <div
      className={`rounded-2xl border bg-card p-5 shadow-sm ${
        emphasis === "danger" && value !== 0
          ? "border-destructive/30"
          : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight">
            {value}
          </p>
        </div>

        <div
          className={`flex size-10 items-center justify-center rounded-xl ${
            emphasis === "danger" && value !== 0
              ? "bg-destructive/10"
              : "bg-primary/10"
          }`}
        >
          <Icon
            className={`size-5 ${
              emphasis === "danger" && value !== 0
                ? "text-destructive"
                : "text-primary"
            }`}
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>

        <p className="mt-0.5 truncate text-sm font-medium">
          {value}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized = status.toLowerCase();

  const styles: Record<string, string> = {
    pending:
      "bg-destructive/10 text-destructive",
    reviewing:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    quoted:
      "bg-primary/10 text-primary",
    completed:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    cancelled:
      "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
        styles[normalized] ??
        "bg-muted text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

function FilterButton({
  active,
  onClick,
  children,
  count,
  danger = false,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}

      {typeof count === "number" && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] ${
            active
              ? "bg-primary-foreground/15 text-primary-foreground"
              : danger && count > 0
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function EmptyQuotationState({
  filter,
}: {
  filter: AlertFilter;
}) {
  const message =
    filter === "pending"
      ? "There are no new quotations waiting for review."
      : filter === "reviewing"
        ? "There are no quotations currently under review."
        : filter === "quoted"
          ? "There are no quoted requests yet."
          : filter === "completed"
            ? "There are no completed quotations yet."
            : "No quotation activity is available yet.";

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <FileText className="size-6 text-muted-foreground" />
      </div>

      <h4 className="mt-4 font-semibold">
        No quotation alerts
      </h4>

      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

function QuotationSkeletonList() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex gap-4 p-5"
        >
          <div className="size-11 shrink-0 animate-pulse rounded-xl bg-muted" />

          <div className="flex-1 space-y-4">
            <div className="h-4 w-2/5 animate-pulse rounded bg-muted" />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="h-8 animate-pulse rounded bg-muted" />
              <div className="h-8 animate-pulse rounded bg-muted" />
              <div className="h-8 animate-pulse rounded bg-muted" />
              <div className="h-8 animate-pulse rounded bg-muted" />
              <div className="h-8 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function calculateQuotationValue(
  quotation: Quotation,
) {
  const subtotal = (quotation.quotation_items ?? []).reduce(
    (total, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;

      return total + quantity * unitPrice;
    },
    0,
  );

  const discount = Number(quotation.discount) || 0;

  return Math.max(0, subtotal - discount);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

function getPendingAge(createdAt: string) {
  const created = new Date(createdAt).getTime();

  if (Number.isNaN(created)) {
    return 0;
  }

  return Math.max(
    0,
    (Date.now() - created) / (1000 * 60 * 60),
  );
}

function formatRelativeTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  const difference = Date.now() - date.getTime();
  const minutes = Math.floor(difference / 60000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} minute${
      minutes === 1 ? "" : "s"
    } ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${
      hours === 1 ? "" : "s"
    } ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days} day${
      days === 1 ? "" : "s"
    } ago`;
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}