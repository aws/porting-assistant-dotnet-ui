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
import {
  resetTestSolutions,
  runThroughSolution,
  selectProfile,
  validateHighLevelResults,
} from "./helper";

describe("stability check target .NET 5", () => {
  let app: Application;

  beforeAll(async () => {
    resetTestSolutions();
    console.log("starting tests");
    app = await startApp();
    await selectProfile(app, ".NET 5.0.0");
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
      "Miniblog.Core-master",
      "Miniblog.Core.sln"
    );
    await addSolution(app, solutionPath);
    await app.client.refresh();
    const results = await runThroughSolution(
      solutionPath,
      "inplace",
      "net5.0",
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

  // test("run through NopCommerce 3.1.0", async () => {
  //   const solutionFolderPath: string = path.join(
  //     testSolutionPath(),
  //     "nopCommerce-release-3.10",
  //     "src"
  //   );
  //   const solutionPath: string = path.join(
  //     solutionFolderPath,
  //     "NopCommerce.sln"
  //   );
  //   await addSolution(app, solutionPath);
  //   await app.client.refresh();
  //   const results = await runThroughSolution(
  //     solutionPath,
  //     "inplace",
  //     "net5.0",
  //     app
  //   );
  //   await validateHighLevelResults(results, [
  //     "0 of 40",
  //     "37 of 38",
  //     "447 of 1256",
  //     "0",
  //     "(1565)",
  //   ]);
  // });

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
      "net5.0",
      app
    );
    await validateHighLevelResults(results, [
      "0 of 1",
      "2 of 6",
      "18 of 78",
      "162",
      "(21)",
    ]);
  });
});
