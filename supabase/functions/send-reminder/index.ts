import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to parse reminder time (e.g. "8am", "20:00") to minutes past midnight
function parseReminderTimeToMinutes(timeStr: string): number | null {
  const clean = timeStr.trim().toLowerCase();
  
  // 24hr format HH:MM
  const hhmmMatch = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmmMatch) {
    const hrs = parseInt(hhmmMatch[1], 10);
    const mins = parseInt(hhmmMatch[2], 10);
    if (hrs >= 0 && hrs < 24 && mins >= 0 && mins < 60) return hrs * 60 + mins;
  }

  // 12hr format with AM/PM
  const ampmMatch = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (ampmMatch) {
    let hrs = parseInt(ampmMatch[1], 10);
    const mins = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const period = ampmMatch[3];
    
    if (period === 'pm' && hrs < 12) hrs += 12;
    if (period === 'am' && hrs === 12) hrs = 0;
    
    if (hrs >= 0 && hrs < 24 && mins >= 0 && mins < 60) return hrs * 60 + mins;
  }

  // Pure digits hour (e.g. "8")
  const hourMatch = clean.match(/^(\d{1,2})$/);
  if (hourMatch) {
    const hrs = parseInt(hourMatch[1], 10);
    if (hrs >= 0 && hrs < 24) return hrs * 60;
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY environment secret is not set.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active reminders
    const { data: reminders, error: fetchErr } = await supabase
      .from("reminders")
      .select("*")
      .eq("status", "active");

    if (fetchErr) throw fetchErr;

    const now = new Date();
    // Minutes past midnight in current time (UTC by default on Supabase servers)
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const todayTimestamp = now.getTime();

    let processedCount = 0;

    for (const r of (reminders || [])) {
      const targetMin = parseReminderTimeToMinutes(r.reminder_time);
      if (targetMin === null) continue;

      let shouldTrigger = false;
      const lastTriggered = r.last_triggered_at ? new Date(r.last_triggered_at).getTime() : null;

      // Handle recurrence rules
      if (r.frequency === "every_8_hours") {
        // Every 8 hours trigger (480 minutes elapsed)
        if (!lastTriggered || (todayTimestamp - lastTriggered) >= 8 * 60 * 60 * 1000) {
          shouldTrigger = true;
        }
      } else if (targetMin === currentMin) {
        // Time matches the current minute
        if (r.frequency === "once") {
          shouldTrigger = !lastTriggered;
        } else if (r.frequency === "daily") {
          // Trigger if not triggered today (at least 20 hours ago)
          shouldTrigger = !lastTriggered || (todayTimestamp - lastTriggered) >= 20 * 60 * 60 * 1000;
        } else if (r.frequency === "weekly") {
          // Trigger if weekly interval matches (at least 6 days ago)
          shouldTrigger = !lastTriggered || (todayTimestamp - lastTriggered) >= 6 * 24 * 60 * 60 * 1000;
        }
      }

      if (shouldTrigger) {
        // Fetch recipient user email from Supabase Auth admin API
        const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(r.user_id);
        if (userErr || !userData?.user?.email) {
          console.error(`Could not retrieve email for user ${r.user_id}:`, userErr);
          continue;
        }

        const userEmail = userData.user.email;

        // Call Resend email API
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "MedAssist AI <onboarding@resend.dev>",
            to: [userEmail],
            subject: `🏥 Medication Reminder: Take ${r.medicine}`,
            html: `
              <div style="font-family: sans-serif; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1a202c;">
                <h2 style="color: #0f766e; margin-top: 0;">Medication Reminder</h2>
                <p>Hello,</p>
                <p>This is a scheduled reminder to take your medication:</p>
                <div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 8px; padding: 16px; margin: 18px 0; text-align: center;">
                  <span style="font-size: 24px; font-weight: 800; color: #0d9488; letter-spacing: 0.5px;">${r.medicine}</span>
                </div>
                <p>⏰ Scheduled Time: <strong>${r.reminder_time}</strong></p>
                <p>🔄 Recurrence: <strong>${r.frequency.toUpperCase().replace(/_/g, ' ')}</strong></p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 11px; color: #718096; text-align: center; margin: 0;">
                  This is an automated alert from MedAssist AI. General medical advice only.
                </p>
              </div>
            `
          })
        });

        if (!emailRes.ok) {
          const errText = await emailRes.text();
          console.error(`Resend API failed for reminder ${r.id}:`, errText);
          continue;
        }

        // Update reminder's last_triggered_at and check status
        const updates: any = { last_triggered_at: new Date().toISOString() };
        if (r.frequency === "once") {
          updates.status = "completed"; // Complete single-run alarms
        }

        const { error: updateErr } = await supabase
          .from("reminders")
          .update(updates)
          .eq("id", r.id);

        if (updateErr) {
          console.error(`Failed to update reminder state for ${r.id}:`, updateErr);
        } else {
          processedCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({ status: "success", triggered: processedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ status: "error", error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
