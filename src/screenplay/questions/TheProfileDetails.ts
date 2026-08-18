import { Question, type AnswersQuestions, type UsesAbilities } from 'hand-baked-screenplay-pattern';
import { CallAnApi } from '../abilities/CallAnApi.js';
import type { UserProfileRecord } from '../../sut/types.js';

export class TheProfileDetails {
  static record(): Question<UserProfileRecord | undefined> {
    return Question.about('the user profile record', (actor: AnswersQuestions & UsesAbilities) => {
      const api = actor.abilityTo(CallAnApi);
      return api.getLastResponse<UserProfileRecord>().body;
    });
  }

  static name(): Question<string | undefined> {
    return Question.about('the profile display name', (actor: AnswersQuestions & UsesAbilities) => {
      const api = actor.abilityTo(CallAnApi);
      return api.getLastResponse<UserProfileRecord>().body?.name;
    });
  }

  static email(): Question<string | undefined> {
    return Question.about('the profile email address', (actor: AnswersQuestions & UsesAbilities) => {
      const api = actor.abilityTo(CallAnApi);
      return api.getLastResponse<UserProfileRecord>().body?.email;
    });
  }

  static theme(): Question<string | undefined> {
    return Question.about('the profile theme preference', (actor: AnswersQuestions & UsesAbilities) => {
      const api = actor.abilityTo(CallAnApi);
      return api.getLastResponse<UserProfileRecord>().body?.preferences?.theme;
    });
  }

  static locale(): Question<string | undefined> {
    return Question.about('the profile locale preference', (actor: AnswersQuestions & UsesAbilities) => {
      const api = actor.abilityTo(CallAnApi);
      return api.getLastResponse<UserProfileRecord>().body?.preferences?.locale;
    });
  }

  static emailNotifications(): Question<boolean | undefined> {
    return Question.about('the profile email notifications preference', (actor: AnswersQuestions & UsesAbilities) => {
      const api = actor.abilityTo(CallAnApi);
      return api.getLastResponse<UserProfileRecord>().body?.preferences?.email_notifications;
    });
  }
}
