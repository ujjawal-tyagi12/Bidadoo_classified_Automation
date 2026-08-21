import { runWithState } from "./state-context.js";

export type ScenarioState = {
  getSharedData: <T>(key: string) => T | undefined;
  setSharedData: <T>(key: string, data: T) => void;
  removeSharedData: (key: string) => void;
};

class ScenarioStateImpl implements ScenarioState {
  private readonly sharedData = new Map<string, unknown>();

  getSharedData<T>(key: string): T | undefined {
    return this.sharedData.get(key) as T | undefined;
  }

  setSharedData<T>(key: string, data: T): void {
    this.sharedData.set(key, data);
  }

  removeSharedData(key: string): void {
    this.sharedData.delete(key);
  }
}

export const stateFixture = {
  state: async ({}, use: (state: ScenarioState) => Promise<void>) => {
    const state = new ScenarioStateImpl();

    await runWithState(state, async () => {
      await use(state);
    });
  },
};


