import { Task, type ActivityActor } from 'hand-baked-screenplay-pattern';
import { CallAnApi } from '../abilities/CallAnApi.js';
import { HoldTokens } from '../abilities/HoldTokens.js';

export class RetrieveProfile extends Task {
  static forUser(userId: string, unauthenticated: boolean = false): RetrieveProfile {
    return new RetrieveProfile(`retrieve profile for user "${userId}"`, userId, unauthenticated);
  }

  constructor(
    description: string,
    private readonly userId: string,
    private readonly unauthenticated: boolean
  ) {
    super(description);
  }

  async performAs(actor: ActivityActor): Promise<void> {
    const api = actor.abilityTo(CallAnApi);
    const tokens = actor.abilityTo(HoldTokens);

    const headers: Record<string, string> = {};
    if (!this.unauthenticated && tokens.token) {
      headers.Authorization = `Bearer ${tokens.token}`;
    }

    await api.sendRequest('GET', `http://localhost:3003/profiles/${encodeURIComponent(this.userId)}`, undefined, headers);
  }
}

export class ReplaceProfile extends Task {
  static withDetails(userId: string, name: string, email: string, theme: 'light' | 'dark' | 'system'): ReplaceProfile {
    return new ReplaceProfile(`replace profile for "${userId}" with name "${name}"`, userId, { name, email, theme });
  }

  static withRawPayload(userId: string, payload: any): ReplaceProfile {
    return new ReplaceProfile(`replace profile for "${userId}" with custom payload`, userId, payload);
  }

  constructor(
    description: string,
    private readonly userId: string,
    private readonly payload: any
  ) {
    super(description);
  }

  async performAs(actor: ActivityActor): Promise<void> {
    const api = actor.abilityTo(CallAnApi);
    const tokens = actor.abilityTo(HoldTokens);

    const headers: Record<string, string> = {};
    if (tokens.token) {
      headers.Authorization = `Bearer ${tokens.token}`;
    }

    await api.sendRequest('PUT', `http://localhost:3003/profiles/${encodeURIComponent(this.userId)}`, this.payload, headers);
  }
}

export class PatchProfile extends Task {
  static withPreferences(userId: string, theme: 'light' | 'dark' | 'system', emailNotifications: boolean): PatchProfile {
    return new PatchProfile(`patch profile preferences for "${userId}"`, userId, {
      preferences: { theme, email_notifications: emailNotifications }
    });
  }

  constructor(
    description: string,
    private readonly userId: string,
    private readonly patchPayload: any
  ) {
    super(description);
  }

  async performAs(actor: ActivityActor): Promise<void> {
    const api = actor.abilityTo(CallAnApi);
    const tokens = actor.abilityTo(HoldTokens);

    const headers: Record<string, string> = {};
    if (tokens.token) {
      headers.Authorization = `Bearer ${tokens.token}`;
    }

    await api.sendRequest('PATCH', `http://localhost:3003/profiles/${encodeURIComponent(this.userId)}`, this.patchPayload, headers);
  }
}

export class DeleteProfile extends Task {
  static forUser(userId: string): DeleteProfile {
    return new DeleteProfile(`delete profile for "${userId}"`, userId);
  }

  constructor(
    description: string,
    private readonly userId: string
  ) {
    super(description);
  }

  async performAs(actor: ActivityActor): Promise<void> {
    const api = actor.abilityTo(CallAnApi);
    const tokens = actor.abilityTo(HoldTokens);

    const headers: Record<string, string> = {};
    if (tokens.token) {
      headers.Authorization = `Bearer ${tokens.token}`;
    }

    await api.sendRequest('DELETE', `http://localhost:3003/profiles/${encodeURIComponent(this.userId)}`, undefined, headers);
  }
}

export class DiscoverKeys extends Task {
  static fromJwks(): DiscoverKeys {
    return new DiscoverKeys('discover JWKS public verification keys');
  }

  constructor(description: string) {
    super(description);
  }

  async performAs(actor: ActivityActor): Promise<void> {
    const api = actor.abilityTo(CallAnApi);
    await api.sendRequest('GET', 'http://localhost:3001/.well-known/jwks.json');
  }
}
