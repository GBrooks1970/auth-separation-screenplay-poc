import { Task, type ActivityActor } from 'hand-baked-screenplay-pattern';
import { CallAnApi } from '../abilities/CallAnApi.js';
import { HoldTokens } from '../abilities/HoldTokens.js';

export class VerifyToken extends Task {
  static currentToken(): VerifyToken {
    return new VerifyToken('verify current active token');
  }

  static withToken(token: string): VerifyToken {
    return new VerifyToken(`verify token "${token.substring(0, 10)}..."`, token);
  }

  constructor(
    description: string,
    private readonly customToken?: string
  ) {
    super(description);
  }

  async performAs(actor: ActivityActor): Promise<void> {
    const api = actor.abilityTo(CallAnApi);
    const tokens = actor.abilityTo(HoldTokens);
    const token = this.customToken !== undefined ? this.customToken : tokens.token;

    await api.sendRequest('POST', 'http://localhost:3001/auth/verify', { token });
  }
}
