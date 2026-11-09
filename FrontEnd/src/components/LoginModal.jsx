import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

function LoginDialog({ onClose, onSubmit, onSignup }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const first = useRef(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit({ username, password });
    } catch (err) {
      setError(err.message || "Não foi possível entrar. Verifique usuário e senha.");
      setBusy(false);
    }
  };

  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal__card" role="dialog" aria-modal="true" aria-labelledby="login-title" onSubmit={submit}>
        <button type="button" className="modal__close" aria-label="Fechar" onClick={onClose}><X size={20} /></button>
        <h2 id="login-title" className="modal__title">Login</h2>
        <p className="modal__lead">Bem-Vindo(a) de Volta!</p>

        <label className="modal__label">Usuário
          <input ref={first} className="modal__input" placeholder="João Caldas" autoComplete="username"
            value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label className="modal__label">Senha
          <input className="modal__input" type="password" placeholder="*******" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        {error && <p className="modal__error" role="alert">{error}</p>}

        <button type="button" className="modal__link" onClick={() => onSignup?.()}>Não possui uma conta?</button>
        <button type="submit" className="modal__submit" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
      </form>
    </div>
  );
}

/** Popup de login. `onSubmit({ username, password })` deve lançar erro se falhar. */
export default function LoginModal({ open, onClose, onSubmit, onSignup }) {
  return open ? <LoginDialog onClose={onClose} onSubmit={onSubmit} onSignup={onSignup} /> : null;
}
