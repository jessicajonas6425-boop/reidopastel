import React, { useState, useEffect, useRef } from 'react';
import { Product, OrderItem } from '../types';
import { Search, Plus, Minus, Sparkles, Filter, AlertCircle, ShoppingCart, MapPin, Heart, Flame } from 'lucide-react';
import { motion } from 'motion/react';

interface MenuSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  cartCount: number;
  onOpenCart: () => void;
  cartItems?: OrderItem[];
  onUpdateQty?: (productId: string, quantity: number) => void;
  onRemoveItem?: (productId: string) => void;
}

export default function MenuSection({ 
  products, 
  onAddToCart, 
  cartCount, 
  onOpenCart,
  cartItems = [],
  onUpdateQty,
  onRemoveItem
}: MenuSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('TODOS');

  const PREFERRED_ORDER = [
    'COMBOS DISPONÍVEIS',
    'EMPADAS',
    'EMPADÃO',
    'SALGADINHOS (20G)',
    'PASTÉIS TRADICIONAIS',
    'TRADICIONAIS C/ QUEIJO',
    'TRADICIONAIS C/ CHEEDAR',
    'DUPLOS DE QUEIJO - 2X MAIS RECHEIO',
    'CALABRESA',
    'CAMARÃO',
    'CARNE SECA',
    'AVENTURE-SE',
    'NACIONALIDADES',
    'PEITO DE PERU',
    'X-PASTEL',
    'PASTEL DOCE'
  ];

  // Extract all categories dynamically and order them: COMBO categories first, then others
  const uniqueCategories = Array.from(new Set(products.map(p => p.category)));
  uniqueCategories.sort((a, b) => {
    let idxA = PREFERRED_ORDER.indexOf(a);
    let idxB = PREFERRED_ORDER.indexOf(b);
    if (idxA === -1) idxA = 999;
    if (idxB === -1) idxB = 999;
    if (idxA !== idxB) return idxA - idxB;
    return a.localeCompare(b);
  });
  const categoriesList = ['TODOS', ...uniqueCategories];

  // Helper mapping categories to attractive emojis
  const getCategoryEmoji = (category: string): string => {
    const norm = category.toUpperCase();
    if (norm === 'TODOS') return '🍽️';
    if (norm.includes('EMPADÃO') || norm.includes('EMPADAO')) return '🥮';
    if (norm.includes('EMPADA')) return '🥧';
    if (norm.includes('SALGADINHO')) return '🧆';
    if (norm.includes('COMBO')) return '🎁';
    if (norm.includes('DOCE') || norm.includes('MEL') || norm.includes('CHOCOLATE')) return '🍫';
    if (norm.includes('BEBIDA')) return '🥤';
    if (norm.includes('NACIONALIDADE')) return '🌍';
    if (norm.includes('ESPECIAL') || norm.includes('IMPERIAL')) return '👑';
    if (norm.includes('PROMO')) return '🔥';
    if (norm.includes('CALABRESA')) return '🥓';
    if (norm.includes('CAMARÃO') || norm.includes('CAMARAO')) return '🍤';
    if (norm.includes('CARNE SECA') || norm.includes('SECA')) return '🥩';
    if (norm.includes('AVENTURE-SE') || norm.includes('AVENTURE')) return '🧭';
    if (norm.includes('PEITO DE PERU') || norm.includes('PERU')) return '🦃';
    if (norm.includes('X-PASTEL')) return '🍔';
    if (norm.includes('DUPLOS DE QUEIJO') || norm.includes('DUPLO')) return '🧀';
    if (norm.includes('CLASSIC') || norm.includes('TRADICIONAL')) return '🥟';
    return '🥟';
  };

  // Filter products based on search query
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Calculate cart count per product for the interactive quantity badges
  const getProductCartItem = (productId: string): OrderItem | undefined => {
    return cartItems.find(item => item.id === productId);
  };

  const handleDecreaseQty = (product: Product) => {
    const cardItem = getProductCartItem(product.id);
    if (!cardItem) return;
    
    if (cardItem.quantity > 1) {
      if (onUpdateQty) onUpdateQty(product.id, cardItem.quantity - 1);
    } else {
      if (onRemoveItem) onRemoveItem(product.id);
    }
  };

  const handleIncreaseQty = (product: Product) => {
    const cardItem = getProductCartItem(product.id);
    if (cardItem) {
      if (onUpdateQty) onUpdateQty(product.id, cardItem.quantity + 1);
    } else {
      onAddToCart(product);
    }
  };

  const scrollToCategoryGroup = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setActiveTab(categoryName);

    if (categoryName === 'TODOS') {
      const topNode = document.getElementById('menu_root');
      if (topNode) {
        topNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    const groupNode = document.getElementById(`category-group-${categoryName}`);
    if (groupNode) {
      // 100px buffer to clear the sticky headers comfortably
      const yOffset = -120; 
      const y = groupNode.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Monitor scroll section to auto-highlight active category tab like iFood
  useEffect(() => {
    if (searchQuery.trim() !== '') return; // skip when searching

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;
      
      // Look through each category section's bounds
      for (const cat of categoriesList) {
        if (cat === 'TODOS') continue;
        const el = document.getElementById(`category-group-${cat}`);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveTab(cat);
            return;
          }
        }
      }
      setActiveTab('TODOS');
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categoriesList, searchQuery]);

  return (
    <div className="space-y-4" id="menu_root">
      
      {/* SECTION A: DETAILED iFOOD STYLE RESTAURANT INFO CARD */}
      <div className="bg-white rounded-xl p-3 sm:p-4 border border-stone-200/75 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-brand-yellow/35 bg-zinc-900 flex-shrink-0 flex items-center justify-center shadow-xs select-none animate-royal-fade-in">
            <img
              src="https://i.postimg.cc/sXzSjhkh/702290933-3104997339685659-6402091820826444400-n.jpg"
              alt="Rei do Pastel Logo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-lg font-black text-[#1A1A1A] tracking-tight uppercase">Rei do Pastel</h2>
              <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Aberto
              </span>
            </div>
            
            <p className="text-[11px] text-stone-500 mt-0.5 font-semibold flex items-center gap-1 flex-wrap">
              <span>⭐ 4.9 Super Restaurante</span>
              <span className="text-stone-300">•</span>
              <span>Pastelaria & Salgados Imperial</span>
              <span className="text-stone-300">•</span>
              <span>Nova Iguaçu</span>
            </p>

            <p className="text-[10px] text-stone-400 mt-0.5 font-medium/40">
              Entrega rápida • Distância Real via GPS
            </p>
          </div>
        </div>

        {/* Highlight Stats badge on side */}
        <div className="bg-stone-50 border border-stone-100/80 rounded-lg p-2 flex gap-3 text-center divide-x divide-stone-200 self-stretch sm:self-auto justify-around text-xs">
          <div className="px-1">
            <p className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Preparo</p>
            <p className="text-xs font-black text-[#2E2E2E]">15-25 min</p>
          </div>
          <div className="pl-3 pr-1">
            <p className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Fritura</p>
            <p className="text-xs font-black text-brand-red flex items-center justify-center gap-0.5">
              <Flame size={10} className="fill-brand-red animate-pulse" /> Frito na Hora
            </p>
          </div>
        </div>
      </div>

      {/* SECTION B: SEARCH INPUT BAR */}
      <div className="relative w-full shadow-xs rounded-xl">
        <input
          type="text"
          placeholder="Busque por pastel, combo real ou bebida no cardápio..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white text-stone-850 border border-stone-200 rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-red/30 focus:border-brand-red/80 transition-all shadow-xs"
        />
        <Search className="absolute left-3 top-3 text-stone-400" size={15} />
      </div>

      {/* SECTION C: STICKY iFOOD CATEGORY SELECTOR - Wrapping layout instead of horizontal scroll */}
      <div className="sticky top-[69px] z-30 bg-bg-gray/95 backdrop-blur-md py-2 border-b border-stone-200/40 flex flex-wrap gap-1.5 justify-start" id="ifood-sticky-categories">
        {categoriesList.map((cat) => {
          const isActive = searchQuery ? selectedCategory === cat : activeTab === cat;
          return (
            <button
              key={cat}
              onClick={() => scrollToCategoryGroup(cat)}
              className={`px-2.5 py-1.5 rounded-full text-[10px] font-black transition-all duration-150 border-1.5 cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                isActive 
                  ? 'bg-brand-red text-white border-brand-red' 
                  : 'bg-white hover:bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300'
              }`}
            >
              <span>{getCategoryEmoji(cat)}</span>
              <span className="uppercase tracking-wider text-[10px] font-black">{cat}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION D: THE SHOWCASE WINDOW GROUPED BY CATEGORY */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white border border-stone-200 rounded-2xl p-4">
          <AlertCircle size={36} className="text-brand-red mx-auto mb-2" />
          <h3 className="font-sans text-sm text-brand-dark mb-1 font-extrabold">Nenhum pastel de ouro encontrado</h3>
          <p className="text-[11px] text-stone-500 max-w-xs mx-auto">Tente buscar por outros nomes de recheio ou selecione outra categoria no menu acima.</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {categoriesList.map(category => {
            // If viewing TODOS or currently filtering via search bar
            const categoryProducts = searchQuery 
              ? filteredProducts.filter(p => p.category === category)
              : (category === 'TODOS' ? [] : filteredProducts.filter(p => p.category === category));

            if (category === 'TODOS' && !searchQuery) return null;
            if (categoryProducts.length === 0) return null;

            return (
              <div 
                key={category} 
                id={`category-group-${category}`} 
                className="scroll-mt-[135px] space-y-2.5"
              >
                {/* Visual Section Header */}
                <div className="flex items-center gap-1.5 border-b border-stone-200/50 pb-1.5 mb-1">
                  <span className="text-xl">{getCategoryEmoji(category)}</span>
                  <h3 className="font-sans text-xs font-black text-stone-850 uppercase tracking-wider">
                    {category}
                  </h3>
                  <span className="text-[9px] text-stone-450 font-mono font-bold bg-stone-100 px-1.5 py-0.5 rounded-full ml-2">
                    {categoryProducts.length} itens
                  </span>
                </div>

                {/* iFood-Style Flex grid row list layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryProducts.map((product) => {
                    const cartItem = getProductCartItem(product.id);
                    const isCombo = product.category.toUpperCase().includes('COMBO') || product.name.toLowerCase().includes('combo');
                    
                    return (
                      <div
                        key={product.id}
                        id={`product_${product.id}`}
                        className="bg-white border border-stone-150 rounded-xl p-3 flex justify-between items-stretch gap-3 shadow-2xs hover:shadow-xs hover:border-brand-red/10 transition-all duration-250 animate-royal-fade-in"
                      >
                        {/* LEFT CONTENT: Title, description, tags, price */}
                        <div className="flex-1 pr-1 flex flex-col justify-between py-0.5 min-w-0">
                          <div>
                            {/* Category & Combo indicator badge */}
                            <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                              {isCombo && (
                                <span className="bg-amber-100 text-amber-805 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5 uppercase tracking-wide">
                                  👑 COMBO IMPERIAL
                                </span>
                              )}
                              {!product.available && (
                                <span className="bg-stone-105 text-stone-500 text-[8px] font-black px-1.5 py-0.5 rounded border border-stone-200 uppercase tracking-wide">
                                  ESGOTADO
                                </span>
                              )}
                            </div>

                            {/* Product Name */}
                            <h4 className="font-sans text-xs sm:text-sm font-black text-stone-900 truncate group-hover:text-brand-red transition-colors leading-tight">
                              {product.name}
                            </h4>

                            {/* Product Description */}
                            <p className="text-stone-450 line-clamp-2 text-[10px] sm:text-[11px] font-semibold mt-0.5 leading-normal mb-1">
                              {product.description || 'Delicioso pastel artesanal imperial, frito na hora com óleo novinho e acompanhado com recheio legítimo.'}
                            </p>
                          </div>

                          {/* Price */}
                          <div className="flex items-baseline gap-1.5 mt-auto">
                            <span className="text-brand-dark font-black text-sm sm:text-base">
                              R$ {Number(product.price).toFixed(2)}
                            </span>
                            {isCombo && (
                              <span className="text-[9px] text-stone-400 line-through">
                                R$ {Number(product.price * 1.2).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* RIGHT CONTENT: Dynamic golden pastel illustration backdrop + "Adicionar" button overlay */}
                        <div className="flex-shrink-0 relative w-[80px] sm:w-[94px] h-[80px] sm:h-[94px] select-none">
                          {/* Rich visually-designed backdrop with emoji or custom images */}
                          <div className="w-full h-full bg-gradient-to-br from-amber-50 to-orange-100/30 rounded-xl border border-stone-100/80 shadow-inner flex flex-col items-center justify-center p-1.5 text-center relative overflow-hidden">
                            {product.imageUrl ? (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name}
                                referrerPolicy="no-referrer"
                                className={`w-full h-full object-cover rounded-xl ${!product.available ? 'opacity-30 grayscale' : ''}`}
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center">
                                <span className={`text-[36px] sm:text-[40px] drop-shadow-sm transition-transform ${product.available ? "hover:scale-110 active:scale-95 cursor-pointer duration-200" : "opacity-30"}`}>
                                  {isCombo ? '🎁' : (product.category.toUpperCase().includes('BEBIDA') ? '🥤' : (product.category.toUpperCase().includes('DOCE') ? '🍫' : '🥟'))}
                                </span>
                                <span className="text-[8px] uppercase font-black text-amber-900/35 font-mono tracking-wider mt-0.5">
                                  REI DO PASTEL
                                </span>
                              </div>
                            )}

                            {/* Blurred out of stock layout */}
                            {!product.available && (
                              <div className="absolute inset-0 bg-stone-100/40 backdrop-blur-xs flex items-center justify-center text-center">
                                <span className="bg-neutral-700 text-white text-[8px] font-black py-0.5 px-1.5 rounded shadow border border-neutral-800 uppercase tracking-wider">
                                  Acabou!
                                </span>
                              </div>
                            )}
                          </div>

                          {/* INTERACTIVE iFOOD ADD / QTY CONTROLLER OVERLAY */}
                          {product.available && (
                            <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-[90%] z-10">
                              {cartItem ? (
                                <div className="bg-brand-red text-white py-0.5 px-1 sm:px-1.5 rounded-lg shadow-md flex items-center justify-between border border-brand-red scale-102 transition-all">
                                  <button
                                    onClick={() => handleDecreaseQty(product)}
                                    className="p-0.5 hover:bg-red-700 active:scale-75 rounded transition-all text-white flex items-center justify-center cursor-pointer"
                                    title="Diminuir"
                                  >
                                    <Minus size={9} strokeWidth={4} />
                                  </button>
                                  <span className="font-bold text-[10px] font-sans select-none px-1">
                                    {cartItem.quantity}
                                  </span>
                                  <button
                                    onClick={() => handleIncreaseQty(product)}
                                    className="p-0.5 hover:bg-red-700 active:scale-75 rounded transition-all text-white flex items-center justify-center cursor-pointer"
                                    title="Aumentar"
                                  >
                                    <Plus size={9} strokeWidth={4} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => onAddToCart(product)}
                                  className="w-full bg-white text-brand-red border border-stone-200 hover:border-brand-red/30 hover:bg-stone-50 py-0.5 px-1 text-[9px] font-black rounded-lg shadow-sm flex items-center justify-center gap-0.5 transition-all outline-none cursor-pointer uppercase tracking-tighter whitespace-nowrap overflow-hidden"
                                >
                                  <Plus size={9} strokeWidth={4} /> ADICIONAR
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}
