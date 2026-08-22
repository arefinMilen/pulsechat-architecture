'use client';

import React from 'react';
import { Layers, Cpu, Database, RefreshCw } from 'lucide-react';

export function ArchitectureSection() {
  return (
    <section className="py-16 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Architectural Excellence & System Design
          </h2>
          <p className="text-xs md:text-sm text-gray-400 mt-2 max-w-2xl mx-auto">
            Engineered with strict separation of concern following Feature-Sliced Design principles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl glass-panel border border-white/10 relative group hover:border-indigo-500/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/30">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Next.js 15 App Router</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Native React Server Components (RSC) deliver zero-bundle static layouts while delegating interactive real-time message streams to client islands.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel border border-white/10 relative group hover:border-purple-500/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 flex items-center justify-center text-purple-400 mb-4 border border-purple-500/30">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Zustand & TanStack Query</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Strict isolation between server-cached message histories and client UI states (active search queries, threshold scroll locks) prevents re-render cascades.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel border border-white/10 relative group hover:border-cyan-500/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 flex items-center justify-center text-cyan-400 mb-4 border border-cyan-500/30">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Resilient Offline Queue</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              When network connectivity drops, outbound messages are preserved in IndexedDB with pending flags and automatically flushed upon reconnection.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
