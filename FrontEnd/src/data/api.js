// Integração com a API Laravel. Ajuste VITE_API_URL no .env (veja .env.example).
import { clearPersistedCart, replacePersistedCart } from "./cart";

export const API = import.meta.env.VITE_API_URL ?? "http://localhost:80/api";

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

/** POST /api/auth/register
 *  Mesmos nomes de campos do updateProfile (PATCH /auth/me) — ajuste aqui se o Laravel usar outros. */
export async function register({ name, email, password, docType, doc, birth }) {
  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      email,
      password,
      document_type: docType, // "cpf" | "cnpj"
      document: String(doc ?? "").replace(/\D/g, ""),
      birth_date: docType === "cpf" ? birth : null,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message ?? Object.values(json?.errors ?? {})[0]?.[0] ?? "Falha ao criar conta.");
  }

  setToken(json.token);
  return json.user;
}

/**
 * Recarrega o carrinho LOCAL a partir do carrinho do SERVIDOR (do usuário
 * logado, ou do convidado). Usado após login/registro e ao restaurar sessão,
 * para que o carrinho da conta "volte" depois de um logout.
 */
export async function loadCartFromServer() {
  try {
    const sep = API.includes("?") ? "&" : "?";
    const qs = getToken() ? "" : `${sep}guest_token=${encodeURIComponent(getGuestToken())}`;
    const res = await fetch(`${API}/cart${qs}`, { headers: cartHeaders() });
    if (!res.ok) return;
    const json = await res.json();
    const items = (json.items ?? [])
      .filter((i) => i.product)
      .map((i) => ({
        id: i.product.id,
        sku: i.product.sku ?? "",
        name: i.product.name,
        image: i.product.image ?? "",
        price: Number(i.product.price),
        fullPrice: Number(i.product.full_price ?? i.product.price),
        stock: i.product.stock ?? 0,
        quantity: i.quantity,
      }));
    replacePersistedCart(items);
  } catch (err) {
    console.warn("Falha ao recarregar o carrinho do servidor.", err);
  }
}

/** POST /api/auth/logout */
export async function logout() {
  try {
    await fetch(`${API}/auth/logout`, { method: "POST", headers: authHeaders() });
  } finally {
    clearToken();
    resetGuestToken(); // próximo visitante começa um carrinho de convidado novo
    clearPersistedCart(); // o carrinho NÃO sobrevive ao logout
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
/** Descarta o token de convidado atual (o carrinho ligado a ele deixa de ser usado). */
export function resetGuestToken() {
  localStorage.removeItem(GUEST_KEY);
}

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

/**
 * Como syncCart, mas FORÇANDO a resolução como CONVIDADO (headers sem
 * Authorization + guest_token explícito). Usada logo antes do merge: os itens
 * locais precisam ir para o carrinho de convidado, não para o da conta.
 */
async function syncCartAsGuest(items) {
  const guestToken = getGuestToken();
  const guestHeaders = { Accept: "application/json", "Content-Type": "application/json", "X-Guest-Token": guestToken };
  const guestBody = (extra = {}) => ({ guest_token: guestToken, ...extra });
  const wanted = new Map(items.map((i) => [Number(i.id), i]));

  const sep = API.includes("?") ? "&" : "?";
  const res = await fetch(`${API}/cart${sep}guest_token=${encodeURIComponent(guestToken)}`, { headers: guestHeaders });
  if (!res.ok) throw new Error(`Falha ao consultar o carrinho (HTTP ${res.status})`);
  const json = await res.json();
  const server = (json.items ?? []).map((i) => ({ itemId: i.id, productId: i.product_id, quantity: i.quantity }));

  // Remove do servidor o que não está mais no carrinho local.
  for (const s of server) {
    if (wanted.has(Number(s.productId))) continue;
    await fetch(`${API}/cart/items/${s.itemId}`, {
      method: "DELETE",
      headers: guestHeaders,
      body: JSON.stringify(guestBody()),
    });
  }

  // Garante cada item local no carrinho de convidado.
  for (const [productId, local] of wanted) {
    const onServer = server.find((s) => Number(s.productId) === productId);
    const response = onServer
      ? await fetch(`${API}/cart/items/${onServer.itemId}`, {
          method: "PATCH",
          headers: guestHeaders,
          body: JSON.stringify(guestBody({ quantity: local.quantity })),
        })
      : await fetch(`${API}/cart/items`, {
          method: "POST",
          headers: guestHeaders,
          body: JSON.stringify(guestBody({ product_id: productId, quantity: local.quantity })),
        });
    if (!response.ok && response.status !== 422) {
      throw new Error(await errMessage(response, `Falha ao atualizar "${local.name}" no carrinho (HTTP ${response.status}).`));
    }
  }
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

/**
 * Chamar LOGO APÓS login/registro: mescla o carrinho de convidado no carrinho do usuário.
 *
 * Importante: os itens adicionados como visitante vivem SÓ no localStorage até o
 * checkout (syncCart é chamado apenas lá). Sem a sincronização abaixo, o carrinho
 * de convidado no SERVIDOR estaria vazio no momento do merge — e o carrinho da
 * conta vazio apagaria os itens locais logo depois (loadCartFromServer).
 */
export async function mergeCartAfterAuth(localItems = []) {
  // 1. Espelha o carrinho LOCAL no carrinho de convidado do servidor (ainda
  //    autenticado NÃO vale aqui: o corpo leva guest_token e os headers vão sem
  //    Authorization, para o merge pegar exatamente esse carrinho de visitante).
  if (localItems.length && getGuestToken()) {
    try {
      await syncCartAsGuest(localItems);
    } catch (err) {
      console.warn("Falha ao sincronizar o carrinho local antes da mesclagem.", err);
    }
  }

  // 2. Mescla o carrinho de convidado no carrinho da conta (autenticado).
  const res = await fetch(`${API}/cart/merge`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ guest_token: getGuestToken() }),
  });
  if (!res.ok) {
    console.warn("Falha ao mesclar carrinho de convidado (seguindo com o do usuário).", res.status);
    return;
  }
  // O carrinho de convidado virou parte da conta: descarta o token para que um
  // futuro logout/login de OUTRO usuário não reaproveite o mesmo carrinho.
  resetGuestToken();
}

/** POST /api/checkout — finaliza a compra do carrinho autenticado.
 *  A API aceita apenas `address_id` (ou `address` em texto) e monta o pedido
 *  a partir do carrinho do SERVIDOR, aplicando preços/estoque atuais. */
export async function checkout({ addressId, address, carrier, shippingPrice } = {}) {
  const res = await fetch(`${API}/checkout`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      ...(addressId ? { address_id: addressId } : {}),
      ...(address ? { address } : {}),
      // Frete escolhido no checkout: a API espera snake_case.
      ...(carrier ? { carrier } : {}),
      ...(shippingPrice != null ? { shipping_price: shippingPrice } : {}),
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message ?? "Falha ao finalizar a compra.");
  return json.data ?? json;
}

// --------------------------------------------------------------------------
// Perfil do usuário e CRUD de endereços
// --------------------------------------------------------------------------
const fromAddress = (a) => ({
  id: String(a.id),
  label: `Endereço #${a.id}`,
  text: a.address,
  isDefault: false,
});

const apiError = async (res, fallback) => {
  const json = await res.json().catch(() => ({}));
  return json?.message ?? Object.values(json?.errors ?? {})[0]?.[0] ?? fallback;
};

/** PATCH /api/auth/me — atualiza os dados pessoais do usuário autenticado.
 *  ATENÇÃO: ajuste a rota e os nomes dos campos aqui se o Laravel usar outros. */
export async function updateProfile({ name, email, docType, doc, birth }) {
  const res = await fetch(`${API}/auth/me`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({
      name,
      email,
      document_type: docType, // "cpf" | "cnpj"
      document: String(doc ?? "").replace(/\D/g, ""),
      birth_date: docType === "cpf" ? birth : null,
    }),
  });
  if (!res.ok) throw new Error(await apiError(res, `Falha ao salvar os dados (HTTP ${res.status}).`));
  const json = await res.json().catch(() => ({}));
  return json.data ?? json;
}

/** POST /api/addresses */
export async function createAddress(address) {
  const res = await fetch(`${API}/addresses`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ address }) });
  if (!res.ok) throw new Error(await apiError(res, `Falha ao salvar o endereço (HTTP ${res.status}).`));
  const json = await res.json();
  return fromAddress(json.data ?? json);
}

/** PUT /api/addresses/:id */
export async function updateAddress(id, address) {
  const res = await fetch(`${API}/addresses/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ address }) });
  if (!res.ok) throw new Error(await apiError(res, `Falha ao atualizar o endereço (HTTP ${res.status}).`));
  const json = await res.json();
  return fromAddress(json.data ?? json);
}

/** DELETE /api/addresses/:id */
export async function deleteAddress(id) {
  const res = await fetch(`${API}/addresses/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok && res.status !== 404) throw new Error(await apiError(res, `Falha ao remover o endereço (HTTP ${res.status}).`));
}

// --------------------------------------------------------------------------
// Pedidos
// --------------------------------------------------------------------------
/** Normaliza o status da API para "preparing" | "shipped" | "delivered". */
const orderStatus = (s) => {
  const v = String(s ?? "").toLowerCase();
  if (/deliver|entreg|finaliz|complet/.test(v)) return "delivered";
  if (/ship|post|transit|sent|enviad/.test(v)) return "shipped";
  return "preparing";
};

/** Converte um pedido da API. Tolera nomes de campos alternativos — ajuste aqui se o Laravel usar outros. */
export const fromOrder = (o) => {
  const items = (o.items ?? o.order_items ?? []).map((i) => {
    const p = i.product ?? {};
    return {
      id: i.id,
      name: i.name ?? i.product_name ?? p.name ?? `Produto #${i.product_id}`,
      quantity: Number(i.quantity ?? 1),
      price: Number(i.unit_price ?? i.price ?? p.price ?? 0),
      image: mainImage(p.images) || i.image || "",
    };
  });
  const shipping = Number(o.shipping_price ?? o.shipping_cost ?? o.shipping ?? 0);
  const itemsTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  return {
    id: o.id,
    createdAt: o.created_at ?? o.createdAt,
    status: orderStatus(o.status),
    carrier: String(o.carrier ?? o.shipping_carrier ?? "").toLowerCase(),
    trackingUrl: o.tracking_url ?? null,
    shipping,
    total: Number(o.total ?? o.total_price ?? itemsTotal + shipping),
    items,
  };
};

/** GET /api/orders — pedidos do usuário autenticado, do mais recente ao mais antigo. */
export async function fetchOrders() {
  const res = await fetch(`${API}/orders`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Falha ao buscar pedidos (HTTP ${res.status})`);
  return list(await res.json())
    .map(fromOrder)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}