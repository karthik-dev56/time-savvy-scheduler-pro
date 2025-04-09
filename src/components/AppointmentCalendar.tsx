
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfWeek, eachDayOfInterval, parseISO, isSameDay } from 'date-fns';
import { useAppointments } from '@/hooks/useAppointments';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

const AppointmentCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { appointments, loading } = useAppointments();
  const navigate = useNavigate();
  
  const weekStart = useMemo(() => 
    startOfWeek(currentDate, { weekStartsOn: 1 }), 
    [currentDate]
  );
  
  const weekDays = useMemo(() => 
    eachDayOfInterval({
      start: weekStart,
      end: addDays(weekStart, 6)
    }), 
    [weekStart]
  );

  // Time slots for the day
  const timeSlots = Array.from({ length: 12 }, (_, i) => i + 8); // 8AM to 7PM

  const prevWeek = () => {
    setCurrentDate(addDays(currentDate, -7));
  };

  const nextWeek = () => {
    setCurrentDate(addDays(currentDate, 7));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToNewAppointment = () => {
    navigate('/', { state: { activeTab: 'new' } });
  };

  const getAppointmentsForTimeAndDay = (time: number, day: Date) => {
    if (loading) return [];
    
    return appointments.filter(apt => {
      const aptDate = parseISO(apt.start_time);
      const aptHour = aptDate.getHours();
      return aptHour === time && isSameDay(aptDate, day);
    });
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'urgent': return 'bg-red-200 text-red-900';
      case 'low': return 'bg-blue-50 text-blue-800';
      default: return 'bg-gray-50 text-gray-800';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Calendar View</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {format(weekStart, 'MMMM d')} - {format(addDays(weekStart, 6), 'MMMM d, yyyy')}
          </span>
          <Button variant="outline" size="sm" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={goToToday}>
            <CalendarIcon className="h-4 w-4 mr-2" />
            Today
          </Button>
          <Button size="sm" onClick={goToNewAppointment}>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-primary/5 py-2">
          <div className="grid grid-cols-8 gap-2">
            <div className="text-center font-medium text-muted-foreground text-xs py-2"></div>
            {weekDays.map((day, i) => (
              <div key={i} className="text-center">
                <p className="text-xs text-muted-foreground">{format(day, 'EEE')}</p>
                <p className={`text-sm font-medium ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'text-primary' : ''}`}>{format(day, 'd')}</p>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-8 divide-x divide-y divide-border">
            {/* Time column */}
            <div className="divide-y divide-border">
              {timeSlots.map((time) => (
                <div key={time} className="h-24 px-2 py-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {time % 12 === 0 ? 12 : time % 12}:00 {time >= 12 ? 'PM' : 'AM'}
                  </span>
                </div>
              ))}
            </div>

            {/* Days columns */}
            {weekDays.map((day, dayIndex) => (
              <div key={dayIndex} className="divide-y divide-border">
                {timeSlots.map((time) => {
                  const dayAppointments = getAppointmentsForTimeAndDay(time, day);
                  return (
                    <div key={`${dayIndex}-${time}`} className="h-24 relative group">
                      {loading ? (
                        <Skeleton className="absolute top-1 left-1 right-1 h-[calc(100%-8px)]" />
                      ) : (
                        dayAppointments.map((apt) => (
                          <div 
                            key={apt.id}
                            className={`absolute top-0 left-0 right-0 mx-1 my-1 p-2 rounded-md cursor-pointer ${getPriorityClass(apt.priority)} opacity-90 hover:opacity-100 transition-opacity`}
                            style={{ height: 'calc(100% - 8px)' }}
                          >
                            <div className="text-xs font-medium truncate">{apt.title}</div>
                            <div className="text-xs opacity-80">
                              {format(parseISO(apt.start_time), 'h:mm a')} - {format(parseISO(apt.end_time), 'h:mm a')}
                            </div>
                          </div>
                        ))
                      )}
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentCalendar;
