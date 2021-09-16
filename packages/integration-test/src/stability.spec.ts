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
import {
  resetTestSolutions,
  runThroughSolution,
  selectProfile,
  validateHighLevelResults,
} from "./helper";

describe("stability check, assess a solution, reassess the solution, check all solution tabs make sure loaded, check all projects for all solution, make sure loaded, check porting for all projects", () => {
  let app: Application;

  beforeAll(async () => {
    resetTestSolutions();
    app = await startApp();
    await selectProfile(app, ".NET Core 3.1.0");
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

  test("run through NopCommerce 3.1.0", async () => {
    const solutionFolderPath: string = path.join(
      testSolutionPath(),
      "nopCommerce-release-3.10",
      "src"
    );
    const solutionPath: string = path.join(
      solutionFolderPath,
      "NopCommerce.sln"
    );
    await addSolution(app, solutionPath);
    await app.client.refresh();
    const results = await runThroughSolution(
      solutionPath,
      "inplace",
      "netcoreapp3.1",
      app
    );
    await validateHighLevelResults(results, [
      "0 of 40",
      "37 of 38",
      "447 of 1256",
      "0",
      "(1565)",
    ]);

    const getCatalogController = fs.readFile(
      path.join(solutionFolderPath, "Libraries", "Nop.Core", "Nop.Core.csproj"),
      "utf8"
    );

    expect(
      (await getCatalogController).indexOf('Include="Autofac" Version="4.0.0"')
    ).not.toBe(-1);
  });

  test("run through mvcmusicstore", async () => {
    const solutionFolderPath: string = path.join(
      testSolutionPath(),
      "mvcmusicstore",
      "sourceCode",
      "mvcmusicstore"
    );
    const solutionPath: string = path.join(
      solutionFolderPath,
      "MvcMusicStore.sln"
    );
    await addSolution(app, solutionPath);
    await app.client.refresh();
    const results = await runThroughSolution(
      solutionPath,
      "inplace",
      "netcoreapp3.1",
      app
    );
    await validateHighLevelResults(results, [
      "0 of 1",
      "2 of 6",
      "50 of 81",
      "0",
      "(21)",
    ]);
    const controllerFolderPath: string = path.join(
      solutionFolderPath,
      "MvcMusicStore",
      "Controllers"
    );
    const getAccountController = fs.readFile(
      path.join(controllerFolderPath, "AccountController.cs"),
      "utf8"
    );
    const getStoreManagerController = fs.readFile(
      path.join(controllerFolderPath, "StoreManagerController.cs"),
      "utf8"
    );
    expect(
      (await getAccountController).indexOf("Microsoft.AspNetCore.Mvc")
    ).not.toBe(-1);
    expect(
      (await getStoreManagerController).indexOf("Microsoft.EntityFrameworkCore")
    ).not.toBe(-1);
  });

  test("run through Miniblog", async () => {
    const solutionPath: string = path.join(
      testSolutionPath(),
      "Miniblog.Core-master",
      "Miniblog.Core.sln"
    );
    await addSolution(app, solutionPath);
    await app.client.refresh();
    const results = await runThroughSolution(
      solutionPath,
      "inplace",
      "netcoreapp3.1",
      app
    );
    await validateHighLevelResults(results, [
      "1 of 1",
      "0 of 13",
      "5 of 249",
      "0",
      "(21)",
    ]);
  });

  test("run through Umbraco", async () => {
    const solutionPath: string = path.join(
      testSolutionPath(),
      "Umbraco-CMS-8-contrib",
      "src",
      "umbraco.sln"
    );
    await addSolution(app, solutionPath);
    await app.client.refresh();
    const results = await runThroughSolution(
      solutionPath,
      "inplace",
      "netcoreapp3.1",
      app
    );
    await validateHighLevelResults(results, [
      "0 of 8",
      "28 of 69",
      "735 of 2764",
      "0",
      "(3182)",
    ]);
  });
});
