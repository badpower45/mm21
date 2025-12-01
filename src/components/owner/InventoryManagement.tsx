import { useState, useEffect } from 'react';
import { RawMaterial } from '../../types';
import { getRawMaterials, updateRawMaterials } from '../../lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Package, Edit, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function InventoryManagement() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [adjustment, setAdjustment] = useState(0);
  const [adjustmentNote, setAdjustmentNote] = useState('');

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = () => {
    setMaterials(getRawMaterials());
  };

  const getTotalInventoryValue = () => {
    return materials.reduce((sum, m) => sum + (m.currentStock * m.unitCost), 0);
  };

  const getLowStockCount = () => {
    return materials.filter(m => m.currentStock < m.minStock).length;
  };

  const handleEdit = (material: RawMaterial) => {
    setEditingMaterial(material);
    setAdjustment(0);
    setAdjustmentNote('');
    setShowDialog(true);
  };

  const handleAdjustment = () => {
    if (!editingMaterial || adjustment === 0) return;

    const updated = materials.map(m => {
      if (m.id === editingMaterial.id) {
        return {
          ...m,
          currentStock: Math.max(0, m.currentStock + adjustment),
        };
      }
      return m;
    });

    updateRawMaterials(updated);
    loadMaterials();
    setShowDialog(false);
    
    const action = adjustment > 0 ? 'إضافة' : 'خصم';
    toast.success(`تم ${action} ${Math.abs(adjustment)} ${editingMaterial.unit} من ${editingMaterial.name}`);
  };

  const getStockStatus = (material: RawMaterial) => {
    if (material.currentStock < material.minStock) {
      return { label: 'منخفض', color: 'bg-red-100 text-red-800' };
    } else if (material.currentStock < material.targetStock) {
      return { label: 'متوسط', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { label: 'جيد', color: 'bg-green-100 text-green-800' };
    }
  };

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    unit: 'g',
    unitCost: 0,
    currentStock: 0,
    minStock: 0,
    targetStock: 0,
  });

  const handleAddNewMaterial = async () => {
    if (!newMaterial.name || newMaterial.unitCost <= 0) {
      toast.error('الرجاء إدخال بيانات المادة بشكل صحيح');
      return;
    }

    const material: RawMaterial = {
      id: `mat-${Date.now()}`,
      ...newMaterial,
    };

    try {
      const allMaterials = [...materials, material];
      updateRawMaterials(allMaterials);
      loadMaterials();
      toast.success('تم إضافة المادة الخام بنجاح');
      setShowAddDialog(false);
      setNewMaterial({
        name: '',
        unit: 'g',
        unitCost: 0,
        currentStock: 0,
        minStock: 0,
        targetStock: 0,
      });
    } catch (error) {
      console.error('Error adding material:', error);
      toast.error('فشل إضافة المادة الخام');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="mb-2">إدارة المخزون</h1>
          <p className="text-sm text-gray-600">متابعة وتعديل المواد الخام</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-[#007BFF] hover:bg-[#007BFF]/90">
          <Package className="ml-1 h-4 w-4" />
          إضافة مادة خام
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4" />
              إجمالي قيمة المخزون
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-[#007BFF]">
              {getTotalInventoryValue().toFixed(2)} ج.م
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              مواد منخفضة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-red-600">
              {getLowStockCount()} مادة
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4" />
              إجمالي المواد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {materials.length} مادة
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <CardTitle>المواد الخام</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المادة</TableHead>
                <TableHead className="text-right">الكمية الحالية</TableHead>
                <TableHead className="text-right">الحد الأدنى</TableHead>
                <TableHead className="text-right">الحد المستهدف</TableHead>
                <TableHead className="text-right">تكلفة الوحدة</TableHead>
                <TableHead className="text-right">القيمة الإجمالية</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map(material => {
                const status = getStockStatus(material);
                const totalValue = material.currentStock * material.unitCost;
                
                return (
                  <TableRow key={material.id}>
                    <TableCell>{material.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span>{material.currentStock} {material.unit}</span>
                        {material.currentStock < material.minStock && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{material.minStock} {material.unit}</TableCell>
                    <TableCell>{material.targetStock} {material.unit}</TableCell>
                    <TableCell>{material.unitCost.toFixed(2)} ج.م</TableCell>
                    <TableCell>{totalValue.toFixed(2)} ج.م</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={status.color}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(material)}
                      >
                        <Edit className="ml-1 h-4 w-4" />
                        تعديل
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Adjustment Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل مخزون: {editingMaterial?.name}</DialogTitle>
            <DialogDescription>إضافة أو خصم كمية من المخزون</DialogDescription>
          </DialogHeader>

          {editingMaterial && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">الكمية الحالية:</span>
                  <span>{editingMaterial.currentStock} {editingMaterial.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الحد الأدنى:</span>
                  <span>{editingMaterial.minStock} {editingMaterial.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الحد المستهدف:</span>
                  <span>{editingMaterial.targetStock} {editingMaterial.unit}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjustment">كمية التعديل</Label>
                <Input
                  id="adjustment"
                  type="number"
                  value={adjustment}
                  onChange={(e) => setAdjustment(Number(e.target.value))}
                  placeholder="أدخل الكمية (موجب للإضافة، سالب للخصم)"
                />
                <p className="text-sm text-gray-500">
                  الكمية بعد التعديل: {editingMaterial.currentStock + adjustment} {editingMaterial.unit}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">ملاحظات (اختياري)</Label>
                <Input
                  id="note"
                  value={adjustmentNote}
                  onChange={(e) => setAdjustmentNote(e.target.value)}
                  placeholder="سبب التعديل..."
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAdjustment}
                  disabled={adjustment === 0}
                  className="flex-1 bg-[#007BFF] hover:bg-[#007BFF]/90"
                >
                  {adjustment > 0 ? (
                    <>
                      <TrendingUp className="ml-1 h-4 w-4" />
                      إضافة
                    </>
                  ) : adjustment < 0 ? (
                    <>
                      <TrendingDown className="ml-1 h-4 w-4" />
                      خصم
                    </>
                  ) : (
                    'حفظ'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add New Material Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة مادة خام جديدة</DialogTitle>
            <DialogDescription>إضافة مادة خام جديدة للمخزون</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mat-name">اسم المادة *</Label>
              <Input
                id="mat-name"
                value={newMaterial.name}
                onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                placeholder="مثال: سكر، حليب، قهوة..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mat-unit">الوحدة *</Label>
                <Select
                  value={newMaterial.unit}
                  onValueChange={(value) => setNewMaterial({ ...newMaterial, unit: value })}
                >
                  <SelectTrigger id="mat-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g">جرام (g)</SelectItem>
                    <SelectItem value="ml">ملليلتر (ml)</SelectItem>
                    <SelectItem value="piece">قطعة</SelectItem>
                    <SelectItem value="kg">كيلو (kg)</SelectItem>
                    <SelectItem value="l">لتر (l)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mat-cost">تكلفة الوحدة (ج.م) *</Label>
                <Input
                  id="mat-cost"
                  type="number"
                  step="0.01"
                  value={newMaterial.unitCost || ''}
                  onChange={(e) => setNewMaterial({ ...newMaterial, unitCost: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mat-current">المخزون الحالي</Label>
                <Input
                  id="mat-current"
                  type="number"
                  step="0.01"
                  value={newMaterial.currentStock || ''}
                  onChange={(e) => setNewMaterial({ ...newMaterial, currentStock: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mat-min">الحد الأدنى</Label>
                <Input
                  id="mat-min"
                  type="number"
                  step="0.01"
                  value={newMaterial.minStock || ''}
                  onChange={(e) => setNewMaterial({ ...newMaterial, minStock: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mat-target">الحد المستهدف</Label>
                <Input
                  id="mat-target"
                  type="number"
                  step="0.01"
                  value={newMaterial.targetStock || ''}
                  onChange={(e) => setNewMaterial({ ...newMaterial, targetStock: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleAddNewMaterial}
                className="flex-1 bg-[#007BFF] hover:bg-[#007BFF]/90"
              >
                إضافة المادة
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
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
