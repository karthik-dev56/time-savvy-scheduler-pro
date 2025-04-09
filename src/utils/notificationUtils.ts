
import { supabase } from '@/integrations/supabase/client';
import { EmailNotificationSetting } from '@/types/database.types';

export const sendAppointmentNotification = async (userId: string, appointmentTitle: string, appointmentDateTime: string) => {
  try {
    // Check if user has email notifications enabled
    const { data: emailSettings, error: settingsError } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('notify_on_appointment', true)
      .single();
    
    if (settingsError || !emailSettings) {
      console.log("No email notifications enabled or settings not found");
      return;
    }
    
    // Type assertion to ensure TypeScript recognizes the shape
    const typedEmailSettings = emailSettings as unknown as EmailNotificationSetting;
    
    // Use the default email if specified, otherwise use the user's email setting
    const emailToUse = 'drete604@gmail.com';
    
    console.log(`✉️ Email notification would be sent to ${emailToUse}`);
    console.log(`Subject: New Appointment Created`);
    console.log(`Body: Your appointment "${appointmentTitle}" has been scheduled for ${appointmentDateTime}`);
    
    // In a full implementation, you would call an edge function to send the email
    // For example:
    // await supabase.functions.invoke('send-email', {
    //   body: {
    //     recipient: emailToUse,
    //     subject: 'New Appointment Created',
    //     message: `Your appointment "${appointmentTitle}" has been scheduled for ${appointmentDateTime}`
    //   }
    // });
    
    return true;
  } catch (error) {
    console.error("Failed to send appointment notification:", error);
    return false;
  }
};

export const sendSettingsChangeNotification = async (userId: string) => {
  try {
    // Check if user has settings change notifications enabled
    const { data: emailSettings, error: settingsError } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('notify_on_settings_change', true)
      .single();
    
    if (settingsError || !emailSettings) {
      console.log("No settings change notifications enabled or settings not found");
      return;
    }
    
    // Type assertion to ensure TypeScript recognizes the shape
    const typedEmailSettings = emailSettings as unknown as EmailNotificationSetting;
    
    // Use the default email
    const emailToUse = 'drete604@gmail.com';
    
    console.log(`✉️ Email notification would be sent to ${emailToUse}`);
    console.log(`Subject: Notification Settings Updated`);
    console.log(`Body: Your notification settings have been updated. If you did not make this change, please contact support.`);
    
    // In a full implementation, you would call an edge function to send the email
    
    return true;
  } catch (error) {
    console.error("Failed to send settings change notification:", error);
    return false;
  }
};

// Send appointment reminders based on reminder time
export const sendAppointmentReminder = async (appointmentId: string) => {
  try {
    // Get the appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();
    
    if (appointmentError || !appointment) {
      console.error("Appointment not found:", appointmentError);
      return false;
    }
    
    // Get the user's notification settings
    const { data: notificationSettings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', appointment.user_id)
      .single();
    
    if (settingsError || !notificationSettings || !notificationSettings.push_enabled) {
      console.log("No notification settings found or notifications disabled");
      return false;
    }
    
    // Format the appointment time for the email
    const appointmentDateTime = new Date(appointment.start_time).toLocaleString();
    const reminderMinutes = notificationSettings.reminder_minutes;
    
    // Use the default email
    const emailToUse = 'drete604@gmail.com';
    
    console.log(`✉️ Reminder email would be sent to ${emailToUse}`);
    console.log(`Subject: Reminder: Upcoming Appointment`);
    console.log(`Body: Reminder: Your appointment "${appointment.title}" is coming up in ${reminderMinutes} minutes (${appointmentDateTime}).`);
    
    // In a full implementation with edge function, the code would look like:
    // await supabase.functions.invoke('send-email', {
    //   body: {
    //     recipient: emailToUse,
    //     subject: `Reminder: Upcoming Appointment`,
    //     message: `Reminder: Your appointment "${appointment.title}" is coming up in ${reminderMinutes} minutes (${appointmentDateTime}).`
    //   }
    // });
    
    return true;
  } catch (error) {
    console.error("Failed to send appointment reminder:", error);
    return false;
  }
};

// Function to check for upcoming appointments and send reminders
export const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('push_enabled', true);
    
    if (settingsError || !settings || settings.length === 0) {
      console.log("No notification settings found or no users with notifications enabled");
      return;
    }
    
    // Process each user's notification settings
    for (const userSetting of settings) {
      const reminderMinutes = userSetting.reminder_minutes;
      const reminderTime = new Date(now.getTime() + reminderMinutes * 60 * 1000);
      
      // Find appointments that should trigger a reminder now
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userSetting.user_id)
        .gte('start_time', now.toISOString())
        .lte('start_time', reminderTime.toISOString());
      
      if (appointmentsError) {
        console.error("Error fetching appointments for reminders:", appointmentsError);
        continue;
      }
      
      if (appointments && appointments.length > 0) {
        for (const appointment of appointments) {
          await sendAppointmentReminder(appointment.id);
        }
      }
    }
    
    console.log("Checked for reminders at:", now.toISOString());
    return true;
  } catch (error) {
    console.error("Failed to check and send reminders:", error);
    return false;
  }
};
