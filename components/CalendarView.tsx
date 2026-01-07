
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Project, Task, Member, Status, Priority } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Check, Trash2, Save, User, Briefcase, Flag, Clock } from 'lucide-react';

interface CalendarViewProps {
  projects: Project[];
  members: Member[];
  currentUser: Member;
  onUpdateProject: (p: Project) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ projects, members, currentUser, onUpdateProject }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<Task>>({});

  const isManagement = ['Admin', 'Manager'].includes(currentUser.accessLevel);

  // Helper to get days
  const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const days = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay();
      return { days, firstDay, year, month };
  };

  const handleEventClick = (event: any) => {
      if (event.type === 'project') {
          alert(`專案里程碑\n\n名稱: ${event.title}\n日期: ${event.date}\n狀態: ${event.status}`);
          return;
      }
      // It's a task
      setSelectedEvent(event);
      setEditData({ ...event.originalTask, projectId: event.projectId });
      setIsModalOpen(true);
  };

  const handleSaveTask = () => {
      if (!selectedEvent || !editData.projectId) return;
      
      const project = projects.find(p => p.id === editData.projectId);
      if (!project) return;

      const updatedTasks = project.tasks.map(t => 
          t.id === selectedEvent.id ? { ...t, ...editData } as Task : t
      );

      onUpdateProject({ ...project, tasks: updatedTasks });
      setIsModalOpen(false);
      setSelectedEvent(null);
  };

  const handleDeleteTask = () => {
      if (!selectedEvent || !editData.projectId) return;
      if (!window.confirm("確定要刪除此任務嗎？")) return;

      const project = projects.find(p => p.id === editData.projectId);
      if (!project) return;

      const updatedTasks = project.tasks.filter(t => t.id !== selectedEvent.id);
      onUpdateProject({ ...project, tasks: updatedTasks });
      setIsModalOpen(false);
      setSelectedEvent(null);
  };

  const renderCalendar = () => {
      const { days, firstDay, year, month } = getDaysInMonth(currentDate);
      const totalSlots = Math.ceil((days + firstDay) / 7) * 7;
      const calendarDays = [];

      // 1. Gather all relevant items
      let displayTasks: any[] = [];
      let displayProjects: any[] = [];

      projects.forEach(p => {
          // Check permissions for Project visibility
          const isMember = p.teamMembers.includes(currentUser.id);
          if (!isManagement && !isMember) return;

          // Add Project Deadlines (Distinct Style: Solid Colors)
          if (p.dueDate) {
              displayProjects.push({
                  id: `prj-end-${p.id}`,
                  type: 'project',
                  subtype: 'end',
                  title: `[截止] ${p.name}`,
                  date: p.dueDate,
                  projectId: p.id,
                  status: p.stage,
                  color: 'bg-rose-500 text-white shadow-md border-transparent hover:bg-rose-600'
              });
          }
          if (p.startDate) {
              displayProjects.push({
                  id: `prj-start-${p.id}`,
                  type: 'project',
                  subtype: 'start',
                  title: `[啟動] ${p.name}`,
                  date: p.startDate,
                  projectId: p.id,
                  status: p.stage,
                  color: 'bg-emerald-500 text-white shadow-md border-transparent hover:bg-emerald-600'
              });
          }

          // Add Tasks (Distinct Style: Lighter/Bordered)
          p.tasks.forEach(t => {
              // Filter logic for Members: Only see own tasks
              if (!isManagement && t.assignee !== currentUser.name) return;

              displayTasks.push({
                  id: t.id,
                  type: 'task',
                  title: `${p.name} : ${t.title}`, // Added Project Name Prefix
                  startDate: t.startDate,
                  dueDate: t.dueDate,
                  status: t.status,
                  priority: t.priority,
                  assignee: t.assignee,
                  projectId: p.id,
                  projectName: p.name,
                  originalTask: t,
                  color: t.status === Status.DONE ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700 decoration-zinc-400 line-through' : 
                         t.priority === Priority.CRITICAL ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-500 border-rose-200 dark:border-rose-900' : 
                         'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-lime-200 dark:border-lime-900 hover:border-lime-400'
              });
          });
      });

      // Show Projects first, then tasks
      const allEvents = [...displayProjects, ...displayTasks];

      for (let i = 0; i < totalSlots; i++) {
          const dayNum = i - firstDay + 1;
          const isValidDay = dayNum > 0 && dayNum <= days;
          const currentDayDate = new Date(year, month, dayNum);
          currentDayDate.setHours(0,0,0,0);

          // Find events for this day
          const dayEvents = isValidDay ? allEvents.filter(e => {
              const start = e.startDate || e.date;
              const end = e.dueDate || e.date;
              if (!start) return false;
              
              const sDate = new Date(start); sDate.setHours(0,0,0,0);
              const eDate = new Date(end); eDate.setHours(0,0,0,0);
              
              // For tasks spanning multiple days or single day events
              return currentDayDate >= sDate && currentDayDate <= eDate;
          }) : [];

          calendarDays.push(
              <div 
                key={i} 
                className={`min-h-[120px] border border-slate-100 dark:border-zinc-800 p-1 relative transition-colors ${isValidDay ? 'bg-white dark:bg-[#18181b] hover:bg-slate-50 dark:hover:bg-zinc-800' : 'bg-slate-50/50 dark:bg-zinc-900/30'} ${i < 7 ? 'border-t' : ''} ${(i % 7) === 0 ? 'border-l' : ''}`}
              >
                  {isValidDay && (
                      <>
                          <span className={`text-xs font-bold p-1 w-7 h-7 flex items-center justify-center mb-1 rounded-full ${
                              new Date().toDateString() === currentDayDate.toDateString() 
                              ? 'bg-lime-400 text-black' 
                              : 'text-slate-500 dark:text-zinc-500'
                          }`}>
                              {dayNum}
                          </span>
                          
                          <div className="flex flex-col gap-1 overflow-y-auto max-h-[90px] custom-scrollbar">
                              {dayEvents.map((e, idx) => (
                                  <div 
                                    key={`${e.id}-${idx}`} 
                                    onClick={() => handleEventClick(e)}
                                    className={`px-2 py-1.5 rounded-md text-[10px] font-bold shadow-sm cursor-pointer border transition-all hover:brightness-110 flex items-center gap-1 mb-0.5 ${e.color}`}
                                  >
                                      {e.type === 'project' ? <Flag size={10} fill="currentColor"/> : <Briefcase size={10} />}
                                      <span className="truncate">{e.title}</span>
                                  </div>
                              ))}
                          </div>
                      </>
                  )}
              </div>
          );
      }
      return calendarDays;
  };

  return (
    <div className="h-full animate-enter flex flex-col pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
                    <CalendarIcon size={28} className="text-lime-500"/> 
                    全域行事曆
                </h2>
                <p className="text-slate-400 dark:text-zinc-500 mt-2 text-sm font-medium">
                    {isManagement ? '檢視所有專案進度與團隊任務分配。' : '檢視您的個人任務與參與專案的時程。'}
                </p>
            </div>
            
            <div className="flex items-center gap-4 bg-white dark:bg-zinc-800 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-700">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-xl transition-all text-slate-500 dark:text-zinc-400"><ChevronLeft size={20}/></button>
                <h2 className="text-lg font-black text-slate-800 dark:text-white w-32 text-center select-none">
                    {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
                </h2>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-xl transition-all text-slate-500 dark:text-zinc-400"><ChevronRight size={20}/></button>
            </div>
        </div>

        <div className="bg-white dark:bg-[#18181b] rounded-3xl p-1 border border-slate-200 dark:border-zinc-800 shadow-sm flex-1 flex flex-col overflow-hidden">
             {/* Days Header */}
             <div className="grid grid-cols-7 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 rounded-t-[20px]">
                {['週日', '週一', '週二', '週三', '週四', '週五', '週六'].map(day => (
                    <div key={day} className="py-3 text-center text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>
            {/* Calendar Body */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto custom-scrollbar bg-slate-100 dark:bg-zinc-900 gap-px border-l border-slate-200 dark:border-zinc-800">
                {renderCalendar()}
            </div>
        </div>

        {/* Edit Modal */}
        {isModalOpen && selectedEvent && createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                <div className="bg-white dark:bg-[#18181b] w-full max-w-lg rounded-[32px] shadow-2xl relative z-10 p-8 animate-enter flex flex-col max-h-[85vh] border border-slate-200 dark:border-zinc-700">
                    <div className="flex justify-between items-center mb-6 flex-shrink-0">
                        <h3 className="font-bold text-slate-800 dark:text-white text-xl">編輯任務</h3>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={24} className="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-white"/></button>
                    </div>
                    
                    <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">任務標題</label>
                            <input 
                                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-white outline-none focus:border-lime-500 transition-all"
                                value={editData.title}
                                onChange={e => setEditData({...editData, title: e.target.value})}
                                disabled={!isManagement}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">開始日期</label>
                                <input 
                                    type="date"
                                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-white outline-none focus:border-lime-500"
                                    value={editData.startDate || ''}
                                    onChange={e => setEditData({...editData, startDate: e.target.value})}
                                    disabled={!isManagement}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">結束日期</label>
                                <input 
                                    type="date"
                                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-white outline-none focus:border-lime-500"
                                    value={editData.dueDate || ''}
                                    onChange={e => setEditData({...editData, dueDate: e.target.value})}
                                    disabled={!isManagement}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">狀態</label>
                                <select 
                                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-white outline-none focus:border-lime-500"
                                    value={editData.status}
                                    onChange={e => setEditData({...editData, status: e.target.value as Status})}
                                    disabled={!isManagement} 
                                >
                                    {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">優先級</label>
                                <select 
                                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-white outline-none focus:border-lime-500"
                                    value={editData.priority}
                                    onChange={e => setEditData({...editData, priority: e.target.value as Priority})}
                                    disabled={!isManagement}
                                >
                                    {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">指派成員</label>
                            <select 
                                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-white outline-none focus:border-lime-500"
                                value={editData.assignee || ''}
                                onChange={e => setEditData({...editData, assignee: e.target.value})}
                                disabled={!isManagement}
                            >
                                <option value="">未指派</option>
                                {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-between mt-8 pt-4 border-t border-slate-50 dark:border-zinc-800">
                        {isManagement ? (
                            <button onClick={handleDeleteTask} className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2">
                                <Trash2 size={16}/> 刪除
                            </button>
                        ) : <div></div>}
                        <div className="flex gap-2">
                            <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-white">取消</button>
                            {isManagement && (
                                <button onClick={handleSaveTask} className="bg-lime-400 text-black px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-lime-500 shadow-lg flex items-center gap-2">
                                    <Save size={16}/> 儲存
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        )}
    </div>
  );
};
