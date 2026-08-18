import { Question, type AnswersQuestions, type UsesAbilities } from 'hand-baked-screenplay-pattern';
import { ReceiveEvents } from '../abilities/ReceiveEvents.js';
import type { DomainEvent } from '../../sut/types.js';

export class TheEmittedEvents {
  static onChannel(channel: DomainEvent['channel']): Question<DomainEvent[]> {
    return Question.about(`emitted events on channel "${channel}"`, (actor: AnswersQuestions & UsesAbilities) => {
      const receiver = actor.abilityTo(ReceiveEvents);
      return receiver.getEvents(channel);
    });
  }

  static named(name: string, channel?: DomainEvent['channel']): Question<DomainEvent | undefined> {
    return Question.about(`emitted event named "${name}"`, (actor: AnswersQuestions & UsesAbilities) => {
      const receiver = actor.abilityTo(ReceiveEvents);
      return receiver.findEvent(name, channel);
    });
  }
}
