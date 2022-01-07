import { Application } from "spectron";
import { startApp, stopApp, setupElectronLogs, testSolutionPath, addSolution, clearSolutions } from "./hooks";
import path from "path";
import { TestRunner } from "./testRunner";
import fs from "fs/promises";

describe("stability check, assess a solution, reassess the solution, check all solution tabs make sure loaded, check all projects for all solution, make sure loaded, check porting for all projects", () => {
  let app: Application;
  let runner: TestRunner;

  beforeAll(async () => {
    app = await startApp();
    runner = new TestRunner(app);
    await runner.selectProfile();
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
    const results = await runner.runThroughSolution(solutionPath, "inplace", "net6.0", false, false);
    await runner.validateHighLevelResults(results, ["0 of 3", "0 of 0", "14 of 46", "0", "(11)"]);
  });

  test("run through mvcmusicstore on net 6.0", async () => {
    const solutionFolderPath: string = path.join(testSolutionPath(), "mvcmusicstore", "sourceCode", "mvcmusicstore");
    const solutionPath: string = path.join(solutionFolderPath, "MvcMusicStore.sln");
    await addSolution(app, solutionPath);
    await app.client.refresh();
    const results = await runner.runThroughSolution(solutionPath, "inplace", "net6.0", false, false);
    await runner.validateHighLevelResults(results, ["0 of 1", "2 of 6", "59 of 85", "0", "(21)"]);
  });
});
