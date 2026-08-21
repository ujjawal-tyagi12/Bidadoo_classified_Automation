/**
 * Re-exports for framework consumers.
 *
 * Usage:
 * import { baseTest } from "@core/test";
 */

export { baseTest } from "./fixtures/base.fixture.js";
export type { ScenarioState } from "./fixtures/shared.state.fixture.js";

export {
  SessionManager,
  UserSession,
  SessionSharedStateImpl,
  type SessionSharedState,
  type SessionManagerOptions,
  DuplicateSessionError,
  SessionNotFoundError,
  SessionNotLaunchedError,
} from "./sessions/index.js";

export { withIsolation, type TestIsolationHandlers } from "./test-isolation/index.js";
