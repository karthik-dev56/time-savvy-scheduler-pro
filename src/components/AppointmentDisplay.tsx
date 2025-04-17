
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Appointment } from '@/types/database.types';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelative } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AppointmentDisplay = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        toast({
          title: "Error",
          description: "Could not load appointments from Supabase",
          variant: "destructive",
        });
        return;
      }

      console.log('Supabase appointments:', data);
      setAppointments(data || []);
    } catch (error) {
      console.error('Exception during appointment fetch:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return formatRelative(date, new Date());
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Appointments from Supabase</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchAppointments}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.length > 0 ? (
                  appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">{appointment.title}</TableCell>
                      <TableCell>{appointment.description || "N/A"}</TableCell>
                      <TableCell>{formatDate(appointment.start_time)}</TableCell>
                      <TableCell>{formatDate(appointment.end_time)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-md text-xs ${
                          appointment.priority === 'high' ? 'bg-red-100 text-red-800' :
                          appointment.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {appointment.priority}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-32">
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-lg font-medium text-gray-500">No appointments found</p>
                        <p className="text-sm text-gray-400 mb-4">Appointments from Supabase will appear here</p>
                        <Button onClick={fetchAppointments} variant="outline">
                          Try Again
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AppointmentDisplay;
