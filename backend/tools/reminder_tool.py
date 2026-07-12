import os
import re
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


def normalize_time_string(time_str):
	time_str = (time_str or "").lower().strip()
	
	# Look for period (am/pm)
	period = "am"
	if "pm" in time_str:
		period = "pm"
	elif "am" in time_str:
		period = "am"
	else:
		period = "am"
		
	# Clean text to keep only digits
	digits = re.findall(r"\d+", time_str)
	if not digits:
		return "08:00 AM"
		
	if len(digits) == 1:
		hour = int(digits[0])
		minute = 0
	else:
		hour = int(digits[0])
		minute = int(digits[1])
		
	# Handle military/24-hour style conversion
	if hour > 12 and "pm" not in time_str and "am" not in time_str:
		hour -= 12
		period = "pm"
	elif hour == 0:
		hour = 12
		period = "am"
		
	# Bound validation
	if hour < 1 or hour > 12:
		hour = 8
	if minute < 0 or minute > 59:
		minute = 0
		
	return f"{hour:02d}:{minute:02d} {period.upper()}"


def set_reminder(medicine, time, user_id=None, frequency="once"):
	normalized_time = normalize_time_string(time)
	if user_id and SUPABASE_URL and SUPABASE_KEY:
		try:
			supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
			supabase.table("reminders").insert({
				"user_id": user_id,
				"medicine": medicine,
				"reminder_time": normalized_time,
				"frequency": frequency,
				"status": "active"
			}).execute()
			freq_label = f" ({frequency.replace('_', ' ')})" if frequency != "once" else ""
			return f"⏰ Reminder successfully scheduled! I've set a reminder to take {medicine} at {normalized_time}{freq_label}."
		except Exception as e:
			print("❌ Error setting reminder in Supabase:", e)
			return f"⏰ I've noted down your reminder to take {medicine} at {normalized_time}, but I couldn't save it to the database: {str(e)}"
	
	return f"Reminder set to take {medicine} at {normalized_time}."


def list_reminders(user_id=None):
	if user_id and SUPABASE_URL and SUPABASE_KEY:
		try:
			supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
			res = supabase.table("reminders").select("*").eq("user_id", user_id).eq("status", "active").execute()
			rows = res.data or []
			if not rows:
				return "⏰ You have no active medication reminders scheduled."
			response = "⏰ Your Active Medication Reminders:\n\n"
			for r in rows:
				freq = f" ({r['frequency'].replace('_', ' ')})" if r.get('frequency') and r['frequency'] != 'once' else ""
				channels = (r.get('notification_pref') or 'in_app').replace('_', ' ')
				response += f"- **{r['medicine']}** at **{r['reminder_time']}**{freq} [via {channels}]\n"
			return response
		except Exception as e:
			print("❌ Error fetching reminders from Supabase:", e)
			return f"⏰ I couldn't load your reminders: {str(e)}"
	
	return "I cannot load reminders without user authentication."