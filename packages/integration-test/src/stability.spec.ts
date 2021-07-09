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
const { exec } = require("child_process");
var pidusage = require('pidusage')

describe("stability check, assess a solution, reassess the solution, check all solution tabs make sure loaded, check all projects for all solution, make sure loaded, check porting for all projects", () => {
  let app: Application;

  const escapeNonAlphaNumeric = (solutionPath: string) => {
    return solutionPath.replace(/[^0-9a-zA-Z]/gi, "");
  };

  let appProcessId: String;
  let appMemoryUsageBefore: number;
  let appMemoryUsageAfter: number;
  let appMemoryUsageMax: number;

  const selectProfile = async () => {
    await app.client.pause(3000);
    await (await app.client.$("#start-btn")).click();
    await (await app.client.$("#profile-selection")).click();
    await (await app.client.$('[title="default"]')).click();
    await (await app.client.$("#next-btn")).click();
    await (await app.client.$("=Assess a new solution")).waitForDisplayed();
  };

  const runThroughSolution = async (
    solutionPath: string,
    portingPlace: string,
    targetFramework: string,
  ) => {
    const solutionNameTagId = `#solution-link-${escapeNonAlphaNumeric(
      solutionPath
    )}`;
    console.log(`assessing solution ${solutionNameTagId}....`);
    await assessSolutionCheck(solutionNameTagId);
    console.log(`assess solution ${solutionNameTagId} success`);
    console.log(`reassessing solution ${solutionNameTagId}....`);
    const assessmentResults = await reassessSolutionCheck(
      solutionNameTagId,
      solutionPath
    );
    console.log(`reassess solution ${solutionNameTagId} success`);
    console.log(`checking tabs in solution ${solutionNameTagId}`);
    const numSourceFiles = await solutionTabCheck();
    assessmentResults.push(numSourceFiles);
    const projectName = await app.client.$(".project-name");
    if (!projectName.isExisting()) {
      return;
    }
    let projectstring: string = await projectName.getAttribute("id");
    const projects: string[] = projectstring.toString().split(",");
    const solutionPage = `=${solutionPath.split("\\").pop()}`;
    console.log(`checking projects for ${solutionNameTagId}`);
    for (let i = 0; i < 2 && i < projects.length; i++) {
      const project = projects[i]
      await projectTabCheck();
      await (await app.client.$(`#${project}`)).click();
      if (project == projects[0]) {
        await portingProjectsCheck(portingPlace);
      } else {
        await portingProjectsCheck("other");
      }
      await app.client.pause(2000);
      await (await app.client.$("._circle_oh9fc_75")).waitForExist({ 
        reverse: true, timeout: 1200000 
      });
      await (await app.client.$(solutionNameTagId)).click();
    }
    await checkPortingProjectResults(solutionNameTagId, projects[0], targetFramework);
    return assessmentResults;
  };

  const checkAssessmentResults = async (solutionPath: string) => {
    const escapedSolutionPath = escapeNonAlphaNumeric(solutionPath);
    return await Promise.all([
      await (
        await app.client.$(`#ported-projects-${escapedSolutionPath}`)
      ).getText(),
      await (
        await app.client.$(`#incompatible-packages-${escapedSolutionPath}`)
      ).getText(),
      await (
        await app.client.$(`#incompatible-apis-${escapedSolutionPath}`)
      ).getText(),
      await (
        await app.client.$(`#build-error-${escapedSolutionPath}`)
      ).getText(),
    ]);
  };

  const assessSolutionCheck = async (solutionNameTagId: string) => {
    await (await app.client.$("._circle_oh9fc_75")).waitForExist({ 
      reverse: true, 
      timeout: 800000 
    });
    await (await app.client.$(solutionNameTagId)).click();
  };

  const reassessSolutionCheck = async (
    solutionNameTagId: string,
    solutionPath: string
  ) => {
    const reassessSolution = await app.client.$("#reassess-solution");
    await reassessSolution.waitForEnabled({ timeout: 600000 });
    await reassessSolution.click();
    await (
      await app.client.$("._circle_oh9fc_75")
    ).waitForExist({
      reverse: true,
      timeout: 1200000
    });
    const results = await checkAssessmentResults(solutionPath);
    await (await app.client.$(solutionNameTagId)).click();
    return results;
  };

  const solutionTabCheck = async () => {
    const projectReferenceTab = await app.client.$(
      `a[data-testid="project-references"]`
    );
    await projectReferenceTab.waitForExist({ timeout: 100000 });
    await projectReferenceTab.click();
    await (await app.client.$("#project-dependencies")).waitForExist({
      timeout: 600000,
    });
    await (await app.client.$(`a[data-testid="nuget-packages"]`)).click();
    await (await app.client.$("=NuGet packages")).waitForDisplayed();
    await (await app.client.$(`a[data-testid="apis"]`)).click();
    await (await app.client.$("=APIs")).waitForDisplayed();
    await (await app.client.$(`a[data-testid="source-files"]`)).click();
    await (await app.client.$("=Source files")).waitForDisplayed();
    const numSourceFiles = await (
      await app.client.$("._counter_14rjr_108")
    ).getText();
    await (await app.client.$(`a[data-testid="projects"]`)).click();
    await (await app.client.$("=Projects")).waitForDisplayed();
    return numSourceFiles;
  };

  const projectTabCheck = async () => {
    await (await app.client.$(`a[data-testid="project-references"]`)).click();
    await (await app.client.$("#project-dependencies")).waitForExist({
      timeout: 400000,
    });
    await (await app.client.$(`a[data-testid="nuget-packages"]`)).click();
    await (await app.client.$("=NuGet packages")).waitForDisplayed();
    await (await app.client.$(`a[data-testid="apis"]`)).click();
    await (await app.client.$("=APIs")).waitForDisplayed();

    await (await app.client.$(`a[data-testid="source-files"]`)).click();
    await (await app.client.$("=Source files")).waitForDisplayed();

    await (await app.client.$(`a[data-testid="projects"]`)).click();
    await (await app.client.$("=Projects")).waitForDisplayed();
  };

  const portingProjectsCheck = async (selectLocation: string) => {
    await (await app.client.$("#port-project-button")).click();
    if (selectLocation == "inplace") {
      await (await app.client.$("#select-location-button")).click();
      await (await app.client.$(`div[data-value="inplace"]`)).click();
      await (await app.client.$("#save-button")).click();
    } else if (selectLocation == "copy") {
      await (await app.client.$("#select-location-button")).click();
      await (await app.client.$(`div[data-value="copy"]`)).click();
      await (await app.client.$(`icon="folder-open"`)).click();
      await (await app.client.$("#save-button")).click();
      await app.client.pause(3000);
      await (await app.client.$("#incompatible")).waitForExist({
        timeout: 50000,
      });
    }
    await (await app.client.$("#port-project-title")).waitForExist();
    await (await app.client.$("#port-button")).click();
  };

  const checkPortingProjectResults = async (
    solutionNameTagId: string,
    firstProjectId: string,
    expectedTargetFramework: string,
  ) => {
    // porting will kick off a new assessment, wait for it to finish before
    // clicking into the solution
    const solutionLink = await app.client.$(solutionNameTagId);
    if (await solutionLink.isExisting()) {
      await (await app.client.$("._circle_oh9fc_75")).waitForExist({
        reverse: true,
        timeout: 1200000,
      });
      await solutionLink.click();
    }
    // should be 'project-name-[projectfilepath]'
    const projectFilePath = firstProjectId.split("-")[2];
    const targetFramework = await (
      await app.client.$(`#target-framework-${projectFilePath}`)
    ).getText();
    expect(targetFramework).toBe(expectedTargetFramework);
  };

  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }   

  const validateHighLevelResults = async (
    results: string[] | undefined,
    expectedValues: string[]
  ) => {
    // [portedProjects, incompatiblePackages, incompatibleApis, buildErrors, numSourceFiles]
    expect(results).toBeTruthy();
    expect(results ? results[0] : "").toBe(expectedValues[0]);
    expect(results ? results[1] : "").toBe(expectedValues[1]);
    expect(results ? results[2] : "").toBe(expectedValues[2]);
    expect(results ? results[3] : "").toBe(expectedValues[3]);
    expect(results ? results[4] : "").toBe(expectedValues[4]);
  };

  // Check process memory usage every {interval} milliseconds:
  const monitorProcessMemoryUsage = async (processId: String, interval: number) => {
    setTimeout(async () => {
      await checkProcessMemoryUsage(processId)
      monitorProcessMemoryUsage(processId, interval)
    }, interval)
  }

  // Compare current process memory usage with max memory usage
  const checkProcessMemoryUsage = async (processId: String) => {
    try {
      var appMemoryUsageCurrent = (await pidusage(processId)).memory
      // console.log(`Memory usage: ${appMemoryUsageCurrent}`)
      if (appMemoryUsageCurrent > appMemoryUsageMax) {
        appMemoryUsageMax = appMemoryUsageCurrent
      }
    } catch (error) {
      switch(error.code){
        case "ENOENT": console.log("              [Memory usage monitoring complete - process has ended.]\n"); break;
        default: console.log("[/!\\ error]\n",error); break
       }
    }
  }

  beforeAll(async (done) => {
    app = await startApp();
    await selectProfile();

    // Get Electron process id
    exec("Get-Process | Select-Object Id, WorkingSet, WorkingSet64, ProcessName, MainWindowTitle | Where-Object {$_.mainWindowTitle -eq 'Porting Assistant for .NET'} | Select-Object -ExpandProperty id", { 'shell': 'powershell.exe' }, (error: any, stdout: any, stderr: any) => {
      appProcessId = String(stdout)
      monitorProcessMemoryUsage(appProcessId, 1000)
      done()
    })
    return app;
  });

  beforeEach(async () => {
    await app.client.refresh();
    appMemoryUsageBefore = (await pidusage(appProcessId)).memory
    appMemoryUsageMax = appMemoryUsageBefore
    console.log(`Memory usage before test: ${appMemoryUsageBefore}`)
  });

  afterEach(async (done) => {
    setupElectronLogs(app);
    await clearSolutions(app);
    await app.client.pause(1000);
    await app.client.refresh();

    await sleep(2000).then(async () => {
      // Memory usage after test should drop back to a baseline similar to usage before test
      appMemoryUsageAfter = (await pidusage(appProcessId)).memory;
      const baselineIncrease = appMemoryUsageAfter/appMemoryUsageBefore;
      console.log(`Memory usage after test: ${appMemoryUsageAfter}`);
      expect(baselineIncrease).toBeLessThan(1.5);
      done()
    });
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
    const results =  await runThroughSolution(solutionPath, "inplace", "netcoreapp3.1");
    await validateHighLevelResults(
      results, 
      ["0 of 40", "37 of 38", "328 of 898", "0", "(1565)"]
    ).then(() => {
      console.log(
        `Max memory usage: ${appMemoryUsageMax}. Increase of ${appMemoryUsageMax / appMemoryUsageBefore} times.`
      );
    });

    const getCatalogController = fs.readFile(
      path.join(
        solutionFolderPath,
        "Libraries",
        "Nop.Core",
        "Nop.Core.csproj"
      ),
      "utf8"
    );

    expect(
      (await getCatalogController).indexOf('Include="Autofac" Version="4.0.0"')
    ).not.toBe(-1);

    const maxIncrease = appMemoryUsageMax/appMemoryUsageBefore;
    expect(maxIncrease).toBeLessThan(9.2);
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
    const results = await runThroughSolution(solutionPath, "inplace", "netcoreapp3.1");
    await validateHighLevelResults(
      results, 
      ["0 of 1", "2 of 6", "34 of 52", "0", "(21)"]
    ).then(() => {
      console.log(
        `Max memory usage: ${appMemoryUsageMax}. Increase of ${appMemoryUsageMax / appMemoryUsageBefore} times.`
      );
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

    const maxIncrease = appMemoryUsageMax/appMemoryUsageBefore;
    expect(maxIncrease).toBeLessThan(1.2);
  });

  test("run through Miniblog", async () => {
    const solutionPath: string = path.join(
      testSolutionPath(),
      "Miniblog.Core-master",
      "Miniblog.Core.sln"
    );
    await addSolution(app, solutionPath);
    await app.client.refresh();
    const results = await runThroughSolution(solutionPath, "inplace", "netcoreapp3.1");
    await validateHighLevelResults(
      results, 
      ["1 of 1", "0 of 13", "5 of 169", "0", "(21)"]
    ).then(() => {
      console.log(
        `Max memory usage: ${appMemoryUsageMax}. Increase of ${appMemoryUsageMax / appMemoryUsageBefore} times.`
      );
    });
    
    const maxIncrease = appMemoryUsageMax/appMemoryUsageBefore;
    expect(maxIncrease).toBeLessThan(1.2);
  });
});
