export default function StoreSidebar({
  sortOptions = [], sort, onSort,
  priceHint = {}, price, onPrice,
  manufacturers = [], manufacturer, onManufacturer,
  categories = [], activeSlug,
}) {
  return (
    <aside className="store__side">
      <h2 className="store__side-title">Ordenar</h2>
      <select className="store__select" aria-label="Ordenar produtos" value={sort} onChange={(e) => onSort(e.target.value)}>
        {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <h2 className="store__side-title">Filtros</h2>
      <div className="store__field">
        <span>Preço</span>
        <div className="store__price">
          <label>de R$
            <input inputMode="decimal" placeholder={priceHint.min} value={price.min}
              onChange={(e) => onPrice({ ...price, min: e.target.value })} />
          </label>
          <label>à R$
            <input inputMode="decimal" placeholder={priceHint.max} value={price.max}
              onChange={(e) => onPrice({ ...price, max: e.target.value })} />
          </label>
        </div>
      </div>
      <div className="store__field">
        <label htmlFor="store-maker">Fabricante</label>
        <select id="store-maker" className="store__select" value={manufacturer} onChange={(e) => onManufacturer(e.target.value)}>
          <option value="">Todas</option>
          {manufacturers.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <h2 className="store__side-title store__cats-title">Categorias</h2>
      <ul className="store__cats">
        {categories.map((c) => (
          <li key={c.id}>
            <a href={`/categoria/${c.slug}`} aria-current={c.slug === activeSlug ? "page" : undefined}>{c.name}</a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
