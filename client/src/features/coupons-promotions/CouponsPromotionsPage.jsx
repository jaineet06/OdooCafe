import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { couponsApi, promotionsApi } from "../../api/config.api";
import { productsApi } from "../../api/products.api";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";

export default function CouponsPromotionsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("coupons");
  const [couponOpen, setCouponOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: "", discountType: "percentage", discountValue: "" });
  const [promoForm, setPromoForm] = useState({
    name: "", applyTo: "order", discountType: "percentage", discountValue: "", minOrderAmount: "", productId: "", minQty: "",
  });

  const { data: coupons } = useQuery({ queryKey: ["coupons"], queryFn: couponsApi.list });
  const { data: promotions } = useQuery({ queryKey: ["promotions"], queryFn: promotionsApi.list });
  const { data: productsData } = useQuery({ queryKey: ["products"], queryFn: () => productsApi.list({ limit: 100 }) });

  const saveCoupon = useMutation({
    mutationFn: () => couponsApi.create({ ...couponForm, discountValue: Number(couponForm.discountValue) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["coupons"] }); setCouponOpen(false); toast.success("Coupon created"); },
    onError: (err) => toast.error(err.userMessage),
  });

  const savePromo = useMutation({
    mutationFn: () => {
      const p = { ...promoForm, discountValue: Number(promoForm.discountValue) };
      if (p.applyTo === "order") p.minOrderAmount = Number(p.minOrderAmount);
      else { p.productId = promoForm.productId; p.minQty = Number(promoForm.minQty); }
      return promotionsApi.create(p);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["promotions"] }); setPromoOpen(false); toast.success("Promotion created"); },
    onError: (err) => toast.error(err.userMessage),
  });

  return (
    <AdminLayout title="Coupons & promotions">
      <div className="mb-4 flex gap-2">
        <Button variant={tab === "coupons" ? "primary" : "secondary"} onClick={() => setTab("coupons")}>Coupons</Button>
        <Button variant={tab === "promotions" ? "primary" : "secondary"} onClick={() => setTab("promotions")}>Promotions</Button>
      </div>

      {tab === "coupons" ? (
        <>
          <Button onClick={() => setCouponOpen(true)}>Add coupon</Button>
          <div className="mt-4 space-y-2">
            {coupons?.map((c) => (
              <div key={c.id} className="rounded-xl border border-border bg-surface p-4">
                <span className="font-bold">{c.code}</span> — {c.discount_type} {c.discount_value}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <Button onClick={() => setPromoOpen(true)}>Add promotion</Button>
          <div className="mt-4 space-y-2">
            {promotions?.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-surface p-4">
                <span className="font-bold">{p.name}</span> — {p.apply_to} {p.discount_type} {p.discount_value}
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={couponOpen} onClose={() => setCouponOpen(false)} title="New coupon">
        <Input label="Code" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} />
        <select className="my-3 w-full min-h-11 rounded-lg border px-3" value={couponForm.discountType} onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}>
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed</option>
        </select>
        <Input label="Value" type="number" value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} />
        <Button className="mt-4 w-full" onClick={() => saveCoupon.mutate()}>Save</Button>
      </Modal>

      <Modal open={promoOpen} onClose={() => setPromoOpen(false)} title="New promotion" wide>
        <Input label="Name" value={promoForm.name} onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })} />
        <select className="my-3 w-full min-h-11 rounded-lg border px-3" value={promoForm.applyTo} onChange={(e) => setPromoForm({ ...promoForm, applyTo: e.target.value })}>
          <option value="order">Order level</option>
          <option value="product">Product level</option>
        </select>
        {promoForm.applyTo === "order" ? (
          <Input label="Min order amount" type="number" value={promoForm.minOrderAmount} onChange={(e) => setPromoForm({ ...promoForm, minOrderAmount: e.target.value })} />
        ) : (
          <>
            <select className="my-3 w-full min-h-11 rounded-lg border px-3" value={promoForm.productId} onChange={(e) => setPromoForm({ ...promoForm, productId: e.target.value })}>
              <option value="">Product</option>
              {productsData?.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <Input label="Min qty" type="number" value={promoForm.minQty} onChange={(e) => setPromoForm({ ...promoForm, minQty: e.target.value })} />
          </>
        )}
        <Input label="Discount value" type="number" value={promoForm.discountValue} onChange={(e) => setPromoForm({ ...promoForm, discountValue: e.target.value })} />
        <Button className="mt-4 w-full" onClick={() => savePromo.mutate()}>Save</Button>
      </Modal>
    </AdminLayout>
  );
}
