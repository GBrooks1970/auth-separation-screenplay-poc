import { createServer, IncomingMessage, ServerResponse, Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { EventBus, globalEventBus } from '../eventbus/EventBus.js';
import { renderSwaggerUiHtml } from '../swagger/swaggerHtml.js';
import type { UserRole, ActionVerb, ResourceName } from '../types.js';

export class AuthZService {
  private server: Server | null = null;
  private userRoles = new Map<string, { roles: UserRole[]; permissions: string[] }>([
    [
      'usr_alice_123',
      {
        roles: ['SecurityAdmin'],
        permissions: ['UserRole:UPDATE', 'UserRole:CREATE', 'SecurityPolicy:READ', 'SecurityPolicy:UPDATE', 'UserProfile:READ', 'UserProfile:UPDATE']
      }
    ],
    [
      'usr_bob_456',
      {
        roles: ['StandardUser'],
        permissions: ['UserProfile:READ', 'UserProfile:UPDATE']
      }
    ],
    [
      'usr_charlie_789',
      {
        roles: ['Guest'],
        permissions: ['UserProfile:READ']
      }
    ]
  ]);

  constructor(
    private port: number = 3002,
    private eventBus: EventBus = globalEventBus
  ) {}

  private parseBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk) => (data += chunk));
      req.on('end', () => {
        if (!data) return resolve({});
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({});
        }
      });
      req.on('error', reject);
    });
  }

  private sendJson(res: ServerResponse, statusCode: number, payload: any): void {
    const body = JSON.stringify(payload);
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(body);
  }

  private evaluatePolicy(
    userId: string,
    role: UserRole,
    action: ActionVerb,
    resource: ResourceName,
    resourceOwnerId?: string
  ): { permitted: boolean; reason: string } {
    // 1. SecurityAdmin role
    if (role === 'SecurityAdmin') {
      return {
        permitted: true,
        reason: `SecurityAdmin role has full ${action} grant on ${resource}`
      };
    }

    // 2. StandardUser role
    if (role === 'StandardUser') {
      if (resource === 'SecurityPolicy' || resource === 'UserRole') {
        return {
          permitted: false,
          reason: `StandardUser lacks ${action} grant on restricted resource ${resource}`
        };
      }

      if (resource === 'UserProfile') {
        if (action === 'READ') {
          return { permitted: true, reason: 'StandardUser has READ grant on UserProfile' };
        }
        if (action === 'UPDATE' || action === 'DELETE') {
          if (resourceOwnerId && resourceOwnerId !== userId) {
            return {
              permitted: false,
              reason: `StandardUser cannot modify profile owned by another user (${resourceOwnerId})`
            };
          }
          return {
            permitted: true,
            reason: `StandardUser is permitted to ${action} own profile`
          };
        }
      }
    }

    // 3. Guest role
    if (role === 'Guest') {
      if (action === 'READ' && resource === 'UserProfile') {
        return { permitted: true, reason: 'Guest has READ grant on public UserProfile' };
      }
      return {
        permitted: false,
        reason: `Guest role cannot perform ${action} on ${resource}`
      };
    }

    return {
      permitted: false,
      reason: `Default deny: no matching policy rule for role ${role} attempting ${action} on ${resource}`
    };
  }

  async start(): Promise<number> {
    return new Promise((resolve) => {
      this.server = createServer(async (req, res) => {
        const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        const path = url.pathname;
        const method = req.method || 'GET';

        if (method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          });
          return res.end();
        }

        // 1. Swagger UI documentation endpoint
        if (path === '/docs' && method === 'GET') {
          const specContent = readFileSync(join(process.cwd(), 'specs', 'authz-api_v1.yaml'), 'utf-8');
          const html = renderSwaggerUiHtml('Authorisation API (AuthZ)', specContent);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          return res.end(html);
        }

        // 2. Check Permission endpoint
        if (path === '/authz/check-permission' && method === 'POST') {
          const body = await this.parseBody(req);
          if (!body.user_id || !body.role || !body.action || !body.resource) {
            return this.sendJson(res, 400, {
              error: 'Validation failed',
              details: [
                {
                  field: !body.user_id ? 'user_id' : !body.role ? 'role' : !body.action ? 'action' : 'resource',
                  message: 'Required field is missing'
                }
              ]
            });
          }

          const { permitted, reason } = this.evaluatePolicy(
            body.user_id,
            body.role,
            body.action,
            body.resource,
            body.resource_owner_id
          );

          const decision = permitted ? 'PERMITTED' : 'DENIED';
          const evaluatedAt = new Date().toISOString();

          // Broadcast audit event
          this.eventBus.publish('authz.events', 'AccessDecisionLogged', {
            event_id: `evt_authz_${Date.now()}`,
            user_id: body.user_id,
            role: body.role,
            action: body.action,
            resource: body.resource,
            decision,
            timestamp: evaluatedAt
          });

          const statusCode = permitted ? 200 : 403;
          return this.sendJson(res, statusCode, {
            decision,
            user_id: body.user_id,
            action: body.action,
            resource: body.resource,
            reason,
            evaluated_at: evaluatedAt
          });
        }

        // 3. User Roles query endpoint
        const rolesMatch = path.match(/^\/authz\/roles\/([^/]+)$/);
        if (rolesMatch && method === 'GET') {
          const userId = decodeURIComponent(rolesMatch[1]);
          const mapping = this.userRoles.get(userId);

          if (!mapping) {
            return this.sendJson(res, 404, {
              code: 'NOT_FOUND',
              message: `No role assignment found for user ID ${userId}`
            });
          }

          return this.sendJson(res, 200, {
            user_id: userId,
            roles: mapping.roles,
            permissions: mapping.permissions
          });
        }

        // 4. Permissions Catalog endpoint
        if (path === '/authz/permissions' && method === 'GET') {
          return this.sendJson(res, 200, {
            roles: ['SecurityAdmin', 'StandardUser', 'Auditor', 'Guest'],
            actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
            resources: ['UserRole', 'SecurityPolicy', 'UserProfile', 'AuditLog']
          });
        }

        this.sendJson(res, 404, { code: 'NOT_FOUND', message: 'Endpoint not found' });
      });

      this.server.listen(this.port, () => {
        resolve(this.port);
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
