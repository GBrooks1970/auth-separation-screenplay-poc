import { spawn, ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { AuthNService } from '../sut/authn/AuthNService.js';
import { EventBus, globalEventBus } from '../sut/eventbus/EventBus.js';

export interface PolyglotCluster {
  authn: AuthNService;
  eventBus: EventBus;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  reset: () => Promise<void>;
}

async function waitForPort(url: string, timeoutMs: number = 25000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) {
        return true;
      }
    } catch {
      // Retry
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

export function createPolyglotCluster(
  authnPort = 3001,
  authzPort = 3002,
  userinfoPort = 3003,
  eventBus = globalEventBus
): PolyglotCluster {
  const authn = new AuthNService(authnPort, eventBus);
  let pythonProcess: ChildProcess | null = null;
  let dotnetProcess: ChildProcess | null = null;

  return {
    authn,
    eventBus,
    start: async () => {
      // 1. Start Node.js AuthN service
      await authn.start();

      // 2. Spawn Python FastAPI AuthZ service on port 3002
      const pythonCwd = join(process.cwd(), 'sut-polyglot', 'python-authz');
      pythonProcess = spawn('python', ['-m', 'uvicorn', 'app.main:app', '--port', String(authzPort)], {
        cwd: pythonCwd,
        stdio: 'pipe',
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });

      // 3. Spawn C# ASP.NET Core User Profile service on port 3003
      const dotnetCwd = join(process.cwd(), 'sut-polyglot', 'dotnet-userinfo');
      const dllPath = join(dotnetCwd, 'bin', 'Debug', 'net9.0', 'UserProfileService.dll');
      const dotnetArgs = existsSync(dllPath)
        ? [dllPath, '--urls', `http://localhost:${userinfoPort}`]
        : ['run', '--project', dotnetCwd, '--urls', `http://localhost:${userinfoPort}`];

      dotnetProcess = spawn('dotnet', dotnetArgs, {
        cwd: dotnetCwd,
        stdio: 'pipe',
        env: { ...process.env, ASPNETCORE_ENVIRONMENT: 'Development' }
      });

      // 4. Wait for all services to become ready
      const [authzReady, userinfoReady] = await Promise.all([
        waitForPort(`http://localhost:${authzPort}/docs`),
        waitForPort(`http://localhost:${userinfoPort}/docs`)
      ]);

      if (!authzReady) {
        throw new Error(`[PolyglotLauncher] Python FastAPI AuthZ service failed to start on port ${authzPort}`);
      }
      if (!userinfoReady) {
        throw new Error(`[PolyglotLauncher] .NET ASP.NET Core User Profile service failed to start on port ${userinfoPort}`);
      }

      console.log(' [SUT-Polyglot] Multi-stack cluster started:');
      console.log(`       - AuthN (Node.js) on port ${authnPort}:       http://localhost:${authnPort} (Swagger UI: /docs)`);
      console.log(`       - AuthZ (Python FastAPI) on port ${authzPort}: http://localhost:${authzPort} (Swagger UI: /docs)`);
      console.log(`       - UserProfile (C# .NET 9) on port ${userinfoPort}: http://localhost:${userinfoPort} (Swagger UI: /docs)`);
    },
    stop: async () => {
      await authn.stop();
      if (pythonProcess) {
        pythonProcess.kill('SIGTERM');
        pythonProcess = null;
      }
      if (dotnetProcess) {
        dotnetProcess.kill('SIGTERM');
        dotnetProcess = null;
      }
      eventBus.clear();
      console.log(' [SUT-Polyglot] All multi-stack services stopped.');
    },
    reset: async () => {
      eventBus.clear();
      authn.reset();

      // Reset state on Python and .NET microservices via HTTP /internal/reset
      await Promise.all([
        fetch(`http://localhost:${authzPort}/internal/reset`, { method: 'POST' }).catch(() => {}),
        fetch(`http://localhost:${userinfoPort}/internal/reset`, { method: 'POST' }).catch(() => {})
      ]);
    }
  };
}
