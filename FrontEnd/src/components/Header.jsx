import { Headphones, CircleUserRound, ShoppingCart } from "lucide-react";
import { brl } from "./format";

export default function Header({ logoSrc, user, cartTotal = 0, onSearch, onHelp, onLogin, onCart }) {
  return (
    <header className="header">
      <a className="header__logo" href="/">
        {logoSrc ? <img src={logoSrc} alt="Logoipsum" /> : <span>Logoipsum</span>}
      </a>
      <input
        className="header__search"
        type="search"
        placeholder="Do que você precisa hoje?"
        onKeyDown={(e) => e.key === "Enter" && onSearch?.(e.currentTarget.value)}
      />
      <nav className="header__actions">
        <button className="header__action" onClick={onHelp}>
          <Headphones size={40} strokeWidth={1.2} />
          <span><b>Precisa de Ajuda?</b>Fale Conosco</span>
        </button>
        <button className="header__action" onClick={onLogin}>
          <CircleUserRound size={40} strokeWidth={1.2} />
          <span><b>{user?.greeting}</b>{user?.action}</span>
        </button>
        <button className="header__action" onClick={onCart}>
          <ShoppingCart size={40} strokeWidth={1.2} />
          <span><b>Meu Carrinho</b>{brl(cartTotal)}</span>
        </button>
      </nav>
    </header>
  );
}
