'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, Phone, ShieldCheck, Sparkles, User } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

/** Permissive on formatting, strict enough to catch a typo before a round-trip. */
const PHONE_PATTERN = /^\+?[\d\s()-]{6,20}$/;

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);

  const { login, isLoading, error, isAuthenticated, isInitializing, initializeAuth, clearError } =
    useAuthStore();
  const router = useRouter();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isAuthenticated) router.replace('/chat');
  }, [isAuthenticated, router]);

  const phoneError =
    touched && phone.trim() && !PHONE_PATTERN.test(phone.trim())
      ? 'Enter a valid phone number (digits, spaces, and an optional leading +).'
      : null;

  const canSubmit =
    phone.trim().length > 0 && name.trim().length > 0 && !phoneError && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;

    const success = await login(phone.trim(), name.trim());
    if (success) router.replace('/chat');
  };

  if (isInitializing || isAuthenticated) {
    return (
      <div className="min-h-dvh bg-[#090d16] flex items-center justify-center text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#090d16] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/10 relative z-10 text-white">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-indigo-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to overview
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill text-indigo-300 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>One step — no separate sign-up</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
            Welcome to PulseChat
          </h1>
          <p className="text-xs text-gray-400 mt-2">
            Enter your phone number and name. If the number is new, an account is created for
            you automatically.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="phone" className="block text-xs font-medium text-gray-300 mb-1.5">
              Phone number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (error) clearError();
                }}
                onBlur={() => setTouched(true)}
                aria-invalid={!!phoneError}
                aria-describedby={phoneError ? 'phone-error' : undefined}
                placeholder="+1 555 123 4567"
                className={`w-full pl-10 pr-4 py-3 bg-black/40 border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 shadow-inner ${
                  phoneError
                    ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                    : 'border-white/10 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
                required
              />
            </div>
            {phoneError && (
              <p id="phone-error" className="mt-1.5 text-[11px] text-red-300">
                {phoneError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="name" className="block text-xs font-medium text-gray-300 mb-1.5">
              Display name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) clearError();
                }}
                placeholder="e.g. Ada Lovelace"
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing you in…</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {isLoading && (
            <p className="text-center text-[11px] text-gray-500">
              The demo API sleeps when idle — the first request can take up to a minute.
            </p>
          )}
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="inline-flex items-center gap-1.5 text-[11px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Session secured with a JWT bearer token</span>
          </p>
        </div>
      </div>
    </div>
  );
}
