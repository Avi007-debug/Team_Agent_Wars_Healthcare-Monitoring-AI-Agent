import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Stethoscope, Pill, HeartPulse, Brain, Salad, AlertTriangle, 
  Clock, MessageCircle, Trash2, Bell, Info, Plus, X 
} from 'lucide-react';

const PRESETS = [
  { icon: Stethoscope, text: 'symptoms of gestational cholestasis', color: 'text-primary' },
  { icon: Pill, text: 'side effects of oxycodone hydrochloride', color: 'text-secondary' },
  { icon: Salad, text: 'nutrition in pea curry (matar ki sabzi)', color: 'text-emerald-400' },
  { icon: AlertTriangle, text: 'drug interaction aspirin ibuprofen', color: 'text-amber-400' },
  { icon: HeartPulse, text: 'bp 160', color: 'text-red-400' },
  { icon: Brain, text: 'risk age 55 bp 160', color: 'text-violet-400' },
  { icon: AlertTriangle, text: 'covid-19 prevention guidelines', color: 'text-cyan-400' },
  { icon: Clock, text: 'remind me to take aspirin at 8am', color: 'text-orange-400' },
  { icon: MessageCircle, text: 'hi', color: 'text-muted-foreground' },
];

export interface Reminder {
  id: string;
  medicine: string;
  reminder_time: string;
  status: string;
  notification_pref: string;
}

interface Props {
  role: string;
  onRoleChange: (r: string) => void;
  onPresetClick: (t: string) => void;
  onClear: () => void;
  reminders: Reminder[];
  onDeleteReminder: (id: string) => Promise<void>;
  onAddReminder: (medicine: string, time: string, pref: string) => Promise<void>;
  notificationPref: string;
  onNotificationPrefChange: (pref: string) => void;
  browserPermission: string;
  onRequestBrowserPermission: () => void;
}

export default function ChatSidebar({
  role,
  onRoleChange,
  onPresetClick,
  onClear,
  reminders,
  onDeleteReminder,
  onAddReminder,
  notificationPref,
  onNotificationPrefChange,
  browserPermission,
  onRequestBrowserPermission
}: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newPref, setNewPref] = useState('in_app');
  const [submitting, setSubmitting] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMed.trim() || !newTime.trim()) return;
    setSubmitting(true);
    try {
      await onAddReminder(newMed.trim(), newTime.trim(), newPref);
      setNewMed('');
      setNewTime('');
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="hidden lg:flex w-80 flex-col glass-strong rounded-2xl overflow-hidden border-border/50 shadow-xl"
    >
      {/* Role selector */}
      <div className="p-4 border-b border-border/40 bg-card/20">
        <label className="text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground mb-2 block">
          Your Role
        </label>
        <select
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-muted/40 border border-border text-foreground text-sm font-medium focus:outline-none focus:border-primary focus:glow-input transition-all cursor-pointer appearance-none shadow-inner"
        >
          <option value="user">👤 Patient / User</option>
          <option value="doctor">🩺 Doctor / Clinician</option>
        </select>
      </div>

      {/* Alarms & Reminders Manager */}
      <div className="p-4 border-b border-border/40 bg-card/10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Bell size={14} className="text-primary animate-pulse" />
            <h3 className="text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground">
              Alarms & Reminders
            </h3>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Notification channels info"
            >
              <Info size={13} />
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="p-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              title="Set medication reminder"
            >
              {showAddForm ? <X size={13} /> : <Plus size={13} />}
            </button>
          </div>
        </div>

        {/* Info panel */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="text-[11px] text-muted-foreground bg-muted/30 border border-border p-2.5 rounded-lg leading-relaxed overflow-hidden"
            >
              <p className="font-bold text-foreground mb-1">Notification Channels:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><span className="text-primary font-medium">In-App</span>: Visual overlay & audio chime when active.</li>
                <li><span className="text-secondary font-medium">Browser</span>: OS push alerts (works in background).</li>
                <li><span className="text-emerald-400 font-medium">Email</span>: Sends immediate alerts via Supabase auth email.</li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add reminder inline form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleSubmit}
              className="flex flex-col gap-2 bg-muted/20 border border-border/60 p-3 rounded-xl overflow-hidden"
            >
              <input
                type="text"
                required
                placeholder="Medicine (e.g., Aspirin)"
                value={newMed}
                onChange={(e) => setNewMed(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-background/50 border border-border text-xs focus:outline-none focus:border-primary text-foreground"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Time (e.g., 8:00 AM, 20:00)"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-background/50 border border-border text-xs focus:outline-none focus:border-primary text-foreground"
                />
                <select
                  value={newPref}
                  onChange={(e) => setNewPref(e.target.value)}
                  className="px-2 py-1.5 rounded-lg bg-background/50 border border-border text-xs focus:outline-none focus:border-primary text-foreground cursor-pointer"
                >
                  <option value="in_app">💻 In-App</option>
                  <option value="browser">🔔 Push</option>
                  <option value="email">📧 Email</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-1.5 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-md shadow-primary/10"
              >
                Set Reminder
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Reminders List */}
        <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
          {reminders.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic text-center py-2">
              No active reminders set.
            </p>
          ) : (
            reminders.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/50 hover:border-primary/20 transition-all text-xs group"
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-foreground truncate">{r.medicine}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock size={10} className="text-primary/70" />
                    {r.reminder_time}
                    <span className="opacity-80 px-1 py-0.25 rounded bg-primary/10 text-primary text-[8px]">
                      {r.notification_pref === 'in_app' ? 'In-App' : r.notification_pref === 'browser' ? 'Push' : 'Email'}
                    </span>
                  </span>
                </div>
                <button
                  onClick={() => onDeleteReminder(r.id)}
                  className="p-1 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Delete Reminder"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Browser notification helper */}
        {browserPermission !== 'granted' && (
          <button
            onClick={onRequestBrowserPermission}
            className="w-full text-left flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-warning/20 bg-warning/5 hover:bg-warning/10 text-[10px] text-amber-500 font-semibold transition-all"
          >
            <Bell size={11} className="flex-shrink-0 animate-bounce" />
            Enable Browser Push Notifications
          </button>
        )}
      </div>

      {/* Quick queries */}
      <div className="flex-1 overflow-y-auto p-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground mb-3 px-1">
          Quick Queries
        </h3>
        <div className="flex flex-col gap-1">
          {PRESETS.map((p, i) => (
            <motion.button
              key={i}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPresetClick(p.text)}
              className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:border-primary/20 border border-transparent transition-all duration-200"
            >
              <p.icon size={14} className={`${p.color} flex-shrink-0`} />
              <span className="line-clamp-1">{p.text}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Clear */}
      <div className="p-3 border-t border-border bg-card/20">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClear}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-medium hover:bg-danger/15 transition-all"
        >
          <Trash2 size={14} />
          Clear Conversation
        </motion.button>
      </div>
    </motion.aside>
  );
}
