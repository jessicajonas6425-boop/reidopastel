import React, { useState, useEffect } from 'react';
import { Product, AppSettings, OrderItem, OrderAddress, Order, Coupon } from '../types';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Truck, 
  MapPin, 
  DollarSign, 
  Send, 
  Clock, 
  MessageSquare,
  Sparkles,
  CreditCard,
  User,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createOrder, createCustomer, syncCoupons } from '../firebase';
import { searchAddress, calculateRouteDistance, calculateDeliveryFee, GeocodingResult, fetchAddressByCep } from '../shippingUtils';

interface CartDrawerProps {
  cartItems: OrderItem[];
  settings: AppSettings;
  onUpdateQty: (productId: string, quantity: number) => void;
  onUpdateNotes: (productId: string, notes: string) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onClose: () => void;
}

export default function CartDrawer({
  cartItems,
  settings,
  onUpdateQty,
  onUpdateNotes,
  onRemoveItem,
  onClearCart,
  onClose
}: CartDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Dinheiro' | 'Cartão'>('Pix');
  const [paymentChange, setPaymentChange] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Accounts & Coupon States
  const [concurToRegister, setConcurToRegister] = useState(false);
  const [allCoupons, setAllCoupons] = useState<Coupon[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Sync active coupons
  useEffect(() => {
    const unsub = syncCoupons((coups) => {
      setAllCoupons(coups.filter(c => c.active));
    });
    return unsub;
  }, []);

  // Address
  const [address, setAddress] = useState<OrderAddress>({
    cep: '',
    street: '',
    number: '',
    neighborhood: '',
    complement: '',
    reference: '',
    latitude: undefined,
    longitude: undefined
  });

  // CEP States
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepFeedback, setCepFeedback] = useState<{ error: boolean; message: string } | null>(null);

  const formatCep = (value: string) => {
    const raw = value.replace(/\D/g, '');
    if (raw.length <= 5) return raw;
    return `${raw.slice(0, 5)}-${raw.slice(5, 8)}`;
  };

  const handleCepChange = (val: string) => {
    const formatted = formatCep(val);
    setAddress(prev => ({ 
      ...prev, 
      cep: formatted,
      street: '',
      neighborhood: '',
      latitude: undefined,
      longitude: undefined
    }));
    setCepFeedback(null);
    setDistanceKm(null);
  };

  const triggerCepLookup = async (cepCode: string) => {
    const clean = cepCode.replace(/\D/g, '');
    if (clean.length !== 8) {
      setCepFeedback({ error: true, message: 'Por favor, digite um CEP válido com 8 números.' });
      return;
    }

    setIsSearchingCep(true);
    setCepFeedback({ error: false, message: 'Consultando base de CEPs... Verificando limites reais em Nova Iguaçu...' });

    try {
      const res = await fetchAddressByCep(clean);
      if (res.valid) {
        setAddress(prev => ({
          ...prev,
          cep: formatCep(res.cep),
          street: res.street,
          neighborhood: res.neighborhood,
          latitude: res.latitude,
          longitude: res.longitude
        }));
        
        if (res.latitude && res.longitude) {
          setCepFeedback({ 
            error: false, 
            message: `CEP Localizado! Bairro: ${res.neighborhood}. Para calcular a rota por GPS, preencha o número de entrega abaixo.` 
          });
        } else {
          setCepFeedback({ 
            error: false, 
            message: `Bairro ${res.neighborhood} identificado para o CEP. Por favor, digite a rua e número para traçarmos a distância real.` 
          });
        }
      } else {
        setCepFeedback({ error: true, message: res.message || 'Desculpe, não localizamos este CEP em Nova Iguaçu.' });
      }
    } catch (err) {
      console.error("CEP lookup failed:", err);
      setCepFeedback({ error: true, message: 'Sem conexão com a base postal. Digite o endereço manualmente para prosseguir.' });
    } finally {
      setIsSearchingCep(false);
    }
  };

  // shipping states
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [shippingMessage, setShippingMessage] = useState<string>('');
  const [shippingIsAllowed, setShippingIsAllowed] = useState(true);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  // Autocomplete search states
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Auto-calculates shipping rate based on real driving distance or configured settings
  let calculatedDeliveryFee = 0;
  if (deliveryMethod === 'delivery') {
    if (distanceKm !== null) {
      const calculation = calculateDeliveryFee({
        distanceKm,
        orderSubtotal: subtotal,
        freeDistanceLimit: settings.freeDistanceLimit,
        pricePerExcessKm: settings.pricePerExcessKm,
        minDeliveryFee: settings.minDeliveryFee,
        freeDeliveryMinOrderValue: settings.freeDeliveryMinOrderValue,
        maxDeliveryDistance: settings.maxDeliveryDistance
      });
      calculatedDeliveryFee = calculation.fee;
    } else {
      // Default fallback when distance is not yet resolved
      calculatedDeliveryFee = settings.deliveryFee ?? 5.00;
    }
  }

  // Coupon and Sign up 10% first order discount
  const isFirstPurchaseActive = concurToRegister;
  let discountAmount = 0;
  let activeDiscountLabel = '';

  if (isFirstPurchaseActive) {
    discountAmount = parseFloat((subtotal * 0.10).toFixed(2));
    activeDiscountLabel = 'Desconto de Cadastro (10%)';
  } else if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = parseFloat((subtotal * (appliedCoupon.discountValue / 100)).toFixed(2));
      activeDiscountLabel = `Cupom ${appliedCoupon.code} (${appliedCoupon.discountValue}%)`;
    } else {
      discountAmount = parseFloat(appliedCoupon.discountValue.toFixed(2));
      activeDiscountLabel = `Cupom ${appliedCoupon.code} (-R$ ${appliedCoupon.discountValue.toFixed(2)})`;
    }
  }

  if (discountAmount > subtotal) {
    discountAmount = subtotal;
  }

  const deliveryFee = calculatedDeliveryFee;
  const totalOrder = Math.max(0, subtotal - discountAmount + deliveryFee);
  const totalUnits = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Suggested address selection handler
  const handleSelectSuggestion = (item: GeocodingResult) => {
    setAddress(prev => ({
      ...prev,
      street: item.streetName || item.display_name.split(',')[0],
      neighborhood: item.suburb || item.display_name.split(',')[1]?.trim() || '',
      latitude: item.lat,
      longitude: item.lon
    }));
    setAutocompleteQuery('');
    setSuggestions([]);
  };

  // Live Suggestion Query trigger
  const handleQueryChange = async (val: string) => {
    setAutocompleteQuery(val);
    if (val.trim().length < 4) {
      setSuggestions([]);
      return;
    }
    
    setIsSearchingSuggestions(true);
    try {
      const res = await searchAddress(val);
      setSuggestions(res);
    } catch (err) {
      console.error("Suggestions retrieval failed:", err);
    } finally {
      setIsSearchingSuggestions(false);
    }
  };

  // Real-time automatic route & rate sync listener
  useEffect(() => {
    if (deliveryMethod !== 'delivery') {
      setDistanceKm(null);
      setShippingMessage('');
      setShippingIsAllowed(true);
      return;
    }

    const { street, number, neighborhood, latitude, longitude } = address;
    const hasManualAddress = street.trim().length > 3 && number.trim().length > 0 && neighborhood.trim().length > 2;

    if (!latitude || !longitude) {
      if (!hasManualAddress) {
        setDistanceKm(null);
        setShippingMessage('Por favor, informe seu endereço completo para calcular o frete por quilometragem.');
        setShippingIsAllowed(true); // Don't block button yet
        return;
      }
    }

    let active = true;
    const triggerCalculate = async () => {
      setIsCalculatingShipping(true);
      setShippingMessage('Navegando no mapa... Traçando melhor trajeto de entrega...');
      
      try {
        let lat = latitude;
        let lon = longitude;

        // 1. If coordinates are not set (manual typed address form), geocode first
        if (!lat || !lon) {
          const combinedQuery = `${street} ${number}, ${neighborhood}`;
          const searchResults = await searchAddress(combinedQuery);
          if (searchResults && searchResults.length > 0) {
            lat = searchResults[0].lat;
            lon = searchResults[0].lon;
            if (active) {
              setAddress(prev => ({ ...prev, latitude: lat, longitude: lon }));
            }
          } else {
            if (active) {
              setDistanceKm(null);
              setShippingIsAllowed(false);
              setShippingMessage('Desculpe, não conseguimos geolocalizar o seu endereço. Verifique o nome da rua e bairro.');
              setIsCalculatingShipping(false);
            }
            return;
          }
        }

        // 2. Trave real-route distance using OSRM Routing between store location and client
        const storeLat = settings.storeLatitude ?? -22.7529404;
        const storeLon = settings.storeLongitude ?? -43.4833290;

        if (lat && lon) {
          const dist = await calculateRouteDistance(storeLat, storeLon, lat, lon);
          if (active) {
            if (dist !== null) {
              setDistanceKm(dist);
              const calculation = calculateDeliveryFee({
                distanceKm: dist,
                orderSubtotal: subtotal,
                freeDistanceLimit: settings.freeDistanceLimit,
                pricePerExcessKm: settings.pricePerExcessKm,
                minDeliveryFee: settings.minDeliveryFee,
                freeDeliveryMinOrderValue: settings.freeDeliveryMinOrderValue,
                maxDeliveryDistance: settings.maxDeliveryDistance
              });

              setShippingIsAllowed(calculation.isAllowed);
              setShippingMessage(calculation.message || '');
            } else {
              setDistanceKm(null);
              setShippingIsAllowed(false);
              setShippingMessage('Não conseguimos calcular o frete. Verifique se o endereço é alcançável por rodovias ou ruas standard.');
            }
          }
        }
      } catch (err) {
        console.error("Automatic shipping calculations error:", err);
      } finally {
        if (active) {
          setIsCalculatingShipping(false);
        }
      }
    };

    // Use a short delay for smooth instant autocompleted results, but longer on manual typing
    const delay = (latitude && longitude) ? 200 : 1500;
    const timer = setTimeout(() => {
      triggerCalculate();
    }, delay);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    address.street,
    address.number,
    address.neighborhood,
    address.latitude,
    address.longitude,
    deliveryMethod,
    subtotal,
    settings
  ]);

  const formatWhatsAppMessage = (orderId: string) => {
    let msg = `👑 *REI DO PASTEL - RESUMO DO PEDIDO #${orderId}*\n`;
    msg += `---------------------------------------\n\n`;
    
    msg += `👤 *Cliente:* ${customerName}\n`;
    msg += `📞 *Telefone:* ${customerPhone}\n`;
    msg += `🚚 *Método:* ${deliveryMethod === 'delivery' ? 'Fazer Entrega' : 'Retirar no Balcão'}\n`;
    msg += `💳 *Pagamento:* ${paymentMethod}${paymentChange ? ` (Troco para: ${paymentChange})` : ''}\n\n`;

    if (deliveryMethod === 'delivery') {
      msg += `📍 *Endereço de Entrega:*\n`;
      if (address.cep) msg += `• CEP: ${address.cep}\n`;
      msg += `• Rua: ${address.street}, Nº ${address.number}\n`;
      msg += `• Bairro: ${address.neighborhood}\n`;
      if (address.complement) msg += `• Compl: ${address.complement}\n`;
      if (address.reference) msg += `• Ref: ${address.reference}\n`;
      if (distanceKm !== null) msg += `• Rota: ${distanceKm} KM de distância real\n`;
      msg += `\n`;
    } else {
      msg += `📍 *Endereço de Retirada:*\n`;
      msg += `• ${settings.address}\n\n`;
    }

    msg += `🛒 *Itens do Pedido:*\n`;
    cartItems.forEach((item) => {
      msg += `• *${item.quantity}x ${item.name}* -- R$ ${(item.price * item.quantity).toFixed(2)}\n`;
      if (item.notes) {
        msg += `  _(Obs: "${item.notes}")_\n`;
      }
    });
    msg += `\n`;

    msg += `---------------------------------------\n`;
    msg += `💵 *Subtotal:* R$ ${subtotal.toFixed(2)}\n`;
    if (discountAmount > 0) {
      msg += `🎁 *Desconto (${activeDiscountLabel}):* -R$ ${discountAmount.toFixed(2)}\n`;
    }
    if (deliveryMethod === 'delivery') {
      msg += `🛵 *Taxa de Entrega:* R$ ${deliveryFee.toFixed(2)}${distanceKm !== null ? ` (Ref: ${distanceKm} KM)` : ''}\n`;
    }
    msg += `💰 *TOTAL GERAL:* R$ ${totalOrder.toFixed(2)}\n\n`;
    
    msg += `👑 _Pedido enviado via site oficial Rei do Pastel_`;
    return encodeURIComponent(msg);
  };

  const handleApplyCoupon = () => {
    setCouponError(null);
    setCouponSuccess(null);
    if (!couponCode.trim()) return;

    const cleanCode = couponCode.toUpperCase().trim();
    const found = allCoupons.find(c => c.code.toUpperCase() === cleanCode && c.active);

    if (!found) {
      setCouponError('Cupom de desconto inválido ou inativo!');
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(found);
    setCouponSuccess(`Cupom "${found.code}" aplicado! (${found.discountValue}${found.discountType === 'percentage' ? '%' : ' BRL'} de desconto)`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponSuccess(null);
    setCouponError(null);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0 || !customerName.trim() || !customerPhone.trim()) return;
    
    if (deliveryMethod === 'delivery') {
      if (!address.street.trim() || !address.number.trim() || !address.neighborhood.trim()) {
        alert("Por favor, preencha todos os campos obrigatórios do endereço!");
        return;
      }
      if (!shippingIsAllowed) {
        alert(shippingMessage || "Desculpe, não entregamos nessa região.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 1. Submit order details to Firebase
      const payload: Omit<Order, 'id'> = {
        customerName,
        customerPhone,
        items: cartItems,
        paymentMethod,
        paymentChange: paymentMethod === 'Dinheiro' ? paymentChange : undefined,
        deliveryMethod,
        address: deliveryMethod === 'delivery' ? address : undefined,
        deliveryDistanceKm: deliveryMethod === 'delivery' && distanceKm !== null ? distanceKm : undefined,
        totalItems: totalUnits,
        deliveryFee,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        appliedCoupon: appliedCoupon ? appliedCoupon.code : (isFirstPurchaseActive ? 'PRIMEIRA10' : undefined),
        isFirstOrderBonus: isFirstPurchaseActive || undefined,
        totalOrder,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const orderId = await createOrder(payload);

      // 1b. If they concurred to register, create their customer account automatically
      if (concurToRegister) {
        try {
          await createCustomer({
            name: customerName,
            phone: customerPhone
          });
          console.log("[CartDrawer] Customer registration successfully automated for:", customerName);
        } catch (custErr) {
          console.warn("[CartDrawer] Silent customer registration failed/skipped:", custErr);
        }
      }

      // 2. Generate and open WhatsApp message link
      const encodedMsg = formatWhatsAppMessage(orderId);
      let cleanPhone = settings.phone.replace(/\D/g, ''); // strip out non-digits
      if (cleanPhone.length > 0 && !cleanPhone.startsWith('55') && (cleanPhone.length === 10 || cleanPhone.length === 11)) {
        cleanPhone = '55' + cleanPhone;
      }
      const whatsAppLink = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

      // Open in tab bypass standard browser restrictions
      try {
        const opened = window.open(whatsAppLink, '_blank');
        if (!opened) {
          console.warn("[CartDrawer] Popup window.open returned null, blocked by browser.");
        }
      } catch (popupErr) {
        console.warn("[CartDrawer] Failed to open WhatsApp link via window.open (likely blocked in iframe):", popupErr);
      }

      // 3. Complete and clear
      onClearCart();
      onClose();
      alert(`Realeza, o seu pedido #${orderId} foi registrado no nosso palácio! Enviamos o resumo para o WhatsApp do Rei do Pastel para fritos imediatos.`);
    } catch (err) {
      console.error("Order processing failed:", err);
      const detailedMsg = err instanceof Error ? err.message : String(err);
      alert(`Ouvimos um eco no palácio: Ocorreu um problema ao registrar seu pedido. Verifique sua conexão.\n\nDetalhes do erro: ${detailedMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 max-w-lg w-full bg-bg-gray border-l border-brand-yellow/30 z-50 shadow-2xl flex flex-col h-full animate-royal-fade-in" id="cart_drawer">
      
      {/* Header bar */}
      <div className="bg-brand-dark text-white p-4 border-b border-brand-yellow flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-brand-red border border-brand-yellow rounded">
            <ShoppingBag className="text-brand-yellow" size={16} />
          </span>
          <div>
            <h2 className="font-display text-sm tracking-wider text-brand-yellow font-extrabold uppercase">Sacola do Rei ({totalUnits})</h2>
            <p className="text-[10px] text-zinc-400 font-sans font-medium uppercase tracking-wider">Seu pedido em tempo real</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 text-zinc-450 hover:text-brand-yellow hover:bg-zinc-800 rounded-full transition-colors border border-neutral-800">
          <X size={16} />
        </button>
      </div>

      {/* Cart content scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {cartItems.length === 0 ? (
          <div className="text-center py-24 px-4">
            <ShoppingBag size={54} className="text-stone-300 mx-auto mb-4 animate-bounce" />
            <h3 className="font-display text-lg text-brand-dark mb-1 font-bold">Sua sacola real está vazia</h3>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">Explore nosso recheado cardápio com pastéis deliciosos e combos imperiais!</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* List of items */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-neural-400 uppercase tracking-widest block mb-1">Itens Adicionados</span>
              
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white border border-stone-200 rounded-xl p-3 shadow-sm space-y-2">
                  <div className="flex items-start justify-between gap-2 border-b border-stone-50 pb-2">
                    <div className="flex-1">
                      <p className="font-bold text-stone-900 text-sm font-sans">{item.name}</p>
                      <p className="text-[10px] text-brand-red font-sans font-bold bg-red-50 inline-block px-2.5 py-0.5 rounded-full uppercase mt-1 border border-brand-red/10">
                        {item.category}
                      </p>
                    </div>
                    <span className="font-sans font-bold text-brand-red text-sm whitespace-nowrap">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  {/* Quantity controls and notes input */}
                  <div className="flex items-center justify-between gap-4 pt-1">
                    {/* Notes field */}
                    <div className="flex-1 flex items-center gap-1.5 bg-bg-gray rounded-lg px-2 py-1 border border-stone-200">
                      <MessageSquare className="text-stone-400 flex-shrink-0" size={12} />
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => onUpdateNotes(item.id, e.target.value)}
                        placeholder="Ex: Sem cebola, massa frita..."
                        className="w-full bg-transparent border-none text-[11px] text-stone-605 focus:outline-none placeholder-stone-400 font-medium font-sans"
                      />
                    </div>

                    {/* Qty count buttons */}
                    <div className="flex items-center bg-bg-gray rounded-lg border border-stone-200">
                      <button 
                        type="button"
                        onClick={() => onUpdateQty(item.id, Math.max(1, item.quantity - 1))}
                        className="p-1 px-2 text-stone-600 hover:bg-stone-200 rounded-l-lg transition-colors cursor-pointer"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="font-sans text-xs font-bold text-brand-dark w-6 text-center">{item.quantity}</span>
                      <button 
                        type="button"
                        onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                        className="p-1 px-2 text-stone-600 hover:bg-stone-200 rounded-r-lg transition-colors cursor-pointer"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    {/* Trash remove */}
                    <button 
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1 text-stone-400 hover:text-brand-red transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>

                  </div>
                </div>
              ))}
            </div>

            {/* Config Checkout form details */}
            <form onSubmit={handleCheckout} className="space-y-4 border-t border-stone-200 pt-5">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block mb-1">Dados de Entrega do Rei</span>

              <div className="grid grid-cols-2 gap-3">
                {/* Customer name */}
                <div>
                  <label className="block text-[11px] font-extrabold text-stone-600 uppercase flex items-center gap-1 mb-1">
                    <User size={12} className="text-brand-red" /> Seu Nome / Sobrenome
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full p-2.5 rounded-xl border border-stone-350 text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red"
                  />
                </div>

                {/* Customer phone */}
                <div>
                  <label className="block text-[11px] font-extrabold text-stone-600 uppercase flex items-center gap-1 mb-1">
                    <Phone size={12} className="text-emerald-600" /> Seu WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Ex: (11) 99999-9999"
                    className="w-full p-2.5 rounded-xl border border-stone-355 text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red"
                  />
                </div>
              </div>

              {/* Delivery custom selector */}
              <div className="grid grid-cols-2 gap-2 bg-neutral-200/50 p-1.5 rounded-xl border border-stone-200 shadow-inner">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('delivery')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    deliveryMethod === 'delivery' 
                      ? 'bg-brand-red text-white border border-brand-red shadow-sm' 
                      : 'text-stone-700 hover:bg-stone-200 hover:text-stone-900'
                  }`}
                >
                  <Truck size={14} /> Fazer Entrega
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('pickup')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    deliveryMethod === 'pickup' 
                      ? 'bg-brand-red text-white border border-brand-red shadow-sm' 
                      : 'text-stone-700 hover:bg-stone-200 hover:text-stone-900'
                  }`}
                >
                  <Clock size={14} /> Retirar Balcão
                </button>
              </div>

              {/* Conditional address lines */}
              <AnimatePresence>
                {deliveryMethod === 'delivery' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 bg-white border border-stone-204 p-4 rounded-xl shadow-sm overflow-hidden"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#5c0d12] uppercase tracking-wide border-b border-stone-100 pb-1.5">
                      <MapPin size={13} /> Dados do Endereço de Entrega
                    </div>

                    {/* CEP FIELD & SEARCH BUTTON */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-stone-600 uppercase mb-1">
                        📬 CEP do seu local de entrega *
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            maxLength={9}
                            placeholder="Ex: 26261-220"
                            required={deliveryMethod === 'delivery'}
                            value={address.cep || ''}
                            onChange={(e) => handleCepChange(e.target.value)}
                            className="w-full p-2.5 border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-red bg-stone-50/50"
                          />
                          {isSearchingCep && (
                            <div className="absolute right-3 top-3">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-red border-t-transparent"></div>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => triggerCepLookup(address.cep || '')}
                          disabled={isSearchingCep || !(address.cep?.replace(/\D/g, '').length === 8)}
                          className="px-4 py-2.5 bg-[#5c0d12] hover:bg-neutral-800 text-white text-xs font-black rounded-lg transition-all disabled:opacity-45 disabled:cursor-not-allowed uppercase tracking-wider cursor-pointer"
                        >
                          Buscar CEP
                        </button>
                      </div>
                      {cepFeedback && (
                        <p className={`text-[10px] mt-1.5 font-bold ${cepFeedback.error ? 'text-red-600' : 'text-emerald-700'}`}>
                          {cepFeedback.message}
                        </p>
                      )}
                    </div>

                    {/* SUGGESTION / AUTOCOMPLETE SEARCH BAR */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-stone-600 uppercase mb-1">
                        🔍 Buscar Endereço Oficial (Mais Rápido por GPS)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={autocompleteQuery}
                          onChange={(e) => handleQueryChange(e.target.value)}
                          placeholder="Digite ex: Rua das Palmeiras, Centro..."
                          className="w-full p-2.5 border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-red bg-stone-50/50"
                        />
                        {isSearchingSuggestions && (
                          <div className="absolute right-3 top-3">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-red border-t-transparent"></div>
                          </div>
                        )}
                        {suggestions.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-stone-150">
                            {suggestions.map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelectSuggestion(item)}
                                className="w-full text-left p-2 text-xs hover:bg-stone-50 cursor-pointer font-medium block text-stone-700"
                              >
                                {item.display_name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-stone-550 uppercase mb-0.5">Rua / Logradouro *</label>
                        <input
                          type="text"
                          required={deliveryMethod === 'delivery'}
                          value={address.street}
                          onChange={(e) => setAddress({ ...address, street: e.target.value, latitude: undefined, longitude: undefined })}
                          placeholder="Rua das Camélias"
                          className="w-full p-2 border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-555 uppercase mb-0.5">Número *</label>
                        <input
                          type="text"
                          required={deliveryMethod === 'delivery'}
                          value={address.number}
                          onChange={(e) => setAddress({ ...address, number: e.target.value })}
                          placeholder="Ex: 123"
                          className="w-full p-2 border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-550 uppercase mb-0.5">Bairro *</label>
                        <input
                          type="text"
                          required={deliveryMethod === 'delivery'}
                          value={address.neighborhood}
                          onChange={(e) => setAddress({ ...address, neighborhood: e.target.value, latitude: undefined, longitude: undefined })}
                          placeholder="Centro"
                          className="w-full p-2 border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-550 uppercase mb-0.5">Complemento Ap / Bloco</label>
                        <input
                          type="text"
                          value={address.complement}
                          onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                          placeholder="Apt 43, bloco C"
                          className="w-full p-2 border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-550 uppercase mb-0.5">Ponto de Referência</label>
                      <input
                        type="text"
                        value={address.reference}
                        onChange={(e) => setAddress({ ...address, reference: e.target.value })}
                        placeholder="Próximo à padaria principal..."
                        className="w-full p-2 border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red bg-white"
                      />
                    </div>

                    {/* LIVE METRICS SHIPPING SUMMARY BOARD */}
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                        <span>Calculador de Frete Inteligente</span>
                        {isCalculatingShipping ? (
                          <span className="text-[10px] text-brand-red animate-pulse flex items-center gap-1">
                            <span className="block h-2 w-2 rounded-full bg-brand-red animate-ping" />
                            Mapeando Rota...
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#5c0d12] bg-[#5c0d12]/5 px-2 py-0.5 rounded-full font-mono font-medium">GPS Ativo</span>
                        )}
                      </div>

                      {/* Display calculations message */}
                      <div className={`p-2.5 rounded-lg border text-xs font-semibold font-sans leading-relaxed ${
                        isCalculatingShipping 
                          ? 'bg-neutral-100 border-neutral-200 text-stone-605'
                          : !shippingIsAllowed
                            ? 'bg-red-50 border-red-200 text-red-800'
                            : distanceKm !== null 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-amber-50 border-amber-200 text-amber-850'
                      }`}>
                        {shippingMessage}
                      </div>

                      {/* Distance in KM block */}
                      {distanceKm !== null && (
                        <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-stone-150 text-xs">
                          <span className="text-stone-500 font-bold">Distância Real Traçada:</span>
                          <span className="font-mono font-black text-[#5c0d12]">{distanceKm.toFixed(2)} KM</span>
                        </div>
                      )}
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

              {/* Payment details Selection */}
              <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm overflow-hidden space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-brand-red uppercase tracking-wide border-b border-stone-100 pb-1.5 mb-2">
                  <CreditCard size={13} className="text-brand-red" /> Forma de Pagamento
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {['Pix', 'Dinheiro', 'Cartão'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m as any)}
                      className={`py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        paymentMethod === m 
                          ? 'bg-brand-red text-white border-brand-red shadow-sm' 
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* Conditional Money change details */}
                <AnimatePresence>
                  {paymentMethod === 'Dinheiro' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-[10px] font-bold text-stone-550 uppercase mb-1 mt-2">Precisa de troco para quanto? (Deixe em branco se não precisar)</label>
                      <input
                        type="text"
                        value={paymentChange}
                        onChange={(e) => setPaymentChange(e.target.value)}
                        placeholder="Ex: Troco para R$ 100,00"
                        className="w-full p-2 border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-red bg-white"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ÁREA DE CUPONS & CADASTRO 10% */}
              <div className="space-y-3">
                {/* 1. Cupom de Desconto */}
                <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm space-y-2">
                  <span className="block text-xs font-extrabold text-[#5c0d12] uppercase tracking-wider flex items-center gap-1">
                    🎟️ Possui Cupom?
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={isFirstPurchaseActive}
                      placeholder={isFirstPurchaseActive ? "Desconto de cadastro ativo" : "Ex: REI10"}
                      className="flex-1 p-2 border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-red bg-white disabled:bg-stone-150 disabled:opacity-60 uppercase"
                    />
                    {appliedCoupon ? (
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="px-3 py-2 bg-stone-500 hover:bg-stone-600 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                      >
                        Remover
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={isFirstPurchaseActive || !couponCode.trim()}
                        className="px-4 py-2 bg-brand-dark hover:bg-stone-800 text-white text-xs font-black rounded-lg transition-all disabled:opacity-40 cursor-pointer"
                      >
                        Aplicar
                      </button>
                    )}
                  </div>
                  {couponError && (
                    <p className="text-[10px] text-red-600 font-bold">{couponError}</p>
                  )}
                  {couponSuccess && (
                    <p className="text-[10px] text-emerald-700 font-bold">{couponSuccess}</p>
                  )}
                </div>

                {/* 2. Oferta de Cadastro (Aviso Pequeno de Conta e 10% de Desconto) */}
                <div className="bg-amber-50/70 border border-amber-250 rounded-xl p-3 shadow-sm">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="opt_in_register"
                      checked={concurToRegister}
                      onChange={(e) => {
                        setConcurToRegister(e.target.checked);
                        if (e.target.checked) {
                          setAppliedCoupon(null);
                          setCouponCode('');
                          setCouponSuccess(null);
                          setCouponError(null);
                        }
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-amber-400 text-brand-red focus:ring-brand-red cursor-pointer"
                    />
                    <label htmlFor="opt_in_register" className="text-stone-700 cursor-pointer select-none">
                      <span className="block text-xs font-black text-[#5c0d12] uppercase tracking-wide">
                        🎁 Desconto de Cadastro (10% OFF)!
                      </span>
                      <p className="text-[10px] leading-relaxed mt-0.5 font-medium">
                        Quero criar minha conta de Realeza grátis com os dados acima para ganhar <strong>10% de desconto</strong> agora! O login será meu <strong>Nome</strong> e a senha os <strong>4 números finais do meu WhatsApp</strong>.
                      </p>
                    </label>
                  </div>
                </div>
              </div>

              {/* Checkout details Card */}
              <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm space-y-2.5">
                <div className="flex justify-between text-xs font-bold text-zinc-550 uppercase tracking-widest font-sans">
                  <span>Subtotal</span>
                  <span className="font-sans">R$ {subtotal.toFixed(2)}</span>
                </div>
                {deliveryMethod === 'delivery' && (
                  <div className="flex justify-between text-xs font-bold text-zinc-555 uppercase tracking-widest font-sans">
                    <span>Taxa de Entrega</span>
                    <span className="font-sans">R$ {deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs font-bold text-emerald-700 uppercase tracking-widest font-sans bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                    <span>Desconto ({activeDiscountLabel})</span>
                    <span className="font-sans">- R$ {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="h-px bg-stone-100 my-2" />
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-brand-dark font-sans text-xs font-extrabold tracking-wider uppercase">Vossa Realeza Paga</span>
                  <span className="text-[20px] font-sans font-black text-brand-red">R$ {totalOrder.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout order submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-red hover:bg-[#1A1A1A] text-white border border-brand-red hover:border-[#1A1A1A] font-extrabold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-sm uppercase tracking-wider cursor-pointer"
              >
                <Send size={15} /> {isSubmitting ? 'Fritando Pedido...' : 'Enviar Pedido p/ WhatsApp do Rei'}
              </button>

            </form>
          </div>
        )}
      </div>

    </div>
  );
}
