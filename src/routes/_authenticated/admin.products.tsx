import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { adminProductsQuery, deleteProduct, upsertProduct } from "@/lib/admin";
import { categoriesQuery, type Product } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadProductImage } from "@/lib/product-images";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AVAILABILITIES, CONDITIONS, formatPrice } from "@/lib/site-config";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: ProductsPage,
});

const IMAGES = [
  "/images/part-brakes.jpg",
  "/images/part-engine.jpg",
  "/images/part-suspension.jpg",
  "/images/part-electrical.jpg",
  "/images/part-filters.jpg",
  "/images/part-cooling.jpg",
  "/images/part-transmission.jpg",
  "/images/part-body.jpg",
  "/images/part-steering.jpg",
  "/images/part-accessories.jpg",
];

type Draft = {
  id?: string;
  name: string;
  category_id: string;
  make: string;
  model: string;
  oem: string;
  condition: string;
  availability: string;
  price: string;
  image: string;
  description: string;
  featured: boolean;
};

const EMPTY: Draft = {
  name: "",
  category_id: "",
  make: "",
  model: "",
  oem: "",
  condition: "New",
  availability: "Available",
  price: "",
  image: "",
  description: "",
  featured: false,
};

function toDraft(p: Product): Draft {
  return {
    id: p.id,
    name: p.name,
    category_id: p.category_id ?? "",
    make: p.make ?? "",
    model: p.model ?? "",
    oem: p.oem ?? "",
    condition: p.condition,
    availability: p.availability,
    price: p.price === null ? "" : String(p.price),
    image: p.image ?? "",
    description: p.description ?? "",
    featured: p.featured,
  };
}

function ProductsPage() {
  const qc = useQueryClient();
  const products = useQuery(adminProductsQuery);
  const categories = useQuery(categoriesQuery);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(file: File) {
    try {
      setUploadingImage(true);

      const imageUrl = await uploadProductImage(file);

      setDraft((current) => ({
        ...current,
        image: imageUrl,
      }));

      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Image upload failed", {
        description:
          error instanceof Error
            ? error.message
            : "Could not upload image.",
      });
    } finally {
      setUploadingImage(false);
    }
  }

  const save = useMutation({
    mutationFn: (d: Draft) =>
      upsertProduct({
        ...(d.id ? { id: d.id } : {}),
        name: d.name,
        category_id: d.category_id || null,
        make: d.make || null,
        model: d.model || null,
        oem: d.oem || null,
        condition: d.condition,
        availability: d.availability,
        price: d.price ? Number(d.price) : null,
        image: d.image || null,
        description: d.description || null,
        featured: d.featured,
      }),
    onSuccess: () => {
      toast.success("Product saved");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error("Could not save", { description: e.message }),
  });

  const remove = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error("Could not delete", { description: e.message }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Products</h1>
        <Button
          size="sm"
          className="rounded-full"
          onClick={() => {
            setDraft(EMPTY);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> New product
        </Button>
      </div>

      {products.isLoading && <Skeleton className="h-48 w-full" />}

      <div className="grid gap-3 md:grid-cols-2">
        {(products.data ?? []).map((p) => (
          <div key={p.id} className="surface-card flex items-center gap-3 p-3">
            <img
              src={p.image ?? IMAGES[0]!}
              alt={p.name}
              loading="lazy"
              className="size-16 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{p.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {[p.make, p.model].filter(Boolean).join(" ") || "Universal"} ·{" "}
                {formatPrice(p.price)}
              </p>
            </div>
            <Button
              size="icon"
              variant="outline"
              className="rounded-full"
              aria-label={`Edit ${p.name}`}
              onClick={() => {
                setDraft(toDraft(p));
                setOpen(true);
              }}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="rounded-full"
              aria-label={`Delete ${p.name}`}
              onClick={() => remove.mutate(p.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit product" : "New product"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={draft.category_id}
                onValueChange={(v) => setDraft({ ...draft, category_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {(categories.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  value={draft.make}
                  onChange={(e) => setDraft({ ...draft, make: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={draft.model}
                  onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="oem">OEM number</Label>
                <Input
                  id="oem"
                  value={draft.oem}
                  onChange={(e) => setDraft({ ...draft, oem: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">Price (KES)</Label>
                <Input
                  id="price"
                  inputMode="numeric"
                  value={draft.price}
                  onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Condition</Label>
                <Select
                  value={draft.condition}
                  onValueChange={(v) => setDraft({ ...draft, condition: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Availability</Label>
                <Select
                  value={draft.availability}
                  onValueChange={(v) => setDraft({ ...draft, availability: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABILITIES.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Product image</Label>

              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                  {draft.image ? (
                    <div className="relative">
                      <img
                        src={draft.image}
                        alt="Product preview"
                        className="h-40 w-40 rounded-xl object-cover shadow-sm"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            image: "",
                          }))
                        }
                        className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full bg-white shadow-md"
                        aria-label="Remove image"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex size-40 items-center justify-center rounded-xl bg-slate-100">
                      <ImageIcon className="size-10 text-slate-400" />
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium">
                      {draft.image
                        ? "Change product image"
                        : "Upload product image"}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      JPG, PNG or WEBP · Maximum 5 MB
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (file) {
                        handleImageUpload(file);
                      }

                      event.target.value = "";
                    }}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    disabled={uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="size-4" />

                    {uploadingImage
                      ? "Uploading..."
                      : draft.image
                        ? "Change image"
                        : "Choose image"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
              />
              Show on the home page
            </label>
          </div>

          <DialogFooter>
            <Button
              className="rounded-full"
              disabled={!draft.name || save.isPending}
              onClick={() => save.mutate(draft)}
            >
              {save.isPending ? "Saving…" : "Save product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
