
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, Users, ChevronRight, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useAppointments } from '@/hooks/useAppointments';
import { formatRelative, format, parseISO, isToday, isTomorrow } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const { loading, getTodaysAppointments, getUpcomingAppointments } = useAppointments();
  
  const todayAppointments = getTodaysAppointments();
  const upcomingAppointments = getUpcomingAppointments(3);
  
  const formatAppointmentDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return formatRelative(date, new Date());
  };

  const formatAppointmentTime = (startStr: string, endStr: string) => {
    return `${format(parseISO(startStr), 'h:mm a')} - ${format(parseISO(endStr), 'h:mm a')}`;
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-l-4 border-red-500';
      case 'urgent': return 'bg-red-200 border-l-4 border-red-600';
      case 'low': return 'bg-blue-50 border-l-4 border-blue-400';
      default: return 'bg-gray-50 border-l-4 border-gray-400';
    }
  };

  const remainingAppointments = todayAppointments.filter(
    app => new Date(app.start_time) > new Date()
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{todayAppointments.length}</div>
                <p className="text-xs text-muted-foreground">
                  {remainingAppointments} remaining
                </p>
              </>
            )}
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full">
                View All
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Requires confirmation</p>
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full">
                Review
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Weekly Completion</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">12 completed, 2 missed</p>
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full">
                Analytics
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Appointments</CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="p-3 rounded-md flex justify-between items-center">
                    <Skeleton className="h-16 w-full" />
                  </div>
                ))
              ) : upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) => (
                  <div 
                    key={appointment.id} 
                    className={`p-3 rounded-md flex justify-between items-center ${getPriorityClass(appointment.priority)}`}
                  >
                    <div>
                      <h4 className="font-medium">{appointment.title}</h4>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3 w-3" />
                        <span>{formatAppointmentTime(appointment.start_time, appointment.end_time)}</span>
                        <span className="text-muted-foreground">• {formatAppointmentDate(appointment.start_time)}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-6">No upcoming appointments</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Smart Slot Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Based on your schedule and preferences, here are some recommended time slots for your next meeting:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {["Tomorrow, 9:00 AM - 10:00 AM", "Thursday, 2:00 PM - 3:00 PM", "Friday, 11:00 AM - 12:00 PM"].map((slot, i) => (
                <Button key={i} variant={i === 0 ? "default" : "outline"} className="justify-start">
                  <Clock className="mr-2 h-4 w-4" />
                  {slot}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
