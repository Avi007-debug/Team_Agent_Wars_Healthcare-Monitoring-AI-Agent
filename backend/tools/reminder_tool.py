from supabase import create_client, Client
import os

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

def set_reminder(medicine, time, user_id=None, frequency="once"):
	if user_id and SUPABASE_URL and SUPABASE_KEY:
		try:
			supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
			supabase.table("reminders").insert({
				"user_id": user_id,
				"medicine": medicine,
				"reminder_time": time,
				"frequency": frequency,
				"status": "active"
			}).execute()
			freq_label = f" ({frequency.replace('_', ' ')})" if frequency != "once" else ""
			return f"⏰ Reminder successfully scheduled! I've set a reminder to take {medicine} at {time}{freq_label}."
		except Exception as e:
			print("❌ Error setting reminder in Supabase:", e)
			return f"⏰ I've noted down your reminder to take {medicine} at {time}, but I couldn't save it to the database: {str(e)}"
	
	return f"Reminder set to take {medicine} at {time}."