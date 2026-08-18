import type { DomainEvent } from '../types.js';

export type EventHandler = (event: DomainEvent) => void;

/**
 * In-memory EventBus simulating cross-service messaging and centralised audit logging.
 * Enforces AsyncAPI 3.0 event channel decoupling across AuthN, AuthZ, and Profile services.
 */
export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private eventLedger: DomainEvent[] = [];

  publish<T extends Record<string, unknown>>(channel: DomainEvent['channel'], name: string, payload: T): DomainEvent<T> {
    const event: DomainEvent<T> = {
      channel,
      name,
      payload,
      timestamp: payload.timestamp ? String(payload.timestamp) : new Date().toISOString()
    };

    this.eventLedger.push(event as unknown as DomainEvent);

    // If published on domain channel, also mirror to audit.events
    if (channel !== 'audit.events') {
      const auditEvent: DomainEvent = {
        channel: 'audit.events',
        name: 'AuditRecordLogged',
        payload: {
          audit_id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          correlation_id: `corr_${Date.now()}`,
          source_service: channel.replace('.events', ''),
          event_name: name,
          actor_id: (payload.user_id as string) || 'system',
          details: payload,
          timestamp: event.timestamp
        },
        timestamp: event.timestamp
      };
      this.eventLedger.push(auditEvent);
    }

    const channelHandlers = this.handlers.get(channel) ?? [];
    for (const handler of channelHandlers) {
      try {
        handler(event as unknown as DomainEvent);
      } catch (err) {
        console.error(`[EventBus] Error in handler for channel ${channel}:`, err);
      }
    }

    return event;
  }

  subscribe(channel: DomainEvent['channel'], handler: EventHandler): () => void {
    const list = this.handlers.get(channel) ?? [];
    list.push(handler);
    this.handlers.set(channel, list);

    return () => {
      const current = this.handlers.get(channel) ?? [];
      this.handlers.set(
        channel,
        current.filter((h) => h !== handler)
      );
    };
  }

  getEvents(channel?: DomainEvent['channel']): DomainEvent[] {
    if (!channel) {
      return [...this.eventLedger];
    }
    return this.eventLedger.filter((e) => e.channel === channel);
  }

  findEventsByName(name: string): DomainEvent[] {
    return this.eventLedger.filter((e) => e.name === name);
  }

  clear(): void {
    this.eventLedger = [];
    this.handlers.clear();
  }
}

export const globalEventBus = new EventBus();
