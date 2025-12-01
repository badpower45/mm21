import { useState, useEffect } from 'react';
import { Product, CartItem, Sale, User, Waste, RawMaterial } from '../types';
import { getProducts, addSale, addWaste, getMaterials } from '../lib/api';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Minus, Plus, FileText, Trash2 } from 'lucide-react';
import ReceiptPreview from './ReceiptPreview';
import AttendanceWidget from './AttendanceWidget';
import ShiftSummary from './ShiftSummary';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';

interface CashierViewProps {
  user: User;
}

export default function CashierView({ user }: CashierViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showShiftSummary, setShowShiftSummary] = useState(false);
  const [showWasteDialog, setShowWasteDialog] = useState(false);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [wasteData, setWasteData] = useState({
    materialId: '',
    quantity: 0,
    reason: '',
  });

  useEffect(() => {
    loadProducts();
    loadMaterials();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('فشل تحميل المنتجات');
    }
  };

  const loadMaterials = async () => {
    try {
      const data = await getMaterials();
      setMaterials(data);
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  };

  const handleAddWaste = async () => {
    if (!wasteData.materialId || wasteData.quantity <= 0) {
      toast.error('الرجاء إدخال البيانات بشكل صحيح');
      return;
    }

    const material = materials.find(m => m.id === wasteData.materialId);
    if (!material) return;

    const now = new Date();
    const waste: Waste = {
      id: `waste-${Date.now()}`,
      materialId: material.id,
      materialName: material.name,
      quantity: wasteData.quantity,
      unit: material.unit,
      unitCost: material.unitCost,
      totalLoss: wasteData.quantity * material.unitCost,
      reason: wasteData.reason,
      date: now.toISOString().split('T')[0], // YYYY-MM-DD format
      timestamp: now,
      reportedBy: user.fullName,
      reportedById: user.id,
    };

    try {
      await addWaste(waste);
      toast.success('تم تسجيل الهالك بنجاح');
      setShowWasteDialog(false);
      setWasteData({ materialId: '', quantity: 0, reason: '' });
    } catch (error) {
      console.error('Error adding waste:', error);
      toast.error('فشل تسجيل الهالك');
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      updateQuantity(product.id, 1);
    } else {
      const newItem: CartItem = {
        product,
        quantity: 1,
        totalCost: product.cost,
        totalPrice: product.price,
        totalProfit: product.profit,
      };
      setCart([...cart, newItem]);
      toast.success(`تم إضافة ${product.name}`);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product.id === productId) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return {
            ...item,
            quantity: newQuantity,
            totalCost: item.product.cost * newQuantity,
            totalPrice: item.product.price * newQuantity,
            totalProfit: item.product.profit * newQuantity,
          };
        }
        return item;
      });
    });
  };

  const handlePay = async () => {
    if (cart.length === 0) return;

    const now = new Date();
    const sale: Sale = {
      id: `SALE-${Date.now()}`,
      items: cart,
      subtotal: cart.reduce((sum, item) => sum + item.totalPrice, 0),
      totalCost: cart.reduce((sum, item) => sum + item.totalCost, 0),
      totalProfit: cart.reduce((sum, item) => sum + item.totalProfit, 0),
      paymentMethod: 'cash',
      timestamp: now,
      cashierId: user.id,
      cashierName: user.fullName,
    };

    try {
      await addSale(sale);
      setCurrentSale(sale);
      setShowReceipt(true);
      setCart([]);
      toast.success('تم إتمام البيع بنجاح');
    } catch (error) {
      console.error('Error adding sale:', error);
      toast.error('فشل إتمام البيع');
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalProfit = cart.reduce((sum, item) => sum + item.totalProfit, 0);

  return (
    <div className="h-screen flex bg-gray-50" dir="rtl">
      {/* Products Grid */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1>شاشة الكاشير</h1>
            <p className="text-sm text-gray-600">مرحباً، {user.fullName}</p>
          </div>
          <div className="flex gap-2">
            {user.role === 'cashier' && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setShowWasteDialog(true)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  تسجيل هالك
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowShiftSummary(true)}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  ملخص الشيفت
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Attendance Widget for Cashiers */}
        {user.role === 'cashier' && (
          <AttendanceWidget user={user} />
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(product => (
            <Card 
              key={product.id}
              className="cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden group"
              onClick={() => addToCart(product)}
            >
              <CardContent className="p-0">
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  {product.imageUrl ? (
                    <ImageWithFallback
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <span className="text-6xl">🥤</span>
                    </div>
                  )}
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Category Badge */}
                  {product.category && (
                    <Badge className="absolute top-2 right-2 bg-white/90 text-gray-800 backdrop-blur-sm shadow-md">
                      {product.category}
                    </Badge>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4 space-y-2">
                  <h3 className="text-center truncate">{product.name}</h3>
                  <div className="text-center">
                    <div className="text-2xl text-[#0B69FF]">{product.price} ج.م</div>
                    {user.role === 'owner' && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs mt-2">
                        ربح: {product.profit} ج.م
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-[500px] bg-white border-r p-6 flex flex-col">
        <h2 className="mb-4">سلة المشتريات</h2>

        <div className="flex-1 overflow-auto mb-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <div className="text-6xl mb-4">🛒</div>
              <p>السلة فارغة</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المنتج</TableHead>
                  <TableHead className="text-center">الكمية</TableHead>
                  <TableHead className="text-right">السعر</TableHead>
                  <TableHead className="text-right">الإجمالي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map((item) => (
                  <TableRow key={item.product.id}>
                    <TableCell>
                      <div>{item.product.name}</div>
                      <div className="text-xs text-gray-500">
                        تكلفة: {item.product.cost} ج.م | ربح: {item.product.profit} ج.م
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{item.product.price} ج.م</TableCell>
                    <TableCell>{item.totalPrice} ج.م</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Totals and Pay Button */}
        <div className="border-t pt-4 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-lg">
              <span>الإجمالي:</span>
              <span className="text-[#007BFF] font-bold text-2xl">{subtotal.toFixed(2)} ج.م</span>
            </div>
            {user.role === 'owner' && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">إجمالي الربح:</span>
                <Badge className="bg-green-100 text-green-800">
                  {totalProfit.toFixed(2)} ج.م
                </Badge>
              </div>
            )}
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>عدد المنتجات:</span>
              <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} قطعة</span>
            </div>
          </div>

          <Button
            className="w-full bg-[#007BFF] hover:bg-[#007BFF]/90 h-14"
            onClick={handlePay}
            disabled={cart.length === 0}
          >
            <span className="text-lg">الدفع</span>
          </Button>
        </div>
      </div>

      {/* Receipt Preview */}
      <ReceiptPreview
        sale={currentSale}
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
      />

      {/* Shift Summary */}
      {user.role === 'cashier' && (
        <ShiftSummary
          isOpen={showShiftSummary}
          onClose={() => setShowShiftSummary(false)}
          user={user}
        />
      )}

      {/* Waste Dialog */}
      <Dialog open={showWasteDialog} onOpenChange={setShowWasteDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              تسجيل هالك
            </DialogTitle>
            <DialogDescription>تسجيل المواد التالفة أو المهدرة</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="waste-material">المادة *</Label>
              <Select
                value={wasteData.materialId}
                onValueChange={(value) => setWasteData({ ...wasteData, materialId: value })}
              >
                <SelectTrigger id="waste-material">
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map(material => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name} ({material.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="waste-quantity">الكمية المتضررة *</Label>
              <Input
                id="waste-quantity"
                type="number"
                step="0.01"
                value={wasteData.quantity || ''}
                onChange={(e) => setWasteData({ ...wasteData, quantity: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="waste-reason">السبب *</Label>
              <Textarea
                id="waste-reason"
                value={wasteData.reason}
                onChange={(e) => setWasteData({ ...wasteData, reason: e.target.value })}
                placeholder="مثال: تلف، انتهاء صلاحية، كسر..."
                rows={3}
              />
            </div>

            {wasteData.materialId && wasteData.quantity > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="text-sm">
                  <span className="text-gray-600">الخسارة المتوقعة: </span>
                  <span className="font-bold text-red-600">
                    {(wasteData.quantity * (materials.find(m => m.id === wasteData.materialId)?.unitCost || 0)).toFixed(2)} ج.م
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleAddWaste}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={!wasteData.materialId || wasteData.quantity <= 0 || !wasteData.reason}
              >
                تسجيل الهالك
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowWasteDialog(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}