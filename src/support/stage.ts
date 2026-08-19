import { Actor, Stage, Cast } from 'hand-baked-screenplay-pattern';
import { CallAnApi } from '../screenplay/abilities/CallAnApi.js';
import { ReceiveEvents } from '../screenplay/abilities/ReceiveEvents.js';
import { HoldTokens } from '../screenplay/abilities/HoldTokens.js';
import { globalEventBus } from '../sut/eventbus/EventBus.js';
import { createSutCluster } from '../sut/server.js';
import { createPolyglotCluster } from './polyglotLauncher.js';
import { AuthNService } from '../sut/authn/AuthNService.js';

export interface GenericSutCluster {
  authn: AuthNService;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  reset: () => Promise<void> | void;
}

class AuthTestCast implements Cast {
  prepare(actor: Actor): Actor {
    return actor.whoCan(
      CallAnApi.at('http://localhost:3001'),
      ReceiveEvents.from(globalEventBus),
      HoldTokens.with()
    );
  }
}

export class TestStageManager {
  private static instance: TestStageManager;
  public stage: Stage;
  public sut: GenericSutCluster;
  private currentActorName: string = 'Alice';

  private constructor() {
    this.stage = new Stage(new AuthTestCast());
    const isPolyglot = process.env.SUT_TARGET === 'polyglot';
    this.sut = isPolyglot
      ? createPolyglotCluster(3001, 3002, 3003, globalEventBus)
      : createSutCluster(3001, 3002, 3003, globalEventBus);
  }

  static getInstance(): TestStageManager {
    if (!TestStageManager.instance) {
      TestStageManager.instance = new TestStageManager();
    }
    return TestStageManager.instance;
  }

  actorNamed(name: string): Actor {
    this.currentActorName = name;
    return this.stage.actor(name);
  }

  theActorInTheSpotlight(): Actor {
    return this.stage.actor(this.currentActorName);
  }

  async reset(): Promise<void> {
    globalEventBus.clear();
    await this.sut.reset();

    // Default tokens and role initialization per actor name
    const alice = this.actorNamed('Alice');
    alice.abilityTo(HoldTokens).set({ userId: 'usr_alice_123', username: 'alice@example.com', role: 'SecurityAdmin' });

    const bob = this.actorNamed('Bob');
    bob.abilityTo(HoldTokens).set({ userId: 'usr_bob_456', username: 'bob@example.com', role: 'StandardUser' });

    const charlie = this.actorNamed('Charlie');
    charlie.abilityTo(HoldTokens).set({ userId: 'usr_charlie_789', username: 'charlie@example.com', role: 'Guest' });
  }
}

export const stageManager = TestStageManager.getInstance();
