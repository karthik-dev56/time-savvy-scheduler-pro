import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { BellRing, BellOff, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { NotificationSetting } from '@/types/database.types';
import { sendSettingsChangeNotification } from '@/utils/notificationUtils';

interface EmailNotificationSetting {
  id: string;
  user_id: string;
  email: string;
  notify_on_appointment: boolean;
  notify_on_settings_change: boolean;
  created_at: string;
  updated_at: string;
}

const NotificationSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingId, setSettingId] = useState<string | null>(null);
  const [emailSettingId, setEmailSettingId] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    pushEnabled: true,
    reminderMinutes: 15,
    pushToken: null as string | null
  });
  const [emailSettings, setEmailSettings] = useState({
    email: '',
    notifyOnAppointment: true,
    notifyOnSettingsChange: true
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch push notification settings
      const { data: pushData, error: pushError } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (pushError && pushError.code !== 'PGRST116') {
        throw pushError;
      }
      
      if (pushData) {
        setSettingId(pushData.id);
        setSettings({
          pushEnabled: pushData.push_enabled,
          reminderMinutes: pushData.reminder_minutes,
          pushToken: pushData.push_token
        });
      }
      
      // Fetch email notification settings
      const { data: emailData, error: emailError } = await supabase
        .from('email_notifications')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (emailError && emailError.code !== 'PGRST116') {
        throw emailError;
      }
      
      if (emailData) {
        setEmailSettingId(emailData.id);
        setEmailSettings({
          email: emailData.email,
          notifyOnAppointment: emailData.notify_on_appointment,
          notifyOnSettingsChange: emailData.notify_on_settings_change
        });
      } else if (user.email) {
        // Default to user's email if no settings found
        setEmailSettings(prev => ({
          ...prev,
          email: user.email || ''
        }));
      }
    } catch (error: any) {
      console.error('Error fetching notification settings:', error);
      toast({
        title: "Error",
        description: "Could not load notification settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const mockRegisterForPushNotifications = async () => {
    // This would normally request permission and get a push token
    // For this demo, we'll just generate a mock token
    return `mock-push-token-${Date.now()}`;
  };

  const handleTogglePush = async (enabled: boolean) => {
    let newToken = settings.pushToken;
    
    if (enabled && !settings.pushToken) {
      try {
        newToken = await mockRegisterForPushNotifications();
      } catch (error) {
        toast({
          title: "Permission Denied",
          description: "Push notification permission was denied",
          variant: "destructive",
        });
        return;
      }
    }
    
    setSettings(prev => ({
      ...prev,
      pushEnabled: enabled,
      pushToken: enabled ? newToken : null
    }));
  };
  
  const handleReminderChange = (value: string) => {
    setSettings(prev => ({
      ...prev,
      reminderMinutes: parseInt(value)
    }));
  };

  const handleToggleEmailNotification = (type: 'appointment' | 'settings', enabled: boolean) => {
    setEmailSettings(prev => {
      if (type === 'appointment') {
        return { ...prev, notifyOnAppointment: enabled };
      } else {
        return { ...prev, notifyOnSettingsChange: enabled };
      }
    });
  };
  
  const saveSettings = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      // Save push notification settings
      const pushSettingData = {
        user_id: user.id,
        push_enabled: settings.pushEnabled,
        push_token: settings.pushToken,
        reminder_minutes: settings.reminderMinutes
      };
      
      if (settingId) {
        pushSettingData['id'] = settingId;
      }
      
      const { error: pushError } = await supabase
        .from('notification_settings')
        .upsert(pushSettingData);
      
      if (pushError) throw pushError;
      
      // Save email notification settings
      const emailSettingData = {
        user_id: user.id,
        email: emailSettings.email || user.email,
        notify_on_appointment: emailSettings.notifyOnAppointment,
        notify_on_settings_change: emailSettings.notifyOnSettingsChange
      };
      
      if (emailSettingId) {
        emailSettingData['id'] = emailSettingId;
      }
      
      const { error: emailError } = await supabase
        .from('email_notifications')
        .upsert(emailSettingData);
      
      if (emailError) throw emailError;
      
      // Send email notification about settings change if enabled
      if (emailSettings.notifyOnSettingsChange) {
        await sendSettingsChangeNotification(user.id);
      }
      
      toast({
        title: "Success",
        description: "Notification settings saved",
      });
      
      // Refresh settings after save
      fetchSettings();
      
    } catch (error: any) {
      console.error('Error saving notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Push Notifications</h3>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    Receive alerts about upcoming appointments
                  </div>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.pushEnabled}
                  onCheckedChange={handleTogglePush}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reminder-time">Reminder Time</Label>
                <Select 
                  value={settings.reminderMinutes.toString()} 
                  onValueChange={handleReminderChange}
                  disabled={!settings.pushEnabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select when to be reminded" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes before</SelectItem>
                    <SelectItem value="15">15 minutes before</SelectItem>
                    <SelectItem value="30">30 minutes before</SelectItem>
                    <SelectItem value="60">1 hour before</SelectItem>
                    <SelectItem value="120">2 hours before</SelectItem>
                    <SelectItem value="1440">1 day before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-medium">Email Notifications</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-new-appointment">New Appointment Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    Receive email when a new appointment is created
                  </div>
                </div>
                <Switch
                  id="email-new-appointment"
                  checked={emailSettings.notifyOnAppointment}
                  onCheckedChange={(checked) => handleToggleEmailNotification('appointment', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-settings-change">Settings Change Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    Receive email when notification settings are updated
                  </div>
                </div>
                <Switch
                  id="email-settings-change"
                  checked={emailSettings.notifyOnSettingsChange}
                  onCheckedChange={(checked) => handleToggleEmailNotification('settings', checked)}
                />
              </div>
              
              <div className="text-sm text-muted-foreground mt-2">
                Email notifications will be sent to: <strong>{emailSettings.email || user?.email || 'No email found'}</strong>
              </div>
            </div>
            
            <div className="pt-4">
              <Button 
                onClick={saveSettings} 
                className="w-full" 
                disabled={saving}
              >
                {settings.pushEnabled ? (
                  <BellRing className="mr-2 h-4 w-4" />
                ) : (
                  <BellOff className="mr-2 h-4 w-4" />
                )}
                {saving ? "Saving..." : "Save Notification Settings"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
