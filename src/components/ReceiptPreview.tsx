import { useState, useEffect } from 'react';
import { Sale, SystemSettings } from '../types';
import { getSettings } from '../lib/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Printer } from 'lucide-react';

interface ReceiptPreviewProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiptPreview({ sale, isOpen, onClose }: ReceiptPreviewProps) {
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  if (!sale || !settings) return null;

  const handlePrint = () => {
    window.print();
    onClose();
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-receipt, .print-receipt * {
            visibility: visible;
          }
          .print-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            background: white;
            padding: 10mm;
          }
          .no-print {
            display: none !important;
          }
          .print-receipt {
            font-family: 'Courier New', monospace;
          }
          .print-receipt h2 {
            font-size: 18px;
            margin-bottom: 8px;
            text-align: center;
          }
          .print-receipt .receipt-header {
            text-align: center;
            margin-bottom: 12px;
            border-bottom: 2px dashed #000;
            padding-bottom: 8px;
          }
          .print-receipt .receipt-item {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
            font-size: 12px;
          }
          .print-receipt .receipt-total {
            border-top: 2px dashed #000;
            margin-top: 8px;
            padding-top: 8px;
            font-weight: bold;
            font-size: 14px;
          }
          .print-receipt .receipt-footer {
            text-align: center;
            margin-top: 12px;
            border-top: 2px dashed #000;
            padding-top: 8px;
            font-size: 11px;
          }
        }
      `}</style>
      
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md no-print">
          <DialogHeader>
            <DialogTitle>معاينة الإيصال</DialogTitle>
            <DialogDescription>معاينة تفاصيل الإيصال قبل الطباعة</DialogDescription>
          </DialogHeader>
          
          <div className="print-receipt bg-white p-6 space-y-4" dir="rtl">
            <div className="receipt-header text-center space-y-2 border-b-2 border-dashed pb-4">
              <h2 className="text-xl">{settings.storeName || 'نظام نقطة البيع'}</h2>
              <p className="text-sm text-gray-600">
                {new Date(sale.timestamp).toLocaleString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <p className="text-sm font-mono">رقم الفاتورة: #{sale.id.slice(-8)}</p>
              {sale.cashierName && (
                <p className="text-xs text-gray-500">الكاشير: {sale.cashierName}</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-bold border-b pb-2">
                <div className="col-span-5">المنتج</div>
                <div className="col-span-2 text-center">الكمية</div>
                <div className="col-span-2 text-center">السعر</div>
                <div className="col-span-3 text-left">الإجمالي</div>
              </div>
              
              {sale.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 text-sm">
                  <div className="col-span-5">
                    <div className="font-medium">{item.product.name}</div>
                  </div>
                  <div className="col-span-2 text-center">
                    {item.quantity}
                  </div>
                  <div className="col-span-2 text-center">
                    {item.product.price}
                  </div>
                  <div className="col-span-3 text-left font-medium">
                    {item.totalPrice.toFixed(2)} {settings.currency}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>المجموع الفرعي:</span>
                <span>{sale.subtotal.toFixed(2)} {settings.currency}</span>
              </div>
              {settings.taxRate > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>الضريبة ({settings.taxRate}%):</span>
                  <span>{(sale.subtotal * settings.taxRate / 100).toFixed(2)} {settings.currency}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>طريقة الدفع:</span>
                <span>{sale.paymentMethod === 'cash' ? 'نقدي 💵' : 'بطاقة 💳'}</span>
              </div>
            </div>

            <Separator />

            <div className="receipt-total flex justify-between items-center text-lg font-bold bg-gray-50 p-3 rounded">
              <span>الإجمالي النهائي:</span>
              <span className="text-[#007BFF]">
                {(sale.subtotal * (1 + settings.taxRate / 100)).toFixed(2)} {settings.currency}
              </span>
            </div>

            <div className="receipt-footer text-center text-sm text-gray-500 border-t-2 border-dashed pt-4 mt-4">
              <p className="mb-2">{settings.receiptMessage || 'شكراً لزيارتكم'}</p>
              <p className="text-xs">نتمنى لكم يوماً سعيداً ✨</p>
            </div>
          </div>

          <div className="flex gap-2 no-print">
            <Button onClick={handlePrint} className="flex-1 bg-[#007BFF] hover:bg-[#007BFF]/90">
              <Printer className="ml-2 h-4 w-4" />
              طباعة
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
