
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, Users, ChevronRight, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

const Dashboard = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  // Mock upcoming appointments
  const upcomingAppointments = [
    { id: 1, title: "Team Meeting", time: "10:00 AM - 11:00 AM", date: "Today", priority: "high" },
    { id: 2, title: "Client Presentation", time: "2:00 PM - 3:00 PM", date: "Today", priority: "medium" },
    { id: 3, title: "Weekly Review", time: "9:30 AM - 10:30 AM", date: "Tomorrow", priority: "low" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">3 remaining</p>
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
              {upcomingAppointments.map((appointment) => (
                <div 
                  key={appointment.id} 
                  className={`p-3 rounded-md flex justify-between items-center priority-${appointment.priority}`}
                >
                  <div>
                    <h4 className="font-medium">{appointment.title}</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-3 w-3" />
                      <span>{appointment.time}</span>
                      <span className="text-muted-foreground">• {appointment.date}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
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
