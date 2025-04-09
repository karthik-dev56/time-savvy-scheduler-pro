
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Calendar as CalendarIcon, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NewAppointment = () => {
  const [date, setDate] = React.useState<Date>();
  const [participants, setParticipants] = React.useState<string[]>([]);
  const [newParticipant, setNewParticipant] = React.useState("");

  const handleAddParticipant = () => {
    if (newParticipant.trim() !== "" && !participants.includes(newParticipant)) {
      setParticipants([...participants, newParticipant]);
      setNewParticipant("");
    }
  };

  const handleRemoveParticipant = (participant: string) => {
    setParticipants(participants.filter(p => p !== participant));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto animate-fade-in">
      <CardHeader>
        <CardTitle>Create New Appointment</CardTitle>
        <CardDescription>
          Schedule a new meeting with smart buffer time and priority settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Appointment Title</Label>
          <Input id="title" placeholder="Enter appointment title" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Time</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Start time" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                    <SelectItem key={hour} value={`${hour}:00`}>
                      {`${hour}:00`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="End time" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                    <SelectItem key={hour} value={`${hour}:00`}>
                      {`${hour}:00`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Priority Level</Label>
          <RadioGroup defaultValue="medium" className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="high" id="high" />
              <Label htmlFor="high" className="text-red-600 font-medium">High</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="medium" />
              <Label htmlFor="medium" className="text-amber-600 font-medium">Medium</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="low" id="low" />
              <Label htmlFor="low" className="text-blue-600 font-medium">Low</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>Buffer Time</Label>
          <Select defaultValue="15">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">No buffer</SelectItem>
              <SelectItem value="5">5 minutes</SelectItem>
              <SelectItem value="10">10 minutes</SelectItem>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Participants</Label>
          <div className="flex space-x-2">
            <Input 
              placeholder="Add participant email" 
              value={newParticipant}
              onChange={(e) => setNewParticipant(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddParticipant()}
            />
            <Button type="button" onClick={handleAddParticipant}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {participants.map((participant, index) => (
              <div key={index} className="flex items-center bg-primary/10 text-primary rounded-full px-3 py-1">
                <User className="h-3 w-3 mr-2" />
                <span className="text-xs">{participant}</span>
                <button 
                  onClick={() => handleRemoveParticipant(participant)}
                  className="ml-2 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" placeholder="Enter appointment details" rows={3} />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Create Appointment</Button>
      </CardFooter>
    </Card>
  );
};

export default NewAppointment;
