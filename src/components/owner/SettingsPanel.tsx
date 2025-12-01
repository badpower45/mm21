import { useState, useEffect } from 'react';
import { SystemSettings } from '../../types';
import { getSettings, updateSettings } from '../../lib/storage';
import { clearAllData } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Settings, Store, Receipt, DollarSign, Save, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function SettingsPanel() {
  const [settings, setSettings] = useState<SystemSettings>({
    storeName: '',
    receiptMessage: '',
    taxRate: 0,
    currency: 'ج.م',
  });

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleSave = () => {
    updateSettings(settings);
    toast.success('تم حفظ الإعدادات بنجاح');
  };

  const handleClearData = async () => {
    try {
      await clearAllData();
      toast.success('تم حذف جميع البيانات بنجاح');
      window.location.reload();
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('فشل حذف البيانات');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="mb-6">
        <h1 className="mb-2">الإعدادات</h1>
        <p className="text-sm text-gray-600">إعدادات النظام والطابعة</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Store Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              إعدادات المتجر
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">اسم المتجر</Label>
              <Input
                id="storeName"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                placeholder="أدخل اسم المتجر"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeLogo">شعار المتجر (URL)</Label>
              <Input
                id="storeLogo"
                value={settings.storeLogo || ''}
                onChange={(e) => setSettings({ ...settings, storeLogo: e.target.value })}
                placeholder="رابط شعار المتجر"
              />
            </div>
          </CardContent>
        </Card>

        {/* Receipt Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              إعدادات الإيصال
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="receiptMessage">رسالة الشكر</Label>
              <Textarea
                id="receiptMessage"
                value={settings.receiptMessage}
                onChange={(e) => setSettings({ ...settings, receiptMessage: e.target.value })}
                placeholder="شكراً لزيارتكم..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="printerName">اسم الطابعة</Label>
              <Input
                id="printerName"
                value={settings.printerName || ''}
                onChange={(e) => setSettings({ ...settings, printerName: e.target.value })}
                placeholder="اسم الطابعة الحرارية"
              />
              <p className="text-sm text-gray-500">
                اترك فارغاً لاستخدام الطابعة الافتراضية
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              إعدادات الأسعار
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">العملة</Label>
              <Input
                id="currency"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                placeholder="ج.م"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxRate">نسبة الضريبة (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.1"
                value={settings.taxRate}
                onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                placeholder="0"
              />
              <p className="text-sm text-gray-500">
                سيتم إضافة هذه النسبة تلقائياً على جميع المبيعات
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              منطقة الخطر
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2">حذف البيانات</h3>
              <p className="text-sm text-gray-600 mb-4">
                سيتم حذف جميع المبيعات، سجلات الحضور والغياب، وسجلات الهالك. 
                لن يتم حذف المنتجات والمواد الخام والمستخدمين.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    حذف جميع البيانات
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      هذا الإجراء لا يمكن التراجع عنه. سيتم حذف:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>جميع المبيعات</li>
                        <li>جميع سجلات الحضور والغياب</li>
                        <li>جميع سجلات الهالك</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleClearData}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      نعم، احذف كل شيء
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-[#007BFF] hover:bg-[#007BFF]/90">
            <Save className="ml-2 h-4 w-4" />
            حفظ الإعدادات
          </Button>
        </div>
      </div>
    </div>
  );
}
