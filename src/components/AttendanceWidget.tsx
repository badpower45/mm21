import { useState, useEffect } from 'react';
import { User, Attendance } from '../types';
import { checkIn, checkOut, getAttendance } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Clock, LogIn, LogOut, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { formatDate, formatTime } from '../lib/dateUtils';

interface AttendanceWidgetProps {
  user: User;
}

export default function AttendanceWidget({ user }: AttendanceWidgetProps) {
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadTodayAttendance();
    
    // Update time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadTodayAttendance = async () => {
    try {
      const today = formatDate(new Date(), 'yyyy-MM-dd');
      const attendance = await getAttendance(today, user.id);
      
      if (attendance.length > 0) {
        setTodayAttendance(attendance[0]);
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const record = await checkIn(user.id, user.fullName);
      setTodayAttendance(record);
      toast.success('تم تسجيل الحضور بنجاح');
    } catch (error: any) {
      console.error('Error checking in:', error);
      toast.error(error.message || 'فشل تسجيل الحضور');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const record = await checkOut(user.id);
      setTodayAttendance(record);
      toast.success('تم تسجيل الانصراف بنجاح');
    } catch (error: any) {
      console.error('Error checking out:', error);
      toast.error(error.message || 'فشل تسجيل الانصراف');
    } finally {
      setLoading(false);
    }
  };

  const getWorkDuration = () => {
    if (!todayAttendance?.checkIn) return '0:00:00';
    
    const checkInTime = new Date(todayAttendance.checkIn);
    const endTime = todayAttendance.checkOut ? new Date(todayAttendance.checkOut) : currentTime;
    
    const diff = endTime.getTime() - checkInTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="mb-6" dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          الحضور والانصراف
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Time */}
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">الوقت الحالي:</span>
            <span className="text-2xl font-mono">{formatTime(currentTime)}</span>
          </div>

          {/* Attendance Status */}
          {todayAttendance ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">تسجيل الحضور:</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-mono">{formatTime(todayAttendance.checkIn)}</span>
                </div>
              </div>

              {todayAttendance.checkOut ? (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">تسجيل الانصراف:</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="font-mono">{formatTime(todayAttendance.checkOut)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">ساعات العمل:</span>
                  <Badge className="bg-green-100 text-green-800 font-mono text-lg px-4">
                    {getWorkDuration()}
                  </Badge>
                </div>
              )}

              {todayAttendance.workHours && (
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-800 font-medium">إجمالي ساعات اليوم:</span>
                  <span className="text-blue-800 font-bold">{todayAttendance.workHours.toFixed(2)} ساعة</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              لم يتم تسجيل الحضور اليوم
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!todayAttendance ? (
              <Button
                onClick={handleCheckIn}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <LogIn className="ml-2 h-4 w-4" />
                تسجيل حضور
              </Button>
            ) : !todayAttendance.checkOut ? (
              <Button
                onClick={handleCheckOut}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <LogOut className="ml-2 h-4 w-4" />
                تسجيل انصراف
              </Button>
            ) : (
              <div className="flex-1 p-3 bg-gray-100 rounded-lg text-center text-gray-600">
                تم إنهاء يوم العمل ✓
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
