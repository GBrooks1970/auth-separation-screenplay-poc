import { Question, type AnswersQuestions, type UsesAbilities } from 'hand-baked-screenplay-pattern';
import { CallAnApi } from '../abilities/CallAnApi.js';
import type { DecisionOutcome } from '../../sut/types.js';

export class TheAccessDecision {
  static outcome(): Question<DecisionOutcome | undefined> {
    return Question.about('the evaluated access decision outcome', (actor: AnswersQuestions & UsesAbilities) => {
      const api = actor.abilityTo(CallAnApi);
      const body = api.getLastResponse().body;
      return body?.decision;
    });
  }

  static reason(): Question<string | undefined> {
    return Question.about('the evaluated access decision reason', (actor: AnswersQuestions & UsesAbilities) => {
      const api = actor.abilityTo(CallAnApi);
      const body = api.getLastResponse().body;
      return body?.reason;
    });
  }
}
