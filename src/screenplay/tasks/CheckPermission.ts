import { Task, type ActivityActor } from 'hand-baked-screenplay-pattern';
import { CallAnApi } from '../abilities/CallAnApi.js';
import { HoldTokens } from '../abilities/HoldTokens.js';
import type { ActionVerb, ResourceName } from '../../sut/types.js';

export class CheckPermission extends Task {
  static forActionOnResource(action: ActionVerb, resource: ResourceName, resourceOwnerId?: string): CheckPermission {
    return new CheckPermission(`check permission for ${action} on ${resource}`, action, resource, resourceOwnerId);
  }

  static queryRoles(userId: string): CheckPermission {
    const task = new CheckPermission(`query assigned roles for user "${userId}"`, 'READ', 'UserRole');
    task.isRolesQuery = true;
    task.targetUserId = userId;
    return task;
  }

  private isRolesQuery: boolean = false;
  private targetUserId?: string;

  constructor(
    description: string,
    private readonly action: ActionVerb,
    private readonly resource: ResourceName,
    private readonly resourceOwnerId?: string
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

    if (this.isRolesQuery && this.targetUserId) {
      await api.sendRequest('GET', `http://localhost:3002/authz/roles/${encodeURIComponent(this.targetUserId)}`, undefined, headers);
      return;
    }

    const payload: Record<string, any> = {
      user_id: tokens.userId || 'usr_anonymous',
      role: tokens.role || 'StandardUser',
      action: this.action,
      resource: this.resource
    };

    if (this.resourceOwnerId) {
      payload.resource_owner_id = this.resourceOwnerId;
    }

    await api.sendRequest('POST', 'http://localhost:3002/authz/check-permission', payload, headers);
  }
}
