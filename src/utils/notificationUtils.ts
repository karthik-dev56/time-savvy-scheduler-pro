
import { supabase } from '@/integrations/supabase/client';
import { EmailNotificationSetting } from '@/types/database.types';
import emailjs from 'emailjs-com';

// Initialize EmailJS with your User ID
// You would normally set this in your app initialization
// emailjs.init("YOUR_USER_ID");

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
    
    // Get user's email from email_notifications table instead of profiles
    const emailToUse = typedEmailSettings.email || 'drete604@gmail.com';
    
    // Send email using EmailJS
    const templateParams = {
      to_email: emailToUse,
      appointment_title: appointmentTitle,
      appointment_time: appointmentDateTime,
      subject: "New Appointment Created"
    };
    
    await emailjs.send(
      process.env.REACT_APP_EMAILJS_SERVICE_ID || 'default_service',
      process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'default_template',
      templateParams,
      process.env.REACT_APP_EMAILJS_USER_ID || 'default_user'
    );
    
    console.log(`✉️ Email notification sent to ${emailToUse}`);
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
    
    // Get user's email from email_notifications table instead of profiles
    const emailToUse = typedEmailSettings.email || 'drete604@gmail.com';
    
    // Send email using EmailJS
    const templateParams = {
      to_email: emailToUse,
      subject: "Notification Settings Updated",
      message: "Your notification settings have been updated. If you did not make this change, please contact support."
    };
    
    await emailjs.send(
      process.env.REACT_APP_EMAILJS_SERVICE_ID || 'default_service',
      process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'default_template',
      templateParams,
      process.env.REACT_APP_EMAILJS_USER_ID || 'default_user'
    );
    
    console.log(`✉️ Email notification sent to ${emailToUse}`);
    return true;
  } catch (error) {
    console.error("Failed to send settings change notification:", error);
    return false;
  }
};

// Send appointment reminders based on reminder time
export const sendAppointmentReminder = async (appointmentId: string) => {
  try {
    // Call the edge function to send reminder email
    const { data, error } = await supabase.functions.invoke('send-reminder-email', {
      body: { appointmentId }
    });
    
    if (error) {
      console.error("Failed to send appointment reminder via edge function:", error);
      return false;
    }
    
    console.log("Appointment reminder sent successfully via edge function:", data);
    return true;
  } catch (error) {
    console.error("Error in sendAppointmentReminder:", error);
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
