export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  imageUrl?: string;
}

export interface AppSettings {
  phone: string;
  instagram: string;
  facebook: string;
  address: string;
  deliveryFee: number;
  isOpen: boolean;
  freeDistanceLimit?: number;
  pricePerExcessKm?: number;
  maxDeliveryDistance?: number;
  minDeliveryFee?: number;
  freeDeliveryMinOrderValue?: number;
  storeLatitude?: number;
  storeLongitude?: number;
  flyerUrl?: string;
}

export interface OrderAddress {
  cep?: string;
  street: string;
  number: string;
  neighborhood: string;
  complement?: string;
  reference?: string;
  latitude?: number;
  longitude?: number;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  paymentMethod: 'Pix' | 'Dinheiro' | 'Cartão';
  paymentChange?: string;
  deliveryMethod: 'delivery' | 'pickup';
  address?: OrderAddress;
  deliveryDistanceKm?: number;
  totalItems: number;
  deliveryFee: number;
  discountAmount?: number;
  appliedCoupon?: string;
  isFirstOrderBonus?: boolean;
  totalOrder: number;
  status: 'pending' | 'accepted' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  createdAt: any; // Firestore Timestamp or ISO string
  updatedAt: any;
  motoboyId?: string | null;
  motoboyName?: string | null;
  shippedAt?: string | null; // time left the store
  deliveredAt?: string | null; // time delivered
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  password?: string;
  createdAt: string; // ISO string or Firebase Timestamp
}

export interface Coupon {
  id: string;
  code: string; // uppercase code name e.g. REI10
  discountValue: number; // e.g. 10 for 10% or 10.00 cash
  discountType: 'percentage' | 'fixed';
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  active: boolean; // true = Ativada, false = Desativada
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee' | 'motoboy';
  status: 'active' | 'inactive';
  cargo?: string; // specific to employee
  phone?: string; // specific to motoboy
  password?: string; // used for reference or fallback login
  currentRouteOrderId?: string | null; // linked active order
}


