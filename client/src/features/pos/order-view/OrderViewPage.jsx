import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { MapPin } from "lucide-react";
import { productsApi } from "../../../api/products.api";
import { ordersApi } from "../../../api/orders.api";
import { sessionsApi } from "../../../api/sessions.api";
import { reportsApi } from "../../../api/config.api";
import { usePos } from "../../../context/PosContext";
import { useCategories, getCategoryColor } from "../../../context/CategoryContext";
import { useDebounce } from "../../../hooks/useDebounce";
import { PosLayout } from "../../../components/layout/PosLayout";
import { Button } from "../../../components/common/Button";
import { Input } from "../../../components/common/Input";
import { SearchInput } from "../../../components/common/SearchInput";
import { CardSkeleton } from "../../../components/common/Skeletons";
import { ProductCard } from "../../../components/pos/ProductCard";
import { CategoryCard } from "../../../components/pos/CategoryCard";
import { CartPanel } from "../../../components/pos/CartPanel";
import { FloorPopup } from "../floor-popup/FloorPopup";
import { Modal } from "../../../components/common/Modal";
import { couponsApi } from "../../../api/config.api";

export default function OrderViewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { categories, colorMap } = useCategories();
  const {
    cart, addToCart, updateQty, selectedTable, couponCode, setCouponCode,
    customerId, editingOrderId, clearCart, setEditingOrderId, note, tipAmount,
  } = usePos();

  useEffect(() => {
    if (!selectedTable?.id && !editingOrderId) {
      toast("Please select a table from the floor plan to start an order.", { icon: "📍" });
      navigate("/pos/tables", { replace: true });
    }
  }, [selectedTable, editingOrderId, navigate]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [floorOpen, setFloorOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [couponInput, setCouponInput] = useState(couponCode);

  const debouncedSearch = useDebounce(search);

  const { data: session } = useQuery({
    queryKey: ["session", "current"],
    queryFn: sessionsApi.current,
  });

  const { data: orderStatus } = useQuery({
    queryKey: ["reports", "order-status"],
    queryFn: reportsApi.orderStatus,
    refetchInterval: 30_000,
  });

  const todayOrderCount = useMemo(() => {
    if (!orderStatus?.byStatus) return 0;
    return Object.values(orderStatus.byStatus).reduce((s, n) => s + Number(n), 0);
  }, [orderStatus]);

  const { data: catalogData } = useQuery({
    queryKey: ["products", "catalog"],
    queryFn: () => productsApi.list({ limit: 100 }),
  });

  const categoryMeta = useMemo(() => {
    const counts = {};
    const images = {};
    for (const p of catalogData?.data || []) {
      const cid = p.category_id || "none";
      counts[cid] = (counts[cid] || 0) + 1;
      if (!images[cid] && p.image_url) images[cid] = p.image_url;
    }
    return { counts, images };
  }, [catalogData]);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", debouncedSearch, categoryFilter],
    queryFn: () =>
      productsApi.list({
        search: debouncedSearch || undefined,
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
        limit: 50,
      }),
  });

  const products = productsData?.data || [];

  const { data: preview, isFetching: previewLoading } = useQuery({
    queryKey: ["order-preview", cart, couponCode, tipAmount],
    queryFn: () =>
      ordersApi.preview({
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, note: i.note || null })),
        couponCode: couponCode || null,
        tipAmount: Number(tipAmount) || 0,
      }),
    enabled: cart.length > 0,
    staleTime: 500,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!session?.id) throw new Error("No open session");
      const payload = {
        sessionId: session.id,
        tableId: selectedTable?.id || null,
        customerId,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, note: i.note || null })),
        couponCode: couponCode || null,
        note: note || null,
        tipAmount: Number(tipAmount) || 0,
      };
      if (editingOrderId) return ordersApi.update(editingOrderId, payload);
      return ordersApi.create(payload);
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast.success(editingOrderId ? "Order updated" : "Order saved");
      clearCart();
      setEditingOrderId(null);
      navigate(`/pos/payment/${order.id}`);
    },
    onError: (err) => toast.error(err.userMessage || err.message),
  });

  const applyCoupon = async () => {
    const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    try {
      const result = await couponsApi.validate({ code: couponInput, orderTotal: subtotal });
      setCouponCode(couponInput);
      setDiscountOpen(false);
      toast.success(`Coupon applied — saved ${result.discountAmount ?? ""}`);
    } catch (err) {
      toast.error(err.userMessage);
    }
  };

  const totalProducts = catalogData?.data?.length ?? 0;

  return (
    <PosLayout
      headerVariant="order"
      orderCount={todayOrderCount}
      tableLabel={selectedTable ? `Table ${selectedTable.table_number}` : null}
      searchSlot={
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search menu…"
          className="w-full"
        />
      }
    >
      <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
        <div className="flex-1 p-4 lg:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-text-muted">
              <span className="font-medium text-brand-espresso">{products.length}</span>
              {categoryFilter !== "all" ? " in category" : ` of ${totalProducts} items`}
            </p>
            <Button variant="secondary" size="sm" icon={MapPin} onClick={() => setFloorOpen(true)}>
              {selectedTable ? `Table ${selectedTable.table_number}` : "Select table"}
            </Button>
          </div>

          <div className="mb-6 flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            <CategoryCard
              label="All"
              count={totalProducts}
              active={categoryFilter === "all"}
              onClick={() => setCategoryFilter("all")}
            />
            {categories.map((c) => (
              <CategoryCard
                key={c.id}
                label={c.name}
                count={categoryMeta.counts[c.id] || 0}
                color={c.color}
                imageUrl={categoryMeta.images[c.id]}
                active={categoryFilter === c.id}
                onClick={() => setCategoryFilter(c.id)}
              />
            ))}
          </div>

          {isLoading ? (
            <CardSkeleton count={8} />
          ) : products.length === 0 ? (
            <p className="py-16 text-center text-text-muted">No products found</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  color={getCategoryColor(colorMap, p.category_id, p.category_color)}
                  onAdd={addToCart}
                />
              ))}
            </div>
          )}
        </div>

        <CartPanel
          cart={cart}
          updateQty={updateQty}
          couponCode={couponCode}
          onRemoveCoupon={() => setCouponCode("")}
          onOpenDiscount={() => { setCouponInput(couponCode); setDiscountOpen(true); }}
          preview={preview}
          previewLoading={previewLoading}
          onSave={() => {
            if (!selectedTable?.id) {
              setFloorOpen(true);
              toast.error("Please select a table to proceed.");
              return;
            }
            saveMutation.mutate();
          }}
          savePending={saveMutation.isPending}
          editingOrderId={editingOrderId}
          selectedTable={selectedTable}
        />
      </div>

      <FloorPopup open={floorOpen} onClose={() => setFloorOpen(false)} />

      <Modal open={discountOpen} onClose={() => setDiscountOpen(false)} title="Apply coupon">
        <p className="mb-4 text-sm text-text-muted">Enter a valid coupon code. Savings appear in your cart immediately.</p>
        <Input
          label="Coupon code"
          value={couponInput}
          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
          placeholder="SAVE10"
        />
        <Button className="mt-6 w-full" onClick={applyCoupon} disabled={!couponInput.trim()}>
          Apply coupon
        </Button>
      </Modal>
    </PosLayout>
  );
}
