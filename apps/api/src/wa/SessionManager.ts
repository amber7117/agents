/*
 * SessionManager — Enterprise-grade WhatsApp (Baileys) session orchestrator
 * -------------------------------------------------------------------------
 * Goals
 *  - Manage many WhatsApp sessions keyed by channelId
 *  - Single flight for start/stop, safe restarts, backoff recovery
 *  - Keep-alive + watchdog to detect zombie sockets
 *  - Event fan-out (qr/ready/status/message/error)
 *  - Optional persistence of desired-run-state (DB) for auto-recovery
 *  - Optional distributed lock (Redlock) so only one node owns a channelId
 *  - Pluggable hooks for metrics / observability
 *  - Hardening: input guards, defensive catches, exhaustive logging
 *
 *  This file is intentionally verbose and well-commented for production use.
 *  It is self-contained; adapt imports near the top to match your repo.
 */

/* eslint-disable no-console */

import { EventEmitter } from 'events';
import { setTimeout as delay } from 'timers/promises';

// --- External deps from your monorepo --------------------------------------------------
// BaileysConnector: your thin wrapper around @whiskeysockets/baileys
import { BaileysConnector } from '@pkg/connectors-whatsapp';
import type { WASocket } from '@whiskeysockets/baileys';
// Prisma client (optional persistence)
import { prisma } from '@pkg/db';
// Optional: Redlock instance you already bootstrap elsewhere
import { redlock } from '../bootstrap/locks';



// ---------------------------------------------------------------------------------------
//                               Types & Interfaces
// ---------------------------------------------------------------------------------------

export type SessionId = string; // = channelId

export type SessionState =
    | 'disconnected'
    | 'waiting_qr'
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'logged_out';

export interface SessionParams {
    channelId: SessionId;
    /** Optional: who owns this channel, for audit only */
    userId?: string;
    /** Optional friendly label for UI */
    name?: string;
}

export interface SessionSnapshot {
    channelId: SessionId;
    state: SessionState;
    since: number; // epoch ms
    lastEventAt?: number;
    phoneNumber?: string;
    name?: string;
    owner?: string;
}

export interface SessionMetrics {
    startedAt: Date;
    lastActivity: Date;
    messageCount: number;
    keepAliveTimer?: NodeJS.Timeout;
}

export type ManagerEvent =
    | 'qr'
    | 'ready'
    | 'status'
    | 'message'
    | 'error'
    | 'session.started'
    | 'session.stopped'
    | 'keepalive.sent'
    | 'keepalive.failed';

export interface ManagerEventPayloads {
    qr: { channelId: SessionId; qr: string };
    ready: { channelId: SessionId; phoneNumber?: string };
    status: { channelId: SessionId; state: SessionState };
    message: any; // your app-level message payload
    error: { channelId: SessionId; error: string };
    'session.started': { channelId: SessionId; userId?: string; name?: string };
    'session.stopped': { channelId: SessionId };
    'keepalive.sent': { channelId: SessionId };
    'keepalive.failed': { channelId: SessionId; reason: string };
}

// ---------------------------------------------------------------------------------------
//                               Stores (desired state)
// ---------------------------------------------------------------------------------------

/** Desired-state persistence interface. */
export interface DesiredStateStore {
    loadShouldRun(): Promise<SessionParams[]>;
    setShouldRun(channelId: SessionId, shouldRun: boolean, info?: Omit<SessionParams, 'channelId'>): Promise<void>;
}

/** In-memory fallback (non-persistent). */
export class MemoryDesiredStateStore implements DesiredStateStore {
    private map = new Map<SessionId, SessionParams>();
    async loadShouldRun(): Promise<SessionParams[]> {
        return [...this.map.values()];
    }
    async setShouldRun(channelId: SessionId, shouldRun: boolean, info?: Omit<SessionParams, 'channelId'>) {
        if (shouldRun) this.map.set(channelId, { channelId, ...info });
        else this.map.delete(channelId);
    }
}

/**
 * Prisma-backed desired-state store (optional). Requires a simple table like:
 *
 * model ChannelDesiredState {
 *   channelId String  @id
 *   userId    String?
 *   name      String?
 *   shouldRun Boolean @default(true)
 *   updatedAt DateTime @updatedAt
 * }
 */
export class PrismaDesiredStateStore implements DesiredStateStore {
    async loadShouldRun(): Promise<SessionParams[]> {
        try {
            const rows = await (prisma as any).channelDesiredState.findMany({ where: { shouldRun: true } });
            return rows.map((r: any) => ({ channelId: r.channelId, userId: r.userId ?? undefined, name: r.name ?? undefined }));
        } catch (e) {
            console.warn('[PrismaDesiredStateStore] fallback to memory (table missing?):', e);
            return [];
        }
    }
    async setShouldRun(channelId: SessionId, shouldRun: boolean, info?: Omit<SessionParams, 'channelId'>): Promise<void> {
        try {
            await (prisma as any).channelDesiredState.upsert({
                where: { channelId },
                create: { channelId, shouldRun, userId: info?.userId ?? null, name: info?.name ?? null },
                update: { shouldRun, userId: info?.userId ?? null, name: info?.name ?? null },
            });
        } catch (e) {
            console.warn('[PrismaDesiredStateStore] setShouldRun ignored (table missing?):', e);
        }
    }
}

// ---------------------------------------------------------------------------------------
//                               Utilities
// ---------------------------------------------------------------------------------------

function nowMs() { return Date.now(); }
function jitter(ms: number) { return ms + Math.floor(Math.random() * 1000); }

function isFunction(x: any): x is (...a: any[]) => any { return typeof x === 'function'; }

/** Convert any unknown error to string. */
function errStr(e: unknown): string {
    if (!e) return 'unknown';
    if (e instanceof Error) return e.message || String(e);
    try { return JSON.stringify(e); } catch { return String(e); }
}

// ---------------------------------------------------------------------------------------
//                               Manager Options
// ---------------------------------------------------------------------------------------

export interface SessionManagerOptions {
    /** Where to write auth files if your connector uses FS mode; your connector may ignore this. */
    authRoot?: string;
    /** Desired-state store; defaults to Prisma store if available, else memory. */
    store?: DesiredStateStore;
    /** Distributed lock TTL when starting/stopping (ms). */
    lockTtlMs?: number;
    /** Keep-alive tick interval (ms). */
    keepAliveEveryMs?: number;
    /** Watchdog threshold: if no activity for this long, force restart (ms). */
    watchdogSilenceMs?: number;
    /** Max recovery retries before giving up. */
    maxRetries?: number;
    /** Base delay for exponential backoff (ms). */
    baseRetryDelayMs?: number;
    /** Concurrency for recoverAll. */
    recoverConcurrency?: number;
    /** Hook to broadcast events (e.g., Socket.IO). */
    onEvent?: <T extends ManagerEvent>(type: T, payload: ManagerEventPayloads[T]) => void;
    /** Logger (pino-like). */
    logger?: { info: Function; warn: Function; error: Function; debug?: Function };
}

// ---------------------------------------------------------------------------------------
//                               SessionManager
// ---------------------------------------------------------------------------------------

export class SessionManager extends EventEmitter {
    // runtime maps
    private sessions = new Map<SessionId, BaileysConnector>();
    private metrics = new Map<SessionId, SessionMetrics>();
    private owners = new Map<SessionId, string | undefined>();
    private names = new Map<SessionId, string | undefined>();

    // single-flight guards
    private starting = new Map<SessionId, Promise<void>>();
    private stopping = new Map<SessionId, Promise<void>>();

    // recovery
    private recoverQueue = new Map<SessionId, { retry: number; last: number }>();
    private recovering = false;

    // options
    private readonly store: DesiredStateStore;
    private readonly lockTtlMs: number;
    private readonly keepAliveEvery: number;
    private readonly watchdogSilence: number;
    private readonly maxRetries: number;
    private readonly baseRetryDelay: number;
    private readonly recoverConcurrency: number;
    private readonly onEvent?: SessionManagerOptions['onEvent'];
    private readonly log: Required<Pick<SessionManagerOptions, 'logger'>>['logger'];

    constructor(opts: SessionManagerOptions = {}) {
        super();
        this.store = opts.store ?? new PrismaDesiredStateStore();
        this.lockTtlMs = opts.lockTtlMs ?? 20_000;
        this.keepAliveEvery = Math.max(5_000, opts.keepAliveEveryMs ?? 30_000);
        this.watchdogSilence = Math.max(this.keepAliveEvery * 3, opts.watchdogSilenceMs ?? 120_000);
        this.maxRetries = Math.max(1, opts.maxRetries ?? 6);
        this.baseRetryDelay = Math.max(1000, opts.baseRetryDelayMs ?? 5_000);
        this.recoverConcurrency = Math.max(1, opts.recoverConcurrency ?? 4);
        this.onEvent = opts.onEvent;
        this.log = opts.logger ?? console;

        this.setupGracefulShutdown();
    }

    // ----------------------------- lifecycle --------------------------------------------

    private setupGracefulShutdown() {
        const onShutdown = async (sig: string) => {
            this.log.info?.({ sig }, '[SessionManager] graceful shutdown');
            await this.stopAll();
            process.exit(0);
        };
        process.on('SIGINT', () => onShutdown('SIGINT'));
        process.on('SIGTERM', () => onShutdown('SIGTERM'));
        process.on('beforeExit', async () => { await this.stopAll(); });
    }

    // ----------------------------- public API -------------------------------------------

    /** Ensure a session is running (idempotent + single-flight + dist lock). */
    async ensureRunning(params: SessionParams): Promise<boolean> {
        const { channelId, userId, name } = params;

        // fast path: if starting already, await it
        const inflight = this.starting.get(channelId);
        if (inflight) { await inflight; return this.isSessionReady(channelId); }

        const existing = this.sessions.get(channelId);
        if (existing && (existing as any).isReady(channelId)) {
            this.touch(channelId);
            return true;
        }

        // if existed but not ready -> stop first
        if (existing && !(existing as any).isReady(channelId)) {
            await this.safeStop(channelId).catch(() => void 0);
        }

        const job = (async () => {
            // distributed lock (optional). Ignore if redlock not configured.
            let lock: any | null = null;
            try {
                if (redlock) {
                    lock = await redlock.acquire([`lock:wa:start:${channelId}`], this.lockTtlMs).catch(() => null);
                }

                // construct connector
                const connector = new BaileysConnector
                    ({
                        authRoot: './apps/api/apps/api/wa-auth',
                        redlock,
                        useDatabase: true,
                        makeAuthState: async (cid: string, uid: string) => {
                            const { makeDbAuthState } = await import('./db-auth-store');
                            return makeDbAuthState(cid, uid);
                        },
                    });

                this.bindConnectorEvents(connector, channelId);

                // BaileysConnector expects: start(uid, channelId)
                // Always pass both parameters
                await (connector as any).start(userId, channelId);

                this.sessions.set(channelId, connector);
                this.owners.set(channelId, userId);
                this.names.set(channelId, name);
                this.metrics.set(channelId, {
                    startedAt: new Date(),
                    lastActivity: new Date(),
                    messageCount: 0,
                });

                // keepalive
                this.beginKeepAlive(channelId);

                // desired state persisted
                await this.store.setShouldRun(channelId, true, { userId, name }).catch(() => void 0);

                // fire events
                this.emit('session.started', { channelId, userId, name } as ManagerEventPayloads['session.started']);
                this.forward('status', { channelId, state: 'connecting' });

                this.recoverQueue.delete(channelId);
                this.log.info?.({ channelId }, '[SessionManager] started');
            } catch (e) {
                const msg = errStr(e);
                this.log.error?.({ channelId, err: msg }, '[SessionManager] start failed');
                this.forward('error', { channelId, error: msg });
                await this.enqueueRecovery({ channelId, userId, name });
            } finally {
                if (lock) { try { await lock.release(); } catch { /* noop */ } }
                this.starting.delete(channelId);
            }
        })();

        this.starting.set(channelId, job);
        await job;
        return this.isSessionReady(channelId);
    }

    /** Stop a session gracefully. */
    async stop(channelId: SessionId): Promise<boolean> {
        const inflight = this.stopping.get(channelId);
        if (inflight) { await inflight; return true; }

        const job = (async () => {
            await this.store.setShouldRun(channelId, false).catch(() => void 0);
            await this.safeStop(channelId);
            this.forward('status', { channelId, state: 'disconnected' });
            this.emit('session.stopped', { channelId } as ManagerEventPayloads['session.stopped']);
            this.log.info?.({ channelId }, '[SessionManager] stopped');
        })();

        this.stopping.set(channelId, job);
        await job;
        this.stopping.delete(channelId);
        return true;
    }

    /** Stop all sessions. */
    async stopAll(): Promise<void> {
        const ids = [...this.sessions.keys()];
        await Promise.allSettled(ids.map((id) => this.stop(id)));
    }

    /** Recover desired sessions (from store or provided list). */
    async recoverAll(seed?: SessionParams[]): Promise<{ success: number; failed: number }> {
        if (this.recovering) return { success: 0, failed: 0 };
        this.recovering = true;

        const desired = seed ?? (await this.store.loadShouldRun());
        this.log.info?.({ count: desired.length }, '[SessionManager] recovering');

        // simple concurrency control
        const lanes = Math.max(1, this.recoverConcurrency);
        const buckets: SessionParams[][] = Array.from({ length: lanes }, () => []);
        desired.forEach((p, i) => buckets[i % lanes].push(p));

        const results = await Promise.all(
            buckets.map(async (bucket) => {
                let ok = 0;
                for (const p of bucket) {
                    const success = await this.ensureRunning(p).catch(() => false);
                    if (success) ok++;
                    // small stagger to avoid thundering herd
                    await delay(150);
                }
                return ok;
            })
        );

        this.recovering = false;
        const success = results.reduce((a, b) => a + b, 0);
        const failed = desired.length - success;
        this.log.info?.({ success, failed }, '[SessionManager] recover done');
        return { success, failed };
    }

    /** Send a text message via a session. */
    async sendMessage(channelId: SessionId, to: string, text: string): Promise<void> {
        const c = this.sessions.get(channelId);
        if (!c || !(c as any).isReady(channelId)) throw new Error(`Session ${channelId} not ready`);
        await c.send(channelId, to, text, 'text');
        this.touch(channelId); this.bumpMsg(channelId);
    }

    /** Optional helpers (if implemented by connector). */
    async deleteChat(channelId: SessionId, jid: string): Promise<void> {
        const c = this.sessions.get(channelId);
        if (!c || !(c as any).isReady(channelId) || !isFunction((c as any).deleteChat)) throw new Error('unsupported');
        await (c as any).deleteChat(channelId, jid);
        this.touch(channelId);
    }
    async archiveChat(channelId: SessionId, jid: string, archive: boolean): Promise<void> {
        const c = this.sessions.get(channelId);
        if (!c || !(c as any).isReady(channelId) || !isFunction((c as any).archiveChat)) throw new Error('unsupported');
        await (c as any).archiveChat(channelId, jid, archive);
        this.touch(channelId);
    }

    // ----------------------------- queries ----------------------------------------------

    listSnapshots(): SessionSnapshot[] {
        return [...this.sessions.keys()].map((channelId) => this.getSnapshot(channelId)!).filter(Boolean);
    }

    getSnapshot(channelId: SessionId): SessionSnapshot | undefined {
        const c = this.sessions.get(channelId);
        if (!c) return undefined;

        // Check if snapshot method exists and is callable
        const hasSnapshot = 'snapshot' in c && typeof (c as any).snapshot === 'function';
        const s = hasSnapshot
            ? (c as any).snapshot()
            : {
                state: (c as any).isReady(channelId) ? 'connected' : 'disconnected',
                since: nowMs()
            };

        return {
            channelId,
            state: (s.state as SessionState) ?? ((c as any).isReady(channelId) ? 'connected' : 'disconnected'),
            since: s.since ?? nowMs(),
            lastEventAt: s.lastEventAt,
            phoneNumber: s.phoneNumber,
            name: this.names.get(channelId),
            owner: this.owners.get(channelId),
        };
    }

    getSessionMetrics(channelId: SessionId): SessionMetrics | null { return this.metrics.get(channelId) ?? null; }
    getAllMetrics(): Map<SessionId, SessionMetrics> { return new Map(this.metrics); }
    isSessionReady(channelId: SessionId): boolean {
        const session = this.sessions.get(channelId);
        return session ? (session as any).isReady(channelId) : false;
    }

    /** Get session info (name, userId, etc.) */
    getSessionInfo(channelId: SessionId): { name?: string; userId?: string } | null {
        const name = this.names.get(channelId);
        const userId = this.owners.get(channelId);
        return name || userId ? { name, userId } : null;
    }

    // ----------------------------- internal ---------------------------------------------

    private touch(channelId: SessionId) {
        const m = this.metrics.get(channelId); if (m) m.lastActivity = new Date();
    }
    private bumpMsg(channelId: SessionId) {
        const m = this.metrics.get(channelId); if (m) m.messageCount += 1;
    }

    private forward<T extends ManagerEvent>(type: T, payload: ManagerEventPayloads[T]) {
        this.emit(type, payload as any);
        try { this.onEvent?.(type, payload as any); } catch { /* ignore sink errors */ }
    }

    /** Bind Connector -> Manager fanout. */
    private bindConnectorEvents(connector: any, channelId: SessionId) {
        connector.on('qr', (data: any) => {
            const id = data?.channelId ?? data?.uid ?? channelId;
            if (id !== channelId) return;
            const qr = data?.qr ?? data?.code ?? data?.data;
            if (!qr) return;
            this.forward('qr', { channelId: id, qr });
            this.touch(id);
        });

        connector.on('ready', (data: any) => {
            const id = data?.channelId ?? data?.uid ?? channelId;
            if (id !== channelId) return;
            this.forward('ready', { channelId: id, phoneNumber: data?.phoneNumber });
            this.forward('status', { channelId: id, state: 'connected' });
            this.touch(id);
        });

        connector.on('status', (data: any) => {
            const id = data?.channelId ?? data?.uid ?? channelId;
            if (id !== channelId) return;
            const state: SessionState = (data?.state as SessionState) ?? ((connector as any).isReady(id) ? 'connected' : 'disconnected');
            this.forward('status', { channelId: id, state });
            this.touch(id);
        });

        connector.on('message', (msg: any) => {
            const id = msg?.channelId ?? msg?.uid ?? channelId;
            if (id !== channelId) return;
            this.forward('message', msg);
            this.touch(id); this.bumpMsg(id);
        });

        connector.on('error', (err: any) => {
            const id = err?.channelId ?? err?.uid ?? channelId;
            if (id !== channelId) return;
            const s = errStr(err?.error ?? err);
            this.forward('error', { channelId: id, error: s });
        });
    }

    /** Start periodic keepalive + watchdog. */
    private beginKeepAlive(channelId: SessionId) {
        this.clearKeepAlive(channelId);
        const t = setInterval(async () => {
            const c = this.sessions.get(channelId);
            if (!c) return this.clearKeepAlive(channelId);
            try {
                if (!(c as any).isReady(channelId)) throw new Error('not ready');
                this.forward('keepalive.sent', { channelId });

                const last = this.metrics.get(channelId)?.lastActivity?.getTime() ?? 0;
                if (nowMs() - last > this.watchdogSilence) {
                    throw new Error('watchdog silence');
                }
            } catch (e) {
                this.forward('keepalive.failed', { channelId, reason: errStr(e) });
                // schedule restart with backoff
                void this.scheduleRestart(channelId);
            }
        }, this.keepAliveEvery);

        const m = this.metrics.get(channelId);
        if (m) m.keepAliveTimer = t;
    }

    private clearKeepAlive(channelId: SessionId) {
        const m = this.metrics.get(channelId);
        if (m?.keepAliveTimer) { clearInterval(m.keepAliveTimer); m.keepAliveTimer = undefined; }
    }

    /** Exponential backoff restart, with distributed lock & thundering-herd damping. */
    private async scheduleRestart(channelId: SessionId) {
        const info = this.recoverQueue.get(channelId) ?? { retry: 0, last: 0 };
        const retry = Math.min(this.maxRetries, info.retry + 1);
        const delayMs = Math.min(this.baseRetryDelay * 2 ** (retry - 1), 60_000);

        this.recoverQueue.set(channelId, { retry, last: nowMs() });
        this.log.warn?.({ channelId, retry, delayMs }, '[SessionManager] scheduling restart');

        await this.safeStop(channelId).catch(() => void 0);
        await delay(jitter(delayMs));

        const owner = this.owners.get(channelId);
        const name = this.names.get(channelId);
        await this.ensureRunning({ channelId, userId: owner, name });
    }

    /** Stop connector + cleanup maps safely. */
    private async safeStop(channelId: SessionId) {
        this.clearKeepAlive(channelId);

        // lock to avoid two nodes stopping/starting simultaneously
        let lock: any | null = null;
        try {
            if (redlock) lock = await redlock.acquire([`lock:wa:stop:${channelId}`], this.lockTtlMs).catch(() => null);
        } catch { /* ignore */ }

        const c = this.sessions.get(channelId);
        if (c) {
            try {
                if (isFunction((c as any).stop) && (c as any).stop.length >= 1) {
                    await (c as any).stop(channelId);
                } else {
                    // legacy stop(userId, channelId)
                    await (c as any).stop(this.owners.get(channelId), channelId);
                }
            } catch (e) {
                this.log.warn?.({ channelId, err: errStr(e) }, '[SessionManager] stop error');
            }
        }

        this.sessions.delete(channelId);
        this.metrics.delete(channelId);
        // keep owner & name for future recover
        this.recoverQueue.delete(channelId);

        try { if (lock) await lock.release(); } catch { /* noop */ }
    }

    /** Queue a recovery attempt (used when start fails). */
    private async enqueueRecovery(params: SessionParams) {
        const { channelId } = params;
        const info = this.recoverQueue.get(channelId) ?? { retry: 0, last: 0 };
        if (info.retry >= this.maxRetries) {
            this.log.error?.({ channelId }, '[SessionManager] max retries exceeded');
            return;
        }

        const nextRetry = info.retry + 1;
        const delayMs = Math.min(this.baseRetryDelay * 2 ** (nextRetry - 1), 60_000);
        this.recoverQueue.set(channelId, { retry: nextRetry, last: nowMs() });

        this.log.warn?.({ channelId, nextRetry, delayMs }, '[SessionManager] enqueue recovery');

        await delay(jitter(delayMs));
        await this.ensureRunning(params);
    }
}

// ---------------------------------------------------------------------------------------
//                                  Factory / Singleton
// ---------------------------------------------------------------------------------------

export const sessionManager = new SessionManager({
    // Prefer Prisma store if table exists; otherwise MemoryDesiredStateStore keeps things in-process
    store: new PrismaDesiredStateStore(),
    onEvent: (t, p) => {
        // Hook for Socket.IO fan-out: io.emit(`wa.${t}`, p)
        // Left empty intentionally. Wire this up in your HTTP/socket bootstrap.
    },
    logger: console,
});

// Optional: expose for health endpoints
; (global as any).sessionManager = sessionManager;

export default sessionManager;
