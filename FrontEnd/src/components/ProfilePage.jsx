import { useEffect, useState } from "react";
import { Check, Minus, Pencil, Plus, X } from "lucide-react";
import AccountSidebar from "./AccountSidebar";
import {
  maskCPF, maskCNPJ, isValidCPF, isValidCNPJ, isValidEmail, isValidBirthDate,
} from "../data/checkout";
import { fetchAddresses, createAddress, updateAddress, deleteAddress, updateProfile } from "../data/api";

const MAX_ADDRESSES = 4;

function Field({ id, label, error, children }) {
  return (
    <div className="ck__field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="ck__error" role="alert">{error}</p>}
    </div>
  );
}

/** Perfil do usuário: `session` é o usuário logado (ou null); `ready` indica que a sessão já foi restaurada. */
export default function ProfilePage({ session, ready = true, onRequireLogin, onLogout, onSaved }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [docType, setDocType] = useState("cpf"); // "cpf" | "cnpj"
  const [doc, setDoc] = useState("");
  const [birth, setBirth] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [editing, setEditing] = useState(null); // { id: <id do endereço> | "new", value }
  const [addrBusy, setAddrBusy] = useState(false);
  const [addrError, setAddrError] = useState("");

  useEffect(() => { document.title = "Configurações | Portal Eletro"; }, []);

  // Pré-preenche com os dados da conta: documento (cpf/cnpj) e nascimento
  // vêm do /auth/me (dados do titular, sem máscara).
  useEffect(() => {
    if (!session) return;
    setName(session.name ?? "");
    setEmail(session.email ?? "");
    if (session.cnpj) { setDocType("cnpj"); setDoc(maskCNPJ(session.cnpj)); setBirth(""); }
    else if (session.cpf) { setDocType("cpf"); setDoc(maskCPF(session.cpf)); setBirth(String(session.birthday ?? "").slice(0, 10)); }
  }, [session]);

  useEffect(() => {
    if (!session) { setAddresses([]); return; }
    let off = false;
    fetchAddresses()
      .then((list) => { if (!off) setAddresses(list); })
      .catch((err) => { console.error(err); if (!off) setAddrError("Não foi possível carregar seus endereços."); });
    return () => { off = true; };
  }, [session]);

  const changeDocType = (type) => { setDocType(type); setDoc(""); setErrors((e) => ({ ...e, doc: "" })); };
  const clearError = (key) => { setSaved(false); setErrors((e) => (e[key] ? { ...e, [key]: "" } : e)); };

  const validate = () => {
    const e = {};
    if (name.trim().split(/\s+/).filter(Boolean).length < 2) e.name = "Informe seu nome completo.";
    if (!isValidEmail(email)) e.email = "Informe um e-mail válido.";
    if (docType === "cpf") {
      if (!isValidCPF(doc)) e.doc = "CPF inválido.";
      if (!isValidBirthDate(birth)) e.birth = "Informe uma data de nascimento válida.";
    } else if (!isValidCNPJ(doc)) e.doc = "CNPJ inválido.";
    return e;
  };

  const save = async () => {
    if (busy) return;
    const found = validate();
    setErrors(found);
    setSaveError("");
    setSaved(false);
    if (Object.keys(found).length) {
      document.querySelector('.prof [aria-invalid="true"]')?.focus();
      return;
    }
    setBusy(true);
    try {
      const updated = await updateProfile({ name: name.trim(), email: email.trim(), docType, doc, birth });
      onSaved?.({ name: name.trim(), email: email.trim(), ...(updated && typeof updated === "object" ? updated : {}) });
      setSaved(true);
    } catch (err) {
      setSaveError(err.message || "Não foi possível salvar os dados.");
    } finally {
      setBusy(false);
    }
  };

  // ----- Endereços (cada alteração é enviada à API ao confirmar) -----
  const startEdit = (a) => { setAddrError(""); setEditing({ id: a.id, value: a.text }); };
  const startAdd = () => { setAddrError(""); setEditing({ id: "new", value: "" }); };
  const cancelEdit = () => { setAddrError(""); setEditing(null); };

  const confirmEdit = async () => {
    const text = editing.value.trim();
    if (!text) { setAddrError("Informe o endereço."); return; }
    setAddrBusy(true);
    setAddrError("");
    try {
      if (editing.id === "new") {
        const created = await createAddress(text);
        setAddresses((list) => [...list, created]);
      } else {
        const updated = await updateAddress(editing.id, text);
        setAddresses((list) => list.map((a) => (a.id === editing.id ? updated : a)));
      }
      setEditing(null);
    } catch (err) {
      setAddrError(err.message || "Não foi possível salvar o endereço.");
    } finally {
      setAddrBusy(false);
    }
  };

  const removeAddress = async (a) => {
    if (!window.confirm("Remover este endereço?")) return;
    setAddrBusy(true);
    setAddrError("");
    try {
      await deleteAddress(a.id);
      setAddresses((list) => list.filter((x) => x.id !== a.id));
      if (editing?.id === a.id) setEditing(null);
    } catch (err) {
      setAddrError(err.message || "Não foi possível remover o endereço.");
    } finally {
      setAddrBusy(false);
    }
  };

  if (!ready) {
    return <main className="prof prof--message"><p role="status">Carregando…</p></main>;
  }

  if (!session) {
    return (
      <main className="prof prof--message">
        <h1 className="prof__title">Configurações</h1>
        <p>Entre na sua conta para ver seu perfil.</p>
        <button className="summary__btn cart__link-btn" onClick={() => onRequireLogin?.()}>Entrar</button>
      </main>
    );
  }

  const invalid = (k) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `pf-${k}-error` } : {});
  const canAdd = addresses.length < MAX_ADDRESSES && !editing;

  const editor = (
    <>
      <input className="ck__input" aria-label="Endereço" autoFocus maxLength={255} value={editing?.value ?? ""}
        placeholder="Rua, número, bairro, cidade, UF - CEP"
        onChange={(e) => setEditing((cur) => ({ ...cur, value: e.target.value }))}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); confirmEdit(); }
          if (e.key === "Escape") cancelEdit();
        }} />
      <button type="button" className="prof__icon prof__icon--blue" aria-label="Confirmar endereço" disabled={addrBusy} onClick={confirmEdit}>
        <Check size={26} strokeWidth={3} />
      </button>
      <button type="button" className="prof__icon prof__icon--gray" aria-label="Cancelar" disabled={addrBusy} onClick={cancelEdit}>
        <X size={26} strokeWidth={3} />
      </button>
    </>
  );

  return (
    <main className="prof">
      <AccountSidebar name={session.name} current="config" onLogout={onLogout} />

      <form className="prof__main" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
        <h1 className="prof__title">Configurações</h1>

        <section aria-labelledby="pf-personal">
          <h2 id="pf-personal" className="prof__sub">Dados Pessoais</h2>
          <div className="prof__fields">
            <Field id="pf-name" label="Nome Completo:" error={errors.name}>
              <input id="pf-name" className="ck__input" autoComplete="name" value={name} {...invalid("name")}
                onChange={(e) => { setName(e.target.value); clearError("name"); }} />
            </Field>
            <Field id="pf-email" label="E-mail:" error={errors.email}>
              <input id="pf-email" className="ck__input" type="email" autoComplete="email" value={email} {...invalid("email")}
                onChange={(e) => { setEmail(e.target.value); clearError("email"); }} />
            </Field>
            {docType === "cpf" ? (
              <Field id="pf-birth" label="Data de Nascimento:" error={errors.birth}>
                <input id="pf-birth" className="ck__input" type="date" autoComplete="bday" min="1900-01-01"
                  max={new Date().toISOString().slice(0, 10)} value={birth} {...invalid("birth")}
                  onChange={(e) => { setBirth(e.target.value); clearError("birth"); }} />
              </Field>
            ) : <span aria-hidden="true" />}

            <fieldset className="prof__types">
              <legend className="sr-only">Tipo de documento</legend>
              {[["cnpj", "CNPJ"], ["cpf", "CPF"]].map(([value, label]) => (
                <label key={value} className="ck__radio">
                  <input type="radio" name="docType" value={value} checked={docType === value} onChange={() => changeDocType(value)} />
                  <span className="ck__dot" aria-hidden="true" />{label}
                </label>
              ))}
            </fieldset>

            <Field id="pf-doc" label={docType === "cpf" ? "CPF:" : "CNPJ:"} error={errors.doc}>
              <input id="pf-doc" className="ck__input" inputMode="numeric" autoComplete="off" value={doc}
                placeholder={docType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"} {...invalid("doc")}
                onChange={(e) => { setDoc((docType === "cpf" ? maskCPF : maskCNPJ)(e.target.value)); clearError("doc"); }} />
            </Field>
          </div>
        </section>

        <section aria-labelledby="pf-addresses">
          <h2 id="pf-addresses" className="prof__sub">Endereços(máx. {MAX_ADDRESSES})</h2>
          <ul className="prof__addrs">
            {addresses.map((a, i) => (
              <li key={a.id} className={`prof__addr${i === 0 ? " is-main" : ""}`}>
                {editing?.id === a.id ? editor : (
                  <>
                    <span className="prof__addr-text">{a.text}</span>
                    {i > 0 && (
                      <button type="button" className="prof__icon prof__icon--red" aria-label={`Remover endereço: ${a.text}`}
                        disabled={addrBusy} onClick={() => removeAddress(a)}>
                        <Minus size={26} strokeWidth={4} />
                      </button>
                    )}
                    <button type="button" className="prof__icon prof__icon--orange" aria-label={`Editar endereço: ${a.text}`}
                      disabled={addrBusy} onClick={() => startEdit(a)}>
                      <Pencil size={26} strokeWidth={1.6} />
                    </button>
                  </>
                )}
              </li>
            ))}
            {editing?.id === "new" && <li className="prof__addr">{editor}</li>}
          </ul>
          {!addresses.length && !editing && !addrError && <p className="prof__empty">Nenhum endereço cadastrado.</p>}
          {addrError && <p className="ck__error" role="alert">{addrError}</p>}
          {canAdd && (
            <button type="button" className="prof__icon prof__icon--blue prof__add" aria-label="Adicionar endereço" onClick={startAdd}>
              <Plus size={30} strokeWidth={3.5} />
            </button>
          )}
        </section>

        <div className="prof__actions">
          {saveError && <p className="summary__error" role="alert">{saveError}</p>}
          {saved && <p className="prof__ok" role="status">Dados salvos com sucesso.</p>}
          <button type="submit" className="prof__save" disabled={busy}>{busy ? "Salvando…" : "Salvar"}</button>
        </div>
      </form>
    </main>
  );
}