import { useEffect, useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Benefits from "./components/Benefits";
import Carousel from "./components/Carousel";
import CategoryCard from "./components/CategoryCard";
import ProductCard from "./components/ProductCard";
import Store from "./components/Store";
import ProductPage from "./components/ProductPage";
import LoginModal from "./components/LoginModal";
import CartPage from "./components/CartPage";
import CheckoutPage from "./components/CheckoutPage";
import Footer from "./components/Footer";
import { mockHome, mockStore, mockProduct, mockUser } from "./data/mock";
import { useCart, cartTotals } from "./data/cart";
import { fetchStoreData, fetchProductData, login, register, fetchMe, logout as apiLogout, mergeCartAfterAuth } from "./data/api";

// Monta a home a partir da API: categorias reais, destaques aleatórios e novidades
// (produtos mais recentes = maior id). Hero, benefícios e rodapé continuam do mock
// enquanto a API não tiver um endpoint próprio de conteúdo institucional.
async function fetchHome() {
  const { categories, products } = await fetchStoreData();
  const featured = [...products].sort(() => Math.random() - 0.5).slice(0, 6);
  const newArrivals = [...products].sort((a, b) => b.id - a.id).slice(0, 6);
  return {
    ...mockHome,
    categories: categories.map((c) => ({
      id: c.id, name: c.name, image: "", href: `/categoria/${c.slug}`,
    })),
    featured,
    newArrivals,
  };
}

// Busca categorias e produtos na API Laravel.
// Só cai nos dados de exemplo se a API realmente falhar (o erro fica visível no console).
async function fetchStore() {
  try {
    return { ...mockStore, ...(await fetchStoreData()) };
  } catch (err) {
    console.error("Falha ao buscar dados da API, usando dados de exemplo:", err);
    return mockStore;
  }
}

// Rotas simples por URL: /categoria/:slug (ou /loja) mostra a loja, /produto/:id o produto; o resto, a home.
const [section, slug] = window.location.pathname.split("/").filter(Boolean);
const isStore = section === "loja" || section === "categoria";
const isProduct = section === "produto";
const isCart = section === "carrinho";
const isCheckout = section === "checkout";

export default function App() {
  const [home, setHome] = useState(mockHome);
  const [store, setStore] = useState(mockStore);
  const [product, setProduct] = useState(mockProduct);
  const cart = useCart(); // itens persistidos no localStorage
  const cartTotal = cartTotals(cart.items).cashSubtotal;
  const [session, setSession] = useState(null); // usuário logado: { name, email, role }
  const [sessionReady, setSessionReady] = useState(false); // true depois de tentar restaurar a sessão
  const [loginOpen, setLoginOpen] = useState(false);

  // Restaura a sessão salva (token do localStorage) ao abrir a página.
  useEffect(() => {
    fetchMe().then((u) => u && setSession(u)).catch(() => {}).finally(() => setSessionReady(true));
  }, []);

  const handleLogin = async (credentials) => {
    setSession(await login(credentials)); // lança erro se falhar; o popup mostra a mensagem
    await mergeCartAfterAuth(); // junta o carrinho de convidado ao do usuário
    setLoginOpen(false);
  };
  const handleLogout = async () => {
    await apiLogout();
    setSession(null);
  };
  const user = session ? { greeting: "Bem-Vindo(a)", action: session.name } : mockUser;

  useEffect(() => {
    // Se a API falhar, a home e a loja seguem com os dados de exemplo.
    fetchHome().then(setHome).catch((err) => {
      console.error("Falha ao carregar a home da API, usando dados de exemplo:", err);
      setHome(mockHome);
    });
    fetchStore().then(setStore).catch(console.error);
    // Se a API falhar, a página segue com mockProduct.
    if (isProduct) fetchProductData(slug).then(setProduct).catch(console.error);
  }, []);

  // Relacionados: outros produtos da mesma categoria.
  const categorySlug = store.categories.find((c) => c.id === product.categoryId)?.slug;
  const related = store.products.filter((p) => p.id !== product.id && p.category === categorySlug);

  return (
    <>
      <Header user={user} cartTotal={cartTotal} onSearch={(q) => console.log("buscar:", q)}
        onCart={() => window.location.assign("/carrinho")}
        onLogin={() => (session ? handleLogout() : setLoginOpen(true))} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSubmit={handleLogin}
        onSignup={() => console.log("cadastro")} />
      {isProduct ? (
        <ProductPage
          product={product}
          related={related}
          onAddToCart={(p) => cart.add(p)}
          onBuyNow={(p) => { cart.add(p); window.location.assign("/carrinho"); }}
        />
      ) : isCheckout ? (
        <CheckoutPage cart={cart} session={session} ready={sessionReady} onRequireLogin={() => setLoginOpen(true)} />
      ) : isCart ? (
        <CartPage cart={cart} session={session} onRequireLogin={() => setLoginOpen(true)} />
      ) : isStore ? (
        <Store slug={slug} {...store} />
      ) : (
        <>
          <Hero {...home.hero} />
          <Benefits items={home.benefits} />
          <main>
            <Carousel title="Categorias" variant="category" items={home.categories}
              renderItem={(c) => <CategoryCard {...c} />} />
            <Carousel title="Destaques" items={home.featured}
              renderItem={(p) => <ProductCard {...p} />} />
            <Carousel title="Novidades" items={home.newArrivals}
              renderItem={(p) => <ProductCard {...p} />} />
          </main>
        </>
      )}
      <Footer {...home.footer} />
    </>
  );
}
