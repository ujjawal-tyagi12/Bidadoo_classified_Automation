/**
 * Per-browser-context key/value bag (mirrors ScenarioState shape).
 * Cleared when the owning UserSession is disposed.
 */
export type SessionSharedState = {
  getSharedData: <T>(key: string) => T | undefined;
  setSharedData: <T>(key: string, data: T) => void;
  removeSharedData: (key: string) => void;
};

export class SessionSharedStateImpl implements SessionSharedState {
  private readonly data = new Map<string, unknown>();

  getSharedData<T>(key: string): T | undefined {
    return this.data.get(key) as T | undefined;
  }

  setSharedData<T>(key: string, data: T): void {
    this.data.set(key, data);
  }

  removeSharedData(key: string): void {
    this.data.delete(key);
  }

  /** @internal */
  clear(): void {
    this.data.clear();
  }
}
