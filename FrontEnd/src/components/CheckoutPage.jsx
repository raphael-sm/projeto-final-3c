import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { brl } from "./format";
import { cartTotals } from "../data/cart";
import { fetchAddresses, syncCart, checkout } from "../data/api";
import { mockAddresses, mockCheckoutConfig } from "../data/mock";
import {
  maskCPF, maskCNPJ, isValidCPF, isValidCNPJ, isValidEmail, isValidBirthDate, shippingPrice,
} from "../data/checkout";
import correiosLogo from "../assets/correios-logo-png_seeklogo-251768.png";
import azulLogo from "../assets/Azul_Cargo_Express_logo.png";

// Logotipos por transportadora (a Loggi não tem imagem no projeto: usa um wordmark em texto).
const LOGOS = {
  correios: <img src={correiosLogo} alt="Correios" />,
  loggi: <span className="ck__loggi" role="img" aria-label="Loggi">Loggi</span>,
  azul: <img src={azulLogo} alt="Azul Cargo Express" />,
};

function Field({ id, label, error, children }) {
  return (
    <div className="ck__field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="ck__error" role="alert">{error}</p>}
    </div>
  );
}

/** Checkout: `cart` vem de useCart(); `session` é o usuário logado (ou null); `ready` indica que a sessão já foi restaurada. */
export default function CheckoutPage({ cart, session, ready = true, onRequireLogin, config = mockCheckoutConfig }) {
  const { items, clear } = cart;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [docType, setDocType] = useState("cpf"); // "cpf" | "cnpj"
  const [doc, setDoc] = useState("");
  const [birth, setBirth] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState("");
  const [notes, setNotes] = useState("");
  const [shippingId, setShippingId] = useState(config.shippingOptions[0].id);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [order, setOrder] = useState(null);

  useEffect(() => { document.title = "Checkout | Portal Eletro"; }, []);

  // Pré-preenche nome, e-mail, documento e nascimento com os dados da conta
  // (/auth/me traz cpf ou cnpj sem máscara + birthday, se CPF).
  useEffect(() => {
    if (!session) return;
    setName((v) => v || session.name || "");
    setEmail((v) => v || session.email || "");
    if (session.cnpj) { setDocType("cnpj"); setDoc(maskCNPJ(session.cnpj)); }
    else if (session.cpf) { setDocType("cpf"); setDoc(maskCPF(session.cpf)); setBirth(String(session.birthday ?? "").slice(0, 10)); }
  }, [session]);

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

  // Pagamento à vista (PIX) + frete, como no resumo do carrinho.
  const productsTotal = useMemo(() => cartTotals(items).cashSubtotal, [items]);
  const options = useMemo(
    () => config.shippingOptions.map((o) => ({ ...o, final: shippingPrice(o, productsTotal, config) })),
    [config, productsTotal],
  );
  const selected = options.find((o) => o.id === shippingId) ?? options[0];
  const total = Math.round((productsTotal + selected.final) * 100) / 100;
  const currentAddress = addresses.find((a) => a.id === addressId);

  const changeDocType = (type) => { setDocType(type); setDoc(""); setErrors((e) => ({ ...e, doc: "" })); };
  const clearError = (key) => setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));

  const validate = () => {
    const e = {};
    if (name.trim().split(/\s+/).filter(Boolean).length < 2) e.name = "Informe seu nome completo.";
    if (!isValidEmail(email)) e.email = "Informe um e-mail válido.";
    if (docType === "cpf") {
      if (!isValidCPF(doc)) e.doc = "CPF inválido.";
      if (!isValidBirthDate(birth)) e.birth = "Informe uma data de nascimento válida.";
    } else if (!isValidCNPJ(doc)) e.doc = "CNPJ inválido.";
    if (!addressId) e.address = "Selecione um endereço de entrega.";
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (busy) return;
    const found = validate();
    setErrors(found);
    setSubmitError("");
    if (Object.keys(found).length) {
      document.querySelector('.checkout [aria-invalid="true"]')?.focus();
      return;
    }
    setBusy(true);
    try {
      // O pedido é montado a partir do carrinho do SERVIDOR: espelha os itens locais lá primeiro.
      await syncCart(items);
      const result = await checkout({
        addressId,
        carrier: selected.id,
        shippingPrice: selected.final, // frete efetivamente cobrado (0 quando grátis)
      });
      clear();
      setOrder(result ?? {});
    } catch (err) {
      setSubmitError(err.message || "Não foi possível finalizar o pedido.");
    } finally {
      setBusy(false);
    }
  };

  if (order) {
    return (
      <main className="checkout checkout--message">
        <h1 className="checkout__title">Pedido realizado!</h1>
        <p>{order.id ? `Pedido #${order.id} registrado com sucesso.` : "Seu pedido foi registrado com sucesso."}</p>
        <a className="summary__btn cart__link-btn" href="/loja">Continuar comprando</a>
      </main>
    );
  }

  if (!ready) {
    return <main className="checkout checkout--message"><p role="status">Carregando…</p></main>;
  }

  if (!session) {
    return (
      <main className="checkout checkout--message">
        <h1 className="checkout__title">Checkout</h1>
        <p>Entre na sua conta para finalizar a compra.</p>
        <button className="summary__btn cart__link-btn" onClick={() => onRequireLogin?.()}>Entrar</button>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="checkout checkout--message">
        <h1 className="checkout__title">Checkout</h1>
        <p>Seu carrinho está vazio.</p>
        <a className="summary__btn cart__link-btn" href="/loja">Ver produtos</a>
      </main>
    );
  }

  const invalid = (k) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `${k === "doc" ? "ck-doc" : `ck-${k}`}-error` } : {});

  return (
    <main className="checkout">
      <h1 className="checkout__title">Checkout</h1>
      <form className="checkout__grid" onSubmit={submit} noValidate>
        {/* Dados pessoais */}
        <section className="ck__box" aria-labelledby="ck-personal">
          <div className="ck__part">
            <h2 id="ck-personal" className="ck__title">Dados Pessoais</h2>
            <Field id="ck-name" label="Nome Completo:" error={errors.name}>
              <input id="ck-name" className="ck__input" autoComplete="name" value={name} {...invalid("name")}
                onChange={(e) => { setName(e.target.value); clearError("name"); }} />
            </Field>
            <Field id="ck-email" label="E-mail:" error={errors.email}>
              <input id="ck-email" className="ck__input" type="email" autoComplete="email" value={email} {...invalid("email")}
                onChange={(e) => { setEmail(e.target.value); clearError("email"); }} />
            </Field>
          </div>

          <fieldset className="ck__part ck__types">
            <legend className="sr-only">Tipo de documento</legend>
            {[["cnpj", "CNPJ"], ["cpf", "CPF"]].map(([value, label]) => (
              <label key={value} className="ck__radio">
                <input type="radio" name="docType" value={value} checked={docType === value} onChange={() => changeDocType(value)} />
                <span className="ck__dot" aria-hidden="true" />{label}
              </label>
            ))}
          </fieldset>

          <div className="ck__part">
            <Field id="ck-doc" label={docType === "cpf" ? "CPF:" : "CNPJ:"} error={errors.doc}>
              <input id="ck-doc" className="ck__input" inputMode="numeric" autoComplete="off" value={doc}
                placeholder={docType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"} {...invalid("doc")}
                onChange={(e) => { setDoc((docType === "cpf" ? maskCPF : maskCNPJ)(e.target.value)); clearError("doc"); }} />
            </Field>
            {docType === "cpf" && (
              <Field id="ck-birth" label="Data de Nascimento:" error={errors.birth}>
                <input id="ck-birth" className="ck__input" type="date" autoComplete="bday" min="1900-01-01"
                  max={new Date().toISOString().slice(0, 10)} value={birth} {...invalid("birth")}
                  onChange={(e) => { setBirth(e.target.value); clearError("birth"); }} />
              </Field>
            )}
          </div>
        </section>

        {/* Frete */}
        <section className="ck__box ck__box--pad" aria-labelledby="ck-shipping">
          <h2 id="ck-shipping" className="ck__title">Frete</h2>

          <div className="summary__address ck__address" aria-invalid={!!errors.address || undefined}>
            {addresses.length ? (
              <>
                <span className="summary__address-text"><b>{currentAddress?.label}</b><small>{currentAddress?.text}</small></span>
                <ChevronDown size={28} strokeWidth={1.6} aria-hidden="true" />
                <select aria-label="Endereço de entrega" value={addressId}
                  onChange={(e) => { setAddressId(e.target.value); clearError("address"); }}>
                  {addresses.map((a) => <option key={a.id} value={a.id}>{a.label} — {a.text}</option>)}
                </select>
              </>
            ) : (
              <span className="summary__address-text"><small>Nenhum endereço cadastrado.</small></span>
            )}
          </div>
          {errors.address && <p className="ck__error" role="alert">{errors.address}</p>}

          <div className="ck__field ck__notes">
            <label htmlFor="ck-notes">Observações(Opcional):</label>
            <textarea id="ck-notes" className="ck__input" rows={4} maxLength={300} placeholder="Entregar na Portaria..."
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <fieldset className="ck__ship">
            <legend className="sr-only">Transportadora</legend>
            {options.map((o) => (
              <label key={o.id} className={`ck__ship-row${o.id === selected.id ? " is-selected" : ""}`}>
                <input type="radio" name="shipping" value={o.id} checked={o.id === selected.id} onChange={() => setShippingId(o.id)} />
                <span className="ck__dot" aria-hidden="true" />
                <span className="ck__logo">{LOGOS[o.id]}</span>
                <span className="ck__days">{o.days} dias</span>
                <span className="ck__ship-price">
                  {o.final === 0
                    ? <>Grátis<s className="ck__old">{brl(o.price)}</s></>
                    : brl(o.final)}
                </span>
              </label>
            ))}
          </fieldset>
          <p className="ck__hint">Frete grátis pelos Correios em compras acima de {brl(config.freeShippingFrom)}.</p>
        </section>

        {/* Pagamento */}
        <section className="ck__box ck__box--pad ck__pay" aria-labelledby="ck-pay">
          <h2 id="ck-pay" className="ck__title">Pagamento</h2>
          <p className="ck__pay-note">Essa não é uma loja real, então não há necessidade de haver uma gateway de pagamentos.</p>
          <dl className="ck__total"><dt>Total</dt><dd aria-live="polite">{brl(total)}</dd></dl>
          {submitError && <p className="summary__error" role="alert">{submitError}</p>}
          <button type="submit" className="ck__submit" disabled={busy}>{busy ? "Enviando…" : "Fazer Pedido"}</button>
        </section>
      </form>
    </main>
  );
}
