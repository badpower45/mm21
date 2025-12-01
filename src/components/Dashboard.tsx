import { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { getSales, getMaterials, getWaste, getAttendance, getUsers } from '../lib/api';
import { DashboardStats, PurchaseSuggestion } from '../types';
import { TrendingUp, ShoppingCart, DollarSign, AlertTriangle, Package, RefreshCw, Trash2, Users, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatDate } from '../lib/dateUtils';

interface DashboardProps {
  isMobile?: boolean;
}

// Memoized Components for better performance
const StatCard = memo(({ title, value, subtitle, icon: Icon, color }: any) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm">{title}</CardTitle>
      <Icon className={`h-5 w-5 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl">{value}</div>
      {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
    </CardContent>
  </Card>
));

const AlertCard = memo(({ items, type }: any) => {
  if (items.length === 0) return null;

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <CardTitle className="text-base">{type === 'stock' ? 'تنبيهات المخزون' : 'تحذيرات'}</CardTitle>
        <Badge variant="destructive" className="mr-auto">{items.length}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-48 overflow-auto">
          {items.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{item.name}</span>
              </div>
              <Badge variant="destructive" className="text-xs">
                {item.currentStock} {item.unit}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

const PurchaseSuggestionsCard = memo(({ suggestions }: any) => {
  if (suggestions.length === 0) return null;

  const totalCost = suggestions.reduce((sum: number, s: any) => sum + (s.estimatedCost || 0), 0);

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-blue-600" />
          اقتراحات الشراء
          <Badge className="bg-blue-600 mr-auto">{suggestions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-auto">
          {suggestions.map((suggestion: any) => (
            <div key={suggestion.material.id} className="flex justify-between items-center p-3 bg-white rounded-lg">
              <div>
                <div className="font-medium">{suggestion.material.name}</div>
                <div className="text-sm text-gray-600">
                  احتياج: {(suggestion.neededQuantity || 0).toFixed(0)} {suggestion.material.unit}
                </div>
              </div>
              <Badge className="bg-[#FFB800] text-white hover:bg-[#FFB800]/90">
                {(suggestion.estimatedCost || 0).toFixed(2)} ج.م
              </Badge>
            </div>
          ))}
          <div className="pt-3 border-t mt-3">
            <div className="flex justify-between items-center font-medium">
              <span>إجمالي تقريبي للشراء:</span>
              <span className="text-[#0B69FF] text-lg">{totalCost.toFixed(2)} ج.م</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default function Dashboard({ isMobile = false }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayProfit: 0,
    todayOrders: 0,
    lowStockItems: [],
    purchaseSuggestions: [],
    todayWaste: 0,
    presentEmployees: 0,
    totalEmployees: 0,
  });
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const today = formatDate(new Date(), 'yyyy-MM-dd');
      
      const [sales, materials, waste, attendance, users] = await Promise.all([
        getSales(),
        getMaterials(),
        getWaste(today),
        getAttendance(today),
        getUsers()
      ]);

      // Filter today's sales
      const todaySales = sales.filter(s => {
        const saleDate = formatDate(new Date(s.timestamp), 'yyyy-MM-dd');
        return saleDate === today;
      });

      const todaySalesTotal = todaySales.reduce((sum, sale) => sum + sale.subtotal, 0);
      const todayProfitTotal = todaySales.reduce((sum, sale) => sum + sale.totalProfit, 0);
      const todayWasteTotal = waste.reduce((sum, w) => sum + w.totalLoss, 0);

      const lowStock = materials.filter(m => m.currentStock < m.minStock);
      
      const suggestions: PurchaseSuggestion[] = lowStock.map(material => {
        const needed = material.targetStock - material.currentStock;
        return {
          material,
          neededQuantity: needed,
          estimatedCost: needed * material.unitCost,
        };
      });

      const cashiers = users.filter(u => u.role === 'cashier');
      const presentEmployees = attendance.filter(a => !a.checkOut).length;

      setStats({
        todaySales: todaySalesTotal,
        todayProfit: todayProfitTotal,
        todayOrders: todaySales.length,
        lowStockItems: lowStock,
        purchaseSuggestions: suggestions,
        todayWaste: todayWasteTotal,
        presentEmployees,
        totalEmployees: cashiers.length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    // Auto-refresh every 2 minutes
    const interval = setInterval(loadStats, 120000);
    return () => clearInterval(interval);
  }, []);

  // Sample data for charts
  const chartData = [
    { name: 'السبت', sales: 450 },
    { name: 'الأحد', sales: 380 },
    { name: 'الاثنين', sales: 520 },
    { name: 'الثلاثاء', sales: 490 },
    { name: 'الأربعاء', sales: 610 },
    { name: 'الخميس', sales: 720 },
    { name: 'الجمعة', sales: stats.todaySales },
  ];

  const profitData = [
    { name: 'مبيعات', value: stats.todaySales },
    { name: 'ربح', value: stats.todayProfit },
    { name: 'تكلفة', value: stats.todaySales - stats.todayProfit },
  ];

  const COLORS = ['#0B69FF', '#22c55e', '#ef4444'];

  const netProfit = stats.todayProfit - stats.todayWaste;
  const profitMargin = stats.todaySales > 0 ? ((stats.todayProfit / stats.todaySales) * 100) : 0;

  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'} bg-gray-50 min-h-screen`} dir="rtl">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="mb-2">لوحة التحكم</h1>
          <p className="text-sm text-gray-600">
            آخر تحديث: {new Date().toLocaleTimeString('ar-EG')}
          </p>
        </div>
        <Button 
          onClick={loadStats} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`ml-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Primary Stats - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="مبيعات اليوم"
          value={`${(stats.todaySales || 0).toFixed(2)} ج.م`}
          subtitle={`عدد الطلبات: ${stats.todayOrders || 0}`}
          icon={DollarSign}
          color="text-[#007BFF]"
        />
        <StatCard
          title="الربح اليوم"
          value={`${(stats.todayProfit || 0).toFixed(2)} ج.م`}
          subtitle={`نسبة الربح: ${profitMargin.toFixed(1)}%`}
          icon={TrendingUp}
          color="text-green-600"
        />
        <StatCard
          title="صافي الربح"
          value={`${netProfit.toFixed(2)} ج.م`}
          subtitle={`بعد خصم الهالك: ${stats.todayWaste.toFixed(2)} ج.م`}
          icon={netProfit >= 0 ? TrendingUp : TrendingDown}
          color={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}
        />
        <StatCard
          title="الموظفون الحاضرون"
          value={`${stats.presentEmployees}/${stats.totalEmployees}`}
          subtitle={`نسبة الحضور: ${stats.totalEmployees > 0 ? ((stats.presentEmployees / stats.totalEmployees) * 100).toFixed(0) : 0}%`}
          icon={Users}
          color="text-blue-600"
        />
      </div>

      {/* Charts Section - Desktop Only */}
      {!isMobile && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle>المبيعات الأسبوعية</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#007BFF" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Profit Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>توزيع المبيعات والأرباح</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={profitData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value.toFixed(0)} ج.م`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {profitData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts and Suggestions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertCard items={stats.lowStockItems} type="stock" />
        <PurchaseSuggestionsCard suggestions={stats.purchaseSuggestions} />
      </div>
    </div>
  );
}
