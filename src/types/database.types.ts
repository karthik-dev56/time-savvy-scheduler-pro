
export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  priority: string;
  created_at: string;
  updated_at: string;
  is_multi_person: boolean;
}

export interface Participant {
  id: string;
  appointment_id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationSetting {
  id: string;
  user_id: string;
  push_enabled: boolean;
  push_token: string | null;
  reminder_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface EmailNotificationSetting {
  id: string;
  user_id: string;
  email: string;
  notify_on_appointment: boolean;
  notify_on_settings_change: boolean;
  created_at: string;
  updated_at: string;
}
