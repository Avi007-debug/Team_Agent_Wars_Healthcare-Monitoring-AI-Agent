import { motion } from 'framer-motion';
import { Stethoscope, Pill, HeartPulse, Brain, Salad, AlertTriangle, Clock, MessageCircle, Trash2 } from 'lucide-react';

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

interface Props {
  role: string;
  onRoleChange: (r: string) => void;
  onPresetClick: (t: string) => void;
  onClear: () => void;
}

export default function ChatSidebar({ role, onRoleChange, onPresetClick, onClear }: Props) {
  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="hidden lg:flex w-72 flex-col glass-strong rounded-2xl overflow-hidden"
    >
      {/* Role selector */}
      <div className="p-4 border-b border-border">
        <label className="text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground mb-2 block">
          Your Role
        </label>
        <select
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border text-foreground text-sm font-medium focus:outline-none focus:border-primary focus:glow-input transition-all cursor-pointer appearance-none"
        >
          <option value="user">👤 Patient / User</option>
          <option value="doctor">🩺 Doctor / Clinician</option>
        </select>
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
      <div className="p-3 border-t border-border">
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
