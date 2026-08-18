import { Ability } from 'hand-baked-screenplay-pattern';
import { EventBus, globalEventBus } from '../../sut/eventbus/EventBus.js';
import type { DomainEvent } from '../../sut/types.js';

export class ReceiveEvents extends Ability {
  static from(eventBus: EventBus = globalEventBus): ReceiveEvents {
    return new ReceiveEvents(eventBus);
  }

  constructor(public readonly eventBus: EventBus) {
    super();
  }

  getEvents(channel?: DomainEvent['channel']): DomainEvent[] {
    return this.eventBus.getEvents(channel);
  }

  findEvent(name: string, channel?: DomainEvent['channel']): DomainEvent | undefined {
    const events = this.getEvents(channel);
    return events.find((e) => e.name === name);
  }
}
