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
}

export interface OrderAddress {
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
  totalOrder: number;
  status: 'pending' | 'accepted' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  createdAt: any; // Firestore Timestamp or ISO string
  updatedAt: any;
}
