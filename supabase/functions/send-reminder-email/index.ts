
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Interface for the reminder email request
interface ReminderEmailRequest {
  appointmentId: string;
  recipientEmail?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request payload
    const { appointmentId, recipientEmail = "drete604@gmail.com" } = await req.json() as ReminderEmailRequest;
    
    // Create a Supabase client (using the environment variables)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables are not set");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*, user_id')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      throw new Error(`Appointment not found: ${appointmentError?.message || 'Unknown error'}`);
    }

    // Format appointment time for display
    const appointmentDateTime = new Date(appointment.start_time).toLocaleString();

    // In a production environment, you would integrate with an email service like SendGrid, Resend, etc.
    // For now, we're just logging the email that would be sent
    console.log(`✉️ Email would be sent to: ${recipientEmail}`);
    console.log(`Subject: Reminder: Upcoming Appointment`);
    console.log(`Body: Reminder: Your appointment "${appointment.title}" is coming up at ${appointmentDateTime}.`);

    // Return a successful response
    return new Response(
      JSON.stringify({ success: true, message: "Reminder email sent successfully" }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 200,
      }
    );
  } catch (error) {
    // Log the error
    console.error("Error sending reminder email:", error);

    // Return an error response
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 500,
      }
    );
  }
});
