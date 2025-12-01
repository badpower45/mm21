import { useState, useEffect } from 'react';
import { Attendance, User } from '../../types';
import { getAttendance, getUsers } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Clock, Users, Calendar as CalendarIcon, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatDate, formatTime, formatShortDate, getMonthYear } from '../../lib/dateUtils';

export default function AttendanceManagement() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const dateStr = formatDate(selectedDate, 'yyyy-MM-dd');
      const [attendanceData, usersData] = await Promise.all([
        getAttendance(dateStr),
        getUsers()
      ]);
      setAttendance(attendanceData);
      setUsers(usersData.filter(u => u.role === 'cashier'));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTodayStats = () => {
    const today = formatDate(new Date(), 'yyyy-MM-dd');
    const todayAttendance = attendance.filter(a => a.date === today);
    
    const present = todayAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const late = todayAttendance.filter(a => a.status === 'late').length;
    const totalHours = todayAttendance.reduce((sum, a) => sum + (a.workHours || 0), 0);
    
    return { present, late, totalHours, total: users.length };
  };

  const getEmployeeMonthStats = (userId: string) => {
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    
    const monthAttendance = attendance.filter(a => {
      const date = new Date(a.date);
      return a.userId === userId && date >= monthStart && date <= monthEnd;
    });
    
    const present = monthAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const late = monthAttendance.filter(a => a.status === 'late').length;
    const totalHours = monthAttendance.reduce((sum, a) => sum + (a.workHours || 0), 0);
    
    return { present, late, totalHours };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800">حاضر</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800">متأخر</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800">غائب</Badge>;
      case 'half-day':
        return <Badge className="bg-blue-100 text-blue-800">نصف يوم</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const stats = getTodayStats();
  const dateStr = formatDate(selectedDate, 'yyyy-MM-dd');
  const todayAttendance = attendance.filter(a => a.date === dateStr);

  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="mb-6">
        <h1 className="mb-2">الحضور والغياب</h1>
        <p className="text-sm text-gray-600">متابعة حضور الموظفين وساعات العمل</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              الحاضرون اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600">{stats.present}/{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              المتأخرون
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-yellow-600">{stats.late}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              الغائبون
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-red-600">{stats.total - stats.present}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              ساعات العمل اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{(stats.totalHours || 0).toFixed(1)} ساعة</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily" dir="rtl">
        <TabsList>
          <TabsTrigger value="daily">سجل اليومي</TabsTrigger>
          <TabsTrigger value="monthly">التقرير الشهري</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                سجل الحضور
              </CardTitle>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {formatShortDate(selectedDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                  />
                </PopoverContent>
              </Popover>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الموظف</TableHead>
                    <TableHead className="text-right">تسجيل الدخول</TableHead>
                    <TableHead className="text-right">تسجيل الخروج</TableHead>
                    <TableHead className="text-right">ساعات العمل</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">ملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => {
                    const record = todayAttendance.find(a => a.userId === user.id);
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>{user.fullName}</TableCell>
                        <TableCell>
                          {record?.checkIn ? (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              {formatDate(record.checkIn, 'HH:mm')}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record?.checkOut ? (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              {formatDate(record.checkOut, 'HH:mm')}
                            </div>
                          ) : record?.checkIn ? (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              يعمل الآن
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record?.workHours ? (
                            `${record.workHours.toFixed(1)} ساعة`
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record ? getStatusBadge(record.status) : (
                            <Badge className="bg-red-100 text-red-800">غائب</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {record?.notes || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                التقرير الشهري - {getMonthYear(selectedDate)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الموظف</TableHead>
                    <TableHead className="text-right">أيام الحضور</TableHead>
                    <TableHead className="text-right">أيام التأخير</TableHead>
                    <TableHead className="text-right">إجمالي ساعات العمل</TableHead>
                    <TableHead className="text-right">معدل الحضور</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => {
                    const stats = getEmployeeMonthStats(user.id);
                    const daysInMonth = new Date(
                      selectedDate.getFullYear(),
                      selectedDate.getMonth() + 1,
                      0
                    ).getDate();
                    const attendanceRate = ((stats.present / daysInMonth) * 100).toFixed(1);
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>{user.fullName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {stats.present} يوم
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {stats.late > 0 ? (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              {stats.late} مرة
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>{stats.totalHours.toFixed(1)} ساعة</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${attendanceRate}%` }}
                              />
                            </div>
                            <span className="text-sm">{attendanceRate}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
