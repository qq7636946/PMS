
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, Clock } from 'lucide-react';
import { Project, ChatMessage, Member } from '../types';

interface ProjectChatProps {
  project: Project;
  currentUser: Member;
  allMembers: Member[];
  onSendMessage: (projectId: string, content: string) => void;
  onClose?: () => void;
  embedded?: boolean; // New prop to control layout mode
}

export const ProjectChat: React.FC<ProjectChatProps> = ({ 
  project, 
  currentUser, 
  allMembers, 
  onSendMessage, 
  onClose,
  embedded = false
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Safety first: Ensure messages array exists
  const safeMessages = Array.isArray(project.chatMessages) ? project.chatMessages : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [project.chatMessages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(project.id, input);
    setInput('');
  };

  const getMemberName = (id: string) => {
    return allMembers.find(m => m.id === id)?.name || 'Unknown';
  };

  const getMemberInitial = (id: string) => {
    return getMemberName(id).charAt(0);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Conditional styles based on embedded prop
  const containerClasses = embedded 
    ? "flex flex-col h-full w-full bg-slate-100 dark:bg-zinc-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-zinc-800" 
    : "flex flex-col h-full bg-white dark:bg-[#18181b] w-full md:w-[350px] lg:w-[400px] shadow-2xl z-40 fixed top-0 right-0 animate-fade-in";

  return (
    <div className={containerClasses}>
      {/* Header - Hide if embedded as the Tab serves as header */}
      {!embedded && (
        <div className="p-4 border-b border-slate-50 dark:border-zinc-800 flex justify-between items-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-500/20 text-blue-500 dark:text-blue-400 rounded-xl">
                    <MessageSquare size={18} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">Team Chat</h3>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">{project.teamMembers.length} Members</p>
                </div>
            </div>
            {onClose && (
                <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-white p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-full transition-colors">
                    <X size={20} />
                </button>
            )}
        </div>
      )}

      {/* Messages Area - Added pattern background */}
      <div className={`flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar relative bg-[#F3F4F6] dark:bg-[#09090b]`} style={{backgroundImage: 'radial-gradient(rgba(128,128,128,0.2) 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
         {safeMessages.length > 0 ? (
             safeMessages.map((msg) => {
                 const isMe = msg.senderId === currentUser.id;
                 return (
                     <div key={msg.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                         {/* Avatar */}
                         <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black flex-shrink-0 shadow-sm border-2 ${
                             isMe ? 'bg-lime-400 border-lime-400 text-black' : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-white dark:border-zinc-700'
                         }`}>
                             {getMemberInitial(msg.senderId)}
                         </div>
                         
                         <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                             <div className="flex items-center gap-2 mb-2 px-1">
                                 <span className="text-xs font-bold text-slate-500 dark:text-zinc-500">
                                     {isMe ? '你 (You)' : getMemberName(msg.senderId)}
                                 </span>
                                 <span className="text-[10px] text-slate-400 dark:text-zinc-600 font-medium opacity-70">
                                     {formatTime(msg.timestamp)}
                                 </span>
                             </div>
                             
                             {/* High Contrast Bubbles */}
                             <div className={`px-5 py-4 text-sm font-medium leading-relaxed shadow-lg ${
                                 isMe 
                                 ? 'bg-lime-400 text-black rounded-[20px] rounded-tr-sm shadow-lime-400/20' 
                                 : 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-[20px] rounded-tl-sm border border-slate-200/60 dark:border-zinc-700 shadow-sm'
                             }`}>
                                 {msg.content}
                             </div>
                         </div>
                     </div>
                 );
             })
         ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-zinc-700 opacity-60">
                 <MessageSquare size={48} className="mb-4" />
                 <p className="text-sm font-bold">尚無訊息，開始討論吧！</p>
             </div>
         )}
         <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white dark:bg-[#18181b] border-t border-slate-100 dark:border-zinc-800 z-10">
          <div className="flex gap-3 bg-slate-50 dark:bg-zinc-900 rounded-[20px] p-2 shadow-inner border border-slate-200 dark:border-zinc-800 focus-within:border-lime-400 focus-within:bg-white dark:focus-within:bg-black focus-within:shadow-xl transition-all duration-300 group">
              <input 
                 type="text"
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                 placeholder="輸入訊息參與討論..."
                 className="flex-1 bg-transparent border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-zinc-200 outline-none focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-zinc-600"
              />
              <button 
                 onClick={handleSend}
                 disabled={!input.trim()}
                 className="w-12 h-12 flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl hover:bg-lime-500 dark:hover:bg-lime-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md transform active:scale-95 group-focus-within:bg-lime-500 dark:group-focus-within:bg-lime-400 group-focus-within:text-black"
              >
                  <Send size={18} />
              </button>
          </div>
      </div>
    </div>
  );
};
