import { Application } from "spectron";
import {
  startApp,
  stopApp,
  setupElectronLogs,
  testSolutionPath,
  addSolution,
  clearSolutions,
} from "./hooks";
import path from "path";
import fs from "fs/promises";
import { TargetFrameworks, TestRunner } from "./testRunner";
import { SortingCheckRequest } from "./models/sortingCheckRequest";

describe("test without profile", () => {
  let app: Application;
  let runner: TestRunner;

  beforeAll(async () => {
    app = await startApp();
    runner = new TestRunner(app);
    await runner.setupTargetFramework(TargetFrameworks.net6);
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

  test("run through wcf on net 6.0", async () => {
    const solutionFolderPath: string = path.join(testSolutionPath(), "wcftcpselfhost");
    const solutionPath: string = path.join(solutionFolderPath, "WCFTCPSelfHost.sln");
    await addSolution(app, solutionPath);
    await app.client.refresh();
    const results = await runner.runThroughSolution(solutionPath, "inplace", TargetFrameworks.net6, false, false);
    await runner.validateHighLevelResults(results, ["0 of 3", "0 of 0", "14 of 46", "0", "(11)"]);
  });
});
