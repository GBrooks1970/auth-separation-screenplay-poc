import { Task, type ActivityActor } from 'hand-baked-screenplay-pattern';
import { CallAnApi } from '../abilities/CallAnApi.js';
import { HoldTokens } from '../abilities/HoldTokens.js';

export class TerminateSession extends Task {
  static viaLogout(): TerminateSession {
    return new TerminateSession('terminate session via logout');
  }

  constructor(description: string) {
    super(description);
  }

  async performAs(actor: ActivityActor): Promise<void> {
    const api = actor.abilityTo(CallAnApi);
    const tokens = actor.abilityTo(HoldTokens);

    const headers: Record<string, string> = {};
    if (tokens.token) {
      headers.Authorization = `Bearer ${tokens.token}`;
    }

    await api.sendRequest('POST', 'http://localhost:3001/auth/logout', { refresh_token: tokens.refreshToken }, headers);
  }
}

export class RefreshToken extends Task {
  static using(refreshToken: string): RefreshToken {
    return new RefreshToken(`refresh token using "${refreshToken}"`, refreshToken);
  }

  static currentSession(): RefreshToken {
    return new RefreshToken('refresh token using active session refresh token');
  }

  constructor(
    description: string,
    private readonly customRefreshToken?: string
  ) {
    super(description);
  }

  async performAs(actor: ActivityActor): Promise<void> {
    const api = actor.abilityTo(CallAnApi);
    const tokens = actor.abilityTo(HoldTokens);
    const rToken = this.customRefreshToken !== undefined ? this.customRefreshToken : tokens.refreshToken;

    const response = await api.sendRequest('POST', 'http://localhost:3001/auth/refresh', { refresh_token: rToken });
    if (response.status === 200 && response.body?.token) {
      tokens.set({
        token: response.body.token,
        refreshToken: response.body.refresh_token
      });
    }
  }
}
