
import { supabase } from '@/integrations/supabase/client';
import { AppointmentWithParticipants } from '@/hooks/useAppointments';

interface UserAttendanceRecord {
  userId: string;
  totalAppointments: number;
  missedAppointments: number;
  noShowProbability: number;
}

// No-Show Prediction utility
export const predictNoShow = async (userId: string): Promise<number> => {
  try {
    // For now, we'll use a simple algorithm based on historical attendance
    // In a real-world app, this could be a more sophisticated machine learning model
    
    // Get user's past appointments
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });
      
    if (error || !appointments || appointments.length === 0) {
      return 0.1; // Default 10% chance if no history
    }
    
    // For this MVP, we'll assume a random 10-30% chance of no-show
    // In a real app, this would analyze attendance patterns
    const randomFactor = Math.random() * 0.2 + 0.1; 
    
    // Store this prediction in audit logs for future model training
    await supabase
      .from('audit_logs')
      .insert({
        action: 'no_show_prediction',
        table_name: 'appointments',
        user_id: userId,
        details: { prediction: randomFactor }
      });
      
    return randomFactor;
  } catch (error) {
    console.error("Error predicting no-show:", error);
    return 0.1; // Default on error
  }
};

// Meeting Duration Estimation utility
export const estimateMeetingDuration = async (
  userId: string, 
  title: string, 
  description: string | null
): Promise<number> => {
  try {
    // Get user's past similar meetings
    const { data: pastMeetings, error } = await supabase
      .from('appointments')
      .select('title, description, start_time, end_time')
      .eq('user_id', userId);
      
    if (error || !pastMeetings || pastMeetings.length === 0) {
      return 60; // Default 60 minutes if no history
    }
    
    // Find similar meetings by title keywords
    const titleWords = title.toLowerCase().split(' ')
      .filter(word => word.length > 3); // Only consider meaningful words
    
    const similarMeetings = pastMeetings.filter(meeting => {
      const meetingTitle = meeting.title.toLowerCase();
      return titleWords.some(word => meetingTitle.includes(word));
    });
    
    // If we found similar meetings, calculate average duration
    if (similarMeetings.length > 0) {
      const durations = similarMeetings.map(meeting => {
        const start = new Date(meeting.start_time).getTime();
        const end = new Date(meeting.end_time).getTime();
        return (end - start) / (1000 * 60); // Convert to minutes
      });
      
      const avgDuration = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
      
      // Round to nearest 15 minutes
      return Math.round(avgDuration / 15) * 15;
    }
    
    // If no similar meetings, return default based on description length
    if (description) {
      const wordCount = description.split(' ').length;
      if (wordCount > 100) return 60; // Long description = 1 hour
      if (wordCount > 50) return 45;  // Medium description = 45 minutes
      return 30; // Short description = 30 minutes
    }
    
    return 30; // Default 30 minutes
  } catch (error) {
    console.error("Error estimating meeting duration:", error);
    return 30; // Default on error
  }
};

// Find alternative times for rescheduling
export const findAlternativeSlots = async (
  appointment: AppointmentWithParticipants,
  numberOfSlots: number = 3
): Promise<{start: Date, end: Date}[]> => {
  try {
    const startDate = new Date(appointment.start_time);
    const endDate = new Date(appointment.end_time);
    const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60); // in minutes
    
    // Get existing appointments for the user
    const { data: existingAppointments, error } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('user_id', appointment.user_id)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });
      
    if (error) {
      console.error("Error fetching existing appointments:", error);
      return generateDefaultSlots(duration, numberOfSlots);
    }
    
    // Find free slots in the next 7 days
    const slots: {start: Date, end: Date}[] = [];
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    // Convert existing appointments to non-available time ranges
    const busySlots = existingAppointments?.map(apt => ({
      start: new Date(apt.start_time),
      end: new Date(apt.end_time)
    })) || [];
    
    // Start with work hours (9 AM - 5 PM) for the next 7 days
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + day);
      
      // Skip weekends
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;
      
      // Try morning and afternoon slots
      const possibleStartTimes = [9, 11, 13, 15, 17]; // 9 AM, 11 AM, 1 PM, 3 PM, 5 PM
      
      for (const hour of possibleStartTimes) {
        if (slots.length >= numberOfSlots) break;
        
        const potentialStart = new Date(currentDate.setHours(hour, 0, 0, 0));
        const potentialEnd = new Date(potentialStart.getTime() + duration * 60 * 1000);
        
        // Skip if in the past
        if (potentialStart <= now) continue;
        
        // Check if this slot conflicts with existing appointments
        const hasConflict = busySlots.some(busy => 
          (potentialStart >= busy.start && potentialStart < busy.end) || 
          (potentialEnd > busy.start && potentialEnd <= busy.end) ||
          (potentialStart <= busy.start && potentialEnd >= busy.end)
        );
        
        if (!hasConflict) {
          slots.push({
            start: potentialStart,
            end: potentialEnd
          });
        }
      }
    }
    
    return slots.length > 0 ? slots : generateDefaultSlots(duration, numberOfSlots);
  } catch (error) {
    console.error("Error finding alternative slots:", error);
    return generateDefaultSlots(duration, numberOfSlots);
  }
};

// Generate default slots when no better option is available
const generateDefaultSlots = (
  durationMinutes: number, 
  numberOfSlots: number
): {start: Date, end: Date}[] => {
  const slots: {start: Date, end: Date}[] = [];
  const now = new Date();
  
  // Start tomorrow at 9 AM
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);
  startDate.setHours(9, 0, 0, 0);
  
  for (let i = 0; i < numberOfSlots; i++) {
    const start = new Date(startDate);
    start.setHours(start.getHours() + (i * 2)); // Each slot 2 hours apart
    
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + durationMinutes);
    
    slots.push({ start, end });
  }
  
  return slots;
};
