import { CircleUserRound } from "lucide-react";

/** Menu lateral da conta. `current`: "config" | "orders". */
export default function AccountSidebar({ name, current, onLogout }) {
  const logout = async () => {
    await onLogout?.();
    window.location.assign("/");
  };

  return (
    <aside className="prof__side">
      <div className="prof__avatar"><CircleUserRound strokeWidth={1.2} aria-hidden="true" /></div>
      <h2 className="prof__name">{name}</h2>
      <nav className="prof__nav" aria-label="Minha conta">
        <a href="/perfil" aria-current={current === "config" ? "page" : undefined}>Configurações</a>
        <a href="/pedidos" aria-current={current === "orders" ? "page" : undefined}>Meus Pedidos</a>
      </nav>
      <button type="button" className="prof__logout" onClick={logout}>Sair</button>
    </aside>
  );
}