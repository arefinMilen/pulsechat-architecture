'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, MessageSquare, FileText, Zap, Shield, ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 px-4 overflow-hidden">
      {/* Background Decorative Lighting */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-r from-indigo-600/30 via-purple-600/20 to-pink-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-pill text-indigo-300 text-xs font-semibold mb-6 border border-indigo-500/30 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Next.js 15 App Router & React 19 Real-Time Architecture</span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight bg-gradient-to-b from-white via-gray-100 to-gray-400 bg-clip-text text-transparent max-w-4xl mx-auto leading-[1.15]">
          Enterprise Real-Time Messaging Engineered for Speed
        </h1>

        <p className="mt-6 text-base md:text-xl text-gray-400 max-w-2xl mx-auto font-normal leading-relaxed">
          Sub-50ms WebSocket streaming, optimistic state reconciliation, precision threshold scroll locking, and resilient offline synchronization.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-xl hover:shadow-indigo-500/25 transition-all flex items-center gap-2 group cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Launch Live Chat Application</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <a
            href="/docs/API_DOCUMENTATION.md"
            target="_blank"
            rel="noreferrer"
            className="px-8 py-4 rounded-2xl glass-panel text-gray-200 hover:text-white hover:bg-white/10 font-semibold text-sm transition-all flex items-center gap-2 border border-white/10"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Explore API Documentation</span>
          </a>
        </div>

        {/* Feature Highlights Badges */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-2xl glass-panel border border-white/5 text-left">
            <Zap className="w-5 h-5 text-indigo-400 mb-2" />
            <h4 className="text-xs font-bold text-gray-200">Sub-50ms Latency</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">WebSocket + Socket.io transport</p>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-white/5 text-left">
            <Shield className="w-5 h-5 text-purple-400 mb-2" />
            <h4 className="text-xs font-bold text-gray-200">Group Governance</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">Admin roles, rename, & member controls</p>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-white/5 text-left">
            <Sparkles className="w-5 h-5 text-cyan-400 mb-2" />
            <h4 className="text-xs font-bold text-gray-200">Precision Scroll Lock</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">Threshold scroll & floating pill</p>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-white/5 text-left">
            <FileText className="w-5 h-5 text-emerald-400 mb-2" />
            <h4 className="text-xs font-bold text-gray-200">Offline Queue</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">IndexedDB mutation queue</p>
          </div>
        </div>
      </div>
    </section>
  );
}
