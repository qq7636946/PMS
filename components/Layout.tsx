
import React, { useState, useEffect, useMemo } from 'react';
import { FolderKanban, Settings, Plus, Hexagon, Users, LogOut, Search, Bell, AlertCircle, LayoutDashboard, Menu, X, Megaphone, DollarSign, Image as ImageIcon, Trash2, CheckCircle2, Calendar, Sun, Moon } from 'lucide-react';
import { Member, Announcement, Project, Status, Priority } from '../types';

interface SidebarProps {
    activeView: string;
    setActiveView: (view: string) => void;
    onNewProject: () => void;
    onLogout?: () => void;
    currentUser: Member | null;
    isMobile?: boolean;
    onCloseMobile?: () => void;
}

const SidebarContent: React.FC<SidebarProps> = ({ activeView, setActiveView, onNewProject, onLogout, currentUser, isMobile, onCloseMobile }) => {
    const navItems = [
        { id: 'dashboard', label: '總覽儀表板', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Member'] },
        { id: 'projects', label: '專案列表', icon: FolderKanban, roles: ['Admin', 'Manager', 'Member'] },
        { id: 'calendar', label: '行事曆', icon: Calendar, roles: ['Admin', 'Manager', 'Member'] },
        { id: 'budget', label: '財務預算', icon: DollarSign, roles: ['Admin', 'Manager', 'SeniorMember'] },
        { id: 'gallery', label: '設計藝廊', icon: ImageIcon, roles: ['Admin', 'Manager', 'Member'] },
        { id: 'announcements', label: '系統公告', icon: Megaphone, roles: ['Admin', 'Manager', 'Member'] },
        { id: 'team', label: '團隊管理', icon: Users, roles: ['Admin'] },
        { id: 'settings', label: '系統設定', icon: Settings, roles: ['Admin', 'Manager', 'Member'] },
    ];

    const canCreateProject = currentUser && ['Admin', 'Manager', 'SeniorMember'].includes(currentUser.accessLevel);
    const visibleNavItems = navItems.filter(item =>
        currentUser && item.roles.includes(currentUser.accessLevel)
    );

    const handleNavClick = (id: string) => {
        setActiveView(id);
        if (isMobile && onCloseMobile) onCloseMobile();
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#18181b] border-r border-slate-200 dark:border-zinc-800 transition-colors duration-300 relative">
            {/* Brand */}
            <div className="h-20 flex items-center justify-between px-6 flex-shrink-0 border-b border-slate-100 dark:border-zinc-800/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-lime-400 rounded-xl flex items-center justify-center text-black shadow-glow flex-shrink-0">
                        <Hexagon size={20} strokeWidth={3} />
                    </div>
                    <span className="text-slate-900 dark:text-white font-black text-xl tracking-tight font-sans truncate">專案系統管理</span>
                </div>
                {isMobile && (
                    <button onClick={onCloseMobile} className="p-2 text-slate-400 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full">
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar flex flex-col gap-2 min-h-0">
                <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 px-3 flex-shrink-0">選單</div>

                <div className="space-y-1">
                    {visibleNavItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 text-sm font-bold group whitespace-nowrap overflow-hidden text-ellipsis ${activeView === item.id
                                ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20'
                                : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <item.icon size={20} className={`transition-colors flex-shrink-0 ${activeView === item.id ? 'text-black' : 'text-slate-400 dark:text-zinc-500 group-hover:text-slate-900 dark:group-hover:text-white'}`} strokeWidth={activeView === item.id ? 2.5 : 2} />
                            <span className="translate-y-[1px]">{item.label}</span>
                        </button>
                    ))}
                </div>

                {canCreateProject && (
                    <div className="mt-auto pt-4 pb-2 flex-shrink-0">
                        <div className="bg-slate-900 dark:bg-zinc-800 rounded-2xl p-5 text-white relative overflow-hidden group cursor-pointer hover:bg-slate-800 dark:hover:bg-zinc-700 transition-colors border border-transparent dark:border-zinc-700/50" onClick={onNewProject}>
                            <div className="flex items-center justify-between relative z-10">
                                <div className="overflow-hidden mr-2">
                                    <h4 className="font-bold text-sm mb-0.5 truncate text-lime-400">建立新專案</h4>
                                    <p className="text-slate-400 dark:text-zinc-400 text-[10px] font-medium truncate">開啟新的工作區</p>
                                </div>
                                <div className="w-10 h-10 bg-white/10 dark:bg-black/40 rounded-xl flex items-center justify-center text-lime-400 group-hover:bg-lime-400 group-hover:text-black transition-colors flex-shrink-0">
                                    <Plus size={20} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-zinc-800 flex-shrink-0">
                {onLogout && (
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl text-sm font-bold transition-colors"
                    >
                        <LogOut size={18} />
                        登出系統
                    </button>
                )}
            </div>
        </div>
    );
};

export const Layout: React.FC<{
    children: React.ReactNode;
    activeView: string;
    setActiveView: (v: string) => void;
    onNewProject: () => void;
    onLogout?: () => void;
    onSearch?: (query: string) => void;
    onNavigate?: (projectId: string, tab: string) => void;
    currentUser: Member | null;
    announcements?: Announcement[];
    onMarkAnnouncementAsRead?: (id: string) => void;
    projects?: Project[];
}> = ({ children, activeView, setActiveView, onNewProject, onLogout, onSearch, onNavigate, currentUser, announcements = [], onMarkAnnouncementAsRead, projects = [] }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [avatarError, setAvatarError] = useState(false);

    // Theme State
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return document.documentElement.classList.contains('dark');
        }
        return true;
    });

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            setIsDark(true);
        }
    };

    // Notification State
    const [activeNotifTab, setActiveNotifTab] = useState<'unread' | 'read'>('unread');
    const [localReadIds, setLocalReadIds] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem('nexus_read_notifs');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch { return new Set(); }
    });
    const [deletedIds, setDeletedIds] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem('nexus_deleted_notifs');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch { return new Set(); }
    });

    useEffect(() => { localStorage.setItem('nexus_read_notifs', JSON.stringify(Array.from(localReadIds))); }, [localReadIds]);
    useEffect(() => { localStorage.setItem('nexus_deleted_notifs', JSON.stringify(Array.from(deletedIds))); }, [deletedIds]);

    // Generate All Notifications based on Data
    const allNotifications = useMemo(() => {
        const list: any[] = [];
        if (!currentUser) return [];
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Announcement Notifications
        announcements.forEach(a => {
            const isTarget = a.targetMemberIds.length === 0 || a.targetMemberIds.includes(currentUser.id);
            if (isTarget) {
                list.push({
                    id: `ann-${a.id}`,
                    type: 'announcement',
                    title: a.title,
                    desc: a.content.substring(0, 40) + '...',
                    time: new Date(a.createdAt).toLocaleDateString(),
                    urgent: a.priority === 'High',
                    originalId: a.id,
                    isReadBackend: a.readBy.includes(currentUser.id)
                });
            }
        });

        projects.forEach(p => {
            const isMember = p.teamMembers.includes(currentUser.id) || ['Admin', 'Manager', 'SeniorMember'].includes(currentUser.accessLevel);
            if (!isMember) return;

            // High Risk Project Alert
            if (p.riskLevel === 'High') {
                list.push({ id: `risk-${p.id}`, type: 'project', title: `高風險專案警示`, desc: `專案 "${p.name}" 目前評估為高風險`, time: '現在', urgent: true, projectId: p.id, targetTab: 'content' });
            }

            // Project Due Soon
            if (p.dueDate) {
                const diff = new Date(p.dueDate).getTime() - now.getTime();
                const days = Math.ceil(diff / (1000 * 3600 * 24));
                if (days >= 0 && days <= 7 && p.progress < 100) {
                    list.push({ id: `due-${p.id}`, type: 'project', title: `專案即將到期`, desc: `"${p.name}" 剩餘 ${days} 天`, time: '截止在即', urgent: true, projectId: p.id, targetTab: 'schedule' });
                }

                // Project Behind Schedule
                if (p.startDate && p.progress < 100) {
                    const totalDays = (new Date(p.dueDate).getTime() - new Date(p.startDate).getTime()) / (1000 * 3600 * 24);
                    const elapsedDays = (now.getTime() - new Date(p.startDate).getTime()) / (1000 * 3600 * 24);
                    const expectedProgress = Math.min(100, (elapsedDays / totalDays) * 100);
                    if (p.progress < expectedProgress - 20) {
                        list.push({ id: `behind-${p.id}`, type: 'project', title: `專案進度落後`, desc: `"${p.name}" 進度 ${p.progress}% (預期 ${Math.round(expectedProgress)}%)`, time: '需關注', urgent: true, projectId: p.id, targetTab: 'content' });
                    }
                }
            }

            // Budget Warning (80%+)
            if (p.budget && Array.isArray(p.transactions)) {
                const totalBudget = parseFloat(p.budget) || 0;
                const spent = p.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                const percentage = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;
                if (percentage >= 80 && ['Admin', 'Manager', 'SeniorMember'].includes(currentUser.accessLevel)) {
                    list.push({ id: `budget-${p.id}`, type: 'budget', title: `預算使用警示`, desc: `"${p.name}" 已使用 ${Math.round(percentage)}% 預算`, time: '財務提醒', urgent: percentage >= 95, projectId: p.id, targetTab: 'content' });
                }
            }

            // Task Notifications
            if (Array.isArray(p.tasks)) {
                // Critical Tasks
                const criticalTasks = p.tasks.filter(t => t.priority === Priority.CRITICAL && t.status !== Status.DONE);
                if (criticalTasks.length > 0) {
                    list.push({ id: `task-crit-${p.id}`, type: 'task', title: `有緊急任務未完成`, desc: `"${p.name}" 有 ${criticalTasks.length} 個緊急任務`, time: '待辦事項', urgent: true, projectId: p.id, targetTab: 'tasks' });
                }

                // High Priority Tasks
                const highPriorityTasks = p.tasks.filter(t => t.priority === Priority.HIGH && t.status !== Status.DONE);
                if (highPriorityTasks.length > 0) {
                    list.push({ id: `task-high-${p.id}`, type: 'task', title: `高優先級任務提醒`, desc: `"${p.name}" 有 ${highPriorityTasks.length} 個高優先級任務`, time: '待處理', urgent: false, projectId: p.id, targetTab: 'tasks' });
                }

                // Overdue Tasks
                const overdueTasks = p.tasks.filter(t => {
                    if (!t.dueDate || t.status === Status.DONE) return false;
                    return new Date(t.dueDate) < now;
                });
                if (overdueTasks.length > 0) {
                    list.push({ id: `task-overdue-${p.id}`, type: 'task', title: `任務已逾期`, desc: `"${p.name}" 有 ${overdueTasks.length} 個逾期任務`, time: '逾期', urgent: true, projectId: p.id, targetTab: 'tasks' });
                }

                // Tasks Due Soon (3 days)
                const dueSoonTasks = p.tasks.filter(t => {
                    if (!t.dueDate || t.status === Status.DONE) return false;
                    const taskDiff = new Date(t.dueDate).getTime() - now.getTime();
                    const taskDays = Math.ceil(taskDiff / (1000 * 3600 * 24));
                    return taskDays >= 0 && taskDays <= 3;
                });
                if (dueSoonTasks.length > 0) {
                    list.push({ id: `task-soon-${p.id}`, type: 'task', title: `任務即將到期`, desc: `"${p.name}" 有 ${dueSoonTasks.length} 個任務將在 3 天內到期`, time: '3天內', urgent: false, projectId: p.id, targetTab: 'tasks' });
                }
            }

            // Chat Message Notifications (24 hours, not from current user)
            if (Array.isArray(p.chatMessages)) {
                const recentMessages = p.chatMessages.filter(msg => {
                    if (msg.senderId === currentUser.id) return false;
                    const msgTime = new Date(msg.timestamp);
                    return msgTime > oneDayAgo;
                });
                if (recentMessages.length > 0) {
                    const sender = recentMessages[recentMessages.length - 1];
                    list.push({ id: `chat-${p.id}`, type: 'chat', title: `新的討論訊息`, desc: `"${p.name}" 有 ${recentMessages.length} 則新訊息`, time: '24小時內', urgent: false, projectId: p.id, targetTab: 'chat' });
                }
            }

            // Notes Update Notifications (24 hours, not by current user)
            if (p.notesLastModified && p.notesLastModifiedBy && p.notesLastModifiedBy !== currentUser.id) {
                const notesTime = new Date(p.notesLastModified);
                if (notesTime > oneDayAgo) {
                    list.push({ id: `notes-${p.id}`, type: 'notes', title: `筆記已更新`, desc: `"${p.name}" 的專案筆記有新的更新`, time: '24小時內', urgent: false, projectId: p.id, targetTab: 'notes' });
                }
            }

            // Proofing Notifications
            if (Array.isArray(p.proofing)) {
                const pendingProofing = p.proofing.filter(pr => {
                    const proofDate = new Date(pr.date);
                    return proofDate > oneDayAgo;
                });
                if (pendingProofing.length > 0) {
                    list.push({ id: `proof-${p.id}`, type: 'proofing', title: `待審核校稿項目`, desc: `"${p.name}" 有 ${pendingProofing.length} 個新的校稿版本`, time: '待審核', urgent: false, projectId: p.id, targetTab: 'proofing' });
                }
            }

            // New Transaction Notifications (Admin/Manager/SeniorMember only)
            // Only notify when new income transactions are added within 24 hours
            if (['Admin', 'Manager', 'SeniorMember'].includes(currentUser.accessLevel)) {
                if (Array.isArray(p.transactions)) {
                    const recentIncomeTransactions = p.transactions.filter(tx => {
                        if (tx.type !== 'income') return false;
                        const txDate = new Date(tx.date);
                        return txDate > oneDayAgo;
                    });

                    if (recentIncomeTransactions.length > 0) {
                        const totalAmount = recentIncomeTransactions.reduce((sum, tx) => sum + tx.amount, 0);
                        list.push({
                            id: `income-${p.id}`,
                            type: 'payment',
                            title: `新增收入記錄`,
                            desc: `"${p.name}" 有 ${recentIncomeTransactions.length} 筆新收入 ($${totalAmount.toLocaleString()})`,
                            time: '24小時內',
                            urgent: false,
                            projectId: p.id,
                            targetTab: 'content'
                        });
                    }
                }
            }
        });

        return list;
    }, [announcements, projects, currentUser]);

    const displayedNotifications = allNotifications.filter(n => {
        if (deletedIds.has(n.id)) return false;
        const isRead = n.type === 'announcement' ? (n.isReadBackend || localReadIds.has(n.id)) : localReadIds.has(n.id);
        return activeNotifTab === 'unread' ? !isRead : isRead;
    });

    const unreadCount = allNotifications.filter(n => {
        if (deletedIds.has(n.id)) return false;
        return n.type === 'announcement' ? (!n.isReadBackend && !localReadIds.has(n.id)) : !localReadIds.has(n.id);
    }).length;

    const handleNotificationClick = (n: any) => {
        setLocalReadIds(prev => new Set(prev).add(n.id));
        if (n.type === 'announcement') {
            setActiveView('announcements');
            if (onMarkAnnouncementAsRead && n.originalId) onMarkAnnouncementAsRead(n.originalId);
        } else if (n.projectId && onNavigate) {
            onNavigate(n.projectId, n.targetTab);
        }
        setShowNotifications(false);
    };

    const handleDeleteNotification = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeletedIds(prev => new Set(prev).add(id));
    };

    const markAllAsRead = () => {
        const newReadIds = new Set(localReadIds);
        allNotifications.forEach(n => {
            newReadIds.add(n.id);
            if (n.type === 'announcement' && onMarkAnnouncementAsRead && n.originalId) onMarkAnnouncementAsRead(n.originalId);
        });
        setLocalReadIds(newReadIds);
    };

    return (
        <div className="flex w-full h-full bg-slate-50 dark:bg-[#09090b] overflow-hidden text-slate-900 dark:text-zinc-100 transition-colors duration-300" onClick={() => { setShowNotifications(false); setShowUserMenu(false); }}>

            {/* Desktop Sidebar */}
            <div className="hidden md:block w-[280px] h-full z-30 flex-shrink-0 shadow-xl">
                <SidebarContent activeView={activeView} setActiveView={setActiveView} onNewProject={onNewProject} onLogout={onLogout} currentUser={currentUser} />
            </div>

            {/* Mobile Sidebar */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
                    <div className="absolute top-0 left-0 h-full w-[85%] max-w-[280px] bg-white dark:bg-[#18181b] shadow-2xl animate-enter border-r border-slate-200 dark:border-zinc-800">
                        <SidebarContent activeView={activeView} setActiveView={setActiveView} onNewProject={onNewProject} onLogout={onLogout} currentUser={currentUser} isMobile={true} onCloseMobile={() => setMobileMenuOpen(false)} />
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative bg-slate-50 dark:bg-[#09090b]">
                {/* Header */}
                <header className="h-20 flex items-center justify-between px-6 flex-shrink-0 z-20 bg-slate-50/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-zinc-800/30">
                    <div className="flex items-center gap-4">
                        <button onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(true); }} className="md:hidden p-2 -ml-2 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                            <Menu size={24} />
                        </button>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[150px] md:max-w-none">
                                Hi, {currentUser?.name || 'User'} <span className="inline-block animate-pulse">👋</span>
                            </h2>
                            <p className="hidden md:block text-slate-500 dark:text-zinc-500 text-xs font-bold mt-0.5">Let's make something amazing today.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="hidden md:block relative group bg-white dark:bg-[#27272a] rounded-2xl shadow-inner border border-slate-200 dark:border-zinc-800/50 p-1 w-64 transition-all focus-within:border-slate-300 dark:focus-within:border-zinc-600 focus-within:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-focus-within:text-lime-500 dark:group-focus-within:text-lime-400 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="搜尋專案..."
                                onChange={(e) => onSearch && onSearch(e.target.value)}
                                className="bg-transparent border-none py-2.5 pl-10 pr-4 w-full text-sm focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-zinc-600 font-medium text-slate-800 dark:text-white"
                            />
                        </div>
                        <button className="md:hidden w-10 h-10 bg-white dark:bg-[#27272a] rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400">
                            <Search size={20} />
                        </button>

                        {/* Theme Toggle (New Location) */}
                        <button
                            onClick={toggleTheme}
                            className="w-12 h-12 rounded-2xl border flex items-center justify-center transition-all bg-white dark:bg-[#27272a] border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800"
                            title="切換主題"
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                                className={`relative w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${showNotifications ? 'bg-lime-400 text-black border-lime-400 shadow-glow' : 'bg-white dark:bg-[#27272a] border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-slate-50 dark:ring-zinc-900 animate-pulse"></span>}
                            </button>
                            {showNotifications && (
                                <div className="absolute top-full right-0 mt-4 w-[320px] md:w-96 bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden animate-enter z-50 flex flex-col max-h-[500px]" onClick={e => e.stopPropagation()}>
                                    <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-900/50">
                                        <h4 className="font-bold text-slate-800 dark:text-white text-lg">通知中心</h4>
                                        <button onClick={markAllAsRead} className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:text-lime-500 dark:hover:text-lime-300 transition-colors">全部已讀</button>
                                    </div>

                                    <div className="flex border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
                                        <button onClick={() => setActiveNotifTab('unread')} className={`flex-1 py-3 text-xs font-bold transition-all ${activeNotifTab === 'unread' ? 'text-lime-600 dark:text-lime-400 border-b-2 border-lime-500 dark:border-lime-400 bg-white/50 dark:bg-white/5' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300'}`}>未讀 ({unreadCount})</button>
                                        <button onClick={() => setActiveNotifTab('read')} className={`flex-1 py-3 text-xs font-bold transition-all ${activeNotifTab === 'read' ? 'text-lime-600 dark:text-lime-400 border-b-2 border-lime-500 dark:border-lime-400 bg-white/50 dark:bg-white/5' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300'}`}>已讀</button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-[#18181b]">
                                        {displayedNotifications.length > 0 ? displayedNotifications.map(n => (
                                            <div key={n.id} onClick={() => handleNotificationClick(n)} className="p-5 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-slate-100 dark:border-zinc-800 cursor-pointer flex gap-4 group relative">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${n.urgent ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-500' : 'bg-lime-100 dark:bg-lime-400/20 text-lime-600 dark:text-lime-400'}`}>
                                                    {n.type === 'project' ? <AlertCircle size={18} /> : n.type === 'announcement' ? <Megaphone size={18} /> : <Bell size={18} />}
                                                </div>
                                                <div className="flex-1 min-w-0 pr-6">
                                                    <h5 className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors flex items-center gap-2">
                                                        {n.type === 'announcement' && <span className="text-[10px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/30">公告</span>}
                                                        <span className="truncate">{n.title}</span>
                                                    </h5>
                                                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{n.desc}</p>
                                                    <p className="text-[10px] text-slate-400 dark:text-zinc-600 mt-2 font-bold uppercase tracking-wider">{n.time}</p>
                                                </div>
                                                <button onClick={(e) => handleDeleteNotification(e, n.id)} className="absolute right-4 top-5 p-2 text-slate-400 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"><Trash2 size={14} /></button>
                                            </div>
                                        )) : (
                                            <div className="p-10 text-center text-slate-400 dark:text-zinc-600 text-sm font-bold flex flex-col items-center">
                                                <Bell size={32} className="mb-3 opacity-20" />
                                                沒有{activeNotifTab === 'unread' ? '未讀' : '已讀'}通知
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Menu */}
                        <div className="relative">
                            <div
                                onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                                className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 text-slate-700 dark:text-white flex items-center justify-center font-bold text-lg shadow-sm border border-slate-200 dark:border-zinc-700 cursor-pointer hover:scale-105 transition-all overflow-hidden group"
                            >
                                {!avatarError && currentUser?.avatar ? (
                                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" onError={() => setAvatarError(true)} />
                                ) : (
                                    currentUser?.name.charAt(0) || 'U'
                                )}
                            </div>
                            {showUserMenu && (
                                <div className="absolute top-full right-0 mt-4 w-56 bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden animate-enter z-50">
                                    <div className="p-5 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
                                        <p className="font-bold text-slate-800 dark:text-white truncate text-lg">{currentUser?.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-zinc-500 font-medium mt-0.5">{currentUser?.role}</p>
                                    </div>
                                    <button onClick={() => setActiveView('settings')} className="w-full text-left px-5 py-3.5 text-sm font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-3 transition-colors">
                                        <Settings size={18} /> 帳號設定
                                    </button>
                                    <button onClick={onLogout} className="w-full text-left px-5 py-3.5 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-3 border-t border-slate-100 dark:border-zinc-800">
                                        <LogOut size={18} /> 登出
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 py-8 custom-scrollbar">
                    <div className="w-full pb-20 md:pb-10 max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};
