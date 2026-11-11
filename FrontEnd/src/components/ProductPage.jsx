import { useEffect, useState } from "react";
import Carousel from "./Carousel";
import ProductCard, { Stars } from "./ProductCard";
import { brl } from "./format";
import { specLabel } from "../data/api";

const SUMMARY_LIMIT = 300;

/** Página de produto: `product` no formato de fromApiDetail (data/api.js). */
export default function ProductPage({ product, related = [], onAddToCart, onBuyNow }) {
  const { name, sku, stock = 0, rating, reviews = 0, about = "", price, fullPrice, specs = {}, images = [] } = product;
  const [sel, setSel] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => { setSel(0); setOpen(false); }, [product.id]);
  useEffect(() => { document.title = `${name} | Portal Eletro`; }, [name]);

  const current = images[sel] ?? images[0];
  const isLong = about.length > SUMMARY_LIMIT;
  const summary = isLong && !open ? `${about.slice(0, SUMMARY_LIMIT).trimEnd()}… ` : about;
  const soldOut = stock <= 0;
  const rows = Object.entries(specs);

  return (
    <>
      <main className="pdp">
        <div className="pdp__top">
          <div className="pdp__gallery">
            {images.length > 1 && (
              <div className="pdp__thumbs">
                {images.map((img, i) => (
                  <button key={img.id} className="pdp__thumb" aria-label={`Ver imagem ${i + 1}`}
                    aria-pressed={i === sel} onClick={() => setSel(i)}>
                    {img.url && <img src={img.url} alt="" loading="lazy" />}
                  </button>
                ))}
              </div>
            )}
            <div className="pdp__main">{current?.url && <img src={current.url} alt={name} />}</div>
          </div>

          <section className="pdp__info" aria-labelledby="pdp-name">
            <h1 id="pdp-name" className="pdp__name">{name}</h1>
            <p className="pdp__meta">
              Código: <b>{sku}</b><br />
              {soldOut ? "Esgotado" : `${stock} Disponíveis`}
            </p>
            <div className="pdp__rating"><Stars value={rating} /><small>({reviews})</small></div>

            <p className="pdp__summary">
              {summary}
              {isLong && (
                <button className="pdp__more" onClick={() => setOpen((v) => !v)}>
                  {open ? "Ver Menos" : "Ver Mais"}
                </button>
              )}
            </p>

            <strong className="pdp__price">{brl(price)}</strong>
            {fullPrice !== price && <span className="pdp__full">{brl(fullPrice)} à vista</span>}

            <div className="pdp__actions">
              <button className="pdp__btn" disabled={soldOut} onClick={() => onAddToCart?.(product)}>Adicionar ao Carrinho</button>
              <button className="pdp__btn pdp__btn--ghost" disabled={soldOut} onClick={() => onBuyNow?.(product)}>Comprar Agora</button>
            </div>
          </section>
        </div>

        <div className="pdp__body">
          {about && (
            <section aria-labelledby="pdp-about">
              <h2 id="pdp-about" className="pdp__title">Sobre</h2>
              <p className="pdp__about">{about}</p>
            </section>
          )}

          {rows.length > 0 && (
            <section aria-labelledby="pdp-specs">
              <h2 id="pdp-specs" className="pdp__title">Especificações</h2>
              <table className="pdp__specs">
                <tbody>
                  {rows.map(([key, value]) => (
                    <tr key={key}>
                      <th scope="row">{specLabel(key)}</th>
                      <td>{(Array.isArray(value) ? value : [value]).map((l, i) => <div key={i}>{String(l)}</div>)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>
      </main>

      {related.length > 0 && (
        <div className="pdp__related">
          <Carousel title="Produtos Relacionados" variant="related" items={related}
            renderItem={(p) => <ProductCard {...p} />} />
        </div>
      )}
    </>
  );
}
