import { Actor, Stage, Cast } from 'hand-baked-screenplay-pattern';
import { CallAnApi } from '../screenplay/abilities/CallAnApi.js';
import { ReceiveEvents } from '../screenplay/abilities/ReceiveEvents.js';
import { HoldTokens } from '../screenplay/abilities/HoldTokens.js';
import { globalEventBus } from '../sut/eventbus/EventBus.js';
import { createSutCluster, type SutCluster } from '../sut/server.js';

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
  public sut: SutCluster;
  private currentActorName: string = 'Alice';

  private constructor() {
    this.stage = new Stage(new AuthTestCast());
    this.sut = createSutCluster(3001, 3002, 3003, globalEventBus);
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

  reset(): void {
    globalEventBus.clear();
    this.sut.authn.reset();
    this.sut.userinfo.reset();
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
