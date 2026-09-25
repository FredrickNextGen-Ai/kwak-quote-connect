import { createFileRoute } from "@tanstack/react-router";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Users,
  FileText,
  Package,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock3,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import {
  adminQuotationsQuery,
  adminCustomersQuery,
  adminProductsQuery,
} from "@/lib/admin";
import { categoriesQuery } from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AnalyticsPage,
});

type DateRange = "7d" | "30d" | "90d" | "year" | "all";

type AnalyticsInsight = {
  type: "demand" | "operations" | "customer" | "product" | "vehicle";
  title: string;
  description: string;
  metric?: string;
};

function AnalyticsPage() {
  const quotationsQuery = useQuery(adminQuotationsQuery);
  const customersQuery = useQuery(adminCustomersQuery);
  const productsQuery = useQuery(adminProductsQuery);
  const categoriesQueryResult = useQuery(categoriesQuery);

  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [statusFilter, setStatusFilter] = useState("All");
  const [vehicleFilter, setVehicleFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [productFilter, setProductFilter] = useState("All");
  const [showInsights, setShowInsights] = useState(false);

  const quotations = quotationsQuery.data ?? [];
  const customers = customersQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const categories = categoriesQueryResult.data ?? [];

  const vehicleMakes = useMemo(() => {
    return Array.from(
      new Set(
        quotations
          .map((quotation) => quotation.vehicle_make)
          .filter(
            (make): make is string => Boolean(make),
          ),
      ),
    ).sort();
  }, [quotations]);

  const categoryOptions = useMemo(() => {
    return categories
      .map((category) => ({
        id: category.id,
        name: category.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const productOptions = useMemo(() => {
    return products
      .filter((product) => {
        if (categoryFilter === "All") {
          return true;
        }

        return product.category_id === categoryFilter;
      })
      .map((product) => ({
        id: product.id,
        name: product.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, categoryFilter]);

  useEffect(() => {
    if (
      productFilter !== "All" &&
      !productOptions.some(
        (product) => product.id === productFilter,
      )
    ) {
      setProductFilter("All");
    }
  }, [productOptions, productFilter]);

  const filteredQuotations = useMemo(() => {
    const now = new Date();
    const startDate = new Date(now);

    if (dateRange === "7d") {
      startDate.setDate(now.getDate() - 7);
    }

    if (dateRange === "30d") {
      startDate.setDate(now.getDate() - 30);
    }

    if (dateRange === "90d") {
      startDate.setDate(now.getDate() - 90);
    }

    if (dateRange === "year") {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    return quotations.filter((quotation) => {
      const quotationDate = new Date(quotation.created_at);

      if (
        dateRange !== "all" &&
        quotationDate < startDate
      ) {
        return false;
      }

      if (
        statusFilter !== "All" &&
        quotation.status !== statusFilter
      ) {
        return false;
      }

      if (
        vehicleFilter !== "All" &&
        quotation.vehicle_make !== vehicleFilter
      ) {
        return false;
      }

      if (
        categoryFilter !== "All" ||
        productFilter !== "All"
      ) {
        const matchesItem = quotation.quotation_items.some(
          (item) => {
            const product = products.find(
              (productItem) =>
                productItem.id === item.product_id,
            );

            if (!product) {
              return false;
            }

            const categoryMatches =
              categoryFilter === "All" ||
              product.category_id === categoryFilter;

            const productMatches =
              productFilter === "All" ||
              product.id === productFilter;

            return categoryMatches && productMatches;
          },
        );

        if (!matchesItem) {
          return false;
        }
      }

      return true;
    });
  }, [
    quotations,
    products,
    dateRange,
    statusFilter,
    vehicleFilter,
    categoryFilter,
    productFilter,
  ]);

  const activeFilterCount = [
    dateRange !== "30d",
    statusFilter !== "All",
    vehicleFilter !== "All",
    categoryFilter !== "All",
    productFilter !== "All",
  ].filter(Boolean).length;

  const resetFilters = () => {
    setDateRange("30d");
    setStatusFilter("All");
    setVehicleFilter("All");
    setCategoryFilter("All");
    setProductFilter("All");
  };

  const analytics = useMemo(() => {
    const totalQuotations = filteredQuotations.length;

    const pending = filteredQuotations.filter(
      (q) => q.status === "Pending",
    ).length;

    const reviewing = filteredQuotations.filter(
      (q) => q.status === "Reviewing",
    ).length;

    const quoted = filteredQuotations.filter(
      (q) => q.status === "Quoted",
    ).length;

    const completed = filteredQuotations.filter(
      (q) => q.status === "Completed",
    ).length;

    const cancelled = filteredQuotations.filter(
      (q) => q.status === "Cancelled",
    ).length;

    const quotationValue = filteredQuotations.reduce(
      (total, quotation) => {
        const subtotal = quotation.quotation_items.reduce(
          (sum, item) =>
            sum +
            Number(item.unit_price ?? 0) * Number(item.quantity ?? 0),
          0,
        );

        return total + subtotal - Number(quotation.discount ?? 0);
      },
      0,
    );

    const averageQuotationValue =
      totalQuotations > 0
        ? quotationValue / totalQuotations
        : 0;

    const completionRate =
      totalQuotations > 0
        ? (completed / totalQuotations) * 100
        : 0;

    const cancellationRate =
      totalQuotations > 0
        ? (cancelled / totalQuotations) * 100
        : 0;

    const productRequests = new Map<
      string,
      {
        name: string;
        quantity: number;
        value: number;
      }
    >();

    filteredQuotations.forEach((quotation) => {
      quotation.quotation_items.forEach((item) => {
        const name = item.product_name ?? "Unknown product";

        const existing = productRequests.get(name) ?? {
          name,
          quantity: 0,
          value: 0,
        };

        existing.quantity += Number(item.quantity ?? 0);

        existing.value +=
          Number(item.quantity ?? 0) *
          Number(item.unit_price ?? 0);

        productRequests.set(name, existing);
      });
    });

    const topProducts = Array.from(productRequests.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const vehicleMakes = new Map<string, number>();

    filteredQuotations.forEach((quotation) => {
      const make = quotation.vehicle_make?.trim();

      if (!make) {
        return;
      }

      vehicleMakes.set(
        make,
        (vehicleMakes.get(make) ?? 0) + 1,
      );
    });

    const topVehicleMakes = Array.from(vehicleMakes.entries())
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const quotationTrendMap = new Map<
      string,
      {
        label: string;
        sortKey: string;
        quotations: number;
        value: number;
      }
    >();

    filteredQuotations.forEach((quotation) => {
      const date = new Date(quotation.created_at);

      let label: string;
      let sortKey: string;

      if (dateRange === "7d" || dateRange === "30d") {
        sortKey = date.toISOString().slice(0, 10);

        label = date.toLocaleDateString("en-KE", {
          day: "2-digit",
          month: "short",
        });
      } else if (dateRange === "90d") {
        const weekStart = new Date(date);
        const day = weekStart.getDay();
        const difference = day === 0 ? 6 : day - 1;

        weekStart.setDate(
          weekStart.getDate() - difference,
        );
        weekStart.setHours(0, 0, 0, 0);

        sortKey = weekStart.toISOString().slice(0, 10);
        label = `Week of ${weekStart.toLocaleDateString(
          "en-KE",
          {
            day: "2-digit",
            month: "short",
          },
        )}`;
      } else {
        sortKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1,
        ).padStart(2, "0")}`;

        label = date.toLocaleDateString("en-KE", {
          month: "short",
          year: "numeric",
        });
      }

      const existing = quotationTrendMap.get(sortKey);

      const quotationValue =
        quotation.quotation_items.reduce(
          (sum, item) =>
            sum +
            Number(item.quantity ?? 0) *
              Number(item.unit_price ?? 0),
          0,
        ) - Number(quotation.discount ?? 0);

      if (existing) {
        existing.quotations += 1;
        existing.value += quotationValue;
      } else {
        quotationTrendMap.set(sortKey, {
          label,
          sortKey,
          quotations: 1,
          value: quotationValue,
        });
      }
    });

    const quotationTrend = Array.from(
      quotationTrendMap.values(),
    )
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map((item) => ({
        date: item.label,
        quotations: item.quotations,
        value: item.value,
      }));

    const vehicleProductMap = new Map<
      string,
      Map<string, number>
    >();

    filteredQuotations.forEach((quotation) => {
      const vehicle =
        quotation.vehicle_make?.trim() ||
        "Unknown vehicle";

      if (!vehicleProductMap.has(vehicle)) {
        vehicleProductMap.set(
          vehicle,
          new Map<string, number>(),
        );
      }

      const productMap = vehicleProductMap.get(vehicle)!;

      quotation.quotation_items.forEach((item) => {
        const product =
          item.product_name?.trim() ||
          "Unknown product";

        productMap.set(
          product,
          (productMap.get(product) ?? 0) +
            Number(item.quantity ?? 0),
        );
      });
    });

    const vehicleProductAnalysis = Array.from(
      vehicleProductMap.entries(),
    )
      .map(([vehicle, products]) => ({
        vehicle,
        products: Array.from(products.entries())
          .map(([product, quantity]) => ({
            product,
            quantity,
          }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5),
      }))
      .sort(
        (a, b) =>
          b.products.reduce(
            (sum, item) => sum + item.quantity,
            0,
          ) -
          a.products.reduce(
            (sum, item) => sum + item.quantity,
            0,
          ),
      )
      .slice(0, 10);

    const customerActivityMap = new Map<
      string,
      {
        customerId: string;
        name: string;
        phone: string;
        quotations: number;
        completed: number;
        cancelled: number;
        value: number;
        firstQuotation: string;
        lastQuotation: string;
      }
    >();

    filteredQuotations.forEach((quotation) => {
      const customer = quotation.customers;

      if (!customer) {
        return;
      }

      const existing = customerActivityMap.get(customer.id);

      const quotationValue =
        quotation.quotation_items.reduce(
          (sum, item) =>
            sum +
            Number(item.quantity ?? 0) *
              Number(item.unit_price ?? 0),
          0,
        ) - Number(quotation.discount ?? 0);

      if (existing) {
        existing.quotations += 1;

        if (quotation.status === "Completed") {
          existing.completed += 1;
        }

        if (quotation.status === "Cancelled") {
          existing.cancelled += 1;
        }

        existing.value += quotationValue;

        if (
          new Date(quotation.created_at) <
          new Date(existing.firstQuotation)
        ) {
          existing.firstQuotation = quotation.created_at;
        }

        if (
          new Date(quotation.created_at) >
          new Date(existing.lastQuotation)
        ) {
          existing.lastQuotation = quotation.created_at;
        }
      } else {
        customerActivityMap.set(customer.id, {
          customerId: customer.id,
          name: customer.full_name,
          phone: customer.phone,
          quotations: 1,
          completed:
            quotation.status === "Completed" ? 1 : 0,
          cancelled:
            quotation.status === "Cancelled" ? 1 : 0,
          value: quotationValue,
          firstQuotation: quotation.created_at,
          lastQuotation: quotation.created_at,
        });
      }
    });

    const customerActivity = Array.from(
      customerActivityMap.values(),
    ).sort((a, b) => b.quotations - a.quotations);

    const activeCustomers = customerActivity.length;

    const returningCustomers = customerActivity.filter(
      (customer) => customer.quotations > 1,
    ).length;

    const newCustomers = customerActivity.filter(
      (customer) => customer.quotations === 1,
    ).length;

    const repeatCustomerRate =
      activeCustomers > 0
        ? (returningCustomers / activeCustomers) * 100
        : 0;

    const averageQuotationsPerCustomer =
      activeCustomers > 0
        ? filteredQuotations.length / activeCustomers
        : 0;

    const customerValue = customerActivity.reduce(
      (total, customer) => total + customer.value,
      0,
    );

    const productAnalyticsMap = new Map<
      string,
      {
        productId: string | null;
        name: string;
        categoryId: string | null;
        categoryName: string;
        quantity: number;
        quotationCount: number;
        value: number;
        averagePrice: number;
        pricedRequests: number;
      }
    >();

    const productQuotationSets = new Map<
      string,
      Set<string>
    >();

    filteredQuotations.forEach((quotation) => {
      quotation.quotation_items.forEach((item) => {
        const product = products.find(
          (productItem) => productItem.id === item.product_id,
        );

        const productId =
          item.product_id ?? item.product_name ?? "unknown";

        const existing = productAnalyticsMap.get(productId);
        const quantity = Number(item.quantity ?? 0);
        const unitPrice = Number(item.unit_price ?? 0);
        const value = quantity * unitPrice;

        if (!productQuotationSets.has(productId)) {
          productQuotationSets.set(
            productId,
            new Set<string>(),
          );
        }

        productQuotationSets
          .get(productId)!
          .add(quotation.id);

        if (existing) {
          existing.quantity += quantity;
          existing.value += value;

          if (unitPrice > 0) {
            existing.pricedRequests += 1;
            existing.averagePrice =
              (existing.averagePrice *
                (existing.pricedRequests - 1) +
                unitPrice) /
              existing.pricedRequests;
          }
        } else {
          productAnalyticsMap.set(productId, {
            productId: item.product_id ?? null,
            name:
              item.product_name ??
              product?.name ??
              "Unknown product",
            categoryId: product?.category_id ?? null,
            categoryName:
              categories.find(
                (category) =>
                  category.id === product?.category_id,
              )?.name ?? "Uncategorized",
            quantity,
            quotationCount: 0,
            value,
            averagePrice: unitPrice,
            pricedRequests: unitPrice > 0 ? 1 : 0,
          });
        }
      });
    });

    productQuotationSets.forEach(
      (quotationSet, productId) => {
        const product = productAnalyticsMap.get(productId);

        if (product) {
          product.quotationCount = quotationSet.size;
        }
      },
    );

    const productAnalytics = Array.from(
      productAnalyticsMap.values(),
    )
      .map((product) => ({
        ...product,
        averagePrice:
          product.pricedRequests > 0
            ? product.averagePrice
            : 0,
      }))
      .sort((a, b) => b.quantity - a.quantity);

    const categoryAnalyticsMap = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        products: number;
        quantity: number;
        quotations: number;
        value: number;
      }
    >();

    const categoryQuotationSets = new Map<
      string,
      Set<string>
    >();

    products.forEach((product) => {
      if (!product.category_id) {
        return;
      }

      const existing = categoryAnalyticsMap.get(
        product.category_id,
      );

      if (!existing) {
        categoryAnalyticsMap.set(product.category_id, {
          categoryId: product.category_id,
          categoryName:
            categories.find(
              (category) =>
                category.id === product.category_id,
            )?.name ?? "Uncategorized",
          products: 1,
          quantity: 0,
          quotations: 0,
          value: 0,
        });
      } else {
        existing.products += 1;
      }
    });

    filteredQuotations.forEach((quotation) => {
      quotation.quotation_items.forEach((item) => {
        const product = products.find(
          (productItem) => productItem.id === item.product_id,
        );

        if (!product?.category_id) {
          return;
        }

        const category = categoryAnalyticsMap.get(
          product.category_id,
        );

        if (!category) {
          return;
        }

        const quantity = Number(item.quantity ?? 0);
        const value =
          quantity * Number(item.unit_price ?? 0);

        category.quantity += quantity;
        category.value += value;

        if (!categoryQuotationSets.has(product.category_id)) {
          categoryQuotationSets.set(
            product.category_id,
            new Set<string>(),
          );
        }

        categoryQuotationSets
          .get(product.category_id)!
          .add(quotation.id);
      });
    });

    categoryQuotationSets.forEach(
      (quotationSet, categoryId) => {
        const category = categoryAnalyticsMap.get(categoryId);

        if (category) {
          category.quotations = quotationSet.size;
        }
      },
    );

    const categoryAnalytics = Array.from(
      categoryAnalyticsMap.values(),
    ).sort((a, b) => b.quantity - a.quantity);

    const statusDistribution = [
      { status: "Pending", count: pending },
      { status: "Reviewing", count: reviewing },
      { status: "Quoted", count: quoted },
      { status: "Completed", count: completed },
      { status: "Cancelled", count: cancelled },
    ];

    return {
      totalQuotations,
      pending,
      reviewing,
      quoted,
      completed,
      cancelled,
      quotationValue,
      averageQuotationValue,
      completionRate,
      cancellationRate,
      topProducts,
      topVehicleMakes,
      quotationTrend,
      statusDistribution,
      vehicleProductAnalysis,
      customerActivity,
      activeCustomers,
      returningCustomers,
      newCustomers,
      repeatCustomerRate,
      averageQuotationsPerCustomer,
      customerValue,
      productAnalytics,
      categoryAnalytics,
    };
  }, [filteredQuotations, dateRange, products, categories]);

  const insights = useMemo<AnalyticsInsight[]>(() => {
    const results: AnalyticsInsight[] = [];

    if (filteredQuotations.length === 0) {
      return [
        {
          type: "operations",
          title: "No matching data",
          description:
            "There are no quotations matching the current analytics filters.",
        },
      ];
    }

    const total = filteredQuotations.length;
    const pending = filteredQuotations.filter(
      (quotation) => quotation.status === "Pending",
    ).length;
    const reviewing = filteredQuotations.filter(
      (quotation) => quotation.status === "Reviewing",
    ).length;
    const completed = filteredQuotations.filter(
      (quotation) => quotation.status === "Completed",
    ).length;
    const cancelled = filteredQuotations.filter(
      (quotation) => quotation.status === "Cancelled",
    ).length;

    const pendingRate = (pending / total) * 100;
    const completionRate = (completed / total) * 100;
    const cancellationRate = (cancelled / total) * 100;

    if (pendingRate >= 40) {
      results.push({
        type: "operations",
        title: "High pending workload",
        description: `${pending} of ${total} quotations are currently pending, representing ${pendingRate.toFixed(1)}% of filtered requests.`,
        metric: `${pendingRate.toFixed(1)}% pending`,
      });
    }

    if (reviewing > 0) {
      results.push({
        type: "operations",
        title: "Quotations under review",
        description: `${reviewing} quotation${reviewing === 1 ? "" : "s"} currently require manager review.`,
        metric: `${reviewing} reviewing`,
      });
    }

    if (completionRate >= 60) {
      results.push({
        type: "operations",
        title: "Strong completion activity",
        description: `${completed} quotations have reached Completed status.`,
        metric: `${completionRate.toFixed(1)}% completed`,
      });
    }

    if (cancellationRate >= 20) {
      results.push({
        type: "operations",
        title: "Cancellation activity detected",
        description: `${cancelled} quotations are marked as cancelled.`,
        metric: `${cancellationRate.toFixed(1)}% cancelled`,
      });
    }

    const customerMap = new Map<string, number>();

    filteredQuotations.forEach((quotation) => {
      if (!quotation.customer_id) {
        return;
      }

      customerMap.set(
        quotation.customer_id,
        (customerMap.get(quotation.customer_id) ?? 0) + 1,
      );
    });

    const returningCustomers = Array.from(
      customerMap.values(),
    ).filter((count) => count > 1).length;

    if (returningCustomers > 0) {
      results.push({
        type: "customer",
        title: "Returning customer activity",
        description: `${returningCustomers} customer${returningCustomers === 1 ? "" : "s"} submitted more than one quotation within the selected period.`,
        metric: `${returningCustomers} returning`,
      });
    }

    const productDemand = new Map<
      string,
      { name: string; quantity: number }
    >();

    filteredQuotations.forEach((quotation) => {
      quotation.quotation_items.forEach((item) => {
        const key =
          item.product_id ?? item.product_name ?? "unknown";
        const existing = productDemand.get(key);

        if (existing) {
          existing.quantity += Number(item.quantity ?? 0);
        } else {
          productDemand.set(key, {
            name: item.product_name ?? "Unknown product",
            quantity: Number(item.quantity ?? 0),
          });
        }
      });
    });

    const topProduct = Array.from(productDemand.values()).sort(
      (a, b) => b.quantity - a.quantity,
    )[0];

    if (topProduct) {
      results.push({
        type: "product",
        title: "Highest product demand",
        description: `${topProduct.name} has the highest requested quantity in the current filtered dataset.`,
        metric: `${topProduct.quantity} units`,
      });
    }

    const vehicleDemand = new Map<string, number>();

    filteredQuotations.forEach((quotation) => {
      if (!quotation.vehicle_make) {
        return;
      }

      vehicleDemand.set(
        quotation.vehicle_make,
        (vehicleDemand.get(quotation.vehicle_make) ?? 0) + 1,
      );
    });

    const topVehicle = Array.from(vehicleDemand.entries()).sort(
      (a, b) => b[1] - a[1],
    )[0];

    if (topVehicle) {
      results.push({
        type: "vehicle",
        title: "Most requested vehicle make",
        description: `${topVehicle[0]} appears in ${topVehicle[1]} filtered quotation${topVehicle[1] === 1 ? "" : "s"}.`,
        metric: `${topVehicle[1]} quotations`,
      });
    }

    if (total >= 5) {
      results.push({
        type: "demand",
        title: "Quotation activity",
        description: `${total} quotations are included in the current analysis.`,
        metric: `${total} quotations`,
      });
    }

    const totalProductQuantity = Array.from(
      productDemand.values(),
    ).reduce((sum, product) => sum + product.quantity, 0);

    if (topProduct && totalProductQuantity > 0) {
      const concentration =
        (topProduct.quantity / totalProductQuantity) * 100;

      if (concentration >= 40) {
        results.push({
          type: "product",
          title: "Product demand concentration",
          description: `${topProduct.name} accounts for ${concentration.toFixed(1)}% of all requested product units in the current dataset.`,
          metric: `${concentration.toFixed(1)}%`,
        });
      }
    }

    if (pending + reviewing > 0) {
      const openRate = ((pending + reviewing) / total) * 100;

      results.push({
        type: "operations",
        title: "Open quotation pipeline",
        description: `${pending + reviewing} quotations are still in Pending or Reviewing status.`,
        metric: `${openRate.toFixed(1)}% open`,
      });
    }

    return results.slice(0, 6);
  }, [filteredQuotations]);

  const loading =
    quotationsQuery.isLoading ||
    customersQuery.isLoading ||
    productsQuery.isLoading ||
    categoriesQueryResult.isLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Loading business analytics...
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-slate-700" />

            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Analytics
            </h1>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Understand quotation demand, customers, products and business
            performance.
          </p>
        </div>

      </div>

      <div className="mb-6 rounded-2xl border bg-card p-5">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold">
              Analytics Filters
            </h2>

            <p className="text-sm text-muted-foreground">
              Refine the business data used across all analytics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {activeFilterCount} active
            </span>

            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-medium hover:underline"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Date Range
            </label>

            <select
              value={dateRange}
              onChange={(event) =>
                setDateRange(
                  event.target.value as DateRange,
                )
              }
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="year">Last 12 months</option>
              <option value="all">All time</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Status
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="All">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Reviewing">Reviewing</option>
              <option value="Quoted">Quoted</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Vehicle Make
            </label>

            <select
              value={vehicleFilter}
              onChange={(event) =>
                setVehicleFilter(event.target.value)
              }
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="All">All vehicle makes</option>
              {vehicleMakes.map((make) => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Category
            </label>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="All">All categories</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Product
            </label>

            <select
              value={productFilter}
              onChange={(event) =>
                setProductFilter(event.target.value)
              }
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="All">All products</option>
              {productOptions.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filteredQuotations.length}
            </span>{" "}
            quotations
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Quotations"
          value={analytics.totalQuotations}
          icon={<FileText className="h-5 w-5" />}
        />

        <MetricCard
          title="Quotation Value"
          value={`KES ${analytics.quotationValue.toLocaleString()}`}
          icon={<TrendingUp className="h-5 w-5" />}
        />

        <MetricCard
          title="Customers"
          value={customers.length}
          icon={<Users className="h-5 w-5" />}
        />

        <MetricCard
          title="Products"
          value={products.length}
          icon={<Package className="h-5 w-5" />}
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Quotation Trend
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Quotation volume and requested value over the selected period.
          </p>
        </div>

        <div className="h-[340px] w-full">
          {analytics.quotationTrend.length === 0 ? (
            <EmptyState message="No quotation activity available for this period." />
          ) : (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={analytics.quotationTrend}
                margin={{
                  top: 10,
                  right: 20,
                  left: 10,
                  bottom: 10,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis
                  yAxisId="left"
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "value") {
                      return [
                        `KES ${Number(value).toLocaleString()}`,
                        "Requested Value",
                      ];
                    }

                    return [value, "Quotations"];
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="quotations"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="value"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Status Distribution
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current quotation workflow distribution.
            </p>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.statusDistribution}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 10,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <AnalysisPanel
          title="Performance Summary"
          description="Key workflow indicators for the selected period."
        >
          <div className="space-y-5">
            <PerformanceRow
              label="Pending"
              value={analytics.pending}
              total={analytics.totalQuotations}
            />
            <PerformanceRow
              label="Reviewing"
              value={analytics.reviewing}
              total={analytics.totalQuotations}
            />
            <PerformanceRow
              label="Quoted"
              value={analytics.quoted}
              total={analytics.totalQuotations}
            />
            <PerformanceRow
              label="Completed"
              value={analytics.completed}
              total={analytics.totalQuotations}
            />
            <PerformanceRow
              label="Cancelled"
              value={analytics.cancelled}
              total={analytics.totalQuotations}
            />
          </div>
        </AnalysisPanel>
      </section>

      {/* Performance */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Quotation Performance
          </h2>

          <p className="text-sm text-slate-500">
            Current workflow distribution for the selected period.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Pending"
            value={analytics.pending}
            icon={<Clock3 className="h-4 w-4" />}
          />

          <StatCard
            label="Reviewing"
            value={analytics.reviewing}
            icon={<BarChart3 className="h-4 w-4" />}
          />

          <StatCard
            label="Quoted"
            value={analytics.quoted}
            icon={<FileText className="h-4 w-4" />}
          />

          <StatCard
            label="Completed"
            value={analytics.completed}
            icon={<CheckCircle2 className="h-4 w-4" />}
          />

          <StatCard
            label="Cancelled"
            value={analytics.cancelled}
            icon={<XCircle className="h-4 w-4" />}
          />
        </div>
      </section>

      {/* Business indicators */}
      <section className="grid gap-4 lg:grid-cols-3">
        <InsightCard
          title="Average quotation value"
          value={`KES ${Math.round(
            analytics.averageQuotationValue,
          ).toLocaleString()}`}
          description="Average value of quotation requests in the selected period."
        />

        <InsightCard
          title="Completion rate"
          value={`${analytics.completionRate.toFixed(1)}%`}
          description="Percentage of quotation requests completed."
        />

        <InsightCard
          title="Cancellation rate"
          value={`${analytics.cancellationRate.toFixed(1)}%`}
          description="Percentage of quotation requests cancelled."
        />
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Customer Analytics
          </h2>

          <p className="text-sm text-slate-500">
            Customer activity and repeat quotation behavior for the selected period.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Active Customers"
            value={analytics.activeCustomers}
            icon={<Users className="h-5 w-5" />}
          />

          <MetricCard
            title="New Customers"
            value={analytics.newCustomers}
            icon={<Users className="h-5 w-5" />}
          />

          <MetricCard
            title="Returning Customers"
            value={analytics.returningCustomers}
            icon={<TrendingUp className="h-5 w-5" />}
          />

          <MetricCard
            title="Repeat Customer Rate"
            value={`${analytics.repeatCustomerRate.toFixed(1)}%`}
            icon={<BarChart3 className="h-5 w-5" />}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <InsightCard
          title="Average quotations per customer"
          value={analytics.averageQuotationsPerCustomer.toFixed(2)}
          description="Average number of quotation requests generated by each active customer."
        />

        <InsightCard
          title="Customer quotation value"
          value={`KES ${analytics.customerValue.toLocaleString()}`}
          description="Total requested quotation value associated with active customers."
        />

        <InsightCard
          title="Returning customer share"
          value={`${analytics.repeatCustomerRate.toFixed(1)}%`}
          description="Share of active customers who submitted more than one quotation."
        />
      </section>

      <section>
        <AnalysisPanel
          title="Customer Activity"
          description="Customers ranked by quotation activity during the selected period."
        >
          {analytics.customerActivity.length === 0 ? (
            <EmptyState message="No customer activity available for this period." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 pr-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Customer
                    </th>
                    <th className="pb-3 pr-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Phone
                    </th>
                    <th className="pb-3 pr-6 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Quotations
                    </th>
                    <th className="pb-3 pr-6 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Completed
                    </th>
                    <th className="pb-3 pr-6 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Cancelled
                    </th>
                    <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Value
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {analytics.customerActivity
                    .slice(0, 20)
                    .map((customer) => (
                      <tr
                        key={customer.customerId}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-4 pr-6">
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {customer.name}
                            </p>

                            {customer.quotations > 1 && (
                              <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                Returning
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 pr-6 text-sm text-slate-600">
                          {customer.phone}
                        </td>

                        <td className="py-4 pr-6 text-right text-sm font-semibold text-slate-900">
                          {customer.quotations}
                        </td>

                        <td className="py-4 pr-6 text-right text-sm text-slate-700">
                          {customer.completed}
                        </td>

                        <td className="py-4 pr-6 text-right text-sm text-slate-700">
                          {customer.cancelled}
                        </td>

                        <td className="py-4 text-right text-sm font-semibold text-slate-900">
                          KES {customer.value.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </AnalysisPanel>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Product Intelligence
          </h2>

          <p className="text-sm text-slate-500">
            Understand product demand, quotation activity and requested value.
          </p>
        </div>

        <AnalysisPanel
          title="Product Demand"
          description="Products ranked by requested quantity."
        >
          {analytics.productAnalytics.length === 0 ? (
            <EmptyState message="No product demand data available." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 pr-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Product
                    </th>
                    <th className="pb-3 pr-6 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Quantity
                    </th>
                    <th className="pb-3 pr-6 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Quotations
                    </th>
                    <th className="pb-3 pr-6 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Avg. Price
                    </th>
                    <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Requested Value
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {analytics.productAnalytics
                    .slice(0, 20)
                    .map((product) => (
                      <tr
                        key={product.productId ?? product.name}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-4 pr-6">
                          <p className="text-sm font-medium text-slate-900">
                            {product.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {product.categoryName}
                          </p>
                        </td>

                        <td className="py-4 pr-6 text-right text-sm font-semibold text-slate-900">
                          {product.quantity}
                        </td>

                        <td className="py-4 pr-6 text-right text-sm text-slate-700">
                          {product.quotationCount}
                        </td>

                        <td className="py-4 pr-6 text-right text-sm text-slate-700">
                          {product.averagePrice > 0
                            ? `KES ${Math.round(
                                product.averagePrice,
                              ).toLocaleString()}`
                            : "Not priced"}
                        </td>

                        <td className="py-4 text-right text-sm font-semibold text-slate-900">
                          KES {product.value.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </AnalysisPanel>
      </section>

      <section>
        <AnalysisPanel
          title="Category Performance"
          description="Demand and requested value grouped by product category."
        >
          {analytics.categoryAnalytics.length === 0 ? (
            <EmptyState message="No category demand data available." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {analytics.categoryAnalytics.map((category) => (
                <div
                  key={category.categoryId}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {category.categoryName}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {category.products} products
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {category.quantity} requested
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">
                        Quotations
                      </p>

                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {category.quotations}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Requested value
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        KES {category.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AnalysisPanel>
      </section>

      {/* Product + vehicle analysis */}
      <section className="grid gap-6 lg:grid-cols-2">
        <AnalysisPanel
          title="Top Requested Products"
          description="Products receiving the highest requested quantities."
        >
          {analytics.topProducts.length === 0 ? (
            <EmptyState message="No product request data available." />
          ) : (
            <div className="space-y-4">
              {analytics.topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                      {index + 1}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {product.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        KES {product.value.toLocaleString()} requested value
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 text-sm font-semibold text-slate-900">
                    {product.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </AnalysisPanel>

        <AnalysisPanel
          title="Vehicle Demand"
          description="Quotation requests grouped by vehicle make."
        >
          {analytics.topVehicleMakes.length === 0 ? (
            <EmptyState message="No vehicle data available." />
          ) : (
            <div className="space-y-4">
              {analytics.topVehicleMakes
                .slice(0, 10)
                .map((vehicle) => (
                  <div
                    key={vehicle.name}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-slate-800">
                      {vehicle.name}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {vehicle.count} requests
                    </span>
                  </div>
                ))}
            </div>
          )}
        </AnalysisPanel>
      </section>

      <section>
        <AnalysisPanel
          title="Vehicle × Product Analysis"
          description="Understand which products are being requested for each vehicle make."
        >
          {analytics.vehicleProductAnalysis.length === 0 ? (
            <EmptyState message="No vehicle and product relationship data available." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 pr-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Vehicle Make
                    </th>

                    <th className="pb-3 pr-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Product
                    </th>

                    <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Quantity
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {analytics.vehicleProductAnalysis.map(
                    (vehicle) =>
                      vehicle.products.map(
                        (product, productIndex) => (
                          <tr
                            key={`${vehicle.vehicle}-${product.product}`}
                            className="border-b border-slate-100 last:border-0"
                          >
                            <td className="py-4 pr-6 text-sm font-medium text-slate-900">
                              {productIndex === 0
                                ? vehicle.vehicle
                                : ""}
                            </td>

                            <td className="py-4 pr-6 text-sm text-slate-700">
                              {product.product}
                            </td>

                            <td className="py-4 text-right text-sm font-semibold text-slate-900">
                              {product.quantity}
                            </td>
                          </tr>
                        ),
                      ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </AnalysisPanel>
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">
          {title}
        </span>

        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-sm">{label}</span>
      </div>

      <p className="mt-3 text-xl font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function PerformanceRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage =
    total > 0
      ? Math.min((value / total) * 100, 100)
      : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">
          {label}
        </span>

        <span className="text-sm font-semibold text-slate-900">
          {value}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-700 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-1 text-right text-xs text-slate-400">
        {percentage.toFixed(1)}%
      </p>
    </div>
  );
}

function InsightCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-semibold text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function AnalysisPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="font-semibold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}