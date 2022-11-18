import { Application } from "spectron";
import { startApp, stopApp, setupElectronLogs, testSolutionPath, addSolution, clearSolutions } from "./hooks";
import path from "path";
import { TargetFrameworks, TestRunner } from "./testRunner";
import fs from "fs/promises";
import { SortingCheckRequest } from "./models/sortingCheckRequest";

describe("stability check, assess a solution, reassess the solution, check all solution tabs make sure loaded, check all projects for all solution, make sure loaded, check porting for all projects", () => {
  let app: Application;
  let runner: TestRunner;

  beforeAll(async () => {
    app = await startApp();
    runner = new TestRunner(app);
    await runner.setupTargetFramework(TargetFrameworks.net7);
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

  test("run through wcf on net 7.0", async () => {
    const solutionFolderPath: string = path.join(testSolutionPath(), "wcftcpselfhost");
    const solutionPath: string = path.join(solutionFolderPath, "WCFTCPSelfHost.sln");
    await addSolution(app, solutionPath);
    await app.client.refresh();
    const results = await runner.runThroughSolution(solutionPath, "inplace", TargetFrameworks.net7, false, false);
    await runner.validateHighLevelResults(results, ["0 of 3", "0 of 0", "14 of 46", "0", "(11)"]);
  });

  test("run through mvcmusicstore on net 7.0", async () => {
    const solutionFolderPath: string = path.join(testSolutionPath(), "mvcmusicstore", "sourceCode", "mvcmusicstore");
    const solutionPath: string = path.join(solutionFolderPath, "MvcMusicStore.sln");
    await addSolution(app, solutionPath);
    await app.client.refresh();
    const results = await runner.runThroughSolution(solutionPath, "inplace", TargetFrameworks.net7, false, false, {
      apis: {
        first: "td=ActionName",
        last: "td=ViewResult",
      },
      sourceFiles: {
        first: "=MvcMusicStore\\Controllers\\AccountController.cs",
        last: "=MvcMusicStore\\ViewModels\\ShoppingCartViewModel.cs",
      },
    } as SortingCheckRequest);
    await runner.validateHighLevelResults(results, ["0 of 1", "6 of 6", "50 of 85", "0", "(21)"]);
  });
});
