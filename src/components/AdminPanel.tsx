import React, { useState, useEffect } from 'react';
import { 
  db,
  auth, 
  googleProvider, 
  isFirestoreReal, 
  saveProduct, 
  deleteProduct, 
  saveSettings, 
  updateOrderStatus, 
  deleteOrder,
  syncOrders,
  seedFirestoreDatabase,
  forceResetDatabase,
  wipeAllProducts,
  syncCustomers,
  deleteCustomer,
  createCustomer,
  syncCoupons,
  saveCoupon,
  deleteCoupon,
  syncCategories,
  saveCategory,
  deleteCategory,
  syncUsers,
  saveUserAccount,
  deleteUserAccount,
  getUserProfile,
  firebaseConfig
} from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut as authSignOut } from 'firebase/auth';
import { Product, AppSettings, Order, Customer, Coupon, Category, UserAccount } from '../types';
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
  Lock,
  Image,
  Shield,
  Users,
  Search,
  Check,
  AlertCircle,
  Ban,
  ClipboardList,
  FolderLock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PDV_Component from './PDV';

// Secure helper to pre-register employee or motoboy accounts into Firebase Auth without breaking current admin session
const createAuthAccount = async (email: string, pass: string): Promise<string> => {
  const tempAppName = `temp-auth-app-${Date.now()}`;
  const tempApp = initializeApp(firebaseConfig, tempAppName);
  const tempAuth = getAuth(tempApp);
  try {
    const credential = await createUserWithEmailAndPassword(tempAuth, email, pass);
    const newUid = credential.user.uid;
    await authSignOut(tempAuth);
    return newUid;
  } catch (err) {
    console.error("Authentication account creation failed:", err);
    throw err;
  }
};

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
  const [activeTab, setActiveTab] = useState<string>('orders');

  // Customer & Coupon States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Category and User Accounts States
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [userProfile, setUserProfile] = useState<UserAccount | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const alarmIntervalIdRef = React.useRef<any>(null);

  // Auto-unlock AudioContext on user interaction anywhere on the document
  useEffect(() => {
    const unlock = () => {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      setAudioUnlocked(true);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  const playSirenChirp = (ctx: AudioContext) => {
    const now = ctx.currentTime;
    
    // Pierce eardrums with sequential, fast-beeping high frequency buzzes (Sawtooth & Square waveforms are extremely buzzy/loud)
    const playBeep = (timeSecs: number, type: 'sawtooth' | 'square', freq: number, duration: number) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, timeSecs);
        
        // Fast attack, full sustain at highly-noticeable volume, abrupt decay
        gain.gain.setValueAtTime(0.001, timeSecs);
        gain.gain.linearRampToValueAtTime(0.85, timeSecs + 0.02);
        gain.gain.setValueAtTime(0.85, timeSecs + duration - 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, timeSecs + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(timeSecs);
        osc.stop(timeSecs + duration);
      } catch (e) {
        // Safe play
      }
    };
    
    // Extremely scandalous iFood style repetitive buzzer cadence (Beep beep beep screech!)
    playBeep(now, 'sawtooth', 1200, 0.18);
    playBeep(now + 0.22, 'square', 1400, 0.18);
    playBeep(now + 0.44, 'sawtooth', 1200, 0.18);
    playBeep(now + 0.66, 'square', 1600, 0.35); // Piercing lock screech
  };

  const hasPendingOrders = orders.some(o => o.status === 'pending');

  // Continual loud alarm manager
  useEffect(() => {
    if (!hasPendingOrders) {
      if (alarmIntervalIdRef.current) {
        clearInterval(alarmIntervalIdRef.current);
        alarmIntervalIdRef.current = null;
      }
      return;
    }

    // Initialize or continue alarm loop if there are pending orders
    if (!alarmIntervalIdRef.current) {
      const triggerAlarmTick = () => {
        if (!audioCtxRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            audioCtxRef.current = new AudioContextClass();
          }
        }
        if (audioCtxRef.current) {
          if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
          }
          try {
            playSirenChirp(audioCtxRef.current);
          } catch (e) {
            console.warn("Loud alarm sound failed to play: user interaction probably missing.", e);
          }
        }
      };

      // Play first tick immediately
      triggerAlarmTick();

      // Loop every 1.4 seconds (fast urgent repetitiveness)
      alarmIntervalIdRef.current = setInterval(triggerAlarmTick, 1400);
    }

    return () => {
      // Intentionally keep running or let the dependencies re-eval
    };
  }, [hasPendingOrders, audioUnlocked]);

  // Clean-up loop on unmount
  useEffect(() => {
    return () => {
      if (alarmIntervalIdRef.current) {
        clearInterval(alarmIntervalIdRef.current);
      }
    };
  }, []);
  
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
    category: 'EMPADAS',
    available: true,
    imageUrl: ''
  });

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as 'employee' | 'motoboy',
    status: 'active' as 'active' | 'inactive',
    cargo: '',
    phone: ''
  });
  const [isSavingUser, setIsSavingUser] = useState(false);

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
    storeLatitude: -22.7529404,
    storeLongitude: -43.4833290,
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
      storeLatitude: -22.7529404,
      storeLongitude: -43.4833290,
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

  // Resolve user profile from Firestore or localStorage fallback
  useEffect(() => {
    if (!currentUser) {
      setUserProfile(null);
      return;
    }
    setProfileLoading(true);
    getUserProfile(currentUser.uid).then((profile) => {
      if (profile) {
        setUserProfile(profile);
      } else {
        const isB = currentUser.email === 'pastel@x.com' || currentUser?.email === 'tudojonas38@gmail.com' || isBypassedAdmin;
        if (isB) {
          setUserProfile({
            id: currentUser.uid,
            name: "Rei do Pastel Administrator",
            email: currentUser.email || 'pastel@x.com',
            role: 'admin',
            status: 'active'
          });
        }
      }
    }).finally(() => {
      setProfileLoading(false);
    });
  }, [currentUser, isBypassedAdmin]);

  const isAdminRole = userProfile?.role === 'admin' || isCertifiedAdmin;
  const isEmployeeRole = userProfile?.role === 'employee' && userProfile?.status === 'active';
  const isMotoboyRole = userProfile?.role === 'motoboy' && userProfile?.status === 'active';

  // If a logged-in user becomes inactive, force logout automatically
  useEffect(() => {
    if (userProfile && userProfile.status === 'inactive') {
      alert("⚠️ Sua conta de acesso foi desativada pelo administrador. Entre em contato com a gerência.");
      handleLogout();
    }
  }, [userProfile]);

  // Real-time orders synchronization for authenticated roles
  useEffect(() => {
    const hasAccess = isAdminRole || isEmployeeRole || isMotoboyRole;
    if (!hasAccess) {
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
  }, [isAdminRole, isEmployeeRole, isMotoboyRole, currentUser]);

  // Real-time synchronization for Customers & Coupons
  useEffect(() => {
    const hasAccess = isAdminRole || isEmployeeRole;
    if (!hasAccess) {
      setCustomers([]);
      setCoupons([]);
      return;
    }

    const unsubCustomers = syncCustomers((freshCustomers) => {
      setCustomers(freshCustomers);
    });

    const unsubCoupons = syncCoupons((freshCoupons) => {
      setCoupons(freshCoupons);
    });

    return () => {
      unsubCustomers();
      unsubCoupons();
    };
  }, [isAdminRole, isEmployeeRole]);

  // Real-time synchronization for Categories (All roles read)
  useEffect(() => {
    const unsub = syncCategories((fresh) => {
      setCategories(fresh);
    });
    return () => unsub();
  }, []);

  // Real-time synchronization for Users List (Admin only)
  useEffect(() => {
    if (!isAdminRole) {
      setUsers([]);
      return;
    }
    const unsub = syncUsers((fresh) => {
      setUsers(fresh);
    });
    return () => unsub();
  }, [isAdminRole]);

  // Email-Password Login states
  const [emailInput, setEmailInput] = useState('pastel@x.com');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Coupon admin form state
  const [coupForm, setCoupForm] = useState({
    code: '',
    discountValue: 10,
    discountType: 'percentage' as 'percentage' | 'fixed',
    active: true
  });
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);

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
    'EMPADAS',
    'EMPADÃO',
    'SALGADINHOS (20G)',
    'CALABRESA',
    'CAMARÃO',
    'CARNE SECA',
    'AVENTURE-SE',
    'NACIONALIDADES',
    'PEITO DE PERU',
    'X-PASTEL',
    'PASTEL DOCE',
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
      price: 5.90,
      category: 'EMPADAS',
      available: true,
      imageUrl: ''
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
      available: product.available,
      imageUrl: product.imageUrl || ''
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
      available: prodForm.available,
      imageUrl: prodForm.imageUrl
    };

    await saveProduct(productToSave);
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm("Tem certeza que deseja excluir este pastel?")) {
      await deleteProduct(productId);
    }
  };

  const [isResettingMenu, setIsResettingMenu] = useState(false);

  const handleResetToOfficialMenu = async () => {
    if (!confirm("⚠️ ATENÇÃO: Isso irá apagar todos os itens atuais do site e cadastrar apenas o Cardápio Oficial (Empadas, Empadões e Salgadinhos das fotos) direto no seu Firebase. Deseja continuar?")) return;
    
    setIsResettingMenu(true);
    try {
      await forceResetDatabase();
      alert("✅ Cardápio Oficial sincronizado e atualizado no Firebase com sucesso! Todo o site foi redefinido de forma segura e está funcionando 100%.");
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao atualizar o banco de dados: " + String(err));
    } finally {
      setIsResettingMenu(false);
    }
  };

  const [isWiping, setIsWiping] = useState(false);

  const handleWipeAllProducts = async () => {
    if (!confirm("⚠️ ATENÇÃO: Isso irá APAGAR DEFINITIVAMENTE todos os itens atuais da sua vitrine e do seu banco de dados Firebase! Tem certeza de que deseja esvaziar todo o cardápio?")) return;

    setIsWiping(true);
    try {
      await wipeAllProducts();
      alert("✅ Todos os produtos foram apagados com sucesso! Sua vitrine agora está 100% vazia.");
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao esvaziar o cardápio: " + String(err));
    } finally {
      setIsWiping(false);
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
        {!userProfile ? (
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
            {/* ESCANDALOSO ALERTA DE PEDIDOS PENDENTES (Estilo iFood) */}
            {hasPendingOrders && (
              <div className="bg-[#5c0d12] text-amber-300 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b-4 border-amber-400 animate-pulse transition-all shadow-2xl relative z-50">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-400 text-[#5c0d12] p-2.5 rounded-full animate-bounce shadow">
                    <AlertTriangle size={24} className="text-[#5c0d12]" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-sm sm:text-base tracking-wider text-white flex items-center gap-2">
                      🚨 ALERTE: {orders.filter(o => o.status === 'pending').length} NOVO(S) PEDIDO(S) PENDENTES NO PAINEL!
                    </h3>
                    <p className="text-xs text-amber-100 mt-0.5">
                      Som contínuo escandaloso ativo estilo iFood! Clique em <b>"ACEITAR PEDIDO"</b> na aba de Pedidos para parar o som de alerta.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  {!audioUnlocked ? (
                    <button
                      onClick={() => {
                        if (audioCtxRef.current) {
                          audioCtxRef.current.resume();
                        }
                        setAudioUnlocked(true);
                      }}
                      className="bg-amber-400 hover:bg-amber-500 text-[#5c0d12] font-black py-2.5 px-5 rounded-xl text-xs tracking-wider flex items-center gap-1.5 shadow transition-transform active:scale-95 text-center shrink-0 cursor-pointer"
                    >
                      🔊 ATIVAR ALERTA SONORO AGORA
                    </button>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-400 text-amber-300 font-mono text-[10px] uppercase font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shrink-0 select-none">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></span>
                      SIRENE IFood ATIVA
                    </div>
                  )}
                  {activeTab !== 'orders' && (
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="bg-white hover:bg-stone-100 text-[#5c0d12] font-black py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider shadow transition-transform active:scale-95 shrink-0 cursor-pointer"
                    >
                      Ir Para Pedidos Real-time 📝
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Top Info line and Navigation */}
            <div className="bg-stone-100 border-b border-stone-200 px-6 py-3 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-1 bg-stone-200 p-1 rounded-xl overflow-x-auto max-w-full">
                {isAdminRole && (
                  <>
                    <button 
                      onClick={() => setActiveTab('orders')} 
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-[#5c0d12] text-white shadow-sm' : 'text-stone-700 hover:bg-stone-300'}`}
                    >
                      Pedidos Real-time ({orders.length})
                    </button>
                    <button 
                      onClick={() => setActiveTab('products')} 
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'products' ? 'bg-[#5c0d12] text-white shadow-sm' : 'text-stone-700 hover:bg-stone-300'}`}
                    >
                      Cardápio ({products.length})
                    </button>
                    <button 
                      onClick={() => setActiveTab('categories')} 
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'categories' ? 'bg-[#5c0d12] text-white shadow-sm' : 'text-stone-700 hover:bg-stone-300'}`}
                    >
                      Categorias ({categories.length})
                    </button>
                    <button 
                      onClick={() => setActiveTab('users')} 
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-[#5c0d12] text-white shadow-sm' : 'text-stone-700 hover:bg-stone-300'}`}
                    >
                      Usuários ({users.length})
                    </button>
                    <button 
                      onClick={() => setActiveTab('customers')} 
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'customers' ? 'bg-[#5c0d12] text-white shadow-sm' : 'text-stone-700 hover:bg-stone-300'}`}
                    >
                      Clientes ({customers.length})
                    </button>
                    <button 
                      onClick={() => setActiveTab('coupons')} 
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'coupons' ? 'bg-[#5c0d12] text-white shadow-sm' : 'text-stone-700 hover:bg-stone-300'}`}
                    >
                      Cupons ({coupons.length})
                    </button>
                    <button 
                      onClick={() => setActiveTab('settings')} 
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-[#5c0d12] text-white shadow-sm' : 'text-stone-700 hover:bg-stone-300'}`}
                    >
                      Configurações
                    </button>
                  </>
                )}
                {isEmployeeRole && (
                  <>
                    <button 
                      onClick={() => setActiveTab('orders')} 
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-[#5c0d12] text-white shadow-sm' : 'text-stone-700 hover:bg-stone-300'}`}
                    >
                      Pedidos Real-time ({orders.length})
                    </button>
                    <button 
                      onClick={() => setActiveTab('pdv')} 
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'pdv' ? 'bg-[#5c0d12] text-white shadow-sm' : 'text-stone-700 hover:bg-stone-300'}`}
                    >
                      🧮 PDV Balcão
                    </button>
                    <button 
                      onClick={() => setActiveTab('customers')} 
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'customers' ? 'bg-[#5c0d12] text-white shadow-sm' : 'text-stone-700 hover:bg-stone-300'}`}
                    >
                      Clientes ({customers.length})
                    </button>
                  </>
                )}
                {isMotoboyRole && (
                  <>
                    <button 
                      onClick={() => setActiveTab('motoboy_deliveries')} 
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'motoboy_deliveries' ? 'bg-[#5c0d12] text-white shadow-sm' : 'text-stone-700 hover:bg-stone-300'}`}
                    >
                      🛵 Minhas Entregas
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="text-right">
                  <p className="font-semibold text-stone-800 text-xs">
                    {userProfile?.name || "Administrador Ativo"}
                  </p>
                  <p className="text-[10px] text-stone-500 font-mono flex items-center gap-1 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {userProfile?.role === 'admin' && '👑 Administrador'}
                    {userProfile?.role === 'employee' && '👨‍🍳 Funcionário'}
                    {userProfile?.role === 'motoboy' && '🛵 Motoboy Imperial'}
                    ({currentUser?.email || 'DEBUG@local'})
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
                          onClick={() => {
                            if (!audioCtxRef.current) {
                              const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                              if (AudioContextClass) {
                                audioCtxRef.current = new AudioContextClass();
                              }
                            }
                            if (audioCtxRef.current) {
                              if (audioCtxRef.current.state === 'suspended') {
                                audioCtxRef.current.resume();
                              }
                              try {
                                playSirenChirp(audioCtxRef.current);
                              } catch (e) {
                                console.warn(e);
                              }
                            }
                          }}
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
                      <p className="text-xs text-stone-500">Adicione, edite ou exclua empadas, empadões e salgadinhos do menu.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={handleWipeAllProducts}
                        disabled={isWiping}
                        className="bg-stone-100 hover:bg-stone-200 border border-stone-300 disabled:opacity-50 text-stone-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                      >
                        {isWiping ? '⌛ Apagando...' : '🗑️ Zerar Vitrine'}
                      </button>
                      <button 
                        onClick={handleResetToOfficialMenu}
                        disabled={isResettingMenu}
                        className="bg-red-50 hover:bg-red-100 disabled:opacity-50 text-[#5c0d12] border border-[#5c0d12]/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                      >
                        {isResettingMenu ? '⌛ Gravando...' : '🔄 Carregar Cardápio Oficial'}
                      </button>
                      <button 
                        onClick={openAddProductModal} 
                        className="bg-amber-400 hover:bg-amber-500 text-stone-950 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 border border-amber-500 shadow-sm transition-all hover:scale-[1.02]"
                      >
                        <Plus size={16} /> Novo Item
                      </button>
                    </div>
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

                    {/* Flyer de Promoções Diárias (Link Externo) */}
                    <div className="bg-[#5c0d12]/5 border border-[#5c0d12]/15 p-4 rounded-xl space-y-3">
                      <label className="block text-xs font-black text-[#5c0d12] uppercase tracking-wider flex items-center gap-1.5">
                        <Image className="text-brand-red" size={15} /> Flyer de Promoções Diárias (Diário de Promoções)
                      </label>
                      <p className="text-[10px] text-stone-700 leading-relaxed font-sans">
                        Insira o link de uma imagem externa (JPG, PNG, GIF) que será exibido no início do site como o diário de promoções do dia. 
                        Substituirá a área principal atual de apresentação se configurado.
                      </p>
                      
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={settingsForm.flyerUrl ?? ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, flyerUrl: e.target.value })}
                          placeholder="Ex: https://i.postimg.cc/sua-imagem-do-flyer.png"
                          className="flex-1 p-2.5 rounded-xl border border-stone-300 text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand-red font-mono"
                        />
                        {settingsForm.flyerUrl && (
                          <button
                            type="button"
                            onClick={() => setSettingsForm({ ...settingsForm, flyerUrl: '' })}
                            className="px-3 py-2 bg-stone-500 hover:bg-stone-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                          >
                            Limpar
                          </button>
                        )}
                      </div>

                      {settingsForm.flyerUrl && (
                        <div className="mt-2 border border-stone-200 rounded-xl p-2.5 bg-white flex flex-col items-center">
                          <span className="text-[10px] text-[#5c0d12] font-black uppercase mb-1.5 self-start">👁️ Pré-visualização do Flyer Real:</span>
                          <img 
                            src={settingsForm.flyerUrl} 
                            alt="Pré-visualização do Flyer"
                            className="max-h-48 object-contain rounded-lg border border-stone-155"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
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

              {/* TAB: GERENCIAR CATEGORIAS */}
              {activeTab === 'categories' && isAdminRole && (
                <div className="space-y-6">
                  <div className="flex flex-wrap justify-between items-center bg-stone-100 p-4 rounded-xl border border-stone-200 gap-3">
                    <div>
                      <h2 className="font-display text-lg text-stone-900 border-l-4 border-amber-500 pl-2">Controle de Categorias</h2>
                      <p className="text-xs text-stone-500">Crie, edite e ative/desative as categorias do cardápio em tempo real.</p>
                    </div>
                    <button
                      onClick={() => {
                        const name = prompt("Digite o nome da nova categoria:");
                        if (name && name.trim()) {
                          saveCategory({
                            id: 'cat-' + Date.now(),
                            name: name.toUpperCase().trim(),
                            active: true
                          });
                        }
                      }}
                      className="bg-[#5c0d12] hover:bg-red-900 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow border border-amber-500"
                    >
                      <Plus size={14} /> Nova Categoria
                    </button>
                  </div>

                  <div className="border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 text-xs font-bold uppercase">
                          <th className="p-3">Nome da Categoria</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 text-sm">
                        {categories.map((cat) => (
                          <tr key={cat.id} className="hover:bg-amber-500/5 transition-colors">
                            <td className="p-3 font-semibold text-stone-800">{cat.name}</td>
                            <td className="p-3">
                              <button
                                onClick={async () => {
                                  await saveCategory({ ...cat, active: !cat.active });
                                }}
                                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                                  cat.active 
                                    ? 'bg-green-100 text-green-800 border border-green-200' 
                                    : 'bg-red-100 text-red-800 border border-red-200'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${cat.active ? 'bg-green-650' : 'bg-red-600'}`}></span>
                                {cat.active ? 'Ativada' : 'Desativada'}
                              </button>
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                onClick={() => {
                                  const name = prompt("Altere o nome da categoria:", cat.name);
                                  if (name && name.trim() && name !== cat.name) {
                                    saveCategory({ ...cat, name: name.toUpperCase().trim() });
                                  }
                                }}
                                className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                              >
                                <Edit2 size={12} /> Editar
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(`Tem certeza que deseja excluir permanentemente a categoria "${cat.name}"? Os produtos vinculados continuarão guardados no banco de dados.`)) {
                                    await deleteCategory(cat.id);
                                  }
                                }}
                                className="text-xs text-red-600 hover:underline inline-flex items-center gap-1"
                              >
                                <Trash2 size={12} /> Excluir
                              </button>
                            </td>
                          </tr>
                        ))}
                        {categories.length === 0 && (
                          <tr>
                            <td colSpan={3} className="p-6 text-center text-stone-400 text-xs">Nenhuma categoria cadastrada ainda. Utilize o botão acima para começar!</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: GERENCIAR USUÁRIOS & PERMISSÕES */}
              {activeTab === 'users' && isAdminRole && (
                <div className="space-y-6">
                  {/* Register Section */}
                  <div className="bg-[#5c0d12]/5 border border-[#5c0d12]/20 p-5 rounded-2xl">
                    <h3 className="font-display text-base text-stone-900 border-l-4 border-[#5c0d12] pl-2 mb-3">Cadastrar Novo Usuário (Funcionários & Motoboys)</h3>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!userForm.name.trim() || !userForm.email.trim() || !userForm.password.trim()) {
                          alert("Preencha todos os campos obrigatórios (nome, email e senha).");
                          return;
                        }
                        setIsSavingUser(true);
                        try {
                          let finalUid = 'usr-' + Date.now();
                          if (isFirestoreReal) {
                            // Register in authentication safely via temporary app helper
                            finalUid = await createAuthAccount(userForm.email, userForm.password);
                          }
                          await saveUserAccount({
                            id: finalUid,
                            name: userForm.name.trim(),
                            email: userForm.email.toLowerCase().trim(),
                            role: userForm.role,
                            status: userForm.status,
                            cargo: userForm.role === 'employee' ? userForm.cargo : '',
                            phone: userForm.role === 'motoboy' ? userForm.phone : '',
                            password: userForm.password // Stored securely for reference or fallback validation
                          });
                          alert(`✅ Usuário ${userForm.name} cadastrado com sucesso!`);
                          setUserForm({
                            name: '',
                            email: '',
                            password: '',
                            role: 'employee',
                            status: 'active',
                            cargo: '',
                            phone: ''
                          });
                        } catch (err: any) {
                          alert("Erro ao cadastrar usuário: " + (err.message || String(err)));
                        } finally {
                          setIsSavingUser(false);
                        }
                      }}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                    >
                      <div className="col-span-1">
                        <label className="block text-xs font-bold text-stone-600 mb-1">Nome Completo</label>
                        <input
                          type="text"
                          required
                          value={userForm.name}
                          onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-xs"
                          placeholder="Ex: João da Silva"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-bold text-stone-600 mb-1">E-mail de Trabalho</label>
                        <input
                          type="email"
                          required
                          value={userForm.email}
                          onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-xs"
                          placeholder="joao@pastel.com"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-bold text-stone-600 mb-1">Senha de Acesso</label>
                        <input
                          type="text"
                          required
                          value={userForm.password}
                          onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-xs"
                          placeholder="Min. 6 caracteres"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-bold text-stone-600 mb-1">Nível de Acesso / Função</label>
                        <select
                          value={userForm.role}
                          onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as any }))}
                          className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-xs"
                        >
                          <option value="employee">👨‍🍳 Funcionário de Cozinha/Balcão</option>
                          <option value="motoboy">🛵 Motoboy de Entrega</option>
                        </select>
                      </div>

                      {userForm.role === 'employee' ? (
                        <div className="col-span-1 sm:col-span-2">
                          <label className="block text-xs font-bold text-stone-600 mb-1">Cargo Real (Ex: Atendente, Pizzaiolo, Caixa)</label>
                          <input
                            type="text"
                            value={userForm.cargo}
                            onChange={(e) => setUserForm(prev => ({ ...prev, cargo: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-xs"
                            placeholder="Atendente de Balcão e Operador de PDV"
                          />
                        </div>
                      ) : (
                        <div className="col-span-1 sm:col-span-2">
                          <label className="block text-xs font-bold text-stone-600 mb-1">Telefone WhatsApp do Motoboy</label>
                          <input
                            type="text"
                            value={userForm.phone}
                            onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-xs"
                            placeholder="21999999999"
                          />
                        </div>
                      )}

                      <div className="col-span-1">
                        <label className="block text-xs font-bold text-stone-600 mb-1">Status da Conta</label>
                        <select
                          value={userForm.status}
                          onChange={(e) => setUserForm(prev => ({ ...prev, status: e.target.value as any }))}
                          className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-xs font-bold"
                        >
                          <option value="active">🟢 Ativado (Consegue Logar)</option>
                          <option value="inactive">🔴 Desativado (Acesso Bloqueado)</option>
                        </select>
                      </div>

                      <div className="col-span-1 flex items-end">
                        <button
                          type="submit"
                          disabled={isSavingUser}
                          className="w-full bg-[#5c0d12] hover:bg-red-900 border border-amber-500 text-white font-bold py-2 px-4 rounded-xl text-xs shadow transition-colors active:scale-95 disabled:opacity-50"
                        >
                          {isSavingUser ? 'Cadastrando...' : '➕ Cadastrar Conta'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Users Grid */}
                  <div className="space-y-4">
                    <h3 className="font-display text-base text-stone-900 border-l-4 border-amber-500 pl-2">Funcionários e Motoboys Ativos ({users.length})</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {users.map((usr) => (
                        <div key={usr.id} className="border border-stone-200 rounded-2xl bg-stone-50 p-4 relative shadow-sm hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-stone-800 text-sm">{usr.name}</p>
                              <p className="text-[10px] text-stone-500 font-mono">{usr.email}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              usr.role === 'employee' ? 'bg-orange-100 text-orange-850' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {usr.role === 'employee' ? '👨‍🍳 Funcionário' : '🛵 Motoboy'}
                            </span>
                          </div>

                          <div className="space-y-1 mt-3 pt-3 border-t border-stone-200 text-xs text-stone-600">
                            {usr.role === 'employee' && <p><b>Cargo:</b> {usr.cargo || 'Geral'}</p>}
                            {usr.role === 'motoboy' && <p><b>WhatsApp:</b> {usr.phone || 'N/A'}</p>}
                            <p className="flex items-center gap-1.5 font-sans text-xs">
                              <b>Status no Palácio:</b>
                              <span className={`flex items-center gap-1 font-bold ${usr.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${usr.status === 'active' ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                {usr.status === 'active' ? 'Ativo' : 'Desativado'}
                              </span>
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-stone-200 flex gap-2 justify-end">
                            <button
                              onClick={async () => {
                                const newStatus = usr.status === 'active' ? 'inactive' : 'active';
                                await saveUserAccount({ ...usr, status: newStatus });
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                                usr.status === 'active' 
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300' 
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                              }`}
                            >
                              {usr.status === 'active' ? '🚫 Desativar' : '🟢 Ativar'}
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Deseja realmente remover permanentemente a conta de "${usr.name}"? Eles perderão o acesso imediatamente.`)) {
                                  await deleteUserAccount(usr.id);
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-bold border bg-red-50 hover:bg-red-100 text-red-700 border-red-300 transition-colors"
                            >
                              🗑️ Excluir
                            </button>
                          </div>
                        </div>
                      ))}
                      {users.length === 0 && (
                        <div className="col-span-full text-center py-6 text-stone-400 text-xs">Sem funcionários ou motoboys cadastrados.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: PDV BALCÃO */}
              {activeTab === 'pdv' && (isEmployeeRole || isAdminRole) && (
                <PDV_Component 
                  products={products}
                  categories={categories}
                  onSaleCompleted={() => {
                    setActiveTab('orders');
                  }}
                />
              )}

              {/* TAB: MOTOBOY DELIVERIES & QUEUE */}
              {activeTab === 'motoboy_deliveries' && isMotoboyRole && (
                <div className="space-y-6">
                  <div className="bg-stone-904 text-amber-100 bg-stone-900 p-5 rounded-2xl shadow border border-amber-400">
                    <h2 className="font-display text-lg text-amber-300 flex items-center gap-2"><Truck /> Painel Real-Time do Motoboy</h2>
                    <p className="text-xs text-stone-300 mt-1">Olá, <b>{userProfile?.name}</b>! Gerencie suas corridas de entrega com facilidade abaixo.</p>
                  </div>

                  {/* Active Deliveries */}
                  <div className="space-y-4">
                    <h3 className="font-display text-sm text-[#5c0d12] border-l-4 border-amber-500 pl-2 uppercase font-black tracking-wider">Minhas Entregas Ativas</h3>
                    <div className="grid gap-4">
                      {orders
                        .filter(o => o.deliveryMethod === 'delivery' && o.motoboyId === currentUser?.uid && o.status !== 'delivered' && o.status !== 'cancelled')
                        .map((order) => {
                          return (
                            <div key={order.id} className="border-2 border-amber-400 bg-amber-500/5 rounded-2xl p-5 shadow-sm space-y-4 text-left">
                              <div className="flex flex-wrap justify-between items-center gap-3 border-b border-stone-200 pb-3">
                                <span className="font-mono bg-[#5c0d12] text-white px-3 py-1 rounded-full text-xs font-black">PEDIDO #{order.id}</span>
                                <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                                  order.status === 'out_for_delivery' ? 'bg-purple-100 text-purple-800 animate-pulse' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {order.status === 'out_for_delivery' ? '🛵 EM ROTA DE ENTREGA' : '🎰 PREPARANDO NA COZINHA'}
                                </span>
                              </div>

                              <div className="grid sm:grid-cols-2 gap-4 text-xs text-stone-700">
                                <div className="space-y-1">
                                  <p className="font-bold text-stone-900 text-base">Cliente: {order.customerName}</p>
                                  <p><b>WhatsApp:</b> {order.customerPhone}</p>
                                  <p><b>Forma de Pagamento:</b> {order.paymentMethod}</p>
                                  {order.paymentChange && <p className="text-red-650 font-bold bg-red-50 p-2 rounded"><b>Troco:</b> {order.paymentChange}</p>}
                                  <p className="text-sm font-bold text-stone-900">Valor Total: R$ {Number(order.totalOrder).toFixed(2)}</p>
                                </div>
                                <div className="space-y-1 bg-stone-100 p-3 rounded-lg border">
                                  <p className="font-bold text-stone-800">📍 Endereço de Destino:</p>
                                  <p>{order.address?.street}, nº {order.address?.number}</p>
                                  <p>Bairro: {order.address?.neighborhood}</p>
                                  {order.address?.complement && <p>Complemento: {order.address.complement}</p>}
                                  {order.address?.reference && <p className="text-amber-700 font-sans">Referência: {order.address.reference}</p>}
                                  {order.deliveryDistanceKm && (
                                    <p className="font-mono font-black text-[#5c0d12] mt-1.5 text-[11px] uppercase">
                                      Distância em Linha Reta: {order.deliveryDistanceKm} KM
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-2">
                                {order.status !== 'out_for_delivery' ? (
                                  <button
                                    onClick={async () => {
                                      const nowStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                      await updateOrderStatus(order.id, 'out_for_delivery');
                                      if (isFirestoreReal && db) {
                                        const { doc, updateDoc } = await import('firebase/firestore');
                                        const orderRef = doc(db, 'orders', order.id);
                                        await updateDoc(orderRef, { shippedAt: nowStr });
                                      } else {
                                        const localOrders = localStorage.getItem('rei_do_pastel_orders');
                                        if (localOrders) {
                                          const list: Order[] = JSON.parse(localOrders);
                                          const idx = list.findIndex(o => o.id === order.id);
                                          if (idx >= 0) {
                                            list[idx].shippedAt = nowStr;
                                            list[idx].status = 'out_for_delivery';
                                            localStorage.setItem('rei_do_pastel_orders', JSON.stringify(list));
                                            window.dispatchEvent(new Event('rei_do_pastel_orders_updated'));
                                          }
                                        }
                                      }
                                      alert("🏍️ Rota Iniciada! Boa viagem e pilote com segurança.");
                                    }}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow cursor-pointer transition-transform active:scale-[0.99]"
                                  >
                                    🏍️ INICIAR ROTA (Mudar status para: A Caminho)
                                  </button>
                                ) : (
                                  <button
                                    onClick={async () => {
                                      const nowStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                      await updateOrderStatus(order.id, 'delivered');
                                      if (isFirestoreReal && db) {
                                        const { doc, updateDoc } = await import('firebase/firestore');
                                        const orderRef = doc(db, 'orders', order.id);
                                        await updateDoc(orderRef, { deliveredAt: nowStr });
                                      } else {
                                        const localOrders = localStorage.getItem('rei_do_pastel_orders');
                                        if (localOrders) {
                                          const list: Order[] = JSON.parse(localOrders);
                                          const idx = list.findIndex(o => o.id === order.id);
                                          if (idx >= 0) {
                                            list[idx].deliveredAt = nowStr;
                                            list[idx].status = 'delivered';
                                            localStorage.setItem('rei_do_pastel_orders', JSON.stringify(list));
                                            window.dispatchEvent(new Event('rei_do_pastel_orders_updated'));
                                          }
                                        }
                                      }
                                      alert("🏆 Parabéns! Mais uma entrega concluída para a realeza.");
                                    }}
                                    className="flex-1 bg-green-650 hover:bg-green-700 bg-green-600 text-white font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow cursor-pointer transition-transform active:scale-[0.99]"
                                  >
                                    🏁 FINALIZAR ROTA (Marcar como Entregue)
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                      {orders.filter(o => o.deliveryMethod === 'delivery' && o.motoboyId === currentUser?.uid && o.status !== 'delivered' && o.status !== 'cancelled').length === 0 && (
                        <p className="text-stone-400 text-xs py-4 text-center border border-dashed border-stone-200 bg-stone-50 rounded-xl">Você não possui nenhuma corrida ativa no momento. Aceite uma corrida abaixo!</p>
                      )}
                    </div>
                  </div>

                  {/* Available Deliveries Queue */}
                  <div className="space-y-4">
                    <h3 className="font-display text-sm text-[#5c0d12] border-l-4 border-amber-500 pl-2 uppercase font-black tracking-wider">Pedidos Disponíveis para Entrega</h3>
                    <div className="grid gap-4">
                      {orders
                        .filter(o => o.deliveryMethod === 'delivery' && (!o.motoboyId) && o.status !== 'delivered' && o.status !== 'cancelled')
                        .map((order) => {
                          return (
                            <div key={order.id} className="border border-stone-200 bg-stone-50 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono bg-[#5c0d12]/10 text-[#5c0d12] px-2 py-0.5 rounded text-xs font-bold">#{order.id}</span>
                                  <span className="text-stone-850 font-bold">{order.customerName}</span>
                                </div>
                                <div className="text-xs text-stone-600 space-y-1 font-sans">
                                  <p>📍 <b>Destino:</b> {order.address?.street}, {order.address?.number} ({order.address?.neighborhood})</p>
                                  {order.deliveryDistanceKm !== undefined && (
                                    <p className="text-teal-700 font-bold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded inline-block text-[11px] uppercase mt-1">
                                      📏 Distância GPS: {order.deliveryDistanceKm} KM
                                    </p>
                                  )}
                                  <p className="text-stone-900 font-bold gap-1.5 flex flex-wrap items-center mt-1">
                                    💰 Total: R$ {Number(order.totalOrder).toFixed(2)} | Comissão Frete: R$ {Number(order.deliveryFee).toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={async () => {
                                  const name = userProfile?.name || "Motoboy Imperial";
                                  const payload = {
                                    motoboyId: currentUser.uid,
                                    motoboyName: name,
                                    status: order.status === 'pending' ? 'accepted' : order.status
                                  };

                                  if (isFirestoreReal && db) {
                                    const { doc, updateDoc } = await import('firebase/firestore');
                                    const orderRef = doc(db, 'orders', order.id);
                                    await updateDoc(orderRef, payload);
                                  } else {
                                    const localOrders = localStorage.getItem('rei_do_pastel_orders');
                                    if (localOrders) {
                                      const list: Order[] = JSON.parse(localOrders);
                                      const idx = list.findIndex(o => o.id === order.id);
                                      if (idx >= 0) {
                                        list[idx] = { ...list[idx], ...payload };
                                        localStorage.setItem('rei_do_pastel_orders', JSON.stringify(list));
                                        window.dispatchEvent(new Event('rei_do_pastel_orders_updated'));
                                      }
                                    }
                                  }
                                  alert("✅ Sucesso! Corrida vinculada ao seu perfil. Prepare-se e inicie a rota assim que coletar.");
                                }}
                                className="bg-[#5c0d12] hover:bg-red-900 text-white font-extrabold py-2 px-4 rounded-xl text-xs transition-colors self-start md:self-center uppercase border border-amber-500 shadow active:scale-95 cursor-pointer"
                              >
                                🤝 Aceitar Entrega
                              </button>
                            </div>
                          );
                        })}

                      {orders.filter(o => o.deliveryMethod === 'delivery' && (!o.motoboyId) && o.status !== 'delivered' && o.status !== 'cancelled').length === 0 && (
                        <p className="text-stone-400 text-xs py-4 text-center">Fila vazia! Não há nenhum pedido precisando de entrega no momento.</p>
                      )}
                    </div>
                  </div>

                  {/* Delivery History */}
                  <div className="space-y-4 pt-4 border-t border-stone-200 text-left">
                    <h3 className="font-display text-sm text-stone-500 uppercase font-black tracking-wider">Histórico de Corridas Entregues</h3>
                    <div className="border border-stone-200 rounded-xl overflow-hidden text-xs bg-stone-50">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 font-bold">
                            <th className="p-3">Pedido</th>
                            <th className="p-3">Destino</th>
                            <th className="p-3">Horários (Saída / Chegada)</th>
                            <th className="p-3 text-right">Frete</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 font-mono text-stone-600">
                          {orders
                            .filter(o => o.deliveryMethod === 'delivery' && o.motoboyId === currentUser?.uid && o.status === 'delivered')
                            .map((order) => (
                              <tr key={order.id} className="hover:bg-stone-100 transition-colors">
                                <td className="p-3 font-semibold text-stone-850">#{order.id}</td>
                                <td className="p-3">{order.address?.street}, nº {order.address?.number}</td>
                                <td className="p-3 text-stone-500 font-sans">
                                  {order.shippedAt || '--:--'} às {order.deliveredAt || '--:--'}
                                </td>
                                <td className="p-3 text-right font-bold text-green-700">R$ {Number(order.deliveryFee).toFixed(2)}</td>
                              </tr>
                            ))}
                          {orders.filter(o => o.deliveryMethod === 'delivery' && o.motoboyId === currentUser?.uid && o.status === 'delivered').length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-stone-400 font-sans">Sua lista de históricos de corridas está vazia.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 4: CUSTOMERS */}
              {activeTab === 'customers' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="font-display text-lg text-stone-900 border-l-4 border-amber-500 pl-2">Clientes do Palácio (Realeza)</h2>
                    <p className="text-xs text-stone-500">
                      Visualize todos os clientes cadastrados para ganhar doações, bônus e o cupom de desconto de 10%.
                    </p>
                  </div>

                  <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                    {customers.length === 0 ? (
                      <div className="p-8 text-center text-stone-400 text-xs">
                        Nenhum cliente cadastrado ainda. Quando os clientes optarem por criar o cadastro grátis no momento do checkout, eles aparecerão aqui instantaneamente!
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-stone-700">
                          <thead className="bg-[#5c0d12]/5 text-[#5c0d12] uppercase font-bold border-b border-stone-200">
                            <tr>
                              <th className="p-3 pl-4">Nome do Cliente</th>
                              <th className="p-3">Telefone / WhatsApp</th>
                              <th className="p-3">Login Recomendado</th>
                              <th className="p-3">Senha de Acesso (Últimos 4 dígitos)</th>
                              <th className="p-3">Data de Cadastro</th>
                              <th className="p-3 pr-4 text-center">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 font-sans">
                            {customers.map((cust) => {
                              const cleanPhone = cust.phone.replace(/\D/g, '');
                              const last4Digits = cleanPhone.slice(-4) || 'S/N';
                              return (
                                <tr key={cust.id} className="hover:bg-amber-50/15 transition-colors">
                                  <td className="p-3 pl-4 font-bold text-stone-900">{cust.name}</td>
                                  <td className="p-3 font-mono font-medium">{cust.phone}</td>
                                  <td className="p-3 bg-stone-50 font-medium text-stone-600">{cust.name}</td>
                                  <td className="p-3 font-mono text-emerald-700 font-bold bg-emerald-50/50">{last4Digits}</td>
                                  <td className="p-3 text-stone-500 font-mono">
                                    {cust.createdAt ? new Date(cust.createdAt).toLocaleString('pt-BR') : 'Sem data'}
                                  </td>
                                  <td className="p-3 pr-4 text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`Deseja realmente remover o cliente ${cust.name}?`)) {
                                          deleteCustomer(cust.id);
                                        }
                                      }}
                                      className="px-2.5 py-1 text-[10px] bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded transition-colors cursor-pointer"
                                    >
                                      Excluir Cliente
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: COUPONS */}
              {activeTab === 'coupons' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-lg text-stone-900 border-l-4 border-amber-500 pl-2">Gerenciador de Cupons Real</h2>
                    <p className="text-xs text-stone-500">
                      Cadastre nomes de cupons personalizados e as taxas de desconto para aplicar na sacola dos clientes.
                    </p>
                  </div>

                  {/* Coupon Creation Card */}
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!coupForm.code.trim()) return;
                      setIsSavingCoupon(true);
                      try {
                        const payload: Omit<Coupon, 'id'> = {
                          code: coupForm.code.toUpperCase().trim(),
                          discountValue: Number(coupForm.discountValue),
                          discountType: coupForm.discountType,
                          active: coupForm.active
                        };
                        const uppercaseCode = coupForm.code.toUpperCase().trim();
                        await saveCoupon({ id: uppercaseCode, ...payload });
                        setCoupForm({ code: '', discountValue: 10, discountType: 'percentage', active: true });
                        alert(`Vossa Realeza! O cupom "${uppercaseCode}" foi gravado com sucesso no reino.`);
                      } catch (err) {
                        console.error("Failed to save coupon:", err);
                        alert("Ocorreu um erro ao salvar o cupom no banco de dados.");
                      } finally {
                        setIsSavingCoupon(false);
                      }
                    }}
                    className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-4 max-w-xl shadow-sm"
                  >
                    <span className="block text-xs font-black text-[#5c0d12] uppercase tracking-wider">
                      ➕ Cadastrar Novo Cupom de Desconto
                    </span>

                    <div className="grid grid-cols-2 gap-4 font-sans">
                      {/* Code */}
                      <div>
                        <label className="block text-xs font-bold text-stone-600 uppercase mb-1.5">Código do Cupom</label>
                        <input
                          type="text"
                          required
                          value={coupForm.code}
                          onChange={(e) => setCoupForm({ ...coupForm, code: e.target.value })}
                          placeholder="Ex: REI10, PASCOA"
                          className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-extrabold uppercase bg-white focus:outline-none focus:ring-2 focus:ring-[#5c0d12]"
                        />
                      </div>

                      {/* Type */}
                      <div>
                        <label className="block text-xs font-bold text-stone-600 uppercase mb-1.5">Tipo de Desconto</label>
                        <div className="relative">
                          <select
                            value={coupForm.discountType}
                            onChange={(e) => setCoupForm({ ...coupForm, discountType: e.target.value as any })}
                            className="w-full p-2.5 pr-8 appearance-none rounded-xl border border-stone-300 text-xs font-bold text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#5c0d12]"
                          >
                            <option value="percentage">Porcentagem (%)</option>
                            <option value="fixed">Valor Fixo (R$)</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-2.5 top-3.5 text-stone-500 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 font-sans">
                      {/* Value */}
                      <div>
                        <label className="block text-xs font-bold text-stone-600 uppercase mb-1.5 font-sans">Valor do Desconto</label>
                        <input
                          type="number"
                          required
                          min="0.01"
                          step="any"
                          value={coupForm.discountValue || ''}
                          onChange={(e) => setCoupForm({ ...coupForm, discountValue: Number(e.target.value) })}
                          placeholder="Ex: 10"
                          className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-semibold font-mono bg-white focus:outline-none focus:ring-2 focus:ring-[#5c0d12]"
                        />
                      </div>

                      {/* Active Status */}
                      <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-stone-200">
                        <span className="text-xs font-bold text-stone-600 uppercase">Ativo?</span>
                        <button
                          type="button"
                          onClick={() => setCoupForm({ ...coupForm, active: !coupForm.active })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            coupForm.active 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}
                        >
                          {coupForm.active ? 'Ativo' : 'Desativado'}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingCoupon}
                      className="w-full bg-[#5c0d12] hover:bg-red-900 border border-amber-500 text-white font-bold py-2.5 rounded-xl shadow transition-all cursor-pointer text-xs uppercase tracking-wider font-sans font-black"
                    >
                      {isSavingCoupon ? 'Gravando Cupom...' : 'Gravar Cupom Real'}
                    </button>
                  </form>

                  {/* Coupons List Table */}
                  <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                    <span className="block text-xs font-black text-[#5c0d12] uppercase tracking-wider bg-stone-50 border-b border-stone-150 p-4">
                      🎟️ Cupons Cadastrados no Reino ({coupons.length})
                    </span>

                    {coupons.length === 0 ? (
                      <div className="p-8 text-center text-stone-400 text-xs">
                        Nenhum cupom cadastrado ainda. Use o formulário acima para registrar seu primeiro cupom promocional!
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-stone-700">
                          <thead className="bg-[#5c0d12]/5 text-[#5c0d12] uppercase font-bold border-b border-stone-200 font-sans">
                            <tr>
                              <th className="p-3 pl-4">Código do Cupom</th>
                              <th className="p-3">Valor / Porcentagem</th>
                              <th className="p-3">Tipo do Desconto</th>
                              <th className="p-3">Status Atual</th>
                              <th className="p-3 pr-4 text-center">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 font-sans">
                            {coupons.map((c) => (
                              <tr key={c.id} className="hover:bg-amber-50/15 transition-colors">
                                <td className="p-3 pl-4 font-extrabold text-[#5c0d12] text-sm uppercase font-mono tracking-wider">{c.code}</td>
                                <td className="p-3 font-mono font-bold text-stone-900">
                                  {c.discountType === 'percentage' ? `${c.discountValue}%` : `R$ ${Number(c.discountValue).toFixed(2)}`}
                                </td>
                                <td className="p-3 font-medium text-stone-605 font-sans">
                                  {c.discountType === 'percentage' ? 'Percentual (%)' : 'Fixo (R$)'}
                                </td>
                                <td className="p-3 font-medium">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        await saveCoupon({ ...c, active: !c.active });
                                      } catch (err) {
                                        console.error("Toggling coupon status error:", err);
                                      }
                                    }}
                                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full transition-all border cursor-pointer ${
                                      c.active 
                                        ? 'bg-green-105 text-green-800 border-green-200 hover:bg-green-200' 
                                        : 'bg-red-105 text-red-800 border-red-200 hover:bg-red-200'
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${c.active ? 'bg-green-600' : 'bg-red-650'}`} />
                                    {c.active ? 'Ativo' : 'Desativado'}
                                  </button>
                                </td>
                                <td className="p-3 pr-4 text-center">
                                  <button
                                    onClick={() => {
                                      if (confirm(`Deseja realmente excluir o cupom ${c.code}?`)) {
                                        deleteCoupon(c.id);
                                      }
                                    }}
                                    className="px-2.5 py-1 text-[10px] bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded transition-colors cursor-pointer"
                                  >
                                    Excluir
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
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
                        {(categories.length > 0 ? categories.map(c => c.name.toUpperCase()) : ['EMPADAS', 'EMPADÕES', 'DOCES', 'BEBIDAS']).map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-3.5 text-stone-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Image URL Field */}
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1">URL da Imagem Externa</label>
                  <input
                    type="url"
                    value={prodForm.imageUrl}
                    onChange={(e) => setProdForm({ ...prodForm, imageUrl: e.target.value })}
                    placeholder="Ex: https://link-da-imagem.com/imagem.png"
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5c0d12]"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">Deixe em branco para usar o emoji animado padrão da categoria.</p>
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
