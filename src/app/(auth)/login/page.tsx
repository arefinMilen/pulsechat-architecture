'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, User, ArrowRight, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
  const [phone, setPhone] = useState('+15551234567');
  const [name, setName] = useState('Alex Mercer');
  const { login, isLoading, error, isAuthenticated, initializeAuth } = useAuthStore();
  const router = useRouter();

  React.useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/chat');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !name.trim()) return;

    const success = await login(phone.trim(), name.trim());
    if (success) {
      router.push('/chat');
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-2xl border border-white/10 relative z-10 text-white animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill text-indigo-300 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Single-Step Auth & Auto-Registration</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
            Welcome to PulseChat
          </h1>
          <p className="text-xs text-gray-400 mt-2">
            Enter your phone number and full name to access or automatically generate your account.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-indigo-400" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-indigo-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Mercer"
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !phone.trim() || !name.trim()}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-medium text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Enter PulseChat</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>End-to-End JWT Session Authorization</span>
          </div>
        </div>
      </div>
    </div>
  );
}
