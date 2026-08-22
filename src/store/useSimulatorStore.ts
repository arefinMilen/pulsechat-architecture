import { create } from 'zustand';
import { LatencyOption, ProtocolOption, TelemetryMetrics, Message } from '../types';

interface SimulatorMessage extends Message {
  rttMs: number;
}

interface SimulatorState {
  latency: LatencyOption;
  protocol: ProtocolOption;
  isOnline: boolean;
  messages: SimulatorMessage[];
  queuedMessages: string[];
  metrics: TelemetryMetrics;

  setLatency: (latency: LatencyOption) => void;
  setProtocol: (protocol: ProtocolOption) => void;
  toggleOnline: () => void;
  sendSimulatedMessage: (text: string) => void;
  clearSimulator: () => void;
}

export const useSimulatorStore = create<SimulatorState>((set, get) => ({
  latency: 20,
  protocol: 'WebSocket',
  isOnline: true,
  messages: [
    {
      id: 'sim_init_1',
      conversationId: 'sim_conv',
      senderId: 'usr_b',
      sender: { id: 'usr_b', name: 'Recipient', phone: '+15550000000' },
      text: 'Send something below, then try adding latency or going offline.',
      createdAt: new Date().toISOString(),
      status: 'sent',
      rttMs: 18,
    },
  ],
  queuedMessages: [],
  metrics: {
    rttMs: 20,
    optimisticRenderMs: 1.2,
    packetsSent: 1,
    packetsReceived: 1,
    syncStatus: 'Synchronized',
  },

  setLatency: (latency) =>
    set((state) => ({
      latency,
      metrics: { ...state.metrics, rttMs: latency },
    })),

  setProtocol: (protocol) => set({ protocol }),

  toggleOnline: () => {
    const nextOnline = !get().isOnline;
    if (nextOnline) {
      // Re-connected: flush offline queue
      const queue = get().queuedMessages;
      set((state) => ({
        isOnline: true,
        queuedMessages: [],
        metrics: { ...state.metrics, syncStatus: 'Syncing...' },
      }));

      setTimeout(() => {
        queue.forEach((text) => get().sendSimulatedMessage(text));
        set((state) => ({
          metrics: { ...state.metrics, syncStatus: 'Synchronized' },
        }));
      }, 500);
    } else {
      set((state) => ({
        isOnline: false,
        metrics: { ...state.metrics, syncStatus: 'Queueing' },
      }));
    }
  },

  sendSimulatedMessage: (text: string) => {
    const { isOnline, latency, messages, queuedMessages, metrics } = get();

    if (!isOnline) {
      set({ queuedMessages: [...queuedMessages, text] });
      return;
    }

    const renderStart = performance.now();
    const tempId = `sim_temp_${Date.now()}`;

    const tempMsg: SimulatorMessage = {
      id: tempId,
      conversationId: 'sim_conv',
      senderId: 'usr_a',
      sender: { id: 'usr_a', name: 'Simulated User A', phone: '+15551112222' },
      text,
      createdAt: new Date().toISOString(),
      status: 'sending',
      rttMs: 0,
    };

    const renderMs = Number((performance.now() - renderStart).toFixed(2));

    set({
      messages: [...messages, tempMsg],
      metrics: {
        ...metrics,
        optimisticRenderMs: Math.max(renderMs, 0.8),
        packetsSent: metrics.packetsSent + 1,
        syncStatus: 'Synchronized',
      },
    });

    // Simulate network transmission delay based on latency slider
    setTimeout(() => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === tempId
            ? { ...m, status: 'sent', rttMs: latency + Math.floor(Math.random() * 8) }
            : m
        ),
        metrics: {
          ...state.metrics,
          packetsReceived: state.metrics.packetsReceived + 1,
          rttMs: latency,
        },
      }));
    }, latency);
  },

  clearSimulator: () =>
    set({
      messages: [],
      queuedMessages: [],
      metrics: {
        rttMs: 20,
        optimisticRenderMs: 1.0,
        packetsSent: 0,
        packetsReceived: 0,
        syncStatus: 'Synchronized',
      },
    }),
}));
