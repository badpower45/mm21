import { useState, useEffect } from 'react';
import { Product } from '../types';
import { getProducts } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import AddProductDialog from './owner/AddProductDialog';
import { Package, Eye, Plus, Grid3x3, List } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showRecipe, setShowRecipe] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const viewRecipe = (product: Product) => {
    setSelectedProduct(product);
    setShowRecipe(true);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="mb-2">إدارة المنتجات</h1>
          <p className="text-sm text-gray-600">عرض وإدارة المنتجات والوصفات</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-white rounded-lg p-1 border">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setShowAddProduct(true)} className="bg-[#007BFF] hover:bg-[#007BFF]/90">
            <Plus className="ml-2 h-4 w-4" />
            إضافة منتج جديد
          </Button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
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
                {/* Category Badge */}
                {product.category && (
                  <Badge className="absolute top-3 right-3 bg-white/90 text-gray-800 backdrop-blur-sm shadow-md">
                    {product.category}
                  </Badge>
                )}
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="text-center mb-1">{product.name}</h3>
                  <p className="text-xs text-center text-gray-500">{product.sku}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-red-50 rounded-lg p-2">
                    <div className="text-xs text-gray-600">التكلفة</div>
                    <div className="text-sm text-red-600">{product.cost} ج.م</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2">
                    <div className="text-xs text-gray-600">السعر</div>
                    <div className="text-sm text-blue-600">{product.price} ج.م</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <div className="text-xs text-gray-600">الربح</div>
                    <div className="text-sm text-green-600">{product.profit} ج.م</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <Badge variant="outline" className="text-xs">
                    {((product.profit / product.price) * 100).toFixed(1)}% هامش ربح
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => viewRecipe(product)}
                    className="text-[#0B69FF] hover:text-[#0B69FF]/80"
                  >
                    <Eye className="ml-1 h-4 w-4" />
                    الوصفة
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <Card>
          <CardHeader>
            <CardTitle>قائمة المنتجات</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم المنتج</TableHead>
                  <TableHead className="text-right">رمز المنتج</TableHead>
                  <TableHead className="text-right">الباركود</TableHead>
                  <TableHead className="text-right">التكلفة</TableHead>
                  <TableHead className="text-right">سعر البيع</TableHead>
                  <TableHead className="text-right">الربح</TableHead>
                  <TableHead className="text-right">نسبة الربح</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map(product => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.barcode || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        {product.cost} ج.م
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {product.price} ج.م
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {product.profit} ج.م
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {((product.profit / product.price) * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewRecipe(product)}
                      >
                        <Eye className="ml-1 h-4 w-4" />
                        الوصفة
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recipe Dialog */}
      <Dialog open={showRecipe} onOpenChange={setShowRecipe}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              وصفة: {selectedProduct?.name}
            </DialogTitle>
            <DialogDescription>تفاصيل المكونات والتكاليف للمنتج</DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">التكلفة الإجمالية</div>
                  <div className="text-red-600">{selectedProduct.cost} ج.م</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">سعر البيع</div>
                  <div className="text-blue-600">{selectedProduct.price} ج.م</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">الربح</div>
                  <div className="text-green-600">{selectedProduct.profit} ج.م</div>
                </div>
              </div>

              <div>
                <h3 className="mb-3">المكونات</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المادة</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                      <TableHead className="text-right">الوحدة</TableHead>
                      <TableHead className="text-right">تكلفة الوحدة</TableHead>
                      <TableHead className="text-right">التكلفة الإجمالية</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedProduct.recipe.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.materialName}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>{item.unitCost.toFixed(2)} ج.م</TableCell>
                        <TableCell>{item.totalCost.toFixed(2)} ج.م</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <AddProductDialog
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onSuccess={loadProducts}
      />
    </div>
  );
}