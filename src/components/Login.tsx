import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ShoppingCart, AlertCircle, Coffee, Lock, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import { getUsers } from '../lib/api';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const authenticateUser = async (username: string, password: string): Promise<User | null> => {
    try {
      const users = await getUsers();
      return users.find(u => u.username === username && u.password === password && u.isActive) || null;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!username || !password) {
      setError('الرجاء إدخال اسم المستخدم وكلمة المرور');
      setLoading(false);
      return;
    }

    const user = await authenticateUser(username, password);
    if (user) {
      onLogin(user);
      toast.success(`مرحباً ${user.fullName}`);
    } else {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
      toast.error('فشل تسجيل الدخول');
    }
    setLoading(false);
  };

  const handleQuickLogin = async (username: string, password: string, role: string) => {
    setLoading(true);
    const user = await authenticateUser(username, password);
    if (user) {
      onLogin(user);
      toast.success(`تم الدخول كـ ${role}`);
    } else {
      toast.error('فشل تسجيل الدخول');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Right Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1718791985055-e1b06ef5961d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWZlJTIwYmFyaXN0YSUyMGNvZmZlZSUyMHNob3B8ZW58MXx8fHwxNzY0NTk4ODQ5fDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Cafe background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B69FF]/80 to-[#FFB800]/60 flex items-center justify-center">
          <div className="text-white text-center px-12">
            <Coffee className="w-20 h-20 mx-auto mb-6 animate-pulse" />
            <h1 className="text-5xl mb-4">نظام نقطة البيع</h1>
            <p className="text-xl opacity-90">حل متكامل لإدارة المشروبات والمبيعات</p>
            <div className="mt-8 flex gap-4 justify-center text-sm">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl">📊</div>
                <div className="mt-2">إدارة المخزون</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl">💰</div>
                <div className="mt-2">تتبع الأرباح</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl">👥</div>
                <div className="mt-2">إدارة الموظفين</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#0B69FF] to-[#FFB800] rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                <ShoppingCart className="w-10 h-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl">مرحباً بك</CardTitle>
            <CardDescription>
              <span className="block text-base">قم بتسجيل الدخول للوصول إلى النظام</span>
              <span className="block text-xs mt-2 text-green-600">✓ النظام جاهز للاستخدام</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-base">اسم المستخدم</Label>
                <div className="relative">
                  <UserIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="أدخل اسم المستخدم"
                    className="pr-10 h-12"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    className="pr-10 h-12"
                    dir="rtl"
                  />
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200 animate-shake">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="space-y-2 pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base bg-gradient-to-r from-[#0B69FF] to-[#0B69FF]/90 hover:from-[#0B69FF]/90 hover:to-[#0B69FF] transition-all duration-300 shadow-lg hover:shadow-xl" 
                  disabled={loading}
                >
                  {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
                </Button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4 text-center font-medium">دخول سريع للتجربة:</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 border-[#0B69FF] text-[#0B69FF] hover:bg-[#0B69FF] hover:text-white transition-all duration-300"
                  onClick={() => handleQuickLogin('owner', '123456', 'مالك')}
                  disabled={loading}
                >
                  👨‍💼 دخول كمالك
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 border-[#FFB800] text-[#FFB800] hover:bg-[#FFB800] hover:text-white transition-all duration-300"
                  onClick={() => handleQuickLogin('cashier', '123456', 'موظف')}
                  disabled={loading}
                >
                  👤 دخول كموظف
                </Button>
              </div>
              <div className="mt-4 bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 text-center">
                  <span className="font-medium">اسم المستخدم:</span> owner / cashier
                </p>
                <p className="text-xs text-gray-600 text-center mt-1">
                  <span className="font-medium">كلمة المرور:</span> 123456
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}