import { createFileRoute } from "@tanstack/react-router";
import {
  FileText,
  RefreshCw,
  Search,
  Save,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  adminQuotationsQuery,
  updateQuotation,
  updateQuotationStatus,
  type Quotation,
} from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/quotations")({
  component: AdminQuotationsPage,
});

type FilterStatus =
  | "All"
  | "Pending"
  | "Reviewing"
  | "Quoted"
  | "Completed"
  | "Cancelled";

const QUOTATION_STATUSES = [
  "Pending",
  "Reviewing",
  "Quoted",
  "Completed",
  "Cancelled",
] as const;

function AdminQuotationsPage() {
  const queryClient = useQueryClient();

  const quotationsQuery = useQuery(adminQuotationsQuery);

  const quotations = quotationsQuery.data ?? [];

  const [statusFilter, setStatusFilter] =
    useState<FilterStatus>("All");

  const [search, setSearch] = useState("");

  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "7d" | "30d" | "month" | "custom"
  >("all");

  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [refreshing, setRefreshing] = useState(false);

  const [selectedQuotation, setSelectedQuotation] =
    useState<Quotation | null>(null);

  const filteredQuotations = useMemo(() => {
    const now = new Date();

    return quotations.filter((quotation) => {
      const quotationDate = new Date(quotation.created_at);

      const matchesStatus =
        statusFilter === "All" ||
        quotation.status === statusFilter;

      const searchValue = search.trim().toLowerCase();

      const customerName =
        quotation.customers?.full_name ?? "";

      const phone =
        quotation.customers?.phone ?? "";

      const quotationNumber =
        quotation.quotation_number ?? "";

      const vehicle = [
        quotation.vehicle_make,
        quotation.vehicle_model,
        quotation.vehicle_year,
      ]
        .filter(Boolean)
        .join(" ");

      const matchesSearch =
        !searchValue ||
        [
          quotationNumber,
          customerName,
          phone,
          vehicle,
        ]
          .join(" ")
          .toLowerCase()
          .includes(searchValue);

      let matchesDate = true;

      if (dateFilter === "today") {
        matchesDate =
          quotationDate.toDateString() === now.toDateString();
      }

      if (dateFilter === "7d") {
        const start = new Date();
        start.setDate(now.getDate() - 7);
        matchesDate = quotationDate >= start;
      }

      if (dateFilter === "30d") {
        const start = new Date();
        start.setDate(now.getDate() - 30);
        matchesDate = quotationDate >= start;
      }

      if (dateFilter === "month") {
        matchesDate =
          quotationDate.getMonth() === now.getMonth() &&
          quotationDate.getFullYear() === now.getFullYear();
      }

      if (dateFilter === "custom") {
        if (customStartDate) {
          const start = new Date(`${customStartDate}T00:00:00`);
          matchesDate = quotationDate >= start;
        }

        if (customEndDate && matchesDate) {
          const end = new Date(`${customEndDate}T23:59:59.999`);
          matchesDate = quotationDate <= end;
        }
      }

      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [
    quotations,
    statusFilter,
    search,
    dateFilter,
    customStartDate,
    customEndDate,
  ]);

  async function refresh() {
    try {
      setRefreshing(true);
      await queryClient.invalidateQueries({
        queryKey: ["admin", "quotations"],
      });
    } finally {
      setRefreshing(false);
    }
  }

  async function changeStatus(id: string, status: string) {
    try {
      await updateQuotationStatus(id, status);
      await refresh();
      setSelectedQuotation((current) =>
        current && current.id === id
          ? { ...current, status }
          : current,
      );
    } catch (error) {
      console.error("Failed to update quotation status:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to update quotation status.",
      );
    }
  }

  if (quotationsQuery.isLoading) {
    return <QuotationLoading />;
  }

  if (quotationsQuery.isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="font-semibold text-destructive">
          Quotations could not be loaded
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          {quotationsQuery.error.message}
        </p>

        <button
          type="button"
          onClick={refresh}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
        >
          <RefreshCw className="size-4" />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-primary">
          Manager workspace
        </p>

        <h2 className="mt-1 text-3xl font-bold tracking-tight">
          Quotations
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Review customer requests, inspect requested items and
          manage quotation workflow.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search quotation, customer, phone or vehicle..."
              className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none transition focus:border-primary"
            />
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCw
              className={`h-4 w-4 transition-transform duration-700 ${
                refreshing ? "animate-spin" : ""
              }`}
            />

            <span>
              {refreshing ? "Refreshing..." : "Refresh"}
            </span>
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            value={dateFilter}
            onChange={(event) =>
              setDateFilter(
                event.target.value as typeof dateFilter,
              )
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400"
          >
            <option value="all">All dates</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="month">This month</option>
            <option value="custom">Custom range</option>
          </select>

          {dateFilter === "custom" && (
            <>
              <input
                type="date"
                value={customStartDate}
                onChange={(event) =>
                  setCustomStartDate(event.target.value)
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
              />

              <span className="text-sm text-slate-400">
                to
              </span>

              <input
                type="date"
                value={customEndDate}
                onChange={(event) =>
                  setCustomEndDate(event.target.value)
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
              />
            </>
          )}
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {(
            [
              "All",
              "Pending",
              "Reviewing",
              "Quoted",
              "Completed",
              "Cancelled",
            ] as FilterStatus[]
          ).map((status) => {
            const active = statusFilter === status;

            const count =
              status === "All"
                ? quotations.length
                : quotations.filter(
                    (quotation) =>
                      quotation.status === status,
                  ).length;

            return (
              <button
                key={status}
                type="button"
                onClick={() =>
                  setStatusFilter(status)
                }
                className={[
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground",
                ].join(" ")}
              >
                {status}

                <span className="ml-2 opacity-70">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-semibold">
            Quotation requests
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            {filteredQuotations.length} record
            {filteredQuotations.length === 1 ? "" : "s"} found
          </p>
        </div>

        {filteredQuotations.length === 0 ? (
          <EmptyQuotations
            hasSearch={Boolean(search)}
            statusFilter={statusFilter}
          />
        ) : (
          <div className="divide-y divide-border">
            {filteredQuotations.map((quotation) => (
              <QuotationRow
                key={quotation.id}
                quotation={quotation}
                onOpen={() =>
                  setSelectedQuotation(quotation)
                }
              />
            ))}
          </div>
        )}
      </section>

      {selectedQuotation && (
        <QuotationDetails
          quotation={selectedQuotation}
          onClose={() =>
            setSelectedQuotation(null)
          }
          onStatusChange={changeStatus}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
function QuotationRow({
  quotation,
  onOpen,
}: {
  quotation: Quotation;
  onOpen: () => void;
}) {
  const customer =
    quotation.customers?.full_name ??
    "Unknown customer";

  const itemCount =
    quotation.quotation_items?.reduce(
      (total, item) =>
        total + Number(item.quantity ?? 0),
      0,
    ) ?? 0;

  const value =
    quotation.quotation_items?.reduce(
      (total, item) =>
        total +
        Number(item.quantity ?? 0) *
          Number(item.unit_price ?? 0),
      0,
    ) ?? 0;

  const discount = Number(
    quotation.discount ?? 0,
  );

  const finalValue = Math.max(
    0,
    value - discount,
  );

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full px-5 py-5 text-left transition hover:bg-secondary/40"
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1.5fr_1.3fr_0.8fr_0.9fr] lg:items-center">
        <div>
          <p className="font-semibold">
            {quotation.quotation_number}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(quotation.created_at)}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium">
            {customer}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {quotation.customers?.phone ?? "No phone"}
          </p>
        </div>

        <div>
          <p className="text-sm">
            {formatVehicle(quotation)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {itemCount} item
            {itemCount === 1 ? "" : "s"}
          </p>
        </div>

        <div>
          <StatusBadge status={quotation.status} />
        </div>

        <div className="text-left lg:text-right">
          <p className="text-sm font-semibold">
            {formatCurrency(finalValue)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            View details
          </p>
        </div>
      </div>
    </button>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span className="inline-flex rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium">
      {status}
    </span>
  );
}

function EmptyQuotations({
  hasSearch,
  statusFilter,
}: {
  hasSearch: boolean;
  statusFilter: FilterStatus;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
        <FileText className="size-5 text-primary" />
      </div>

      <h3 className="mt-4 font-semibold">
        No quotations found
      </h3>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {hasSearch
          ? "No database quotation matches your search."
          : statusFilter === "All"
            ? "There are currently no quotation records in the database."
            : `There are currently no ${statusFilter.toLowerCase()} quotations.`}
      </p>
    </div>
  );
}

function QuotationLoading() {
  return (
    <div className="space-y-6">
      <div className="h-20 animate-pulse rounded-2xl border border-border bg-card" />

      <div className="h-28 animate-pulse rounded-2xl border border-border bg-card" />

      <div className="rounded-2xl border border-border bg-card">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse border-b border-border last:border-0"
          />
        ))}
      </div>
    </div>
  );
}
function QuotationDetails({
  quotation,
  onClose,
  onStatusChange,
  onSaved,
}: {
  quotation: Quotation;
  onClose: () => void;
  onStatusChange: (
    id: string,
    status: string,
  ) => Promise<void>;
  onSaved: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  const [discount, setDiscount] = useState(
    Number(quotation.discount ?? 0),
  );

  const [adminNotes, setAdminNotes] = useState(
    quotation.admin_notes ?? "",
  );

  const items = quotation.quotation_items ?? [];

  const subtotal = items.reduce(
    (total, item) =>
      total +
      Number(item.quantity ?? 0) *
        Number(item.unit_price ?? 0),
    0,
  );

  const safeDiscount = Math.min(
    Math.max(0, discount),
    subtotal,
  );

  const total = subtotal - safeDiscount;

  async function handleStatusChange(
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    setSaving(true);

    try {
      await onStatusChange(
        quotation.id,
        event.target.value,
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveQuotationDetails() {
    setSaving(true);

    try {
      await updateQuotation(quotation.id, {
        discount: Math.min(
          Math.max(0, Number(discount) || 0),
          subtotal,
        ),
        admin_notes: adminNotes.trim() || null,
      });

      await onSaved();

      alert("Quotation saved successfully.");
      onClose();
    } catch (error) {
      console.error("Quotation save failed:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save quotation.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-3xl border border-border bg-background shadow-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-6 py-5 backdrop-blur">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Quotation
            </p>

            <h2 className="mt-1 text-xl font-bold">
              {quotation.quotation_number}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-full border border-border hover:bg-secondary"
            aria-label="Close quotation"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* CUSTOMER */}
          <div className="grid gap-4 md:grid-cols-3">
            <InfoCard
              label="Customer"
              value={
                quotation.customers?.full_name ??
                "Unknown customer"
              }
              secondary={
                quotation.customers?.phone ??
                "No phone"
              }
            />

            <InfoCard
              label="Email"
              value={
                quotation.customers?.email ??
                "Not provided"
              }
            />

            <InfoCard
              label="Submitted"
              value={formatDateTime(
                quotation.created_at,
              )}
            />
          </div>

          {/* STATUS */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-semibold">
                  Workflow status
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Update the current quotation stage.
                </p>
              </div>

              <select
                value={quotation.status}
                onChange={handleStatusChange}
                className="w-full rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950"
              >
                {QUOTATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* VEHICLE */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-5">
              <h3 className="font-semibold">
                Vehicle
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <InfoCard
                label="Make"
                value={
                  quotation.vehicle_make ??
                  "Not provided"
                }
              />

              <InfoCard
                label="Model"
                value={
                  quotation.vehicle_model ??
                  "Not provided"
                }
              />

              <InfoCard
                label="Year"
                value={
                  quotation.vehicle_year ??
                  "Not provided"
                }
              />
            </div>
          </div>

          {/* ITEMS */}
          <div className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h3 className="font-semibold">
                Requested items
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Items recorded with this quotation in the database.
              </p>
            </div>

            <div className="divide-y divide-border">
              {items.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">
                  No quotation items were recorded.
                </div>
              ) : (
                items.map((item) => {
                  const quantity =
                    Number(item.quantity ?? 0);

                  const unitPrice =
                    Number(item.unit_price ?? 0);

                  const lineTotal =
                    quantity * unitPrice;

                  return (
                    <div
                      key={item.id}
                      className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {item.product_name ??
                            "Unnamed product"}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Product ID:{" "}
                          {item.product_id ??
                            "Not linked"}
                        </p>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        × {quantity}
                      </div>

                      <div className="text-sm">
                        {formatCurrency(unitPrice)}
                      </div>

                      <div className="text-sm font-semibold sm:text-right">
                        {formatCurrency(lineTotal)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-border px-5 py-5">
              <div className="ml-auto max-w-sm space-y-3">
                <SummaryRow
                  label="Subtotal"
                  value={formatCurrency(subtotal)}
                />

                <SummaryRow
                  label="Discount"
                  value={formatCurrency(safeDiscount)}
                />

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="font-semibold">
                    Total
                  </span>

                  <span className="text-lg font-bold">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ADJUSTMENTS */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4">
                <h3 className="font-semibold">
                  Quotation adjustment
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Apply a discount before preparing the final quotation.
                </p>
              </div>

              <label className="text-sm font-medium">
                Discount (KES)
              </label>

              <input
                type="number"
                min="0"
                value={discount}
                onChange={(event) =>
                  setDiscount(
                    Math.max(
                      0,
                      Number(event.target.value) || 0,
                    ),
                  )
                }
                className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
              />

              <p className="mt-2 text-xs text-muted-foreground">
                Maximum discount:{" "}
                {formatCurrency(subtotal)}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4">
                <h3 className="font-semibold">
                  Manager notes
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Internal notes for processing this quotation.
                </p>
              </div>

              <textarea
                value={adminNotes}
                onChange={(event) =>
                  setAdminNotes(event.target.value)
                }
                rows={5}
                placeholder="Add internal notes..."
                className="w-full resize-none rounded-xl border border-border bg-background p-4 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveQuotationDetails}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save quotation"}
            </button>
          </div>

          {/* CUSTOMER MESSAGE */}
          {quotation.message && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold">
                Customer message
              </h3>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {quotation.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function InfoCard({
  label,
  value,
  secondary,
}: {
  label: string;
  value: string;
  secondary?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold">
        {value}
      </p>

      {secondary && (
        <p className="mt-1 text-xs text-muted-foreground">
          {secondary}
        </p>
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        {label}
      </span>

      <span className="font-medium">
        {value}
      </span>
    </div>
  );
}

function formatVehicle(quotation: Quotation) {
  const vehicle = [
    quotation.vehicle_make,
    quotation.vehicle_model,
    quotation.vehicle_year,
  ].filter(Boolean);

  return vehicle.length > 0
    ? vehicle.join(" ")
    : "Vehicle not specified";
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}