import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  user: string;
  bot: string;
  role: string;
  createdAt: string;
}

export default function ChatMessage({ message }: { message: Message }) {
  const ts = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <>
      {/* User */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-end gap-3"
      >
        <div className="max-w-[70%] rounded-2xl rounded-br-md px-4 py-3 bg-primary/15 border border-primary/20 text-foreground">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary/60 block mb-1">
            {message.role === 'doctor' ? '🩺 Doctor' : '👤 You'}
          </span>
          <p className="text-sm leading-relaxed">{message.user}</p>
          {ts && <span className="text-[10px] text-muted-foreground block mt-2">{ts}</span>}
        </div>
        <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
          <User size={14} className="text-primary" />
        </div>
      </motion.div>

      {/* Bot */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-start gap-3"
      >
        <div className="w-8 h-8 rounded-xl bg-secondary/15 border border-secondary/20 flex items-center justify-center flex-shrink-0 mt-1 animate-pulse-glow">
          <Bot size={14} className="text-secondary" />
        </div>
        <div className="max-w-[70%] rounded-2xl rounded-bl-md px-4 py-3 glass border border-border text-card-foreground">
          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary/60 block mb-1">
            AI Assistant
          </span>
          <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
            <ReactMarkdown>{message.bot}</ReactMarkdown>
          </div>
          {ts && <span className="text-[10px] text-muted-foreground block mt-2">{ts}</span>}
        </div>
      </motion.div>
    </>
  );
}
