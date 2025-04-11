
import { useState, useEffect } from 'react';
import { supabase, debugAppointments } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { checkAndSendReminders } from '@/utils/notificationUtils';
import type { Appointment, Participant } from '@/types/database.types';

export interface ParticipantInfo extends Participant {
  email?: string;
}

export interface AppointmentWithParticipants extends Appointment {
  participants?: ParticipantInfo[];
}

export function useAppointments() {
  const [appointments, setAppointments] = useState<AppointmentWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAppointments = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log("Fetching appointments for user:", user.id);
      
      // Get current user's appointments
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)  // Filter to only show current user's appointments
        .order('start_time', { ascending: true });

      if (error) {
        console.error("Error in initial appointment fetch:", error);
        throw error;
      }
      
      console.log("Fetched appointments:", data?.length || 0, "appointments");
      
      // Debug appointments to console for troubleshooting
      await debugAppointments();
      
      // Fetch participants for multi-person meetings
      const multiPersonAppointments = data?.filter(apt => apt.is_multi_person) || [];
      
      if (multiPersonAppointments.length > 0) {
        const appointmentIds = multiPersonAppointments.map(apt => apt.id);
        
        const { data: participantsData, error: participantsError } = await supabase
          .from('participants')
          .select('*')
          .in('appointment_id', appointmentIds);
          
        if (participantsError) {
          console.error("Error fetching participants:", participantsError);
        } else {
          console.log("Fetched participants:", participantsData?.length || 0, "participants");
          
          // Group participants by appointment_id
          const participantsByAppointment: Record<string, ParticipantInfo[]> = {};
          
          participantsData?.forEach(participant => {
            if (!participantsByAppointment[participant.appointment_id]) {
              participantsByAppointment[participant.appointment_id] = [];
            }
            participantsByAppointment[participant.appointment_id].push(participant as ParticipantInfo);
          });
          
          // Add participants to their respective appointments
          const appointmentsWithParticipants = data.map(appointment => {
            if (participantsByAppointment[appointment.id]) {
              return {
                ...appointment,
                participants: participantsByAppointment[appointment.id]
              };
            }
            return appointment;
          });
          
          setAppointments(appointmentsWithParticipants);
          // Check for reminders that need to be sent via webhook
          checkAndSendReminders();
          setLoading(false);
          return;
        }
      }
      
      setAppointments(data || []);
      // Check for reminders that need to be sent via webhook
      checkAndSendReminders();
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "Could not load appointments. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    console.log("Setting up realtime subscription for appointments");
    const channel = supabase
      .channel('appointments-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'appointments',
          filter: `user_id=eq.${user.id}`  // Filter to only get updates for current user's appointments
        }, 
        (payload) => {
          console.log("Received realtime update for appointments:", payload);
          fetchAppointments();
        }
      )
      .subscribe();
    
    return () => {
      console.log("Removing appointments channel subscription");
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    console.log("Setting up realtime subscription for participants");
    const channel = supabase
      .channel('participants-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'participants' 
        }, 
        (payload) => {
          console.log("Received realtime update for participants:", payload);
          fetchAppointments();
        }
      )
      .subscribe();
    
    return () => {
      console.log("Removing participants channel subscription");
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getTodaysAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.start_time);
      return appointmentDate >= today && appointmentDate < tomorrow;
    });
  };

  const getUpcomingAppointments = (count = 5) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return appointments
      .filter(appointment => new Date(appointment.start_time) >= today)
      .slice(0, count);
  };

  return {
    appointments,
    loading,
    fetchAppointments,
    getTodaysAppointments,
    getUpcomingAppointments
  };
}
