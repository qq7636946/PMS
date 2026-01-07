
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Project, Task, Status, Priority, Member, ProofingRound } from '../types';
import { DEFAULT_STAGES } from '../constants';
import { Plus, Calendar, ArrowLeft, Zap, PenLine, Check, User, X, Trash2, CheckSquare, MessageSquare, Kanban, FileText, Clock, Image as ImageIcon, Upload, Folder, Camera, ZoomIn, Loader2, GripVertical, Settings2, ChevronLeft, ChevronRight, Save, Eye, EyeOff } from 'lucide-react';
import { ProjectChat } from './ProjectChat';

interface ProjectViewProps {
    project: Project;
    currentUser: Member;
    allMembers: Member[];
    onUpdateProject: (p: Project) => void;
    onBack: () => void;
    initialTab?: string;
    teams?: string[];
}

type TabType = 'content' | 'tasks' | 'schedule' | 'chat' | 'proofing' | 'notes';

export const ProjectView: React.FC<ProjectViewProps> = ({ project, currentUser, allMembers, onUpdateProject, onBack, initialTab, teams = [] }) => {
    const [activeTab, setActiveTab] = useState<TabType>('content');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [showNewTaskInput, setShowNewTaskInput] = useState<Status | null>(null);
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [tempNotes, setTempNotes] = useState(project.notes);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [tempDescription, setTempDescription] = useState(project.description || '');
    const [showMemberSelect, setShowMemberSelect] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isEditingRisk, setIsEditingRisk] = useState(false);
    const [isComposing, setIsComposing] = useState(false);

    // Schedule / Calendar State
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [scheduleData, setScheduleData] = useState<Partial<Task>>({});

    // Stage Editing
    const [isEditingStages, setIsEditingStages] = useState(false);
    const [tempStages, setTempStages] = useState<string[]>([]);
    const [newStageInput, setNewStageInput] = useState('');

    // Proofing State
    const [showAddProofing, setShowAddProofing] = useState(false);
    const [newProofingTitle, setNewProofingTitle] = useState('');
    const [newProofingImages, setNewProofingImages] = useState<string[]>([]);
    const [isUploadingImages, setIsUploadingImages] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Calendar State
    const [calendarDate, setCalendarDate] = useState(new Date());

    // Notes Image Upload State
    const [isUploadingNotesImage, setIsUploadingNotesImage] = useState(false);
    const notesImageInputRef = useRef<HTMLInputElement>(null);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Permission Check
    const canEditProject = ['Admin', 'Manager', 'SeniorMember'].includes(currentUser.accessLevel);

    // Safe Data Accessors
    const tasks = Array.isArray(project.tasks) ? project.tasks : [];
    const teamMembers = Array.isArray(project.teamMembers) ? project.teamMembers : [];
    const proofing = Array.isArray(project.proofing) ? project.proofing : [];
    const currentStages = Array.isArray(project.stages) && project.stages.length > 0 ? project.stages : DEFAULT_STAGES;

    // Calculate total expense for budget display
    const totalExpense = Array.isArray(project.transactions)
        ? project.transactions
            .filter(tx => tx.type === 'expense')
            .reduce((sum, tx) => sum + tx.amount, 0)
        : 0;

    // FIXED: Sync local state when props change (other user updates)
    useEffect(() => {
        setTempNotes(project.notes);
        setTempDescription(project.description || '');
    }, [project.notes, project.description]);

    useEffect(() => {
        if (initialTab && ['content', 'tasks', 'schedule', 'chat', 'proofing', 'notes'].includes(initialTab)) {
            setActiveTab(initialTab as TabType);
        }
    }, [initialTab]);

    useEffect(() => {
        if (scrollRef.current) {
            const activeIndex = currentStages.indexOf(project.stage);
            if (activeIndex > -1) {
                const item = scrollRef.current.children[activeIndex] as HTMLElement;
                if (item) {
                    const scrollLeft = item.offsetLeft - (scrollRef.current.clientWidth / 2) + (item.clientWidth / 2);
                    scrollRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                }
            }
        }
    }, [project.stage, currentStages]);

    const handleStageClick = (targetStage: string) => {
        if (!canEditProject) return;
        const currentIndex = currentStages.indexOf(project.stage);
        const targetIndex = currentStages.indexOf(targetStage);

        if (targetStage === project.stage) {
            if (currentIndex > 0) {
                const prevStage = currentStages[currentIndex - 1];
                const newCompleted = project.completedStages.filter(s => s !== targetStage);
                onUpdateProject({ ...project, stage: prevStage, completedStages: newCompleted, progress: Math.max(0, project.progress - 5) });
            }
            return;
        }

        if (targetIndex > currentIndex) {
            const newProgress = Math.round(((targetIndex + 1) / currentStages.length) * 100);
            const stagesToAdd = currentStages.slice(0, targetIndex).filter(s => !project.completedStages.includes(s));
            const newCompleted = [...project.completedStages, ...stagesToAdd];
            onUpdateProject({ ...project, stage: targetStage, progress: newProgress, completedStages: newCompleted });
        } else {
            const isCompleted = project.completedStages.includes(targetStage);
            const newCompletedStages = isCompleted ? project.completedStages.filter(s => s !== targetStage) : [...project.completedStages, targetStage];
            onUpdateProject({ ...project, completedStages: newCompletedStages });
        }
    };

    const handleInitEditStages = () => {
        setTempStages([...currentStages]);
        setIsEditingStages(true);
    };

    const handleSaveStages = () => {
        let finalStages = tempStages.filter(s => s.trim() !== '');
        if (finalStages.length === 0) finalStages = ['專案開始']; // Prevent empty

        // Ensure current stage is valid
        let newCurrentStage = project.stage;
        if (!finalStages.includes(newCurrentStage)) {
            newCurrentStage = finalStages[0];
        }

        onUpdateProject({ ...project, stages: finalStages, stage: newCurrentStage });
        setIsEditingStages(false);
    };

    const handleSaveNotes = () => {
        onUpdateProject({
            ...project,
            notes: tempNotes,
            notesLastModified: new Date().toISOString(),
            notesLastModifiedBy: currentUser.id
        });
        setIsEditingNotes(false);
    };

    const handleSaveDescription = () => {
        onUpdateProject({
            ...project,
            description: tempDescription
        });
        setIsEditingDescription(false);
    };
    const toggleMember = (id: string) => { onUpdateProject({ ...project, teamMembers: teamMembers.includes(id) ? teamMembers.filter(m => m !== id) : [...teamMembers, id] }); };
    const handleAddTask = (status: Status) => { if (newTaskTitle.trim()) { onUpdateProject({ ...project, tasks: [...tasks, { id: Date.now().toString(), projectId: project.id, title: newTaskTitle, description: '', status, priority: Priority.MEDIUM, subtasks: [] }] }); setNewTaskTitle(''); setShowNewTaskInput(null); } };
    const handleUpdateTask = (task: Task) => { onUpdateProject({ ...project, tasks: tasks.map(t => t.id === task.id ? task : t) }); setSelectedTask(task); };
    const handleDeleteTask = (id: string) => { onUpdateProject({ ...project, tasks: tasks.filter(t => t.id !== id) }); setSelectedTask(null); };
    const handleSendMessage = (pid: string, content: string) => {
        const currentMsgs = Array.isArray(project.chatMessages) ? project.chatMessages : [];
        onUpdateProject({ ...project, chatMessages: [...currentMsgs, { id: Date.now().toString(), senderId: currentUser.id, content, timestamp: new Date().toISOString() }] });
    };

    // Schedule / Calendar Logic
    const handleDateClick = (date: Date) => {
        if (!canEditProject) return;
        const dateStr = date.toISOString().split('T')[0];
        setScheduleData({
            title: '',
            startDate: dateStr,
            dueDate: dateStr,
            status: Status.TODO,
            priority: Priority.MEDIUM,
            description: '',
            subtasks: []
        });
        setScheduleModalOpen(true);
    };

    const handleScheduleEventClick = (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        setScheduleData(task);
        setScheduleModalOpen(true);
    };

    const handleSaveSchedule = () => {
        if (!scheduleData.title?.trim()) {
            alert('請輸入事項標題');
            return;
        }

        const isNew = !scheduleData.id;
        let updatedTasks = [...tasks];

        if (isNew) {
            const newTask: Task = {
                id: Date.now().toString(),
                projectId: project.id,
                title: scheduleData.title!,
                description: scheduleData.description || '',
                status: scheduleData.status || Status.TODO,
                priority: scheduleData.priority || Priority.MEDIUM,
                startDate: scheduleData.startDate,
                dueDate: scheduleData.dueDate,
                subtasks: []
            };
            updatedTasks.push(newTask);
        } else {
            updatedTasks = tasks.map(t => t.id === scheduleData.id ? { ...t, ...scheduleData } as Task : t);
        }

        onUpdateProject({ ...project, tasks: updatedTasks });
        setScheduleModalOpen(false);
        setScheduleData({});
    };

    // Notes Image Upload
    const handleNotesImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 500 * 1024) {
            alert("圖片過大！請上傳小於 500KB 的圖片。");
            return;
        }

        setIsUploadingNotesImage(true);
        const reader = new FileReader();
        reader.onloadend = () => {
            const imageData = reader.result as string;
            const imageMarkdown = `\n![圖片](${imageData})\n`;
            setTempNotes(prev => prev + imageMarkdown);
            setIsUploadingNotesImage(false);
            if (notesImageInputRef.current) notesImageInputRef.current.value = '';
        };
        reader.onerror = () => {
            alert("圖片讀取失敗，請重試。");
            setIsUploadingNotesImage(false);
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteSchedule = () => {
        if (scheduleData.id && window.confirm('確定要刪除此時程嗎？')) {
            onUpdateProject({ ...project, tasks: tasks.filter(t => t.id !== scheduleData.id) });
            setScheduleModalOpen(false);
        }
    };

    // Proofing Logic
    const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploadingImages(true);

        const MAX_BATCH_SIZE = 2 * 1024 * 1024;
        let totalSize = 0;
        for (let i = 0; i < files.length; i++) totalSize += files[i].size;

        if (totalSize > MAX_BATCH_SIZE) {
            alert("⚠️ 圖片總大小過大！\n\n為防止系統崩潰，單次上傳請勿超過 2MB。\n請分批上傳或先壓縮圖片。");
            setIsUploadingImages(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const filePromises = Array.from(files).map((file: File) => {
            return new Promise<string>((resolve) => {
                if (!file.type.startsWith('image/')) {
                    resolve('');
                    return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                    if (typeof reader.result === 'string') {
                        resolve(reader.result);
                    } else {
                        resolve('');
                    }
                };
                reader.onerror = () => {
                    console.error("Error reading file");
                    resolve('');
                };
                reader.readAsDataURL(file);
            });
        });

        try {
            const results = await Promise.all(filePromises);
            const validImages = results.filter(img => img !== '');
            if (validImages.length > 0) {
                setNewProofingImages(prev => [...prev, ...validImages]);
            }
        } catch (error) {
            console.error("Error processing batch upload:", error);
            alert("部分圖片上傳失敗，請重試。");
        } finally {
            setIsUploadingImages(false);
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleProjectImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 500 * 1024) {
                alert("封面圖片過大，請使用小於 500KB 的圖片。");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpdateProject({ ...project, clientAvatar: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveProjectImage = () => {
        if (window.confirm('確定要移除專案封面圖片嗎？')) {
            onUpdateProject({ ...project, clientAvatar: '' });
        }
    };

    const handleSaveProofing = () => {
        if (newProofingImages.length === 0) {
            alert("請至少上傳一張圖片");
            return;
        }
        const finalTitle = newProofingTitle.trim() || `校稿版本 ${new Date().toLocaleDateString()}`;
        const newRound: ProofingRound = {
            id: Date.now().toString(),
            title: finalTitle,
            date: new Date().toISOString().split('T')[0],
            images: newProofingImages
        };

        try {
            const updatedProofing = [newRound, ...proofing];
            const potentialSize = JSON.stringify(updatedProofing).length;
            if (potentialSize > 4 * 1024 * 1024) {
                alert("⚠️ 儲存失敗：校稿圖片總量過大。\n\n請刪除舊的校稿版本或減少本次上傳的圖片數量。");
                return;
            }
            onUpdateProject({ ...project, proofing: updatedProofing });
            setNewProofingTitle('');
            setNewProofingImages([]);
            setShowAddProofing(false);
        } catch (e) {
            console.error("Save Proofing Error", e);
            alert("發布失敗，可能是圖片檔案過大導致儲存空間不足。");
        }
    };

    const handleDeleteProofingImage = (e: React.MouseEvent, roundId: string, imgIndex: number) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.confirm("確定要刪除這張圖片嗎？此操作無法復原。")) return;

        const newProofing = proofing.map(p => {
            if (p.id === roundId) {
                const newImages = p.images.filter((_, i) => i !== imgIndex);
                return { ...p, images: newImages };
            }
            return p;
        }).filter(p => p.images.length > 0);

        onUpdateProject({ ...project, proofing: newProofing });
    };

    const columns = [Status.TODO, Status.IN_PROGRESS, Status.DONE];
    const activeMembers = allMembers.filter(m => teamMembers.includes(m.id));

    const allTabs = [
        { id: 'content', label: '專案內容', icon: FileText },
        { id: 'tasks', label: '任務看板', icon: Kanban },
        { id: 'schedule', label: '專案時程', icon: Calendar },
        { id: 'proofing', label: '校稿', icon: ImageIcon },
        { id: 'notes', label: '筆記', icon: PenLine },
        { id: 'chat', label: '討論', icon: MessageSquare },
    ];

    // Notes tab is now visible to all members, schedule only for editors
    const visibleTabs = canEditProject
        ? allTabs
        : allTabs.filter(t => ['content', 'tasks', 'proofing', 'notes', 'chat'].includes(t.id));

    // Calendar Helpers
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay, year, month };
    };

    const renderCalendar = () => {
        const { days, firstDay, year, month } = getDaysInMonth(calendarDate);
        const totalSlots = Math.ceil((days + firstDay) / 7) * 7;
        const calendarDays = [];

        for (let i = 0; i < totalSlots; i++) {
            const dayNum = i - firstDay + 1;
            const isValidDay = dayNum > 0 && dayNum <= days;
            const currentDayDate = new Date(year, month, dayNum);

            // Reset hours for comparison
            currentDayDate.setHours(0, 0, 0, 0);

            // Check if date is within project timeline
            let isInProjectRange = false;
            let isProjectStart = false;
            let isProjectEnd = false;

            if (project.startDate && project.dueDate) {
                const projectStart = new Date(project.startDate);
                const projectEnd = new Date(project.dueDate);
                projectStart.setHours(0, 0, 0, 0);
                projectEnd.setHours(0, 0, 0, 0);

                isInProjectRange = currentDayDate >= projectStart && currentDayDate <= projectEnd;
                isProjectStart = currentDayDate.getTime() === projectStart.getTime();
                isProjectEnd = currentDayDate.getTime() === projectEnd.getTime();
            }

            // Find tasks for this day
            const dayTasks = tasks.filter(t => {
                // 如果任務沒有日期,使用專案的開始和結束日期
                const taskStart = t.startDate || project.startDate;
                const taskEnd = t.dueDate || project.dueDate;

                if (!taskStart || !taskEnd) return false;

                const start = new Date(taskStart);
                const end = new Date(taskEnd);
                start.setHours(0, 0, 0, 0);
                end.setHours(0, 0, 0, 0);
                return currentDayDate >= start && currentDayDate <= end;
            });

            calendarDays.push(
                <div
                    key={i}
                    onClick={() => isValidDay && handleDateClick(currentDayDate)}
                    className={`min-h-[100px] border border-slate-100 dark:border-zinc-800 p-1 relative transition-colors ${isValidDay ? 'bg-white dark:bg-[#18181b] hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer' : 'bg-slate-50 dark:bg-zinc-900'} ${isInProjectRange ? 'bg-lime-50/30 dark:bg-lime-900/10' : ''} ${i < 7 ? 'border-t' : ''} ${(i % 7) === 0 ? 'border-l' : ''}`}
                >
                    {isValidDay && (
                        <>
                            <span className={`text-xs font-bold p-1 block mb-1 ${new Date().toDateString() === currentDayDate.toDateString()
                                ? 'bg-lime-400 text-black rounded-full w-6 h-6 flex items-center justify-center'
                                : 'text-slate-500 dark:text-zinc-500'
                                }`}>
                                {dayNum}
                            </span>

                            {/* Project Timeline Indicators */}
                            {isProjectStart && (
                                <div className="text-[9px] font-bold text-lime-600 dark:text-lime-400 bg-lime-100 dark:bg-lime-900/30 px-1.5 py-0.5 rounded mb-1 truncate">
                                    📅 專案開始
                                </div>
                            )}
                            {isProjectEnd && (
                                <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded mb-1 truncate">
                                    🏁 專案結束
                                </div>
                            )}

                            <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                                {dayTasks.map(t => (
                                    <div
                                        key={t.id}
                                        onClick={(e) => handleScheduleEventClick(e, t)}
                                        className={`px-2 py-1 rounded text-[10px] font-bold truncate shadow-sm cursor-pointer border-l-2 transition-all hover:brightness-110 ${t.priority === Priority.CRITICAL ? 'bg-rose-500/20 text-rose-500 border-rose-500' :
                                            t.priority === Priority.HIGH ? 'bg-orange-500/20 text-orange-500 border-orange-500' :
                                                t.status === Status.DONE ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500' :
                                                    'bg-blue-500/20 text-blue-400 border-blue-500'
                                            }`}
                                    >
                                        {t.title}
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
        <div className="flex flex-col h-full animate-enter w-full text-slate-800 dark:text-zinc-100">
            <div className="flex-none mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-slate-400 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors shadow-sm border border-slate-100 dark:border-zinc-700 flex-shrink-0">
                            <ArrowLeft size={20} />
                        </button>

                        {/* Project Image */}
                        <div className="relative group flex-shrink-0">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 flex items-center justify-center overflow-hidden">
                                {project.clientAvatar ? (
                                    <img src={project.clientAvatar} alt="Project" className="w-full h-full object-cover" />
                                ) : (
                                    <Folder size={20} className="text-slate-300 dark:text-zinc-600" />
                                )}
                            </div>
                            {canEditProject && (
                                <div className="absolute inset-0 -m-1 bg-black/60 rounded-xl flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-[1px]">
                                    <label className="w-6 h-6 flex items-center justify-center bg-white/20 hover:bg-white text-white hover:text-black rounded-full cursor-pointer transition-all" title="上傳">
                                        <input type="file" className="hidden" accept="image/*" onChange={handleProjectImageUpload} />
                                        <Camera size={12} />
                                    </label>
                                    {project.clientAvatar && (
                                        <button
                                            onClick={handleRemoveProjectImage}
                                            className="w-6 h-6 flex items-center justify-center bg-white/20 hover:bg-rose-500 text-white rounded-full cursor-pointer transition-all"
                                            title="移除"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <input
                                value={project.name}
                                readOnly={!canEditProject}
                                onCompositionStart={() => setIsComposing(true)}
                                onCompositionEnd={() => setIsComposing(false)}
                                onChange={(e) => canEditProject && !isComposing && onUpdateProject({ ...project, name: e.target.value })}
                                className={`text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight bg-transparent border border-transparent rounded-lg px-2 -ml-2 transition-all outline-none flex-1 min-w-0 ${canEditProject ? 'hover:border-slate-200 dark:hover:border-zinc-700 focus:border-lime-400 focus:bg-white dark:focus:bg-zinc-800' : 'cursor-default'}`}
                            />
                            <div className="px-2 -ml-2 text-xs font-bold text-slate-400 dark:text-zinc-500 flex gap-2 items-center flex-wrap">
                                <span>{project.category || '未分類'}</span>
                                <span>•</span>
                                <span>{project.clientName}</span>
                                {(project.team || currentUser.accessLevel === 'Admin') && (
                                    <>
                                        <span>•</span>
                                        {currentUser.accessLevel === 'Admin' ? (
                                            <select
                                                value={project.team || ''}
                                                onChange={(e) => onUpdateProject({ ...project, team: e.target.value })}
                                                className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md font-bold text-xs cursor-pointer hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors border border-emerald-300 dark:border-emerald-700"
                                            >
                                                <option value="">未分配</option>
                                                {teams.map(team => (
                                                    <option key={team} value={team}>{team}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 px-2 py-0.5 rounded-md">{project.team}</span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Risk Badge */}
                    <div className="ml-14 lg:ml-0">
                        {isEditingRisk ? (
                            <div className="flex bg-white dark:bg-zinc-800 rounded-xl p-1 shadow-sm border border-slate-200 dark:border-zinc-700 flex-shrink-0">
                                {['Low', 'Medium', 'High'].map((risk) => (
                                    <button key={risk} onClick={() => { onUpdateProject({ ...project, riskLevel: risk as any }); setIsEditingRisk(false); }} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${project.riskLevel === risk ? (risk === 'High' ? 'bg-rose-500 text-white' : risk === 'Medium' ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white') : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-700'}`}>{risk === 'High' ? '高風險' : risk === 'Medium' ? '中風險' : '低風險'}</button>
                                ))}
                                <button onClick={() => setIsEditingRisk(false)} className="ml-2 px-2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-white"><X size={12} /></button>
                            </div>
                        ) : (
                            <button
                                onClick={() => canEditProject && setIsEditingRisk(true)}
                                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${project.riskLevel === 'High' ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : project.riskLevel === 'Medium' ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : 'bg-lime-100 text-lime-600 border-lime-200 dark:bg-lime-900/40 dark:text-lime-400 dark:border-lime-800'} ${canEditProject ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                                <Zap size={14} fill="currentColor" /> {project.riskLevel === 'High' ? '高風險' : project.riskLevel === 'Medium' ? '中風險' : '低風險'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-[#18181b] p-2 rounded-[20px] shadow-sm border border-slate-100 dark:border-zinc-800 flex gap-2 overflow-x-auto custom-scrollbar">
                    {visibleTabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${isActive ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-800 dark:hover:text-white'}`}>
                                <tab.icon size={16} /> {tab.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden relative bento-card border-none w-full bg-transparent shadow-none">
                {activeTab === 'content' && (
                    <div className="h-full overflow-y-auto custom-scrollbar p-1">
                        <div className="bg-white dark:bg-[#18181b] rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-zinc-800 hover:shadow-lg dark:hover:shadow-lime-400/5 transition-all mb-8 relative">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-3 text-xl"><Clock size={24} className="text-lime-500" /> 目前階段</h3>
                                {canEditProject && (
                                    <button onClick={handleInitEditStages} className="p-2 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors" title="編輯階段流程">
                                        <Settings2 size={20} />
                                    </button>
                                )}
                            </div>

                            <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                                {currentStages.map((stage) => {
                                    const isCurrent = project.stage === stage;
                                    const isVerifiedComplete = project.completedStages.includes(stage);
                                    return (
                                        <div key={stage} onClick={() => handleStageClick(stage)} className={`flex-shrink-0 px-6 py-4 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border-2 ${isCurrent ? 'bg-lime-400 border-lime-400 text-black shadow-xl scale-105' : isVerifiedComplete ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500'} ${canEditProject ? 'cursor-pointer hover:border-slate-300 dark:hover:border-zinc-600' : 'cursor-default'}`}>
                                            {stage}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-8 w-full">
                            <div className="col-span-12 xl:col-span-8 space-y-8">
                                {/* Project Description Card */}
                                <div className="bg-white dark:bg-[#18181b] rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-zinc-800 relative group hover:shadow-lg dark:hover:shadow-lime-400/5 transition-all">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-3 text-xl"><FileText size={24} className="text-lime-500" /> 專案描述</h3>
                                        {canEditProject && (
                                            <button onClick={() => isEditingDescription ? handleSaveDescription() : setIsEditingDescription(true)} className="text-sm font-bold text-lime-700 bg-lime-100 hover:bg-lime-200 dark:bg-lime-400 dark:text-black dark:hover:bg-lime-300 px-4 py-2 rounded-xl transition-colors">{isEditingDescription ? '儲存' : '編輯'}</button>
                                        )}
                                    </div>
                                    {isEditingDescription ? (
                                        <textarea className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl p-6 min-h-[150px] text-lg focus:ring-4 ring-lime-500/10 outline-none resize-none shadow-inner text-slate-800 dark:text-zinc-200" value={tempDescription} onChange={(e) => setTempDescription(e.target.value)} placeholder="輸入專案描述..." />
                                    ) : (
                                        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-zinc-400 text-lg leading-loose break-words">{project.description || '暫無描述...'}</div>
                                    )}
                                </div>

                                {/* Project Notes Card */}
                                <div className="bg-white dark:bg-[#18181b] rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-zinc-800 relative group hover:shadow-lg dark:hover:shadow-lime-400/5 transition-all">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-3 text-xl"><PenLine size={24} className="text-lime-500" /> 專案筆記</h3>
                                        {canEditProject && (
                                            <button onClick={() => isEditingNotes ? handleSaveNotes() : setIsEditingNotes(true)} className="text-sm font-bold text-lime-700 bg-lime-100 hover:bg-lime-200 dark:bg-lime-400 dark:text-black dark:hover:bg-lime-300 px-4 py-2 rounded-xl transition-colors">{isEditingNotes ? '儲存' : '編輯'}</button>
                                        )}
                                    </div>
                                    {isEditingNotes ? (
                                        <textarea className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl p-6 min-h-[300px] text-lg focus:ring-4 ring-lime-500/10 outline-none resize-none shadow-inner text-slate-800 dark:text-zinc-200" value={tempNotes} onChange={(e) => setTempNotes(e.target.value)} />
                                    ) : (
                                        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-zinc-400 text-lg leading-loose break-words">{project.notes || '尚無筆記。'}</div>
                                    )}
                                </div>
                            </div>

                            <div className="col-span-12 xl:col-span-4 space-y-8">
                                {/* Project Schedule Card */}
                                <div className="bg-white dark:bg-[#18181b] p-6 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-1">開始日期</p>
                                        <input
                                            type="date"
                                            value={project.startDate}
                                            onChange={(e) => canEditProject && onUpdateProject({ ...project, startDate: e.target.value })}
                                            className={`font-bold text-slate-800 dark:text-white bg-transparent outline-none w-full ${canEditProject ? 'cursor-pointer hover:text-lime-500' : 'cursor-default'}`}
                                            disabled={!canEditProject}
                                        />
                                    </div>
                                    <div className="h-10 w-[1px] bg-slate-100 dark:bg-zinc-800 mx-4"></div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-1">截止日期</p>
                                        <input
                                            type="date"
                                            value={project.dueDate}
                                            onChange={(e) => canEditProject && onUpdateProject({ ...project, dueDate: e.target.value })}
                                            className={`font-bold text-slate-800 dark:text-white bg-transparent outline-none w-full ${canEditProject ? 'cursor-pointer hover:text-lime-500' : 'cursor-default'}`}
                                            disabled={!canEditProject}
                                        />
                                    </div>
                                </div>

                                {/* Budget Card */}
                                {(canEditProject || project.budgetVisibleToMembers || currentUser.accessLevel !== 'Member') && (
                                    <div className="bg-white dark:bg-[#18181b] p-6 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase">專案預算</p>

                                            {/* Visibility Control Button - Only for SeniorMember+ */}
                                            {['Admin', 'Manager', 'SeniorMember'].includes(currentUser.accessLevel) && (
                                                <button
                                                    onClick={() => onUpdateProject({
                                                        ...project,
                                                        budgetVisibleToMembers: !project.budgetVisibleToMembers
                                                    })}
                                                    className="text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-lime-600 dark:hover:text-lime-400 transition-colors flex items-center gap-1"
                                                    title={project.budgetVisibleToMembers ? '點擊隱藏給一般會員' : '點擊顯示給一般會員'}
                                                >
                                                    {project.budgetVisibleToMembers ? (
                                                        <><Eye size={14} /> 會員可見</>
                                                    ) : (
                                                        <><EyeOff size={14} /> 會員不可見</>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-baseline gap-2">
                                            {canEditProject ? (
                                                <input
                                                    type="text"
                                                    value={project.budget}
                                                    onChange={(e) => onUpdateProject({ ...project, budget: e.target.value })}
                                                    className="text-2xl font-black text-slate-800 dark:text-white bg-transparent outline-none border-b-2 border-transparent hover:border-lime-400 focus:border-lime-400 transition-colors w-full"
                                                    placeholder="輸入預算"
                                                />
                                            ) : (
                                                <span className="text-2xl font-black text-slate-800 dark:text-white">
                                                    ${parseInt(project.budget || '0').toLocaleString()}
                                                </span>
                                            )}
                                            <span className="text-sm text-slate-400 dark:text-zinc-500">TWD</span>
                                        </div>

                                        {/* Budget Usage Progress - If transactions exist */}
                                        {Array.isArray(project.transactions) && project.transactions.length > 0 && (
                                            <div className="mt-4">
                                                <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-zinc-500 mb-1">
                                                    <span>已使用</span>
                                                    <span>{Math.round((totalExpense / parseInt(project.budget || '1')) * 100)}%</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-lime-400 to-lime-600 transition-all"
                                                        style={{ width: `${Math.min((totalExpense / parseInt(project.budget || '1')) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="bg-white dark:bg-[#18181b] rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-zinc-800 hover:shadow-lg dark:hover:shadow-lime-400/5 transition-all">
                                    <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3 text-xl"><User size={24} className="text-lime-500" /> 團隊成員</h3>
                                    <div className="space-y-3">
                                        {activeMembers.map(m => (
                                            <div key={m.id} className="flex items-center gap-4 bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm transition-colors">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lime-400 to-lime-600 text-black flex items-center justify-center text-lg font-bold shadow-md">{m.name.charAt(0)}</div>
                                                <div>
                                                    <div className="text-base font-bold text-slate-800 dark:text-white">{m.name}</div>
                                                    <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">{m.role}</div>
                                                </div>
                                            </div>
                                        ))}
                                        {canEditProject && (
                                            <button onClick={() => setShowMemberSelect(!showMemberSelect)} className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 text-slate-400 dark:text-zinc-500 flex items-center justify-center gap-2 hover:border-lime-400 hover:text-lime-600 dark:hover:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/10 transition-all font-bold">
                                                <Plus size={20} /> 新增成員
                                            </button>
                                        )}
                                    </div>
                                    {showMemberSelect && (
                                        <div className="mt-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-700 p-2 shadow-xl animate-enter">
                                            <div className="flex justify-between items-center px-3 py-2 border-b border-slate-50 dark:border-zinc-800 mb-2">
                                                <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">選擇成員</span>
                                                <button onClick={() => setShowMemberSelect(false)} className="bg-slate-100 dark:bg-zinc-800 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 transition-colors">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            {allMembers.map(m => (
                                                <div key={m.id} onClick={() => toggleMember(m.id)} className={`p-3 rounded-xl text-sm font-bold cursor-pointer flex justify-between items-center mb-1 transition-colors ${teamMembers.includes(m.id) ? 'bg-lime-100 dark:bg-lime-400/20 text-lime-700 dark:text-lime-400' : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300'}`}>
                                                    {m.name}
                                                    {teamMembers.includes(m.id) && <Check size={18} />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* New Interactive Calendar View */}
                {activeTab === 'schedule' && (
                    <div className="h-full overflow-y-auto custom-scrollbar p-1">
                        <div className="bg-white dark:bg-[#18181b] rounded-3xl p-6 border border-slate-100 dark:border-zinc-800 shadow-sm h-full flex flex-col">
                            {/* Calendar Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <Calendar size={20} className="text-lime-500" />
                                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">專案時程表</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <h2 className="text-xl font-black text-slate-800 dark:text-white">
                                        {calendarDate.getFullYear()}年 {calendarDate.getMonth() + 1}月
                                    </h2>
                                    <div className="flex gap-1 bg-slate-100 dark:bg-zinc-800 rounded-lg p-1">
                                        <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))} className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-md shadow-sm transition-all text-slate-600 dark:text-zinc-400"><ChevronLeft size={18} /></button>
                                        <button onClick={() => setCalendarDate(new Date())} className="px-2 text-xs font-bold hover:bg-white dark:hover:bg-zinc-700 rounded-md shadow-sm transition-all text-slate-600 dark:text-zinc-400">今天</button>
                                        <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))} className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-md shadow-sm transition-all text-slate-600 dark:text-zinc-400"><ChevronRight size={18} /></button>
                                    </div>
                                </div>
                            </div>

                            {/* Calendar Grid */}
                            <div className="flex-1 flex flex-col border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                                {/* Days Header */}
                                <div className="grid grid-cols-7 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
                                    {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                                        <div key={day} className="py-2 text-center text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase">
                                            {day}
                                        </div>
                                    ))}
                                </div>
                                {/* Calendar Body */}
                                <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-white dark:bg-[#18181b]">
                                    {renderCalendar()}
                                </div>
                            </div>

                            <div className="mt-4 flex gap-4 text-xs font-bold text-slate-500 dark:text-zinc-500 justify-end">
                                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-lime-400 rounded-full"></span> 今天</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500/20 border-l-2 border-blue-500 rounded"></span> 一般任務</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-orange-500/20 border-l-2 border-orange-500 rounded"></span> 高優先級</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-rose-500/20 border-l-2 border-rose-500 rounded"></span> 緊急</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-emerald-500/20 border-l-2 border-emerald-500 rounded"></span> 已完成</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rest of the component (Tasks, Proofing, Chat) stays largely the same but utilizes the prop-synced state */}
                {activeTab === 'tasks' && (
                    <div className="h-full overflow-x-auto p-1">
                        <div className="flex gap-4 md:gap-6 h-full min-w-[300px] md:min-w-[1000px] flex-col md:flex-row">
                            {columns.map(status => (
                                <div key={status} className="flex-1 md:min-w-[320px] flex flex-col bg-slate-50 dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 h-full max-h-full">
                                    <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${status === Status.DONE ? 'bg-emerald-500' : status === Status.IN_PROGRESS ? 'bg-lime-400' : 'bg-slate-400'}`}></div>
                                            <h3 className="font-bold text-slate-700 dark:text-zinc-300">{status}</h3>
                                            <span className="bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-lg text-xs font-bold text-slate-400 dark:text-zinc-500 shadow-sm border border-slate-100 dark:border-zinc-700">{tasks.filter(t => t.status === status).length}</span>
                                        </div>
                                        {canEditProject && (
                                            <button onClick={() => setShowNewTaskInput(status)} className="text-slate-400 hover:text-lime-600 dark:hover:text-lime-400 p-1"><Plus size={18} /></button>
                                        )}
                                    </div>
                                    <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-3 min-h-[200px] md:min-h-0">
                                        {showNewTaskInput === status && (
                                            <div className="bg-white dark:bg-[#18181b] p-3 rounded-2xl shadow-lg border-2 border-lime-100 dark:border-lime-900 animate-enter">
                                                <input autoFocus className="w-full text-sm font-bold mb-2 outline-none placeholder:text-slate-300 dark:placeholder:text-zinc-600 bg-transparent text-slate-800 dark:text-white" placeholder="輸入任務名稱..." value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTask(status)} />
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setShowNewTaskInput(null)} className="text-xs text-slate-400 dark:text-zinc-500 font-bold hover:text-slate-600 dark:hover:text-zinc-300">取消</button>
                                                    <button onClick={() => handleAddTask(status)} className="text-xs bg-lime-400 text-black px-3 py-1.5 rounded-lg font-bold hover:bg-lime-500">新增</button>
                                                </div>
                                            </div>
                                        )}
                                        {tasks.filter(t => t.status === status).map(task => (
                                            <div key={task.id} onClick={() => setSelectedTask(task)} className="bg-white dark:bg-[#18181b] p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-lime-200 dark:hover:border-lime-800 cursor-pointer transition-all group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${task.priority === Priority.HIGH || task.priority === Priority.CRITICAL ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-500' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'}`}>{task.priority}</span>
                                                    {canEditProject && (
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id) }} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                                                    )}
                                                </div>
                                                <h4 className="font-bold text-slate-800 dark:text-zinc-200 text-sm mb-1">{task.title}</h4>
                                                {task.subtasks.length > 0 && (
                                                    <div className="flex items-center gap-2 mt-3">
                                                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }}></div>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ... Proofing and Chat tabs content identical to previous version ... */}
                {activeTab === 'proofing' && (
                    <div className="h-full overflow-y-auto custom-scrollbar p-1">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800 dark:text-white text-xl flex items-center gap-2">設計校稿</h3>
                            {canEditProject && (
                                <button onClick={() => setShowAddProofing(true)} className="bg-slate-900 dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-slate-800 dark:hover:bg-zinc-200 transition-all">
                                    <Upload size={18} /> 上傳
                                </button>
                            )}
                        </div>

                        {showAddProofing && createPortal(
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddProofing(false)}></div>
                                <div className="bg-white dark:bg-[#18181b] w-full max-w-2xl rounded-[32px] shadow-2xl relative z-10 p-8 animate-enter flex flex-col max-h-[85vh] border border-slate-200 dark:border-zinc-700">
                                    <div className="flex justify-between items-center mb-6 flex-shrink-0">
                                        <h4 className="font-bold text-slate-800 dark:text-white text-xl">新增校稿版本</h4>
                                        <button onClick={() => setShowAddProofing(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={24} className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-white" /></button>
                                    </div>
                                    <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1 pr-2">
                                        <input
                                            className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold focus:border-lime-500 outline-none transition-all text-slate-800 dark:text-white"
                                            placeholder="版本標題 (若留空則自動產生)"
                                            value={newProofingTitle}
                                            onChange={e => setNewProofingTitle(e.target.value)}
                                        />

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {newProofingImages.map((img, i) => (
                                                <div key={i} className="aspect-square rounded-xl overflow-hidden relative group border border-slate-200 dark:border-zinc-700">
                                                    <img src={img} className="w-full h-full object-cover" />
                                                    <button onClick={() => setNewProofingImages(newProofingImages.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                                                </div>
                                            ))}
                                            <label className={`aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-zinc-700 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500 transition-all ${isUploadingImages ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:border-lime-400 hover:text-lime-500 hover:bg-lime-50 dark:hover:bg-lime-900/10'}`}>
                                                {isUploadingImages ? <Loader2 size={24} className="mb-2 animate-spin" /> : <ImageIcon size={24} className="mb-2" />}
                                                <span className="text-xs font-bold text-center px-2">{isUploadingImages ? '讀取中...' : '批次上傳圖片\n(總量 < 2MB)'}</span>
                                                <input type="file" className="hidden" accept="image/*" multiple onChange={handleAddImage} ref={fileInputRef} disabled={isUploadingImages} />
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-6 flex-shrink-0">
                                        {newProofingImages.length > 0 && (
                                            <button onClick={() => setNewProofingImages([])} className="text-slate-400 hover:text-rose-500 px-4 py-2 font-bold text-sm">
                                                清空
                                            </button>
                                        )}
                                        <button
                                            onClick={handleSaveProofing}
                                            disabled={isUploadingImages || newProofingImages.length === 0}
                                            className={`px-6 py-2 rounded-xl font-bold transition-all ${isUploadingImages || newProofingImages.length === 0 ? 'bg-slate-300 dark:bg-zinc-700 text-slate-500 cursor-not-allowed' : 'bg-lime-400 text-black hover:bg-lime-500'}`}
                                        >
                                            {isUploadingImages ? '處理中...' : `發布${newProofingImages.length > 0 ? ` (${newProofingImages.length})` : ''}`}
                                        </button>
                                    </div>
                                </div>
                            </div>,
                            document.body
                        )}

                        <div className="space-y-12">
                            {proofing.length > 0 ? proofing.map(round => (
                                <div key={round.id} className="bg-white dark:bg-[#18181b] rounded-[32px] p-8 border border-slate-100 dark:border-zinc-800 shadow-sm">
                                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-50 dark:border-zinc-800">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-slate-500 dark:text-zinc-400">{round.date.split('-')[2]}</div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{round.title}</h3>
                                            <p className="text-sm text-slate-400 dark:text-zinc-500 font-medium">{round.date}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {round.images.map((img, idx) => (
                                            <div key={idx} onClick={() => setPreviewImage(img)} className="rounded-2xl overflow-hidden border border-slate-100 dark:border-zinc-800 shadow-sm group relative cursor-zoom-in h-40 md:h-48 w-full">
                                                <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors pointer-events-none flex items-center justify-center">
                                                    <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={24} />
                                                </div>
                                                {/* DELETE BUTTON - High Z-index and Stop Propagation */}
                                                {canEditProject && (
                                                    <button
                                                        onClick={(e) => handleDeleteProofingImage(e, round.id, idx)}
                                                        className="absolute top-2 right-2 bg-white/90 p-2 rounded-lg text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all z-30 shadow-md border border-slate-100"
                                                        title="刪除圖片"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-20">
                                    <div className="w-20 h-20 bg-slate-50 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-zinc-600">
                                        <ImageIcon size={32} />
                                    </div>
                                    <p className="text-slate-400 dark:text-zinc-500 font-bold">尚無校稿紀錄</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'notes' && (
                    <div className="h-full overflow-y-auto custom-scrollbar p-1">
                        <div className="bg-white dark:bg-[#18181b] rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-zinc-800 relative group hover:shadow-lg dark:hover:shadow-lime-400/5 transition-all h-full flex flex-col">
                            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-3 text-xl"><PenLine size={24} className="text-lime-500" /> 專案筆記</h3>
                                <div className="flex gap-2">
                                    {canEditProject && (
                                        <button onClick={() => isEditingNotes ? handleSaveNotes() : setIsEditingNotes(true)} className="text-sm font-bold text-lime-700 bg-lime-100 hover:bg-lime-200 dark:bg-lime-400 dark:text-black dark:hover:bg-lime-300 px-4 py-2 rounded-xl transition-colors">{isEditingNotes ? '儲存' : '編輯'}</button>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 min-h-0">
                                {isEditingNotes ? (
                                    <div className="h-full flex flex-col">
                                        <textarea
                                            className="w-full flex-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl p-6 text-lg focus:ring-4 ring-lime-500/10 outline-none resize-none shadow-inner text-slate-800 dark:text-zinc-200"
                                            value={tempNotes}
                                            onChange={(e) => setTempNotes(e.target.value)}
                                            placeholder="在此輸入專案筆記..."
                                        />
                                    </div>
                                ) : (
                                    <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-zinc-400 text-lg leading-loose break-words h-full overflow-y-auto custom-scrollbar">
                                        {project.notes ? (
                                            (() => {
                                                // Process the entire notes content to handle images properly
                                                const content = project.notes;
                                                const parts: React.ReactElement[] = [];
                                                let lastIndex = 0;

                                                // Match all Markdown images (including those with long base64 URLs)
                                                const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
                                                let match;
                                                let key = 0;

                                                while ((match = imgRegex.exec(content)) !== null) {
                                                    // Add text before the image
                                                    if (match.index > lastIndex) {
                                                        const textBefore = content.substring(lastIndex, match.index);
                                                        textBefore.split('\n').forEach((line, i) => {
                                                            if (line.trim()) {
                                                                parts.push(<p key={`text-${key}-${i}`}>{line}</p>);
                                                            } else {
                                                                parts.push(<br key={`br-${key}-${i}`} />);
                                                            }
                                                        });
                                                    }

                                                    // Add the image
                                                    parts.push(
                                                        <img
                                                            key={`img-${key}`}
                                                            src={match[2]}
                                                            alt={match[1] || '圖片'}
                                                            className="rounded-xl my-4 max-w-full shadow-md"
                                                        />
                                                    );

                                                    lastIndex = match.index + match[0].length;
                                                    key++;
                                                }

                                                // Add remaining text after the last image
                                                if (lastIndex < content.length) {
                                                    const textAfter = content.substring(lastIndex);
                                                    textAfter.split('\n').forEach((line, i) => {
                                                        if (line.trim()) {
                                                            parts.push(<p key={`text-end-${i}`}>{line}</p>);
                                                        } else {
                                                            parts.push(<br key={`br-end-${i}`} />);
                                                        }
                                                    });
                                                }

                                                return parts.length > 0 ? parts : '尚無筆記。點擊「編輯」開始記錄。';
                                            })()
                                        ) : '尚無筆記。點擊「編輯」開始記錄。'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'chat' && (
                    <ProjectChat
                        project={project}
                        currentUser={currentUser}
                        allMembers={allMembers}
                        onSendMessage={handleSendMessage}
                        embedded={true}
                    />
                )}
            </div>

            {/* Image Preview Modal */}
            {previewImage && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-enter" onClick={() => setPreviewImage(null)}>
                    <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10">
                        <X size={24} className="text-white" />
                    </button>
                    <img
                        src={previewImage}
                        className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
                        onClick={(e) => e.stopPropagation()}
                        alt="預覽圖片"
                    />
                </div>,
                document.body
            )}

            {/* Stage Editing Modal */}
            {isEditingStages && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsEditingStages(false)}></div>
                    <div className="bg-white dark:bg-[#18181b] w-full max-w-2xl rounded-[32px] shadow-2xl relative z-10 p-8 animate-enter border border-slate-200 dark:border-zinc-700">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-bold text-slate-800 dark:text-white text-xl">編輯階段流程</h4>
                            <button onClick={() => setIsEditingStages(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                <X size={24} className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-white" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            {tempStages.map((stage, index) => (
                                <div key={index} className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-700">
                                    <GripVertical size={18} className="text-slate-300 dark:text-zinc-600 cursor-move" />
                                    <input
                                        value={stage}
                                        onChange={(e) => {
                                            const newStages = [...tempStages];
                                            newStages[index] = e.target.value;
                                            setTempStages(newStages);
                                        }}
                                        className="flex-1 bg-transparent font-bold text-slate-800 dark:text-white outline-none"
                                    />
                                    <button
                                        onClick={() => setTempStages(tempStages.filter((_, i) => i !== index))}
                                        className="text-slate-400 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}

                            <div className="flex gap-2">
                                <input
                                    value={newStageInput}
                                    onChange={(e) => setNewStageInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newStageInput.trim()) {
                                            setTempStages([...tempStages, newStageInput.trim()]);
                                            setNewStageInput('');
                                        }
                                    }}
                                    placeholder="新增階段..."
                                    className="flex-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold focus:border-lime-500 outline-none transition-all text-slate-800 dark:text-white"
                                />
                                <button
                                    onClick={() => {
                                        if (newStageInput.trim()) {
                                            setTempStages([...tempStages, newStageInput.trim()]);
                                            setNewStageInput('');
                                        }
                                    }}
                                    className="bg-lime-400 text-black px-6 py-3 rounded-xl font-bold hover:bg-lime-500 transition-colors"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditingStages(false)}
                                className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSaveStages}
                                className="bg-lime-400 text-black px-6 py-3 rounded-xl font-bold hover:bg-lime-500 transition-colors flex items-center gap-2"
                            >
                                <Save size={18} />
                                儲存變更
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Schedule Modal */}
            {scheduleModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setScheduleModalOpen(false)}></div>
                    <div className="bg-white dark:bg-[#18181b] w-full max-w-2xl rounded-[32px] shadow-2xl relative z-10 p-8 animate-enter border border-slate-200 dark:border-zinc-700">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-bold text-slate-800 dark:text-white text-xl">
                                {scheduleData.id ? '編輯時程' : '新增時程'}
                            </h4>
                            <button onClick={() => setScheduleModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                <X size={24} className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-white" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-zinc-400 mb-2">標題</label>
                                <input
                                    value={scheduleData.title || ''}
                                    onChange={(e) => setScheduleData({ ...scheduleData, title: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold focus:border-lime-500 outline-none transition-all text-slate-800 dark:text-white"
                                    placeholder="輸入事項標題"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 dark:text-zinc-400 mb-2">開始日期</label>
                                    <input
                                        type="date"
                                        value={scheduleData.startDate || ''}
                                        onChange={(e) => setScheduleData({ ...scheduleData, startDate: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold focus:border-lime-500 outline-none transition-all text-slate-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 dark:text-zinc-400 mb-2">結束日期</label>
                                    <input
                                        type="date"
                                        value={scheduleData.dueDate || ''}
                                        onChange={(e) => setScheduleData({ ...scheduleData, dueDate: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold focus:border-lime-500 outline-none transition-all text-slate-800 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 dark:text-zinc-400 mb-2">狀態</label>
                                    <select
                                        value={scheduleData.status || Status.TODO}
                                        onChange={(e) => setScheduleData({ ...scheduleData, status: e.target.value as Status })}
                                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold focus:border-lime-500 outline-none transition-all text-slate-800 dark:text-white"
                                    >
                                        <option value={Status.TODO}>待辦</option>
                                        <option value={Status.IN_PROGRESS}>進行中</option>
                                        <option value={Status.DONE}>完成</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 dark:text-zinc-400 mb-2">優先級</label>
                                    <select
                                        value={scheduleData.priority || Priority.MEDIUM}
                                        onChange={(e) => setScheduleData({ ...scheduleData, priority: e.target.value as Priority })}
                                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold focus:border-lime-500 outline-none transition-all text-slate-800 dark:text-white"
                                    >
                                        <option value={Priority.LOW}>低</option>
                                        <option value={Priority.MEDIUM}>中</option>
                                        <option value={Priority.HIGH}>高</option>
                                        <option value={Priority.CRITICAL}>緊急</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-zinc-400 mb-2">描述</label>
                                <textarea
                                    value={scheduleData.description || ''}
                                    onChange={(e) => setScheduleData({ ...scheduleData, description: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold focus:border-lime-500 outline-none transition-all text-slate-800 dark:text-white resize-none"
                                    rows={3}
                                    placeholder="輸入描述（選填）"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-6">
                            {scheduleData.id && (
                                <button
                                    onClick={handleDeleteSchedule}
                                    className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-4 py-2 rounded-xl font-bold transition-colors"
                                >
                                    刪除
                                </button>
                            )}
                            <div className="flex gap-3 ml-auto">
                                <button
                                    onClick={() => setScheduleModalOpen(false)}
                                    className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSaveSchedule}
                                    className="bg-lime-400 text-black px-6 py-3 rounded-xl font-bold hover:bg-lime-500 transition-colors"
                                >
                                    儲存
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Task Detail Modal */}
            {selectedTask && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedTask(null)}></div>
                    <div className="bg-white dark:bg-[#18181b] w-full max-w-2xl rounded-[32px] shadow-2xl relative z-10 p-8 animate-enter border border-slate-200 dark:border-zinc-700">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-bold text-slate-800 dark:text-white text-xl">任務詳情</h4>
                            <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                <X size={24} className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-white" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-zinc-400 mb-2">標題</label>
                                <input
                                    value={selectedTask.title}
                                    onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold focus:border-lime-500 outline-none transition-all text-slate-800 dark:text-white"
                                    disabled={!canEditProject}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-zinc-400 mb-2">描述</label>
                                <textarea
                                    value={selectedTask.description}
                                    onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold focus:border-lime-500 outline-none transition-all text-slate-800 dark:text-white resize-none"
                                    rows={3}
                                    disabled={!canEditProject}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 dark:text-zinc-400 mb-2">狀態</label>
                                    <select
                                        value={selectedTask.status}
                                        onChange={(e) => setSelectedTask({ ...selectedTask, status: e.target.value as Status })}
                                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold focus:border-lime-500 outline-none transition-all text-slate-800 dark:text-white"
                                        disabled={!canEditProject}
                                    >
                                        <option value={Status.TODO}>待辦</option>
                                        <option value={Status.IN_PROGRESS}>進行中</option>
                                        <option value={Status.DONE}>完成</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 dark:text-zinc-400 mb-2">優先級</label>
                                    <select
                                        value={selectedTask.priority}
                                        onChange={(e) => setSelectedTask({ ...selectedTask, priority: e.target.value as Priority })}
                                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold focus:border-lime-500 outline-none transition-all text-slate-800 dark:text-white"
                                        disabled={!canEditProject}
                                    >
                                        <option value={Priority.LOW}>低</option>
                                        <option value={Priority.MEDIUM}>中</option>
                                        <option value={Priority.HIGH}>高</option>
                                        <option value={Priority.CRITICAL}>緊急</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-zinc-400 mb-2">指派給</label>
                                <select
                                    value={selectedTask.assignee || ''}
                                    onChange={(e) => setSelectedTask({ ...selectedTask, assignee: e.target.value || undefined })}
                                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold focus:border-lime-500 outline-none transition-all text-slate-800 dark:text-white"
                                    disabled={!canEditProject}
                                >
                                    <option value="">未指派</option>
                                    {activeMembers.map(member => (
                                        <option key={member.id} value={member.id}>
                                            {member.name} ({member.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 dark:text-zinc-400 mb-2">開始日期</label>
                                    <input
                                        type="date"
                                        value={selectedTask.startDate || ''}
                                        onChange={(e) => setSelectedTask({ ...selectedTask, startDate: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold focus:border-lime-500 outline-none transition-all text-slate-800 dark:text-white"
                                        disabled={!canEditProject}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 dark:text-zinc-400 mb-2">結束日期</label>
                                    <input
                                        type="date"
                                        value={selectedTask.dueDate || ''}
                                        onChange={(e) => setSelectedTask({ ...selectedTask, dueDate: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold focus:border-lime-500 outline-none transition-all text-slate-800 dark:text-white"
                                        disabled={!canEditProject}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-bold text-slate-600 dark:text-zinc-400">子任務</label>
                                    {canEditProject && (
                                        <button
                                            onClick={() => {
                                                const newSubtask = { id: Date.now().toString(), title: '新子任務', completed: false };
                                                setSelectedTask({ ...selectedTask, subtasks: [...selectedTask.subtasks, newSubtask] });
                                            }}
                                            className="text-xs bg-lime-400 text-black px-3 py-1.5 rounded-lg font-bold hover:bg-lime-500 flex items-center gap-1"
                                        >
                                            <Plus size={14} /> 新增
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {selectedTask.subtasks.map((subtask, idx) => (
                                        <div key={subtask.id} className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl">
                                            <input
                                                type="checkbox"
                                                checked={subtask.completed}
                                                onChange={(e) => {
                                                    const newSubtasks = [...selectedTask.subtasks];
                                                    newSubtasks[idx].completed = e.target.checked;
                                                    setSelectedTask({ ...selectedTask, subtasks: newSubtasks });
                                                }}
                                                className="w-4 h-4 rounded border-slate-300 dark:border-zinc-600"
                                                disabled={!canEditProject}
                                            />
                                            <input
                                                value={subtask.title}
                                                onChange={(e) => {
                                                    const newSubtasks = [...selectedTask.subtasks];
                                                    newSubtasks[idx].title = e.target.value;
                                                    setSelectedTask({ ...selectedTask, subtasks: newSubtasks });
                                                }}
                                                className="flex-1 bg-transparent font-bold text-sm text-slate-800 dark:text-white outline-none"
                                                disabled={!canEditProject}
                                            />
                                            {canEditProject && (
                                                <button
                                                    onClick={() => {
                                                        const newSubtasks = selectedTask.subtasks.filter((_, i) => i !== idx);
                                                        setSelectedTask({ ...selectedTask, subtasks: newSubtasks });
                                                    }}
                                                    className="text-slate-400 hover:text-rose-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setSelectedTask(null)}
                                className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                {canEditProject ? '取消' : '關閉'}
                            </button>
                            {canEditProject && (
                                <button
                                    onClick={() => {
                                        handleUpdateTask(selectedTask);
                                        setSelectedTask(null);
                                    }}
                                    className="bg-lime-400 text-black px-6 py-3 rounded-xl font-bold hover:bg-lime-500 transition-colors"
                                >
                                    儲存
                                </button>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
