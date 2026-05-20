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
import { Product, AppSettings, Order } from './types';
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
    return onSnapshot(collection(db, path), (snapshot) => {
      const prods: Product[] = [];
      snapshot.forEach((docSnap) => {
        prods.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      // If db is empty, yield INITIAL_PRODUCTS to the client without triggering write permissions errors.
      // Seeding is handled securely and automatically once the Admin logs in.
      if (prods.length === 0) {
        callback(INITIAL_PRODUCTS);
      } else {
        // Sort products by id/name for consistent rendering
        callback(prods);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  } else {
    // Local fallback
    const trigger = () => {
      callback(getLocalProducts());
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
    return onSnapshot(doc(db, 'settings', 'config'), (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as AppSettings);
      } else {
        // If db is empty, yield INITIAL_SETTINGS to the client without triggering write permissions errors.
        // Seeding is handled securely and automatically once the Admin logs in.
        callback(INITIAL_SETTINGS);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
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

// Helper function to seed Firestore database securely.
// This function will ONLY run if the current user is authenticated as the certified administrator.
export const seedFirestoreDatabase = async (): Promise<void> => {
  if (!isFirestoreReal || !db || !auth) return;
  const user = auth.currentUser;
  const isCertifiedAdmin = user && (user.email === 'tudojonas38@gmail.com' || user.email === 'pastel@x.com');
  if (!isCertifiedAdmin) return;

  try {
    // 1. Seed settings config if empty
    const settingsDocRef = doc(db, 'settings', 'config');
    const settingsSnap = await getDoc(settingsDocRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsDocRef, INITIAL_SETTINGS);
      console.log("[Seeder] Settings seeded successfully in Firestore.");
    }

    // 2. Seed products list if empty
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
      await setDoc(doc(db, 'orders', uniqueId), fullOrder);
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
