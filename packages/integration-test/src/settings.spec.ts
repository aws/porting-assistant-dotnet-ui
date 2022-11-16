import { Application } from "spectron";
import {
  startApp,
  stopApp,
  setupElectronLogs,
  testSolutionPath,
  addSolution,
  clearSolutions,
  setupTelemetry,
} from "./hooks";
import path from "path";
import fs from "fs/promises";
import { TargetFrameworks, TestRunner } from "./testRunner";

describe("Settings Test Suite", () => {
  let app: Application;
  let runner: TestRunner;

  beforeAll(async () => {
    app = await startApp();
    setupTelemetry(app);
    runner = new TestRunner(app);
    return app;
  });

  beforeEach(async () => {
    await app.client.refresh();
  });

  afterEach(async () => {
    setupElectronLogs(app);
    await clearSolutions(app);
    await app.client.pause(1000);
    await app.client.refresh();
  });

  afterAll(async () => {
    await app.client.execute("window.test.clearState();");
    await stopApp(app);
  });

  test("validate target frameworks", async () => {
    await runner.app.client.pause(3000);
    await (await runner.app.client.$("#start-btn")).click();
    await (await runner.app.client.$("#targetFramework-selection")).click();
    runner.validateComponentExists(`[title="${TargetFrameworks.net6}"`);
    runner.validateComponentExists(`[title="${TargetFrameworks.net5}"`);
    runner.validateComponentExists(`[title="${TargetFrameworks.netcore31}"`);
    runner.validateComponentExists(`[title="${TargetFrameworks.net7}"`);
  });
});

