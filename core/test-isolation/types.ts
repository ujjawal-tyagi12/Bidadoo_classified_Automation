/**
 * Optional hooks around each test. Defaults are no-ops — pass real handlers from product test support when needed.
 */
export type TestIsolationHandlers = {
  beforeScenario?: () => Promise<void>;
  afterScenario?: () => Promise<void>;
};
