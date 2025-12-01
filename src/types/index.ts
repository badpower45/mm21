// Types for POS System

export type UserRole = 'owner' | 'cashier';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  fullName: string;
  isActive: boolean;
  createdAt: Date;
  phone?: string;
  salary?: number;
}

// Attendance System
export interface Attendance {
  id: string;
  userId: string;
  userName: string;
  checkIn: Date;
  checkOut?: Date;
  date: string; // YYYY-MM-DD format
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
  workHours?: number;
}

export interface RawMaterial {
  id: string;
  name: string;
  unit: string; // g, ml, piece
  unitCost: number; // cost per unit
  currentStock: number;
  minStock: number;
  targetStock: number;
  category?: string;
}

export interface RecipeItem {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  cost: number; // total cost from recipe
  price: number; // selling price
  profit: number; // price - cost
  recipe: RecipeItem[];
  imageUrl?: string;
  category?: string;
  isActive: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  totalCost: number;
  totalPrice: number;
  totalProfit: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  subtotal: number;
  totalCost: number;
  totalProfit: number;
  paymentMethod: 'cash' | 'card';
  timestamp: Date;
  cashierId?: string;
  cashierName?: string;
}

// Waste/Spoilage System
export interface Waste {
  id: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalLoss: number;
  reason: string;
  reportedBy: string;
  reportedById: string;
  timestamp: Date;
  date: string; // YYYY-MM-DD
}

export interface DashboardStats {
  todaySales: number;
  todayProfit: number;
  todayOrders: number;
  lowStockItems: RawMaterial[];
  purchaseSuggestions: PurchaseSuggestion[];
  todayWaste: number;
  presentEmployees: number;
  totalEmployees: number;
}

export interface PurchaseSuggestion {
  material: RawMaterial;
  neededQuantity: number;
  estimatedCost: number;
}

export interface SystemSettings {
  storeName: string;
  storeLogo?: string;
  receiptMessage: string;
  taxRate: number;
  currency: string;
  printerName?: string;
  workStartTime: string; // HH:MM
  workEndTime: string; // HH:MM
  lateThreshold: number; // minutes
}
