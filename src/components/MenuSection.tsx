import React, { useState } from 'react';
import { Product } from '../types';
import { Search, Plus, Sparkles, Filter, AlertCircle, ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';

interface MenuSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  cartCount: number;
  onOpenCart: () => void;
}

export default function MenuSection({ products, onAddToCart, cartCount, onOpenCart }: MenuSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract all categories dynamically and order them: 'TODOS' first, then COMBO categories, then others
  const uniqueCategories = Array.from(new Set(products.map(p => p.category)));
  const comboCategories = uniqueCategories.filter(cat => cat.toUpperCase().includes('COMBO'));
  const otherCategories = uniqueCategories.filter(cat => !cat.toUpperCase().includes('COMBO'));
  const categories = ['TODOS', ...comboCategories, ...otherCategories];

  // Filter products based on category and search query
  const unfilteredAndMatches = products.filter(product => {
    const matchesCategory = selectedCategory === 'TODOS' || product.category === selectedCategory;
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort products so that combos always appear first (logo de cara na vitrine)
  const filteredProducts = [...unfilteredAndMatches].sort((a, b) => {
    const aIsCombo = a.category.toUpperCase().includes('COMBO') || a.name.toLowerCase().includes('combo');
    const bIsCombo = b.category.toUpperCase().includes('COMBO') || b.name.toLowerCase().includes('combo');
    if (aIsCombo && !bIsCombo) return -1;
    if (!aIsCombo && bIsCombo) return 1;
    return 0; // maintain original relative order
  });

  return (
    <div className="space-y-6" id="menu_root">
      
      {/* Filtering Bar with Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-brand-dark border-2 border-brand-yellow/30 p-4 rounded-2xl shadow-lg">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Buscar por pastel, recheio ou combo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-800 text-white border border-neutral-700 placeholder-zinc-400 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow transition-all font-sans"
          />
          <Search className="absolute left-3.5 top-3 text-brand-yellow" size={16} />
        </div>

        {/* Floating Cart Badge for Mobile Quick-view */}
        <div className="flex items-center gap-2 justify-end w-full md:w-auto">
          {cartCount > 0 && (
            <motion.button 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={onOpenCart}
              className="md:hidden bg-brand-red hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-brand-red shadow-md font-sans"
            >
              <ShoppingCart size={14} /> Ver Meu Carrinho ({cartCount})
            </motion.button>
          )}

          <div className="text-xs text-stone-300 font-sans flex items-center gap-1 bg-zinc-800 px-3 py-2 rounded-xl border border-neutral-700">
            <Filter size={12} className="text-brand-yellow" />
            <span>Exibindo <b className="text-white">{filteredProducts.length}</b> pastéis</span>
          </div>
        </div>

      </div>

      {/* Wrappable Category Chips - No horizontal scrolling, fits all screens instantly */}
      <div className="flex flex-wrap gap-2 w-full py-1" id="category-selector">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border uppercase tracking-wider ${
              selectedCategory === cat 
                ? 'bg-brand-red text-white border-brand-red shadow-md scale-[1.03] pr-5 flex items-center gap-1.5' 
                : 'bg-white hover:bg-stone-50 text-brand-dark border-stone-200'
            }`}
          >
            {selectedCategory === cat && <Sparkles size={11} className="text-brand-yellow fill-brand-yellow" />}
            {cat}
          </button>
        ))}
      </div>

      {/* Active Grid products rendering */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white border border-stone-200 rounded-3xl p-6">
          <AlertCircle size={44} className="text-brand-red mx-auto mb-3" />
          <h3 className="font-display text-lg text-brand-dark mb-1 font-bold">Nenhum pastel de ouro encontrado</h3>
          <p className="text-sm text-stone-500 max-w-sm mx-auto">Tente buscar por termos diferentes ou selecione outra categoria de pastel no menu acima.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            // Check if product is combo for custom badge
            const isCombo = product.category.includes('COMBO') || product.name.includes('Combo') || product.name.includes('Promocional') || product.name.includes('Pague 3');
            
            return (
              <motion.div
                key={product.id}
                layout
                id={`product_${product.id}`}
                className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-brand-yellow hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300 group flex flex-col justify-between"
              >
                {/* Product Detail Banner area */}
                <div className="p-4 flex-1 select-none">
                  
                  {/* Category and Badges */}
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-[10px] font-sans font-extrabold tracking-wider text-brand-red bg-red-50 border border-brand-red/10 px-2.5 py-0.5 rounded-full uppercase">
                      {product.category}
                    </span>

                    {isCombo && (
                      <span className="text-[9px] font-bold uppercase py-0.5 px-2 rounded-full bg-brand-yellow text-brand-dark border border-brand-yellow/40 tracking-widest animate-pulse flex items-center gap-1">
                        <Sparkles size={8} /> Super Combo
                      </span>
                    )}
                  </div>

                  {/* Title and description */}
                  <h3 className="font-sans text-base font-extrabold text-[#1A1A1A] group-hover:text-brand-red transition-colors leading-snug">
                    {product.name}
                  </h3>
                  
                  <p className="text-[11px] text-stone-500 mt-1 leading-relaxed font-medium">
                    {product.description || 'Delicioso pastel artesanal, frito na hora com óleo novo para garantir a crocância e massa sequinha.'}
                  </p>

                </div>

                {/* Footer block (Price + order button) */}
                <div className="border-t border-stone-100 p-4 flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-sans">Valor</span>
                    <span className="text-[18px] font-black text-brand-red font-sans">
                      R$ {Number(product.price).toFixed(2)}
                    </span>
                  </div>

                  {product.available ? (
                    <button
                      onClick={() => onAddToCart(product)}
                      className="bg-brand-red hover:bg-[#1A1A1A] text-white border border-brand-red hover:border-[#1A1A1A] font-extrabold px-4.5 py-2.5 rounded-xl shadow-sm transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={14} className="text-white" /> Adicionar
                    </button>
                  ) : (
                    <span className="bg-stone-100 text-stone-400 px-3 py-2 rounded-xl text-xs font-bold border border-stone-200 font-sans tracking-wide cursor-not-allowed">
                      Esgotado!
                    </span>
                  )}
                </div>

              </motion.div>
            );
          })}
        </div>
      )}

    </div>
  );
}
