
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Project, Transaction, Member } from '../types';
import { DollarSign, TrendingUp, TrendingDown, PieChart as PieIcon, ArrowLeft, Plus, Receipt, Trash2, Calendar, Folder, Check, X, Pencil } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface BudgetViewProps {
    projects: Project[];
    onUpdateProject: (p: Project) => void;
    currentUser: Member;
}

export const BudgetView: React.FC<BudgetViewProps> = ({ projects, onUpdateProject, currentUser }) => {
    // FIXED: Store ID only, not the whole object, to ensure real-time sync
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

    const [showAddTransaction, setShowAddTransaction] = useState(false);
    const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({ type: 'expense', category: 'Other', date: new Date().toISOString().split('T')[0] });

    // Edit Budget State
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [tempBudget, setTempBudget] = useState('');

    // Permission Check
    const canEditBudget = ['Admin', 'Manager', 'SeniorMember'].includes(currentUser.accessLevel);

    // Derived Project Data (Always Fresh)
    const selectedProject = useMemo(() =>
        projects.find(p => p.id === selectedProjectId) || null
        , [projects, selectedProjectId]);

    // Dashboard Stats
    const totalRevenue = projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);
    const totalExpenses = projects.reduce((acc, p) => {
        const expenses = p.transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0;
        return acc + expenses;
    }, 0);
    const totalProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

    // Detail View Logic
    const handleSaveTransaction = () => {
        if (!selectedProject || !newTransaction.title || !newTransaction.amount) return;

        const tx: Transaction = {
            id: Date.now().toString(),
            title: newTransaction.title!,
            amount: Number(newTransaction.amount),
            date: newTransaction.date || new Date().toISOString().split('T')[0],
            category: newTransaction.category || 'Other',
            type: newTransaction.type || 'expense'
        };

        const updatedProject = {
            ...selectedProject,
            transactions: [tx, ...(selectedProject.transactions || [])]
        };

        onUpdateProject(updatedProject);
        // No need to set selectedProject manually, it updates automatically via props
        setShowAddTransaction(false);
        setNewTransaction({ type: 'expense', category: 'Other', date: new Date().toISOString().split('T')[0], title: '', amount: 0 });
    };

    const handleDeleteTransaction = (id: string) => {
        if (!selectedProject || !window.confirm('確定要刪除此筆收支紀錄嗎？')) return;

        const updatedProject = {
            ...selectedProject,
            transactions: selectedProject.transactions.filter(t => t.id !== id)
        };

        onUpdateProject(updatedProject);
    };

    const handleSaveBudget = () => {
        if (!selectedProject) return;
        const updatedProject = { ...selectedProject, budget: tempBudget };
        onUpdateProject(updatedProject);
        setIsEditingBudget(false);
    };

    // Render Project Detail
    if (selectedProject) {
        const projectTotalBudget = Number(selectedProject.budget) || 0;
        const projectSpent = selectedProject.transactions?.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0) || 0;
        const projectRemaining = projectTotalBudget - projectSpent;

        const expensesByCategory = (selectedProject.transactions || []).filter(t => t.type === 'expense').reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
            return acc;
        }, {} as Record<string, number>);

        const chartData = Object.keys(expensesByCategory).length > 0
            ? Object.entries(expensesByCategory).map(([name, value]) => ({
                name,
                value,
                color: name === 'Dev' ? '#3B82F6' : name === 'Design' ? '#8B5CF6' : name === 'Server' ? '#10B981' : '#F59E0B'
            }))
            : [{ name: '尚無支出', value: 1, color: '#3f3f46' }]; // Darker gray for empty state in dark mode

        return (
            <div className="space-y-6 animate-enter pb-10">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setSelectedProjectId(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-slate-500 dark:text-zinc-400" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{selectedProject.name}</h2>
                        <p className="text-slate-400 dark:text-zinc-500 text-sm">財務收支明細</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-[#18181b] p-6 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm relative group">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-slate-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-wider">專案預算</p>
                            {!isEditingBudget && canEditBudget && (
                                <button onClick={() => { setTempBudget(selectedProject.budget); setIsEditingBudget(true); }} className="text-slate-300 dark:text-zinc-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors p-1 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-full">
                                    <Pencil size={14} />
                                </button>
                            )}
                        </div>

                        {isEditingBudget ? (
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black text-slate-400 dark:text-zinc-600">$</span>
                                <input
                                    type="number"
                                    value={tempBudget}
                                    onChange={(e) => setTempBudget(e.target.value)}
                                    className="w-full text-2xl font-black text-slate-900 dark:text-white border-b-2 border-blue-500 outline-none p-0 bg-transparent"
                                    autoFocus
                                />
                                <button onClick={handleSaveBudget} className="p-1 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200"><Check size={16} /></button>
                                <button onClick={() => setIsEditingBudget(false)} className="p-1 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-full hover:bg-slate-200"><X size={16} /></button>
                            </div>
                        ) : (
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white">${projectTotalBudget.toLocaleString()}</h2>
                        )}
                    </div>
                    <div className="bg-white dark:bg-[#18181b] p-6 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm">
                        <p className="text-slate-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">已支出</p>
                        <h2 className="text-3xl font-black text-rose-500">${projectSpent.toLocaleString()}</h2>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                        <p className="text-emerald-600/60 dark:text-emerald-400/60 text-xs font-bold uppercase tracking-wider mb-2">剩餘預算</p>
                        <h2 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">${projectRemaining.toLocaleString()}</h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Transaction List */}
                    <div className="lg:col-span-2 bg-white dark:bg-[#18181b] rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                        <div className="p-6 border-b border-slate-50 dark:border-zinc-800 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Receipt size={20} /> 收支紀錄</h3>
                            {canEditBudget && (
                                <button onClick={() => setShowAddTransaction(true)} className="bg-lime-400 text-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-lime-500 transition-colors">
                                    <Plus size={16} /> 新增
                                </button>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            {(selectedProject.transactions || []).length > 0 ? selectedProject.transactions.map(tx => (
                                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded-2xl transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${tx.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-500'}`}>
                                            {tx.type === 'income' ? <TrendingUp size={20} /> : <Receipt size={20} />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 dark:text-white">{tx.title}</h4>
                                            <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono mt-0.5">{tx.date} • {tx.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`font-bold text-lg ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                                            {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                                        </span>
                                        {canEditBudget && (
                                            <button onClick={() => handleDeleteTransaction(tx.id)} className="text-slate-300 dark:text-zinc-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-zinc-600">
                                    <Receipt size={48} className="mb-2 opacity-20" />
                                    <p>尚無收支紀錄</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm p-6 flex flex-col">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6"><PieIcon size={20} /> 支出分佈</h3>
                        <div className="flex-1 relative min-h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', color: '#fff' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="font-bold text-slate-300 dark:text-zinc-600 text-sm">Expenses</span>
                            </div>
                        </div>
                        <div className="space-y-3 mt-6">
                            {chartData.map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-sm font-bold text-slate-600 dark:text-zinc-400">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-800 dark:text-white">${item.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Add Transaction Modal - Portaled */}
                {showAddTransaction && createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setShowAddTransaction(false)}></div>
                        <div className="bg-white dark:bg-[#18181b] w-full max-w-sm rounded-[32px] shadow-2xl relative z-10 p-8 animate-enter flex flex-col max-h-[85vh] border border-slate-200 dark:border-zinc-700">
                            <h3 className="font-bold text-slate-800 dark:text-white text-xl mb-6 flex-shrink-0">新增收支</h3>
                            <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase ml-1">類型</label>
                                    <div className="flex bg-slate-100 dark:bg-zinc-900 rounded-xl p-1 mt-1">
                                        <button onClick={() => setNewTransaction({ ...newTransaction, type: 'expense' })} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${newTransaction.type === 'expense' ? 'bg-white dark:bg-[#18181b] text-rose-500 shadow-sm' : 'text-slate-400 dark:text-zinc-500'}`}>支出</button>
                                        <button onClick={() => setNewTransaction({ ...newTransaction, type: 'income' })} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${newTransaction.type === 'income' ? 'bg-white dark:bg-[#18181b] text-emerald-500 shadow-sm' : 'text-slate-400 dark:text-zinc-500'}`}>收入</button>
                                    </div>
                                </div>
                                <input className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-white outline-none focus:border-lime-500 transition-all" placeholder="項目名稱" value={newTransaction.title} onChange={e => setNewTransaction({ ...newTransaction, title: e.target.value })} />
                                <div className="relative">
                                    <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="number" className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-3 font-bold text-slate-800 dark:text-white outline-none focus:border-lime-500 transition-all" placeholder="金額" value={newTransaction.amount || ''} onChange={e => setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })} />
                                </div>
                                <input type="date" className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-white outline-none focus:border-lime-500 transition-all" value={newTransaction.date} onChange={e => setNewTransaction({ ...newTransaction, date: e.target.value })} />
                                <select className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-white outline-none focus:border-lime-500 transition-all" value={newTransaction.category} onChange={e => setNewTransaction({ ...newTransaction, category: e.target.value })}>
                                    <option value="Design">設計</option>
                                    <option value="Dev">開發</option>
                                    <option value="Server">伺服器/網域</option>
                                    <option value="Marketing">行銷</option>
                                    <option value="Other">其他</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-8 flex-shrink-0">
                                <button onClick={() => setShowAddTransaction(false)} className="px-4 py-2 text-slate-400 dark:text-zinc-500 font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl">取消</button>
                                <button onClick={handleSaveTransaction} className="px-6 py-2 bg-lime-400 text-black font-bold rounded-xl shadow-lg hover:bg-lime-500">儲存</button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        );
    }

    // Dashboard List View
    return (
        <div className="space-y-8 animate-enter pb-10">
            <div>
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">財務預算總覽</h2>
                <p className="text-slate-400 dark:text-zinc-500 mt-2 text-sm font-medium">監控所有專案的預算執行狀況與獲利分析。</p>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-[#18181b] p-6 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl"><DollarSign size={20} /></div>
                        <span className="text-xs font-bold text-slate-300 dark:text-zinc-600 uppercase">總營收</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white">${totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="bg-white dark:bg-[#18181b] p-6 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500 rounded-xl"><TrendingDown size={20} /></div>
                        <span className="text-xs font-bold text-slate-300 dark:text-zinc-600 uppercase">總支出</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white">${totalExpenses.toLocaleString()}</h3>
                </div>
                <div className="bg-slate-900 dark:bg-black p-6 rounded-3xl border border-slate-800 dark:border-zinc-800 shadow-lg shadow-slate-900/20">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-white/10 text-emerald-400 rounded-xl"><TrendingUp size={20} /></div>
                        <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase">淨利潤</span>
                    </div>
                    <h3 className="text-3xl font-black text-white">${totalProfit.toLocaleString()}</h3>
                </div>
                <div className="bg-white dark:bg-[#18181b] p-6 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                    <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase">平均利潤率</span>
                    <div className="text-right">
                        <h3 className={`text-3xl font-black ${Number(profitMargin) > 20 ? 'text-emerald-500' : 'text-orange-500'}`}>{profitMargin}%</h3>
                    </div>
                </div>
            </div>

            {/* Project List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {projects.map(project => {
                    const pBudget = Number(project.budget) || 0;
                    const pExpenses = (project.transactions || []).filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                    const pRemaining = pBudget - pExpenses;

                    return (
                        <div key={project.id} onClick={() => setSelectedProjectId(project.id)} className="bg-white dark:bg-[#18181b] p-6 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-lg dark:hover:shadow-lime-400/5 transition-all cursor-pointer group relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 flex items-center justify-center overflow-hidden">
                                    {project.clientAvatar ? (
                                        <img src={project.clientAvatar} alt={project.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Folder size={20} className="text-slate-300 dark:text-zinc-600" />
                                    )}
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${pRemaining < 0 ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-500' : 'bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'}`}>
                                    {pRemaining < 0 ? '超支' : '正常'}
                                </span>
                            </div>

                            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1 relative z-10">{project.name}</h3>
                            <p className="text-xs text-slate-400 dark:text-zinc-500 font-bold mb-6 relative z-10">預算: ${pBudget.toLocaleString()}</p>

                            {/* Hover Effect bg */}
                            <div className="absolute inset-0 bg-slate-50 dark:bg-zinc-800 opacity-0 group-hover:opacity-50 transition-opacity z-0"></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
