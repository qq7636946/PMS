
import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Lock, Mail, Eye, EyeOff, AlertCircle, Loader2, LogIn, ServerOff, Terminal } from 'lucide-react';
import { Member } from '../types';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, firebaseInitError } from '../firebase';

interface LoginViewProps {
  members: Member[];
  onLogin: (member: Member) => void;
  onLocalLogin?: () => void; // New prop for local bypass
}

export const LoginView: React.FC<LoginViewProps> = ({ members, onLogin, onLocalLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-check init status
  useEffect(() => {
    if (firebaseInitError) {
      setError(`Firebase 初始化失敗: ${firebaseInitError.message || '未知錯誤'}`);
    }
  }, []);

  useEffect(() => { if (!firebaseInitError) setError(''); }, [email, password]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("請輸入帳號與密碼。");
      setIsLoading(false);
      return;
    }

    if (!auth) {
      if (firebaseInitError) {
        setError(`無法連線: ${firebaseInitError.message}`);
      } else {
        setError("Firebase 尚未初始化，請重新整理頁面或檢查 Console。");
      }
      setIsLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
    } catch (err: any) {
      console.error("Login Error:", err);
      let msg = "登入失敗，請稍後再試。";

      if (err.code === 'auth/invalid-email') msg = "Email 格式不正確。";
      else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = "帳號或密碼錯誤。";
      else if (err.code === 'auth/too-many-requests') msg = "嘗試次數過多，請稍後再試。";
      else if (err.code === 'auth/network-request-failed') msg = "網路連線失敗，請檢查網路狀態。";
      else if (err.message) msg = err.message;

      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0F172A]">
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-lime-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      <div className="w-full max-w-md p-8 relative z-10 animate-enter">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-lime-500 to-emerald-600 rounded-2xl shadow-lg shadow-lime-500/40 mb-6">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">專案系統管理</h1>
          <p className="text-slate-400 mt-2 text-sm font-medium">企業級專案管理系統 (2025 Edition)</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50"></div>

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2 pl-1">Email 帳號</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-600 outline-none focus:border-lime-500 focus:bg-slate-900/80 transition-all font-medium"
                    placeholder="name@company.com"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2 pl-1">密碼</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3.5 pl-11 pr-12 text-white placeholder:text-slate-600 outline-none focus:border-lime-500 focus:bg-slate-900/80 transition-all font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white z-20"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 font-bold animate-enter backdrop-blur-md">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-rose-500" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-lime-600 hover:bg-lime-500 text-white py-4 rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-lime-500/30 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <>登入系統 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
