import { Question, type AnswersQuestions, type UsesAbilities } from 'hand-baked-screenplay-pattern';
import { CallAnApi } from '../abilities/CallAnApi.js';

export class TheLastResponse {
  static statusCode(): Question<number> {
    return Question.about('the last response status code', (actor: AnswersQuestions & UsesAbilities) => {
      const api = actor.abilityTo(CallAnApi);
      return api.getLastResponse().status;
    });
  }

  static body<T = any>(): Question<T> {
    return Question.about('the last response body', (actor: AnswersQuestions & UsesAbilities) => {
      const api = actor.abilityTo(CallAnApi);
      return api.getLastResponse<T>().body;
    });
  }

  static errorCode(): Question<string | undefined> {
    return Question.about('the last error code', (actor: AnswersQuestions & UsesAbilities) => {
      const api = actor.abilityTo(CallAnApi);
      const body = api.getLastResponse().body;
      return body?.code;
    });
  }

  static validationField(): Question<string | undefined> {
    return Question.about('the validation error field', (actor: AnswersQuestions & UsesAbilities) => {
      const api = actor.abilityTo(CallAnApi);
      const body = api.getLastResponse().body;
      return body?.details?.[0]?.field;
    });
  }
}
