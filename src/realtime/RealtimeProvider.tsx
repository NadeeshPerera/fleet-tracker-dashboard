"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getBackoffDelay } from "@/lib/backoff";
import { useAppDispatch } from "@/store";
import { connected, connecting, deltaReceived, reconnectScheduled, snapshotReceived } from "@/store/slices";
import { MockFleetHub, type FleetHub } from "./mockFleetHub";

export const FleetHubContext = createContext<FleetHub | null>(null);

export function useFleetHub(): FleetHub {
  const hub = useContext(FleetHubContext);
  if (!hub) throw new Error("useFleetHub must be used inside <RealtimeProvider>");
  return hub;
}

/**
 * Owns the real-time connection lifecycle:
 * connect → stream deltas into Redux → on unexpected close, reconnect with
 * exponential backoff → resync from a fresh snapshot.
 */
export function RealtimeProvider({ children, hub: injectedHub }: { children: ReactNode; hub?: FleetHub }) {
  const dispatch = useAppDispatch();
  const [hub] = useState<FleetHub>(() => injectedHub ?? new MockFleetHub());

  useEffect(() => {
    let cancelled = false;
    let attempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const offMessage = hub.on((msg) => {
      if (msg.type === "snapshot") dispatch(snapshotReceived(msg));
      else dispatch(deltaReceived(msg));
    });

    const scheduleReconnect = () => {
      const retryInMs = getBackoffDelay(attempt);
      attempt += 1;
      dispatch(reconnectScheduled({ attempt, retryInMs }));
      retryTimer = setTimeout(connect, retryInMs);
    };

    async function connect() {
      dispatch(connecting());
      try {
        await hub.start();
        if (cancelled) return;
        attempt = 0;
        dispatch(connected());
      } catch {
        if (!cancelled) scheduleReconnect();
      }
    }

    const offClose = hub.onClose(() => {
      if (!cancelled) scheduleReconnect();
    });

    connect();

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      offMessage();
      offClose();
      hub.stop();
    };
  }, [hub, dispatch]);

  return <FleetHubContext.Provider value={hub}>{children}</FleetHubContext.Provider>;
}
