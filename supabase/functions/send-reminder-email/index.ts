
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

    // Get the user's email if not provided
    if (!recipientEmail || recipientEmail === "drete604@gmail.com") {
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', appointment.user_id)
        .single();
      
      if (!userError && userProfile && userProfile.email) {
        recipientEmail = userProfile.email;
      }
    }

    // Format appointment time for display
    const appointmentDateTime = new Date(appointment.start_time).toLocaleString();

    // Send email using the EmailJS API
    const url = "https://api.emailjs.com/api/v1.0/email/send";
    const serviceId = Deno.env.get("EMAILJS_SERVICE_ID") || "";
    const templateId = Deno.env.get("EMAILJS_TEMPLATE_ID") || "";
    const userId = Deno.env.get("EMAILJS_USER_ID") || "";
    
    if (!serviceId || !templateId || !userId) {
      throw new Error("EmailJS configuration is not complete");
    }

    const emailData = {
      service_id: serviceId,
      template_id: templateId,
      user_id: userId,
      template_params: {
        to_email: recipientEmail,
        appointment_title: appointment.title,
        appointment_time: appointmentDateTime,
        appointment_description: appointment.description || "No description provided",
        subject: "Reminder: Upcoming Appointment"
      }
    };

    const emailResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }

    console.log(`✉️ Email sent to: ${recipientEmail}`);
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
