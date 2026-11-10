import { Minus, Plus, Trash2 } from "lucide-react";
import { brl } from "./format";

export default function CartItem({ item, onQuantity, onRemove }) {
  const { id, name, sku, image, price, fullPrice, quantity, stock } = item;
  const atMax = stock > 0 && quantity >= stock;
  return (
    <li className="cart__row cart__item">
      <a className="cart__product" href={`/produto/${id}`}>
        <span className="cart__thumb">{image && <img src={image} alt="" loading="lazy" />}</span>
        <span className="cart__info">
          <strong>{name}</strong>
          <small>Preço no Cartão à prazo: {brl(fullPrice)}<br />SKU: {sku}</small>
        </span>
      </a>
      <div className="cart__qty">
        <button aria-label={`Diminuir quantidade de ${name}`} disabled={quantity <= 1} onClick={() => onQuantity(id, quantity - 1)}><Minus size={20} /></button>
        <span aria-live="polite">{quantity}</span>
        <button aria-label={`Aumentar quantidade de ${name}`} disabled={atMax} onClick={() => onQuantity(id, quantity + 1)}><Plus size={20} /></button>
        <button className="cart__trash" aria-label={`Remover ${name}`} onClick={() => onRemove(id)}><Trash2 size={22} strokeWidth={1.4} /></button>
      </div>
      <strong className="cart__price">{brl(price * quantity)}</strong>
    </li>
  );
}
