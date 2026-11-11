import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Truck } from "lucide-react";
import AccountSidebar from "./AccountSidebar";
import { brl } from "./format";
import { fetchOrders } from "../data/api";
import correiosLogo from "../assets/correios-logo-png_seeklogo-251768.png";
import azulLogo from "../assets/Azul_Cargo_Express_logo.png";

// Nomes por transportadora (ids do checkout; a Loggi usa um wordmark em texto).
const CARRIERS = {
  correios: { logo: <img src={correiosLogo} alt="Correios" />, name: "Correios" },
  loggi: { logo: <span className="ck__loggi" role="img" aria-label="Loggi">Loggi</span>, name: "Loggi" },
  azul: { logo: <img src={azulLogo} alt="Azul Cargo Express" />, name: "Azul Cargo Express" },
};

const STATUS_LABEL = { preparing: "Preparando", shipped: "Postado", delivered: "Finalizado" };

const formatWhen = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString("pt-BR");
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${date} às ${time}`;
};

const safeUrl = (u) => (/^https?:\/\//i.test(u ?? "") ? u : null);

function Tracking({ order }) {
  const url = safeUrl(order.trackingUrl);
  if (order.status === "delivered") return <span className="ord__track ord__track--ok">Entregue</span>;
  if (url) {
    return (
      <a className="ord__track ord__track--link" href={url} target="_blank" rel="noopener noreferrer">
        <ExternalLink size={16} aria-hidden="true" />Rastrear
      </a>
    );
  }
  return <span className="ord__track ord__track--off">Rastreio Indisponível</span>;
}

function Order({ order, open, onToggle }) {
  const count = order.items.reduce((s, i) => s + i.quantity, 0);
  const panelId = `ord-${order.id}`;
  return (
    <li className="ord">
      <div className="ord__head">
        <button type="button" className="ord__toggle" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
          <b>{formatWhen(order.createdAt)}</b>
          <b>{count} {count === 1 ? "item" : "itens"} - {brl(order.total)}</b>
        </button>
        <Tracking order={order} />
        <button type="button" className="ord__status" tabIndex={-1} aria-hidden="true" onClick={onToggle}>
          {STATUS_LABEL[order.status]}
          {open ? <ChevronUp size={36} strokeWidth={1.6} /> : <ChevronDown size={36} strokeWidth={1.6} />}
        </button>
      </div>

      {open && (
        <div id={panelId} className="ord__body">
          <ul className="ord__items">
            {order.items.map((i, idx) => (
              <li key={i.id ?? idx} className="ord__item">
                <span className="ord__img">{i.image ? <img src={i.image} alt="" /> : null}</span>
                <span className="ord__info">
                  <span>{i.name} {i.quantity}x</span>
                  <strong>{brl(i.price * i.quantity)}</strong>
                </span>
              </li>
            ))}
            <li className="ord__item">
              <span className="ord__img ord__img--logo">{CARRIERS[order.carrier]?.logo ?? <Truck size={40} strokeWidth={1.4} aria-hidden="true" />}</span>
              <span className="ord__info">
                <span>Frete{CARRIERS[order.carrier] ? ` — ${CARRIERS[order.carrier].name}` : ""}</span>
                <strong>{brl(order.shipping)}</strong>
              </span>
            </li>
          </ul>
          <dl className="ord__total"><dt>Total</dt><dd>{brl(order.total)}</dd></dl>
        </div>
      )}
    </li>
  );
}

/** Histórico de pedidos: `session` é o usuário logado (ou null); `ready` indica que a sessão já foi restaurada. */
export default function OrdersPage({ session, ready = true, onRequireLogin, onLogout }) {
  const [orders, setOrders] = useState(null); // null = carregando
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => { document.title = "Meus Pedidos | Portal Eletro"; }, []);

  useEffect(() => {
    if (!session) return;
    let off = false;
    fetchOrders()
      .then((list) => {
        if (off) return;
        setOrders(list);
        setOpenId(list[0]?.id ?? null); // o pedido mais recente já vem aberto
      })
      .catch((err) => { console.error(err); if (!off) { setError("Não foi possível carregar seus pedidos."); setOrders([]); } });
    return () => { off = true; };
  }, [session]);

  if (!ready) return <main className="prof prof--message"><p role="status">Carregando…</p></main>;

  if (!session) {
    return (
      <main className="prof prof--message">
        <h1 className="prof__title">Meus Pedidos</h1>
        <p>Entre na sua conta para ver seus pedidos.</p>
        <button className="summary__btn cart__link-btn" onClick={() => onRequireLogin?.()}>Entrar</button>
      </main>
    );
  }

  return (
    <main className="prof">
      <AccountSidebar name={session.name} current="orders" onLogout={onLogout} />
      <section className="prof__main" aria-labelledby="ord-title">
        <h1 id="ord-title" className="prof__title">Meus Pedidos</h1>
        {orders === null && <p role="status">Carregando…</p>}
        {error && <p className="ck__error" role="alert">{error}</p>}
        {orders?.length === 0 && !error && (
          <p className="prof__empty">Você ainda não fez nenhum pedido. <a href="/loja" className="modal__link ord__shop">Ver produtos</a></p>
        )}
        {orders?.length > 0 && (
          <ul className="ord__list">
            {orders.map((o) => (
              <Order key={o.id} order={o} open={openId === o.id} onToggle={() => setOpenId((cur) => (cur === o.id ? null : o.id))} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}