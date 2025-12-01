import { useState, useEffect } from 'react';
import { getSales, getMaterials, getWaste, getAttendance, getUsers, getProducts } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { FileText, Download, Calendar as CalendarIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { formatDate, formatShortDate, getMonthYear } from '../../lib/dateUtils';

export default function ComprehensiveReport() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    loadReport();
  }, [selectedDate]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const dateStr = formatDate(selectedDate, 'yyyy-MM-dd');
      const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const monthStartStr = formatDate(monthStart, 'yyyy-MM-dd');

      const [sales, materials, waste, attendance, users, products] = await Promise.all([
        getSales(),
        getMaterials(),
        getWaste(),
        getAttendance(),
        getUsers(),
        getProducts()
      ]);

      // Filter data for selected period
      const todaySales = sales.filter(s => formatDate(new Date(s.timestamp), 'yyyy-MM-dd') === dateStr);
      const monthSales = sales.filter(s => {
        const saleDate = formatDate(new Date(s.timestamp), 'yyyy-MM-dd');
        return saleDate >= monthStartStr;
      });

      const todayWaste = waste.filter(w => w.date === dateStr);
      const monthWaste = waste.filter(w => w.date >= monthStartStr);

      const todayAttendance = attendance.filter(a => a.date === dateStr);
      const monthAttendance = attendance.filter(a => a.date >= monthStartStr);

      // Calculate metrics
      const todayRevenue = todaySales.reduce((sum, s) => sum + s.subtotal, 0);
      const todayProfit = todaySales.reduce((sum, s) => sum + s.totalProfit, 0);
      const todayCost = todaySales.reduce((sum, s) => sum + s.totalCost, 0);
      const todayWasteLoss = todayWaste.reduce((sum, w) => sum + w.totalLoss, 0);

      const monthRevenue = monthSales.reduce((sum, s) => sum + s.subtotal, 0);
      const monthProfit = monthSales.reduce((sum, s) => sum + s.totalProfit, 0);
      const monthCost = monthSales.reduce((sum, s) => sum + s.totalCost, 0);
      const monthWasteLoss = monthWaste.reduce((sum, w) => sum + w.totalLoss, 0);

      // Inventory value
      const inventoryValue = materials.reduce((sum, m) => sum + (m.currentStock * m.unitCost), 0);
      const lowStockCount = materials.filter(m => m.currentStock < m.minStock).length;

      // Best selling products
      const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
      sales.forEach(sale => {
        sale.items.forEach(item => {
          const existing = productSales.get(item.product.id) || {
            name: item.product.name,
            quantity: 0,
            revenue: 0
          };
          existing.quantity += item.quantity;
          existing.revenue += item.totalPrice;
          productSales.set(item.product.id, existing);
        });
      });

      const topProducts = Array.from(productSales.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Employee stats
      const cashiers = users.filter(u => u.role === 'cashier');
      const todayPresentCount = todayAttendance.filter(a => !a.checkOut).length;
      const todayWorkHours = todayAttendance.reduce((sum, a) => sum + (a.workHours || 0), 0);
      const monthWorkHours = monthAttendance.reduce((sum, a) => sum + (a.workHours || 0), 0);

      setReportData({
        today: {
          revenue: todayRevenue,
          profit: todayProfit,
          cost: todayCost,
          wasteLoss: todayWasteLoss,
          netProfit: todayProfit - todayWasteLoss,
          orders: todaySales.length,
          avgOrder: todaySales.length > 0 ? todayRevenue / todaySales.length : 0,
          profitMargin: todayRevenue > 0 ? (todayProfit / todayRevenue) * 100 : 0,
        },
        month: {
          revenue: monthRevenue,
          profit: monthProfit,
          cost: monthCost,
          wasteLoss: monthWasteLoss,
          netProfit: monthProfit - monthWasteLoss,
          orders: monthSales.length,
          avgOrder: monthSales.length > 0 ? monthRevenue / monthSales.length : 0,
          profitMargin: monthRevenue > 0 ? (monthProfit / monthRevenue) * 100 : 0,
        },
        inventory: {
          value: inventoryValue,
          lowStockCount,
          totalItems: materials.length,
        },
        employees: {
          total: cashiers.length,
          todayPresent: todayPresentCount,
          todayWorkHours,
          monthWorkHours,
        },
        topProducts,
      });
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !reportData) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="mb-2">التقرير الشامل</h1>
          <p className="text-sm text-gray-600">ملخص كامل لجميع البيانات والإحصائيات</p>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="ml-2 h-4 w-4" />
                {formatShortDate(selectedDate)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
              />
            </PopoverContent>
          </Popover>
          <Button size="sm" className="bg-[#007BFF] hover:bg-[#007BFF]/90">
            <Download className="ml-2 h-4 w-4" />
            تصدير PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" dir="rtl">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="financial">المالية</TabsTrigger>
          <TabsTrigger value="operations">التشغيل</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-2 gap-6">
            {/* Today's Summary */}
            <Card>
              <CardHeader>
                <CardTitle>ملخص اليوم - {formatShortDate(selectedDate)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-gray-700">إجمالي المبيعات:</span>
                  <span className="text-xl text-blue-600">{reportData.today.revenue.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-700">إجمالي الربح:</span>
                  <span className="text-xl text-green-600">{reportData.today.profit.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-gray-700">خسائر الهالك:</span>
                  <span className="text-xl text-red-600">{reportData.today.wasteLoss.toFixed(2)} ج.م</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">صافي الربح:</span>
                  <span className="text-xl font-bold text-green-600">
                    {reportData.today.netProfit.toFixed(2)} ج.م
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">عدد الطلبات</div>
                    <div className="text-lg">{reportData.today.orders}</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">متوسط الطلب</div>
                    <div className="text-lg">{reportData.today.avgOrder.toFixed(2)} ج.م</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Month's Summary */}
            <Card>
              <CardHeader>
                <CardTitle>ملخص الشهر - {getMonthYear(selectedDate)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-gray-700">إجمالي المبيعات:</span>
                  <span className="text-xl text-blue-600">{reportData.month.revenue.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-700">إجمالي الربح:</span>
                  <span className="text-xl text-green-600">{reportData.month.profit.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-gray-700">خسائر الهالك:</span>
                  <span className="text-xl text-red-600">{reportData.month.wasteLoss.toFixed(2)} ج.م</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">صافي الربح:</span>
                  <span className="text-xl font-bold text-green-600">
                    {reportData.month.netProfit.toFixed(2)} ج.م
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">عدد الطلبات</div>
                    <div className="text-lg">{reportData.month.orders}</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">نسبة الربح</div>
                    <div className="text-lg">{reportData.month.profitMargin.toFixed(1)}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  المنتجات الأكثر مبيعاً
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.topProducts.map((product: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-600">{product.quantity} وحدة</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {product.revenue.toFixed(2)} ج.م
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>إحصائيات سريعة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">قيمة المخزون</span>
                      <span className="font-medium">{reportData.inventory.value.toFixed(2)} ج.م</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">مواد منخفضة</span>
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        {reportData.inventory.lowStockCount}
                      </Badge>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">الموظفون الحاضرون</span>
                      <span className="font-medium">
                        {reportData.employees.todayPresent}/{reportData.employees.total}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">ساعات العمل اليوم</span>
                      <span className="font-medium">{reportData.employees.todayWorkHours.toFixed(1)} ساعة</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ساعات العمل الشهر</span>
                      <span className="font-medium">{reportData.employees.monthWorkHours.toFixed(1)} ساعة</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>التحليل المالي التفصيلي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-medium mb-3">تحليل اليوم</h3>
                  <div className="flex justify-between p-2 border-b">
                    <span>المبيعات (Revenue)</span>
                    <span className="text-blue-600">{reportData.today.revenue.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between p-2 border-b">
                    <span>التكلفة (Cost)</span>
                    <span className="text-red-600">-{reportData.today.cost.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between p-2 border-b">
                    <span>الربح الإجمالي</span>
                    <span className="text-green-600">{reportData.today.profit.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between p-2 border-b">
                    <span>خسائر الهالك</span>
                    <span className="text-red-600">-{reportData.today.wasteLoss.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between p-3 bg-green-50 rounded-lg font-bold">
                    <span>صافي الربح</span>
                    <span className="text-green-600">{reportData.today.netProfit.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between p-2">
                    <span>نسبة الربح</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {reportData.today.profitMargin.toFixed(1)}%
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium mb-3">تحليل الشهر</h3>
                  <div className="flex justify-between p-2 border-b">
                    <span>المبيعات (Revenue)</span>
                    <span className="text-blue-600">{reportData.month.revenue.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between p-2 border-b">
                    <span>التكلفة (Cost)</span>
                    <span className="text-red-600">-{reportData.month.cost.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between p-2 border-b">
                    <span>الربح الإجمالي</span>
                    <span className="text-green-600">{reportData.month.profit.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between p-2 border-b">
                    <span>خسائر الهالك</span>
                    <span className="text-red-600">-{reportData.month.wasteLoss.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between p-3 bg-green-50 rounded-lg font-bold">
                    <span>صافي الربح</span>
                    <span className="text-green-600">{reportData.month.netProfit.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between p-2">
                    <span>نسبة الربح</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {reportData.month.profitMargin.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>المخزون والمواد</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                    <span>قيمة المخزون الحالية</span>
                    <span className="text-xl text-blue-600">{reportData.inventory.value.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>إجمالي المواد</span>
                    <span className="text-lg">{reportData.inventory.totalItems}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                    <span>مواد تحتاج إعادة شراء</span>
                    <Badge variant="secondary" className="bg-red-600 text-white">
                      {reportData.inventory.lowStockCount}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الموظفون وساعات العمل</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                    <span>الموظفون الحاضرون اليوم</span>
                    <span className="text-xl text-green-600">
                      {reportData.employees.todayPresent}/{reportData.employees.total}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                    <span>ساعات العمل اليوم</span>
                    <span className="text-lg text-blue-600">{reportData.employees.todayWorkHours.toFixed(1)} ساعة</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span>ساعات العمل هذا الشهر</span>
                    <span className="text-lg">{reportData.employees.monthWorkHours.toFixed(1)} ساعة</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
