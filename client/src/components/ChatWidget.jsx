import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X, Send, Bot, User, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import * as aiApi from '../api/ai';
import { getErrorMessage } from '../api/client';

const GREETINGS = {
  admin: 'Ask me anything about SPRAT — projects, approvals, or access control.',
  project_manager: 'Ask me about managing this project, its team, or its documents.',
  analyst: 'Ask me about mining goals, classification, or scenarios.',
  guest: "Ask me anything about what you're looking at — I can only see what you can.",
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-text-muted"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

export default function ChatWidget() {
  const { user } = useAuth();
  const { projectId } = useParams();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = useMutation({
    mutationFn: (history) => aiApi.sendChatMessage(history, projectId),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
      setMessages((prev) => prev.slice(0, -1));
    },
  });

  if (!user || user.status !== 'active') return null;

  const handleSend = () => {
    const text = input.trim();
    if (!text || send.isPending) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    send.mutate(next);
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-700 text-white shadow-glow"
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'close' : 'open'}
            initial={{ opacity: 0, rotate: -45 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 45 }}
            transition={{ duration: 0.15 }}
          >
            {open ? <X size={22} /> : <Sparkles size={22} />}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="fixed bottom-24 right-5 z-40 flex h-[32rem] w-[23rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-soft"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-soft px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-primary-700 text-white">
                  <Bot size={15} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">SPRAT Assistant</p>
                  <p className="text-[11px] text-text-muted">Powered by Groq</p>
                </div>
              </div>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  className="rounded-md p-1.5 text-text-muted hover:bg-background hover:text-text-primary"
                  aria-label="Reset conversation"
                >
                  <RotateCcw size={15} />
                </button>
              )}
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <Sparkles size={22} className="text-primary-400" />
                  <p className="max-w-[16rem] text-sm text-text-secondary">
                    {GREETINGS[user.role] || GREETINGS.guest}
                  </p>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      m.role === 'user' ? 'bg-primary-100 text-primary-700' : 'bg-surface-soft text-text-secondary'
                    }`}
                  >
                    {m.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                  </div>
                  <div
                    className={`max-w-[15rem] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'rounded-tr-sm bg-primary-600 text-white'
                        : 'rounded-tl-sm bg-surface-soft text-text-primary'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {send.isPending && (
                <div className="flex gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-soft text-text-secondary">
                    <Bot size={12} />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-surface-soft px-3 py-2">
                    <TypingDots />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border p-3">
              <div className="flex items-end gap-2">
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask something…"
                  className="input max-h-24 flex-1 resize-none py-2"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || send.isPending}
                  className="btn-primary !p-2.5"
                  aria-label="Send"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
