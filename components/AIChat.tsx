
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, User, ChevronDown } from 'lucide-react';
import { chatWithProjectAssistant } from '../services/geminiService';
import { Project } from '../types';

interface AIChatProps {
  currentProject: Project | null;
}

export const AIChat: React.FC<AIChatProps> = ({ currentProject }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: '你好！我是專案系統管理 AI 助手。你可以問我關於專案風險、任務拆解或設計建議的問題。' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const history = messages.map(m => ({ role: m.role, content: m.text }));
    const response = await chatWithProjectAssistant(history, userMsg, currentProject);

    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsLoading(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-14 h-14 md:w-16 md:h-16 bg-slate-900 text-white rounded-full shadow-lg shadow-blue-500/30 hover:scale-110 transition-all duration-300 flex items-center justify-center z-40 group border-2 border-blue-500"
      >
        <Sparkles size={24} className="group-hover:animate-pulse text-blue-200" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 md:inset-auto md:bottom-8 md:right-8 w-full h-full md:w-[400px] md:h-[600px] bg-white md:rounded-[24px] flex flex-col z-50 animate-enter overflow-hidden border border-slate-200 shadow-2xl shadow-slate-900/20">
      {/* Header */}
      <div className="p-4 md:p-5 bg-white/95 backdrop-blur-md border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-md">
            <Bot size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">AI 助手</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-slate-400 font-medium">在線 • {currentProject ? '專案模式' : '全域模式'}</p>
            </div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          {window.innerWidth < 768 ? <ChevronDown size={24} /> : <X size={18} />}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-6 custom-scrollbar bg-slate-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600'}`}>
              {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
            </div>
            <div className={`max-w-[85%] md:max-w-[80%] p-3 md:p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
              }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center flex-shrink-0 text-slate-400">
              <Sparkles size={14} />
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0 safe-bottom">
        <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-3 shadow-inner border border-slate-200 focus-within:border-blue-500 transition-all">
          <input
            type="text"
            className="flex-1 bg-transparent border-none text-sm focus:ring-0 placeholder:text-slate-400 font-medium text-slate-800"
            placeholder="輸入訊息..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-2 bg-slate-900 text-white rounded-xl disabled:opacity-50 hover:bg-slate-800 transition-all hover:scale-105 shadow-sm"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
