import { useEffect, useState } from "react";
import { maskCPF, maskCNPJ, isValidCPF, isValidCNPJ, isValidEmail, isValidBirthDate } from "../data/checkout";

const MIN_PASSWORD = 8;

function Field({ id, label, error, children }) {
  return (
    <div className="ck__field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="ck__error" role="alert">{error}</p>}
    </div>
  );
}

/** Cadastro de usuário. `onSubmit({ name, email, password, docType, doc, birth })` deve lançar erro se falhar. */
export default function SignupPage({ session, ready = true, onSubmit, onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [docType, setDocType] = useState("cpf"); // "cpf" | "cnpj"
  const [doc, setDoc] = useState("");
  const [birth, setBirth] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => { document.title = "Cadastro | Portal Eletro"; }, []);

  const changeDocType = (type) => { setDocType(type); setDoc(""); setErrors((e) => ({ ...e, doc: "" })); };
  const clearError = (key) => { setSubmitError(""); setErrors((e) => (e[key] ? { ...e, [key]: "" } : e)); };

  const validate = () => {
    const e = {};
    if (name.trim().split(/\s+/).filter(Boolean).length < 2) e.name = "Informe seu nome completo.";
    if (!isValidEmail(email)) e.email = "Informe um e-mail válido.";
    if (docType === "cpf") {
      if (!isValidCPF(doc)) e.doc = "CPF inválido.";
      if (!isValidBirthDate(birth)) e.birth = "Informe uma data de nascimento válida.";
    } else if (!isValidCNPJ(doc)) e.doc = "CNPJ inválido.";
    if (password.length < MIN_PASSWORD) e.password = `A senha deve ter ao menos ${MIN_PASSWORD} caracteres.`;
    if (confirm !== password) e.confirm = "As senhas não conferem.";
    return e;
  };

  const submit = async () => {
    if (busy) return;
    const found = validate();
    setErrors(found);
    setSubmitError("");
    if (Object.keys(found).length) {
      document.querySelector('.prof [aria-invalid="true"]')?.focus();
      return;
    }
    setBusy(true);
    try {
      await onSubmit({ name: name.trim(), email: email.trim(), password, docType, doc, birth });
    } catch (err) {
      setSubmitError(err.message || "Não foi possível criar a conta.");
      setBusy(false);
    }
  };

  if (!ready) {
    return <main className="prof prof--message"><p role="status">Carregando…</p></main>;
  }

  if (session) {
    return (
      <main className="prof prof--message">
        <h1 className="prof__title">Cadastro</h1>
        <p>Você já está logado como {session.name}.</p>
        <a className="summary__btn cart__link-btn" href="/perfil">Minha conta</a>
      </main>
    );
  }

  const invalid = (k) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `su-${k}-error` } : {});

  return (
    <main className="prof prof--single">
      <form className="prof__main" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
        <h1 className="prof__title">Cadastro</h1>

        <section aria-labelledby="su-personal">
          <h2 id="su-personal" className="prof__sub">Dados Pessoais</h2>
          <div className="prof__fields">
            <Field id="su-name" label="Nome Completo:" error={errors.name}>
              <input id="su-name" className="ck__input" autoComplete="name" autoFocus value={name} {...invalid("name")}
                onChange={(e) => { setName(e.target.value); clearError("name"); }} />
            </Field>
            <Field id="su-email" label="E-mail:" error={errors.email}>
              <input id="su-email" className="ck__input" type="email" autoComplete="email" value={email} {...invalid("email")}
                onChange={(e) => { setEmail(e.target.value); clearError("email"); }} />
            </Field>
            {docType === "cpf" ? (
              <Field id="su-birth" label="Data de Nascimento:" error={errors.birth}>
                <input id="su-birth" className="ck__input" type="date" autoComplete="bday" min="1900-01-01"
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

            <Field id="su-doc" label={docType === "cpf" ? "CPF:" : "CNPJ:"} error={errors.doc}>
              <input id="su-doc" className="ck__input" inputMode="numeric" autoComplete="off" value={doc}
                placeholder={docType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"} {...invalid("doc")}
                onChange={(e) => { setDoc((docType === "cpf" ? maskCPF : maskCNPJ)(e.target.value)); clearError("doc"); }} />
            </Field>
          </div>
        </section>

        <section aria-labelledby="su-access">
          <h2 id="su-access" className="prof__sub">Acesso</h2>
          <div className="prof__fields">
            <Field id="su-password" label="Senha:" error={errors.password}>
              <input id="su-password" className="ck__input" type="password" autoComplete="new-password" value={password}
                {...invalid("password")} onChange={(e) => { setPassword(e.target.value); clearError("password"); }} />
            </Field>
            <Field id="su-confirm" label="Confirmar Senha:" error={errors.confirm}>
              <input id="su-confirm" className="ck__input" type="password" autoComplete="new-password" value={confirm}
                {...invalid("confirm")} onChange={(e) => { setConfirm(e.target.value); clearError("confirm"); }} />
            </Field>
          </div>
        </section>

        <div className="prof__actions">
          {submitError && <p className="summary__error" role="alert">{submitError}</p>}
          <button type="button" className="modal__link" onClick={() => onLogin?.()}>Já possui uma conta?</button>
          <button type="submit" className="prof__save" disabled={busy}>{busy ? "Cadastrando…" : "Cadastrar"}</button>
        </div>
      </form>
    </main>
  );
}