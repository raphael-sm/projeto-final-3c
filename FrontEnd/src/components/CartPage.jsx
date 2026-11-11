import { useEffect, useMemo, useState } from "react";
import CartItem from "./CartItem";
import CartSummary from "./CartSummary";
import { cartTotals } from "../data/cart";
import { fetchAddresses } from "../data/api";
import { mockAddresses, mockCartConfig } from "../data/mock";

/** Carrinho: `cart` vem de useCart(); `session` é o usuário logado (ou null). */
export default function CartPage({ cart, session, onRequireLogin, config = mockCartConfig }) {
  const { items, setQuantity, remove } = cart;
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState("");

  // TODO: trocar por cotação real de frete (por endereço/itens) quando a API tiver.
  const totals = useMemo(() => cartTotals(items, config.shipping), [items, config.shipping]);

  useEffect(() => { document.title = "Meu Carrinho | Portal Eletro"; }, []);

  useEffect(() => {
    if (!session) { setAddresses([]); setAddressId(""); return; }
    let off = false;
    fetchAddresses()
      .catch((err) => { console.error("Falha ao buscar endereços, usando exemplo:", err); return mockAddresses; })
      .then((list) => {
        if (off) return;
        setAddresses(list);
        setAddressId((list.find((a) => a.isDefault) ?? list[0])?.id ?? "");
      });
    return () => { off = true; };
  }, [session]);

  // Finalizar compra leva ao checkout (dados, frete e pagamento); exige login.
  const finish = () => {
    if (!session) return onRequireLogin?.();
    window.location.assign("/checkout");
  };

  if (!items.length) {
    return (
      <main className="cart cart--message">
        <h1 className="cart__title">Meu Carrinho</h1>
        <p>Seu carrinho está vazio.</p>
        <a className="summary__btn cart__link-btn" href="/loja">Ver produtos</a>
      </main>
    );
  }

  return (
    <main className="cart">
      <section className="cart__main" aria-labelledby="cart-title">
        <h1 id="cart-title" className="cart__title">Meu Carrinho</h1>
        <div className="cart__box">
          <div className="cart__row cart__head" aria-hidden="true">
            <span>Produto</span><span>Qtd.</span><span>Preço à vista</span>
          </div>
          <ul className="cart__list">
            {items.map((item) => <CartItem key={item.id} item={item} onQuantity={setQuantity} onRemove={remove} />)}
          </ul>
        </div>
      </section>
      <CartSummary
        {...totals} installments={config.installments}
        addresses={addresses} addressId={addressId} onAddress={setAddressId} loggedIn={!!session}
        onCheckout={finish} />
    </main>
  );
}
