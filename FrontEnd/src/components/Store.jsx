import { useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import StoreSidebar from "./StoreSidebar";

const toNumber = (v) => {
  const n = parseFloat(String(v).trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

const SORTERS = {
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  name: (a, b) => a.name.localeCompare(b.name, "pt-BR"),
  rating: (a, b) => b.rating - a.rating,
};

/** Página de listagem: `slug` é a categoria da URL (/categoria/:slug). */
export default function Store({ slug, categories = [], products = [], sortOptions = [], priceHint }) {
  const [sort, setSort] = useState("");
  const [price, setPrice] = useState({ min: "", max: "" });
  const [manufacturer, setManufacturer] = useState("");

  const active = categories.find((c) => c.slug === slug) ?? categories[0];
  const inCategory = useMemo(() => products.filter((p) => p.category === active?.slug), [products, active]);
  const manufacturers = useMemo(() => [...new Set(inCategory.map((p) => p.manufacturer).filter(Boolean))].sort(), [inCategory]);

  const visible = useMemo(() => {
    const min = toNumber(price.min);
    const max = toNumber(price.max);
    const list = inCategory.filter((p) =>
      (min === null || p.price >= min) &&
      (max === null || p.price <= max) &&
      (!manufacturer || p.manufacturer === manufacturer));
    return SORTERS[sort] ? [...list].sort(SORTERS[sort]) : list;
  }, [inCategory, price, manufacturer, sort]);

  const clear = () => { setSort(""); setPrice({ min: "", max: "" }); setManufacturer(""); };

  return (
    <main className="store">
      <h1 className="store__title">{active?.name}</h1>
      <div className="store__layout">
        <StoreSidebar
          sortOptions={sortOptions} sort={sort} onSort={setSort}
          priceHint={priceHint} price={price} onPrice={setPrice}
          manufacturers={manufacturers} manufacturer={manufacturer} onManufacturer={setManufacturer}
          categories={categories} activeSlug={active?.slug}
        />
        {visible.length ? (
          <ul className="store__grid">
            {visible.map((p) => <li key={p.id} className="store__cell"><ProductCard {...p} /></li>)}
          </ul>
        ) : (
          <div className="store__empty">
            <p>Nenhum produto encontrado.</p>
            <button onClick={clear}>Limpar filtros</button>
          </div>
        )}
      </div>
    </main>
  );
}
