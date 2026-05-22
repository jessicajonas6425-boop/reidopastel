import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Product, AppSettings, Order, Customer, Coupon, Category, UserAccount } from './types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS } from './productsSeed';

// Check if firebase config has placeholder values or is real
export const isFirestoreReal = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "PLACEHOLDER_API_KEY" && 
  !firebaseConfig.apiKey.includes("PLACEHOLDER");

let app;
let db: any = null;
let auth: any = null;
let googleProvider: any = null;

if (isFirestoreReal) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || 'default');
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (e) {
    console.warn("Failed to initialize Firebase SDK with config, falling back to local storage:", e);
  }
} else {
  console.log("Firebase is configured with placeholders. Operating in local storage mode.");
}

export { db, auth, googleProvider };

// Firestore Custom Error Handling compliant with SKILL.md
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function stripUndefined(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined);
  }
  const cleaned: any = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      cleaned[key] = stripUndefined(obj[key]);
    }
  }
  return cleaned;
}

// Relational DB test connector compliant with SKILL.md rules
export async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// --------------------------------------------------------------------------
// DATABASE REPOSITORY INTERFACE WITH DYNAMIC FALLBACK
// --------------------------------------------------------------------------

// Cache of local products in client-side state
const getLocalProducts = (): Product[] => {
  const existing = localStorage.getItem('rei_do_pastel_products');
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch (e) {
      return INITIAL_PRODUCTS;
    }
  }
  localStorage.setItem('rei_do_pastel_products', JSON.stringify(INITIAL_PRODUCTS));
  return INITIAL_PRODUCTS;
};

const saveLocalProducts = (products: Product[]) => {
  localStorage.setItem('rei_do_pastel_products', JSON.stringify(products));
  // Dispatch custom storage event for in-tab real-time sync
  window.dispatchEvent(new Event('rei_do_pastel_products_updated'));
};

const getLocalSettings = (): AppSettings => {
  const existing = localStorage.getItem('rei_do_pastel_settings');
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch (e) {
      return INITIAL_SETTINGS;
    }
  }
  localStorage.setItem('rei_do_pastel_settings', JSON.stringify(INITIAL_SETTINGS));
  return INITIAL_SETTINGS;
};

const saveLocalSettings = (settings: AppSettings) => {
  localStorage.setItem('rei_do_pastel_settings', JSON.stringify(settings));
  window.dispatchEvent(new Event('rei_do_pastel_settings_updated'));
};

const getLocalOrders = (): Order[] => {
  const existing = localStorage.getItem('rei_do_pastel_orders');
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch (e) {
      return [];
    }
  }
  return [];
};

const saveLocalOrders = (orders: Order[]) => {
  localStorage.setItem('rei_do_pastel_orders', JSON.stringify(orders));
  window.dispatchEvent(new Event('rei_do_pastel_orders_updated'));
};

// --- SERVICES EXPORTS ---

// 1. PRODUCTS
export const syncProducts = (callback: (products: Product[]) => void): () => void => {
  if (isFirestoreReal && db) {
    const path = 'products';
    try {
      return onSnapshot(collection(db, path), (snapshot) => {
        const prods: Product[] = [];
        snapshot.forEach((docSnap) => {
          prods.push({ id: docSnap.id, ...docSnap.data() } as Product);
        });
        
        if (prods.length === 0) {
          console.log("[Firebase] Products snapshot is empty. Loading INITIAL_PRODUCTS fallback.");
          callback(INITIAL_PRODUCTS);
        } else {
          callback(prods);
        }
      }, (error) => {
        console.warn("[Firebase] Failed to sync products from Firestore, using initial fallback:", error);
        callback(INITIAL_PRODUCTS);
      });
    } catch (err) {
      console.warn("[Firebase] Exception within syncProducts, using local fallback:", err);
      const trigger = () => {
        const localProds = getLocalProducts();
        callback(localProds.length === 0 ? INITIAL_PRODUCTS : localProds);
      };
      trigger();
      window.addEventListener('rei_do_pastel_products_updated', trigger);
      return () => window.removeEventListener('rei_do_pastel_products_updated', trigger);
    }
  } else {
    // Local fallback
    const trigger = () => {
      const localProds = getLocalProducts();
      callback(localProds.length === 0 ? INITIAL_PRODUCTS : localProds);
    };
    trigger();
    window.addEventListener('rei_do_pastel_products_updated', trigger);
    return () => window.removeEventListener('rei_do_pastel_products_updated', trigger);
  }
};

export const saveProduct = async (product: Product): Promise<void> => {
  if (isFirestoreReal && db) {
    const path = `products/${product.id}`;
    try {
      await setDoc(doc(db, 'products', product.id), {
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        available: product.available,
        imageUrl: product.imageUrl || ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  } else {
    // Local
    const prods = getLocalProducts();
    const index = prods.findIndex(p => p.id === product.id);
    if (index >= 0) {
      prods[index] = product;
    } else {
      prods.push(product);
    }
    saveLocalProducts(prods);
  }
};

export const deleteProduct = async (productId: string): Promise<void> => {
  if (isFirestoreReal && db) {
    const path = `products/${productId}`;
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  } else {
    const prods = getLocalProducts().filter(p => p.id !== productId);
    saveLocalProducts(prods);
  }
};

// 2. SETTINGS
export const syncSettings = (callback: (settings: AppSettings) => void): () => void => {
  if (isFirestoreReal && db) {
    const path = 'settings/config';
    try {
      return onSnapshot(doc(db, 'settings', 'config'), (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as AppSettings);
        } else {
          // If db is empty, yield INITIAL_SETTINGS to the client without triggering write permissions errors.
          // Seeding is handled securely and automatically once the Admin logs in.
          callback(INITIAL_SETTINGS);
        }
      }, (error) => {
        console.warn("[Firebase] Failed to sync settings from Firestore, using initial fallback:", error);
        callback(INITIAL_SETTINGS);
      });
    } catch (err) {
      console.warn("[Firebase] Exception within syncSettings, using local fallback:", err);
      const trigger = () => {
        callback(getLocalSettings());
      };
      trigger();
      window.addEventListener('rei_do_pastel_settings_updated', trigger);
      return () => window.removeEventListener('rei_do_pastel_settings_updated', trigger);
    }
  } else {
    // Local
    const trigger = () => {
      callback(getLocalSettings());
    };
    trigger();
    window.addEventListener('rei_do_pastel_settings_updated', trigger);
    return () => window.removeEventListener('rei_do_pastel_settings_updated', trigger);
  }
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  if (isFirestoreReal && db) {
    const path = 'settings/config';
    try {
      await setDoc(doc(db, 'settings', 'config'), settings);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  } else {
    saveLocalSettings(settings);
  }
};

// Full database overwrite trigger to keep production and preview completely in sync.
export const forceResetDatabase = async (): Promise<void> => {
  if (isFirestoreReal && db) {
    try {
      console.log("[Seeder] Resetting database config settings...");
      const settingsDocRef = doc(db, 'settings', 'config');
      await setDoc(settingsDocRef, INITIAL_SETTINGS);

      console.log("[Seeder] Cleaning existing products list...");
      const productsCollRef = collection(db, 'products');
      const productsSnap = await getDocs(productsCollRef);
      
      const deletePromises = productsSnap.docs.map((docSnap) => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);

      console.log("[Seeder] Seeding new official products into Firestore...");
      const createPromises = INITIAL_PRODUCTS.map((p) =>
        setDoc(doc(db, 'products', p.id), {
          name: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
          available: p.available,
          imageUrl: p.imageUrl || ''
        })
      );
      await Promise.all(createPromises);
      console.log("[Seeder] Force reset completed successfully on Firebase.");
    } catch (err) {
      console.error("[Seeder] Force reset failed:", err);
      throw err;
    }
  } else {
    // Local fallback
    saveLocalProducts(INITIAL_PRODUCTS);
    saveLocalSettings(INITIAL_SETTINGS);
    console.log("[Seeder] Local storage database reset successfully.");
  }
};

// Clear all products from database for a completely empty showcase
export const wipeAllProducts = async (): Promise<void> => {
  if (isFirestoreReal && db) {
    try {
      console.log("[Seeder] Wiping all products from Firestore...");
      const productsCollRef = collection(db, 'products');
      const productsSnap = await getDocs(productsCollRef);
      
      const deletePromises = productsSnap.docs.map((docSnap) => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);
      console.log("[Seeder] All products wiped successfully from Firestore.");
    } catch (err) {
      console.error("[Seeder] Wipe failed:", err);
      throw err;
    }
  } else {
    saveLocalProducts([]);
    console.log("[Seeder] Local products wiped.");
  }
};

// Helper function to seed Firestore database securely.
// This function will ONLY run if the current user is authenticated as the certified administrator.
export const seedFirestoreDatabase = async (): Promise<void> => {
  if (!isFirestoreReal || !db || !auth) return;
  const user = auth.currentUser;
  const isCertifiedAdmin = user && (user.email === 'tudojonas38@gmail.com' || user.email === 'pastel@x.com');
  if (!isCertifiedAdmin) return;

  try {
    // 1. Seed settings config if empty or legacy
    const settingsDocRef = doc(db, 'settings', 'config');
    const settingsSnap = await getDoc(settingsDocRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsDocRef, INITIAL_SETTINGS);
      console.log("[Seeder] Settings seeded successfully in Firestore.");
    }

    // 2. Only seed the products list if it is a brand new configuration install or empty
    const productsCollRef = collection(db, 'products');
    const productsSnap = await getDocs(productsCollRef);
    if (productsSnap.empty) {
      console.log("[Seeder] Starting safe batch seed of products...");
      const promises = INITIAL_PRODUCTS.map((p) =>
        setDoc(doc(db, 'products', p.id), {
          name: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
          available: p.available,
          imageUrl: p.imageUrl || ''
        })
      );
      await Promise.all(promises);
      console.log("[Seeder] Products seeded successfully in Firestore.");
    }

    // 2.5 Ensure all 18 default categories exist in Firestore categories collection
    const categoriesCollRef = collection(db, 'categories');
    const categoriesSnap = await getDocs(categoriesCollRef);
    const existingNames = new Set(categoriesSnap.docs.map(doc => doc.data().name?.toUpperCase().trim()));
    
    const defaults = getLocalCategories();
    const missingDefaults = defaults.filter(def => !existingNames.has(def.name.toUpperCase().trim()));
    
    if (missingDefaults.length > 0) {
      console.log(`[Seeder] Found ${missingDefaults.length} categories missing in Firestore. Seeding missing categories...`);
      const promises = missingDefaults.map((cat) =>
        setDoc(doc(db, 'categories', cat.id), {
          name: cat.name,
          active: cat.active
        })
      );
      await Promise.all(promises);
      console.log("[Seeder] Categories list dynamically updated in Firestore.");
    }
  } catch (err) {
    console.error("[Seeder] Database seeding failed:", err);
  }
};

// 3. ORDERS
export const syncOrders = (callback: (orders: Order[]) => void): () => void => {
  if (isFirestoreReal && db) {
    const path = 'orders';
    // Order by descending order date
    const q = query(collection(db, 'orders'));
    return onSnapshot(q, (snapshot) => {
      const ords: Order[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        ords.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
        } as Order);
      });
      // Sort client-side by date
      ords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(ords);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  } else {
    // Local
    const trigger = () => {
      const ords = getLocalOrders();
      ords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(ords);
    };
    trigger();
    window.addEventListener('rei_do_pastel_orders_updated', trigger);
    return () => window.removeEventListener('rei_do_pastel_orders_updated', trigger);
  }
};

export const createOrder = async (order: Omit<Order, 'id'>): Promise<string> => {
  const uniqueId = 'RP-' + Math.floor(1000 + Math.random() * 9000);
  const nowStr = new Date().toISOString();
  
  if (isFirestoreReal && db) {
    const path = `orders/${uniqueId}`;
    try {
      const fullOrder: Order = {
        ...order,
        id: uniqueId,
        createdAt: new Date(), // Firebase timestamp representation
        updatedAt: new Date()
      };
      await setDoc(doc(db, 'orders', uniqueId), stripUndefined(fullOrder));
      return uniqueId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return uniqueId;
    }
  } else {
    const fullOrder: Order = {
      ...order,
      id: uniqueId,
      createdAt: nowStr,
      updatedAt: nowStr
    };
    const ords = getLocalOrders();
    ords.push(fullOrder);
    saveLocalOrders(ords);
    return uniqueId;
  }
};

export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<void> => {
  if (isFirestoreReal && db) {
    const path = `orders/${orderId}`;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        updatedAt: new Date()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  } else {
    const ords = getLocalOrders();
    const index = ords.findIndex(o => o.id === orderId);
    if (index >= 0) {
      ords[index].status = status;
      ords[index].updatedAt = new Date().toISOString();
      saveLocalOrders(ords);
    }
  }
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  if (isFirestoreReal && db) {
    const path = `orders/${orderId}`;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  } else {
    const ords = getLocalOrders().filter(o => o.id !== orderId);
    saveLocalOrders(ords);
  }
};

// --------------------------------------------------------------------------
// LOCAL STORAGE ACCESSORS FOR CUSTOMERS & COUPONS
// --------------------------------------------------------------------------

const getLocalCustomers = (): Customer[] => {
  const existing = localStorage.getItem('rei_do_pastel_customers');
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch (e) {
      return [];
    }
  }
  return [];
};

const saveLocalCustomers = (customers: Customer[]) => {
  localStorage.setItem('rei_do_pastel_customers', JSON.stringify(customers));
  window.dispatchEvent(new Event('rei_do_pastel_customers_updated'));
};

const getLocalCoupons = (): Coupon[] => {
  const existing = localStorage.getItem('rei_do_pastel_coupons');
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch (e) {
      return [];
    }
  }
  // Load default coupons
  const defaults: Coupon[] = [
    { id: 'cupom-primeira10', code: 'PRIMEIRA10', discountValue: 10, discountType: 'percentage', active: true },
    { id: 'cupom-rei10', code: 'REI10', discountValue: 10, discountType: 'percentage', active: true },
    { id: 'cupom-doce5', code: 'DOCE5', discountValue: 5, discountType: 'fixed', active: true }
  ];
  localStorage.setItem('rei_do_pastel_coupons', JSON.stringify(defaults));
  return defaults;
};

const saveLocalCoupons = (coupons: Coupon[]) => {
  localStorage.setItem('rei_do_pastel_coupons', JSON.stringify(coupons));
  window.dispatchEvent(new Event('rei_do_pastel_coupons_updated'));
};

// --------------------------------------------------------------------------
// 4. CUSTOMERS REPOSITORY
// --------------------------------------------------------------------------

export const syncCustomers = (callback: (customers: Customer[]) => void): () => void => {
  if (isFirestoreReal && db) {
    const path = 'customers';
    try {
      return onSnapshot(collection(db, path), (snapshot) => {
        const custs: Customer[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          custs.push({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
          } as Customer);
        });
        callback(custs);
      }, (error) => {
        console.warn("[Firebase] Failed to load customers, using fallback.", error);
        callback(getLocalCustomers());
      });
    } catch (err) {
      console.warn("[Firebase] Customer sync exception, using local storage:", err);
      const trigger = () => {
        callback(getLocalCustomers());
      };
      trigger();
      window.addEventListener('rei_do_pastel_customers_updated', trigger);
      return () => window.removeEventListener('rei_do_pastel_customers_updated', trigger);
    }
  } else {
    const trigger = () => {
      callback(getLocalCustomers());
    };
    trigger();
    window.addEventListener('rei_do_pastel_customers_updated', trigger);
    return () => window.removeEventListener('rei_do_pastel_customers_updated', trigger);
  }
};

export const createCustomer = async (customer: Omit<Customer, 'id' | 'createdAt'>): Promise<string> => {
  const uniqueId = 'cust-' + Math.floor(1000 + Math.random() * 9000);
  const nowStr = new Date().toISOString();
  // Password is the last 4 digits of their phone
  const cleanPhone = customer.phone.replace(/\D/g, '');
  const lastFour = cleanPhone.slice(-4) || '1234';
  const password = customer.password || lastFour;

  if (isFirestoreReal && db) {
    const path = `customers/${uniqueId}`;
    try {
      const fullCustomer: Customer = {
        ...customer,
        id: uniqueId,
        password,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'customers', uniqueId), stripUndefined(fullCustomer));
      return uniqueId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return uniqueId;
    }
  } else {
    const fullCustomer: Customer = {
      ...customer,
      id: uniqueId,
      password,
      createdAt: nowStr
    };
    const custs = getLocalCustomers();
    custs.push(fullCustomer);
    saveLocalCustomers(custs);
    return uniqueId;
  }
};

export const deleteCustomer = async (customerId: string): Promise<void> => {
  if (isFirestoreReal && db) {
    const path = `customers/${customerId}`;
    try {
      await deleteDoc(doc(db, 'customers', customerId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  } else {
    const custs = getLocalCustomers().filter(c => c.id !== customerId);
    saveLocalCustomers(custs);
  }
};

// --------------------------------------------------------------------------
// 5. COUPONS REPOSITORY
// --------------------------------------------------------------------------

export const syncCoupons = (callback: (coupons: Coupon[]) => void): () => void => {
  if (isFirestoreReal && db) {
    const path = 'coupons';
    try {
      return onSnapshot(collection(db, path), (snapshot) => {
        const coups: Coupon[] = [];
        snapshot.forEach((docSnap) => {
          coups.push({ id: docSnap.id, ...docSnap.data() } as Coupon);
        });
        if (coups.length === 0) {
          // pre-seed defaults if Firestore coupons list is completely empty
          callback(getLocalCoupons());
        } else {
          callback(coups);
        }
      }, (error) => {
        console.warn("[Firebase] Failed to lead coupons, using fallback:", error);
        callback(getLocalCoupons());
      });
    } catch (err) {
      console.warn("[Firebase] Coupon sync exception, using local storage:", err);
      const trigger = () => {
        callback(getLocalCoupons());
      };
      trigger();
      window.addEventListener('rei_do_pastel_coupons_updated', trigger);
      return () => window.removeEventListener('rei_do_pastel_coupons_updated', trigger);
    }
  } else {
    const trigger = () => {
      callback(getLocalCoupons());
    };
    trigger();
    window.addEventListener('rei_do_pastel_coupons_updated', trigger);
    return () => window.removeEventListener('rei_do_pastel_coupons_updated', trigger);
  }
};

export const saveCoupon = async (coupon: Coupon): Promise<void> => {
  if (isFirestoreReal && db) {
    const path = `coupons/${coupon.id}`;
    try {
      await setDoc(doc(db, 'coupons', coupon.id), {
        code: coupon.code.toUpperCase().trim(),
        discountValue: Number(coupon.discountValue),
        discountType: coupon.discountType,
        active: coupon.active
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  } else {
    const coups = getLocalCoupons();
    const index = coups.findIndex(c => c.id === coupon.id);
    const updated = {
      ...coupon,
      code: coupon.code.toUpperCase().trim(),
      discountValue: Number(coupon.discountValue)
    };
    if (index >= 0) {
      coups[index] = updated;
    } else {
      coups.push(updated);
    }
    saveLocalCoupons(coups);
  }
};

export const deleteCoupon = async (couponId: string): Promise<void> => {
  if (isFirestoreReal && db) {
    const path = `coupons/${couponId}`;
    try {
      await deleteDoc(doc(db, 'coupons', couponId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  } else {
    const coups = getLocalCoupons().filter(c => c.id !== couponId);
    saveLocalCoupons(coups);
  }
};

// --------------------------------------------------------------------------
// 6. CATEGORIES REPOSITORY (REAL-TIME)
// --------------------------------------------------------------------------

const getLocalCategories = (): Category[] => {
  const defaults: Category[] = [
    { id: 'cat-combos-disponiveis', name: 'COMBOS DISPONÍVEIS', active: true },
    { id: 'cat-empadas', name: 'EMPADAS', active: true },
    { id: 'cat-empadao', name: 'EMPADÃO', active: true },
    { id: 'cat-salgadinhos-20g', name: 'SALGADINHOS (20G)', active: true },
    { id: 'cat-salgadinhos-20-g', name: 'SALGADINHOS (20 G)', active: true },
    { id: 'cat-pasteis-tradicionais', name: 'PASTÉIS TRADICIONAIS', active: true },
    { id: 'cat-tradicionais-queijo', name: 'TRADICIONAIS C/ QUEIJO', active: true },
    { id: 'cat-tradicionais-cheedar', name: 'TRADICIONAIS C/ CHEEDAR', active: true },
    { id: 'cat-duplos-queijo', name: 'DUPLOS DE QUEIJO - 2X MAIS RECHEIO', active: true },
    { id: 'cat-calabresa', name: 'CALABRESA', active: true },
    { id: 'cat-camarao', name: 'CAMARÃO', active: true },
    { id: 'cat-carne-seca', name: 'CARNE SECA', active: true },
    { id: 'cat-aventure-se', name: 'AVENTURE-SE', active: true },
    { id: 'cat-nacionalidades', name: 'NACIONALIDADES', active: true },
    { id: 'cat-peito-peru', name: 'PEITO DE PERU', active: true },
    { id: 'cat-x-pastel', name: 'X-PASTEL', active: true },
    { id: 'cat-pastel-doce', name: 'PASTEL DOCE', active: true },
    { id: 'cat-bebidas', name: 'BEBIDAS', active: true }
  ];

  const existing = localStorage.getItem('rei_do_pastel_categories');
  if (existing) {
    try {
      const existingList: Category[] = JSON.parse(existing);
      const existingNames = new Set(existingList.map(c => c.name.toUpperCase().trim()));
      const missing = defaults.filter(d => !existingNames.has(d.name.toUpperCase().trim()));
      if (missing.length > 0) {
        const merged = [...existingList, ...missing];
        localStorage.setItem('rei_do_pastel_categories', JSON.stringify(merged));
        return merged;
      }
      return existingList;
    } catch (e) {
      // fallback
    }
  }
  localStorage.setItem('rei_do_pastel_categories', JSON.stringify(defaults));
  return defaults;
};

const saveLocalCategories = (categories: Category[]) => {
  localStorage.setItem('rei_do_pastel_categories', JSON.stringify(categories));
  window.dispatchEvent(new Event('rei_do_pastel_categories_updated'));
};

export const syncCategories = (callback: (categories: Category[]) => void): () => void => {
  if (isFirestoreReal && db) {
    const path = 'categories';
    try {
      return onSnapshot(collection(db, path), (snapshot) => {
        const cats: Category[] = [];
        snapshot.forEach((docSnap) => {
          cats.push({ id: docSnap.id, ...docSnap.data() } as Category);
        });
        if (cats.length === 0) {
          callback(getLocalCategories());
        } else {
          callback(cats);
        }
      }, (error) => {
        console.warn("[Firebase] Failed to load categories, using fallback:", error);
        callback(getLocalCategories());
      });
    } catch (err) {
      console.warn("[Firebase] Category sync exception, using local storage:", err);
      const trigger = () => {
        callback(getLocalCategories());
      };
      trigger();
      window.addEventListener('rei_do_pastel_categories_updated', trigger);
      return () => window.removeEventListener('rei_do_pastel_categories_updated', trigger);
    }
  } else {
    const trigger = () => {
      callback(getLocalCategories());
    };
    trigger();
    window.addEventListener('rei_do_pastel_categories_updated', trigger);
    return () => window.removeEventListener('rei_do_pastel_categories_updated', trigger);
  }
};

export const saveCategory = async (category: Category): Promise<void> => {
  if (isFirestoreReal && db) {
    const path = `categories/${category.id}`;
    try {
      await setDoc(doc(db, 'categories', category.id), {
        name: category.name.toUpperCase().trim(),
        active: category.active
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  } else {
    const cats = getLocalCategories();
    const index = cats.findIndex(c => c.id === category.id);
    const updated = {
      ...category,
      name: category.name.toUpperCase().trim(),
    };
    if (index >= 0) {
      cats[index] = updated;
    } else {
      cats.push(updated);
    }
    saveLocalCategories(cats);
  }
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  if (isFirestoreReal && db) {
    const path = `categories/${categoryId}`;
    try {
      await deleteDoc(doc(db, 'categories', categoryId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  } else {
    const cats = getLocalCategories().filter(c => c.id !== categoryId);
    saveLocalCategories(cats);
  }
};

// --------------------------------------------------------------------------
// 7. USER ACCOUNTS REPOSITORY (REAL-TIME STAFF/MOTOBOYS)
// --------------------------------------------------------------------------

const getLocalUsers = (): UserAccount[] => {
  const existing = localStorage.getItem('rei_do_pastel_users');
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch (e) {
      return [];
    }
  }
  return [];
};

const saveLocalUsers = (users: UserAccount[]) => {
  localStorage.setItem('rei_do_pastel_users', JSON.stringify(users));
  window.dispatchEvent(new Event('rei_do_pastel_users_updated'));
};

export const syncUsers = (callback: (users: UserAccount[]) => void): () => void => {
  if (isFirestoreReal && db) {
    const path = 'users';
    try {
      return onSnapshot(collection(db, path), (snapshot) => {
        const usrs: UserAccount[] = [];
        snapshot.forEach((docSnap) => {
          usrs.push({ id: docSnap.id, ...docSnap.data() } as UserAccount);
        });
        callback(usrs);
      }, (error) => {
        console.warn("[Firebase] Failed to load users, using fallback:", error);
        callback(getLocalUsers());
      });
    } catch (err) {
      console.warn("[Firebase] User sync exception, using local storage:", err);
      const trigger = () => {
        callback(getLocalUsers());
      };
      trigger();
      window.addEventListener('rei_do_pastel_users_updated', trigger);
      return () => window.removeEventListener('rei_do_pastel_users_updated', trigger);
    }
  } else {
    const trigger = () => {
      callback(getLocalUsers());
    };
    trigger();
    window.addEventListener('rei_do_pastel_users_updated', trigger);
    return () => window.removeEventListener('rei_do_pastel_users_updated', trigger);
  }
};

export const saveUserAccount = async (user: UserAccount): Promise<void> => {
  if (isFirestoreReal && db) {
    const path = `users/${user.id}`;
    try {
      await setDoc(doc(db, 'users', user.id), {
        name: user.name,
        email: user.email.toLowerCase().trim(),
        role: user.role,
        status: user.status,
        cargo: user.cargo || '',
        phone: user.phone || '',
        password: user.password || '',
        currentRouteOrderId: user.currentRouteOrderId || null
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  } else {
    const usrs = getLocalUsers();
    const index = usrs.findIndex(u => u.id === user.id);
    if (index >= 0) {
      usrs[index] = user;
    } else {
      usrs.push(user);
    }
    saveLocalUsers(usrs);
  }
};

export const deleteUserAccount = async (userId: string): Promise<void> => {
  if (isFirestoreReal && db) {
    const path = `users/${userId}`;
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  } else {
    const usrs = getLocalUsers().filter(u => u.id !== userId);
    saveLocalUsers(usrs);
  }
};

export const getUserProfile = async (userId: string): Promise<UserAccount | null> => {
  if (isFirestoreReal && db) {
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as UserAccount;
      }
    } catch (e) {
      console.warn("[Firebase] Failed to fetch user profile", e);
    }
  } else {
    const usrs = getLocalUsers();
    return usrs.find(u => u.id === userId) || null;
  }
  return null;
};

export { firebaseConfig };



