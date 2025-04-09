
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { BellRing, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const NotificationSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    pushEnabled: true,
    reminderMinutes: 15,
    pushToken: null as string | null
  });

  useEffect(() => {
    if (user) {
      fetchNotificationSettings();
    }
  }, [user]);

  const fetchNotificationSettings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw error;
      }
      
      if (data) {
        setSettings({
          pushEnabled: data.push_enabled,
          reminderMinutes: data.reminder_minutes,
          pushToken: data.push_token
        });
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
  
  const saveSettings = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      const { data, error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          push_enabled: settings.pushEnabled,
          push_token: settings.pushToken,
          reminder_minutes: settings.reminderMinutes
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Notification settings saved",
      });
      
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
          <div className="space-y-6">
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
