import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem('cart') || '[]'));
  useEffect(() => localStorage.setItem('cart', JSON.stringify(items)), [items]);

  const add = (p, qty = 1) =>
    setItems((cur) => {
      const found = cur.find((i) => i.id === p.id);
      const next = Math.min((found?.quantity || 0) + qty, p.stock);
      if (found) return cur.map((i) => (i.id === p.id ? { ...i, quantity: next, stock: p.stock } : i));
      return [...cur, { id: p.id, name: p.name, price: p.price, image_url: p.image_url, stock: p.stock, quantity: Math.min(qty, p.stock) }];
    });
  const setQty = (id, q) =>
    setItems((cur) => cur.flatMap((i) => (i.id !== id ? [i] : q < 1 ? [] : [{ ...i, quantity: Math.min(q, i.stock) }])));
  const remove = (id) => setItems((cur) => cur.filter((i) => i.id !== id));
  const clear = () => setItems([]);

  const { count, total } = useMemo(() => ({
    count: items.reduce((s, i) => s + i.quantity, 0),
    total: items.reduce((s, i) => s + i.quantity * i.price, 0),
  }), [items]);

  return <CartContext.Provider value={{ items, add, setQty, remove, clear, count, total }}>{children}</CartContext.Provider>;
}
