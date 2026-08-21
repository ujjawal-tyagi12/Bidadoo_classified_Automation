import type { Element } from "../element/element.js";

export type ActionListener = {
  before?: (action: string, element: Element) => void | Promise<void>;
  after?: (action: string, element: Element) => void | Promise<void>;
  error?: (action: string, element: Element, error: unknown) => void | Promise<void>;
};

class ActionListenerRegistry {
  private listeners: ActionListener[] = [];

  register(listener: ActionListener) {
    this.listeners.push(listener);
  }

  clear() {
    this.listeners = [];
  }

  async emitBefore(action: string, element: Element) {
    for (const l of this.listeners) await l.before?.(action, element);
  }

  async emitAfter(action: string, element: Element) {
    for (const l of this.listeners) await l.after?.(action, element);
  }

  async emitError(action: string, element: Element, error: unknown) {
    for (const l of this.listeners) await l.error?.(action, element, error);
  }
}

export const actionListeners = new ActionListenerRegistry();

