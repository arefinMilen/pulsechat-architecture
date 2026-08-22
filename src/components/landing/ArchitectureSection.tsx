'use client';

import React from 'react';
import { Cpu, Layers, Radio } from 'lucide-react';

const PILLARS = [
  {
    icon: Cpu,
    accent: 'indigo',
    title: 'Next.js 15 & React 19',
    body: 'The landing page renders as a server component; the chat screen is a client island. App Router route groups keep the authenticated and public surfaces cleanly separated.',
  },
  {
    icon: Layers,
    accent: 'purple',
    title: 'One normalization boundary',
    body: 'The upstream API returns `_id` keys, four different list envelopes, and a different message shape over WebSocket than over REST. A single module reconciles all of it, so no component ever touches a raw response.',
  },
  {
    icon: Radio,
    accent: 'cyan',
    title: 'Optimistic sends, live receives',
    body: 'Outbound messages render immediately against a client-side correlation id and reconcile with the server record. Inbound messages arrive over Socket.IO, with a retry affordance when a send fails.',
  },
] as const;

const ACCENTS = {
  indigo: 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30 hover:border-indigo-500/50',
  purple: 'bg-purple-600/20 text-purple-400 border-purple-500/30 hover:border-purple-500/50',
  cyan: 'bg-cyan-600/20 text-cyan-400 border-cyan-500/30 hover:border-cyan-500/50',
} as const;

export function ArchitectureSection() {
  return (
    <section className="py-16 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white">How it&apos;s built</h2>
          <p className="text-sm text-gray-400 mt-3 max-w-2xl mx-auto leading-relaxed">
            Three decisions that shaped the implementation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PILLARS.map(({ icon: Icon, accent, title, body }) => {
            const [iconStyle, borderStyle] = [
              ACCENTS[accent].split(' ').slice(0, 3).join(' '),
              ACCENTS[accent].split(' ').slice(3).join(' '),
            ];

            return (
              <div
                key={title}
                className={`p-6 rounded-3xl glass-panel border border-white/10 transition-all ${borderStyle}`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border ${iconStyle}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
