'use client';

import React from 'react';
import Link from 'next/link';
import { MessageSquare, Github, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#070b12] py-12 px-4 text-white">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-white">PulseChat</span>
            <p className="text-[11px] text-gray-400">Senior Frontend Take-Home Assignment Deliverable</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-gray-400">
          <Link href="/login" className="hover:text-indigo-400 transition-colors">
            Chat Application
          </Link>
          <a
            href="/docs/API_DOCUMENTATION.md"
            target="_blank"
            rel="noreferrer"
            className="hover:text-indigo-400 transition-colors flex items-center gap-1"
          >
            <span>API Docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="/docs/openapi.yaml"
            target="_blank"
            rel="noreferrer"
            className="hover:text-indigo-400 transition-colors flex items-center gap-1"
          >
            <span>OpenAPI Spec</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="text-xs text-gray-500">
          Built with Next.js 15, React 19 & Tailwind CSS v4
        </div>
      </div>
    </footer>
  );
}
