
import { supabase } from '@/integrations/supabase/client';

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
    
    // In a real implementation, here you would send an actual email via API
    console.log(`✉️ Email notification would be sent to ${emailSettings.email}`);
    console.log(`Subject: New Appointment Created`);
    console.log(`Body: Your appointment "${appointmentTitle}" has been scheduled for ${appointmentDateTime}`);
    
    // In a full implementation, you would call an edge function to send the email
    // For example:
    // await supabase.functions.invoke('send-email', {
    //   body: {
    //     recipient: emailSettings.email,
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
    
    // In a real implementation, here you would send an actual email via API
    console.log(`✉️ Email notification would be sent to ${emailSettings.email}`);
    console.log(`Subject: Notification Settings Updated`);
    console.log(`Body: Your notification settings have been updated. If you did not make this change, please contact support.`);
    
    // In a full implementation, you would call an edge function to send the email
    
    return true;
  } catch (error) {
    console.error("Failed to send settings change notification:", error);
    return false;
  }
};
