
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Announcement, Member } from '../types';
import { Megaphone, Plus, X, Tag, Users, Clock, CheckCircle2, Trash2, AlertTriangle, Pencil } from 'lucide-react';

interface AnnouncementViewProps {
  announcements: Announcement[];
  members: Member[];
  currentUser: Member;
  onCreateAnnouncement: (a: Announcement) => void;
  onUpdateAnnouncement: (a: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
  onMarkAsRead: (id: string) => void;
}

export const AnnouncementView: React.FC<AnnouncementViewProps> = ({ 
    announcements, 
    members, 
    currentUser, 
    onCreateAnnouncement,
    onUpdateAnnouncement,
    onDeleteAnnouncement,
    onMarkAsRead 
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTag, setNewTag] = useState('一般公告');
  const [newPriority, setNewPriority] = useState<'Normal' | 'High'>('Normal');
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]); // Empty = All

  const canManage = ['Admin', 'Manager'].includes(currentUser.accessLevel);

  // Filter visible announcements: Created by me OR targeted to me/all
  const visibleAnnouncements = announcements.filter(a => {
      if (canManage) return true; // Admins see all
      return a.targetMemberIds.length === 0 || a.targetMemberIds.includes(currentUser.id);
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleInitCreate = () => {
      resetForm();
      setEditingAnnouncement(null);
      setShowCreateModal(true);
  };

  const handleInitEdit = (ann: Announcement) => {
      setNewTitle(ann.title);
      setNewContent(ann.content);
      setNewTag(ann.tag);
      setNewPriority(ann.priority);
      setSelectedTargets(ann.targetMemberIds);
      setEditingAnnouncement(ann);
      setShowCreateModal(true);
  };

  const handleSubmit = () => {
      if (!newTitle.trim() || !newContent.trim()) {
          alert("請輸入標題與內容");
          return;
      }

      if (editingAnnouncement) {
          // Update Mode
          const updated: Announcement = {
              ...editingAnnouncement,
              title: newTitle,
              content: newContent,
              tag: newTag,
              priority: newPriority,
              targetMemberIds: selectedTargets,
              // Keep original read status or maybe reset it if significant changes? Keeping it simple for now.
          };
          onUpdateAnnouncement(updated);
      } else {
          // Create Mode
          const newAnnouncement: Announcement = {
              id: Date.now().toString(),
              title: newTitle,
              content: newContent,
              tag: newTag,
              priority: newPriority,
              targetMemberIds: selectedTargets,
              authorId: currentUser.id,
              createdAt: new Date().toISOString(),
              readBy: [currentUser.id]
          };
          onCreateAnnouncement(newAnnouncement);
      }

      setShowCreateModal(false);
      resetForm();
      setEditingAnnouncement(null);
  };

  const resetForm = () => {
      setNewTitle('');
      setNewContent('');
      setNewTag('一般公告');
      setNewPriority('Normal');
      setSelectedTargets([]);
  };

  const toggleTarget = (id: string) => {
      setSelectedTargets(prev => 
          prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
      );
  };

  const getTagColor = (tag: string) => {
      if (tag.includes('緊急') || tag.includes('Urgent')) return 'bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-500 border-rose-100 dark:border-rose-900';
      if (tag.includes('維護') || tag.includes('Fix')) return 'bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-500 border-orange-100 dark:border-orange-900';
      if (tag.includes('全體') || tag.includes('General')) return 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900';
      return 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700';
  };

  return (
    <div className="space-y-8 animate-enter pb-10">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">系統公告</h2>
                <p className="text-slate-400 dark:text-zinc-500 mt-2 text-sm font-medium">查看最新的公司政策、系統更新與重要通知。</p>
            </div>
            {canManage && (
                <button onClick={handleInitCreate} className="bg-lime-400 text-black px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-lime-500 transition-all shadow-lg hover:shadow-xl">
                    <Plus size={18} /> 發布公告
                </button>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleAnnouncements.length > 0 ? visibleAnnouncements.map(ann => {
                const isRead = ann.readBy.includes(currentUser.id);
                return (
                    <div 
                        key={ann.id} 
                        className={`bento-card p-6 relative group transition-all cursor-pointer ${!isRead ? 'border-l-4 border-l-lime-400 bg-white dark:bg-[#18181b]' : 'bg-slate-50/50 dark:bg-zinc-900/30'} hover:shadow-lg dark:hover:shadow-lime-400/5 hover:-translate-y-1 border border-slate-100 dark:border-zinc-800`}
                        onClick={() => {
                            onMarkAsRead(ann.id);
                            if (canManage) handleInitEdit(ann);
                        }}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getTagColor(ann.tag)}`}>
                                {ann.tag}
                            </span>
                            <div className="flex items-center gap-2">
                                {ann.priority === 'High' && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/20 px-2 py-0.5 rounded-full">
                                        <AlertTriangle size={10} /> 緊急
                                    </span>
                                )}
                                <span className="text-xs text-slate-400 dark:text-zinc-500 font-bold flex items-center gap-1">
                                    <Clock size={12} /> {new Date(ann.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        
                        <div className="mb-3 pr-6">
                            <h3 className={`text-xl font-bold ${!isRead ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-zinc-500'}`}>
                                {!isRead && <span className="inline-block w-2 h-2 rounded-full bg-lime-400 mr-2 align-middle"></span>}
                                {ann.title}
                            </h3>
                        </div>
                        
                        {canManage && (
                            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Pencil size={14} className="text-slate-400 dark:text-zinc-500"/>
                            </div>
                        )}

                        <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed whitespace-pre-line mb-6">
                            {ann.content}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800">
                             <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-zinc-500 font-bold">
                                 <Users size={14} />
                                 {ann.targetMemberIds.length === 0 ? '全體成員' : `${ann.targetMemberIds.length} 位指定成員`}
                             </div>
                             {canManage && (
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteAnnouncement(ann.id); }}
                                    className="p-2 text-slate-300 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                 >
                                     <Trash2 size={16} />
                                 </button>
                             )}
                        </div>
                    </div>
                )
            }) : (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-600">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mb-4 text-slate-300 dark:text-zinc-600">
                        <Megaphone size={32} />
                    </div>
                    <p className="font-bold">目前沒有任何公告</p>
                </div>
            )}
        </div>

        {/* Create/Edit Modal - Portaled to Body */}
        {showCreateModal && createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
                <div className="bg-white dark:bg-[#18181b] w-full max-w-lg rounded-[32px] shadow-2xl relative z-10 p-8 animate-enter flex flex-col max-h-[85vh] border border-slate-200 dark:border-zinc-700">
                    <div className="flex justify-between items-center mb-6 flex-shrink-0">
                        <h3 className="font-bold text-slate-800 dark:text-white text-xl flex items-center gap-2">
                            {editingAnnouncement ? <Pencil size={20} className="text-lime-500"/> : <Megaphone size={20} className="text-lime-500"/>} 
                            {editingAnnouncement ? '編輯公告' : '發布新公告'}
                        </h3>
                        <button onClick={() => setShowCreateModal(false)}><X size={24} className="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-white" /></button>
                    </div>

                    <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">標題</label>
                            <input className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-white outline-none focus:border-lime-500 transition-all" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="公告標題" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">標籤類型</label>
                                <select className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-white outline-none focus:border-lime-500" value={newTag} onChange={e => setNewTag(e.target.value)}>
                                    <option value="一般公告">一般公告</option>
                                    <option value="緊急通知">緊急通知</option>
                                    <option value="全體公告">全體公告</option>
                                    <option value="系統維護">系統維護</option>
                                    <option value="規章修改">規章修改</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">優先級</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setNewPriority('Normal')} className={`flex-1 py-3 rounded-xl text-xs font-bold border ${newPriority === 'Normal' ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-500 dark:border-blue-500 text-blue-600 dark:text-blue-400' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'}`}>一般</button>
                                    <button onClick={() => setNewPriority('High')} className={`flex-1 py-3 rounded-xl text-xs font-bold border ${newPriority === 'High' ? 'bg-rose-50 dark:bg-rose-500/20 border-rose-500 dark:border-rose-500 text-rose-600 dark:text-rose-500' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'}`}>緊急</button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">內容</label>
                            <textarea className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-medium text-slate-700 dark:text-zinc-300 outline-none focus:border-lime-500 transition-all min-h-[120px] resize-none" value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="請輸入公告內容..." />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">指定人員 (留空則發送給全員)</label>
                            <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl p-2 max-h-[150px] overflow-y-auto custom-scrollbar grid grid-cols-2 gap-2">
                                {members.map(m => (
                                    <div 
                                        key={m.id} 
                                        onClick={() => toggleTarget(m.id)}
                                        className={`p-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border ${selectedTargets.includes(m.id) ? 'bg-lime-100 dark:bg-lime-400/20 border-lime-300 dark:border-lime-400 text-lime-700 dark:text-lime-400' : 'bg-white dark:bg-zinc-800 border-slate-100 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:border-lime-200 dark:hover:border-lime-900'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${selectedTargets.includes(m.id) ? 'bg-lime-500 text-black' : 'bg-slate-200 dark:bg-zinc-700'}`}>
                                            {selectedTargets.includes(m.id) ? <CheckCircle2 size={10} /> : m.name.charAt(0)}
                                        </div>
                                        {m.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 flex-shrink-0">
                        <button onClick={() => setShowCreateModal(false)} className="px-6 py-2.5 text-sm font-bold text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-white">取消</button>
                        <button onClick={handleSubmit} className="bg-lime-400 text-black px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-lime-500 shadow-lg">
                            {editingAnnouncement ? '儲存變更' : '發布'}
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )}
    </div>
  );
};
