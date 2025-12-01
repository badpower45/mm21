import { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { getUsers, addUser, updateUser, deleteUser } from '../../lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { UserPlus, Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'cashier' as UserRole,
    isActive: true,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(getUsers());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUser) {
      updateUser(editingUser.id, {
        ...formData,
        password: formData.password || editingUser.password,
      });
      toast.success('تم تحديث المستخدم بنجاح');
    } else {
      const newUser: User = {
        id: `user-${Date.now()}`,
        ...formData,
        createdAt: new Date(),
      };
      addUser(newUser);
      toast.success('تم إضافة المستخدم بنجاح');
    }

    resetForm();
    loadUsers();
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
    });
    setShowDialog(true);
  };

  const handleDelete = (userId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      deleteUser(userId);
      toast.success('تم حذف المستخدم');
      loadUsers();
    }
  };

  const handleToggleActive = (userId: string, isActive: boolean) => {
    updateUser(userId, { isActive });
    loadUsers();
    toast.info(isActive ? 'تم تفعيل المستخدم' : 'تم تعطيل المستخدم');
  };

  const resetForm = () => {
    setShowDialog(false);
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      fullName: '',
      role: 'cashier',
      isActive: true,
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="mb-2">إدارة المستخدمين</h1>
          <p className="text-sm text-gray-600">إضافة وتعديل مستخدمي النظام</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-[#007BFF] hover:bg-[#007BFF]/90">
          <UserPlus className="ml-2 h-4 w-4" />
          إضافة مستخدم
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            قائمة المستخدمين
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">اسم المستخدم</TableHead>
                <TableHead className="text-right">الاسم الكامل</TableHead>
                <TableHead className="text-right">الدور</TableHead>
                <TableHead className="text-right">تاريخ الإضافة</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.fullName}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'owner' ? 'default' : 'secondary'}>
                      {user.role === 'owner' ? 'مالك' : 'موظف'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.isActive}
                      onCheckedChange={(checked) => handleToggleActive(user.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(user.id)}
                        disabled={user.role === 'owner'}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? 'تعديل معلومات وصلاحيات المستخدم' : 'إضافة مستخدم جديد للنظام'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                disabled={!!editingUser}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                كلمة المرور {editingUser && '(اتركها فارغة للإبقاء على القديمة)'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">الدور</Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashier">موظف</SelectItem>
                  <SelectItem value="owner">مالك</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">مستخدم نشط</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1 bg-[#007BFF] hover:bg-[#007BFF]/90">
                {editingUser ? 'حفظ التعديلات' : 'إضافة'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
