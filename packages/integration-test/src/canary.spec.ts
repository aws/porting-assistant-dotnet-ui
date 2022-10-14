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
import { TestRunner } from "./testRunner";

describe("canary test suite", () => {
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

  test("run through Miniblog", async () => {
    const solutionPath: string = path.join(testSolutionPath(), "canary", "Miniblog.Core-master", "Miniblog.Core.sln");
    await addSolution(app, solutionPath);
    await app.client.refresh();
    const results = await runner.runThroughSolution(solutionPath, "inplace", "net6.0", false, false);
    await runner.validateHighLevelResults(results, ["1 of 1", "2 of 13", "12 of 268", "0", "(21)"]);
  });

  test("run through mvcmusicstore", async () => {
    const solutionFolderPath: string = path.join(
      testSolutionPath(),
      "canary",
      "mvcmusicstore",
      "sourceCode",
      "mvcmusicstore"
    );
    const solutionPath: string = path.join(solutionFolderPath, "MvcMusicStore.sln");
    await addSolution(app, solutionPath);
    await app.client.refresh();
    const results = await runner.runThroughSolution(solutionPath, "inplace", "net6.0", true, true);
    await runner.validateHighLevelResults(results, ["0 of 1", "2 of 6", "50 of 85", "0", "(21)"]);
    const controllerFolderPath: string = path.join(solutionFolderPath, "MvcMusicStore", "Controllers");
    const getAccountController = fs.readFile(path.join(controllerFolderPath, "AccountController.cs"), "utf8");
    const getStoreManagerController = fs.readFile(path.join(controllerFolderPath, "StoreManagerController.cs"), "utf8");
    expect((await getAccountController).indexOf("Microsoft.AspNetCore.Mvc")).not.toBe(-1);
    expect((await getStoreManagerController).indexOf("Microsoft.EntityFrameworkCore")).not.toBe(-1);
  });

  // passed
  test("run through mixed c#/vb solution", async () => {
    const solutionFolderPath: string = path.join(
      testSolutionPath(),
      "canary",
      "MixedClassLibrary"
    );
    const solutionPath: string = path.join(solutionFolderPath, "MixedClassLibrary.sln");
    await addSolution(app, solutionPath);
    await app.client.refresh();
    const results = await runner.runThroughSolution(solutionPath, "inplace", "net6.0", false, false);
    await runner.validateHighLevelResults(results, ["0 of 2", "6 of 7", "14 of 46", "0", "(9)"]);
    const projectFile: string = path.join(solutionFolderPath, "MixedClassLibrary", "VbClassLibrary.vbproj");
    expect((await fs.readFile(projectFile)).indexOf("BouncyCastle.NetCore")).not.toBe(-1);
  });
});
