import { ChevronDown } from "lucide-react";
import { brl } from "./format";

export default function CartSummary({
  subtotal, shipping, total, pixTotal, discount, installments = 12,
  addresses = [], addressId, onAddress, loggedIn = false,
  onCheckout, busy = false, error = "",
}) {
  const current = addresses.find((a) => a.id === addressId);
  return (
    <aside className="summary" aria-labelledby="summary-title">
      <h2 id="summary-title" className="summary__title">Resumo</h2>
      <dl className="summary__lines">
        <div><dt>Subtotal</dt><dd>{brl(subtotal)}</dd></div>
        <div><dt>Frete(Calculado)</dt><dd>{brl(shipping)}</dd></div>
      </dl>

      <div className="summary__address">
        {addresses.length ? (
          <>
            <span className="summary__address-text">
              <b>{current?.label}</b><small>{current?.text}</small>
            </span>
            <ChevronDown size={28} strokeWidth={1.6} aria-hidden="true" />
            <select aria-label="Endereço de entrega" value={addressId} onChange={(e) => onAddress(e.target.value)}>
              {addresses.map((a) => <option key={a.id} value={a.id}>{a.label} — {a.text}</option>)}
            </select>
          </>
        ) : (
          <span className="summary__address-text"><small>{loggedIn ? "Nenhum endereço cadastrado." : "Entre na sua conta para escolher o endereço de entrega."}</small></span>
        )}
      </div>

      <dl className="summary__lines summary__lines--total">
        <div><dt>Total</dt><dd>{brl(total)}</dd></div>
      </dl>

      <div className="summary__pay">
        <p className="summary__pix"><strong>{brl(pixTotal)}</strong>no PIX com {discount}% de Desconto</p>
        <p className="summary__or">OU</p>
        <p className="summary__card"><strong>{brl(total)}</strong>em até {installments}x no cartão</p>
      </div>

      {error && <p className="summary__error" role="alert">{error}</p>}
      <button className="summary__btn" disabled={busy} onClick={onCheckout}>
        {busy ? "Finalizando…" : "Finalizar Compra"}
      </button>
    </aside>
  );
}
