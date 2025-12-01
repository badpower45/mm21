import { useState, useEffect } from 'react';
import { Waste, RawMaterial, User } from '../../types';
import { getWaste, getMaterials, addWaste } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Trash2, AlertTriangle, TrendingDown, Plus } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { formatDate, formatDateTime } from '../../lib/dateUtils';

export default function WasteManagement({ currentUser }: { currentUser: User }) {
  const [waste, setWaste] = useState<Waste[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    materialId: '',
    quantity: 0,
    reason: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [wasteData, materialsData] = await Promise.all([
        getWaste(),
        getMaterials()
      ]);
      setWaste(wasteData);
      setMaterials(materialsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const material = materials.find(m => m.id === formData.materialId);
    if (!material) {
      toast.error('الرجاء اختيار المادة');
      return;
    }

    if (formData.quantity <= 0) {
      toast.error('الرجاء إدخال كمية صحيحة');
      return;
    }

    if (formData.quantity > material.currentStock) {
      toast.error('الكمية المدخلة أكبر من المخزون المتاح');
      return;
    }

    const now = new Date();
    const wasteRecord: Waste = {
      id: `waste-${Date.now()}`,
      materialId: material.id,
      materialName: material.name,
      quantity: formData.quantity,
      unit: material.unit,
      unitCost: material.unitCost,
      totalLoss: formData.quantity * material.unitCost,
      reason: formData.reason,
      reportedBy: currentUser.fullName,
      reportedById: currentUser.id,
      timestamp: now,
      date: formatDate(now, 'yyyy-MM-dd'),
    };

    try {
      await addWaste(wasteRecord);
      toast.success('تم تسجيل الهالك بنجاح');
      setFormData({ materialId: '', quantity: 0, reason: '' });
      setShowDialog(false);
      loadData();
    } catch (error) {
      console.error('Error adding waste:', error);
      toast.error('فشل تسجيل الهالك');
    }
  };

  const getTodayStats = () => {
    const today = formatDate(new Date(), 'yyyy-MM-dd');
    const todayWaste = waste.filter(w => w.date === today);
    
    const totalLoss = todayWaste.reduce((sum, w) => sum + w.totalLoss, 0);
    const totalItems = todayWaste.length;
    
    return { totalLoss, totalItems };
  };

  const getMonthStats = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthWaste = waste.filter(w => {
      const date = new Date(w.date);
      return date >= monthStart;
    });
    
    const totalLoss = monthWaste.reduce((sum, w) => sum + w.totalLoss, 0);
    const totalItems = monthWaste.length;
    
    return { totalLoss, totalItems };
  };

  const getMostWastedMaterials = () => {
    const materialWaste = new Map<string, { name: string; totalLoss: number; count: number }>();
    
    waste.forEach(w => {
      const existing = materialWaste.get(w.materialId) || { name: w.materialName, totalLoss: 0, count: 0 };
      existing.totalLoss += w.totalLoss;
      existing.count += 1;
      materialWaste.set(w.materialId, existing);
    });
    
    return Array.from(materialWaste.values())
      .sort((a, b) => b.totalLoss - a.totalLoss)
      .slice(0, 5);
  };

  const todayStats = getTodayStats();
  const monthStats = getMonthStats();
  const mostWasted = getMostWastedMaterials();

  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="mb-2">إدارة الهالك والتلف</h1>
          <p className="text-sm text-gray-600">تتبع المواد التالفة والمهدرة</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-[#007BFF] hover:bg-[#007BFF]/90">
          <Plus className="ml-2 h-4 w-4" />
          تسجيل هالك
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              خسائر اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-red-600">{(todayStats.totalLoss || 0).toFixed(2)} ج.م</div>
            <p className="text-xs text-gray-600 mt-1">{todayStats.totalItems || 0} عملية</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              خسائر الشهر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-orange-600">{(monthStats.totalLoss || 0).toFixed(2)} ج.م</div>
            <p className="text-xs text-gray-600 mt-1">{monthStats.totalItems || 0} عملية</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              إجمالي السجلات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{waste.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              المواد الأكثر هدراً
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {mostWasted[0] ? mostWasted[0].name : 'لا توجد بيانات'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Waste Records Table */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              سجل الهالك والتلف
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">المادة</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead className="text-right">الخسارة</TableHead>
                    <TableHead className="text-right">السبب</TableHead>
                    <TableHead className="text-right">المسجل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waste.slice().reverse().map(record => (
                    <TableRow key={record.id}>
                      <TableCell className="text-sm">
                        {formatDateTime(record.timestamp)}
                      </TableCell>
                      <TableCell>{record.materialName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {record.quantity} {record.unit}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-red-100 text-red-800">
                          {record.totalLoss.toFixed(2)} ج.م
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {record.reason}
                      </TableCell>
                      <TableCell className="text-sm">{record.reportedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Most Wasted Materials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              المواد الأكثر هدراً
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mostWasted.map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-600">{item.count} مرة</div>
                    </div>
                    <Badge className="bg-red-100 text-red-800">
                      {item.totalLoss.toFixed(2)} ج.م
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{
                        width: `${(item.totalLoss / mostWasted[0].totalLoss) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Waste Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تسجيل هالك جديد</DialogTitle>
            <DialogDescription>تسجيل مادة تالفة أو مهدرة مع السبب</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material">المادة الخام</Label>
              <Select
                value={formData.materialId}
                onValueChange={(value) => setFormData({ ...formData, materialId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map(material => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name} (متوفر: {material.currentStock} {material.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.materialId && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">المخزون الحالي:</span>
                  <span>{materials.find(m => m.id === formData.materialId)?.currentStock || 0} {materials.find(m => m.id === formData.materialId)?.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">تكلفة الوحدة:</span>
                  <span>{materials.find(m => m.id === formData.materialId)?.unitCost.toFixed(2)} ج.م</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">الكمية</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                required
              />
            </div>

            {formData.materialId && formData.quantity > 0 && (
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-800">إجمالي الخسارة:</span>
                  <span className="text-lg font-bold text-red-600">
                    {((materials.find(m => m.id === formData.materialId)?.unitCost || 0) * formData.quantity).toFixed(2)} ج.م
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">سبب الها��ك</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="مثال: تلف، انتهاء صلاحية، كسر..."
                required
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
                <Trash2 className="ml-2 h-4 w-4" />
                تسجيل الهالك
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
