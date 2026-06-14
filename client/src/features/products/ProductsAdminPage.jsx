import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ImagePlus, Plus, Package, Search, X } from "lucide-react";
import { productsApi } from "../../api/products.api";
import { categoriesApi } from "../../api/categories.api";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Button } from "../../components/common/Button";
import { Input, Textarea } from "../../components/common/Input";
import { Select } from "../../components/common/Select";
import { ColorInput } from "../../components/common/Toggle";
import { Modal } from "../../components/common/Modal";
import { Card } from "../../components/common/Card";
import { EmptyState } from "../../components/common/EmptyState";
import { PageToolbar, SearchInput } from "../../components/common/SearchInput";
import { CardSkeleton } from "../../components/common/Skeletons";
import { formatCurrency } from "../../utils/formatters";
import { useCategories, getCategoryColor } from "../../context/CategoryContext";
import { resolveProductImage, searchUnsplashPhotos } from "../../utils/unsplash";
import { useDebounce } from "../../hooks/useDebounce";
import { ProductImage } from "../../components/pos/ProductImage";

const empty = { name: "", price: "", categoryId: "", taxRate: "5", description: "", imageUrl: "" };
const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23ebe4d8' width='80' height='80'/%3E%3C/svg%3E";

export default function ProductsAdminPage() {
  const queryClient = useQueryClient();
  const { categories, colorMap } = useCategories();
  const [open, setOpen] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [newCat, setNewCat] = useState({ name: "", color: "#6B7280" });
  const [unsplashQuery, setUnsplashQuery] = useState("");
  const [unsplashResults, setUnsplashResults] = useState([]);
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const debouncedUnsplash = useDebounce(unsplashQuery, 400);

  const { data, isLoading } = useQuery({
    queryKey: ["products", search, categoryFilter],
    queryFn: () =>
      productsApi.list({
        limit: 100,
        search: search || undefined,
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
      }),
  });

  const products = data?.data || [];

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        price: Number(form.price),
        categoryId: form.categoryId || null,
        taxRate: Number(form.taxRate),
        description: form.description,
        image: imageFile,
        imageUrl: !imageFile && imagePreview && !imagePreview.startsWith("blob:") ? imagePreview : form.imageUrl || undefined,
      };
      return editId ? productsApi.update(editId, payload) : productsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(editId ? "Product updated" : "Product created");
      closeModal();
    },
    onError: (err) => toast.error(err.userMessage),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
    },
    onError: (err) => toast.error(err.userMessage),
  });

  const createCatMutation = useMutation({
    mutationFn: () => categoriesApi.create(newCat),
    onSuccess: (cat) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setForm((f) => ({ ...f, categoryId: cat.id }));
      setCatModal(false);
      toast.success("Category created");
    },
    onError: (err) => toast.error(err.userMessage),
  });

  const closeModal = () => {
    setOpen(false);
    setForm(empty);
    setEditId(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const openEdit = (p) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      price: p.price,
      categoryId: p.category_id || "",
      taxRate: String(p.tax_rate),
      description: p.description || "",
    });
    setImagePreview(p.image_url || null);
    setImageFile(null);
    setOpen(true);
  };

  const onImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    if (!open || !debouncedUnsplash.trim()) {
      setUnsplashResults([]);
      return;
    }
    let cancelled = false;
    setUnsplashLoading(true);
    searchUnsplashPhotos(debouncedUnsplash).then((results) => {
      if (!cancelled) {
        setUnsplashResults(results);
        setUnsplashLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [debouncedUnsplash, open]);

  const selectUnsplash = (url) => {
    setImageFile(null);
    setImagePreview(url);
    setForm((f) => ({ ...f, imageUrl: url }));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm((f) => ({ ...f, imageUrl: "" }));
  };

  return (
    <AdminLayout
      title="Products"
    >
      <PageToolbar>
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="min-w-[200px] flex-1 max-w-xs" />
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="!w-auto min-w-[160px]">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </PageToolbar>

      {isLoading ? (
        <CardSkeleton count={6} />
      ) : products.length === 0 ? (
        <EmptyState icon={Package} title="No products" description="Add your first menu item to get started." action={<Button onClick={() => setOpen(true)}>Add product</Button>} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <Card key={p.id} padding="none" accentColor={getCategoryColor(colorMap, p.category_id, p.category_color)} className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="aspect-[4/3] overflow-hidden bg-bg-sunken">
                  <ProductImage
                    src={p.image_url}
                    name={p.name}
                    color={getCategoryColor(colorMap, p.category_id, p.category_color)}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="text-sm text-text-muted">{p.category_name}</p>
                  <p className="mt-1 font-display text-lg text-accent-primary">{formatCurrency(p.price)}</p>
                  {p.description && <p className="mt-1 line-clamp-2 text-xs text-text-muted">{p.description}</p>}
                </div>
                <div className="flex gap-2 border-t border-border-subtle bg-bg-base px-4 py-3">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEdit(p)}>Edit</Button>
                  <Button variant="danger" size="sm" onClick={() => deleteMutation.mutate(p.id)}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
          <div className="flex justify-center pt-2">
            <Button icon={Plus} onClick={() => { setEditId(null); setForm(empty); setImagePreview(null); setImageFile(null); setOpen(true); }}>Add product</Button>
          </div>
        </div>
      )}

      <Modal open={open} onClose={closeModal} title={editId ? "Edit product" : "New product"} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium">Product image</label>
            <div className="flex flex-wrap items-start gap-4">
              <div className="relative">
                <img src={imagePreview || PLACEHOLDER} alt="" className="h-28 w-28 rounded-xl object-cover bg-bg-sunken" />
                {imagePreview && (
                  <button type="button" onClick={clearImage} className="absolute -right-2 -top-2 rounded-full bg-accent-danger p-1 text-white">
                    <X size={14} />
                  </button>
                )}
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-border-subtle px-4 py-3 text-sm font-medium hover:border-accent-primary hover:text-accent-primary">
                <ImagePlus size={18} />
                Upload photo
                <input type="file" accept="image/*" className="hidden" onChange={onImageChange} />
              </label>
            </div>
            <div className="mt-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={unsplashQuery}
                  onChange={(e) => setUnsplashQuery(e.target.value)}
                  placeholder="Search Unsplash for stock photos…"
                  className="w-full rounded-lg border border-border-subtle bg-bg-elevated py-2 pl-9 pr-3 text-sm"
                />
              </div>
              {!import.meta.env.VITE_UNSPLASH_ACCESS_KEY && (
                <p className="mt-1 text-xs text-text-muted">Set VITE_UNSPLASH_ACCESS_KEY for Unsplash search.</p>
              )}
              {unsplashLoading && <p className="mt-2 text-xs text-text-muted">Searching…</p>}
              {unsplashResults.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {unsplashResults.map((photo) => (
                    <button key={photo.id} type="button" onClick={() => selectUnsplash(photo.url)} className="overflow-hidden rounded-lg ring-2 ring-transparent hover:ring-accent-primary">
                      <img src={photo.thumb} alt={photo.alt} className="aspect-square w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <div>
            <div className="flex gap-2">
              <Select label="Category" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="flex-1">
                <option value="">None</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              <Button variant="secondary" className="mt-7" onClick={() => setCatModal(true)}>+</Button>
            </div>
          </div>
          <Input label="Tax %" type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Shown on POS menu cards" className="sm:col-span-2" />
        </div>
        <Button className="mt-6 w-full" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save product</Button>
      </Modal>

      <Modal open={catModal} onClose={() => setCatModal(false)} title="New category">
        <div className="space-y-4">
          <Input label="Name" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} />
          <ColorInput label="Color" value={newCat.color} onChange={(e) => setNewCat({ ...newCat, color: e.target.value })} />
        </div>
        <Button className="mt-6 w-full" onClick={() => createCatMutation.mutate()}>Create</Button>
      </Modal>
    </AdminLayout>
  );
}
