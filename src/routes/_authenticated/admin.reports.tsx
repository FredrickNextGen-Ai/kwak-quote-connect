import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Package,
  Users,
  TrendingUp,
  Download,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  adminProductsQuery,
  adminQuotationsQuery,
  adminCustomersQuery,
} from "@/lib/admin";

export const Route = createFileRoute(
  "/_authenticated/admin/reports",
)({
  component: ReportsPage,
});

type ReportType =
  | "parts"
  | "quotations"
  | "customers"
  | "forecast";

type DateRange =
  | "all"
  | "today"
  | "7d"
  | "30d"
  | "month"
  | "year";

function ReportsPage() {
  const productsQuery = useQuery(adminProductsQuery);
  const quotationsQuery = useQuery(adminQuotationsQuery);
  const customersQuery = useQuery(adminCustomersQuery);

  const [reportType, setReportType] =
    useState<ReportType>("parts");

  const [dateRange, setDateRange] =
    useState<DateRange>("all");

  const [generating, setGenerating] =
    useState(false);

  const [generatedMessage, setGeneratedMessage] =
    useState("");

  const products = productsQuery.data ?? [];
  const quotations = quotationsQuery.data ?? [];
  const customers = customersQuery.data ?? [];

  const filteredQuotations = useMemo(
    () =>
      filterQuotationsByDate(
        quotations,
        dateRange,
      ),
    [quotations, dateRange],
  );

  const isLoading =
    productsQuery.isLoading ||
    quotationsQuery.isLoading ||
    customersQuery.isLoading;

  async function refresh() {
    await Promise.all([
      productsQuery.refetch(),
      quotationsQuery.refetch(),
      customersQuery.refetch(),
    ]);
  }

  async function generateReport() {
    try {
      setGenerating(true);
      setGeneratedMessage("");

      if (reportType === "parts") {
        generatePartsCatalogue(products);
      }

      if (reportType === "quotations") {
        generateQuotationReport(filteredQuotations);
      }

      if (reportType === "customers") {
        generateCustomerReport(
          customers,
          filteredQuotations,
        );
      }

      if (reportType === "forecast") {
        generateForecastReport(
          filteredQuotations,
        );
      }

      setGeneratedMessage(
        "Report generated successfully.",
      );
    } catch (error) {
      console.error(
        "Failed to generate report:",
        error,
      );

      setGeneratedMessage(
        "The report could not be generated.",
      );
    } finally {
      setGenerating(false);
    }
  }

  if (isLoading) {
    return <ReportsLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            Manager workspace
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Reports
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Generate downloadable PDF reports from KWAK AUTO
            SPARE business data.
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-secondary disabled:opacity-60 lg:self-auto"
        >
          <RefreshCw className="size-4" />
          Refresh data
        </button>
      </header>

      {/* Report generator */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div>
          <h2 className="font-semibold">
            Generate a report
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Select the document you want to generate.
          </p>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {/* Report type */}
          <div>
            <label className="text-sm font-medium">
              Report type
            </label>

            <select
              value={reportType}
              onChange={(event) =>
                setReportType(
                  event.target.value as ReportType,
                )
              }
              className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            >
              <option value="parts">
                Parts Catalogue
              </option>

              <option value="quotations">
                Quotation Report
              </option>

              <option value="customers">
                Customer Activity
              </option>

              <option value="forecast">
                Forecast Report
              </option>
            </select>
          </div>

          {/* Date range */}
          <div>
            <label className="text-sm font-medium">
              Date range
            </label>

            <select
              value={dateRange}
              onChange={(event) =>
                setDateRange(
                  event.target.value as DateRange,
                )
              }
              className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            >
              <option value="all">
                All time
              </option>

              <option value="today">
                Today
              </option>

              <option value="7d">
                Last 7 days
              </option>

              <option value="30d">
                Last 30 days
              </option>

              <option value="month">
                This month
              </option>

              <option value="year">
                This year
              </option>
            </select>
          </div>
        </div>

        {/* Selected report description */}
        <ReportDescription
          reportType={reportType}
        />

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={generateReport}
            disabled={generating}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="size-4" />
                Generate PDF
              </>
            )}
          </button>

          {generatedMessage && (
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-green-600" />
              {generatedMessage}
            </div>
          )}
        </div>
      </section>

      {/* Report cards */}
      <section>
        <div className="mb-4">
          <h2 className="font-semibold">
            Available reports
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Choose a report above to generate a PDF document.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ReportCard
            icon={<Package className="size-5" />}
            title="Parts Catalogue"
            description="Generate a catalogue of available spare parts, prices and inventory information."
            active={reportType === "parts"}
            onClick={() =>
              setReportType("parts")
            }
          />

          <ReportCard
            icon={<FileText className="size-5" />}
            title="Quotation Report"
            description="Export quotation requests, customers, vehicles, items and statuses."
            active={reportType === "quotations"}
            onClick={() =>
              setReportType("quotations")
            }
          />

          <ReportCard
            icon={<Users className="size-5" />}
            title="Customer Activity"
            description="Generate a report showing customer activity and quotation requests."
            active={reportType === "customers"}
            onClick={() =>
              setReportType("customers")
            }
          />

          <ReportCard
            icon={<TrendingUp className="size-5" />}
            title="Forecast Report"
            description="Export historical demand and future spare-parts demand estimates."
            active={reportType === "forecast"}
            onClick={() =>
              setReportType("forecast")
            }
          />
        </div>
      </section>

      {/* Data summary */}
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Parts"
          value={products.length}
        />

        <SummaryCard
          label="Quotations"
          value={filteredQuotations.length}
        />

        <SummaryCard
          label="Customers"
          value={customers.length}
        />
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Report generators                                                          */
/* -------------------------------------------------------------------------- */

function generatePartsCatalogue(
  products: {
    name: string;
    categories: { name: string } | null;
    make: string | null;
    model: string | null;
    price: number | null;
    availability: string;
  }[],
) {
  const doc = createPdf(
    "KWAK AUTO SPARE",
    "Parts Catalogue",
  );

  doc.setFontSize(10);

  doc.text(
    `Generated: ${formatDate(new Date())}`,
    14,
    32,
  );

  doc.text(
    `Total parts: ${products.length}`,
    14,
    38,
  );

  const rows = products.map(
    (product) => [
      product.name,

      product.categories?.name ?? "—",

      product.make ?? "—",

      product.model ?? "—",

      formatPdfCurrency(
        Number(product.price ?? 0),
      ),

      product.availability,
    ],
  );

  autoTable(doc, {
    startY: 46,

    head: [
      [
        "Part",
        "Category",
        "Make",
        "Model",
        "Price",
        "Status",
      ],
    ],

    body: rows,

    styles: {
      fontSize: 8,
      cellPadding: 3,
    },

    headStyles: {
      fontStyle: "bold",
    },

    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });

  addPdfFooter(doc);

  doc.save(
    `kwak-auto-spare-parts-${fileDate()}.pdf`,
  );
}

function generateQuotationReport(
  quotations: any[],
) {
  const doc = createPdf(
    "KWAK AUTO SPARE",
    "Quotation Report",
  );

  doc.setFontSize(10);

  doc.text(
    `Generated: ${formatDate(new Date())}`,
    14,
    32,
  );

  doc.text(
    `Total quotations: ${quotations.length}`,
    14,
    38,
  );

  const rows = quotations.map(
    (quotation) => {
      const value =
        quotation.quotation_items?.reduce(
          (
            total: number,
            item: any,
          ) =>
            total +
            Number(
              item.quantity ?? 0,
            ) *
              Number(
                item.unit_price ?? 0,
              ),
          0,
        ) ?? 0;

      const discount = Number(
        quotation.discount ?? 0,
      );

      const finalValue = Math.max(
        0,
        value - discount,
      );

      return [
        quotation.quotation_number ??
          "—",

        quotation.customers
          ?.full_name ??
          "Unknown",

        quotation.vehicle_make ??
          "—",

        quotation.status ??
          "—",

        formatPdfCurrency(
          finalValue,
        ),

        formatDate(
          quotation.created_at,
        ),
      ];
    },
  );

  autoTable(doc, {
    startY: 46,

    head: [
      [
        "Quotation",
        "Customer",
        "Vehicle",
        "Status",
        "Value",
        "Date",
      ],
    ],

    body: rows,

    styles: {
      fontSize: 8,
      cellPadding: 3,
    },

    headStyles: {
      fontStyle: "bold",
    },

    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });

  addPdfFooter(doc);

  doc.save(
    `kwak-auto-spare-quotations-${fileDate()}.pdf`,
  );
}

function generateCustomerReport(
  customers: any[],
  quotations: any[],
) {
  const doc = createPdf(
    "KWAK AUTO SPARE",
    "Customer Activity Report",
  );

  doc.setFontSize(10);

  doc.text(
    `Generated: ${formatDate(new Date())}`,
    14,
    32,
  );

  const rows = customers.map(
    (customer) => {
      const customerQuotations =
        quotations.filter(
          (quotation) =>
            quotation.customer_id ===
            customer.id,
        );

      const quotationValue =
        customerQuotations.reduce(
          (
            total: number,
            quotation: any,
          ) => {
            const subtotal =
              quotation.quotation_items?.reduce(
                (
                  itemTotal: number,
                  item: any,
                ) =>
                  itemTotal +
                  Number(
                    item.quantity ?? 0,
                  ) *
                    Number(
                      item.unit_price ?? 0,
                    ),
                0,
              ) ?? 0;

            return (
              total +
              Math.max(
                0,
                subtotal -
                  Number(
                    quotation.discount ??
                      0,
                  ),
              )
            );
          },
          0,
        );

      return [
        customer.full_name ??
          "Unknown",

        customer.phone ??
          "—",

        customer.email ??
          "—",

        customerQuotations.length,

        formatPdfCurrency(
          quotationValue,
        ),
      ];
    },
  );

  autoTable(doc, {
    startY: 38,

    head: [
      [
        "Customer",
        "Phone",
        "Email",
        "Quotations",
        "Value",
      ],
    ],

    body: rows,

    styles: {
      fontSize: 8,
      cellPadding: 3,
    },

    headStyles: {
      fontStyle: "bold",
    },

    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });

  addPdfFooter(doc);

  doc.save(
    `kwak-auto-spare-customers-${fileDate()}.pdf`,
  );
}

function generateForecastReport(
  quotations: any[],
) {
  const doc = createPdf(
    "KWAK AUTO SPARE",
    "Forecast Report",
  );

  const dailyDemand = new Map<
    string,
    number
  >();

  for (const quotation of quotations) {
    const key = new Date(
      quotation.created_at,
    )
      .toISOString()
      .slice(0, 10);

    const current =
      dailyDemand.get(key) ?? 0;

    const quantity =
      quotation.quotation_items?.reduce(
        (
          total: number,
          item: any,
        ) =>
          total +
          Number(
            item.quantity ?? 0,
          ),
        0,
      ) ?? 0;

    dailyDemand.set(
      key,
      current + quantity,
    );
  }

  const values = Array.from(
    dailyDemand.values(),
  );

  const average =
    values.length > 0
      ? values.reduce(
          (a, b) => a + b,
          0,
        ) / values.length
      : 0;

  doc.setFontSize(10);

  doc.text(
    `Generated: ${formatDate(new Date())}`,
    14,
    32,
  );

  doc.text(
    `Historical days: ${values.length}`,
    14,
    39,
  );

  doc.text(
    `Average daily demand: ${average.toFixed(
      2,
    )} items`,
    14,
    46,
  );

  doc.text(
    `Estimated next 30 days: ${Math.round(
      average * 30,
    )} items`,
    14,
    53,
  );

  autoTable(doc, {
    startY: 62,

    head: [
      [
        "Date",
        "Requested quantity",
      ],
    ],

    body: Array.from(
      dailyDemand.entries(),
    ).map(
      ([date, quantity]) => [
        date,
        quantity,
      ],
    ),

    styles: {
      fontSize: 8,
      cellPadding: 3,
    },

    headStyles: {
      fontStyle: "bold",
    },
  });

  addPdfFooter(doc);

  doc.save(
    `kwak-auto-spare-forecast-${fileDate()}.pdf`,
  );
}

/* -------------------------------------------------------------------------- */
/* Filtering                                                                  */
/* -------------------------------------------------------------------------- */

function filterQuotationsByDate(
  quotations: any[],
  range: DateRange,
) {
  if (range === "all") {
    return quotations;
  }

  const now = new Date();
  const start = new Date(now);

  if (range === "today") {
    start.setHours(0, 0, 0, 0);
  }

  if (range === "7d") {
    start.setDate(
      now.getDate() - 7,
    );
  }

  if (range === "30d") {
    start.setDate(
      now.getDate() - 30,
    );
  }

  if (range === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }

  if (range === "year") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }

  return quotations.filter(
    (quotation) =>
      new Date(
        quotation.created_at,
      ) >= start,
  );
}

/* -------------------------------------------------------------------------- */
/* PDF helpers                                                                */
/* -------------------------------------------------------------------------- */

function createPdf(
  companyName: string,
  title: string,
) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(
    companyName,
    14,
    18,
  );

  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.text(
    title,
    14,
    26,
  );

  return doc;
}

function addPdfFooter(
  doc: jsPDF,
) {
  const pageCount =
    doc.getNumberOfPages();

  for (
    let page = 1;
    page <= pageCount;
    page++
  ) {
    doc.setPage(page);

    const height =
      doc.internal.pageSize.height;

    doc.setFontSize(8);

    doc.setTextColor(120);

    doc.text(
      `KWAK AUTO SPARE • Page ${page} of ${pageCount}`,
      14,
      height - 10,
    );

    doc.setTextColor(0);
  }
}

function formatPdfCurrency(
  value: number,
) {
  return `KES ${Math.round(
    value,
  ).toLocaleString()}`;
}

function formatDate(
  value: string | Date,
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  return date.toLocaleDateString(
    "en-KE",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

function fileDate() {
  const date = new Date();

  return date
    .toISOString()
    .slice(0, 10);
}

/* -------------------------------------------------------------------------- */
/* UI components                                                              */
/* -------------------------------------------------------------------------- */

function ReportDescription({
  reportType,
}: {
  reportType: ReportType;
}) {
  const descriptions: Record<
    ReportType,
    string
  > = {
    parts:
      "Creates a PDF catalogue containing the spare parts currently stored in the product database.",

    quotations:
      "Creates a PDF summary of quotation requests, customers, vehicles, statuses and values.",

    customers:
      "Creates a PDF showing customer contact information and quotation activity.",

    forecast:
      "Creates a PDF containing historical demand and a baseline 30-day demand estimate.",
  };

  return (
    <div className="mt-5 rounded-xl bg-secondary/50 p-4">
      <p className="text-sm text-muted-foreground">
        {descriptions[reportType]}
      </p>
    </div>
  );
}

function ReportCard({
  icon,
  title,
  description,
  active,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-2xl border p-5 text-left transition",
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-secondary/40",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-secondary p-3">
          {icon}
        </div>

        <div>
          <h3 className="font-semibold">
            {title}
          </h3>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function ReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-20 animate-pulse rounded-2xl bg-secondary" />

      <div className="h-64 animate-pulse rounded-2xl bg-secondary" />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
      </div>
    </div>
  );
}
