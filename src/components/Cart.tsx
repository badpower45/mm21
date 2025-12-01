import { CartItem } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  onPay: () => void;
}

export default function Cart({ items, onUpdateQuantity, onRemove, onPay }: CartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);
  const totalProfit = items.reduce((sum, item) => sum + item.totalProfit, 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>سلة المشتريات</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto mb-4">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              السلة فارغة
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المنتج</TableHead>
                  <TableHead className="text-center">الكمية</TableHead>
                  <TableHead className="text-right">السعر</TableHead>
                  <TableHead className="text-right">التكلفة</TableHead>
                  <TableHead className="text-right">الربح</TableHead>
                  <TableHead className="text-right">الإجمالي</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.product.id}>
                    <TableCell>{item.product.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {item.product.price} ج.م
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        {item.product.cost} ج.م
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {item.product.profit} ج.م
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.totalPrice} ج.م
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onRemove(item.product.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">إجمالي التكلفة:</span>
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              {totalCost.toFixed(2)} ج.م
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">إجمالي الربح:</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {totalProfit.toFixed(2)} ج.م
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span>الإجمالي:</span>
            <span className="text-[#0B69FF]">{subtotal.toFixed(2)} ج.م</span>
          </div>
          <Button
            className="w-full bg-[#0B69FF] hover:bg-[#0B69FF]/90"
            onClick={onPay}
            disabled={items.length === 0}
          >
            الدفع
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
