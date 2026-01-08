
import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, Bell, Shield, Save, Camera, Trash2, AlertCircle, Loader2, Database, RotateCcw, ListChecks, Plus, X, GripVertical, RefreshCcw } from 'lucide-react';
import { Member } from '../types';

interface SettingsViewProps {
    currentUser: Member;
    onUpdateProfile: (member: Member) => void;
    onResetData?: () => void;
    defaultStages?: string[];
    onUpdateDefaultStages?: (stages: string[]) => void;
    onFixProgress?: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUser, onUpdateProfile, onResetData, defaultStages = [], onUpdateDefaultStages, onFixProgress }) => {
    const [name, setName] = useState(currentUser.name);
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [imgError, setImgError] = useState(false); // Track image load error
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Stages Edit State
    const [localStages, setLocalStages] = useState<string[]>([]);
    const [newStageInput, setNewStageInput] = useState('');

    // Progress Fix State
    const [isFixingProgress, setIsFixingProgress] = useState(false);

    useEffect(() => {
        setName(currentUser.name);
        setImgError(false); // Reset error state when user changes
    }, [currentUser]);

    useEffect(() => {
        if (defaultStages) setLocalStages(defaultStages);
    }, [defaultStages]);

    const handleSaveProfile = () => {
        onUpdateProfile({ ...currentUser, name });
        showSuccessMessage();
    };

    const handleUpdatePassword = () => {
        if (!password) {
            alert('請輸入目前密碼以進行驗證');
            return;
        }
        if (newPassword) {
            if (newPassword.length < 6) {
                alert('新密碼長度需至少 6 碼');
                return;
            }
            onUpdateProfile({ ...currentUser, password: newPassword });
            setPassword('');
            setNewPassword('');
            showSuccessMessage();
        }
    };

    const handleSaveStages = () => {
        if (onUpdateDefaultStages) {
            const filtered = localStages.filter(s => s.trim() !== '');
            if (filtered.length === 0) {
                alert("至少需要保留一個階段");
                return;
            }
            onUpdateDefaultStages(filtered);
            showSuccessMessage();
        }
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Strict Size Limit: 300KB
            // LocalStorage is limited (approx 5MB). High res images will break the app.
            if (file.size > 300 * 1024) {
                alert("⚠️ 圖片過大！\n\n為了確保系統效能，請上傳小於 300KB 的圖片。\n建議您先壓縮圖片後再試一次。");
                if (fileInputRef.current) fileInputRef.current.value = ''; // Reset
                return;
            }

            setIsUploading(true);
            const reader = new FileReader();

            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    // Try to save
                    try {
                        onUpdateProfile({ ...currentUser, avatar: reader.result });
                        setImgError(false);
                        showSuccessMessage();
                    } catch (err) {
                        console.error("Storage Error:", err);
                        alert("儲存失敗：瀏覽器儲存空間 (Local Storage) 已滿。\n請嘗試刪除舊專案、清除校稿圖片，或使用更小的頭像檔案。");
                    } finally {
                        setIsUploading(false);
                    }
                }
            };

            reader.onerror = () => {
                alert("讀取圖片失敗，請重試");
                setIsUploading(false);
            };

            reader.readAsDataURL(file);
        }
        // Important: Reset input value to allow re-uploading the same file if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveAvatar = () => {
        if (window.confirm('確定要移除個人頭像嗎？')) {
            onUpdateProfile({ ...currentUser, avatar: '' });
            showSuccessMessage();
            setImgError(false);
        }
    };

    const showSuccessMessage = () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const getAccessLevelLabel = (level: string) => {
        switch (level) {
            case 'Admin': return '系統管理員';
            case 'Manager': return '專案經理';
            default: return '一般成員';
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 animate-enter pb-10 max-w-5xl mx-auto relative">
            {showSuccess && (
                <div className="fixed top-8 right-8 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg animate-enter z-50 font-bold flex items-center gap-2">
                    <Shield size={18} /> 設定已更新
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white">帳號設定</h2>
                    <p className="text-slate-400 dark:text-zinc-500 mt-1 md:mt-2 text-sm font-medium">管理您的個人資料與偏好</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bento-card p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden bg-white dark:bg-[#18181b] border border-slate-100 dark:border-zinc-800">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-lime-400 to-lime-600"></div>

                        {/* Avatar Section */}
                        <div className="relative group z-10 mb-4">
                            <div className="w-24 h-24 md:w-28 md:h-28 bg-white dark:bg-zinc-800 p-1.5 rounded-full shadow-2xl overflow-hidden relative">
                                {isUploading ? (
                                    <div className="w-full h-full rounded-full bg-slate-50 dark:bg-zinc-900 flex items-center justify-center">
                                        <Loader2 className="animate-spin text-lime-500" size={32} />
                                    </div>
                                ) : !imgError && currentUser.avatar ? (
                                    <img
                                        key={currentUser.avatar} // Force re-render on change
                                        src={currentUser.avatar}
                                        alt={name}
                                        className="w-full h-full object-cover rounded-full bg-slate-100 dark:bg-zinc-900"
                                        onError={() => setImgError(true)}
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-slate-100 dark:bg-zinc-700 flex items-center justify-center text-3xl md:text-4xl font-bold text-slate-700 dark:text-zinc-300 select-none">
                                        {name.charAt(0)}
                                    </div>
                                )}
                            </div>

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 m-1 rounded-full bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                                <label className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white text-white hover:text-black rounded-full cursor-pointer transition-all shadow-lg" title="上傳照片">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                    />
                                    <Camera size={14} />
                                </label>
                                {currentUser.avatar && (
                                    <button
                                        onClick={handleRemoveAvatar}
                                        className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-rose-500 text-white rounded-full cursor-pointer transition-all shadow-lg"
                                        title="移除照片"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">{name}</h3>
                        <p className="text-slate-400 dark:text-zinc-500 text-sm font-medium mb-6">{currentUser.email}</p>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 ${currentUser.accessLevel === 'Admin' ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-500 border-rose-100 dark:border-rose-900' :
                            currentUser.accessLevel === 'Manager' ? 'bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-500 border-orange-100 dark:border-orange-900' :
                                'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900'
                            }`}>
                            <Shield size={14} /> {getAccessLevelLabel(currentUser.accessLevel)}
                        </span>
                    </div>

                    <div className="bg-lime-50 dark:bg-lime-400/10 p-4 rounded-2xl border border-lime-200 dark:border-lime-900 flex gap-3 items-start">
                        <AlertCircle size={20} className="text-lime-600 dark:text-lime-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-lime-800 dark:text-lime-200 leading-relaxed">
                            <span className="font-bold block mb-1">頭像上傳須知</span>
                            為確保最佳顯示效果與系統效能，請上傳 <span className="font-bold">300KB 以下</span> 的 JPG/PNG 圖片。
                        </div>
                    </div>
                </div>

                {/* Forms */}
                <div className="md:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="bento-card p-6 md:p-8 bg-white dark:bg-[#18181b] border border-slate-100 dark:border-zinc-800">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 md:mb-8 flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg"><User size={20} /></div>
                            基本資料
                        </h3>
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">顯示名稱</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-white focus:bg-white dark:focus:bg-black transition-all outline-none focus:border-lime-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">Email 信箱</label>
                                <input
                                    type="email"
                                    value={currentUser.email}
                                    className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-5 py-3 text-sm font-bold text-slate-500 dark:text-zinc-500 cursor-not-allowed select-none"
                                    disabled
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-8">
                            <button onClick={handleSaveProfile} className="px-6 py-3 bg-lime-400 text-black rounded-xl text-sm font-bold hover:bg-lime-500 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl w-full md:w-auto justify-center">
                                <Save size={16} /> 儲存變更
                            </button>
                        </div>
                    </div>

                    {/* Workflow Settings - Only for Admin/Manager */}
                    {['Admin', 'Manager'].includes(currentUser.accessLevel) && onUpdateDefaultStages && (
                        <div className="bento-card p-6 md:p-8 bg-white dark:bg-[#18181b] border border-slate-100 dark:border-zinc-800">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3">
                                <div className="p-2 bg-lime-100 dark:bg-lime-400/20 text-lime-700 dark:text-lime-400 rounded-lg"><ListChecks size={20} /></div>
                                預設工作流程
                            </h3>
                            <p className="text-xs text-slate-400 dark:text-zinc-500 mb-6 font-medium">
                                設定建立新專案時的預設階段流程。修改此處不會影響已經存在的專案。
                            </p>

                            <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                {localStages.map((stage, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 group hover:border-lime-200 dark:hover:border-lime-800 transition-colors">
                                        <span className="text-slate-300 dark:text-zinc-600"><GripVertical size={16} /></span>
                                        <input
                                            value={stage}
                                            onChange={(e) => {
                                                const newArr = [...localStages];
                                                newArr[idx] = e.target.value;
                                                setLocalStages(newArr);
                                            }}
                                            className="flex-1 bg-transparent font-bold text-slate-700 dark:text-white outline-none text-sm"
                                        />
                                        <button
                                            onClick={() => setLocalStages(localStages.filter((_, i) => i !== idx))}
                                            className="text-slate-300 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 mb-8">
                                <input
                                    className="flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-lime-500 transition-all"
                                    placeholder="輸入新階段名稱..."
                                    value={newStageInput}
                                    onChange={(e) => setNewStageInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newStageInput.trim()) {
                                            setLocalStages([...localStages, newStageInput.trim()]);
                                            setNewStageInput('');
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        if (newStageInput.trim()) {
                                            setLocalStages([...localStages, newStageInput.trim()]);
                                            setNewStageInput('');
                                        }
                                    }}
                                    className="bg-lime-100 dark:bg-lime-400/20 text-lime-700 dark:text-lime-400 p-3 rounded-xl hover:bg-lime-200 dark:hover:bg-lime-400/30 transition-colors"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>

                            <div className="flex justify-end">
                                <button onClick={handleSaveStages} className="px-6 py-3 bg-white dark:bg-zinc-800 border-2 border-slate-100 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 rounded-xl text-sm font-bold hover:border-slate-300 dark:hover:border-zinc-500 hover:text-slate-800 dark:hover:text-white transition-all w-full md:w-auto">
                                    更新預設流程
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Security */}
                    <div className="bento-card p-6 md:p-8 bg-white dark:bg-[#18181b] border border-slate-100 dark:border-zinc-800">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 md:mb-8 flex items-center gap-3">
                            <div className="p-2 bg-rose-50 dark:bg-rose-500/20 text-rose-500 rounded-lg"><Lock size={20} /></div>
                            安全性設定
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">目前密碼</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-white focus:bg-white dark:focus:bg-black transition-all outline-none focus:border-rose-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase mb-2 pl-1">新密碼</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-white focus:bg-white dark:focus:bg-black transition-all outline-none focus:border-rose-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-8">
                            <button onClick={handleUpdatePassword} className="px-6 py-3 bg-white dark:bg-zinc-800 border-2 border-slate-100 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 rounded-xl text-sm font-bold hover:border-slate-300 dark:hover:border-zinc-500 hover:text-slate-800 dark:hover:text-white transition-all w-full md:w-auto">
                                更新密碼
                            </button>
                        </div>
                    </div>

                    {/* Data Reset */}
                    {onResetData && (
                        <div className="bento-card p-6 md:p-8 bg-white dark:bg-[#18181b] border border-slate-100 dark:border-zinc-800">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-lg"><Database size={20} /></div>
                                系統資料維護
                            </h3>
                            <div className="space-y-4">
                                {/* Progress Fix */}
                                {onFixProgress && (
                                    <div className="flex items-center justify-between p-4 bg-lime-50 dark:bg-lime-900/20 rounded-2xl border border-lime-200 dark:border-lime-800">
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-lime-800 dark:text-lime-300 mb-1">
                                                修正專案進度計算
                                            </p>
                                            <p className="text-xs text-lime-600 dark:text-lime-400 font-medium">
                                                重新計算所有專案的進度百分比，基於已完成階段數量。
                                            </p>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('確定要重新計算所有專案的進度嗎？\n\n這將會根據已完成的階段數量重新計算進度百分比。')) {
                                                    setIsFixingProgress(true);
                                                    try {
                                                        await onFixProgress();
                                                        alert('✅ 進度修正完成！');
                                                    } catch (error) {
                                                        console.error(error);
                                                        alert('❌ 修正失敗，請查看控制台');
                                                    } finally {
                                                        setIsFixingProgress(false);
                                                    }
                                                }
                                            }}
                                            disabled={isFixingProgress}
                                            className="px-4 py-2 bg-lime-500 text-white rounded-lg text-xs font-bold hover:bg-lime-600 disabled:bg-lime-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 whitespace-nowrap"
                                        >
                                            {isFixingProgress ? (
                                                <><Loader2 size={14} className="animate-spin" /> 修正中...</>
                                            ) : (
                                                <><RefreshCcw size={14} /> 修正進度</>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* Data Reset */}
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
                                    <p className="text-xs text-slate-500 dark:text-zinc-500 font-medium">
                                        若系統出現異常或資料損毀，可嘗試重置所有資料為預設值。
                                    </p>
                                    <button onClick={onResetData} className="px-4 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-700 hover:text-slate-800 dark:hover:text-white transition-all flex items-center gap-2 whitespace-nowrap">
                                        <RotateCcw size={14} /> 重置資料
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
