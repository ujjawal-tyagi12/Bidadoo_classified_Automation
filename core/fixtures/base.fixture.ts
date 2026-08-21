import { stateFixture, type ScenarioState } from "./shared.state.fixture.js";
import { type LoggerFixture, loggerTest } from "./logger.fixture.js";


export const baseTest = loggerTest.extend<{
  state: ScenarioState;
} & LoggerFixture>({
  ...stateFixture,
});
