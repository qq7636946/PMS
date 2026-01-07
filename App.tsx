import React, { useState, useEffect, ReactNode, Component } from 'react';
import { createPortal } from 'react-dom';
import { Layout } from './components/Layout';
import { ProjectView } from './components/ProjectView';
import { TeamView } from './components/TeamView';
import { SettingsView } from './components/SettingsView';
import { LoginView } from './components/LoginView';
import { Dashboard } from './components/Dashboard';
import { AnnouncementView } from './components/AnnouncementView';
import { BudgetView } from './components/BudgetView';
import { GalleryView } from './components/GalleryView';
import { CalendarView } from './components/CalendarView';
import { INITIAL_PROJECTS, INITIAL_MEMBERS, DEFAULT_STAGES } from './constants';
import { Project, Member, Announcement } from './types';
import { Plus, Folder, Camera, Trash2, Pencil, CheckCircle2, Zap, LayoutGrid, Loader2, RefreshCw, AlertTriangle, AlertOctagon, X, ChevronRight, GripVertical, User, Check, Calendar, Layers, Tag } from 'lucide-react';

import { auth, db, createSecondaryUser } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';

interface ErrorBoundaryProps {
    children?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    public state: ErrorBoundaryState = {
        hasError: false,
        error: null
    };

    static getDerivedStateFromError(error: any): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReset = () => {
        try {
            window.location.reload();
        } catch (e) { window.location.reload(); }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen w-full flex items-center justify-center bg-bg text-white p-6">
                    <div className="bg-bg-card p-8 rounded-[32px] shadow-2xl max-w-md w-full text-center border border-border">
                        <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <AlertOctagon size={40} />
                        </div>
                        <h2 className="text-2xl font-black mb-2">系統發生錯誤</h2>
                        <p className="text-zinc-400 mb-6 text-sm font-medium">資料讀取異常，請嘗試重整或重置資料。</p>
                        <div className="bg-zinc-900 p-4 rounded-xl mb-6 text-left overflow-auto max-h-32 border border-zinc-800">
                            <code className="text-[10px] text-zinc-500 font-mono break-all">{this.state.error?.toString()}</code>
                        </div>
                        <button onClick={this.handleReset} className="w-full bg-white text-black py-3.5 rounded-xl font-bold hover:bg-zinc-200 transition-all flex items-center justify-center gap-2">
                            <RefreshCw size={18} /> 重整頁面
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

const PROJECT_CATEGORIES = ['網頁設計', 'App 開發', '系統系統', '行銷活動', '維護合約', '其他'];

export const App: React.FC = () => {
    const [activeView, setActiveView] = useState('dashboard');
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    const [storageError, setStorageError] = useState(false);

    const [projects, setProjects] = useState<Project[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [teams, setTeams] = useState<string[]>(['A團隊', 'B團隊', 'C團隊', 'D團隊']); // Custom teams

    const [defaultStages, setDefaultStages] = useState<string[]>(DEFAULT_STAGES);
    const [currentUser, setCurrentUser] = useState<Member | null>(null);

    // ★ 關鍵修復：這裡加了「資料濾水器」，確保陣列絕對不會是 undefined
    useEffect(() => {
        // 監聽專案
        const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
            const data = snapshot.docs.map(doc => {
                const raw = doc.data();
                // 強制補全缺少的陣列，防止 .includes() 報錯
                return {
                    ...raw,
                    id: raw.id || doc.id,
                    teamMembers: Array.isArray(raw.teamMembers) ? raw.teamMembers : [],
                    completedStages: Array.isArray(raw.completedStages) ? raw.completedStages : [],
                    tasks: Array.isArray(raw.tasks) ? raw.tasks : [],
                    chatMessages: Array.isArray(raw.chatMessages) ? raw.chatMessages : [],
                    transactions: Array.isArray(raw.transactions) ? raw.transactions : [],
                    proofing: Array.isArray(raw.proofing) ? raw.proofing : [],
                    stages: Array.isArray(raw.stages) ? raw.stages : DEFAULT_STAGES,
                } as Project;
            });
            setProjects(data.sort((a, b) => Number(b.id) - Number(a.id)));
        });

        // 監聽成員
        const unsubMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
            const data = snapshot.docs.map(doc => doc.data() as Member);
            if (data.length > 0) {
                setMembers(data);
            } else {
                setMembers([]);
            }
        });

        // 監聽公告
        const unsubAnnouncements = onSnapshot(collection(db, 'announcements'), (snapshot) => {
            const data = snapshot.docs.map(doc => {
                const raw = doc.data();
                return {
                    ...raw,
                    readBy: Array.isArray(raw.readBy) ? raw.readBy : []
                } as Announcement;
            });
            setAnnouncements(data);
        });

        // 監聽團隊
        const unsubTeams = onSnapshot(collection(db, 'teams'), (snapshot) => {
            if (snapshot.empty) {
                // 如果沒有團隊資料，使用預設值
                setTeams(['A團隊', 'B團隊', 'C團隊', 'D團隊']);
            } else {
                const data = snapshot.docs.map(doc => doc.data().name as string);
                setTeams(data.length > 0 ? data : ['A團隊', 'B團隊', 'C團隊', 'D團隊']);
            }
        });

        return () => {
            unsubProjects();
            unsubMembers();
            unsubAnnouncements();
            unsubTeams();
        };
    }, []);

    // Generate Notifications (現在這裡安全了，因為 teamMembers 一定是陣列)
    useEffect(() => {
        if (!currentUser) return;

        const missingInfoProjects = projects.filter(p => {
            // 這裡加上了安全防護 (|| []) 雙重保險
            const members = p.teamMembers || [];
            const isMember = members.includes(currentUser.id) || currentUser.accessLevel !== 'Member';
            const tasks = Array.isArray(p.tasks) ? p.tasks : [];
            return isMember && (tasks.length === 0 || !p.dueDate);
        });
    }, [projects, currentUser]);

    // Firebase Auth Listener
    useEffect(() => {
        let isMounted = true;
        let unsubscribe: () => void;
        const timeoutId = setTimeout(() => {
            if (isMounted && isAuthChecking) {
                setIsAuthChecking(false);
            }
        }, 2000);

        if (auth) {
            try {
                unsubscribe = onAuthStateChanged(auth, async (user) => {
                    if (!isMounted) return;
                    clearTimeout(timeoutId);

                    if (currentUser && currentUser.email === 'admin@nexus.ai') {
                        setIsAuthChecking(false);
                        return;
                    }

                    if (user) {
                        const email = user.email?.toLowerCase();
                        const isSuperAdmin = email === 'qq7636946@gmail.com';

                        const foundMember = members.find(m => m.email.toLowerCase() === email);

                        if (foundMember) {
                            // Check if account is suspended
                            if (foundMember.status === 'Suspended') {
                                // Sign out suspended users immediately
                                await signOut(auth);
                                setCurrentUser(null);
                                alert('您的帳號已被停用，無法登入系統。請聯繫管理員。');
                                return;
                            }

                            let updatedUser = foundMember;
                            if (isSuperAdmin && (foundMember.accessLevel !== 'Admin' || foundMember.role !== 'CEO')) {
                                updatedUser = { ...foundMember, accessLevel: 'Admin', role: 'CEO' };
                            }
                            setCurrentUser(updatedUser);
                        } else {
                            const newUser: Member = {
                                id: user.uid,
                                name: user.displayName || user.email?.split('@')[0] || 'New User',
                                email: user.email || '',
                                role: isSuperAdmin ? 'CEO' : 'Member',
                                accessLevel: isSuperAdmin ? 'Admin' : 'Member',
                                status: 'Active',
                                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'U')}&background=random`
                            };
                            setCurrentUser(newUser);
                        }
                    } else {
                        setCurrentUser(null);
                    }
                    setIsAuthChecking(false);
                });
            } catch (e) {
                console.error("Auth Error", e);
                setIsAuthChecking(false);
            }
        } else {
            clearTimeout(timeoutId);
            setIsAuthChecking(false);
        }
        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
            if (unsubscribe) unsubscribe();
        };
    }, [members]);

    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [initialProjectTab, setInitialProjectTab] = useState<string | undefined>(undefined);
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);

    const [newProjectData, setNewProjectData] = useState({
        name: '',
        client: '',
        category: '',
        description: '',
        risk: 'Low' as 'Low' | 'Medium' | 'High',
        budget: '',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        paymentStatus: { depositPaid: false, interim1Paid: false, interim2Paid: false, finalPaid: false }
    });
    const [newProjectStages, setNewProjectStages] = useState<string[]>([]);
    const [newStageInput, setNewStageInput] = useState('');
    const [newProjectMembers, setNewProjectMembers] = useState<string[]>([]);

    // Category editing states
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editCategoryValue, setEditCategoryValue] = useState('');

    // Project team selection
    const [newProjectTeam, setNewProjectTeam] = useState<string>('');

    useEffect(() => {
        if (showNewProjectModal) {
            setNewProjectStages([...defaultStages]);
            if (currentUser && !newProjectMembers.includes(currentUser.id)) {
                setNewProjectMembers([currentUser.id]);
            }
            // Auto-assign team for non-admin users
            if (currentUser && currentUser.accessLevel !== 'Admin') {
                setNewProjectTeam(currentUser.team || '');
            } else {
                setNewProjectTeam('');
            }
        }
    }, [showNewProjectModal, defaultStages, currentUser]);

    const currentProject = (selectedProjectId && Array.isArray(projects))
        ? projects.find(p => p && p.id === selectedProjectId) || null
        : null;

    const filteredProjects = Array.isArray(projects) ? projects.filter(p => {
        if (!p || typeof p !== 'object') return false;

        const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.clientName || '').toLowerCase().includes(searchQuery.toLowerCase());

        let hasAccess = false;
        if (currentUser) {
            // Admin can see ALL projects regardless of team
            if (currentUser.accessLevel === 'Admin') {
                hasAccess = true;
            }
            // Manager can see all projects (existing behavior)
            else if (currentUser.accessLevel === 'Manager') {
                hasAccess = true;
            }
            // Team-based filtering for other members
            else {
                // Check if user's team matches project's team
                const userTeam = currentUser.team;
                const projectTeam = p.team;

                // If user has a team, only show projects from their team OR projects they're assigned to
                if (userTeam) {
                    const isTeamProject = projectTeam === userTeam;
                    const isAssigned = (p.teamMembers || []).includes(currentUser.id);
                    hasAccess = isTeamProject || isAssigned;
                } else {
                    // If user has no team, only show assigned projects
                    const members = p.teamMembers || [];
                    hasAccess = members.includes(currentUser.id);
                }
            }
        }

        return matchesSearch && hasAccess;
    }) : [];

    const handleUpdateProject = async (updatedProject: Project) => {
        try {
            await setDoc(doc(db, "projects", updatedProject.id), updatedProject);
        } catch (error) {
            console.error("更新失敗", error);
        }
    };

    // Category editing handlers
    const handleStartEditCategory = (category: string) => {
        setEditingCategory(category);
        setEditCategoryValue(category);
    };

    const handleSaveCategory = async (oldCategory: string) => {
        if (!editCategoryValue.trim() || editCategoryValue === oldCategory) {
            setEditingCategory(null);
            return;
        }

        // Update all projects with this category
        const projectsToUpdate = projects.filter(p => p.category === oldCategory);
        try {
            await Promise.all(
                projectsToUpdate.map(p =>
                    setDoc(doc(db, "projects", p.id), { ...p, category: editCategoryValue.trim() })
                )
            );
            setEditingCategory(null);
        } catch (error) {
            console.error("分類更新失敗", error);
            alert("分類更新失敗");
        }
    };

    const handleCancelEditCategory = () => {
        setEditingCategory(null);
        setEditCategoryValue('');
    };

    const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        if (window.confirm("確定要刪除此專案嗎？此操作無法復原。")) {
            try {
                await deleteDoc(doc(db, "projects", projectId));
                if (selectedProjectId === projectId) {
                    setSelectedProjectId(null);
                    setActiveView('dashboard');
                }
            } catch (error) {
                console.error("刪除失敗", error);
            }
        }
    };

    // Team Management Functions (Admin Only)
    const handleAddTeam = async (teamName: string) => {
        if (!currentUser || currentUser.accessLevel !== 'Admin') {
            alert('只有系統管理員可以新增團隊');
            return;
        }
        if (!teamName.trim()) {
            alert('請輸入團隊名稱');
            return;
        }
        if (teams.includes(teamName.trim())) {
            alert('此團隊名稱已存在');
            return;
        }
        try {
            const teamId = Date.now().toString();
            await setDoc(doc(db, "teams", teamId), { name: teamName.trim() });
        } catch (error) {
            console.error("新增團隊失敗", error);
            alert("新增團隊失敗");
        }
    };

    const handleUpdateTeam = async (oldName: string, newName: string) => {
        if (!currentUser || currentUser.accessLevel !== 'Admin') {
            alert('只有系統管理員可以編輯團隊');
            return;
        }
        if (!newName.trim() || newName === oldName) return;
        if (teams.includes(newName.trim()) && newName !== oldName) {
            alert('此團隊名稱已存在');
            return;
        }
        try {
            // Find team document by name
            const teamsSnapshot = await getDocs(collection(db, "teams"));
            const teamDoc = teamsSnapshot.docs.find(doc => doc.data().name === oldName);
            if (teamDoc) {
                await setDoc(doc(db, "teams", teamDoc.id), { name: newName.trim() });

                // Update all members with this team
                const membersToUpdate = members.filter(m => m.team === oldName);
                await Promise.all(
                    membersToUpdate.map(m =>
                        setDoc(doc(db, "members", m.id), { ...m, team: newName.trim() })
                    )
                );

                // Update all projects with this team
                const projectsToUpdate = projects.filter(p => p.team === oldName);
                await Promise.all(
                    projectsToUpdate.map(p =>
                        setDoc(doc(db, "projects", p.id), { ...p, team: newName.trim() })
                    )
                );
            }
        } catch (error) {
            console.error("更新團隊失敗", error);
            alert("更新團隊失敗");
        }
    };

    const handleDeleteTeam = async (teamName: string) => {
        if (!currentUser || currentUser.accessLevel !== 'Admin') {
            alert('只有系統管理員可以刪除團隊');
            return;
        }
        if (!window.confirm(`確定要刪除「${teamName}」嗎？此操作無法復原。`)) return;

        try {
            // Find and delete team document
            const teamsSnapshot = await getDocs(collection(db, "teams"));
            const teamDoc = teamsSnapshot.docs.find(doc => doc.data().name === teamName);
            if (teamDoc) {
                await deleteDoc(doc(db, "teams", teamDoc.id));

                // Remove team from members
                const membersToUpdate = members.filter(m => m.team === teamName);
                await Promise.all(
                    membersToUpdate.map(m =>
                        setDoc(doc(db, "members", m.id), { ...m, team: undefined })
                    )
                );

                // Remove team from projects
                const projectsToUpdate = projects.filter(p => p.team === teamName);
                await Promise.all(
                    projectsToUpdate.map(p =>
                        setDoc(doc(db, "projects", p.id), { ...p, team: undefined })
                    )
                );
            }
        } catch (error) {
            console.error("刪除團隊失敗", error);
            alert("刪除團隊失敗");
        }
    };

    const handleLocalLogin = () => {
        const mockAdmin: Member = {
            id: 'local-admin',
            name: '本機管理員',
            email: 'admin@nexus.ai',
            role: 'Full Stack Developer',
            accessLevel: 'Admin',
            status: 'Active',
            avatar: 'https://ui-avatars.com/api/?name=Local+Admin&background=0F172A&color=fff'
        };
        setCurrentUser(mockAdmin);
        setActiveView('dashboard');
    };

    const handleAddMember = async (memberData: Member): Promise<void> => {
        try {
            const firebaseUid = await createSecondaryUser(memberData.email, memberData.password || '123456');
            const newMember = { ...memberData, id: firebaseUid };

            await setDoc(doc(db, "members", firebaseUid), newMember);

            alert(`成功建立帳號：${newMember.email}`);
        } catch (error: any) {
            console.error("Error creating user:", error);
            if (error.code === 'auth/email-already-in-use') {
                alert("錯誤：此 Email 已經被註冊過了。");
            } else if (error.code === 'auth/weak-password') {
                alert("錯誤：密碼強度不足 (需至少6位數)。");
            } else {
                alert(`建立失敗：${error.message}`);
            }
            throw error;
        }
    };

    const handleUpdateMember = async (updatedMember: Member) => {
        try {
            await setDoc(doc(db, "members", updatedMember.id), updatedMember);
            if (currentUser && currentUser.id === updatedMember.id) {
                setCurrentUser(updatedMember);
            }
        } catch (error) {
            console.error("更新成員失敗", error);
        }
    };

    const handleRemoveMember = async (id: string) => {
        if (window.confirm("注意：這只會從「專案系統列表」中移除成員，無法刪除對方的 Firebase 登入帳號。\n\n若要完全刪除該帳號的登入權限，請前往 Firebase Console 操作。\n\n確定要繼續嗎？")) {
            try {
                await deleteDoc(doc(db, "members", id));
                if (currentUser && currentUser.id === id) handleLogout();
            } catch (error) {
                console.error("移除成員失敗", error);
            }
        }
    };

    const handleLogout = () => {
        if (auth) {
            signOut(auth).then(() => {
                setCurrentUser(null);
                setActiveView('dashboard');
                setSelectedProjectId(null);
            });
        } else {
            setCurrentUser(null);
            setActiveView('dashboard');
            setSelectedProjectId(null);
        }
    };

    const handleNavigateToProject = (projectId: string, tab: string) => {
        setSelectedProjectId(projectId);
        setInitialProjectTab(tab);
        setActiveView('projects');
    };

    const handleCreateAnnouncement = async (announcement: Announcement) => {
        try {
            await setDoc(doc(db, "announcements", announcement.id), announcement);
        } catch (e) { console.error(e); }
    };

    const handleUpdateAnnouncement = async (updatedAnnouncement: Announcement) => {
        try {
            await setDoc(doc(db, "announcements", updatedAnnouncement.id), updatedAnnouncement);
        } catch (e) { console.error(e); }
    };

    const handleDeleteAnnouncement = async (id: string) => {
        try {
            await deleteDoc(doc(db, "announcements", id));
        } catch (e) { console.error(e); }
    };

    const handleMarkAnnouncementRead = async (id: string) => {
        if (!currentUser) return;
        const target = announcements.find(a => a.id === id);
        if (target) {
            // 安全檢查：確保 readBy 存在
            const readBy = target.readBy || [];
            if (!readBy.includes(currentUser.id)) {
                const updated = { ...target, readBy: [...readBy, currentUser.id] };
                await setDoc(doc(db, "announcements", id), updated);
            }
        }
    };

    const handleCreateProject = async () => {
        if (newProjectStages.length === 0) {
            alert("請至少設定一個專案階段");
            return;
        }

        const newProject: Project = {
            id: Date.now().toString(),
            name: newProjectData.name || '新專案',
            category: newProjectData.category || '未分類',
            clientName: newProjectData.client || '未設定客戶',
            clientAvatar: '',
            description: newProjectData.description || '',
            stage: newProjectStages[0],
            stages: newProjectStages,
            completedStages: [],
            progress: 0,
            riskLevel: newProjectData.risk,
            team: newProjectTeam || undefined, // Add team assignment
            teamMembers: newProjectMembers,
            startDate: newProjectData.startDate,
            dueDate: newProjectData.dueDate,
            budget: newProjectData.budget,
            paymentStatus: newProjectData.paymentStatus,
            links: {},
            notes: '',
            tasks: [],
            chatMessages: [],
            transactions: [],
            proofing: [],
            unreadCount: 0
        };

        try {
            await setDoc(doc(db, "projects", newProject.id), newProject);

            setSelectedProjectId(newProject.id);
            setActiveView('projects');
            setShowNewProjectModal(false);
            setNewProjectData({
                name: '', client: '', category: '', description: '', risk: 'Low', budget: '',
                startDate: new Date().toISOString().split('T')[0],
                dueDate: '',
                paymentStatus: { depositPaid: false, interim1Paid: false, interim2Paid: false, finalPaid: false }
            });
            setNewProjectMembers([]);
        } catch (error) {
            console.error("建立失敗", error);
            alert("建立失敗，請檢查網路");
        }
    };

    const handleProjectImageUpdate = (e: React.ChangeEvent<HTMLInputElement>, projectId: string) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 500 * 1024) { alert("圖片過大！請上傳小於 500KB 的圖片以節省儲存空間。"); return; }
            const reader = new FileReader();
            reader.onloadend = () => {
                const project = projects.find(p => p.id === projectId);
                if (project) handleUpdateProject({ ...project, clientAvatar: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveProjectImage = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        if (window.confirm('確定要移除此專案的封面圖片嗎？')) {
            const project = projects.find(p => p.id === projectId);
            if (project) handleUpdateProject({ ...project, clientAvatar: '' });
        }
    };

    const handleResetData = async () => {
        if (window.confirm("確定要將資料庫重置為「預設演示資料」嗎？這將會覆蓋/新增雲端資料。")) {
            try {
                for (const p of INITIAL_PROJECTS) {
                    await setDoc(doc(db, 'projects', p.id), p);
                }
                for (const m of INITIAL_MEMBERS) {
                    await setDoc(doc(db, 'members', m.id), m);
                }
                alert("資料已上傳至雲端！");
            } catch (e) {
                console.error(e);
                alert("重置失敗，請檢查 Console");
            }
        }
    };

    const handleAddStageToNewProject = () => {
        if (newStageInput.trim()) {
            setNewProjectStages([...newProjectStages, newStageInput.trim()]);
            setNewStageInput('');
        }
    };

    const toggleNewProjectMember = (id: string) => {
        setNewProjectMembers(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const renderGroupedProjects = () => {
        const grouped = filteredProjects.reduce((acc, project) => {
            const cat = project.category || '未分類';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(project);
            return acc;
        }, {} as Record<string, Project[]>);

        return Object.entries(grouped).map(([category, projs]: [string, Project[]]) => (
            <div key={category} className="mb-10">
                <div className="flex items-center gap-3 mb-5 px-1">
                    <div className="bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 p-2 rounded-xl transition-colors">
                        <Tag size={16} />
                    </div>
                    {editingCategory === category ? (
                        <div className="flex items-center gap-2 flex-1">
                            <input
                                type="text"
                                value={editCategoryValue}
                                onChange={(e) => setEditCategoryValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveCategory(category);
                                    if (e.key === 'Escape') handleCancelEditCategory();
                                }}
                                className="flex-1 max-w-xs bg-white dark:bg-zinc-900 border-2 border-lime-400 dark:border-lime-500 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 dark:text-white focus:outline-none"
                                autoFocus
                            />
                            <button
                                onClick={() => handleSaveCategory(category)}
                                className="px-4 py-2 bg-lime-400 text-black rounded-xl text-xs font-bold hover:bg-lime-500 transition-all"
                            >
                                儲存
                            </button>
                            <button
                                onClick={handleCancelEditCategory}
                                className="px-4 py-2 bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-xl text-xs font-bold hover:bg-slate-300 dark:hover:bg-zinc-700 transition-all"
                            >
                                取消
                            </button>
                        </div>
                    ) : (
                        <>
                            <h3
                                className="font-bold text-slate-700 dark:text-zinc-300 text-lg cursor-pointer hover:text-lime-500 dark:hover:text-lime-400 transition-colors"
                                onClick={() => handleStartEditCategory(category)}
                                title="點擊編輯分類名稱"
                            >
                                {category}
                            </h3>
                            <span className="text-xs bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-500 px-2.5 py-1 rounded-full font-bold">{projs.length}</span>
                        </>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 w-full">
                    {projs.map(p => {
                        // 安全讀取陣列
                        const stages = p.stages || DEFAULT_STAGES;
                        const canEdit = ['Admin', 'Manager', 'SeniorMember'].includes(currentUser!.accessLevel);
                        const tasks = Array.isArray(p.tasks) ? p.tasks : [];

                        const currentIndex = stages.indexOf(p.stage);
                        let hasStageGap = false;
                        if (currentIndex > 0) {
                            for (let i = 0; i < currentIndex; i++) {
                                // 安全檢查 completedStages
                                const completed = p.completedStages || [];
                                if (!completed.includes(stages[i])) {
                                    hasStageGap = true;
                                    break;
                                }
                            }
                        }

                        const isMissingInfo = !p.dueDate || !p.startDate || tasks.length === 0 || hasStageGap;

                        return (
                            <div key={p.id} onClick={() => { setSelectedProjectId(p.id); setActiveView('projects'); }} className="bg-white dark:bg-[#18181b] rounded-[28px] p-6 border border-slate-100 dark:border-zinc-800 transition-all cursor-pointer group relative overflow-hidden shadow-card hover:shadow-card-hover dark:shadow-none dark:hover:shadow-lime-400/20 hover:border-lime-400/30 hover:-translate-y-1">

                                {canEdit && (
                                    <button
                                        onClick={(e) => handleDeleteProject(e, p.id)}
                                        className="absolute top-3 right-3 p-2 text-slate-400 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-all opacity-0 group-hover:opacity-100 z-50"
                                        title="刪除專案"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}

                                <div className="relative z-10 pt-2">
                                    <div className="flex justify-between items-start mb-5">
                                        <div className="relative group/image">
                                            <div className="w-14 h-14 bg-slate-100 dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700/50 flex items-center justify-center overflow-hidden relative">
                                                {p.clientAvatar ? <img src={p.clientAvatar} alt={p.clientName} className="w-full h-full object-cover" /> : <Folder size={24} className="text-slate-400 dark:text-zinc-600" />}
                                            </div>
                                            {canEdit && (
                                                <div className="absolute inset-0 -m-1 bg-black/80 rounded-2xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-[2px]">
                                                    <label className="w-6 h-6 flex items-center justify-center bg-zinc-700 hover:bg-white text-white hover:text-black rounded-full cursor-pointer transition-all" onClick={(e) => e.stopPropagation()} title="更換圖片">
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleProjectImageUpdate(e, p.id)} />
                                                        <Camera size={12} />
                                                    </label>
                                                    {p.clientAvatar && <button onClick={(e) => handleRemoveProjectImage(e, p.id)} className="w-6 h-6 flex items-center justify-center bg-zinc-700 hover:bg-rose-500 text-white rounded-full cursor-pointer transition-all" title="移除圖片"><Trash2 size={12} /></button>}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${p.riskLevel === 'High' ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-500' : p.riskLevel === 'Medium' ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-500' : 'bg-lime-50 dark:bg-lime-400/10 border-lime-200 dark:border-lime-400/30 text-lime-700 dark:text-lime-400'}`}>
                                                {p.riskLevel === 'High' ? '高風險' : p.riskLevel === 'Medium' ? '中風險' : '低風險'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mb-1 relative group/edit">
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate pr-4">{p.name}</h3>
                                        {canEdit && <Pencil size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 opacity-0 group-hover/edit:opacity-100 pointer-events-none" />}
                                    </div>

                                    <p className="text-xs text-lime-600 dark:text-lime-400 font-bold mb-3">{p.stage}</p>
                                    <p className="text-slate-500 dark:text-zinc-500 text-xs mb-6 line-clamp-2 min-h-[2.5em] leading-relaxed">{p.description || '暫無描述...'}</p>

                                    <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
                                        <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide"><span>完成度</span><span>{p.progress}%</span></div>
                                        <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-lime-500 dark:bg-lime-400 rounded-full shadow-[0_0_10px_rgba(217,248,80,0.5)] transition-all duration-1000" style={{ width: `${p.progress}%` }}></div>
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex -space-x-2">
                                                {/* 這裡也加上了安全讀取 */}
                                                {members.filter(m => Array.isArray(p.teamMembers) && p.teamMembers.includes(m.id)).slice(0, 3).map((m, i) => (
                                                    <div key={i} className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-800 border border-white dark:border-zinc-900 flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-zinc-400">{m.name.charAt(0)}</div>
                                                ))}
                                                {Array.isArray(p.teamMembers) && p.teamMembers.length > 3 && <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-800 border border-white dark:border-zinc-900 flex items-center justify-center text-[8px] text-slate-600 dark:text-zinc-500">+{p.teamMembers.length - 3}</div>}
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${tasks.length === 0 ? 'text-rose-500 bg-rose-500/10' : 'text-slate-500 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800'}`}>{tasks.length} 任務</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        ));
    };

    if (isAuthChecking) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-bg text-zinc-500">
                <div className="flex flex-col items-center">
                    <Loader2 size={32} className="animate-spin text-lime-400 mb-2" />
                    <p className="text-xs font-bold text-zinc-600">系統載入中...</p>
                </div>
            </div>
        );
    }

    if (!currentUser) return <LoginView members={members} onLogin={() => { }} onLocalLogin={handleLocalLogin} />;

    const renderContent = () => {
        // 團隊管理: Admin、Manager 和 SeniorMember 可見
        // 財務預算: Member 不可見,其他都可見
        const isTeamRestricted = activeView === 'team' && !['Admin', 'Manager', 'SeniorMember'].includes(currentUser.accessLevel);
        const isBudgetRestricted = activeView === 'budget' && currentUser.accessLevel === 'Member';

        if (isTeamRestricted || isBudgetRestricted) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 animate-enter">
                    <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                        <Zap size={32} className="text-zinc-600" />
                    </div>
                    <p className="font-bold text-lg text-white">權限不足</p>
                    <p className="text-sm mt-1">您沒有權限存取此頁面。</p>
                    <button onClick={() => setActiveView('dashboard')} className="mt-6 px-6 py-2 bg-white text-black rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors">
                        返回儀表板
                    </button>
                </div>
            );
        }

        if (activeView === 'projects' && currentProject) {
            return (
                <ProjectView
                    project={currentProject}
                    currentUser={currentUser}
                    allMembers={members}
                    onUpdateProject={handleUpdateProject}
                    onBack={() => { setSelectedProjectId(null); setInitialProjectTab(undefined); setActiveView('projects'); }}
                    initialTab={initialProjectTab}
                />
            );
        }

        if (activeView === 'team') return <TeamView members={members} onAddMember={handleAddMember} onUpdateMember={handleUpdateMember} onRemoveMember={handleRemoveMember} currentUser={currentUser} teams={teams} onAddTeam={handleAddTeam} onUpdateTeam={handleUpdateTeam} onDeleteTeam={handleDeleteTeam} />;
        if (activeView === 'budget') return <BudgetView projects={projects} onUpdateProject={handleUpdateProject} currentUser={currentUser} />;
        if (activeView === 'gallery') return <GalleryView projects={projects} />;
        if (activeView === 'calendar') return <CalendarView projects={projects} members={members} currentUser={currentUser} onUpdateProject={handleUpdateProject} />;
        if (activeView === 'announcements') return <AnnouncementView announcements={announcements} members={members} currentUser={currentUser} onCreateAnnouncement={handleCreateAnnouncement} onUpdateAnnouncement={handleUpdateAnnouncement} onDeleteAnnouncement={handleDeleteAnnouncement} onMarkAsRead={handleMarkAnnouncementRead} />;
        if (activeView === 'settings') return <SettingsView currentUser={currentUser} onUpdateProfile={handleUpdateMember} onResetData={handleResetData} defaultStages={defaultStages} onUpdateDefaultStages={setDefaultStages} />;

        if (activeView === 'dashboard' || (activeView === 'projects' && !currentProject)) {
            return (
                <div className="space-y-8 animate-enter pb-10 w-full">
                    {storageError && (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 text-rose-500 font-bold text-sm">
                            <AlertTriangle size={20} />
                            <span>儲存空間已滿，部分變更可能未儲存。請刪除一些圖片或專案。</span>
                        </div>
                    )}

                    {activeView === 'dashboard' && (
                        <Dashboard projects={projects} members={members} onSelectProject={(id) => { setSelectedProjectId(id); setActiveView('projects'); }} />
                    )}

                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">專案列表</h2>
                            <p className="text-slate-400 dark:text-zinc-500 mt-1 text-sm md:text-base font-medium">管理您的設計與開發工作流程</p>
                        </div>
                        <div className="flex gap-2">
                            {projects.length === 0 && (
                                <button onClick={handleResetData} className="bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-zinc-700 transition-all flex items-center gap-2 text-sm">
                                    <RefreshCw size={18} /> 重置演示資料
                                </button>
                            )}

                            {['Admin', 'Manager', 'SeniorMember'].includes(currentUser.accessLevel) && (
                                <button onClick={() => setShowNewProjectModal(true)} className="bg-[#EFF0A3] text-black px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-[#e5e699] transition-all flex items-center gap-2 text-sm">
                                    <Plus size={18} /> <span className="hidden md:inline">新增專案</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {filteredProjects.length === 0 ? (
                        <div className="w-full py-24 bg-white dark:bg-bg-card rounded-[32px] border border-slate-200 dark:border-border flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6 text-slate-300 dark:text-zinc-600">
                                <Folder size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                {searchQuery ? '找不到相關專案' : '目前沒有專案'}
                            </h3>
                            <p className="text-slate-400 dark:text-zinc-500 text-sm mt-2 mb-6 max-w-xs mx-auto">
                                {searchQuery ? '請嘗試其他關鍵字。' : (['Member', 'SeniorMember'].includes(currentUser.accessLevel) ? '您目前沒有被指派任何專案。' : '點擊上方按鈕建立新專案,或重置資料。')}
                            </p>
                            {projects.length === 0 && ['Admin', 'Manager', 'SeniorMember'].includes(currentUser.accessLevel) && (
                                <button onClick={handleResetData} className="bg-slate-800 dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-xl font-bold hover:bg-slate-700 dark:hover:bg-zinc-200 transition-all text-sm">
                                    載入預設資料
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="w-full">
                            {renderGroupedProjects()}
                        </div>
                    )}
                </div>
            );
        }

        return null;
    };

    return (
        <Layout
            activeView={activeView}
            setActiveView={setActiveView}
            onNewProject={() => setShowNewProjectModal(true)}
            currentUser={currentUser}
            onLogout={handleLogout}
            onSearch={setSearchQuery}
            onNavigate={handleNavigateToProject}
            announcements={announcements}
            onMarkAnnouncementAsRead={handleMarkAnnouncementRead}
            projects={projects}
        >
            <ErrorBoundary>
                {renderContent()}
            </ErrorBoundary>

            {showNewProjectModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowNewProjectModal(false)}></div>
                    <div className="bg-white dark:bg-bg-card w-full max-w-lg rounded-[32px] shadow-2xl relative z-10 p-8 animate-enter flex flex-col max-h-[85vh] border border-slate-200 dark:border-border">
                        <div className="flex justify-between items-center mb-6 flex-shrink-0">
                            <h3 className="font-bold text-slate-800 dark:text-white text-xl">建立新專案</h3>
                            <button onClick={() => setShowNewProjectModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={24} className="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-white" /></button>
                        </div>
                        <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1 pr-2">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">專案名稱</label>
                                    <input className="w-full bg-slate-50 dark:bg-bg-input border border-slate-200 dark:border-border rounded-xl px-4 py-3.5 font-bold text-slate-800 dark:text-white outline-none focus:border-lime-500 transition-all" value={newProjectData.name} onChange={e => setNewProjectData({ ...newProjectData, name: e.target.value })} placeholder="例如: 官網改版" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">客戶名稱</label>
                                        <input className="w-full bg-slate-50 dark:bg-bg-input border border-slate-200 dark:border-border rounded-xl px-4 py-3.5 font-bold text-slate-800 dark:text-white outline-none focus:border-lime-500 transition-all" value={newProjectData.client} onChange={e => setNewProjectData({ ...newProjectData, client: e.target.value })} placeholder="例如: TechFlow 科技" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">專案分類</label>
                                        <input
                                            list="category-options"
                                            className="w-full bg-slate-50 dark:bg-bg-input border border-slate-200 dark:border-border rounded-xl px-4 py-3.5 font-bold text-slate-800 dark:text-white outline-none focus:border-lime-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                                            value={newProjectData.category}
                                            onChange={e => setNewProjectData({ ...newProjectData, category: e.target.value })}
                                            placeholder="選擇或輸入分類..."
                                        />
                                        <datalist id="category-options">
                                            {PROJECT_CATEGORIES.map(c => <option key={c} value={c} />)}
                                        </datalist>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">預算 (TWD)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 font-bold">$</span>
                                            <input type="number" className="w-full bg-slate-50 dark:bg-bg-input border border-slate-200 dark:border-border rounded-xl pl-6 pr-4 py-3.5 font-bold text-slate-800 dark:text-white outline-none focus:border-lime-500 transition-all" value={newProjectData.budget} onChange={e => setNewProjectData({ ...newProjectData, budget: e.target.value })} placeholder="0" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">風險評估</label>
                                        <div className="flex gap-2">
                                            {['Low', 'Medium', 'High'].map(r => (
                                                <button key={r} onClick={() => setNewProjectData({ ...newProjectData, risk: r as any })} className={`flex-1 py-3.5 rounded-xl text-xs font-bold border transition-all ${newProjectData.risk === r ? 'bg-slate-800 dark:bg-white text-white dark:text-black border-slate-800 dark:border-white' : 'bg-slate-50 dark:bg-bg-input border-slate-200 dark:border-border text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-white hover:border-slate-300 dark:hover:border-zinc-600'}`}>{r === 'High' ? '高' : r === 'Medium' ? '中' : '低'}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Team Selection */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">專案團隊</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-bg-input border border-slate-200 dark:border-border rounded-xl px-4 py-3.5 font-bold text-slate-800 dark:text-white outline-none focus:border-lime-500 transition-all"
                                        value={newProjectTeam}
                                        onChange={(e) => setNewProjectTeam(e.target.value)}
                                        disabled={currentUser?.accessLevel !== 'Admin'}
                                    >
                                        <option value="">未分配</option>
                                        <option value="A團隊">A團隊</option>
                                        <option value="B團隊">B團隊</option>
                                        <option value="C團隊">C團隊</option>
                                        <option value="D團隊">D團隊</option>
                                    </select>
                                    {currentUser?.accessLevel !== 'Admin' && currentUser?.team && (
                                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 ml-1">* 自動分配至您的團隊: {currentUser.team}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">預計開始日</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 font-bold"><Calendar size={16} /></span>
                                            <input type="date" className="w-full bg-slate-50 dark:bg-bg-input border border-slate-200 dark:border-border rounded-xl pl-10 pr-4 py-3.5 font-bold text-slate-800 dark:text-white outline-none focus:border-lime-500 transition-all" value={newProjectData.startDate} onChange={e => setNewProjectData({ ...newProjectData, startDate: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">預計截止日</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 font-bold"><Calendar size={16} /></span>
                                            <input type="date" className="w-full bg-slate-50 dark:bg-bg-input border border-slate-200 dark:border-border rounded-xl pl-10 pr-4 py-3.5 font-bold text-slate-800 dark:text-white outline-none focus:border-lime-500 transition-all" value={newProjectData.dueDate} onChange={e => setNewProjectData({ ...newProjectData, dueDate: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Member Selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1 flex justify-between">
                                    指定團隊成員
                                    <span className="text-[10px] text-slate-400 dark:text-zinc-600">已選: {newProjectMembers.length} 人</span>
                                </label>
                                <div className="bg-slate-50 dark:bg-bg-input border border-slate-200 dark:border-border rounded-xl p-3 max-h-[150px] overflow-y-auto custom-scrollbar grid grid-cols-2 gap-2">
                                    {members.filter(m => m.status !== 'Suspended').map(m => (
                                        <div
                                            key={m.id}
                                            onClick={() => toggleNewProjectMember(m.id)}
                                            className={`p-2 rounded-lg flex items-center gap-2 cursor-pointer transition-all border ${newProjectMembers.includes(m.id) ? 'bg-lime-100 dark:bg-lime-400/10 border-lime-400/30' : 'bg-transparent border-transparent hover:bg-slate-200 dark:hover:bg-zinc-800'}`}
                                        >
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0 ${newProjectMembers.includes(m.id) ? 'bg-lime-500 dark:bg-lime-400' : 'bg-slate-200 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400'}`}>
                                                {newProjectMembers.includes(m.id) ? <Check size={14} /> : m.name.charAt(0)}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className={`text-xs font-bold truncate ${newProjectMembers.includes(m.id) ? 'text-lime-700 dark:text-lime-400' : 'text-slate-500 dark:text-zinc-400'}`}>{m.name}</span>
                                                <span className="text-[10px] text-slate-400 dark:text-zinc-600 truncate">{m.role}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Stages */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1 flex justify-between">
                                    專案流程階段
                                    <span className="text-[10px] text-slate-400 dark:text-zinc-600">初始依據全域設定</span>
                                </label>
                                <div className="bg-slate-50 dark:bg-bg-input border border-slate-200 dark:border-border rounded-xl p-4 space-y-2">
                                    {newProjectStages.map((stage, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-white dark:bg-zinc-800 p-2 rounded-lg border border-slate-200 dark:border-zinc-700/50 shadow-sm group">
                                            <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 w-6 text-center">{idx + 1}</span>
                                            <input
                                                value={stage}
                                                onChange={(e) => {
                                                    const newArr = [...newProjectStages];
                                                    newArr[idx] = e.target.value;
                                                    setNewProjectStages(newArr);
                                                }}
                                                className="flex-1 text-sm font-bold text-slate-700 dark:text-zinc-300 bg-transparent outline-none"
                                            />
                                            <button onClick={() => setNewProjectStages(newProjectStages.filter((_, i) => i !== idx))} className="text-slate-400 dark:text-zinc-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2 pt-2">
                                        <input
                                            className="flex-1 bg-transparent border-b border-slate-200 dark:border-zinc-700 px-2 py-2 text-sm text-slate-800 dark:text-white outline-none focus:border-lime-500 placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                                            placeholder="新增階段..."
                                            value={newStageInput}
                                            onChange={e => setNewStageInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddStageToNewProject()}
                                        />
                                        <button onClick={handleAddStageToNewProject} className="bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 p-2 rounded-lg hover:bg-slate-300 dark:hover:bg-zinc-700 hover:text-slate-800 dark:hover:text-white transition-colors"><Plus size={18} /></button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">專案描述</label>
                                <textarea className="w-full bg-slate-50 dark:bg-bg-input border border-slate-200 dark:border-border rounded-xl px-4 py-3.5 font-medium text-slate-700 dark:text-zinc-300 outline-none focus:border-lime-500 transition-all min-h-[100px] resize-none" value={newProjectData.description} onChange={e => setNewProjectData({ ...newProjectData, description: e.target.value })} placeholder="輸入專案摘要..." />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8 flex-shrink-0">
                            <button onClick={() => setShowNewProjectModal(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-white transition-colors">取消</button>
                            <button onClick={handleCreateProject} className="bg-lime-400 text-black px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-lime-300 shadow-lg shadow-lime-400/20">建立</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </Layout>
    );
};