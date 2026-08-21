import { AsyncLocalStorage } from "node:async_hooks";
import type { ScenarioState } from "./shared.state.fixture.js";

const storage = new AsyncLocalStorage<ScenarioState>();

export function runWithState<T>(state: ScenarioState, fn: () => Promise<T>): Promise<T> {
  return storage.run(state, fn);
}

export function getState(): ScenarioState | undefined {
  return storage.getStore();
}

