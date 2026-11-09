import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Carrossel genérico: recebe `items` e `renderItem`. Rola por página via scroll-snap. */
export default function Carousel({ title, items = [], renderItem, variant = "product" }) {
  const track = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdge({
      start: el.scrollLeft <= 2,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [items, update]);

  const go = (dir) =>
    track.current?.scrollBy({ left: dir * track.current.clientWidth, behavior: "smooth" });

  return (
    <section className="section">
      <h2 className="section__title">{title}</h2>
      <div className="carousel">
        <button className="carousel__btn" aria-label="Anterior" disabled={edge.start} onClick={() => go(-1)}>
          <ChevronLeft size={22} />
        </button>
        <div className={`carousel__track carousel__track--${variant}`} ref={track} onScroll={update}>
          {items.map((item) => (
            <div className="carousel__slide" key={item.id}>{renderItem(item)}</div>
          ))}
        </div>
        <button className="carousel__btn" aria-label="Próximo" disabled={edge.end} onClick={() => go(1)}>
          <ChevronRight size={22} />
        </button>
      </div>
    </section>
  );
}
