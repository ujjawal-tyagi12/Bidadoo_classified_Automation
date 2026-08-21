import type { ActionListener } from "@core/ui";

export const highlightListener: ActionListener = {
  before: async (_action, element) => {
    try {
      await element.locator.evaluate((node) => {
        const el = node as HTMLElement;
        el.dataset.pwPrevOutline = el.style.outline || "";
        el.style.outline = "2px solid #f59e0b";
      });
    } catch {
      // ignore
  
    }
  },
  after: async (_action, element) => {
    try {
      await element.locator.evaluate((node) => {
        const el = node as HTMLElement;
        el.style.outline = el.dataset.pwPrevOutline ?? "";
        delete el.dataset.pwPrevOutline;
      });
    } catch {
      // ignore
    }
  },
};

