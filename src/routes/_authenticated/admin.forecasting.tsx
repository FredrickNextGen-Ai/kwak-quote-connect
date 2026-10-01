import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  FileText,
  Package,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  adminQuotationsQuery,
  type Quotation,
} from "@/lib/admin";

export const Route = createFileRoute(
  "/_authenticated/admin/forecasting",
)({
  component: ForecastingPage,
});

const EMPTY_QUOTATIONS: Quotation[] = [];

type ForecastPeriod = 7 | 30 | 90;

type DailyDemand = {
  date: string;
  label: string;
  quantity: number;
  quotations: number;
};

type ProductDemand = {
  productId: string;
  productName: string;
  quantity: number;
  quotationCount: number;
};

type ForecastPoint = {
  date: string;
  label: string;
  actual?: number;
  forecast?: number;
};

function ForecastingPage() {
  const quotationsQuery = useQuery(adminQuotationsQuery);
  const quotations = quotationsQuery.data ?? EMPTY_QUOTATIONS;
  const [forecastPeriod, setForecastPeriod] = useState<ForecastPeriod>(30);
  const [historyDays, setHistoryDays] = useState<90 | 180 | 365>(90);

  const dailyDemand = useMemo(
    () => buildDailyDemand(quotations, historyDays),
    [quotations, historyDays],
  );
  const productDemand = useMemo(
    () => buildProductDemand(quotations, historyDays),
    [quotations, historyDays],
  );
  const forecast = useMemo(
    () => buildForecast(dailyDemand, forecastPeriod),
    [dailyDemand, forecastPeriod],
  );
  const summary = useMemo(
    () => calculateForecastSummary(dailyDemand, forecast, forecastPeriod),
    [dailyDemand, forecast, forecastPeriod],
  );

  async function refresh() {
    await quotationsQuery.refetch();
  }

  if (quotationsQuery.isLoading) {
    return <ForecastingLoading />;
  }

  if (quotationsQuery.isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="font-semibold text-destructive">
          Forecasting data could not be loaded
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {quotationsQuery.error instanceof Error
            ? quotationsQuery.error.message
            : "Unable to load quotation data."}
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

  const hasDemand = summary.historicalDemand > 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Manager workspace</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Forecasting</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Estimate future spare-parts demand using historical quotation
            activity.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={quotationsQuery.isFetching}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-secondary disabled:opacity-60 lg:self-auto"
        >
          <RefreshCw
            className={`size-4 ${quotationsQuery.isFetching ? "animate-spin" : ""}`}
          />
          {quotationsQuery.isFetching ? "Refreshing..." : "Refresh data"}
        </button>
      </header>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-semibold">Forecast settings</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose the historical period and forecast horizon.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Historical data
              </span>
              <select
                value={historyDays}
                onChange={(event) =>
                  setHistoryDays(Number(event.target.value) as 90 | 180 | 365)
                }
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value={90}>Last 90 days</option>
                <option value={180}>Last 180 days</option>
                <option value={365}>Last 365 days</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Forecast horizon
              </span>
              <select
                value={forecastPeriod}
                onChange={(event) =>
                  setForecastPeriod(Number(event.target.value) as ForecastPeriod)
                }
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value={7}>Next 7 days</option>
                <option value={30}>Next 30 days</option>
                <option value={90}>Next 90 days</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Package className="size-5" />}
          label="Historical demand"
          value={summary.historicalDemand.toLocaleString()}
          description={`Items requested in ${historyDays} days`}
        />
        <MetricCard
          icon={<TrendingUp className="size-5" />}
          label="Forecast demand"
          value={summary.forecastDemand.toLocaleString()}
          description={`Estimated next ${forecastPeriod} days`}
          trend={summary.demandChange}
        />
        <MetricCard
          icon={<FileText className="size-5" />}
          label="Historical quotations"
          value={summary.historicalQuotations.toLocaleString()}
          description={`Quotation requests in ${historyDays} days`}
        />
        <MetricCard
          icon={<CalendarDays className="size-5" />}
          label="Average daily demand"
          value={summary.averageDailyDemand.toFixed(1)}
          description="Items requested per day"
        />
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-5">
          <h2 className="font-semibold">Spare-parts demand forecast</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Historical daily demand followed by the estimated future demand.
          </p>
        </div>
        <div className="h-[360px]">
          {!hasDemand ? (
            <EmptyForecast />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={25} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual demand"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="Forecast"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-5">
          <h2 className="font-semibold">Most requested parts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Products with the highest historical requested quantities.
          </p>
        </div>
        {productDemand.length === 0 ? (
          <EmptyForecast />
        ) : (
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={productDemand.slice(0, 10)}
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="productName"
                  width={160}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar dataKey="quantity" name="Requested quantity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">Demand outlook</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Historical demand and simple projected demand for frequently
            requested parts.
          </p>
        </div>
        {productDemand.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No product demand data is available for the selected period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="border-b border-border bg-secondary/30">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Part</th>
                  <th className="px-5 py-3 text-right font-medium">Requested</th>
                  <th className="px-5 py-3 text-right font-medium">Quotations</th>
                  <th className="px-5 py-3 text-right font-medium">Daily avg.</th>
                  <th className="px-5 py-3 text-right font-medium">Next 30 days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {productDemand.slice(0, 15).map((product) => {
                  const dailyAverage = product.quantity / historyDays;
                  const next30 = Math.round(dailyAverage * 30);
                  return (
                    <tr
                      key={product.productId}
                      className="hover:bg-secondary/30"
                    >
                      <td className="px-5 py-3 font-medium">
                        {product.productName}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {product.quantity.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {product.quotationCount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {dailyAverage.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold">
                        {next30.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-secondary/30 p-5">
        <h2 className="font-semibold">Forecast methodology</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The portal uses historical quotation demand to establish a baseline
          forecast, based on average demand over the most recent 14 days. This
          is an initial planning estimate; a Python forecasting service can
          replace the calculation later with moving averages, exponential
          smoothing, or machine learning.
        </p>
      </section>
    </div>
  );
}

function buildDailyDemand(
  quotations: Quotation[],
  historyDays: number,
): DailyDemand[] {
  const today = startOfDay(new Date());
  const demandByDate = new Map<string, DailyDemand>();

  for (let offset = historyDays - 1; offset >= 0; offset--) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = dateKey(date);
    demandByDate.set(key, {
      date: key,
      label: formatShortDate(date),
      quantity: 0,
      quotations: 0,
    });
  }

  for (const quotation of quotations) {
    const key = dateKey(new Date(quotation.created_at));
    const day = demandByDate.get(key);
    if (!day) continue;

    day.quotations += 1;
    for (const item of quotation.quotation_items ?? []) {
      day.quantity += Number(item.quantity ?? 0);
    }
  }

  return Array.from(demandByDate.values());
}

function buildProductDemand(
  quotations: Quotation[],
  historyDays: number,
): ProductDemand[] {
  const startDate = startOfDay(new Date());
  startDate.setDate(startDate.getDate() - historyDays + 1);
  const startKey = dateKey(startDate);
  const map = new Map<string, ProductDemand>();

  for (const quotation of quotations) {
    const quotationKey = dateKey(new Date(quotation.created_at));
    if (quotationKey < startKey || quotationKey > dateKey(new Date())) continue;

    for (const item of quotation.quotation_items ?? []) {
      const productId = item.product_id ?? item.product_name ?? "unknown";
      const productName = item.product_name ?? "Unknown product";
      const quantity = Number(item.quantity ?? 0);
      const existing = map.get(productId);

      if (existing) {
        existing.quantity += quantity;
        existing.quotationCount += 1;
      } else {
        map.set(productId, {
          productId,
          productName,
          quantity,
          quotationCount: 1,
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
}

function buildForecast(
  dailyDemand: DailyDemand[],
  forecastPeriod: number,
): ForecastPoint[] {
  if (dailyDemand.length === 0) return [];

  const recentDays = dailyDemand.slice(-14);
  const averageDemand =
    recentDays.reduce((total, day) => total + day.quantity, 0) /
    recentDays.length;
  const historical = dailyDemand.map((day) => ({
    date: day.date,
    label: day.label,
    actual: day.quantity,
  }));
  const lastDay = dailyDemand.at(-1);
  if (!lastDay) return [];

  const lastDate = startOfDay(new Date(lastDay.date));
  const future: ForecastPoint[] = [];

  for (let offset = 1; offset <= forecastPeriod; offset++) {
    const date = new Date(lastDate);
    date.setDate(lastDate.getDate() + offset);
    future.push({
      date: dateKey(date),
      label: formatShortDate(date),
      forecast: Number(averageDemand.toFixed(2)),
    });
  }

  return [...historical, ...future];
}

function calculateForecastSummary(
  dailyDemand: DailyDemand[],
  forecast: ForecastPoint[],
  forecastPeriod: number,
) {
  const historicalDemand = dailyDemand.reduce(
    (total, day) => total + day.quantity,
    0,
  );
  const historicalQuotations = dailyDemand.reduce(
    (total, day) => total + day.quotations,
    0,
  );
  const averageDailyDemand =
    dailyDemand.length > 0 ? historicalDemand / dailyDemand.length : 0;
  const forecastDemand = Math.round(
    forecast.reduce((total, point) => total + (point.forecast ?? 0), 0),
  );
  const historicalComparable = averageDailyDemand * forecastPeriod;
  const demandChange =
    historicalComparable > 0
      ? ((forecastDemand - historicalComparable) / historicalComparable) * 100
      : 0;

  return {
    historicalDemand,
    historicalQuotations,
    averageDailyDemand,
    forecastDemand,
    demandChange,
  };
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
  });
}

function MetricCard({
  icon,
  label,
  value,
  description,
  trend,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  description: string;
  trend?: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="rounded-lg bg-secondary p-2.5">{icon}</div>
        {trend !== undefined && (
          <span className="inline-flex items-center gap-1 text-xs font-medium">
            {trend >= 0 ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function EmptyForecast() {
  return (
    <div className="flex h-full min-h-[220px] items-center justify-center text-center">
      <div>
        <TrendingUp className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 font-medium">Not enough demand data</p>
        <p className="mt-1 text-sm text-muted-foreground">
          More quotation activity is needed to generate a forecast.
        </p>
      </div>
    </div>
  );
}

function ForecastingLoading() {
  return (
    <div className="space-y-6">
      <div className="h-20 animate-pulse rounded-xl bg-secondary" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-xl bg-secondary"
          />
        ))}
      </div>
      <div className="h-[400px] animate-pulse rounded-xl bg-secondary" />
    </div>
  );
}