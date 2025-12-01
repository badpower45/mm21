import { useState, useEffect } from 'react';
import { Sale } from '../../types';
import { getSales, getTodaySales } from '../../lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { FileText, TrendingUp, User } from 'lucide-react';

export default function SalesReports() {
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [allSales, setAllSales] = useState<Sale[]>([]);

  useEffect(() => {
    setTodaySales(getTodaySales());
    setAllSales(getSales());
  }, []);

  const getCashierStats = (sales: Sale[]) => {
    const stats = new Map<string, { name: string; sales: number; profit: number; orders: number }>();
    
    sales.forEach(sale => {
      const cashierId = sale.cashierId || 'unknown';
      const cashierName = sale.cashierName || 'غير محدد';
      
      if (!stats.has(cashierId)) {
        stats.set(cashierId, { name: cashierName, sales: 0, profit: 0, orders: 0 });
      }
      
      const current = stats.get(cashierId)!;
      current.sales += sale.subtotal;
      current.profit += sale.totalProfit;
      current.orders += 1;
    });
    
    return Array.from(stats.values());
  };

  const todayCashierStats = getCashierStats(todaySales);
  const totalTodaySales = todaySales.reduce((sum, s) => sum + s.subtotal, 0);
  const totalTodayProfit = todaySales.reduce((sum, s) => sum + s.totalProfit, 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="mb-6">
        <h1 className="mb-2">تقارير المبيعات</h1>
        <p className="text-sm text-gray-600">تحليل أداء المبيعات والموظفين</p>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              مبيعات اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-[#007BFF]">
              {(totalTodaySales || 0).toFixed(2)} ج.م
            </div>
            <p className="text-xs text-gray-600 mt-1">
              عدد الطلبات: {todaySales.length || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              ربح اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600">
              {(totalTodayProfit || 0).toFixed(2)} ج.م
            </div>
            <p className="text-xs text-gray-600 mt-1">
              نسبة الربح: {(totalTodaySales || 0) > 0 ? (((totalTodayProfit || 0) / (totalTodaySales || 1)) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              متوسط الطلب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {(todaySales.length || 0) > 0 ? ((totalTodaySales || 0) / (todaySales.length || 1)).toFixed(2) : 0} ج.م
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="today" dir="rtl">
        <TabsList>
          <TabsTrigger value="today">مبيعات اليوم</TabsTrigger>
          <TabsTrigger value="cashiers">أداء الموظفين</TabsTrigger>
          <TabsTrigger value="all">كل المبيعات</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                مبيعات اليوم التفصيلية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الفاتورة</TableHead>
                    <TableHead className="text-right">الوقت</TableHead>
                    <TableHead className="text-right">الكاشير</TableHead>
                    <TableHead className="text-right">عدد المنتجات</TableHead>
                    <TableHead className="text-right">الإجمالي</TableHead>
                    <TableHead className="text-right">الربح</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaySales.map(sale => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-xs">{sale.id}</TableCell>
                      <TableCell>
                        {new Date(sale.timestamp).toLocaleTimeString('ar-EG')}
                      </TableCell>
                      <TableCell>{sale.cashierName || 'غير محدد'}</TableCell>
                      <TableCell>{sale.items.length}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {sale.subtotal.toFixed(2)} ج.م
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {sale.totalProfit.toFixed(2)} ج.م
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashiers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                أداء الموظفين اليوم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم الموظف</TableHead>
                    <TableHead className="text-right">عدد الطلبات</TableHead>
                    <TableHead className="text-right">إجمالي المبيعات</TableHead>
                    <TableHead className="text-right">إجمالي الربح</TableHead>
                    <TableHead className="text-right">متوسط الطلب</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayCashierStats.map((stat, index) => (
                    <TableRow key={index}>
                      <TableCell>{stat.name}</TableCell>
                      <TableCell>{stat.orders}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {stat.sales.toFixed(2)} ج.م
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {stat.profit.toFixed(2)} ج.م
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(stat.sales / stat.orders).toFixed(2)} ج.م
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                سجل كل المبيعات ({allSales.length} عملية)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الفاتورة</TableHead>
                      <TableHead className="text-right">التاريخ والوقت</TableHead>
                      <TableHead className="text-right">الكاشير</TableHead>
                      <TableHead className="text-right">الإجمالي</TableHead>
                      <TableHead className="text-right">الربح</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allSales.slice().reverse().map(sale => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono text-xs">{sale.id}</TableCell>
                        <TableCell>
                          {new Date(sale.timestamp).toLocaleString('ar-EG')}
                        </TableCell>
                        <TableCell>{sale.cashierName || 'غير محدد'}</TableCell>
                        <TableCell>{sale.subtotal.toFixed(2)} ج.م</TableCell>
                        <TableCell>{sale.totalProfit.toFixed(2)} ج.م</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
