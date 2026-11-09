// Integração com a API Laravel. Ajuste VITE_API_URL no .env (veja .env.example).
export const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

// Aceita tanto [..] quanto { data: [..] } (API Resources do Laravel).
const list = (json) => json?.data ?? json ?? [];
const headers = {
    'Accept': 'application/json'
}

export const mainImage = (images = []) =>
  [...images].sort((a, b) => a.position - b.position)[0]?.url ?? "";

/** Converte o produto da API (GET /api/products) no formato do ProductCard/Store. */
export const fromApi = (p, categories = []) => {
  const price = Number(p.price);
  return {
    id: p.id,
    name: p.name,
    price,
    fullPrice: Number(p.full_price ?? price), // a API ainda não envia preço "à vista" separado
    rating: Number(p.rating ?? 0),
    reviews: p.reviews_count ?? 0,
    manufacturer: p.manufacturer ?? p.specs?.fabricante ?? "",
    category: categories.find((c) => c.id === p.category_id)?.slug ?? "",
    image: mainImage(p.images),
    images: p.images ?? [], // galeria completa, para a página de detalhe
    href: `/produto/${p.id}`,
  };
};

export async function fetchStoreData() {
  const [cats, prods] = await Promise.all([
    fetch(`${API}/categories`, {
        headers: headers
    }).then((r) => r.json()),
    fetch(`${API}/products`, {
        headers: headers
    }).then((r) => r.json()),
  ]);
  const categories = list(cats);
  return { categories, products: list(prods).map((p) => fromApi(p, categories)) };
}

// Rótulos das especificações (chaves de `specs` da API). Chaves desconhecidas são "humanizadas".
const SPEC_LABELS = {
  microcontrolador: "Microcontrolador",
  tensao: "Tensão de Operação",
  tensao_entrada: "Tensão de Entrada",
  pinos_digitais: "Portas Digitais",
  pinos_analogicos: "Portas Analógicas",
  corrente_io: "Corrente Pinos I/O",
  corrente_3v3: "Corrente Pinos 3,3V",
  memoria_flash: "Memória Flash",
  sram: "SRAM",
  eeprom: "EEPROM",
  clock: "Velocidade do Clock",
};
export const specLabel = (key) =>
  SPEC_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");

/** Converte o produto completo da API (GET /api/products/:id) para a página de produto. */
export const fromApiDetail = (p) => {
  const price = Number(p.price);
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    about: p.about ?? "",
    specs: p.specs ?? {},
    price,
    fullPrice: Number(p.full_price ?? price), // a API ainda não envia preço "à vista" separado
    stock: p.stock ?? 0,
    rating: Number(p.rating ?? 0),
    reviews: p.reviews_count ?? 0,
    categoryId: p.category_id,
    images: [...(p.images ?? [])].sort((a, b) => a.position - b.position),
  };
};

export async function fetchProductData(id) {
  const res = await fetch(`${API}/products/${id}`);
  if (!res.ok) throw new Error(`Produto ${id}: HTTP ${res.status}`);
  const json = await res.json();
  return fromApiDetail(json.data ?? json);
}

// STUB: a API ainda não tem rota de login. Troque por Sanctum (GET /sanctum/csrf-cookie e POST do login)
// e devolva o usuário autenticado no formato { name }.
export async function login({ username, password }) {
  if (!username.trim() || !password) throw new Error("Informe usuário e senha.");
  return { name: username.trim() };
}
