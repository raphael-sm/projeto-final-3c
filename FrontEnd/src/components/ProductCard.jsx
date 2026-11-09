import { Star, StarHalf } from "lucide-react";
import { brl } from "./format";

export function Stars({ value = 0 }) {
  return (
    <span className="stars" aria-label={`Nota ${value} de 5`}>
      {[1, 2, 3, 4, 5].map((n) =>
        value >= n ? <Star key={n} size="1em" fill="currentColor" strokeWidth={0} />
        : value >= n - 0.5 ? <StarHalf key={n} size="1em" fill="currentColor" strokeWidth={0} />
        : <Star key={n} size="1em" strokeWidth={1.5} />
      )}
    </span>
  );
}

export default function ProductCard({ name, image, rating, reviews = 0, price, fullPrice, href = "#" }) {
  return (
    <a className="product" href={href}>
      <div className="product__img">{image && <img src={image} alt={name} loading="lazy" />}</div>
      <h3 className="product__name">{name}</h3>
      <div className="product__rating"><Stars value={rating} /><small>({reviews})</small></div>
      <strong className="product__price">{brl(price)}</strong>
      {fullPrice !== price && <small className="product__full">{brl(fullPrice)} à vista</small>}
    </a>
  );
}
