/**
 * Shared domain models, DTOs, and event types for the reference SUT services.
 * All models map directly to OpenAPI 3.1 and AsyncAPI 3.0 contract specifications in specs/.
 */

export interface AuthNUser {
  userId: string;
  username: string;
  passwordHash: string;
  active: boolean;
}

export interface AuthNSession {
  sessionId: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  revoked: boolean;
}

export type UserRole = 'SecurityAdmin' | 'StandardUser' | 'Auditor' | 'Guest';
export type ActionVerb = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
export type ResourceName = 'UserRole' | 'SecurityPolicy' | 'UserProfile' | 'AuditLog' | string;
export type DecisionOutcome = 'PERMITTED' | 'DENIED';

export interface UserPreferences {
  locale: string;
  theme: 'light' | 'dark' | 'system';
  email_notifications: boolean;
}

export interface UserProfileRecord {
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  phone_number?: string;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface DomainEvent<T = Record<string, unknown>> {
  channel: 'authn.events' | 'authz.events' | 'userinfo.events' | 'audit.events';
  name: string;
  payload: T;
  timestamp: string;
}
