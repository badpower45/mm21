import { useState, useEffect } from 'react';
import { User, Sale, Attendance } from '../types';
import { getSales, getAttendance } from '../lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Clock, ShoppingCart, DollarSign, Package } from 'lucide-react';
import { formatDate, formatTime } from '../lib/dateUtils';

interface ShiftSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export default function ShiftSummary({ isOpen, onClose, user }: ShiftSummaryProps) {
  const [shiftData, setShiftData] = useState<{
    sales: Sale[];
    attendance: Attendance | null;
    totalSales: number;
    totalOrders: number;
    productsSold: Map<string, { name: string; quantity: number; total: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadShiftData();
    }
  }, [isOpen]);

  const loadShiftData = async () => {
    setLoading(true);
    try {
      const today = formatDate(new Date(), 'yyyy-MM-dd');
      const [allSales, attendance] = await Promise.all([
        getSales(),
        getAttendance(today, user.id)
      ]);

      // Get today's attendance
      const todayAttendance = attendance.length > 0 ? attendance[0] : null;

      // Filter sales for this cashier today
      const cashierSales = allSales.filter(sale => {
        const saleDate = formatDate(new Date(sale.timestamp), 'yyyy-MM-dd');
        return saleDate === today && sale.cashierId === user.id;
      });

      // Calculate totals
      const totalSales = cashierSales.reduce((sum, sale) => sum + sale.subtotal, 0);
      const totalOrders = cashierSales.length;

      // Group products
      const productMap = new Map<string, { name: string; quantity: number; total: number }>();
      cashierSales.forEach(sale => {
        sale.items.forEach(item => {
          const existing = productMap.get(item.product.id) || {
            name: item.product.name,
            quantity: 0,
            total: 0
          };
          existing.quantity += item.quantity;
          existing.total += item.totalPrice;
          productMap.set(item.product.id, existing);
        });
      });

      setShiftData({
        sales: cashierSales,
        attendance: todayAttendance,
        totalSales,
        totalOrders,
        productsSold: productMap,
      });
    } catch (error) {
      console.error('Error loading shift data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !shiftData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>ملخص الشيفت</DialogTitle>
            <DialogDescription>جاري تحميل بيانات الشيفت...</DialogDescription>
          </DialogHeader>
          <div className="p-6 text-center">جاري التحميل...</div>
        </DialogContent>
      </Dialog>
    );
  }

  const { sales, attendance, totalSales, totalOrders, productsSold } = shiftData;
  const workDuration = attendance?.workHours || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            ملخص الشيفت - {user.fullName}
          </DialogTitle>
          <DialogDescription>عرض تفاصيل المبيعات وساعات العمل للشيفت الحالي</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  إجمالي المبيعات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-green-600">{totalSales.toFixed(2)} ج.م</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                  عدد الطلبات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-blue-600">{totalOrders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  ساعات العمل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-purple-600">{workDuration.toFixed(1)} ساعة</div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Info */}
          {attendance && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">معلومات الحضور</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">تسجيل الحضور:</span>
                    <div className="font-medium">{formatTime(attendance.checkIn)}</div>
                  </div>
                  {attendance.checkOut && (
                    <div>
                      <span className="text-sm text-gray-600">تسجيل الانصراف:</span>
                      <div className="font-medium">{formatTime(attendance.checkOut)}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products Sold */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                المنتجات المباعة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المنتج</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead className="text-right">الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from(productsSold.values())
                    .sort((a, b) => b.total - a.total)
                    .map((product, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{product.quantity} وحدة</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            {product.total.toFixed(2)} ج.م
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <Card className="bg-blue-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">متوسط قيمة الطلب:</span>
                  <div className="text-lg font-bold text-blue-600">
                    {totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : 0} ج.م
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">المبيعات في الساعة:</span>
                  <div className="text-lg font-bold text-blue-600">
                    {workDuration > 0 ? (totalSales / workDuration).toFixed(2) : 0} ج.م/ساعة
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Summary */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-600">إجمالي مبيعات الشيفت</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {totalOrders} طلب · {workDuration.toFixed(1)} ساعة عمل
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">
                    {totalSales.toFixed(2)} ج.م
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
