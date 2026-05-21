import React, { useState, useEffect } from 'react';
import { 
  syncProducts, 
  syncSettings, 
  isFirestoreReal 
} from './firebase';
import { Product, AppSettings, Order, OrderItem } from './types';
import { 
  Instagram, 
  Facebook, 
  Sparkles, 
  MapPin, 
  Phone, 
  ShoppingCart, 
  Settings as SettingsIcon, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Flame,
  ChefHat,
  ChevronRight,
  Pizza
} from 'lucide-react';
import MenuSection from './components/MenuSection';
import CartDrawer from './components/CartDrawer';
import AdminPanel from './components/AdminPanel';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  
  // Modals / Panels
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Sincronização em tempo real (Real-time sync)
  useEffect(() => {
    const unsubProducts = syncProducts((freshProducts) => {
      setProducts(freshProducts);
      setIsLoading(false);
    });

    const unsubSettings = syncSettings((freshSettings) => {
      setSettings(freshSettings);
    });

    return () => {
      unsubProducts();
      unsubSettings();
    };
  }, []);

  // 2. Carrinho de Compras (Cart operations)
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        quantity: 1
      }];
    });
    // Open cart drawer immediately for great interactive UX
    setIsCartOpen(true);
  };

  const handleUpdateQty = (productId: string, quantity: number) => {
    setCart((prev) => 
      prev.map(item => 
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleUpdateNotes = (productId: string, notes: string) => {
    setCart((prev) => 
      prev.map(item => 
        item.id === productId ? { ...item, notes } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter(item => item.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Counting total cart items
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Default loading screen
  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4">
        {/* CSS Drawn Crown loader */}
        <div className="w-16 h-16 relative flex items-center justify-center mb-4">
          <div className="absolute w-12 h-12 bg-brand-red rounded-full border border-brand-yellow animate-ping opacity-75" />
          <span className="text-3xl animate-bounce">👑</span>
        </div>
        <h2 className="font-display text-brand-yellow text-2xl tracking-widest uppercase italic font-bold">Rei do Pastel</h2>
        <p className="text-stone-400 text-xs font-mono mt-1 uppercase tracking-widest">O sabor majestoso do verdadeiro pastel</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-bg-gray flex flex-col text-brand-dark font-sans selection:bg-brand-yellow selection:text-brand-dark">
      
      {/* 1. TOP ANNOUNCEMENT / STATUS BAR */}
      <div className={`text-center py-2 px-4 text-xs font-bold transition-colors ${settings.isOpen ? 'bg-brand-yellow text-brand-dark border-b border-brand-yellow/85' : 'bg-brand-red border-b border-brand-dark text-white'}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-1.5 justify-center sm:justify-start">
            <span className={`w-2.5 h-2.5 rounded-full ${settings.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-white'}`} />
            <span>
              {settings.isOpen 
                ? 'CHAME O REI! Cozinha aberta, fritando pastéis em tempo real!' 
                : 'FECHADO NO MOMENTO - Os cozinheiros do palácio estão descansando.'
              }
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px]">
            <span>🛵 Taxa de Entrega: R$ {Number(settings.deliveryFee).toFixed(2)}</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">📍 {settings.address}</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER BAR */}
      <header className="bg-brand-dark border-b-2 border-brand-yellow text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
          
          {/* Logo Title area with Vintage Royal frame inspired by the prompt */}
          <div className="flex items-center gap-3 select-none">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-brand-yellow bg-zinc-900 flex-shrink-0 flex items-center justify-center shadow-[0_2px_6px_rgba(255,193,7,0.3)]">
              <img
                src="https://i.postimg.cc/sXzSjhkh/702290933-3104997339685659-6402091820826444400-n.jpg"
                alt="Logo Rei do Pastel"
                className="w-full h-full object-cover animate-royal-fade-in"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-display text-xl sm:text-2xl font-black italic tracking-widest text-brand-yellow uppercase">Rei do Pastel</h1>
                <span className="bg-brand-yellow/20 text-brand-yellow text-[9px] font-bold px-1.5 py-0.5 rounded border border-brand-yellow/30 uppercase tracking-widest font-mono">Real-Time</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-brand-yellow font-bold uppercase tracking-[3px] leading-none mt-1">the royal delivery</p>
            </div>
          </div>

          {/* Quick header action links */}
          <div className="flex items-center gap-2">
            
            {/* Admin launcher cockpit */}
            <button 
              onClick={() => setIsAdminOpen(true)}
              className="p-2 sm:px-3 sm:py-2 text-stone-300 hover:text-brand-yellow hover:bg-zinc-800 rounded-xl transition-all border border-stone-800 flex items-center gap-1.5 text-xs font-semibold"
              title="Acessar Área Administrativa"
            >
              <SettingsIcon size={16} />
              <span className="hidden sm:inline">Painel Admin</span>
            </button>

            {/* Shopping Cart Header Badge */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative bg-brand-red hover:bg-red-700 text-white font-bold px-3 py-2 sm:px-4.5 rounded-xl border border-brand-red shadow-md flex items-center gap-2 transition-all hover:scale-105 active:scale-95 text-xs"
            >
              <ShoppingCart size={15} />
              <span className="hidden sm:inline">Sacola de Ouro</span>
              <span className="bg-brand-yellow text-brand-dark font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border border-brand-yellow/20">
                {cartCount}
              </span>
            </button>

          </div>

        </div>
      </header>

      {/* 3. HERO VINTAGE DECK */}
      <section className="bg-brand-dark text-white py-6 sm:py-8 px-4 text-center relative overflow-hidden border-b border-brand-yellow/10">
        
        {/* Faded Background items to mimic the logo card */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none flex items-center justify-center">
          <span className="text-[180px] transform -rotate-12">🥟</span>
        </div>

        {settings.flyerUrl ? (
          <div className="max-w-4xl mx-auto relative z-10 transition-all duration-300">
            <span className="inline-flex items-center gap-1.5 bg-brand-red border border-brand-yellow font-black px-4 py-1.5 rounded-full text-[10px] sm:text-[11.5px] text-brand-yellow uppercase tracking-[2px] mb-4.5 animate-pulse shadow-md">
              👑 DIÁRIO DE PROMOÇÕES DO REI 👑
            </span>
            <div className="mx-auto max-w-2xl rounded-2xl md:rounded-3xl border-4 border-brand-yellow/80 overflow-hidden shadow-[0_10px_35px_rgba(255,193,7,0.18)] bg-zinc-950/90 group relative">
              <img
                src={settings.flyerUrl}
                alt="Diário de Promoções do Rei"
                className="w-full h-auto object-contain max-h-[500px] mx-auto group-hover:scale-[1.015] transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 right-3 bg-brand-dark/90 border border-brand-yellow/30 px-2.5 py-1 rounded-lg text-[9px] font-bold text-brand-yellow uppercase tracking-wider backdrop-blur-xs select-none">
                Ofertas Imbatíveis Hoje
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-2.5 relative z-10">
            <div className="inline-flex items-center gap-1 bg-brand-red/10 border border-brand-red/30 px-3 py-1 rounded-full text-[10px] text-brand-yellow font-bold uppercase tracking-wider mb-1">
              <Flame size={10} className="text-brand-yellow" /> Massa Frita e Recheio Transbordando!
            </div>

            <h2 className="font-display text-xl sm:text-3xl md:text-4xl text-brand-yellow font-black tracking-wide mb-1 uppercase italic drop-shadow-xs">OS MELHORES PASTÉIS DE VOSSA REALEZA!</h2>
            <p className="text-stone-300 text-[11px] sm:text-xs max-w-lg mx-auto leading-relaxed font-sans">
              Nossos deliciosos pastéis são feitos artesanalmente, fritos na hora com óleo novinho e acompanhados com recheio em dobro. Escolha seus favoritos abaixo e peça de forma ultra-rápida.
            </p>

            {/* Quick stats items */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-3 max-w-xl mx-auto text-[10px] font-bold">
              <div className="bg-neutral-900/60 p-2 rounded-lg border border-neutral-800/80 flex items-center justify-center gap-1.5 text-stone-300">
                <span>🥐</span> sequinhos & crocantes
              </div>
              <div className="bg-neutral-900/60 p-2 rounded-lg border border-neutral-800/80 flex items-center justify-center gap-1.5 text-stone-300">
                <span>🔥</span> fritos na hora
              </div>
              <div className="bg-neutral-900/60 p-2 rounded-lg border border-neutral-800/80 flex items-center justify-center gap-1.5 text-stone-300">
                <span>⚖️</span> 2x mais recheio
              </div>
              <div className="bg-neutral-900/60 p-2 rounded-lg border border-neutral-800/80 flex items-center justify-center gap-1.5 text-stone-300">
                <span>🚚</span> entrega ultra rápida
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. MAIN BODY MENU AND INTERACTIVE LAYOUT */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 lg:px-6 py-4 md:py-6 flex flex-col lg:flex-row gap-5">
        
        {/* Left main grid column: Menu display list */}
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-end pb-1.5 border-b border-stone-200/40 mb-1">
            <div>
              <h2 className="font-sans text-lg sm:text-xl font-black uppercase text-brand-dark border-l-4 border-brand-red pl-3 flex items-center gap-2">
                Cardápio do Rei
              </h2>
              <p className="text-[11px] text-stone-500 mt-0.5 pl-4">Selecione uma categoria e sinta o aroma imperial</p>
            </div>
          </div>

          <MenuSection 
            products={products}
            onAddToCart={handleAddToCart}
            cartCount={cartCount}
            onOpenCart={() => setIsCartOpen(true)}
            cartItems={cart}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveItem}
          />
        </div>

        {/* Right side contact & operation info board */}
        <div className="w-full md:w-80 space-y-6">
          
          {/* Real time opening notice board */}
          <div className={`p-5 rounded-2xl border bg-white shadow-sm transition-all hover:shadow`}>
            <h3 className={`font-display text-sm tracking-widest font-bold uppercase mb-3 flex items-center gap-1.5 border-b border-stone-100 pb-2 ${settings.isOpen ? 'text-brand-red' : 'text-stone-500'}`}>
              <Clock size={16} /> Funcionamento Real
            </h3>
            <p className="text-stone-700 text-xs leading-relaxed mb-4">
              {settings.isOpen 
                ? 'Nosso palácio da fritura está totalmente aberto! Faça suas seleções no menu e monte o carrinho. Entregamos quentinho na sua porta!' 
                : 'A cozinha do Rei está fechada no momento para descanso ou manutenção. Você pode continuar visualizando nosso cardápio de ouro para as próximas compras.'
              }
            </p>

            {/* Quick Contact line button */}
            <div className="divide-y divide-stone-200 mt-2 text-xs font-medium space-y-2 border-t border-stone-200 pt-2.5">
              <div className="flex items-center gap-2 py-1">
                <Phone size={14} className="text-brand-red flex-shrink-0" />
                <span className="text-stone-750 font-bold">{settings.phone}</span>
              </div>
              <div className="flex items-center gap-2 py-1 pt-2">
                <MapPin size={14} className="text-brand-red flex-shrink-0" />
                <span className="text-stone-605 leading-tight">{settings.address}</span>
              </div>
            </div>
          </div>

          {/* Social connections Card */}
          <div className="bg-brand-dark border border-brand-yellow/15 p-5 rounded-2xl text-stone-300 shadow-md">
            <h3 className="font-display text-xs tracking-widest text-brand-yellow font-bold uppercase mb-4">Acompanhe a Coroa</h3>
            <div className="space-y-3.5">
              
              <a 
                href={`https://instagram.com/${settings.instagram.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 hover:text-brand-yellow transition-all border border-neutral-800 text-xs font-semibold group"
              >
                <span className="flex items-center gap-2">
                  <Instagram size={14} className="text-brand-red fill-brand-red/10" /> Instagram
                </span>
                <span className="text-[10px] text-stone-500 font-mono flex items-center gap-0.5">
                  {settings.instagram} <ChevronRight size={10} />
                </span>
              </a>

              <a 
                href={`https://facebook.com/${settings.facebook}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 hover:text-brand-yellow transition-all border border-neutral-800 text-xs font-semibold group"
              >
                <span className="flex items-center gap-2">
                  <Facebook size={14} className="text-blue-500 fill-blue-500/10" /> Facebook
                </span>
                <span className="text-[10px] text-stone-500 font-mono flex items-center gap-0.5">
                  @{settings.facebook} <ChevronRight size={10} />
                </span>
              </a>

            </div>
          </div>

          {/* Demonstration Notice */}
          {!isFirestoreReal && (
            <div className="bg-amber-50/60 border border-brand-yellow/40 p-4 rounded-2xl text-xs text-stone-800 space-y-1.5 font-mono">
              <div className="flex items-center gap-1 font-bold text-brand-red">
                <AlertTriangle size={14} className="text-brand-red" /> Modo Demonstrativo Ativo
              </div>
              <p className="leading-relaxed text-[11px]">
                Banco de dados local ativado no browser. Todas as ações de adição, remoção, alteração de status de pedidos e controle de configurações funcionam e persistem na hora no preview!
              </p>
            </div>
          )}

        </div>

      </main>

      {/* 5. ROYAL VINTAGE FOOTER */}
      <footer className="bg-brand-dark border-t border-brand-yellow/15 text-stone-400 py-8 text-center text-xs mt-auto px-4">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-brand-yellow">
            <span>👑</span>
            <span className="font-display tracking-widest text-brand-yellow uppercase font-bold italic">Rei do Pastel</span>
            <span>👑</span>
          </div>
          <p className="text-[10px] sm:text-xs">
            © 2026 - Rei do Pastel Delivery. Todos os Direitos Reservados. Todos os fritos são monitorados pela Coroa.
          </p>
          <p className="text-[10px] text-stone-500 max-w-md mx-auto leading-relaxed">
            Os preços, combos de bebidas e recheios podem variar conforme disponibilidades sazonais. Envie o resumo no seu WhatsApp para fritos urgentes.
          </p>
        </div>
      </footer>

      {/* 6. ADMIN PANEL INTERFACE MODAL */}
      <AnimatePresence>
        {isAdminOpen && (
          <AdminPanel 
            products={products}
            settings={settings}
            orders={orders}
            onClose={() => setIsAdminOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* 7. CART DRAWER INTERFACE MODAL */}
      <AnimatePresence>
        {isCartOpen && (
          <CartDrawer 
            cartItems={cart}
            settings={settings}
            onUpdateQty={handleUpdateQty}
            onUpdateNotes={handleUpdateNotes}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onClose={() => setIsCartOpen(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
