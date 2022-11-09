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
const { exec } = require("child_process");
var pidusage = require("pidusage");

// canary performance test for memory and time measurement
describe("canary performance test suite", () => {
  let app: Application;
  let runner: TestRunner;
  let appProcessId: String;
  let appMemoryUsageBefore: number;
  let appMemoryUsageAfter: number;
  let appMemoryUsageMax: number;

   // Check process memory usage every {interval} milliseconds:
  const monitorProcessMemoryUsage = async (processId: String, interval: number) => {
    setTimeout(async () => {
      await checkProcessMemoryUsage(processId);
      monitorProcessMemoryUsage(processId, interval);
    }, interval);
  }

  // Compare current process memory usage with max memory usage
  const checkProcessMemoryUsage = async (processId: String) => {
    try {
      const stats = await pidusage(processId)
      var appMemoryUsageCurrent = stats.memory;
      // console.log(`Memory usage: ${appMemoryUsageCurrent}`)
      if (appMemoryUsageCurrent > appMemoryUsageMax) {
        appMemoryUsageMax = appMemoryUsageCurrent;
        console.log(`Updated Max Memory usage: ${appMemoryUsageMax}`)
      }
    } catch (error) {
      switch (error) {
        case "ENOENT":
          console.log(
            "              [Memory usage monitoring complete - process has ended.]\n"
          );
          break;
        default:
          console.log("[/!\\ error]\n", error);
          break;
      }
    }
  }

  beforeAll(async () => {
    app = await startApp();
    setupTelemetry(app);
    runner = new TestRunner(app);
    await runner.setupTargetFramework();

    // Get Electron process id
    exec(
      "Get-Process | Select-Object Id, WorkingSet, WorkingSet64, ProcessName, MainWindowTitle | Where-Object {$_.ProcessName -eq 'Porting Assistant for .NET'} | Select-Object -ExpandProperty id",
      { shell: "powershell.exe" },
      (error: any, stdout: any, stderr: any) => {
        appProcessId = String(stdout);
        monitorProcessMemoryUsage(appProcessId, 1000);
      }
    );
    return app;
  });

  beforeEach(async () => {
    await app.client.refresh();
    const stats = await pidusage(appProcessId)

    appMemoryUsageBefore = stats.memory;
    appMemoryUsageMax = appMemoryUsageBefore;
    console.log(`Memory usage before test: ${appMemoryUsageBefore}`);
  });

  afterEach(async () => {
    setupElectronLogs(app);
    await clearSolutions(app);
    await app.client.pause(1000);
    await app.client.refresh();

    await app.client.pause(2000).then(async () => {
      // Memory usage after test should drop back to a baseline similar to usage before test
      const stats = await pidusage(appProcessId)
      appMemoryUsageAfter = stats.memory;
      
      const baselineIncrease = appMemoryUsageAfter/appMemoryUsageBefore;
      console.log(`Memory usage after test: ${appMemoryUsageAfter}`);
      expect(baselineIncrease).toBeLessThan(1.5);
    });
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
    const results = await runner.runThroughSolution(
      solutionPath,
      "inplace",
      "net6.0",
      false,
      false,
      true,
      appMemoryUsageMax
    );
    await runner.validateHighLevelResults(results, [
      "1 of 1",
      "2 of 13",
      "12 of 268",
      "0",
      "(21)",
    ]).then(() => {
      console.log(`Max memory usage: ${appMemoryUsageMax}`);
    });

    expect(appMemoryUsageBefore).toBeLessThan(220052931);
    expect(appMemoryUsageMax).toBeLessThan(231693685);
  });

  test("run through mvcmusicstore", async () => {
    const solutionFolderPath: string = path.join(
      testSolutionPath(),
      "canary",
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
    const results = await runner.runThroughSolution(
      solutionPath,
      "inplace",
      "net6.0",
      false,
      false,
      true,
      appMemoryUsageMax
    );
    await runner.validateHighLevelResults(results, [
      "0 of 1",
      "2 of 6",
      "50 of 85",
      "0",
      "(21)",
    ]).then(() => {
      console.log(`Max memory usage: ${appMemoryUsageMax}`);
    });

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
    expect(appMemoryUsageBefore).toBeLessThan(170545971);
    expect(appMemoryUsageMax).toBeLessThan(190701451);
  });
});
