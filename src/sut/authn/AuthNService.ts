import { createServer, IncomingMessage, ServerResponse, Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createSign, createVerify, generateKeyPairSync } from 'node:crypto';
import { EventBus, globalEventBus } from '../eventbus/EventBus.js';
import { renderSwaggerUiHtml } from '../swagger/swaggerHtml.js';

// Generate in-memory RSA keypair for JWT signing
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const KEY_ID = 'auth-key-2026-01';

export class AuthNService {
  private server: Server | null = null;
  private revokedTokens = new Set<string>();
  private activeRefreshTokens = new Map<string, { userId: string; username: string }>();
  private users = new Map<string, { userId: string; username: string; password: string }>([
    ['alice@example.com', { userId: 'usr_alice_123', username: 'alice@example.com', password: 'Password123!' }],
    ['bob@example.com', { userId: 'usr_bob_456', username: 'bob@example.com', password: 'Password123!' }]
  ]);

  constructor(
    private port: number = 3001,
    private eventBus: EventBus = globalEventBus
  ) {
    // Seed initial active refresh tokens for test actors
    this.activeRefreshTokens.set('rfr_alice_valid_001', { userId: 'usr_alice_123', username: 'alice@example.com' });
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

  private signJwt(payload: Record<string, any>, expiresInSeconds: number = 3600): string {
    const header = { alg: 'RS256', typ: 'JWT', kid: KEY_ID };
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + expiresInSeconds;
    const body = { ...payload, iat, exp, iss: 'https://authn.example.internal/v1' };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedBody = Buffer.from(JSON.stringify(body)).toString('base64url');
    const dataToSign = `${encodedHeader}.${encodedBody}`;

    const signer = createSign('RSA-SHA256');
    signer.update(dataToSign);
    const signature = signer.sign(privateKey, 'base64url');

    return `${dataToSign}.${signature}`;
  }

  private verifyJwt(token: string): { valid: boolean; payload?: any; reason?: string } {
    if (this.revokedTokens.has(token)) {
      return { valid: false, reason: 'REVOKED' };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, reason: 'MALFORMED' };
    }

    const [headerB64, bodyB64, signatureB64] = parts;
    const dataToVerify = `${headerB64}.${bodyB64}`;

    try {
      const verifier = createVerify('RSA-SHA256');
      verifier.update(dataToVerify);
      const isSignatureValid = verifier.verify(publicKey, Buffer.from(signatureB64, 'base64url'));
      if (!isSignatureValid) {
        return { valid: false, reason: 'INVALID_SIGNATURE' };
      }

      const body = JSON.parse(Buffer.from(bodyB64, 'base64url').toString('utf-8'));
      const now = Math.floor(Date.now() / 1000);
      if (body.exp && body.exp < now) {
        return { valid: false, payload: body, reason: 'EXPIRED' };
      }

      return { valid: true, payload: body };
    } catch {
      return { valid: false, reason: 'PARSE_ERROR' };
    }
  }

  reset(): void {
    this.revokedTokens.clear();
    this.activeRefreshTokens.clear();
    this.activeRefreshTokens.set('rfr_alice_valid_001', { userId: 'usr_alice_123', username: 'alice@example.com' });
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
          const specContent = readFileSync(join(process.cwd(), 'specs', 'authn-api_v1.yaml'), 'utf-8');
          const html = renderSwaggerUiHtml('Authentication API (AuthN)', specContent);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          return res.end(html);
        }

        // 2. JWKS endpoint
        if (path === '/.well-known/jwks.json' && method === 'GET') {
          return this.sendJson(res, 200, {
            keys: [
              {
                kty: 'RSA',
                use: 'sig',
                alg: 'RS256',
                kid: KEY_ID,
                n: Buffer.from('mock_rsa_modulus_2048').toString('base64url'),
                e: 'AQAB'
              }
            ]
          });
        }

        // 3. Login endpoint
        if (path === '/auth/login' && method === 'POST') {
          const body = await this.parseBody(req);
          if (!body.username || !body.password) {
            return this.sendJson(res, 400, {
              error: 'Validation failed',
              details: [
                {
                  field: !body.username ? 'username' : 'password',
                  message: !body.username ? 'Username is required' : 'Password is required'
                }
              ]
            });
          }

          const user = this.users.get(body.username);
          if (!user || user.password !== body.password) {
            this.eventBus.publish('authn.events', 'AuthenticationFailed', {
              event_id: `evt_authn_${Date.now()}`,
              username: body.username,
              reason: 'INVALID_CREDENTIALS',
              timestamp: new Date().toISOString()
            });

            return this.sendJson(res, 401, {
              code: 'INVALID_CREDENTIALS',
              message: 'The provided username or password is incorrect'
            });
          }

          const token = this.signJwt({ sub: user.userId, username: user.username });
          const refreshToken = `rfr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          this.activeRefreshTokens.set(refreshToken, { userId: user.userId, username: user.username });

          this.eventBus.publish('authn.events', 'UserAuthenticated', {
            event_id: `evt_authn_${Date.now()}`,
            user_id: user.userId,
            username: user.username,
            timestamp: new Date().toISOString()
          });

          return this.sendJson(res, 200, {
            token,
            refresh_token: refreshToken,
            token_type: 'Bearer',
            expires_in: 3600,
            user_id: user.userId
          });
        }

        // 4. Verify endpoint
        if (path === '/auth/verify' && method === 'POST') {
          const body = await this.parseBody(req);
          const rawToken = body.token || (req.headers.authorization ? req.headers.authorization.replace(/^Bearer /, '') : '');

          if (!rawToken) {
            return this.sendJson(res, 401, {
              code: 'INVALID_TOKEN',
              message: 'Token is required'
            });
          }

          const result = this.verifyJwt(rawToken);
          if (!result.valid) {
            const code = result.reason === 'EXPIRED' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
            return this.sendJson(res, 401, {
              code,
              message: result.reason === 'EXPIRED' ? 'Token has expired' : 'Invalid or revoked token'
            });
          }

          return this.sendJson(res, 200, {
            valid: true,
            user_id: result.payload.sub,
            username: result.payload.username,
            expires_at: new Date(result.payload.exp * 1000).toISOString()
          });
        }

        // 5. Refresh endpoint
        if (path === '/auth/refresh' && method === 'POST') {
          const body = await this.parseBody(req);
          const rToken = body.refresh_token;

          if (!rToken || !this.activeRefreshTokens.has(rToken)) {
            return this.sendJson(res, 401, {
              code: 'INVALID_REFRESH_TOKEN',
              message: 'Invalid or revoked refresh token'
            });
          }

          const session = this.activeRefreshTokens.get(rToken)!;
          this.activeRefreshTokens.delete(rToken);

          const newToken = this.signJwt({ sub: session.userId, username: session.username });
          const newRefreshToken = `rfr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          this.activeRefreshTokens.set(newRefreshToken, session);

          return this.sendJson(res, 200, {
            token: newToken,
            refresh_token: newRefreshToken,
            token_type: 'Bearer',
            expires_in: 3600
          });
        }

        // 6. Logout endpoint
        if (path === '/auth/logout' && method === 'POST') {
          const authHeader = req.headers.authorization;
          const body = await this.parseBody(req);
          const token = authHeader ? authHeader.replace(/^Bearer /, '') : body.token;
          const refreshToken = body.refresh_token;

          if (token) {
            this.revokedTokens.add(token);
          }
          if (refreshToken) {
            this.activeRefreshTokens.delete(refreshToken);
          }

          this.eventBus.publish('authn.events', 'SessionRevoked', {
            event_id: `evt_authn_${Date.now()}`,
            user_id: 'usr_alice_123',
            reason: 'USER_LOGOUT',
            timestamp: new Date().toISOString()
          });

          return this.sendJson(res, 200, {
            message: 'Session successfully terminated',
            revoked: true
          });
        }

        // Fallback 404
        this.sendJson(res, 404, { code: 'NOT_FOUND', message: 'Endpoint not found' });
      });

      this.server.listen(this.port, () => {
        resolve(this.port);
      });
    });
  }

  createExpiredJwt(userId: string, username: string): string {
    return this.signJwt({ sub: userId, username }, -3600);
  }

  createActiveJwt(userId: string, username: string): string {
    return this.signJwt({ sub: userId, username }, 3600);
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
