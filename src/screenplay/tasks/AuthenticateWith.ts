import { Task, type ActivityActor } from 'hand-baked-screenplay-pattern';
import { CallAnApi } from '../abilities/CallAnApi.js';
import { HoldTokens } from '../abilities/HoldTokens.js';

export class AuthenticateWith extends Task {
  static credentials(username: string, password: string): AuthenticateWith {
    return new AuthenticateWith(`authenticate with username "${username}"`, username, password);
  }

  static emptyPassword(username: string): AuthenticateWith {
    return new AuthenticateWith(`authenticate with empty password for "${username}"`, username, '');
  }

  constructor(
    description: string,
    private readonly username: string,
    private readonly password: string
  ) {
    super(description);
  }

  async performAs(actor: ActivityActor): Promise<void> {
    const api = actor.abilityTo(CallAnApi);
    const body: Record<string, string> = { username: this.username };
    if (this.password !== '') {
      body.password = this.password;
    }

    const response = await api.sendRequest('POST', 'http://localhost:3001/auth/login', body);

    if (response.status === 200 && response.body?.token) {
      const tokens = actor.abilityTo(HoldTokens);
      tokens.set({
        token: response.body.token,
        refreshToken: response.body.refresh_token,
        userId: response.body.user_id,
        username: this.username
      });
    }
  }
}
