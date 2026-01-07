
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Member, AccessLevel } from '../types';
import { Trash2, UserPlus, Mail, X, Lock, KeyRound, UserCheck, UserX, Loader2 } from 'lucide-react';

interface TeamViewProps {
    members: Member[];
    onAddMember: (member: Member) => Promise<void>; // Modified to Promise
    onUpdateMember: (member: Member) => void;
    onRemoveMember: (id: string) => void;
    currentUser: Member;
}

export const TeamView: React.FC<TeamViewProps> = ({ members, onAddMember, onUpdateMember, onRemoveMember, currentUser }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [formData, setFormData] = useState<Partial<Member>>({});
    const [isProcessing, setIsProcessing] = useState(false); // New Loading State

    const canManageTeam = ['Admin', 'Manager', 'SeniorMember'].includes(currentUser.accessLevel);

    const handleInitAdd = () => {
        setFormData({ name: '', email: '', password: '', role: '', accessLevel: 'Member', status: 'Active' });
        setShowAddForm(true);
        setEditingMember(null);
    };

    const handleInitEdit = (member: Member) => {
        if (!canManageTeam) return;
        setEditingMember(member);
        setFormData({
            name: member.name,
            email: member.email,
            role: member.role,
            accessLevel: member.accessLevel,
            status: member.status || 'Active',
            password: '' // Explicitly empty to indicate no change unless user types
        });
    };

    const handleSubmit = async () => {
        if (!formData.name?.trim() || !formData.email?.trim()) {
            alert("請輸入姓名與 Email");
            return;
        }

        // Clean inputs
        const cleanName = formData.name.trim();
        const cleanEmail = formData.email.trim();
        const cleanRole = formData.role ? formData.role.trim() : 'Member';
        const cleanPassword = formData.password ? formData.password.trim() : '';

        setIsProcessing(true);

        try {
            if (editingMember) {
                // Edit Mode - Do NOT include password field in Firestore update
                const updatedMember: Member = {
                    ...editingMember,
                    name: cleanName,
                    email: cleanEmail,
                    role: cleanRole,
                    accessLevel: formData.accessLevel as AccessLevel,
                    status: formData.status as 'Active' | 'Suspended'
                    // Password is intentionally excluded - cannot update via client SDK
                };
                onUpdateMember(updatedMember);
                setEditingMember(null);
            } else {
                // Create Mode (Calls Firebase via App.tsx)
                const finalPassword = cleanPassword || '123456';
                await onAddMember({
                    id: '', // Placeholder, will be replaced by Firebase UID
                    name: cleanName,
                    email: cleanEmail,
                    password: finalPassword,
                    role: cleanRole,
                    status: formData.status as 'Active' | 'Suspended' || 'Active',
                    accessLevel: formData.accessLevel as AccessLevel || 'Member',
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=random`
                });
                setShowAddForm(false);
            }
            setFormData({});
        } catch (e) {
            // Error handling is done in App.tsx (alerts), but we need to stop loading
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    const getAccessLevelName = (level: string) => {
        switch (level) {
            case 'Admin': return '系統管理員';
            case 'Manager': return '專案經理';
            default: return '一般成員';
        }
    };

    return (
        <div className="space-y-8 animate-enter pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">團隊管理</h2>
                    <p className="text-slate-400 dark:text-zinc-500 mt-2 text-sm font-medium">查看系統權限與成員角色，點擊卡片可編輯資料。</p>
                </div>
                {canManageTeam && (
                    <button onClick={handleInitAdd} className="bg-lime-400 text-black px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-lime-500 transition-all shadow-lg hover:shadow-xl">
                        <UserPlus size={18} /> 新增成員
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {members.map(member => (
                    <div key={member.id} onClick={() => handleInitEdit(member)} className={`bento-card p-6 group relative overflow-hidden ${canManageTeam ? 'cursor-pointer hover:border-lime-200 dark:hover:border-lime-800' : 'cursor-default'} ${member.status === 'Suspended' ? 'opacity-60 bg-slate-50 dark:bg-zinc-900' : 'bg-white dark:bg-[#18181b]'} border border-slate-100 dark:border-zinc-800`}>
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-900 text-slate-600 dark:text-zinc-400 flex items-center justify-center text-2xl font-bold shadow-inner group-hover:scale-110 transition-transform duration-300 overflow-hidden relative">
                                {member.avatar ? (
                                    <img
                                        src={member.avatar}
                                        className="w-full h-full object-cover"
                                        alt={member.name}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : (
                                    member.name.charAt(0)
                                )}
                                {/* Fallback for error */}
                                <div className={`hidden absolute inset-0 bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-slate-500`}>
                                    {member.name.charAt(0)}
                                </div>

                                {member.status === 'Suspended' && (
                                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                                        <Lock size={20} className="text-white" />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${member.accessLevel === 'Admin' ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-500' : member.accessLevel === 'Manager' ? 'bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-500' : 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'}`}>
                                    {getAccessLevelName(member.accessLevel)}
                                </span>
                                {member.status === 'Suspended' && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-500">已停用</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-1">{member.name}</h3>
                            <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide mb-4">{member.role}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl font-medium">
                                <Mail size={14} /> <span className="truncate">{member.email}</span>
                            </div>
                        </div>
                        {canManageTeam && (
                            <button onClick={(e) => { e.stopPropagation(); onRemoveMember(member.id); }} className="absolute bottom-4 right-4 text-slate-300 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg">
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal - Portaled */}
            {(showAddForm || editingMember) && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => { if (!isProcessing) { setShowAddForm(false); setEditingMember(null); } }}>
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"></div>
                    <div className="bg-white dark:bg-[#18181b] w-full max-w-md rounded-[32px] shadow-2xl relative z-10 p-8 animate-enter flex flex-col max-h-[85vh] border border-slate-200 dark:border-zinc-700" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8 flex-shrink-0">
                            <h3 className="font-bold text-slate-800 dark:text-white text-xl">{editingMember ? '編輯成員 (本地)' : '新增 Firebase 帳號'}</h3>
                            <button onClick={() => { if (!isProcessing) { setShowAddForm(false); setEditingMember(null); } }}><X size={24} className="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-white" /></button>
                        </div>
                        <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1 pr-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">全名</label>
                                <input type="text" className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-white focus:bg-white dark:focus:bg-black transition-all outline-none focus:border-lime-500" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="例如: 王小明" disabled={isProcessing} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">Email 信箱 (登入帳號)</label>
                                <input type="email" className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-white focus:bg-white dark:focus:bg-black transition-all outline-none focus:border-lime-500" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="name@company.com" disabled={isProcessing || !!editingMember} />
                                {editingMember && <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 ml-1">* Email 無法修改 (Firebase 限制)</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1 flex items-center gap-1">
                                    {editingMember ? <><KeyRound size={12} /> 重設密碼 (僅限本地紀錄)</> : '設定密碼'}
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-white focus:bg-white dark:focus:bg-black transition-all placeholder:text-slate-300 dark:placeholder:text-zinc-600 outline-none focus:border-lime-500"
                                    value={formData.password || ''}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={editingMember ? "無法透過 Client SDK 修改他人密碼" : "預設密碼: 123456"}
                                    disabled={isProcessing || !!editingMember}
                                />
                                {!editingMember && !formData.password && (
                                    <p className="text-[10px] text-blue-500 dark:text-blue-400 font-bold mt-1 ml-1">* 未填寫將自動設定為 123456</p>
                                )}
                                {editingMember && (
                                    <p className="text-[10px] text-rose-400 font-bold mt-1 ml-1">* 若要重設他人密碼，請使用 Firebase Console 發送重設信。</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">職稱</label>
                                <input type="text" className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-white focus:bg-white dark:focus:bg-black transition-all outline-none focus:border-lime-500" value={formData.role || ''} onChange={e => setFormData({ ...formData, role: e.target.value })} placeholder="例如: 設計師" disabled={isProcessing} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">系統權限</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Member', 'Manager', 'Admin'].map(l => (
                                        <button key={l} disabled={isProcessing || !canManageTeam} onClick={() => setFormData({ ...formData, accessLevel: l as AccessLevel })} className={`py-3 rounded-xl text-xs font-bold border-2 transition-all ${formData.accessLevel === l ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-500 dark:border-blue-500 text-blue-600 dark:text-blue-400' : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 hover:border-slate-300 dark:hover:border-zinc-600'} ${!canManageTeam ? 'opacity-50 cursor-not-allowed' : ''}`}>{getAccessLevelName(l)}</button>
                                    ))}
                                </div>
                                {!canManageTeam && <p className="text-[10px] text-rose-400 font-bold mt-1 ml-1">* 您沒有權限修改系統權限</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">帳號狀態</label>
                                <div className="flex gap-3">
                                    <button disabled={isProcessing || !canManageTeam} onClick={() => setFormData({ ...formData, status: 'Active' })} className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 flex items-center justify-center gap-2 transition-all ${formData.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 hover:border-slate-300 dark:hover:border-zinc-600'} ${!canManageTeam ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        <UserCheck size={14} /> 啟用中
                                    </button>
                                    <button disabled={isProcessing || !canManageTeam} onClick={() => setFormData({ ...formData, status: 'Suspended' })} className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 flex items-center justify-center gap-2 transition-all ${formData.status === 'Suspended' ? 'bg-slate-100 dark:bg-zinc-800 border-slate-400 dark:border-zinc-600 text-slate-600 dark:text-zinc-400' : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 hover:border-slate-300 dark:hover:border-zinc-600'} ${!canManageTeam ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        <UserX size={14} /> 已停用
                                    </button>
                                </div>
                                {!canManageTeam && <p className="text-[10px] text-rose-400 font-bold mt-1 ml-1">* 您沒有權限修改帳號狀態</p>}
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end gap-3 flex-shrink-0">
                            <button disabled={isProcessing} onClick={() => { setShowAddForm(false); setEditingMember(null); }} className="px-6 py-3 text-sm font-bold text-slate-500 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl transition-colors">取消</button>
                            <button disabled={isProcessing} onClick={handleSubmit} className="px-8 py-3 bg-lime-400 text-black rounded-xl text-sm font-bold hover:bg-lime-500 shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                                {isProcessing && <Loader2 size={16} className="animate-spin" />}
                                {isProcessing ? '處理中...' : '儲存'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
