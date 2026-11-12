export type StreamAlertEvent = {
  id: string;
  source: "manual" | "webhook" | "twitch_irc";
  viewerName: string;
  label: string;
  prompt: string;
  durationSec: number;
  amountCop: number | null;
  createdAt: string;
};

type Subscriber = (event: StreamAlertEvent) => void;

type AlertBusStore = {
  subscribers: Set<Subscriber>;
  recent: StreamAlertEvent[];
};

const globalStore = globalThis as unknown as { __spikeAlertBus?: AlertBusStore };

function getStore(): AlertBusStore {
  if (!globalStore.__spikeAlertBus) {
    globalStore.__spikeAlertBus = {
      subscribers: new Set<Subscriber>(),
      recent: [],
    };
  }
  return globalStore.__spikeAlertBus;
}

export function publishAlertEvent(event: StreamAlertEvent): void {
  const store = getStore();
  store.recent = [event, ...store.recent].slice(0, 25);
  for (const sub of store.subscribers) {
    try {
      sub(event);
    } catch {
      // Ignore closed subscriber callbacks
    }
  }
}

export function subscribeAlertEvents(sub: Subscriber): () => void {
  const store = getStore();
  store.subscribers.add(sub);
  return () => {
    store.subscribers.delete(sub);
  };
}

export function getRecentAlertEvents(): StreamAlertEvent[] {
  return getStore().recent;
}
