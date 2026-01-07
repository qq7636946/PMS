
import React from 'react';
import { Project, Status } from '../types';
import { CheckCircle2, Layers, ListTodo, FolderOpen } from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  members: any[];
  onSelectProject: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ projects }) => {
  const totalProjects = projects.length;
  const allTasks = projects.flatMap(p => p.tasks || []);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === Status.DONE).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats = [
      { 
          label: '執行中專案', 
          value: totalProjects, 
          icon: FolderOpen, 
          color: 'text-slate-800 dark:text-white', 
          bg: 'bg-lime-400 text-black',
          sub: 'Active Projects'
      },
      { 
          label: '總任務數', 
          value: totalTasks, 
          icon: Layers, 
          color: 'text-slate-400 dark:text-zinc-400', 
          bg: 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-white',
          sub: 'Total Tasks'
      },
      { 
          label: '待辦事項', 
          value: pendingTasks, 
          icon: ListTodo, 
          color: 'text-slate-400 dark:text-zinc-400', 
          bg: 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-white',
          sub: 'Pending'
      },
      { 
          label: '已完成', 
          value: completedTasks, 
          icon: CheckCircle2, 
          color: 'text-lime-600 dark:text-lime-400', 
          bg: 'bg-slate-100 dark:bg-zinc-800 text-lime-600 dark:text-lime-400',
          sub: `${completionRate}% Rate`
      }
  ];

  return (
    <div className="w-full animate-enter">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-2">
          {stats.map((stat, idx) => (
              <div key={idx} className="bg-white dark:bg-[#18181b] rounded-[28px] p-6 border border-slate-200 dark:border-zinc-800 shadow-lg shadow-slate-200/50 dark:shadow-none flex flex-col justify-between h-40 group hover:border-lime-400/30 hover:shadow-xl dark:hover:shadow-glow transition-all duration-300">
                  <div className="flex justify-between items-start">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                          <stat.icon size={22} strokeWidth={2.5} />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400`}>
                          {stat.sub}
                      </span>
                  </div>
                  <div>
                      <h3 className={`text-4xl font-black ${stat.label === '已完成' ? 'text-lime-600 dark:text-lime-400' : 'text-slate-800 dark:text-white'} tracking-tight mt-4`}>{stat.value}</h3>
                      <p className="text-slate-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-wider mt-1">{stat.label}</p>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};
