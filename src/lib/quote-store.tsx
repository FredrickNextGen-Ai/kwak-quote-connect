import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

export type QuoteItem = {
  productId: string;
  name: string;
  image: string | null;
  vehicle: string;
  oem: string | null;
  price: number | null;
  quantity: number;
};

const STORAGE_KEY = "kwak-quote-basket";

type QuoteContextValue = {
  items: QuoteItem[];
  count: number;
  add: (item: Omit<QuoteItem, "quantity">, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  has: (productId: string) => boolean;
};

const QuoteContext = createContext<QuoteContextValue | null>(null);

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as QuoteItem[]);
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add = useCallback<QuoteContextValue["add"]>((item, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((i) => i.productId === item.productId);
      if (existing) {
        return current.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [...current, { ...item, quantity }];
    });
    toast.success("Added to Quote", { description: item.name });
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((current) => current.filter((i) => i.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) =>
      current.map((i) =>
        i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(999, quantity)) } : i,
      ),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<QuoteContextValue>(
    () => ({
      items,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      add,
      remove,
      setQuantity,
      clear,
      has: (productId: string) => items.some((i) => i.productId === productId),
    }),
    [items, add, remove, setQuantity, clear],
  );

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}

export function useQuote() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuote must be used inside QuoteProvider");
  return ctx;
}
