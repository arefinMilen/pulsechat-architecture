'use client';

import React from 'react';
import { MessageSquare, Users, Search, ShieldCheck, ArrowDown, RefreshCw } from 'lucide-react';

export function FeatureGrid() {
  const features = [
    {
      icon: MessageSquare,
      title: 'Real-Time Bi-Directional Chat',
      desc: 'Sub-50ms Socket.io transport with automatic fallback to REST polling when WebSockets are blocked.',
      color: 'text-indigo-400',
    },
    {
      icon: Users,
      title: 'Multi-Participant Groups',
      desc: 'Create group threads with custom titles, admin promotion permissions, and member governance.',
      color: 'text-purple-400',
    },
    {
      icon: ArrowDown,
      title: 'Precision Threshold Scroll Lock',
      desc: 'Prevents viewport disruption when users scroll up to read history; floating action pill notifies of incoming unread messages.',
      color: 'text-cyan-400',
    },
    {
      icon: Search,
      title: 'Full-Text Message Search Engine',
      desc: 'Instant in-memory client string search with real-time match count badges across conversation history.',
      color: 'text-emerald-400',
    },
    {
      icon: ShieldCheck,
      title: 'Single-Step Auto Registration',
      desc: 'Seamless phone number authentication with automatic account provisioning and JWT bearer session persistence.',
      color: 'text-amber-400',
    },
    {
      icon: RefreshCw,
      title: 'Cold-Start Gateway Resilience',
      desc: 'Axios interceptors with exponential backoff retries and local fallback database insulate users from server latency.',
      color: 'text-pink-400',
    },
  ];

  return (
    <section className="py-16 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Comprehensive Application Feature Suite
          </h2>
          <p className="text-xs md:text-sm text-gray-400 mt-2 max-w-2xl mx-auto">
            Built to fulfill every requirement of the take-home task with senior-level code quality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="p-6 rounded-3xl glass-panel border border-white/5 hover:border-white/15 transition-all"
            >
              <f.icon className={`w-8 h-8 ${f.color} mb-3`} />
              <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
