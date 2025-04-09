
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfWeek, eachDayOfInterval } from 'date-fns';

const AppointmentCalendar = () => {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6)
  });

  // Mock appointment data
  const appointments = [
    { id: 1, title: "Team Meeting", start: "09:00", end: "10:00", priority: "high", day: 1 },
    { id: 2, title: "Client Call", start: "11:00", end: "12:00", priority: "medium", day: 1 },
    { id: 3, title: "Lunch Break", start: "12:30", end: "13:30", priority: "low", day: 1 },
    { id: 4, title: "Project Review", start: "14:00", end: "15:00", priority: "medium", day: 2 },
    { id: 5, title: "Strategy Session", start: "10:00", end: "11:30", priority: "high", day: 3 },
    { id: 6, title: "Weekly Report", start: "16:00", end: "17:00", priority: "low", day: 4 },
  ];

  // Time slots for the day
  const timeSlots = Array.from({ length: 12 }, (_, i) => i + 8); // 8AM to 7PM

  const prevWeek = () => {
    setCurrentDate(addDays(currentDate, -7));
  };

  const nextWeek = () => {
    setCurrentDate(addDays(currentDate, 7));
  };

  const getAppointmentsForTimeAndDay = (time: number, day: number) => {
    return appointments.filter(apt => {
      const aptStart = parseInt(apt.start.split(':')[0]);
      return aptStart === time && apt.day === day;
    });
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
          <Button size="sm">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Today
          </Button>
          <Button size="sm">
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
            {Array.from({ length: 7 }, (_, dayIndex) => (
              <div key={dayIndex} className="divide-y divide-border">
                {timeSlots.map((time) => {
                  const dayAppointments = getAppointmentsForTimeAndDay(time, dayIndex + 1);
                  return (
                    <div key={`${dayIndex}-${time}`} className="h-24 relative group">
                      {dayAppointments.map((apt) => (
                        <div 
                          key={apt.id}
                          className={`absolute top-0 left-0 right-0 mx-1 my-1 p-2 rounded-md cursor-pointer priority-${apt.priority} opacity-90 hover:opacity-100 transition-opacity`}
                          style={{ height: 'calc(100% - 8px)' }}
                        >
                          <div className="text-xs font-medium truncate">{apt.title}</div>
                          <div className="text-xs opacity-80">{apt.start} - {apt.end}</div>
                        </div>
                      ))}
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
