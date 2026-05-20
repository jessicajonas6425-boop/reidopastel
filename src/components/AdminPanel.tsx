import React, { useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  isFirestoreReal, 
  saveProduct, 
  deleteProduct, 
  saveSettings, 
  updateOrderStatus, 
  deleteOrder,
  syncOrders,
  seedFirestoreDatabase
} from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { Product, AppSettings, Order } from '../types';
import { 
  Settings, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Truck, 
  ShoppingBag, 
  X, 
  User, 
  LogOut, 
  Circle, 
  DollarSign, 
  Power, 
  Phone, 
  Instagram, 
  Facebook, 
  MapPin, 
  ChevronDown, 
  AlertTriangle,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPanelProps {
  products: Product[];
  settings: AppSettings;
  orders?: Order[];
  onClose: () => void;
}

export default function AdminPanel({ products, settings, orders: propOrders, onClose }: AdminPanelProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings'>('orders');

  const previousOrderIdsRef = React.useRef<Set<string>>(new Set());
  const isInitialLoadRef = React.useRef(true);

  // Synthesize alert chime using the Web Audio API (cross-platform, reliable, no files needed)
  const playOrderAlertSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const playTone = (time: number, freq: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.6, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(time);
        osc.stop(time + duration);
      };
      
      const now = ctx.currentTime;
      // Beautiful harmonic chime structure - Ding-Dong Double-Chime Pattern
      playTone(now, 587.33, 0.45); // D5
      playTone(now + 0.1, 880.00, 0.6); // A5

      playTone(now + 0.4, 587.33, 0.45); // D5
      playTone(now + 0.5, 880.00, 0.6); // A5
    } catch (err) {
      console.warn("Could not play order chimes:", err);
    }
  };

  // Listen for new pending orders to trigger the alert tone
  useEffect(() => {
    if (orders.length === 0) {
      isInitialLoadRef.current = false;
      return;
    }

    let hasNewPendingOrder = false;
    
    if (isInitialLoadRef.current) {
      // Record initial orders to make sure we don't play sound on page load
      orders.forEach(order => {
        previousOrderIdsRef.current.add(order.id);
      });
      isInitialLoadRef.current = false;
    } else {
      orders.forEach(order => {
        if (!previousOrderIdsRef.current.has(order.id)) {
          previousOrderIdsRef.current.add(order.id);
          // Only play sound if the new incoming order is 'pending'
          if (order.status === 'pending') {
            hasNewPendingOrder = true;
          }
        }
      });
    }

    if (hasNewPendingOrder) {
      playOrderAlertSound();
    }
  }, [orders]);
  
  // Local admin bypass for local testing or when Firebase isn't fully set up yet
  const [isBypassedAdmin, setIsBypassedAdmin] = useState(() => {
    return localStorage.getItem('rei_do_pastel_admin_bypass') === 'true';
  });

  // Modal forms states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'NACIONALIDADES',
    available: true
  });

  // Settings form states
  const [settingsForm, setSettingsForm] = useState<AppSettings>({
    phone: '',
    instagram: '',
    facebook: '',
    address: '',
    deliveryFee: 5.00,
    isOpen: true,
    freeDistanceLimit: 3,
    pricePerExcessKm: 2.50,
    maxDeliveryDistance: 15,
    minDeliveryFee: 5.00,
    freeDeliveryMinOrderValue: 80,
    storeLatitude: -23.561506,
    storeLongitude: -46.656139,
    ...settings
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isGeocodingStore, setIsGeocodingStore] = useState(false);

  // Auth monitoring
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Update local settings form when fresh settings loaded
  useEffect(() => {
    setSettingsForm({
      phone: '',
      instagram: '',
      facebook: '',
      address: '',
      deliveryFee: 5.00,
      isOpen: true,
      freeDistanceLimit: 3,
      pricePerExcessKm: 2.50,
      maxDeliveryDistance: 15,
      minDeliveryFee: 5.00,
      freeDeliveryMinOrderValue: 80,
      storeLatitude: -23.561506,
      storeLongitude: -46.656139,
      ...settings
    });
  }, [settings]);

  const handleGeocodeStoreAddress = async () => {
    if (!settingsForm.address || settingsForm.address.trim().length < 5) {
      alert("Por favor, digite um endereço físico válido para geolocalizar o palácio.");
      return;
    }
    
    setIsGeocodingStore(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(settingsForm.address)}&limit=1`, {
        headers: {
          'User-Agent': 'ReiDoPastelAdminApp/1.0 (tudojonas38@gmail.com)'
        }
      });
      if (!response.ok) {
        throw new Error("Serviço de geolocalização indisponível.");
      }
      const data = await response.json();
      if (data && data.length > 0) {
        const first = data[0];
        setSettingsForm(prev => ({
          ...prev,
          storeLatitude: parseFloat(first.lat),
          storeLongitude: parseFloat(first.lon)
        }));
        alert(`O Palácio Real do Pastel foi geolocalizado com sucesso!\n\nCoordenadas salvas:\nLatitude: ${first.lat}\nLongitude: ${first.lon}\n\nAgora o cálculo de frete por quilometragem real está 100% calibrado.`);
      } else {
        alert("Não conseguimos encontrar esse endereço no OpenStreetMap. Tente digitar um endereço mais simples (ex: Nome da rua, numero, cidade, estado) e tente novamente.");
      }
    } catch (err) {
      console.error("Geocoding store address error:", err);
      alert("Erro ao buscar coordenadas. Verifique sua conexão ou digite as coordenadas manualmente.");
    } finally {
      setIsGeocodingStore(false);
    }
  };

  // Check if current logged in email matches bootstrapped admin
  const isCertifiedAdmin = currentUser?.email === 'pastel@x.com' || currentUser?.email === 'tudojonas38@gmail.com' || isBypassedAdmin;

  // Real-time orders synchronization for authenticated admins
  useEffect(() => {
    if (!isCertifiedAdmin) {
      setOrders([]);
      return;
    }
    
    // Safely seed Firestore database with standard products and settings if empty
    if (isFirestoreReal && (currentUser?.email === 'tudojonas38@gmail.com' || currentUser?.email === 'pastel@x.com')) {
      seedFirestoreDatabase();
    }
    
    const unsubscribe = syncOrders((freshOrders) => {
      setOrders(freshOrders);
    });
    
    return () => unsubscribe();
  }, [isCertifiedAdmin, currentUser]);

  // Email-Password Login states
  const [emailInput, setEmailInput] = useState('pastel@x.com');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setAuthError(null);
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, emailInput, passwordInput);
    } catch (error: any) {
      console.error("Email/Password Login Error:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-email') {
        setAuthError("Credenciais inválidas. Verifique se o e-mail e a senha foram cadastrados corretamente no Firebase Console.");
      } else {
        setAuthError("Falha na autenticação: " + (error.message || String(error)));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth || !googleProvider) return;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Admin Login Error:", error);
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setIsBypassedAdmin(false);
    localStorage.removeItem('rei_do_pastel_admin_bypass');
  };

  const triggerBypassAdmin = () => {
    setIsBypassedAdmin(true);
    localStorage.setItem('rei_do_pastel_admin_bypass', 'true');
  };

  // CATEGORIES List
  const CATEGORIES = [
    'NACIONALIDADES',
    'X - PASTEL',
    'PEITO DE PERU',
    'PASTEL DOCE',
    'CALABRESA',
    'CAMARÃO',
    'CARNE SECA',
    'AVENTURE-SE',
    'PASTÉIS TRADICIONAIS',
    'DUPLOS DE QUEIJO - 2X MAIS RECHEIO',
    'TRADICIONAIS C/ QUEIJO',
    'TRADICIONAIS C/ CHEEDAR',
    'COMBOS DISPONÍVEIS'
  ];

  // Forms Actions
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProdForm({
      name: '',
      description: '',
      price: 10.90,
      category: 'NACIONALIDADES',
      available: true
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProdForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      available: product.available
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name.trim() || prodForm.price <= 0) return;

    const id = editingProduct ? editingProduct.id : 'prod-' + Date.now();
    const productToSave: Product = {
      id,
      name: prodForm.name,
      description: prodForm.description,
      price: Number(prodForm.price),
      category: prodForm.category,
      available: prodForm.available
    };

    await saveProduct(productToSave);
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm("Tem certeza que deseja excluir este pastel?")) {
      await deleteProduct(productId);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    await saveSettings(settingsForm);
    setIsSavingSettings(false);
    alert("Configurações atualizadas com sucesso!");
  };

  const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
    // 1. Update database status
    await updateOrderStatus(orderId, status);
    
    // 2. Find order details to send client WA notification if applicable
    const foundOrder = orders.find(o => o.id === orderId);
    if (!foundOrder) return;

    if (status === 'accepted') {
      const text = `👑 *REI DO PASTEL* 👑\n\nOlá, *${foundOrder.customerName}*! Seu pedido *#${foundOrder.id}* foi aceito pela nossa cozinha! 🍳🔥\n\n🛒 O seu pedido já está sendo preparado com muito recheio e carinho pela nossa equipe imperial. Logo avisaremos quando sair para entrega!\n\nAgradecemos a preferência! 👑`;
      let cleanClientPhone = foundOrder.customerPhone.replace(/\D/g, '');
      if (cleanClientPhone.length > 0 && !cleanClientPhone.startsWith('55') && (cleanClientPhone.length === 10 || cleanClientPhone.length === 11)) {
        cleanClientPhone = '55' + cleanClientPhone;
      }
      const encodedText = encodeURIComponent(text);
      const clientWhatsAppLink = `https://wa.me/${cleanClientPhone}?text=${encodedText}`;
      window.open(clientWhatsAppLink, '_blank');
    } else if (status === 'out_for_delivery') {
      const text = `👑 *REI DO PASTEL* 👑\n\nExcelente notícia, *${foundOrder.customerName}*! O seu pedido *#${foundOrder.id}* ficou pronto e o entregador real já está a caminho! 🛵💨\n\n📍 Ele está levando o seu pastel quentinho e crocante direto para a sua casa. Prepare a mesa!\n\nMuito obrigado pela preferência! 👑`;
      let cleanClientPhone = foundOrder.customerPhone.replace(/\D/g, '');
      if (cleanClientPhone.length > 0 && !cleanClientPhone.startsWith('55') && (cleanClientPhone.length === 10 || cleanClientPhone.length === 11)) {
        cleanClientPhone = '55' + cleanClientPhone;
      }
      const encodedText = encodeURIComponent(text);
      const clientWhatsAppLink = `https://wa.me/${cleanClientPhone}?text=${encodedText}`;
      window.open(clientWhatsAppLink, '_blank');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (confirm("Deseja arquivar/excluir este pedido?")) {
      await deleteOrder(orderId);
    }
  };

  // Render Status Badge helper
  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending': 
        return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><Clock size={12} /> Pendente</span>;
      case 'accepted': 
        return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><CheckCircle size={12} /> Aceito</span>;
      case 'preparing': 
        return <span className="bg-orange-100 text-orange-850 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><ShoppingBag size={12} /> Preparando</span>;
      case 'out_for_delivery': 
        return <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><Truck size={12} /> Saiu p/ Entrega</span>;
      case 'delivered': 
        return <span className="bg-green-100 text-green-850 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><CheckCircle size={12} /> Entregue</span>;
      case 'cancelled': 
        return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><X size={12} /> Cancelado</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm" id="admin_backdrop">
      <div className="bg-stone-50 rounded-2xl border-2 border-amber-400 w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-royal-fade-in" id="admin_container">
        
        {/* Header bar */}
        <div className="bg-stone-900 border-b border-amber-400 text-amber-100 px-6 py-4 flex justify-between items-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-800 to-stone-950">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-[#5c0d12] rounded-lg border border-amber-500">
              <Settings className="text-amber-300" size={20} />
            </span>
            <div>
              <h1 className="font-display text-xl tracking-wider text-amber-300">Painel do Rei</h1>
              <p className="text-xs text-stone-400 font-mono">Gerenciamento Administrativo em Tempo Real</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-amber-100 hover:text-amber-300 hover:bg-stone-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Auth wall check */}
        {!isCertifiedAdmin ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 text-center max-w-md mx-auto">
            <div className="bg-amber-100 p-4 rounded-full text-[#5c0d12] border border-amber-400 mb-4 animate-bounce">
              <Lock size={32} />
            </div>
            <h2 className="font-display text-xl text-stone-800 mb-2">Acesso Exclusivo da Coroa</h2>
            <p className="text-sm text-stone-600 mb-6 font-medium">
              Este painel gerencia produtos, preços, taxas e pedidos. Efetue o login com as credenciais oficiais da administração.
            </p>

            {isFirestoreReal ? (
              <div className="w-full space-y-4 text-left">
                <form onSubmit={handleEmailPasswordLogin} className="space-y-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-md">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">E-mail do Administrador</label>
                    <input 
                      type="email" 
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-sm focus:ring-2 focus:ring-[#5c0d12]/20 focus:border-[#5c0d12] outline-none transition-all"
                      placeholder="pastel@x.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">Senha de Acesso</label>
                    <input 
                      type="password" 
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-sm focus:ring-2 focus:ring-[#5c0d12]/20 focus:border-[#5c0d12] outline-none transition-all"
                      placeholder="Sua senha secreta"
                      required
                    />
                  </div>

                  {authError && (
                    <div className="text-xs text-red-600 font-medium leading-relaxed bg-red-50 p-2.5 rounded-lg border border-red-100">
                      ⚠️ {authError}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full bg-[#5c0d12] hover:bg-red-900 text-white font-semibold py-2.5 px-4 rounded-xl border border-amber-500 shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isLoggingIn ? "Autenticando..." : "Entrar como Admin"}
                  </button>
                </form>

                <div className="relative py-2 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-300"></div>
                  </div>
                  <span className="relative px-3 bg-stone-50 text-xs text-stone-500 font-mono">OU</span>
                </div>

                <button 
                  type="button"
                  onClick={handleGoogleLogin} 
                  className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold py-2.5 px-4 rounded-xl border border-stone-300 shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <User size={18} /> Entrar com Conta Google
                </button>
              </div>
            ) : (
              <div className="w-full space-y-4">
                <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3 text-xs text-yellow-800 flex items-start gap-2 text-left font-mono">
                  <AlertTriangle className="flex-shrink-0 mt-0.5 text-yellow-600" size={16} />
                  <span>
                    O Firebase Cloud ainda não foi sincronizado pelo painel lateral. Ativamos o <b>Modo de Depuração Confortável</b> para que você teste todas as funções de edição em tempo real no preview imediatamente!
                  </span>
                </div>
                <button 
                  onClick={triggerBypassAdmin} 
                  className="w-full bg-amber-500 hover:bg-amber-600 text-[#5c0d12] font-semibold py-3 px-6 rounded-xl border-2 border-[#5c0d12] shadow-md flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                  <Power size={18} /> Ignorar e Acessar Administrador
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Logged In Content */
          <>
            {/* Top Info line and Navigation */}
            <div className="bg-stone-100 border-b border-stone-200 px-6 py-3 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-1 bg-stone-200 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveTab('orders')} 
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'orders' ? 'bg-[#5c0d12] text-white shadow-sm' : 'text-stone-700 hover:bg-stone-300'}`}
                >
                  Pedidos Real-time ({orders.length})
                </button>
                <button 
                  onClick={() => setActiveTab('products')} 
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'products' ? 'bg-[#5c0d12] text-white shadow-sm' : 'text-stone-700 hover:bg-stone-300'}`}
                >
                  Cardápio ({products.length})
                </button>
                <button 
                  onClick={() => setActiveTab('settings')} 
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'settings' ? 'bg-[#5c0d12] text-white shadow-sm' : 'text-stone-700 hover:bg-stone-300'}`}
                >
                  Configurações
                </button>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="text-right">
                  <p className="font-semibold text-stone-800 text-xs">Administrador Ativo</p>
                  <p className="text-xs text-stone-500 font-mono">
                    {currentUser?.email || 'DEBUG_ADMIN@local'}
                  </p>
                </div>
                <button 
                  onClick={handleLogout} 
                  title="Sair do Painel"
                  className="p-2 text-stone-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-stone-200"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>

            {/* Tab content area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white min-h-[400px]">
              
              {/* TAB 1: ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="font-display text-lg text-stone-900 border-l-4 border-amber-500 pl-2">Painel de Pedidos Recentes</h2>
                    {orders.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200 flex items-center gap-1 font-mono">
                          <Circle size={8} className="fill-green-600 animate-ping" /> Sincronizado Real-Time
                        </span>
                        <button 
                          onClick={playOrderAlertSound}
                          className="text-xs text-[#5c0d12] hover:bg-red-50 bg-white border border-[#5c0d12]/20 px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold transition-colors shadow-sm cursor-pointer"
                          title="Testar sinal sonoro de novos pedidos"
                        >
                          📢 Testar Campainha de Alerta
                        </button>
                      </div>
                    )}
                  </div>

                  {orders.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50">
                      <ShoppingBag size={48} className="text-stone-300 mx-auto mb-3" />
                      <p className="text-stone-600 font-semibold">Nenhum pedido recebido ainda</p>
                      <p className="text-xs text-stone-400">Os pedidos dos clientes aparecerão aqui instantaneamente em tempo real!</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-stone-200 rounded-xl bg-stone-50 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          {/* Order Card Header */}
                          <div className="bg-stone-100 px-4 py-3 border-b border-stone-200 flex flex-wrap justify-between items-center gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-stone-800 bg-[#5c0d12]/15 text-[#5c0d12] px-2.5 py-1 rounded border border-[#5c0d12]/30 text-sm">
                                #{order.id}
                              </span>
                              <span className="text-stone-700 font-semibold">{order.customerName}</span>
                              <span className="text-xs text-stone-500 font-mono">({new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(order.status)}
                              <button 
                                onClick={() => handleDeleteOrder(order.id)} 
                                className="p-1 px-2 text-xs text-stone-400 hover:text-red-600 transition-colors bg-white hover:bg-red-50 border border-stone-200 rounded"
                                title="Arquivar"
                              >
                                Excluir
                              </button>
                            </div>
                          </div>

                          {/* Order Details Body */}
                          <div className="p-4 grid md:grid-cols-3 gap-4">
                            {/* Items col */}
                            <div className="md:col-span-1.5 space-y-1.5">
                              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Produtos</p>
                              <div className="divide-y divide-stone-100 max-h-[150px] overflow-y-auto pr-1">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="py-1 flex justify-between text-sm">
                                    <span className="text-stone-800">
                                      <b className="text-amber-600 font-mono">{item.quantity}x</b> {item.name}
                                      {item.notes && <p className="text-xs text-red-500 ml-5 font-sans">Obs: "{item.notes}"</p>}
                                    </span>
                                    <span className="font-mono text-stone-500 font-semibold">R$ {(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Method & Payment Col */}
                            <div className="space-y-2 text-sm border-l md:border-l-0 md:border-x border-stone-200 px-0 md:px-4">
                              <div>
                                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest block">Metodo / Destino</span>
                                <span className="font-medium text-stone-800 bg-[#5c0d12]/5 text-[#5c0d12] px-2 py-0.5 rounded text-xs">
                                  {order.deliveryMethod === 'delivery' ? 'Entrega em Casa' : 'Retirar no Balcão'}
                                </span>
                              </div>
                              {order.deliveryMethod === 'delivery' && order.address ? (
                                <div className="text-stone-600 text-xs font-sans mt-1 space-y-0.5">
                                  <p><b>Rua:</b> {order.address.street}, {order.address.number}</p>
                                  <p><b>Bairro:</b> {order.address.neighborhood}</p>
                                  {order.address.complement && <p><b>Compl:</b> {order.address.complement}</p>}
                                  {order.address.reference && <p className="text-amber-700"><b>Ref:</b> {order.address.reference}</p>}
                                  {order.deliveryDistanceKm !== undefined && (
                                    <p className="text-teal-700 font-extrabold bg-teal-50 border border-teal-200 rounded px-2 py-0.5 mt-1.5 inline-block text-[10px] uppercase font-sans">
                                      Distância Real: {order.deliveryDistanceKm} KM
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-stone-500">Cliente fará a retirada física no rei.</p>
                              )}
                            </div>

                            {/* Pricing & Operations Col */}
                            <div className="flex flex-col justify-between space-y-3">
                              <div>
                                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest block">Pagamento & Total</span>
                                <p className="text-stone-800 text-sm">
                                  <b>Forma:</b> {order.paymentMethod}
                                  {order.paymentChange && <span className="text-xs text-red-500 ml-1">({order.paymentChange})</span>}
                                </p>
                                <p className="text-stone-900 font-bold text-lg mt-1 font-mono">
                                  R$ {Number(order.totalOrder).toFixed(2)}
                                </p>
                              </div>

                              {/* State changer buttons */}
                              <div>
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Alterar Status</p>
                                <div className="flex flex-wrap gap-1">
                                  {['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'].map((st) => (
                                    <button
                                      key={st}
                                      onClick={() => handleUpdateStatus(order.id, st as any)}
                                      className={`text-[10px] py-1.5 px-2 rounded font-semibold transition-all border ${
                                        order.status === st 
                                          ? 'bg-amber-400 text-stone-900 border-amber-500 font-bold' 
                                          : 'bg-white hover:bg-stone-100 text-stone-600 border-stone-200'
                                      }`}
                                    >
                                      {st === 'pending' && 'Pendente'}
                                      {st === 'accepted' && 'Pedido Aceito'}
                                      {st === 'preparing' && 'Preparando'}
                                      {st === 'out_for_delivery' && 'A Caminho'}
                                      {st === 'delivered' && 'Entregue'}
                                      {st === 'cancelled' && 'Cancelar'}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Guideline Prominent Next-Action WhatsApp Flow Trigger buttons */}
                            {(order.status === 'pending' || order.status === 'accepted' || order.status === 'preparing') && (
                              <div className="col-span-1 md:col-span-3 mt-2 pt-3 border-t border-stone-200 flex flex-col gap-2">
                                {order.status === 'pending' ? (
                                  <button
                                    onClick={() => handleUpdateStatus(order.id, 'accepted')}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                                  >
                                    ✅ ACEITAR PEDIDO & ENVIAR PREPARO (Avisar Cliente via WhatsApp)
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUpdateStatus(order.id, 'out_for_delivery')}
                                    className="w-full bg-[#5c0d12] hover:bg-red-900 border-2 border-amber-400 text-white font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                                  >
                                    🛵 PEDIDO PRONTO... A CAMINHO! (Avisar Saída p/ Entrega via WhatsApp)
                                  </button>
                                )}
                              </div>
                            )}

                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PRODUCTS */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 justify-between items-center">
                    <div>
                      <h2 className="font-display text-lg text-stone-900 border-l-4 border-amber-500 pl-2">Gerenciamento de Cardápio</h2>
                      <p className="text-xs text-stone-500">Adicione, edite ou exclua pastéis e promoções exibidos no menu principal.</p>
                    </div>
                    <button 
                      onClick={openAddProductModal} 
                      className="bg-amber-400 hover:bg-amber-500 text-stone-950 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 border border-amber-500 shadow-sm transition-all hover:scale-[1.02]"
                    >
                      <Plus size={16} /> Novo Pastel / Combo
                    </button>
                  </div>

                  {/* Dashboard Table list of pastels */}
                  <div className="border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-stone-50 text-stone-500 border-b border-stone-200 uppercase text-[10px] tracking-wider font-bold">
                            <th className="p-3 pl-4">Produto</th>
                            <th className="p-3">Categoria</th>
                            <th className="p-3">Preço</th>
                            <th className="p-3">Estoque / Status</th>
                            <th className="p-3 pr-4 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {products.map((prod) => (
                            <tr key={prod.id} className="hover:bg-stone-50/50 transition-colors">
                              <td className="p-3 pl-4">
                                <div>
                                  <p className="font-bold text-stone-900">{prod.name}</p>
                                  <p className="text-xs text-stone-500 max-w-sm line-clamp-1">{prod.description}</p>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="bg-stone-100 text-stone-750 text-[10px] font-bold px-2 py-0.5 rounded tracking-wide border border-stone-200 font-mono">
                                  {prod.category}
                                </span>
                              </td>
                              <td className="p-3 font-mono font-bold text-stone-850">
                                R$ {Number(prod.price).toFixed(2)}
                              </td>
                              <td className="p-3">
                                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${prod.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${prod.available ? 'bg-green-600' : 'bg-red-650'}`} />
                                  {prod.available ? 'Disponível' : 'Indisponível'}
                                </span>
                              </td>
                              <td className="p-3 pr-4">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button 
                                    onClick={() => openEditProductModal(prod)} 
                                    className="p-1.5 text-stone-500 hover:text-amber-700 bg-white hover:bg-stone-100 border border-stone-200 rounded transition-colors"
                                    title="Editar"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteProduct(prod.id)} 
                                    className="p-1.5 text-stone-400 hover:text-red-600 bg-white hover:bg-red-50 border border-stone-200 rounded transition-colors"
                                    title="Excluir"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <h2 className="font-display text-lg text-stone-900 border-l-4 border-amber-500 pl-2">Configurações Gerais do Delivery</h2>
                    <p className="text-xs text-stone-500">Defina o telefone para receber pedidos no WhatsApp, taxas de entrega e links de redes sociais.</p>
                  </div>

                  <form onSubmit={handleSaveSettings} className="space-y-4 border border-stone-200 rounded-2xl p-6 bg-stone-50 shadow-sm">
                    {/* Status do Estabelecimento */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-stone-200">
                      <div>
                        <p className="font-bold text-stone-900 text-sm">Status do Rei do Pastel</p>
                        <p className="text-xs text-stone-500">Controla se o site aceita pedidos de entrega no momento.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, isOpen: !settingsForm.isOpen })}
                        className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          settingsForm.isOpen 
                            ? 'bg-green-500 text-white border-green-600 hover:bg-green-600' 
                            : 'bg-red-500 text-white border-red-600 hover:bg-red-600'
                        }`}
                      >
                        <Power size={14} />
                        {settingsForm.isOpen ? 'ABERTO (Aceitando Pedidos)' : 'FECHADO (Sinal de Pausa)'}
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Telefone Whatsapp */}
                      <div>
                        <label className="block text-xs font-bold text-stone-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                          <Phone className="text-emerald-600" size={13} /> Telefone WhatsApp (Receber Resumo)
                        </label>
                        <input
                          type="text"
                          value={settingsForm.phone}
                          onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                          placeholder="Ex: 5511999999999"
                          required
                          className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-semibold font-mono bg-white focus:outline-none focus:ring-2 focus:ring-[#5c0d12]"
                        />
                        <span className="text-[10px] text-stone-400 mt-1 block">Insira apenas números com código de país e DDD (Ex: 55 para o Brasil).</span>
                      </div>

                      {/* Taxa de Entrega padrão */}
                      <div>
                        <label className="block text-xs font-bold text-stone-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                          <DollarSign className="text-amber-500" size={13} /> Taxa de Entrega Fixa Padrão (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={settingsForm.deliveryFee}
                          onChange={(e) => setSettingsForm({ ...settingsForm, deliveryFee: Number(e.target.value) })}
                          required
                          className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-semibold font-mono bg-white focus:outline-none focus:ring-2 focus:ring-[#5c0d12]"
                        />
                      </div>
                    </div>

                    {/* Endereco Fisico para retirar */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                          <MapPin className="text-[#5c0d12]" size={13} /> Endereço Físico do Palácio (Sede)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={settingsForm.address}
                            onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                            placeholder="Ex: Avenida Paulista, 1000 - Bela Vista, São Paulo - SP"
                            required
                            className="flex-1 p-2.5 rounded-xl border border-stone-300 text-sm font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red"
                          />
                          <button
                            type="button"
                            onClick={handleGeocodeStoreAddress}
                            disabled={isGeocodingStore}
                            className="px-4 py-2.5 bg-[#5c0d12] hover:bg-red-900 text-white rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-sm border border-[#5c0d12] hover:border-red-900 cursor-pointer disabled:opacity-50"
                          >
                            <MapPin size={14} /> {isGeocodingStore ? 'Buscando...' : 'Localizar Coordenadas'}
                          </button>
                        </div>
                        <p className="text-[10px] text-stone-500 mt-1">Insira o endereço completo e clique em "Localizar Coordenadas" para salvar as coordenadas reais do GPS da sua loja via OpenStreetMap.</p>
                      </div>

                      {/* Coordinates fields display */}
                      <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-stone-200">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Latitude da Loja</label>
                           <input
                             type="number"
                             step="any"
                             required
                             value={settingsForm.storeLatitude ?? ''}
                             onChange={(e) => setSettingsForm({ ...settingsForm, storeLatitude: parseFloat(e.target.value) })}
                             placeholder="Ex: -23.561506"
                             className="w-full p-2 rounded-lg border border-stone-250 text-xs font-mono font-semibold bg-stone-50"
                           />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Longitude da Loja</label>
                           <input
                             type="number"
                             step="any"
                             required
                             value={settingsForm.storeLongitude ?? ''}
                             onChange={(e) => setSettingsForm({ ...settingsForm, storeLongitude: parseFloat(e.target.value) })}
                             placeholder="Ex: -46.656139"
                             className="w-full p-2 rounded-lg border border-stone-250 text-xs font-mono font-semibold bg-stone-50"
                           />
                        </div>
                      </div>
                    </div>

                    {/* NOVO SISTEMA DE CALCULO DE FRETE */}
                    <div className="border-t border-dashed border-stone-200 pt-4 space-y-4">
                      <h3 className="font-display text-sm text-stone-900 font-bold border-l-4 border-[#5c0d12] pl-2 uppercase tracking-wide">
                        🚚 Configurações de Frete Inteligente por KM (OpenStreetMap)
                      </h3>
                      <p className="text-xs text-stone-500 -mt-2 font-medium">Calcule o valor da entrega baseado na rota de trânsito em tempo real (sem pegadinhas ou cobranças ocultas).</p>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        
                        {/* Limite de Frete Gratis por KM */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1.5 flex items-center gap-1">
                            Frete Grátis até (KM)
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={settingsForm.freeDistanceLimit ?? 3}
                            onChange={(e) => setSettingsForm({ ...settingsForm, freeDistanceLimit: parseInt(e.target.value) || 0 })}
                            className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-semibold font-mono bg-white focus:outline-none focus:ring-1 focus:ring-[#5c0d12]"
                          />
                          <span className="text-[9px] text-stone-400 mt-1 block font-medium">Ex: Até 3 KM o frete é R$ 0,00</span>
                        </div>

                        {/* Valor por KM adicional */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1.5 flex items-center gap-1">
                            Valor do KM Adicional (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={settingsForm.pricePerExcessKm ?? 2.50}
                            onChange={(e) => setSettingsForm({ ...settingsForm, pricePerExcessKm: parseFloat(e.target.value) || 0 })}
                            className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-semibold font-mono bg-white focus:outline-none focus:ring-1 focus:ring-[#5c0d12]"
                          />
                          <span className="text-[9px] text-stone-400 mt-1 block font-medium">Ex: R$ 2,50 a cada KM excedente</span>
                        </div>

                        {/* Distancia maxima de entrega */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1.5 flex items-center gap-1">
                            Distância Máxima (KM)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            value={settingsForm.maxDeliveryDistance ?? 15}
                            onChange={(e) => setSettingsForm({ ...settingsForm, maxDeliveryDistance: parseFloat(e.target.value) || 0 })}
                            className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-semibold font-mono bg-white focus:outline-none focus:ring-1 focus:ring-[#5c0d12]"
                          />
                          <span className="text-[9px] text-stone-400 mt-1 block font-medium">Ex: Máximo 15 KM de distância real</span>
                        </div>

                        {/* Taxa minima de entrega */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1.5 flex items-center gap-1">
                            Taxa Mínima de Frete (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={settingsForm.minDeliveryFee ?? 5.00}
                            onChange={(e) => setSettingsForm({ ...settingsForm, minDeliveryFee: parseFloat(e.target.value) || 0 })}
                            className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-semibold font-mono bg-white focus:outline-none focus:ring-1 focus:ring-[#5c0d12]"
                          />
                          <span className="text-[9px] text-stone-400 mt-1 block font-medium">Ex: Nunca cobrar menos que R$ 5,00</span>
                        </div>

                        {/* Frete gratis por valor de pedido */}
                        <div className="col-span-2 md:col-span-1">
                          <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1.5 flex items-center gap-1">
                            Frete Grátis acima de (R$)
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={settingsForm.freeDeliveryMinOrderValue ?? 80}
                            onChange={(e) => setSettingsForm({ ...settingsForm, freeDeliveryMinOrderValue: parseFloat(e.target.value) || 0 })}
                            className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-semibold font-mono bg-white focus:outline-none focus:ring-1 focus:ring-[#5c0d12]"
                          />
                          <span className="text-[9px] text-stone-400 mt-1 block font-medium">Ex: Pedidos maiores que R$ 80,00 tem frete R$ 0</span>
                        </div>

                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Instagram */}
                      <div>
                        <label className="block text-xs font-bold text-stone-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                          <Instagram className="text-pink-600" size={13} /> Instagram Oficial
                        </label>
                        <input
                          type="text"
                          value={settingsForm.instagram}
                          onChange={(e) => setSettingsForm({ ...settingsForm, instagram: e.target.value })}
                          placeholder="@reidopastel.delivery"
                          className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#5c0d12]"
                        />
                      </div>

                      {/* Facebook */}
                      <div>
                        <label className="block text-xs font-bold text-stone-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                          <Facebook className="text-blue-600" size={13} /> Facebook Oficial
                        </label>
                        <input
                          type="text"
                          value={settingsForm.facebook}
                          onChange={(e) => setSettingsForm({ ...settingsForm, facebook: e.target.value })}
                          placeholder="reidopasteloficial"
                          className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#5c0d12]"
                        />
                      </div>
                    </div>

                    {/* Submit settings button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSavingSettings}
                        className="w-full bg-[#5c0d12] hover:bg-red-900 border border-amber-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform hover:scale-[1.01] flex items-center justify-center gap-1"
                      >
                        <Settings size={16} /> {isSavingSettings ? 'Salvando Ajustes...' : 'Salvar Alterações e Configurações'}
                      </button>
                    </div>

                  </form>
                </div>
              )}

            </div>
          </>
        )}

      </div>

      {/* PRODUCT SUB-MODAL FOR ADD/EDIT */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-60 overflow-y-auto flex items-center justify-center p-4 backdrop-blur-sm" id="product_modal_backdrop">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-stone-50 rounded-2xl border border-amber-400 w-full max-w-md p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 bg-white hover:bg-stone-100 rounded-full transition-colors border border-stone-200"
              >
                <X size={16} />
              </button>

              <h3 className="font-display text-lg text-stone-900 mb-4 pb-2 border-b border-stone-250 flex items-center gap-2">
                <Settings className="text-[#5c0d12]" size={18} />
                {editingProduct ? 'Editar Pastel' : 'Novo Pastel / Combo'}
              </h3>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                {/* Product Name */}
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Nome do pastel</label>
                  <input
                    type="text"
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    placeholder="Ex: Árabe, Misto, 4 Queijos..."
                    required
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#5c0d12]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Descrição do Recheio</label>
                  <textarea
                    value={prodForm.description}
                    onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                    placeholder="Ex: Carne moída de primeira, requeijão..."
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#5c0d12] h-20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Price */}
                  <div>
                    <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Preço (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={prodForm.price || ''}
                      onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                      placeholder="e.g. 13.90"
                      required
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-semibold font-mono bg-white focus:outline-none focus:ring-2 focus:ring-[#5c0d12]"
                    />
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Categoria</label>
                    <div className="relative">
                      <select
                        value={prodForm.category}
                        onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                        className="w-full p-2.5 pr-8 appearance-none rounded-xl border border-stone-300 text-xs font-bold text-stone-750 bg-white focus:outline-none focus:ring-2 focus:ring-[#5c0d12]"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-3.5 text-stone-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Available Status */}
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-stone-200">
                  <div>
                    <p className="font-bold text-stone-900 text-xs">Está Disponível para Venda?</p>
                    <p className="text-[10px] text-stone-500">Se desativado, o item ficará com aviso "Esgotado".</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProdForm({ ...prodForm, available: !prodForm.available })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      prodForm.available 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-red-100 text-red-800 border-red-200'
                    }`}
                  >
                    {prodForm.available ? 'Sim (Disponível)' : 'Não (Esgotado)'}
                  </button>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-[#5c0d12] hover:bg-red-900 border border-amber-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform hover:scale-[1.01]"
                  >
                    Salvar Dados no Cardápio
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
