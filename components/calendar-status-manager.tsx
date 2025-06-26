"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/lib/types/calendar";
import { getCalendarByDateRange, upsertCalendarEntry } from "@/lib/supabase/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Loader2, Check } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { ko } from "date-fns/locale";

export default function CalendarStatusManager() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [calendarData, setCalendarData] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        
        const data = await getCalendarByDateRange(
          format(start, 'yyyy-MM-dd'),
          format(end, 'yyyy-MM-dd')
        );
        
        setCalendarData(data);
      } catch (error) {
        console.error('Failed to load calendar data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [currentMonth]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      const data = await getCalendarByDateRange(
        format(start, 'yyyy-MM-dd'),
        format(end, 'yyyy-MM-dd')
      );
      
      setCalendarData(data);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (date: Date, status: 'claimed' | 'unclaimed') => {
    try {
      setSaving(true);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      await upsertCalendarEntry(dateStr, status);
      
      // Reload calendar data
      await loadCalendarData();
    } catch (error) {
      console.error('Failed to update calendar status:', error);
    } finally {
      setSaving(false);
    }
  };

  const getDateStatus = (date: Date): 'claimed' | 'unclaimed' | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const entry = calendarData.find(c => c.date === dateStr);
    return entry?.status || null;
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  // Get the first day of the month's day of week (0 = Sunday)
  const firstDayOfWeek = days[0].getDay();
  
  // Create empty cells for days before the first day of the month
  const emptyCells = Array(firstDayOfWeek).fill(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          날짜별 상태 관리
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeMonth('prev')}
          >
            이전 달
          </Button>
          <h3 className="text-lg font-medium">
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeMonth('next')}
          >
            다음 달
          </Button>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            {/* Day of week headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {emptyCells.map((_, index) => (
                <div key={`empty-${index}`} className="p-2" />
              ))}
              
              {days.map((date) => {
                const status = getDateStatus(date);
                const isSelected = isSameDay(date, selectedDate);
                const isTodayDate = isToday(date);
                
                return (
                  <div
                    key={date.toISOString()}
                    className={`
                      p-2 border rounded-lg cursor-pointer transition-all
                      ${isSelected ? 'ring-2 ring-primary' : ''}
                      ${isTodayDate ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700' : 'border-gray-200 dark:border-gray-700'}
                      ${status === 'claimed' ? 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700' : ''}
                      hover:shadow-md dark:hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600
                    `}
                    onClick={() => setSelectedDate(date)}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <div className="text-sm font-medium">{format(date, 'd')}</div>
                      {(status && status == 'claimed') && (
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Selected Date Actions */}
        {selectedDate && (
          <div className="mt-6 p-4 border rounded-lg bg-muted/50 dark:bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">선택된 날짜</h4>
                <p className="text-sm text-muted-foreground">
                  {format(selectedDate, 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={getDateStatus(selectedDate) === 'claimed' ? 'default' : 'outline'}
                  onClick={() => handleStatusChange(selectedDate, 'claimed')}
                  disabled={saving}
                >
                  {saving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                  예약 됨
                </Button>
                <Button
                  size="sm"
                  variant={getDateStatus(selectedDate) === 'unclaimed' ? 'destructive' : 'outline'}
                  onClick={() => handleStatusChange(selectedDate, 'unclaimed')}
                  disabled={saving}
                >
                  {saving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                  예약 안됨
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-700 rounded" />
            <span>예약 됨</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-50 dark:bg-blue-950 border border-blue-300 dark:border-blue-700 rounded" />
            <span>오늘</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}