import { test } from "@playwright/test";
import type { TestLogger } from "@core/logger/test-logger.js";
import { getLogger } from "@core/logger/log-context";
import type { Element } from "../element/element.js";
import { actionListeners } from "../listeners/action-listeners.js";

type StepFn<T> = () => Promise<T>;

/**
 * Single executor for both element-bound actions and page-level steps.
 *
 * - `perform(action, element, fn)` — element-bound. Emits action listeners
 *   (before/after/error) so screenshots/tracing hooks can fire per element.
 * - `step(title, fn)` — page-level step (no listeners). Use for navigation,
 *   dialogs, frames, storage, page-level assertions.
 *
 * Both wrap `test.step` so they appear as collapsible groups in the
 * Playwright HTML report and trace viewer, and both log via the resolved
 * TestLogger.
 */
export class ActionExecutor {
  constructor(private readonly injectedLogger?: TestLogger) {}

  private resolveLogger(): TestLogger | undefined {
    return this.injectedLogger ?? getLogger();
  }

  async perform<T>(action: string, element: Element, fn: StepFn<T>): Promise<T> {
    const logger = this.resolveLogger();
    const stepTitle = `${action}: ${element.name}`;

    return await test.step(stepTitle, async () => {
      logger?.info(stepTitle);
      try {
        await actionListeners.emitBefore(action, element);
        return await fn();
      } catch (e) {
        logger?.error(`${stepTitle} failed`);
        await actionListeners.emitError(action, element, e);
        throw e;
      } finally {
        await actionListeners.emitAfter(action, element);
      }
    });
  }

  async step<T>(title: string, fn: StepFn<T>): Promise<T> {
    const logger = this.resolveLogger();
    return await test.step(title, async () => {
      logger?.info(title);
      try {
        return await fn();
      } catch (e) {
        logger?.error(`${title} failed`);
        throw e;
      }
    });
  }
}
