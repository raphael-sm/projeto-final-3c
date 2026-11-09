import { Phone, Mail } from "lucide-react";

export default function Footer({ logoSrc, address = [], company = [], phone, email, hours, notice }) {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          {logoSrc ? <img src={logoSrc} alt="Logoipsum" /> : <span className="footer__logo">Logoipsum</span>}
          <div className="footer__cols">
            <div>
              <p>{address.map((l) => <span key={l}>{l}<br /></span>)}</p>
              <p>{company.map((l) => <span key={l}>{l}<br /></span>)}</p>
            </div>
            <div>
              <b>Atendimento</b>
              <p><Phone size={16} /> {phone}<br /><Mail size={16} /> {email}</p>
              <p>Horário de Atendimento:<br />{hours}</p>
            </div>
          </div>
        </div>
        <p className="footer__notice">{notice}</p>
      </div>
    </footer>
  );
}
