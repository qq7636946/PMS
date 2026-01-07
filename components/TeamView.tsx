
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Member, AccessLevel } from '../types';
import { Trash2, UserPlus, Mail, X, Lock, KeyRound, UserCheck, UserX, Loader2, Edit2, Users } from 'lucide-react';

interface TeamViewProps {
    members: Member[];
    onAddMember: (member: Member) => Promise<void>;
    onUpdateMember: (member: Member) => void;
    onRemoveMember: (id: string) => void;
    currentUser: Member;
}

// Predefined teams list
const TEAMS = ['A團隊', 'B團隊', 'C團隊', 'D團隊', '未分配'];

export const TeamView: React.FC<TeamViewProps> = ({ members, onAddMember, onUpdateMember, onRemoveMember, currentUser }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [formData, setFormData] = useState<Partial<Member>>({});
    const [isProcessing, setIsProcessing] = useState(false);

    const canManageTeam = ['Admin', 'Manager', 'SeniorMember'].includes(currentUser.accessLevel);

    const handleInitAdd = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            role: '',
            accessLevel: 'Member',
            status: 'Active',
            team: currentUser.accessLevel === 'Admin' ? undefined : currentUser.team
        });
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
            team: member.team,
            password: ''
        });
    };

    const handleSubmit = async () => {
        if (!formData.name?.trim() || !formData.email?.trim()) {
            alert("請輸入姓名與 Email");
            return;
        }

        const cleanName = formData.name.trim();
        const cleanEmail = formData.email.trim();
        const cleanRole = formData.role ? formData.role.trim() : 'Member';
        const cleanPassword = formData.password ? formData.password.trim() : '';

        setIsProcessing(true);

        try {
            if (editingMember) {
                const updatedMember: Member = {
                    ...editingMember,
                    name: cleanName,
                    email: cleanEmail,
                    role: cleanRole,
                    accessLevel: formData.accessLevel as AccessLevel,
                    status: formData.status as 'Active' | 'Suspended',
                    team: formData.team
                };
                onUpdateMember(updatedMember);
                setEditingMember(null);
            } else {
                const finalPassword = cleanPassword || '123456';
                await onAddMember({
                    id: '',
                    name: cleanName,
                    email: cleanEmail,
                    password: finalPassword,
                    role: cleanRole,
                    status: formData.status as 'Active' | 'Suspended' || 'Active',
                    accessLevel: formData.accessLevel as AccessLevel || 'Member',
                    team: formData.team,
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=random`
                });
                setShowAddForm(false);
            }
            setFormData({});
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    const getAccessLevelName = (level: string) => {
        switch (level) {
            case 'Admin': return '系統管理員';
            case 'Manager': return '專案經理';
            case 'SeniorMember': return '資深成員';
            default: return '一般成員';
        }
    };

    const getAccessLevelColor = (level: string) => {
        switch (level) {
            case 'Admin': return 'bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-500';
            case 'Manager': return 'bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-500';
            case 'SeniorMember': return 'bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-500';
            default: return 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400';
        }
    };

    return (
        <div className="space-y-6 animate-enter pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">團隊管理</h2>
                    <p className="text-slate-400 dark:text-zinc-500 mt-2 text-sm font-medium">查看系統權限與成員角色，點擊編輯按鈕可修改資料。</p>
                </div>
                {canManageTeam && (
                    <button onClick={handleInitAdd} className="bg-lime-400 text-black px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-lime-500 transition-all shadow-lg hover:shadow-xl">
                        <UserPlus size={18} /> 新增成員
                    </button>
                )}
            </div>

            {/* Table Header */}
            <div className="bg-white dark:bg-[#18181b] rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden shadow-card">
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800">
                    <div className="col-span-3 text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">成員</div>
                    <div className="col-span-2 text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">職稱</div>
                    <div className="col-span-2 text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">權限</div>
                    <div className="col-span-2 text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">團隊</div>
                    <div className="col-span-2 text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">狀態</div>
                    <div className="col-span-1 text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider text-right">操作</div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {members.map(member => (
                        <div key={member.id} className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors ${member.status === 'Suspended' ? 'opacity-60' : ''}`}>
                            {/* Member Info */}
                            <div className="col-span-3 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-900 text-slate-600 dark:text-zinc-400 flex items-center justify-center text-sm font-bold shadow-inner overflow-hidden relative flex-shrink-0">
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
                                    <div className={`hidden absolute inset-0 bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-slate-500`}>
                                        {member.name.charAt(0)}
                                    </div>
                                    {member.status === 'Suspended' && (
                                        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                                            <Lock size={16} className="text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-slate-800 dark:text-white text-sm truncate">{member.name}</div>
                                    <div className="text-xs text-slate-400 dark:text-zinc-500 truncate flex items-center gap-1">
                                        <Mail size={12} /> {member.email}
                                    </div>
                                </div>
                            </div>

                            {/* Role */}
                            <div className="col-span-2 flex items-center">
                                <span className="text-sm text-slate-600 dark:text-zinc-400 font-medium truncate">{member.role}</span>
                            </div>

                            {/* Access Level */}
                            <div className="col-span-2 flex items-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getAccessLevelColor(member.accessLevel)}`}>
                                    {getAccessLevelName(member.accessLevel)}
                                </span>
                            </div>

                            {/* Team */}
                            <div className="col-span-2 flex items-center">
                                {member.team ? (
                                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-lime-50 dark:bg-lime-500/20 text-lime-600 dark:text-lime-400 flex items-center gap-1">
                                        <Users size={12} /> {member.team}
                                    </span>
                                ) : (
                                    <span className="text-xs text-slate-400 dark:text-zinc-600 italic">未分配</span>
                                )}
                            </div>

                            {/* Status */}
                            <div className="col-span-2 flex items-center">
                                {member.status === 'Suspended' ? (
                                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-500 flex items-center gap-1">
                                        <UserX size={12} /> 已停用
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <UserCheck size={12} /> 啟用中
                                    </span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="col-span-1 flex items-center justify-end gap-2">
                                {canManageTeam && (
                                    <>
                                        <button
                                            onClick={() => handleInitEdit(member)}
                                            className="p-2 text-slate-400 dark:text-zinc-600 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                                            title="編輯"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => onRemoveMember(member.id)}
                                            className="p-2 text-slate-400 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                                            title="刪除"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {(showAddForm || editingMember) && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => { if (!isProcessing) { setShowAddForm(false); setEditingMember(null); } }}>
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"></div>
                    <div className="bg-white dark:bg-[#18181b] w-full max-w-md rounded-[32px] shadow-2xl relative z-10 p-8 animate-enter flex flex-col max-h-[85vh] border border-slate-200 dark:border-zinc-700" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8 flex-shrink-0">
                            <h3 className="font-bold text-slate-800 dark:text-white text-xl">{editingMember ? '編輯成員' : '新增成員'}</h3>
                            <button onClick={() => { if (!isProcessing) { setShowAddForm(false); setEditingMember(null); } }}><X size={24} className="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-white" /></button>
                        </div>
                        <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1 pr-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">全名</label>
                                <input type="text" className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-white focus:bg-white dark:focus:bg-black transition-all outline-none focus:border-lime-500" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="例如: 王小明" disabled={isProcessing} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">Email 信箱</label>
                                <input type="email" className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-white focus:bg-white dark:focus:bg-black transition-all outline-none focus:border-lime-500" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="name@company.com" disabled={isProcessing || !!editingMember} />
                                {editingMember && <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 ml-1">* Email 無法修改</p>}
                            </div>

                            {!editingMember && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">設定密碼</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-white focus:bg-white dark:focus:bg-black transition-all placeholder:text-slate-300 dark:placeholder:text-zinc-600 outline-none focus:border-lime-500"
                                        value={formData.password || ''}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="預設密碼: 123456"
                                        disabled={isProcessing}
                                    />
                                    {!formData.password && (
                                        <p className="text-[10px] text-blue-500 dark:text-blue-400 font-bold mt-1 ml-1">* 未填寫將自動設定為 123456</p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">職稱</label>
                                <input type="text" className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-white focus:bg-white dark:focus:bg-black transition-all outline-none focus:border-lime-500" value={formData.role || ''} onChange={e => setFormData({ ...formData, role: e.target.value })} placeholder="例如: 設計師" disabled={isProcessing} />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">團隊</label>
                                <select
                                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-white focus:bg-white dark:focus:bg-black transition-all outline-none focus:border-lime-500"
                                    value={formData.team || ''}
                                    onChange={e => setFormData({ ...formData, team: e.target.value || undefined })}
                                    disabled={isProcessing || (currentUser.accessLevel !== 'Admin' && !editingMember)}
                                >
                                    <option value="">未分配</option>
                                    {TEAMS.filter(t => t !== '未分配').map(team => (
                                        <option key={team} value={team}>{team}</option>
                                    ))}
                                </select>
                                {currentUser.accessLevel !== 'Admin' && !editingMember && (
                                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 ml-1">* 自動分配至您的團隊: {currentUser.team || '未分配'}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">系統權限</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Member', 'Manager', 'Admin'].map(l => (
                                        <button key={l} disabled={isProcessing || !canManageTeam} onClick={() => setFormData({ ...formData, accessLevel: l as AccessLevel })} className={`py-3 rounded-xl text-xs font-bold border-2 transition-all ${formData.accessLevel === l ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-500 dark:border-blue-500 text-blue-600 dark:text-blue-400' : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 hover:border-slate-300 dark:hover:border-zinc-600'} ${!canManageTeam ? 'opacity-50 cursor-not-allowed' : ''}`}>{getAccessLevelName(l)}</button>
                                    ))}
                                </div>
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
