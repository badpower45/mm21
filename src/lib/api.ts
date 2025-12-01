import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Product, RawMaterial, Sale, User, Attendance, Waste, SystemSettings } from '../types';
import * as storageService from './storage';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-4ff5d3b8`;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
};

// Simple cache for GET requests
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

// Track if API is available
let useLocalFallback = false;
let connectionChecked = false;

// Check API connection
async function checkConnection(): Promise<boolean> {
  if (connectionChecked) return !useLocalFallback;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${API_URL}/health`, {
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    connectionChecked = true;
    useLocalFallback = !response.ok;
    
    if (useLocalFallback) {
      console.warn('⚠️ نظام Supabase غير متاح - سيتم استخدام التخزين المحلي');
    }
    
    return !useLocalFallback;
  } catch (error) {
    console.warn('⚠️ فشل الاتصال بـ Supabase - سيتم استخدام التخزين المحلي');
    connectionChecked = true;
    useLocalFallback = true;
    return false;
  }
}

// Helper function with fallback
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Check connection on first call
  if (!connectionChecked) {
    await checkConnection();
  }
  
  // If using local fallback, handle locally
  if (useLocalFallback) {
    return handleLocalFallback<T>(endpoint, options);
  }
  
  try {
    // Check cache for GET requests
    const isGetRequest = !options || options.method === 'GET';
    const cacheKey = `${endpoint}`;
    
    if (isGetRequest) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options?.headers,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }
    
    const data = await response.json();
    const result = data.data;
    
    // Cache GET requests
    if (isGetRequest) {
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
    } else {
      // Invalidate cache on mutations
      cache.clear();
    }
    
    return result;
  } catch (error) {
    console.error('API Error:', error);
    // Switch to local fallback on error
    console.warn('⚠️ التبديل إلى التخزين المحلي بسبب خطأ في الاتصال');
    useLocalFallback = true;
    return handleLocalFallback<T>(endpoint, options);
  }
}

// Local fallback handler
function handleLocalFallback<T>(endpoint: string, options?: RequestInit): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      const method = options?.method || 'GET';
      const body = options?.body ? JSON.parse(options.body as string) : null;
      
      // Handle different endpoints
      if (endpoint === '/init') {
        // Initialize local storage
        if (body) {
          if (body.products) storageService.updateProducts(body.products);
          if (body.materials) storageService.updateRawMaterials(body.materials);
          if (body.users) {
            const currentUsers = storageService.getUsers();
            if (currentUsers.length === 0) {
              body.users.forEach((user: User) => storageService.addUser(user));
            }
          }
        }
        resolve({} as T);
      } else if (endpoint === '/clear-data') {
        // Clear local data
        window.localStorage.setItem('pos_sales', JSON.stringify([]));
        window.localStorage.setItem('pos_attendance', JSON.stringify([]));
        window.localStorage.setItem('pos_waste', JSON.stringify([]));
        resolve({} as T);
      } else if (endpoint === '/products') {
        if (method === 'GET') {
          resolve(storageService.getProducts() as T);
        } else if (method === 'POST' && body) {
          storageService.updateProducts([...storageService.getProducts(), body]);
          resolve(body as T);
        }
      } else if (endpoint.startsWith('/products/')) {
        const id = endpoint.split('/')[2];
        const products = storageService.getProducts();
        const index = products.findIndex(p => p.id === id);
        if (index !== -1 && body) {
          products[index] = { ...products[index], ...body };
          storageService.updateProducts(products);
          resolve(products[index] as T);
        }
      } else if (endpoint === '/materials') {
        if (method === 'GET') {
          resolve(storageService.getRawMaterials() as T);
        } else if (method === 'POST' && body) {
          storageService.updateRawMaterials([...storageService.getRawMaterials(), body]);
          resolve(body as T);
        }
      } else if (endpoint.startsWith('/materials/')) {
        const id = endpoint.split('/')[2];
        const materials = storageService.getRawMaterials();
        const index = materials.findIndex(m => m.id === id);
        if (index !== -1 && body) {
          materials[index] = { ...materials[index], ...body };
          storageService.updateRawMaterials(materials);
          resolve(materials[index] as T);
        }
      } else if (endpoint.startsWith('/sales')) {
        if (method === 'GET') {
          resolve(storageService.getSales() as T);
        } else if (method === 'POST' && body) {
          storageService.addSale(body);
          // Deduct from stock
          if (body.items) {
            body.items.forEach((item: any) => {
              const product = storageService.getProducts().find((p: Product) => p.id === item.productId);
              if (product?.recipe) {
                Object.entries(product.recipe).forEach(([materialId, quantity]) => {
                  storageService.deductFromStock(materialId, (quantity as number) * item.quantity);
                });
              }
            });
          }
          resolve(body as T);
        }
      } else if (endpoint === '/users') {
        if (method === 'GET') {
          resolve(storageService.getUsers() as T);
        } else if (method === 'POST' && body) {
          storageService.addUser(body);
          resolve(body as T);
        }
      } else if (endpoint.startsWith('/users/')) {
        const id = endpoint.split('/')[2];
        if (method === 'PUT' && body) {
          storageService.updateUser(id, body);
          const users = storageService.getUsers();
          const user = users.find(u => u.id === id);
          resolve(user as T);
        }
      } else if (endpoint.startsWith('/attendance')) {
        const attendanceData = JSON.parse(window.localStorage.getItem('pos_attendance') || '[]');
        
        if (endpoint === '/attendance/checkin' && method === 'POST' && body) {
          const newRecord = {
            id: Date.now().toString(),
            userId: body.userId,
            userName: body.userName,
            date: new Date().toISOString().split('T')[0],
            checkIn: new Date().toISOString(),
            checkOut: null,
          };
          attendanceData.push(newRecord);
          window.localStorage.setItem('pos_attendance', JSON.stringify(attendanceData));
          resolve(newRecord as T);
        } else if (endpoint === '/attendance/checkout' && method === 'POST' && body) {
          const record = attendanceData
            .filter((r: any) => r.userId === body.userId && !r.checkOut)
            .sort((a: any, b: any) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())[0];
          
          if (record) {
            record.checkOut = new Date().toISOString();
            window.localStorage.setItem('pos_attendance', JSON.stringify(attendanceData));
            resolve(record as T);
          }
        } else if (method === 'GET') {
          resolve(attendanceData as T);
        }
      } else if (endpoint.startsWith('/waste')) {
        const wasteData = JSON.parse(window.localStorage.getItem('pos_waste') || '[]');
        
        if (method === 'GET') {
          resolve(wasteData as T);
        } else if (method === 'POST' && body) {
          wasteData.push(body);
          window.localStorage.setItem('pos_waste', JSON.stringify(wasteData));
          // Deduct from stock
          if (body.materialId && body.quantity) {
            storageService.deductFromStock(body.materialId, body.quantity);
          }
          resolve(body as T);
        }
      } else {
        resolve([] as T);
      }
    } catch (error) {
      console.error('Local fallback error:', error);
      reject(error);
    }
  });
}

// Products
export const getProducts = () => apiCall<Product[]>('/products');
export const addProduct = (product: Product) => 
  apiCall<Product>('/products', { method: 'POST', body: JSON.stringify(product) });
export const updateProduct = (id: string, updates: Partial<Product>) => 
  apiCall<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(updates) });

// Raw Materials
export const getMaterials = () => apiCall<RawMaterial[]>('/materials');
export const addMaterial = (material: RawMaterial) => 
  apiCall<RawMaterial>('/materials', { method: 'POST', body: JSON.stringify(material) });
export const updateMaterial = (id: string, updates: Partial<RawMaterial>) => 
  apiCall<RawMaterial>(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(updates) });

// Sales
export const getSales = (date?: string) => 
  apiCall<Sale[]>(`/sales${date ? `?date=${date}` : ''}`);
export const addSale = (sale: Sale) => 
  apiCall<Sale>('/sales', { method: 'POST', body: JSON.stringify(sale) });

// Attendance
export const getAttendance = (date?: string, userId?: string) => {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (userId) params.append('userId', userId);
  return apiCall<Attendance[]>(`/attendance?${params.toString()}`);
};

export const checkIn = (userId: string, userName: string) => 
  apiCall<Attendance>('/attendance/checkin', { 
    method: 'POST', 
    body: JSON.stringify({ userId, userName }) 
  });

export const checkOut = (userId: string) => 
  apiCall<Attendance>('/attendance/checkout', { 
    method: 'POST', 
    body: JSON.stringify({ userId }) 
  });

// Waste
export const getWaste = (date?: string) => 
  apiCall<Waste[]>(`/waste${date ? `?date=${date}` : ''}`);
export const addWaste = (waste: Waste) => 
  apiCall<Waste>('/waste', { method: 'POST', body: JSON.stringify(waste) });

// Users
export const getUsers = () => apiCall<User[]>('/users');
export const addUser = (user: User) => 
  apiCall<User>('/users', { method: 'POST', body: JSON.stringify(user) });
export const updateUser = (id: string, updates: Partial<User>) => 
  apiCall<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(updates) });

// Initialize
export const initializeData = (data: {
  products: Product[];
  materials: RawMaterial[];
  users: User[];
  settings: SystemSettings;
}) => apiCall('/init', { method: 'POST', body: JSON.stringify(data) });

// Clear all data (sales, attendance, waste)
export const clearAllData = () => apiCall('/clear-data', { method: 'POST' });
