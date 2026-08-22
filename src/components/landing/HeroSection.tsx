'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowRight, FileText, MessageSquare, Sparkles, Users } from 'lucide-react';

const BADGES = [
  { icon: MessageSquare, color: 'text-indigo-400', title: 'Live messaging', body: 'Socket.IO stream' },
  { icon: ArrowDown, color: 'text-cyan-400', title: 'Considerate scroll', body: 'Never yanks you down' },
  { icon: Users, color: 'text-purple-400', title: 'Groups', body: 'Admins & membership' },
  { icon: FileText, color: 'text-emerald-400', title: 'Documented API', body: 'Written from live probes' },
] as const;

export function HeroSection() {
  return (
    <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 px-4 overflow-hidden">
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[min(600px,120vw)] h-[350px] bg-gradient-to-r from-indigo-600/30 via-purple-600/20 to-pink-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-pill text-indigo-300 text-xs font-semibold mb-6 border border-indigo-500/30 shadow-lg">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Built with Next.js 15 and React 19</span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight bg-gradient-to-b from-white via-gray-100 to-gray-400 bg-clip-text text-transparent max-w-4xl mx-auto leading-[1.15]">
          A chat app that gets the small things right
        </h1>

        <p className="mt-6 text-base md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Messages arrive on their own. The scroll position stays where you put it. A send that
          fails says so, and lets you try again.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/login"
            className="px-6 sm:px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-xl hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open the chat app</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <a
            href="/docs/API_DOCUMENTATION.md"
            target="_blank"
            rel="noreferrer"
            className="px-6 sm:px-8 py-4 rounded-2xl glass-panel text-gray-200 hover:text-white hover:bg-white/10 font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-white/10"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Read the API docs</span>
          </a>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
          {BADGES.map(({ icon: Icon, color, title, body }) => (
            <div
              key={title}
              className="p-4 rounded-2xl glass-panel border border-white/5 text-left"
            >
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <h2 className="text-xs font-bold text-gray-200">{title}</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
