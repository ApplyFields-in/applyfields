import { Injectable, Logger } from '@nestjs/common';
import type { Response } from 'express';

@Injectable()
export class SseService {
  private readonly logger = new Logger(SseService.name);
  private readonly clients = new Map<string, Set<Response>>();

  constructor() {
    // Send heartbeat comment every 25 seconds to keep proxies from dropping idle SSE streams
    setInterval(() => {
      this.pingAll();
    }, 25_000).unref();
  }

  /** Registers an active HTTP response as an SSE client for the given user. */
  addClient(userId: string, res: Response): void {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(res);

    // Initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);

    res.on('close', () => {
      const set = this.clients.get(userId);
      if (set) {
        set.delete(res);
        if (set.size === 0) {
          this.clients.delete(userId);
        }
      }
    });
  }

  /** Emits an event to a specific user across all their open browser tabs. */
  sendToUser(userId: string, event: string, data: unknown): void {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) return;

    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of userClients) {
      try {
        res.write(payload);
      } catch (err) {
        this.logger.debug(`Failed to write SSE to client: ${(err as Error).message}`);
      }
    }
  }

  /** Broadcasts an event to all currently connected users. */
  broadcast(event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const set of this.clients.values()) {
      for (const res of set) {
        try {
          res.write(payload);
        } catch {
          // Handled on close
        }
      }
    }
  }

  /** Count of active live SSE connections */
  getActiveConnectionsCount(): number {
    let total = 0;
    for (const set of this.clients.values()) {
      total += set.size;
    }
    return total;
  }

  private pingAll(): void {
    for (const set of this.clients.values()) {
      for (const res of set) {
        try {
          res.write(': ping\n\n');
        } catch {
          // Handled on close
        }
      }
    }
  }
}
