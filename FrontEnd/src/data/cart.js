import { useEffect, useState } from "react";

const KEY = "cart";
const round = (n) => Math.round(n * 100) / 100;
const maxOf = (stock) => (stock > 0 ? stock : Infinity);

const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? []; } catch { return []; }
};

// Abas abertas se mantêm sincronizadas quando o carrinho é limpo/recarregado fora delas.
let onExternalClear = null;
let onExternalReplace = null;
export function subscribeClear(fn) { onExternalClear = fn; }
export function subscribeReplace(fn) { onExternalReplace = fn; }

/** Apaga o carrinho persistido (usado no logout): tab atual e demais abas. */
export function clearPersistedCart() {
  try { localStorage.removeItem(KEY); } catch { /* storage indisponível */ }
  try { localStorage.setItem(KEY, "[]"); } catch { /* idem */ }
  onExternalClear?.();
}

/** Substitui o carrinho persistido por `items` (recarga pós-login) e propaga às abas. */
export function replacePersistedCart(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage indisponível */ }
  try { localStorage.setItem(KEY + "_replaced", String(Date.now())); } catch { /* idem */ }
  onExternalReplace?.(items);
}

/** Item: { id, sku, name, image, price (à vista/PIX), fullPrice (cartão), stock, quantity } */
export function useCart() {
  const [items, setItems] = useState(read);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage indisponível */ }
  }, [items]);

  // Mantém várias abas sincronizadas.
  useEffect(() => {
    const onStorage = (e) => (e.key === KEY || e.key === KEY + "_replaced") && setItems(read());
    window.addEventListener("storage", onStorage);
    // Logout em outra aba/módulo zera o carrinho nesta também.
    subscribeClear(() => setItems([]));
    // Recarga pós-login: assume o carrinho vindo do servidor.
    subscribeReplace((items) => setItems(items));
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /** `p` pode ser o produto de detalhe (images[]) ou de listagem (image). */
  const add = (p, qty = 1) => setItems((cur) => {
    const found = cur.find((x) => x.id === p.id);
    if (found) {
      return cur.map((x) => (x.id === p.id ? { ...x, quantity: Math.min(x.quantity + qty, maxOf(x.stock)) } : x));
    }
    const stock = p.stock ?? 0;
    return [...cur, {
      id: p.id, sku: p.sku ?? "", name: p.name, image: p.images?.[0]?.url ?? p.image ?? "",
      price: p.price, fullPrice: p.fullPrice ?? p.price, stock, quantity: Math.min(qty, maxOf(stock)),
    }];
  });

  const setQuantity = (id, qty) => setItems((cur) =>
    cur.map((x) => (x.id === id ? { ...x, quantity: Math.max(1, Math.min(qty, maxOf(x.stock))) } : x)));
  const remove = (id) => setItems((cur) => cur.filter((x) => x.id !== id));
  const clear = () => setItems([]);

  return { items, add, setQuantity, remove, clear };
}

/** Subtotal = valor no cartão; PIX = valor à vista + frete. O desconto (%) é calculado dos dados. */
export function cartTotals(items, shipping = 0) {
  const card = items.reduce((s, i) => s + i.fullPrice * i.quantity, 0);
  const cash = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const ship = items.length ? shipping : 0;
  return {
    count: items.reduce((s, i) => s + i.quantity, 0),
    cashSubtotal: round(cash),
    subtotal: round(card),
    shipping: ship,
    total: round(card + ship),
    pixTotal: round(cash + ship),
    discount: card > 0 ? Math.round((1 - cash / card) * 100) : 0,
  };
}
