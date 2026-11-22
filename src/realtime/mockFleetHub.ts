/**
 * In-browser stand-in for a real-time backend (e.g. a SignalR hub or WebSocket server).
 *
 * The API deliberately mirrors @microsoft/signalr's HubConnection — start(), stop(),
 * on(), onclose(), invoke() — so swapping in a real connection only touches this file.
 * The "server" keeps simulating while a client is disconnected; on reconnect the client
 * gets a full snapshot to resync anything it missed.
 */
import {
  allocateJob,
  createInitialState,
  createRng,
  tick,
  type Changes,
  type EngineState,
  type Rng,
} from "@/server/engine";
import type { Job, Truck } from "@/lib/types";

export type ServerMessage =
  | { type: "snapshot"; trucks: Truck[]; jobs: Job[]; serverTime: number }
  | { type: "delta"; trucks: Truck[]; jobs: Job[]; serverTime: number };

export type InvokeResult = { ok: true } | { ok: false; error: string };

export interface FleetHub {
  start(): Promise<void>;
  stop(): void;
  on(handler: (msg: ServerMessage) => void): () => void;
  onClose(handler: (error?: Error) => void): () => void;
  allocateJob(jobId: string, truckId: string): Promise<InvokeResult>;
  setAutoDispatch(enabled: boolean): void;
  simulateNetworkDrop(): void;
}

interface Options {
  tickMs?: number;
  latencyMs?: number;
  /** How long the "network" stays down after simulateNetworkDrop(). */
  outageMs?: number;
  seed?: number;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Clone before sending: the server must never share object references with the
// client store (Redux/Immer freezes state, and the engine mutates its own copy).
const clone = <T,>(value: T): T => structuredClone(value);

export class MockFleetHub implements FleetHub {
  private readonly state: EngineState;
  private readonly rng: Rng;
  private readonly tickMs: number;
  private readonly latencyMs: number;
  private readonly outageMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastTickAt = 0;
  private connected = false;
  private networkDownUntil = 0;
  private readonly handlers = new Set<(msg: ServerMessage) => void>();
  private readonly closeHandlers = new Set<(error?: Error) => void>();

  constructor({ tickMs = 1000, latencyMs = 250, outageMs = 2500, seed = Date.now() }: Options = {}) {
    this.tickMs = tickMs;
    this.latencyMs = latencyMs;
    this.outageMs = outageMs;
    this.rng = createRng(seed);
    this.state = createInitialState(Date.now(), this.rng);
  }

  async start(): Promise<void> {
    this.ensureEngineRunning();
    await delay(this.latencyMs);
    if (Date.now() < this.networkDownUntil) {
      throw new Error("Network unavailable");
    }
    this.connected = true;
    this.emit({
      type: "snapshot",
      trucks: clone(Object.values(this.state.trucks)),
      jobs: clone(Object.values(this.state.jobs)),
      serverTime: Date.now(),
    });
  }

  /** Client-initiated disconnect. Also stops the simulation loop. */
  stop(): void {
    this.connected = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  on(handler: (msg: ServerMessage) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  onClose(handler: (error?: Error) => void): () => void {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }

  async allocateJob(jobId: string, truckId: string): Promise<InvokeResult> {
    if (!this.connected) return { ok: false, error: "Not connected to server" };
    await delay(this.latencyMs);
    const result = allocateJob(this.state, jobId, truckId, Date.now());
    if (!result.ok) return result;
    this.pushDelta(result.changes);
    return { ok: true };
  }

  setAutoDispatch(enabled: boolean): void {
    this.state.autoDispatch = enabled;
  }

  /** Drop the connection unexpectedly, as if Wi-Fi blipped. */
  simulateNetworkDrop(): void {
    if (!this.connected) return;
    this.connected = false;
    this.networkDownUntil = Date.now() + this.outageMs;
    const error = new Error("Connection lost");
    this.closeHandlers.forEach((handler) => handler(error));
  }

  private ensureEngineRunning() {
    if (this.timer) return;
    this.lastTickAt = Date.now();
    this.timer = setInterval(() => {
      const now = Date.now();
      const changes = tick(this.state, now, now - this.lastTickAt, this.rng);
      this.lastTickAt = now;
      this.pushDelta(changes);
    }, this.tickMs);
  }

  private pushDelta(changes: Changes) {
    if (!this.connected || (changes.trucks.length === 0 && changes.jobs.length === 0)) return;
    this.emit({
      type: "delta",
      trucks: clone(changes.trucks),
      jobs: clone(changes.jobs),
      serverTime: Date.now(),
    });
  }

  private emit(msg: ServerMessage) {
    this.handlers.forEach((handler) => handler(msg));
  }
}
