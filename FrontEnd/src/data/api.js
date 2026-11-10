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

// --------------------------------------------------------------------------
// Autenticação (Sanctum tokens)
// --------------------------------------------------------------------------
const TOKEN_KEY = "auth_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/** Headers padrão + Authorization quando há token salvo. */
export function authHeaders(extra = {}) {
  const token = getToken();
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

/** POST /api/auth/login — troca credenciais por { user, token }. */
export async function login({ username, password }) {
  if (!username.trim() || !password) throw new Error("Informe usuário e senha.");

  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ email: username.trim(), password }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message ?? "Não foi possível entrar. Verifique usuário e senha.");
  }

  setToken(json.token);
  return json.user; // { id, name, email, role }
}

/** POST /api/auth/register */
export async function register({ name, email, password }) {
  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message ?? Object.values(json?.errors ?? {})[0]?.[0] ?? "Falha ao criar conta.");
  }

  setToken(json.token);
  return json.user;
}

/** POST /api/auth/logout */
export async function logout() {
  try {
    await fetch(`${API}/auth/logout`, { method: "POST", headers: authHeaders() });
  } finally {
    clearToken();
  }
}

/** GET /api/auth/me — valida o token salvo; retorna o usuário ou null. */
export async function fetchMe() {
  if (!getToken()) return null;
  const res = await fetch(`${API}/auth/me`, { headers: authHeaders() });
  if (!res.ok) {
    clearToken();
    return null;
  }
  const json = await res.json();
  return json.data ?? json;
}

/** DELETE /api/cart — esvazia o carrinho resolvido (usuário autenticado). */
export async function clearCart() {
  const res = await fetch(`${API}/cart`, { method: "DELETE", headers: cartHeaders() });
  if (!res.ok) throw new Error(`Falha ao esvaziar carrinho (HTTP ${res.status})`);
}

// --------------------------------------------------------------------------
// Endereços
// --------------------------------------------------------------------------
/** GET /api/addresses — endereços do usuário autenticado.
 *  AddressResource envia apenas { id, user_id, address }. */
export async function fetchAddresses() {
  const res = await fetch(`${API}/addresses`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Falha ao buscar endereços (HTTP ${res.status})`);
  return list(await res.json()).map((a) => ({
    id: String(a.id),
    label: `Endereço #${a.id}`,
    text: a.address,
    isDefault: false,
  }));
}

// --------------------------------------------------------------------------
// Token de convidado: a API cria/resolves carrinhos por `guest_token` para
// visitantes. Precisa ser o MESMO token em todas as chamadas de carrinho.
// --------------------------------------------------------------------------
const GUEST_KEY = "guest_token";
export function getGuestToken() {
  let t = localStorage.getItem(GUEST_KEY);
  if (!t) {
    t = crypto.randomUUID?.() ?? `g-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(GUEST_KEY, t);
  }
  return t;
}

/** Headers de carrinho: Authorization se logado, senão guest_token. */
function cartHeaders() {
  return getToken()
    ? authHeaders()
    : { Accept: "application/json", "Content-Type": "application/json", "X-Guest-Token": getGuestToken() };
}

/** Corpo de carrinho: inclui guest_token quando visitante (a API lê do body OU da query). */
function cartBody(extra = {}) {
  return getToken() ? extra : { guest_token: getGuestToken(), ...extra };
}

/** GET /api/cart — carrinho real do servidor (itens com product_id/quantity). */
async function fetchServerCart() {
  const sep = API.includes("?") ? "&" : "?";
  const qs = getToken() ? "" : `${sep}guest_token=${encodeURIComponent(getGuestToken())}`;
  const res = await fetch(`${API}/cart${qs}`, { headers: cartHeaders() });
  if (!res.ok) throw new Error(`Falha ao consultar o carrinho (HTTP ${res.status})`);
  const json = await res.json();
  return (json.items ?? []).map((i) => ({ itemId: i.id, productId: i.product_id, quantity: i.quantity }));
}

async function postCartItem(productId, quantity) {
  const res = await fetch(`${API}/cart/items`, {
    method: "POST",
    headers: cartHeaders(),
    body: JSON.stringify(cartBody({ product_id: productId, quantity })),
  });
  return res;
}

async function patchCartItem(itemId, quantity) {
  const res = await fetch(`${API}/cart/items/${itemId}`, {
    method: "PATCH",
    headers: cartHeaders(),
    body: JSON.stringify(cartBody({ quantity })),
  });
  return res;
}

const errMessage = async (res, fallback) => (await res.json().catch(() => ({})))?.message ?? fallback;

/** A mensagem de estoque da API traz "(disponível: N)"; extrai N para limitar a quantidade. */
const availableFrom = (msg) => Number(msg.match(/dispon[ií]vel:\s*(\d+)/i)?.[1] ?? NaN);

/**
 * Faz o carrinho do SERVIDOR ficar igual ao carrinho local, reconciliando com
 * o estado REAL (GET /cart) em vez de presumir. Também limita cada quantidade
 * ao estoque atual informado pela API — nunca deixa o carrinho inválido.
 */
export async function syncCart(items) {
  const wanted = new Map(items.map((i) => [Number(i.id), i]));
  const server = await fetchServerCart();

  // Remove do servidor o que não está mais no carrinho local.
  for (const s of server) {
    if (wanted.has(Number(s.productId))) continue;
    const res = await fetch(`${API}/cart/items/${s.itemId}`, {
      method: "DELETE",
      headers: cartHeaders(),
      body: JSON.stringify(cartBody()),
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(await errMessage(res, `Falha ao remover um item do carrinho (HTTP ${res.status}).`));
    }
  }

  // Ajusta cada item local à quantidade/estoque atuais.
  for (const [productId, local] of wanted) {
    const onServer = server.find((s) => Number(s.productId) === productId);
    let qty = local.quantity;

    let res = onServer
      ? await patchCartItem(onServer.itemId, qty)
      : await postCartItem(productId, qty);

    // Quantidade pedida acima do estoque: limita ao disponível e tenta de novo.
    if (res.status === 422) {
      const avail = availableFrom(await errMessage(res, ""));
      if (!Number.isFinite(avail)) {
        throw new Error(await errMessage(res, `Falha ao atualizar "${local.name}" no carrinho.`));
      }
      if (avail <= 0) {
        if (onServer) await fetch(`${API}/cart/items/${onServer.itemId}`, { method: "DELETE", headers: cartHeaders(), body: JSON.stringify(cartBody()) });
        continue; // sem estoque: simplesmente não vai para o pedido
      }
      qty = avail;
      res = onServer ? await patchCartItem(onServer.itemId, qty) : await postCartItem(productId, qty);
    }
    if (!res.ok && res.status !== 422) {
      throw new Error(await errMessage(res, `Falha ao atualizar "${local.name}" no carrinho (HTTP ${res.status}).`));
    }
  }
}

/** Chamar LOGO APÓS login/registro: mescla o carrinho de convidado no carrinho do usuário. */
export async function mergeCartAfterAuth() {
  const res = await fetch(`${API}/cart/merge`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ guest_token: getGuestToken() }),
  });
  if (!res.ok) console.warn("Falha ao mesclar carrinho de convidado (seguindo com o do usuário).", res.status);
}

/** POST /api/checkout — finaliza a compra do carrinho autenticado.
 *  A API aceita apenas `address_id` (ou `address` em texto) e monta o pedido
 *  a partir do carrinho do SERVIDOR, aplicando preços/estoque atuais. */
export async function checkout({ addressId, address } = {}) {
  const res = await fetch(`${API}/checkout`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ...(addressId ? { address_id: addressId } : {}), ...(address ? { address } : {}) }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message ?? "Falha ao finalizar a compra.");
  return json.data ?? json;
}
