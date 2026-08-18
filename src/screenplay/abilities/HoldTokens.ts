import { Ability } from 'hand-baked-screenplay-pattern';
import type { UserRole } from '../../sut/types.js';

export interface TokenState {
  token?: string;
  refreshToken?: string;
  userId?: string;
  username?: string;
  role?: UserRole;
}

export class HoldTokens extends Ability {
  private state: TokenState = {};

  static with(initialState: TokenState = {}): HoldTokens {
    const ability = new HoldTokens();
    ability.set(initialState);
    return ability;
  }

  set(newState: Partial<TokenState>): void {
    this.state = { ...this.state, ...newState };
  }

  get token(): string | undefined {
    return this.state.token;
  }

  get refreshToken(): string | undefined {
    return this.state.refreshToken;
  }

  get userId(): string | undefined {
    return this.state.userId;
  }

  get username(): string | undefined {
    return this.state.username;
  }

  get role(): UserRole | undefined {
    return this.state.role;
  }

  clear(): void {
    this.state = {};
  }
}
