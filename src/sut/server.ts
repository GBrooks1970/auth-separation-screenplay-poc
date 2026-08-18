import { AuthNService } from './authn/AuthNService.js';
import { AuthZService } from './authz/AuthZService.js';
import { UserProfileService } from './userinfo/UserProfileService.js';
import { EventBus, globalEventBus } from './eventbus/EventBus.js';

export interface SutCluster {
  authn: AuthNService;
  authz: AuthZService;
  userinfo: UserProfileService;
  eventBus: EventBus;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export function createSutCluster(
  authnPort = 3001,
  authzPort = 3002,
  userinfoPort = 3003,
  eventBus = globalEventBus
): SutCluster {
  const authn = new AuthNService(authnPort, eventBus);
  const authz = new AuthZService(authzPort, eventBus);
  const userinfo = new UserProfileService(userinfoPort, eventBus);

  return {
    authn,
    authz,
    userinfo,
    eventBus,
    start: async () => {
      await Promise.all([authn.start(), authz.start(), userinfo.start()]);
      console.log(' [SUT] All Auth Separation reference services started:');
      console.log(`       - AuthN Service (port ${authnPort}):        http://localhost:${authnPort} (Swagger UI: /docs)`);
      console.log(`       - AuthZ Service (port ${authzPort}):        http://localhost:${authzPort} (Swagger UI: /docs)`);
      console.log(`       - User Profile Service (port ${userinfoPort}): http://localhost:${userinfoPort} (Swagger UI: /docs)`);
    },
    stop: async () => {
      await Promise.all([authn.stop(), authz.stop(), userinfo.stop()]);
      eventBus.clear();
      console.log(' [SUT] All reference services stopped.');
    }
  };
}

// Standalone CLI entrypoint
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  const cluster = createSutCluster();
  await cluster.start();

  const shutdown = async () => {
    console.log('\nShutting down SUT services...');
    await cluster.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
