import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Product } from "./catalog";

type AdminProduct = Product & {
  categories: Pick<Category, "name"> | null;
};

export type Customer = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  created_at: string;
};

export type QuotationItem = {
  id: string;
  quotation_id: string;
  product_id: string | null;
  product_name: string | null;
  quantity: number;
  unit_price: number | null;
};

export type Quotation = {
  id: string;
  quotation_number: string;
  status: string;
  message: string | null;
  admin_notes: string | null;
  discount: number;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: string | null;
  created_at: string;
  customer_id: string | null;
  customers: Customer | null;
  quotation_items: QuotationItem[];
};

async function unwrap<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export const adminQuotationsQuery = queryOptions({
  queryKey: ["admin", "quotations"],
  queryFn: () =>
    unwrap<Quotation[]>(
      supabase
        .from("quotations")
        .select("*, customers(*), quotation_items(*)")
        .order("created_at", { ascending: false }) as never,
    ),
});

export const adminCustomersQuery = queryOptions({
  queryKey: ["admin", "customers"],
  queryFn: () =>
    unwrap<Customer[]>(
      supabase.from("customers").select("*").order("created_at", { ascending: false }) as never,
    ),
});

export const adminProductsQuery = queryOptions({
  queryKey: ["admin", "products"],
  queryFn: () =>
    unwrap<AdminProduct[]>(
      supabase
        .from("products")
        .select("*, categories(name)")
        .order("created_at", { ascending: false }) as never,
    ),
});

export async function updateQuotationStatus(id: string, status: string) {
  const { data, error } = await supabase.rpc(
    "update_quotation_status",
    {
      _quotation_id: id,
      _status: status,
    } as never,
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Quotation status update returned no data.");
  }

  return data;
}

export async function updateQuotation(
  id: string,
  input: {
    status?: string;
    admin_notes?: string | null;
    discount?: number;
  },
) {
  const payload = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("quotations")
    .update(payload as never)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function upsertProduct(input: Partial<Product> & { name: string }) {
  const payload = { ...input } as never;
  const { error } = input.id
    ? await supabase.from("products").update(payload).eq("id", input.id)
    : await supabase.from("products").insert(payload);
  if (error) throw new Error(error.message);
}
