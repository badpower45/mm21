import { useState, useEffect } from 'react';
import { Product, RawMaterial, RecipeItem } from '../../types';
import { getMaterials, addMaterial, addProduct } from '../../lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';
import { Plus, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface AddProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddProductDialog({ isOpen, onClose, onSuccess }: AddProductDialogProps) {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [recipe, setRecipe] = useState<RecipeItem[]>([]);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  
  const [productData, setProductData] = useState({
    name: '',
    sku: '',
    barcode: '',
    price: 0,
    category: '',
  });

  const [newMaterial, setNewMaterial] = useState({
    name: '',
    unit: 'g',
    unitCost: 0,
    currentStock: 0,
    minStock: 0,
    targetStock: 0,
  });

  useEffect(() => {
    if (isOpen) {
      loadMaterials();
    }
  }, [isOpen]);

  const loadMaterials = async () => {
    try {
      const data = await getMaterials();
      setMaterials(data);
    } catch (error) {
      console.error('Error loading materials:', error);
      toast.error('فشل تحميل المواد الخام');
    }
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.name || newMaterial.unitCost <= 0) {
      toast.error('الرجاء إدخال بيانات المادة بشكل صحيح');
      return;
    }

    const material: RawMaterial = {
      id: `mat-${Date.now()}`,
      ...newMaterial,
    };

    try {
      await addMaterial(material);
      setMaterials([...materials, material]);
      toast.success('تم إضافة المادة الخام بنجاح');
      setShowAddMaterial(false);
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

  const handleAddRecipeItem = () => {
    setRecipe([
      ...recipe,
      {
        materialId: '',
        materialName: '',
        quantity: 0,
        unit: '',
        unitCost: 0,
        totalCost: 0,
      },
    ]);
  };

  const handleUpdateRecipeItem = (index: number, materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) return;

    const newRecipe = [...recipe];
    newRecipe[index] = {
      ...newRecipe[index],
      materialId: material.id,
      materialName: material.name,
      unit: material.unit,
      unitCost: material.unitCost,
      totalCost: newRecipe[index].quantity * material.unitCost,
    };
    setRecipe(newRecipe);
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    const newRecipe = [...recipe];
    newRecipe[index].quantity = quantity;
    newRecipe[index].totalCost = quantity * newRecipe[index].unitCost;
    setRecipe(newRecipe);
  };

  const handleRemoveRecipeItem = (index: number) => {
    setRecipe(recipe.filter((_, i) => i !== index));
  };

  const calculateTotalCost = () => {
    return recipe.reduce((sum, item) => sum + item.totalCost, 0);
  };

  const calculateProfit = () => {
    const rawProfit = productData.price - calculateTotalCost();
    return Math.round(rawProfit); // تقريب الربح لأقرب رقم صحيح
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productData.name || productData.price <= 0) {
      toast.error('الرجاء إدخال اسم المنتج والسعر');
      return;
    }

    if (recipe.length === 0) {
      toast.error('الرجاء إضافة مكونات الوصفة');
      return;
    }

    const validRecipe = recipe.filter(r => r.materialId && r.quantity > 0);
    if (validRecipe.length === 0) {
      toast.error('الرجاء إكمال بيانات الوصفة');
      return;
    }

    const cost = calculateTotalCost();
    const profit = Math.round(productData.price - cost); // تقريب الربح لأقرب رقم صحيح

    const product: Product = {
      id: `prod-${Date.now()}`,
      name: productData.name,
      sku: productData.sku || `SKU-${Date.now()}`,
      barcode: productData.barcode,
      cost,
      price: productData.price,
      profit,
      recipe: validRecipe,
      category: productData.category,
      isActive: true,
    };

    try {
      await addProduct(product);
      toast.success('تم إضافة المنتج بنجاح');
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('فشل إضافة المنتج');
    }
  };

  const resetForm = () => {
    setProductData({
      name: '',
      sku: '',
      barcode: '',
      price: 0,
      category: '',
    });
    setRecipe([]);
  };

  const totalCost = calculateTotalCost();
  const profit = calculateProfit();
  const profitMargin = productData.price > 0 ? (profit / productData.price) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            إضافة منتج جديد
          </DialogTitle>
          <DialogDescription>إضافة منتج جديد مع بناء الوصفة والتكاليف</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Info */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-medium mb-4">معلومات المنتج</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم المنتج *</Label>
                  <Input
                    id="name"
                    value={productData.name}
                    onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">رمز المنتج (SKU)</Label>
                  <Input
                    id="sku"
                    value={productData.sku}
                    onChange={(e) => setProductData({ ...productData, sku: e.target.value })}
                    placeholder="سيتم توليده تلقائياً"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">الباركود</Label>
                  <Input
                    id="barcode"
                    value={productData.barcode}
                    onChange={(e) => setProductData({ ...productData, barcode: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">سعر البيع * (ج.م)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={productData.price || ''}
                    onChange={(e) => setProductData({ ...productData, price: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="category">الفئة</Label>
                  <Input
                    id="category"
                    value={productData.category}
                    onChange={(e) => setProductData({ ...productData, category: e.target.value })}
                    placeholder="مثال: مشروبات، مأكولات..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recipe Builder */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">الوصفة (المكونات)</h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddMaterial(!showAddMaterial)}
                  >
                    <Plus className="ml-1 h-4 w-4" />
                    مادة جديدة
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddRecipeItem}
                  >
                    <Plus className="ml-1 h-4 w-4" />
                    إضافة مكون
                  </Button>
                </div>
              </div>

              {/* Add New Material Form */}
              {showAddMaterial && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4 space-y-3">
                    <h4 className="text-sm font-medium">إضافة مادة خام جديدة</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">اسم المادة</Label>
                        <Input
                          size="sm"
                          value={newMaterial.name}
                          onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">الوحدة</Label>
                        <Select
                          value={newMaterial.unit}
                          onValueChange={(value) => setNewMaterial({ ...newMaterial, unit: value })}
                        >
                          <SelectTrigger className="h-9">
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
                      <div>
                        <Label className="text-xs">تكلفة الوحدة</Label>
                        <Input
                          type="number"
                          step="0.01"
                          size="sm"
                          value={newMaterial.unitCost || ''}
                          onChange={(e) => setNewMaterial({ ...newMaterial, unitCost: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={handleAddMaterial}>
                        إضافة
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setShowAddMaterial(false)}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recipe Items */}
              <div className="space-y-3">
                {recipe.map((item, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label className="text-xs">المادة</Label>
                      <Select
                        value={item.materialId}
                        onValueChange={(value) => handleUpdateRecipeItem(index, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المادة" />
                        </SelectTrigger>
                        <SelectContent>
                          {materials.map(material => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.name} ({material.unitCost.toFixed(2)} ج.م/{material.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-32">
                      <Label className="text-xs">الكمية</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.quantity || ''}
                        onChange={(e) => handleUpdateQuantity(index, Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>

                    <div className="w-20">
                      <Label className="text-xs">الوحدة</Label>
                      <Input value={item.unit || '-'} disabled />
                    </div>

                    <div className="w-28">
                      <Label className="text-xs">التكلفة</Label>
                      <Badge variant="secondary" className="w-full justify-center">
                        {item.totalCost.toFixed(2)} ج.م
                      </Badge>
                    </div>

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveRecipeItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}

                {recipe.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>لم تتم إضافة مكونات بعد</p>
                    <p className="text-sm">اضغط "إضافة مكون" للبدء</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cost Summary */}
          {recipe.length > 0 && (
            <Card className="bg-gray-50">
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-medium mb-3">ملخص التكاليف</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">التكلفة الإجمالية:</span>
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      {totalCost.toFixed(2)} ج.م
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">سعر البيع:</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {productData.price.toFixed(2)} ج.م
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-medium">الربح المتوقع:</span>
                    <div className="text-left">
                      <Badge
                        variant="secondary"
                        className={profit >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {profit.toFixed(2)} ج.م
                      </Badge>
                      <div className="text-xs text-gray-600 mt-1">
                        نسبة الربح: {profitMargin.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                {profit < 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                    ⚠️ تحذير: سعر البيع أقل من التكلفة! سيؤدي ذلك إلى خسارة.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 bg-[#007BFF] hover:bg-[#007BFF]/90">
              إضافة المنتج
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
