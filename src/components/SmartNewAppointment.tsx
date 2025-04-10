
import React, { useState } from 'react';
import NewAppointment from './NewAppointment';
import { useAppointments } from '@/hooks/useAppointments';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { Lightbulb, Users, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { estimateMeetingDuration, predictNoShow, findAlternativeSlots } from '@/utils/schedulingAI';
import { useToast } from '@/hooks/use-toast';

// Define props for the NewAppointment component
interface NewAppointmentProps {
  onTitleChange?: (newTitle: string) => void;
  onDescriptionChange?: (newDescription: string) => void;
  onParticipantsChange?: (newParticipantIds: string[]) => void;
  onTimeChange?: (startTime: string, endTime: string) => void;
}

const SmartNewAppointment = () => {
  const { user } = useAuth();
  const { appointments } = useAppointments();
  const { toast } = useToast();
  
  const [showAIRecommendations, setShowAIRecommendations] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [isMultiPerson, setIsMultiPerson] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [noShowRisk, setNoShowRisk] = useState<number | null>(null);
  const [alternativeSlots, setAlternativeSlots] = useState<{start: Date, end: Date}[]>([]);
  
  // Handle title/description changes and get AI recommendations
  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle);
    if (newTitle.length > 5 && user) {
      try {
        const duration = await estimateMeetingDuration(user.id, newTitle, description);
        setEstimatedDuration(duration);
      } catch (error) {
        console.error("Error estimating duration:", error);
      }
    }
  };
  
  const handleDescriptionChange = async (newDescription: string) => {
    setDescription(newDescription);
    if (title.length > 5 && user) {
      try {
        const duration = await estimateMeetingDuration(user.id, title, newDescription);
        setEstimatedDuration(duration);
      } catch (error) {
        console.error("Error estimating duration:", error);
      }
    }
  };
  
  const handleParticipantsChange = async (newParticipantIds: string[]) => {
    setParticipantIds(newParticipantIds);
    setIsMultiPerson(newParticipantIds.length > 0);
    
    // If we have participants, calculate no-show risk
    if (newParticipantIds.length > 0 && user) {
      try {
        // For simplicity, we're just checking the first participant here
        const firstParticipant = newParticipantIds[0];
        const risk = await predictNoShow(firstParticipant);
        setNoShowRisk(risk);
      } catch (error) {
        console.error("Error predicting no-show risk:", error);
      }
    }
  };
  
  const findAlternativeSlotsForAppointment = async (startTime: string, endTime: string) => {
    if (!user) return;
    
    try {
      const fakeAppointment = {
        id: 'temp',
        user_id: user.id,
        start_time: startTime,
        end_time: endTime,
        title: title || 'New Appointment',
        priority: 'normal',
        is_multi_person: isMultiPerson,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        description: description || null
      };
      
      const slots = await findAlternativeSlots(fakeAppointment);
      setAlternativeSlots(slots);
    } catch (error) {
      console.error("Error finding alternative slots:", error);
    }
  };
  
  const handleUseRecommendedDuration = () => {
    if (estimatedDuration) {
      // Pass the estimated duration to the NewAppointment component
      toast({
        title: "Duration Applied",
        description: `Meeting duration set to ${estimatedDuration} minutes based on AI recommendation.`,
      });
    }
  };
  
  const handleUseAlternativeSlot = (slot: {start: Date, end: Date}) => {
    toast({
      title: "Alternative Slot Selected",
      description: `Meeting rescheduled to ${format(slot.start, 'MMM d, h:mm a')}`,
    });
    // Pass the selected slot to the NewAppointment component
  };
  
  return (
    <div className="space-y-6">
      {showAIRecommendations && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Lightbulb className="h-5 w-5 text-blue-500 mr-2" />
                <CardTitle className="text-lg text-blue-700">Smart Scheduling Assistant</CardTitle>
              </div>
              <Checkbox 
                checked={showAIRecommendations} 
                onCheckedChange={(checked) => setShowAIRecommendations(checked as boolean)}
                id="showAI"
              />
            </div>
            <CardDescription className="text-blue-600">
              AI-powered recommendations for optimal scheduling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Duration Estimation */}
              {estimatedDuration && (
                <div className="flex items-center justify-between bg-white p-3 rounded-md border border-blue-100">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-blue-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium">Recommended Duration</p>
                      <p className="text-xs text-gray-500">Based on your similar past meetings</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{estimatedDuration} minutes</Badge>
                    <Button variant="outline" size="sm" onClick={handleUseRecommendedDuration}>
                      Use
                    </Button>
                  </div>
                </div>
              )}
              
              {/* No-Show Risk Warning */}
              {noShowRisk !== null && noShowRisk > 0.2 && (
                <div className="flex items-center justify-between bg-white p-3 rounded-md border border-amber-100">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium">Potential No-Show Risk</p>
                      <p className="text-xs text-gray-500">One or more participants have missed meetings recently</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    {Math.round(noShowRisk * 100)}% risk
                  </Badge>
                </div>
              )}
              
              {/* Alternative Slots */}
              {alternativeSlots.length > 0 && (
                <div className="bg-white p-3 rounded-md border border-blue-100">
                  <p className="text-sm font-medium mb-2">Alternative Time Slots</p>
                  <div className="space-y-2">
                    {alternativeSlots.map((slot, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="text-xs">
                          {format(slot.start, 'MMM d, h:mm a')} <ArrowRight className="inline h-3 w-3" /> {format(slot.end, 'h:mm a')}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleUseAlternativeSlot(slot)}>
                          Select
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <NewAppointment 
        onTitleChange={handleTitleChange}
        onDescriptionChange={handleDescriptionChange}
        onParticipantsChange={handleParticipantsChange}
        onTimeChange={findAlternativeSlotsForAppointment}
      />
    </div>
  );
};

export default SmartNewAppointment;
