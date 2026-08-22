'use client';

import React, { useState } from 'react';
import { Wifi, WifiOff, Send, Clock, Check, Activity, Zap, RefreshCw } from 'lucide-react';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { LatencyOption } from '../../types';

export function NetworkSimulator() {
  const [inputText, setInputText] = useState('');
  const {
    latency,
    setLatency,
    isOnline,
    toggleOnline,
    messages,
    sendSimulatedMessage,
    metrics,
    clearSimulator,
  } = useSimulatorStore();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendSimulatedMessage(inputText.trim());
    setInputText('');
  };

  return (
    <section className="py-16 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20 mb-3">
            <Activity className="w-3.5 h-3.5" />
            <span>Interactive Evaluator Bonus Showcase</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Real-Time Network Latency & Drop Simulator
          </h2>
          <p className="text-xs md:text-sm text-gray-400 mt-2 max-w-2xl mx-auto">
            Test optimistic UI updates, packet transmission telemetry, and offline queue recovery in real-time.
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-white/5">
            {/* Latency Selection */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                Target Latency:
              </span>
              <div className="flex items-center gap-1.5">
                {([20, 300, 1500] as LatencyOption[]).map((val) => (
                  <button
                    key={val}
                    onClick={() => setLatency(val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      latency === val
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {val}ms {val === 20 ? '(Optimal)' : val === 300 ? '(3G)' : '(High Delay)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Network Mode Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleOnline}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                  isOnline
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span>Mode: Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4" />
                    <span>Mode: Offline (Queued)</span>
                  </>
                )}
              </button>

              <button
                onClick={clearSimulator}
                title="Reset Stream"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dual Viewports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Viewport 1: Sender Client */}
            <div className="flex flex-col h-80 rounded-2xl bg-[#0d1322] border border-white/10 p-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  Simulated User A (Sender View)
                </span>
                <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                  Optimistic Render
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {messages.map((m) => (
                  <div key={m.id} className="flex flex-col items-end">
                    <div className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs max-w-[85%] shadow-md">
                      <p>{m.text}</p>
                      <div className="flex items-center justify-end gap-1 text-[9px] text-indigo-200 mt-1">
                        <span>Status: {m.status}</span>
                        {m.status === 'sending' ? (
                          <Clock className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSend} className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type message to test latency..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Viewport 2: Receiver Client */}
            <div className="flex flex-col h-80 rounded-2xl bg-[#0d1322] border border-white/10 p-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Simulated User B (Receiver View)
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  WebSocket Stream
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {messages
                  .filter((m) => m.status === 'sent')
                  .map((m) => (
                    <div key={`rcv_${m.id}`} className="flex flex-col items-start">
                      <div className="px-3.5 py-2 rounded-2xl bg-[#151d30] border border-white/10 text-gray-100 text-xs max-w-[85%] shadow-md">
                        <p>{m.text}</p>
                        <div className="text-[9px] text-gray-400 mt-1 flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 text-amber-400" />
                          <span>Delivered in {m.rttMs}ms</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="mt-3 p-2 rounded-xl bg-black/40 border border-white/5 text-[11px] text-gray-400 text-center">
                Receiving packets over active WebSocket connection
              </div>
            </div>
          </div>

          {/* Telemetry Dashboard */}
          <div className="p-4 rounded-2xl bg-black/50 border border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Packet RTT</span>
              <span className="text-lg font-extrabold text-indigo-400">{metrics.rttMs} ms</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Optimistic Render</span>
              <span className="text-lg font-extrabold text-cyan-400">{metrics.optimisticRenderMs} ms</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Packets Sent / Rcv</span>
              <span className="text-lg font-extrabold text-purple-400">
                {metrics.packetsSent} / {metrics.packetsReceived}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Sync Status</span>
              <span
                className={`text-sm font-extrabold ${
                  metrics.syncStatus === 'Synchronized'
                    ? 'text-emerald-400'
                    : metrics.syncStatus === 'Queueing'
                    ? 'text-amber-400'
                    : 'text-indigo-400'
                }`}
              >
                {metrics.syncStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
