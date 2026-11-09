import { Tag, CreditCard, Truck, HandCoins } from "lucide-react";

const ICONS = { tag: Tag, card: CreditCard, truck: Truck, refund: HandCoins };

export default function Benefits({ items = [] }) {
  return (
    <ul className="benefits">
      {items.map(({ id, icon, title, subtitle }) => {
        const Icon = ICONS[icon] ?? Tag;
        return (
          <li key={id} className="benefits__item">
            <Icon size={44} strokeWidth={1.4} color="#1a5cff" />
            <span><b>{title}</b><small>{subtitle}</small></span>
          </li>
        );
      })}
    </ul>
  );
}
