import { createServer, IncomingMessage, ServerResponse, Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { EventBus, globalEventBus } from '../eventbus/EventBus.js';
import { renderSwaggerUiHtml } from '../swagger/swaggerHtml.js';
import type { UserProfileRecord } from '../types.js';

export class UserProfileService {
  private server: Server | null = null;
  private profiles = new Map<string, UserProfileRecord>([
    [
      'usr_alice_123',
      {
        user_id: 'usr_alice_123',
        name: 'Alice Smith',
        email: 'alice@example.com',
        avatar_url: 'https://avatars.example.com/alice.png',
        phone_number: '+44 20 7946 0912',
        preferences: {
          locale: 'en-GB',
          theme: 'dark',
          email_notifications: true
        },
        created_at: '2026-01-15T09:00:00Z',
        updated_at: '2026-08-18T10:00:00Z'
      }
    ],
    [
      'usr_bob_456',
      {
        user_id: 'usr_bob_456',
        name: 'Bob Jones',
        email: 'bob@example.com',
        avatar_url: 'https://avatars.example.com/bob.png',
        preferences: {
          locale: 'en-GB',
          theme: 'light',
          email_notifications: true
        },
        created_at: '2026-02-10T11:00:00Z',
        updated_at: '2026-08-18T10:00:00Z'
      }
    ]
  ]);

  constructor(
    private port: number = 3003,
    private eventBus: EventBus = globalEventBus
  ) {}

  reset(): void {
    this.profiles = new Map<string, UserProfileRecord>([
      [
        'usr_alice_123',
        {
          user_id: 'usr_alice_123',
          name: 'Alice Smith',
          email: 'alice@example.com',
          avatar_url: 'https://avatars.example.com/alice.png',
          phone_number: '+44 20 7946 0912',
          preferences: {
            locale: 'en-GB',
            theme: 'dark',
            email_notifications: true
          },
          created_at: '2026-01-15T09:00:00Z',
          updated_at: '2026-08-18T10:00:00Z'
        }
      ],
      [
        'usr_bob_456',
        {
          user_id: 'usr_bob_456',
          name: 'Bob Jones',
          email: 'bob@example.com',
          avatar_url: 'https://avatars.example.com/bob.png',
          preferences: {
            locale: 'en-GB',
            theme: 'light',
            email_notifications: true
          },
          created_at: '2026-02-10T11:00:00Z',
          updated_at: '2026-08-18T10:00:00Z'
        }
      ]
    ]);
  }

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
          const specContent = readFileSync(join(process.cwd(), 'specs', 'userinfo-api_v1.yaml'), 'utf-8');
          const html = renderSwaggerUiHtml('User Profile API', specContent);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          return res.end(html);
        }

        // 2. Profile endpoints: /profiles/:user_id
        const profileMatch = path.match(/^\/profiles\/([^/]+)$/);
        if (profileMatch) {
          const userId = decodeURIComponent(profileMatch[1]);
          const authHeader = req.headers.authorization;

          // Check token presence (simulating auth gateway / downstream check)
          if (!authHeader && !req.headers['x-bypass-auth']) {
            return this.sendJson(res, 401, {
              code: 'UNAUTHENTICATED',
              message: 'Authentication token is required to access user profile'
            });
          }

          // GET /profiles/:user_id
          if (method === 'GET') {
            const profile = this.profiles.get(userId);
            if (!profile) {
              return this.sendJson(res, 404, {
                code: 'PROFILE_NOT_FOUND',
                message: `The requested profile for user ID ${userId} could not be found`
              });
            }
            return this.sendJson(res, 200, profile);
          }

          // PUT /profiles/:user_id
          if (method === 'PUT') {
            const body = await this.parseBody(req);
            if (body.email && !body.email.includes('@')) {
              return this.sendJson(res, 400, {
                error: 'Validation failed',
                details: [{ field: 'email', message: 'Value is not a valid email address' }]
              });
            }

            const existing = this.profiles.get(userId);
            const updatedProfile: UserProfileRecord = {
              user_id: userId,
              name: body.name || existing?.name || '',
              email: body.email || existing?.email || '',
              avatar_url: body.avatar_url || existing?.avatar_url,
              phone_number: body.phone_number || existing?.phone_number,
              preferences: {
                locale: body.preferences?.locale || existing?.preferences?.locale || 'en-GB',
                theme: body.preferences?.theme || body.theme || existing?.preferences?.theme || 'dark',
                email_notifications:
                  body.preferences?.email_notifications !== undefined
                    ? body.preferences.email_notifications
                    : existing?.preferences?.email_notifications ?? true
              },
              created_at: existing?.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            this.profiles.set(userId, updatedProfile);

            this.eventBus.publish('userinfo.events', 'ProfileUpdated', {
              event_id: `evt_prof_${Date.now()}`,
              user_id: userId,
              updated_fields: Object.keys(body),
              timestamp: updatedProfile.updated_at
            });

            return this.sendJson(res, 200, updatedProfile);
          }

          // PATCH /profiles/:user_id
          if (method === 'PATCH') {
            const body = await this.parseBody(req);
            if (body.email && !body.email.includes('@')) {
              return this.sendJson(res, 400, {
                error: 'Validation failed',
                details: [{ field: 'email', message: 'Value is not a valid email address' }]
              });
            }

            const existing = this.profiles.get(userId);
            if (!existing) {
              return this.sendJson(res, 404, {
                code: 'PROFILE_NOT_FOUND',
                message: `Profile ${userId} not found`
              });
            }

            const patchedProfile: UserProfileRecord = {
              ...existing,
              name: body.name !== undefined ? body.name : existing.name,
              email: body.email !== undefined ? body.email : existing.email,
              avatar_url: body.avatar_url !== undefined ? body.avatar_url : existing.avatar_url,
              phone_number: body.phone_number !== undefined ? body.phone_number : existing.phone_number,
              preferences: {
                locale: body.preferences?.locale || existing.preferences.locale,
                theme: body.preferences?.theme || body.theme || existing.preferences.theme,
                email_notifications:
                  body.preferences?.email_notifications !== undefined
                    ? body.preferences.email_notifications
                    : body.email_notifications !== undefined
                    ? body.email_notifications
                    : existing.preferences.email_notifications
              },
              updated_at: new Date().toISOString()
            };

            this.profiles.set(userId, patchedProfile);

            this.eventBus.publish('userinfo.events', 'ProfileUpdated', {
              event_id: `evt_prof_${Date.now()}`,
              user_id: userId,
              updated_fields: Object.keys(body),
              timestamp: patchedProfile.updated_at
            });

            return this.sendJson(res, 200, patchedProfile);
          }

          // DELETE /profiles/:user_id
          if (method === 'DELETE') {
            const existed = this.profiles.delete(userId);
            if (!existed) {
              return this.sendJson(res, 404, {
                code: 'PROFILE_NOT_FOUND',
                message: `Profile ${userId} not found`
              });
            }

            this.eventBus.publish('userinfo.events', 'ProfileDeleted', {
              event_id: `evt_prof_${Date.now()}`,
              user_id: userId,
              timestamp: new Date().toISOString()
            });

            res.writeHead(204);
            return res.end();
          }
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
