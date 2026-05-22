import React, { useState } from 'react';
import { Product, Category, Order, OrderItem } from '../types';
import { createOrder } from '../firebase';
import { Search, ShoppingBag, Plus, Minus, Trash2, CheckCircle, Calculator, CircleDollarSign } from 'lucide-react';

interface PDVProps {
  products: Product[];
  categories: Category[];
  onSaleCompleted: () => void;
}

export default function PDV_Component({ products, categories, onSaleCompleted }: PDVProps) {
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');
  
  // Payment info
  const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Dinheiro' | 'Cartão'>('Pix');
  const [manualDiscount, setManualDiscount] = useState<number>(0);
  const [cashReceived, setCashReceived] = useState<string>('');
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Filter products by category and active status
  const visibleProducts = products.filter(p => {
    const isMatchedSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const isMatchedCat = selectedCategory === 'TODOS' || p.category.toUpperCase() === selectedCategory.toUpperCase();
    
    // Ensure product category is active
    const catObj = categories.find(c => c.name.toUpperCase() === p.category.toUpperCase());
    if (catObj && !catObj.active) return false;
    
    return isMatchedSearch && isMatchedCat;
  });

  // Unique categories list based onto dynamic visible products or overall active categories
  const activeCats = ['TODOS', ...categories.filter(c => c.active).map(c => c.name.toUpperCase())];

  const addToCart = (product: Product) => {
    setCart(prev => {
      const match = prev.find(item => item.id === product.id);
      if (match) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        quantity: 1
      }];
    });
  };

  const updateQty = (productId: string, val: number) => {
    if (val <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity: val } : item));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = Math.max(0, subtotal - manualDiscount);
  const changeNeeded = Number(cashReceived) > total ? Number(cashReceived) - total : 0;

  const handleFinalizeSale = async () => {
    if (cart.length === 0) {
      alert("⚠️ Carrinho de Balcão está vazio! Adicione pelo menos um item.");
      return;
    }

    setIsFinalizing(true);
    try {
      const orderPayload: Omit<Order, 'id'> = {
        customerName: "Cliente Balcão (Presencial)",
        customerPhone: "Não Informado",
        items: cart,
        paymentMethod: paymentMethod,
        paymentChange: paymentMethod === 'Dinheiro' && cashReceived ? `Pagar Troco de R$ ${changeNeeded.toFixed(2)} (Recebeu R$ ${Number(cashReceived).toFixed(2)})` : undefined,
        deliveryMethod: 'pickup',
        totalItems: cart.reduce((acc, i) => acc + i.quantity, 0),
        deliveryFee: 0,
        discountAmount: manualDiscount,
        totalOrder: total,
        status: 'delivered', // Finished immediately
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const orderRef = await createOrder(orderPayload);
      alert(`✅ Venda de Balcão #${orderRef} concluída com sucesso no palácio real! R$ ${total.toFixed(2)} registrado.`);
      
      // Clean up local
      setCart([]);
      setManualDiscount(0);
      setCashReceived('');
      onSaleCompleted();
    } catch (err: any) {
      alert("Erro ao finalizar venda de balcão: " + (err.message || String(err)));
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full min-h-[500px]" id="pdv_view">
      {/* Left side: Products Finder & Selection */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search box */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400">
              <Search size={16} />
            </span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-stone-800 text-xs focus:ring-2 focus:ring-[#5c0d12]/20 focus:border-[#5c0d12] outline-none"
              placeholder="Pesquisar pastel, bebida ou combo..."
            />
          </div>

          {/* Category Tabs */}
          <div className="overflow-x-auto max-w-full">
            <div className="flex gap-1.5 pb-1">
              {activeCats.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory.toUpperCase() === cat.toUpperCase()
                      ? 'bg-[#5c0d12] text-white'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto max-h-[460px] p-1 border border-stone-100 rounded-xl bg-stone-50">
          {visibleProducts.map(prod => (
            <div 
              key={prod.id} 
              onClick={() => addToCart(prod)}
              className="bg-white border text-left border-stone-200 rounded-xl p-3 shadow-xs hover:border-amber-400 cursor-pointer transition-all hover:shadow hover:scale-[1.01] flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-500 font-mono px-1.5 py-0.5 rounded font-black uppercase inline-block mb-1 border border-stone-200/50">
                  {prod.category}
                </span>
                <p className="font-bold text-stone-800 text-xs uppercase tracking-tight line-clamp-1">{prod.name}</p>
                <p className="text-[10px] text-stone-500 line-clamp-2 mt-0.5 leading-relaxed font-sans">{prod.description}</p>
              </div>
              <p className="font-mono text-[#5c0d12] font-black text-xs mt-2.5">
                R$ {Number(prod.price).toFixed(2)}
              </p>
            </div>
          ))}
          {visibleProducts.length === 0 && (
            <div className="col-span-full text-center py-12 text-stone-400 text-xs">Sem produtos ativos correspondentes.</div>
          )}
        </div>
      </div>

      {/* Right side: Shopping Cart & Checkout sales */}
      <div className="lg:col-span-5 border border-stone-200 rounded-2xl bg-stone-50/50 p-4 shadow-sm flex flex-col justify-between space-y-4">
        <div>
          <h3 className="font-display text-sm text-[#5c0d12] font-black border-b border-stone-200 pb-2 flex items-center gap-1.5 uppercase tracking-wider">
            <ShoppingBag size={16} /> Carrinho do Balcão
          </h3>

          <div className="divide-y divide-stone-200 max-h-[220px] overflow-y-auto pr-1 space-y-1">
            {cart.map(item => (
              <div key={item.id} className="py-2.5 flex justify-between items-center text-xs gap-2">
                <div className="flex-1">
                  <p className="font-bold text-stone-800 uppercase text-[11px]">{item.name}</p>
                  <p className="text-stone-400 font-mono">R$ {Number(item.price).toFixed(2)}/un</p>
                </div>
                
                {/* Adjust quantities */}
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => updateQty(item.id, item.quantity - 1)}
                    className="p-1 bg-white hover:bg-stone-100 border rounded shadow-xs"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="font-mono font-black text-stone-850 w-6 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => updateQty(item.id, item.quantity + 1)}
                    className="p-1 bg-white hover:bg-stone-100 border rounded shadow-xs"
                  >
                    <Plus size={11} />
                  </button>
                </div>

                <div className="text-right">
                  <p className="font-mono font-bold text-stone-900">R$ {(item.price * item.quantity).toFixed(2)}</p>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 font-bold p-1"
                    title="Remover"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="text-center py-10 text-stone-400 font-sans">O carrinho de vendas ainda está vazio. Toque nos pastéis da esquerda para recheá-lo!</div>
            )}
          </div>
        </div>

        {/* Dynamic Pricing options */}
        <div className="space-y-3 pt-3 border-t border-stone-200 text-xs">
          <div className="flex justify-between font-medium">
            <span className="text-stone-600">Subtotal</span>
            <span className="font-mono font-semibold">R$ {subtotal.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-stone-600 whitespace-nowrap">Desconto R$</span>
            <input 
              type="number" 
              value={manualDiscount || ''} 
              onChange={(e) => setManualDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-24 px-2 py-1 border rounded text-right font-mono font-bold text-stone-800 focus:outline-[#5c0d12]"
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center justify-between border-t border-dashed pt-2 font-black text-sm text-stone-900">
            <span>Total Líquido</span>
            <span className="font-mono text-[#5c0d12] text-base">R$ {total.toFixed(2)}</span>
          </div>

          {/* Payment method */}
          <div className="space-y-1 pt-1.5">
            <span className="font-bold text-stone-500 text-[10px] uppercase tracking-wider block">Forma de Pagamento</span>
            <div className="grid grid-cols-3 gap-1">
              {['Pix', 'Dinheiro', 'Cartão'].map(m => (
                <button
                  key={m}
                  onClick={() => {
                    setPaymentMethod(m as any);
                    if (m !== 'Dinheiro') {
                      setCashReceived('');
                    }
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                    paymentMethod === m
                      ? 'bg-amber-400 text-stone-900 border-amber-500 shadow-xs'
                      : 'bg-white hover:bg-stone-100 text-stone-600 border-stone-200'
                  }`}
                >
                  {m === 'Pix' && '⚡ PIX'}
                  {m === 'Dinheiro' && '💵 Dinheiro'}
                  {m === 'Cartão' && '💳 Cartão'}
                </button>
              ))}
            </div>
          </div>

          {/* Dinheiro Change helper */}
          {paymentMethod === 'Dinheiro' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 space-y-2 font-sans">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-stone-600 uppercase flex items-center gap-1"><Calculator size={12} /> Valor Recebido em Cédulas:</span>
                <input 
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-right font-mono font-bold text-stone-800"
                  placeholder="0.00"
                />
              </div>
              {Number(cashReceived) > 0 && (
                <div className="flex justify-between items-center text-xs font-bold py-1 border-t border-yellow-200">
                  <span className="text-yellow-800 uppercase text-[10px]">Troco correspondente:</span>
                  <span className="font-mono text-green-700 text-sm">R$ {changeNeeded.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleFinalizeSale}
            disabled={isFinalizing || cart.length === 0}
            className="w-full bg-[#5c0d12] hover:bg-red-900 border-2 border-amber-400 text-white font-extrabold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <CircleDollarSign size={16} /> {isFinalizing ? 'Processando balcão...' : 'Finalizar Venda Balcão (Entregue)'}
          </button>
        </div>
      </div>
    </div>
  );
}
