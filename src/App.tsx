import { useState, useEffect, lazy, Suspense } from 'react';
import { User } from './types';
import Login from './components/Login';
import CashierView from './components/CashierView';
import Dashboard from './components/Dashboard';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load heavy components for better performance
const ProductManagement = lazy(() => import('./components/ProductManagement'));
const UserManagement = lazy(() => import('./components/owner/UserManagement'));
const InventoryManagement = lazy(() => import('./components/owner/InventoryManagement'));
const SettingsPanel = lazy(() => import('./components/owner/SettingsPanel'));
const SalesReports = lazy(() => import('./components/owner/SalesReports'));
const AttendanceManagement = lazy(() => import('./components/owner/AttendanceManagement'));
const WasteManagement = lazy(() => import('./components/owner/WasteManagement'));
const ComprehensiveReport = lazy(() => import('./components/owner/ComprehensiveReport'));
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { initializeStorage, setCurrentUser, getCurrentUser, logout } from './lib/storage';
import { initializeData } from './lib/api';
import { products as initialProducts, rawMaterials, users as initialUsers, defaultSettings } from './lib/mockData';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Warehouse,
  Settings,
  FileText,
  BarChart,
  Clock,
  Trash2,
  LogOut, 
  Smartphone, 
  Monitor 
} from 'lucide-react';

export default function App() {
  const [currentUser, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    initializeStorage();
    
    // Check if database needs initialization
    const isInitialized = localStorage.getItem('db_initialized');
    if (!isInitialized) {
      try {
        await initializeData({
          products: initialProducts,
          materials: rawMaterials,
          users: initialUsers,
          settings: defaultSettings,
        });
        localStorage.setItem('db_initialized', 'true');
        toast.success('🎉 تم تهيئة النظام بنجاح - جاهز للاستخدام');
      } catch (error) {
        console.warn('استخدام التخزين المحلي:', error);
        // System will work with local storage fallback
        localStorage.setItem('db_initialized', 'true');
        toast.info('💾 النظام يعمل في الوضع المحلي');
      }
    }
    
    const savedUser = getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
      // Set default tab based on role
      if (savedUser.role === 'cashier') {
        setActiveTab('pos');
      } else {
        setActiveTab('dashboard');
      }
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setUser(user);
    // Set default tab based on role
    if (user.role === 'cashier') {
      setActiveTab('pos');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setActiveTab('dashboard');
    setViewMode('desktop');
  };

  // Login Screen
  if (!currentUser) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster position="top-center" dir="rtl" />
      </>
    );
  }

  // Cashier View - Simple POS only
  if (currentUser.role === 'cashier') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b p-4 flex justify-between items-center" dir="rtl">
          <div>
            <h2>نظام نقطة البيع - شاشة الكاشير</h2>
            <p className="text-sm text-gray-600">مرحباً، {currentUser.fullName}</p>
          </div>
          <Button size="sm" variant="outline" onClick={handleLogout}>
            <LogOut className="ml-1 h-4 w-4" />
            خروج
          </Button>
        </div>
        <CashierView user={currentUser} />
        <Toaster position="top-center" dir="rtl" />
      </div>
    );
  }

  // Owner View - Mobile Dashboard
  if (viewMode === 'mobile') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b p-4 flex justify-between items-center" dir="rtl">
          <h2>نظام POS - عرض الموبايل</h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewMode('desktop')}
            >
              <Monitor className="ml-1 h-4 w-4" />
              ديسكتوب
            </Button>
            <Button size="sm" variant="outline" onClick={handleLogout}>
              <LogOut className="ml-1 h-4 w-4" />
              خروج
            </Button>
          </div>
        </div>
        <Dashboard isMobile={true} />
        <Toaster position="top-center" dir="rtl" />
      </div>
    );
  }

  // Owner View - Full Desktop Interface
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="flex justify-between items-center p-4" dir="rtl">
          <div>
            <h2>نظام نقطة البيع - لوحة الإدارة</h2>
            <p className="text-sm text-gray-600">مرحباً، {currentUser.fullName} (مالك)</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewMode('mobile')}
            >
              <Smartphone className="ml-1 h-4 w-4" />
              عرض الموبايل
            </Button>
            <Button size="sm" variant="outline" onClick={handleLogout}>
              <LogOut className="ml-1 h-4 w-4" />
              خروج
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="w-full justify-start rounded-none border-t bg-transparent px-4">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              لوحة التحكم
            </TabsTrigger>
            <TabsTrigger value="pos" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              نقطة البيع
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              المنتجات والوصفات
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2">
              <Warehouse className="h-4 w-4" />
              المخزون
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="h-4 w-4" />
              المبيعات
            </TabsTrigger>
            <TabsTrigger value="comprehensive" className="gap-2">
              <BarChart className="h-4 w-4" />
              التقرير الشامل
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2">
              <Clock className="h-4 w-4" />
              الحضور
            </TabsTrigger>
            <TabsTrigger value="waste" className="gap-2">
              <Trash2 className="h-4 w-4" />
              الهالك
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              المستخدمين
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="m-0">
            <Dashboard isMobile={false} />
          </TabsContent>

          <TabsContent value="pos" className="m-0 p-0">
            <CashierView user={currentUser} />
          </TabsContent>

          <TabsContent value="products" className="m-0">
            <Suspense fallback={<LoadingSpinner />}>
              <ProductManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="inventory" className="m-0">
            <Suspense fallback={<LoadingSpinner />}>
              <InventoryManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="reports" className="m-0">
            <Suspense fallback={<LoadingSpinner />}>
              <SalesReports />
            </Suspense>
          </TabsContent>

          <TabsContent value="comprehensive" className="m-0">
            <Suspense fallback={<LoadingSpinner />}>
              <ComprehensiveReport />
            </Suspense>
          </TabsContent>

          <TabsContent value="attendance" className="m-0">
            <Suspense fallback={<LoadingSpinner />}>
              <AttendanceManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="waste" className="m-0">
            <Suspense fallback={<LoadingSpinner />}>
              <WasteManagement currentUser={currentUser} />
            </Suspense>
          </TabsContent>

          <TabsContent value="users" className="m-0">
            <Suspense fallback={<LoadingSpinner />}>
              <UserManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="settings" className="m-0">
            <Suspense fallback={<LoadingSpinner />}>
              <SettingsPanel />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>

      <Toaster position="top-center" dir="rtl" />
    </div>
  );
}
