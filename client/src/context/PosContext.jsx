import { createContext, useContext, useState, useCallback } from "react";

const PosContext = createContext(null);

import { resolveProductImage } from "../utils/unsplash";

export function PosProvider({ children }) {
  const [selectedTable, setSelectedTable] = useState(null);
  const [cart, setCart] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [customerId, setCustomerId] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);

  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitPrice: Number(product.price),
          taxRate: Number(product.tax_rate),
          categoryId: product.category_id,
          categoryColor: product.category_color,
          imageUrl: resolveProductImage(product),
          quantity: 1,
        },
      ];
    });
  }, []);

  const updateQty = useCallback((productId, quantity) => {
    if (quantity < 1) {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
    }
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCouponCode("");
    setCustomerId(null);
    setEditingOrderId(null);
    setSelectedTable(null);
  }, []);

  return (
    <PosContext.Provider
      value={{
        selectedTable,
        setSelectedTable,
        cart,
        addToCart,
        updateQty,
        clearCart,
        couponCode,
        setCouponCode,
        customerId,
        setCustomerId,
        editingOrderId,
        setEditingOrderId,
      }}
    >
      {children}
    </PosContext.Provider>
  );
}

export function usePos() {
  const ctx = useContext(PosContext);
  if (!ctx) throw new Error("usePos must be used within PosProvider");
  return ctx;
}
