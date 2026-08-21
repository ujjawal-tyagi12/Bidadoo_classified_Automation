import type { Dialog, Page } from "@playwright/test";
import { ActionExecutor } from "../executor/action-executor.js";
import type { TestLogger } from "@core/logger/test-logger.js";


export class UIDialogs {
  private readonly exec: ActionExecutor;

  constructor(private readonly page: Page, logger?: TestLogger) {
    this.exec = new ActionExecutor(logger);
  }

  /**
   * Accept the next dialog triggered by `trigger`.
   * Returns the dialog message text.
   */
  async acceptNext(
    trigger: () => Promise<unknown>,
    options?: { promptText?: string; timeoutMs?: number },
  ): Promise<string> {
    return await this.exec.step("Accept dialog", async () => {
      const dialogPromise = this.page.waitForEvent("dialog", {
        timeout: options?.timeoutMs,
      });

      await trigger();
      const dialog = await dialogPromise;
      return await this.accept(dialog, options?.promptText);
    });
  }

  /**
   * Dismiss the next dialog triggered by `trigger`.
   * Returns the dialog message text.
   */
  async dismissNext(
    trigger: () => Promise<unknown>,
    options?: { timeoutMs?: number },
  ): Promise<string> {
    return await this.exec.step("Dismiss dialog", async () => {
      const dialogPromise = this.page.waitForEvent("dialog", {
        timeout: options?.timeoutMs,
      });

      await trigger();
      const dialog = await dialogPromise;
      return await this.dismiss(dialog);
    });
  }

  private async accept(dialog: Dialog, promptText?: string): Promise<string> {
    const message = dialog.message();
    await dialog.accept(promptText);
    return message;
  }

  private async dismiss(dialog: Dialog): Promise<string> {
    const message = dialog.message();
    await dialog.dismiss();
    return message;
  }
}

