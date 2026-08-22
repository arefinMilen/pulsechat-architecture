'use client';

import React from 'react';
import { ArrowDown, MessageSquare, RotateCcw, Search, ShieldCheck, Users } from 'lucide-react';

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Messages that arrive on their own',
    desc: 'Incoming messages stream in over Socket.IO — no refresh, no polling loop. Your own sends render instantly and settle once the server confirms them.',
    color: 'text-indigo-400',
  },
  {
    icon: ArrowDown,
    title: 'Scroll that respects you',
    desc: 'The transcript follows new messages only while you are already at the bottom. Scroll up to read back and it stays put, offering a pill that counts what you have missed.',
    color: 'text-cyan-400',
  },
  {
    icon: Users,
    title: 'Direct chats and groups',
    desc: 'Search the directory by name or number to start a one-to-one thread, or build a group with a name, admin roles, and member management.',
    color: 'text-purple-400',
  },
  {
    icon: Search,
    title: 'Search inside a conversation',
    desc: 'Filter a thread down to the messages that match, with a live count of hits, without leaving the conversation.',
    color: 'text-emerald-400',
  },
  {
    icon: ShieldCheck,
    title: 'One-step sign in',
    desc: 'A phone number and a display name. A number the service has not seen before becomes an account automatically — there is no separate sign-up to complete.',
    color: 'text-amber-400',
  },
  {
    icon: RotateCcw,
    title: 'Honest failure states',
    desc: 'A message that does not reach the server is marked undelivered and can be retried in place. Nothing is faked to look like it worked.',
    color: 'text-pink-400',
  },
] as const;

export function FeatureGrid() {
  return (
    <section className="py-16 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white">What&apos;s in it</h2>
          <p className="text-sm text-gray-400 mt-3 max-w-2xl mx-auto leading-relaxed">
            The chat panel got the most attention — the message list, sending, and what happens
            when the network doesn&apos;t cooperate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="p-6 rounded-3xl glass-panel border border-white/5 hover:border-white/15 transition-all"
            >
              <Icon className={`w-8 h-8 ${color} mb-3`} />
              <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
