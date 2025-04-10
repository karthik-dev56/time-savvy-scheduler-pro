import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { X, Plus, UserPlus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import type { Appointment } from '@/types/database.types';
import { sendAppointmentNotification } from '@/utils/notificationUtils';

interface NewAppointmentProps {
  onTitleChange?: (newTitle: string) => void;
  onDescriptionChange?: (newDescription: string) => void;
  onParticipantsChange?: (newParticipantIds: string[]) => void;
  onTimeChange?: (startTime: string, endTime: string) => void;
}

const NewAppointment = ({
  onTitleChange,
  onDescriptionChange,
  onParticipantsChange,
  onTimeChange
}: NewAppointmentProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    priority: 'normal',
    isMultiPerson: false,
  });
  const [participants, setParticipants] = useState<{email: string, id?: string}[]>([]);
  const [newParticipantEmail, setNewParticipantEmail] = useState('');
  const [availableUsers, setAvailableUsers] = useState<{email: string, id: string}[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (formData.isMultiPerson) {
      fetchAvailableUsers();
    }
  }, [formData.isMultiPerson]);

  const fetchAvailableUsers = async () => {
    if (!user) return;
    
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email:id');
        
      if (error) throw error;
      
      const usersData = data.map(profile => ({
        id: profile.id,
        email: `user-${profile.id.substring(0, 8)}@example.com`
      })).filter(u => u.id !== user.id);
      
      setAvailableUsers(usersData);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load available users",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'title' && onTitleChange) {
      onTitleChange(value);
    } else if (name === 'description' && onDescriptionChange) {
      onDescriptionChange(value);
    }

    if ((name === 'startTime' || name === 'endTime') && onTimeChange && formData.date && formData.startTime && formData.endTime) {
      const startTime = name === 'startTime' ? value : formData.startTime;
      const endTime = name === 'endTime' ? value : formData.endTime;
      if (startTime && endTime) {
        const startDateTime = new Date(`${formData.date}T${startTime}`).toISOString();
        const endDateTime = new Date(`${formData.date}T${endTime}`).toISOString();
        onTimeChange(startDateTime, endDateTime);
      }
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, priority: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isMultiPerson: checked }));
  };

  const addParticipant = () => {
    if (!newParticipantEmail.trim()) return;
    
    if (participants.some(p => p.email === newParticipantEmail)) {
      toast({
        title: "Warning",
        description: "This participant is already added",
        variant: "destructive",
      });
      return;
    }

    const matchingUser = availableUsers.find(u => u.email === newParticipantEmail);
    
    setParticipants([...participants, {
      email: newParticipantEmail,
      id: matchingUser?.id
    }]);
    setNewParticipantEmail('');
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));

    if (onParticipantsChange) {
      const participantIds = participants
        .filter((_, i) => i !== index)
        .filter(p => p.id)
        .map(p => p.id as string);
      onParticipantsChange(participantIds);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create appointments",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`).toISOString();
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`).toISOString();

      if (new Date(endDateTime) <= new Date(startDateTime)) {
        throw new Error("End time must be after start time");
      }

      const appointment = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        start_time: startDateTime,
        end_time: endDateTime,
        priority: formData.priority,
        is_multi_person: formData.isMultiPerson
      };

      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .insert(appointment)
        .select('id')
        .single();

      if (appointmentError) throw appointmentError;

      if (formData.isMultiPerson && participants.length > 0 && appointmentData) {
        const participantsWithIds = participants.filter(p => p.id);
        
        if (participantsWithIds.length > 0) {
          const participantsToInsert = participantsWithIds.map(p => ({
            appointment_id: appointmentData.id,
            user_id: p.id as string,
            status: 'pending'
          }));

          const { error: participantsError } = await supabase
            .from('participants')
            .insert(participantsToInsert);

          if (participantsError) {
            console.error("Error adding participants:", participantsError);
            toast({
              title: "Warning",
              description: "Appointment created but there was an error adding some participants",
              variant: "destructive",
            });
          }
        }
      }

      if (appointmentData) {
        const formattedDateTime = new Date(startDateTime).toLocaleString();
        await sendAppointmentNotification(user.id, formData.title, formattedDateTime);
      }

      toast({
        title: "Success",
        description: "Appointment created successfully and email notification sent",
      });

      setFormData({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        priority: 'normal',
        isMultiPerson: false,
      });
      setParticipants([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create appointment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Appointment title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Add details about this appointment"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={handleSelectChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isMultiPerson" 
              checked={formData.isMultiPerson}
              onCheckedChange={handleCheckboxChange}
            />
            <Label htmlFor="isMultiPerson">Multi-person meeting</Label>
          </div>

          {formData.isMultiPerson && (
            <div className="space-y-4">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <Label htmlFor="participant">Add Participant</Label>
                  <Input
                    id="participant"
                    value={newParticipantEmail}
                    onChange={(e) => setNewParticipantEmail(e.target.value)}
                    placeholder="Participant email"
                  />
                </div>
                <Button type="button" onClick={addParticipant} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>

              {participants.length > 0 && (
                <div className="border rounded-md p-3 space-y-2">
                  <Label>Participants</Label>
                  {participants.map((participant, index) => (
                    <div key={index} className="flex items-center justify-between bg-secondary/30 rounded-md p-2">
                      <div className="flex items-center">
                        <UserPlus className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{participant.email}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeParticipant(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Appointment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewAppointment;
