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
import { TestRunner } from "./testRunner";

describe("canary test suite", () => {
  let app: Application;
  let runner: TestRunner;

  beforeAll(async () => {
    app = await startApp();
    setupTelemetry(app);
    runner = new TestRunner(app);
    await app.client.pause(3000);
    await (await app.client.$("#start-btn")).click();
    var profileElement = await app.client.$("div=Current Profile: default");
    expect(profileElement).not.toBe(null);
    await app.client.debug();
    const removeProfileCheckbox = await app.client.$('[name="removeProfile"]');
    removeProfileCheckbox.click();
    await (await app.client.$("#next-btn")).click();
    await (
      await app.client.$("=Assess a new solution")
    ).waitForDisplayed({
      timeout: 60000,
    });

    const profile = await app.client.execute(
      `window.electron.getState("profile")`
    );
    const share = await app.client.execute(`window.electron.getState("share")`);
    console.log(profile);
    console.log(share);
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

  test("run through Miniblog", async () => {
    const solutionPath: string = path.join(
      testSolutionPath(),
      "canary",
      "Miniblog.Core-master",
      "Miniblog.Core.sln"
    );
    await addSolution(app, solutionPath);
    await app.client.refresh();
  });
});
