import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuote } from "@/lib/quote-store";
import { submitQuotation } from "@/lib/catalog";
import { formatPrice, whatsappLink } from "@/lib/site-config";

export const Route = createFileRoute("/quote")({
  head: () => ({
    meta: [
      { title: "Request a Quotation — KWAK AUTO SPARE" },
      {
        name: "description",
        content:
          "Review your selected spare parts, add your vehicle details and send a quotation request.",
      },
      { property: "og:title", content: "Request a Quotation — KWAK AUTO SPARE" },
      {
        property: "og:description",
        content: "Send your spare parts list and get a quotation.",
      },
    ],
  }),
  component: QuotePage,
});

function QuotePage() {
  const { items, setQuantity, remove, clear } = useQuote();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const set =
    (key: keyof typeof form) =>
    (e: { target: { value: string } }) => {
      setForm((current) => ({
        ...current,
        [key]: e.target.value,
      }));
    };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.fullName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }

    if (!form.phone.trim()) {
      toast.error("Please enter your phone number.");
      return;
    }

    if (items.length === 0) {
      toast.error("Your quotation list is empty.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await submitQuotation({
        ...form,
        items: items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
        })),
      });

      setReference(result.quotation_number);

      clear();
    } catch (error) {
      toast.error("Could not send your quotation request.", {
        description:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (reference) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
          <div className="surface-card p-8 text-center sm:p-10">
            <CheckCircle2 className="mx-auto size-14 text-success" />

            <p className="mt-6 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Request received
            </p>

            <h1 className="mt-2 font-display text-3xl font-bold">
              Quotation request sent
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
              Thank you for your request. Our team will review your selected
              spare parts and get back to you with pricing and availability.
            </p>

            <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-border bg-muted/40 p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Quotation reference
              </p>

              <p className="mt-2 font-mono text-xl font-bold tracking-wide">
                {reference}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                Keep this reference when contacting KWAK AUTO SPARE about
                your request.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild className="rounded-full">
                <Link to="/parts">Continue browsing</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="rounded-full"
              >
                <a
                  href={whatsappLink(
                    `Hello KWAK AUTO SPARE, I just submitted quotation request ${reference}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Follow up on WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold">
          Your quotation request
        </h1>

        {items.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="Your quote basket is empty"
              description="Add spare parts from the catalogue and they'll show up here."
              action={
                <Button asChild className="rounded-full">
                  <Link to="/parts">Browse spare parts</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="surface-card flex gap-3 p-3"
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="size-20 rounded-lg object-cover"
                    />
                  )}

                  <div className="flex-1">
                    <p className="font-semibold leading-snug">
                      {item.name}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {item.vehicle || "Universal fit"}
                      {item.oem ? ` · OEM ${item.oem}` : ""}
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button
                      type="button"
                      onClick={() => remove(item.productId)}
                      aria-label={`Remove ${item.name}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>

                    <div className="flex items-center gap-1 rounded-full border border-border">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-full"
                        aria-label="Decrease quantity"
                        onClick={() =>
                          setQuantity(
                            item.productId,
                            item.quantity - 1
                          )
                        }
                      >
                        <Minus className="size-3.5" />
                      </Button>

                      <span className="w-6 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>

                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-full"
                        aria-label="Increase quantity"
                        onClick={() =>
                          setQuantity(
                            item.productId,
                            item.quantity + 1
                          )
                        }
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <form
              onSubmit={handleSubmit}
              className="surface-card space-y-4 p-5"
            >
              <div>
                <h2 className="font-display text-lg font-semibold">
                  Your details
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Tell us about your vehicle and how we can help.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Full name *"
                  value={form.fullName}
                  onChange={set("fullName")}
                />

                <Field
                  label="Phone *"
                  value={form.phone}
                  onChange={set("phone")}
                  type="tel"
                />

                <Field
                  label="Email"
                  value={form.email}
                  onChange={set("email")}
                  type="email"
                />

                <Field
                  label="Vehicle make"
                  value={form.vehicleMake}
                  onChange={set("vehicleMake")}
                />

                <Field
                  label="Vehicle model"
                  value={form.vehicleModel}
                  onChange={set("vehicleModel")}
                />

                <Field
                  label="Year"
                  value={form.vehicleYear}
                  onChange={set("vehicleYear")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message">Notes</Label>

                <Textarea
                  id="message"
                  rows={4}
                  value={form.message}
                  onChange={set("message")}
                  placeholder="Anything else we should know?"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full rounded-full"
                disabled={submitting}
              >
                {submitting
                  ? "Sending…"
                  : "Send quotation request"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z]/g, "");

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>

      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}