import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  sort_order: number;
};

export type Product = {
  id: string;
  name: string;
  category_id: string | null;
  make: string | null;
  model: string | null;
  year_from: number | null;
  year_to: number | null;
  oem: string | null;
  condition: string;
  availability: string;
  price: number | null;
  description: string | null;
  image: string | null;
  gallery: string[];
  featured: boolean;
  created_at: string;
  updated_at: string;
};

async function unwrap<T>(promise: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: () =>
    unwrap<Category[]>(supabase.from("categories").select("*").order("sort_order") as never),
  staleTime: 5 * 60 * 1000,
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: () =>
    unwrap<Product[]>(
      supabase.from("products").select("*").order("created_at", { ascending: false }) as never,
    ),
  staleTime: 60 * 1000,
});

export const featuredProductsQuery = queryOptions({
  queryKey: ["products", "featured"],
  queryFn: () =>
    unwrap<Product[]>(
      supabase
        .from("products")
        .select("*")
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(8) as never,
    ),
  staleTime: 60 * 1000,
});

export function productQuery(id: string) {
  return queryOptions({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return (data as Product | null) ?? null;
    },
  });
}

export async function submitQuotation(input: {
  fullName: string;
  phone: string;
  email: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  message: string;
  items: { product_id: string; quantity: number }[];
}) {
  const { data, error } = await supabase.rpc("submit_quotation", {
    _full_name: input.fullName,
    _phone: input.phone,
    _email: input.email,
    _vehicle_make: input.vehicleMake,
    _vehicle_model: input.vehicleModel,
    _vehicle_year: input.vehicleYear,
    _message: input.message,
    _items: input.items,
  } as never);
  if (error) throw new Error(error.message);
  return data as unknown as string;
}
