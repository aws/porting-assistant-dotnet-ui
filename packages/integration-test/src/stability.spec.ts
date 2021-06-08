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

describe("stability check, assess a solution, reassess the solution, check all solution tabs make sure loaded, check all projects for all solution, make sure loaded, check porting for all projects", () => {
  let app: Application;

  const escapeNonAlphaNumeric = (solutionPath: string) => {
    return solutionPath.replace(/[^0-9a-zA-Z]/gi, "");
  };

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
    protingPlace: string
  ) => {
    const solutionNameTagId = `#solution-link-${escapeNonAlphaNumeric(
      solutionPath
    )}`;
    console.log(`assessing solution ${solutionNameTagId}....`);
    await assessSolutionCheck(solutionNameTagId);
    console.log(`assess solution ${solutionNameTagId} success`);
    console.log(`reassessing solution ${solutionNameTagId}....`);
    await reassessSolutionCheck(solutionNameTagId);
    console.log(`reassess solution ${solutionNameTagId} success`);
    console.log(`checking tabs in solution ${solutionNameTagId}`);
    await solutionTabCheck();
    const projectName = await app.client.$(".project-name");
    if (!projectName.isExisting()) {
      return;
    }
    let projectstring: string = await projectName.getAttribute("id");
    const projects: string[] = projectstring.toString().split(",");
    const solutionPage = `=${solutionPath.split("\\").pop()}`;
    console.log(`checking projects for ${solutionNameTagId}`);
    for (const project of projects) {
      await projectTabCheck();
      await (await app.client.$(`#${project}`)).click();
      if (project == projects[0]) {
        await portingProjectsCheck(protingPlace);
      } else {
        await portingProjectsCheck("other");
      }
      await app.client.pause(2000);
      await (await app.client.$("awsui-spinner")).waitForExist({
        reverse: true,
        timeout: 600000,
      });
      await (await app.client.$(solutionNameTagId)).click();
    }
  };

  const assessSolutionCheck = async (solutionNameTagId: string) => {
    await (
      await app.client.$(".DashboardTable_inProgress__36V-K")
    ).waitForExist({
      reverse: true,
      timeout: 600000,
    });
    await (await app.client.$(solutionNameTagId)).click();
  };

  const reassessSolutionCheck = async (solutionNameTagId: string) => {
    const reassessSolution = await app.client.$("#reassess-solution");
    await reassessSolution.waitForEnabled({ timeout: 600000 });
    await reassessSolution.click();
    await (
      await app.client.$(".DashboardTable_inProgress__36V-K")
    ).waitForExist({
      reverse: true,
      timeout: 600000,
    });
    await (await app.client.$(solutionNameTagId)).click();
  };

  const solutionTabCheck = async () => {
    const projectReferenceTab = await app.client.$(
      `a[data-testid="project-references"]`
    );
    await projectReferenceTab.waitForExist({ timeout: 100000 });
    await projectReferenceTab.click();
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

  beforeAll(async () => {
    app = await startApp();
    await selectProfile();
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

  test("run through NopCommerce 4.3.0", async () => {
    const solutionPath: string = path.join(
      testSolutionPath(),
      "nopCommerce-release-4.30",
      "src",
      "NopCommerce.sln"
    );
    await addSolution(app, solutionPath);
    await app.client.refresh();
    return await runThroughSolution(solutionPath, "inplace");
  });

  test("run through mvcmusicstore", async () => {
    const solutionPath: string = path.join(
      testSolutionPath(),
      "mvcmusicstore",
      "sourceCode",
      "mvcmusicstore",
      "MvcMusicStore.sln"
    );
    await addSolution(app, solutionPath);
    await app.client.refresh();
    return await runThroughSolution(solutionPath, "inplace");
  });

  test("run through Miniblog", async () => {
    const solutionPath: string = path.join(
      testSolutionPath(),
      "Miniblog.Core-master",
      "Miniblog.Core.sln"
    );
    await addSolution(app, solutionPath);
    await app.stop();
    app = await startApp();
    return await runThroughSolution(solutionPath, "inplace");
  });
});
