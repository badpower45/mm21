import { Sale, RawMaterial, Product, User, SystemSettings } from '../types';
import { 
  products as initialProducts, 
  rawMaterials as initialRawMaterials,
  users as initialUsers,
  defaultSettings 
} from './mockData';

const STORAGE_KEYS = {
  SALES: 'pos_sales',
  RAW_MATERIALS: 'pos_raw_materials',
  PRODUCTS: 'pos_products',
  USERS: 'pos_users',
  CURRENT_USER: 'pos_current_user',
  SETTINGS: 'pos_settings',
};

// Initialize storage with default data if empty
export const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.RAW_MATERIALS)) {
    localStorage.setItem(STORAGE_KEYS.RAW_MATERIALS, JSON.stringify(initialRawMaterials));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(initialProducts));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
  }
};

// Sales
export const getSales = (): Sale[] => {
  const sales = localStorage.getItem(STORAGE_KEYS.SALES);
  return sales ? JSON.parse(sales) : [];
};

export const addSale = (sale: Sale) => {
  const sales = getSales();
  sales.push(sale);
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
};

export const getTodaySales = (): Sale[] => {
  const sales = getSales();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return sales.filter(sale => {
    const saleDate = new Date(sale.timestamp);
    saleDate.setHours(0, 0, 0, 0);
    return saleDate.getTime() === today.getTime();
  });
};

// Raw Materials
export const getRawMaterials = (): RawMaterial[] => {
  const materials = localStorage.getItem(STORAGE_KEYS.RAW_MATERIALS);
  return materials ? JSON.parse(materials) : initialRawMaterials;
};

export const updateRawMaterials = (materials: RawMaterial[]) => {
  localStorage.setItem(STORAGE_KEYS.RAW_MATERIALS, JSON.stringify(materials));
};

export const deductFromStock = (materialId: string, quantity: number) => {
  const materials = getRawMaterials();
  const material = materials.find(m => m.id === materialId);
  if (material) {
    material.currentStock -= quantity;
    updateRawMaterials(materials);
  }
};

// Products
export const getProducts = (): Product[] => {
  const products = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  return products ? JSON.parse(products) : initialProducts;
};

export const updateProducts = (products: Product[]) => {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
};

// Users
export const getUsers = (): User[] => {
  const users = localStorage.getItem(STORAGE_KEYS.USERS);
  return users ? JSON.parse(users) : initialUsers;
};

export const addUser = (user: User) => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const updateUser = (userId: string, updates: Partial<User>) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }
};

export const deleteUser = (userId: string) => {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== userId);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
};

export const authenticateUser = (username: string, password: string): User | null => {
  const users = getUsers();
  return users.find(u => u.username === username && u.password === password && u.isActive) || null;
};

// Current User Session
export const setCurrentUser = (user: User) => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
};

export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return user ? JSON.parse(user) : null;
};

export const logout = () => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

// Settings
export const getSettings = (): SystemSettings => {
  const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return settings ? JSON.parse(settings) : defaultSettings;
};

export const updateSettings = (settings: SystemSettings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};
