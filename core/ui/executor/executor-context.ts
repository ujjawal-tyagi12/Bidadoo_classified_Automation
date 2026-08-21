import { AsyncLocalStorage } from "node:async_hooks";
import { getLogger } from "@core/logger/log-context.js";
import { ActionExecutor } from "./action-executor.js";

const storage = new AsyncLocalStorage<ActionExecutor>();


let boundExecutor: ActionExecutor | undefined;

export function bindExecutor(executor: ActionExecutor | undefined): void {
  boundExecutor = executor;
}

export function runWithExecutor<T>(
  executor: ActionExecutor,
  fn: () => Promise<T>,
): Promise<T> {
  return storage.run(executor, fn);
}


export function getExecutor(): ActionExecutor {
  return (
    storage.getStore() ??
    boundExecutor ??
    new ActionExecutor(getLogger())
  );
}
