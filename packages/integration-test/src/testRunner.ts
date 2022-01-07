import { Application } from "spectron";

export const TargetFrameworks = {
  net6: ".NET 6.0.0",
  net5: ".NET 5.0.0",
  netcore31: ".NET Core 3.1.0" 
}

export class TestRunner {
  app: Application;
  constructor(app: Application) {
    this.app = app;
  }

  escapeNonAlphaNumeric = (solutionPath: string) => {
    return solutionPath.replace(/[^0-9a-zA-Z]/gi, "");
  };

  selectTargetFramework = async (targetFramework: string) => {
    await (await this.app.client.$("#targetFramework-selection")).click();
    await (await this.app.client.$(`[title="${targetFramework}"`)).click();
  };

  selectProfile = async (targetFramework: string = "") => {
    await this.app.client.pause(3000);
    await (await this.app.client.$("#start-btn")).click();
    await this.addNamedProfileCheck();
    if (targetFramework !== "") {
      await this.selectTargetFramework(targetFramework);
    }
    await (await this.app.client.$("#profile-selection")).click();
    await (await this.app.client.$('[title="default"]')).click();
    await (await this.app.client.$("#next-btn")).click();
    await (
      await this.app.client.$("=Assess a new solution")
    ).waitForDisplayed({
      timeout: 60000,
    });
  };

  addNamedProfileCheck = async () => {
    // profile selection model element is on top of add named profile link
    // and will intercept the click so we offset by 3 pixels down
    await (
      await this.app.client.$("#add-named-profile")
    ).click({
      button: "left",
      x: 0,
      y: 3,
    });
    await (await this.app.client.$("#add-profile-button")).click();
    await (
      await this.app.client.$("span=Profile is required")
    ).waitForExist({
      timeout: 1000,
    });
    await this.app.client.keys(["Escape"]);
    await (
      await this.app.client.$("#profile-selection")
    ).waitForExist({
      timeout: 1000,
    });
  };

  emptyEmailCheck = async () => {
    await (await this.app.client.$("#feedback-btn")).click();
    await (await this.app.client.$("#email-btn")).click();
    await (
      await this.app.client.$("span=Invalid e-mail format.")
    ).waitForExist({
      timeout: 1000,
    });
    await this.app.client.keys(["Escape"]);
  };

  invalidEmailCheck = async () => {
    await (await this.app.client.$("#feedback-btn")).click();
    await (await this.app.client.$("#email-input input")).setValue("integration.test.com");
    await (await this.app.client.$("#email-btn")).click();
    await (
      await this.app.client.$("span=Invalid e-mail format.")
    ).waitForExist({
      timeout: 1000,
    });
    await this.app.client.keys(["Escape"]);
  };

  setupEmail = async () => {
    await (await this.app.client.$("#email-input input")).setValue("integration@test.com");
    await (await this.app.client.$("#email-btn")).click();
  };

  sendFeedbackCheck = async () => {
    await (await this.app.client.$("#feedback-btn")).click();
    await this.setupEmail();
    await (await this.app.client.$("#fb-category-selection")).click();
    await (await this.app.client.$('[data-testid="general"]')).click();
    await (await this.app.client.$("#fb-text input")).setValue("integration-test-feedback");
    await (await this.app.client.$("#send-feedback-btn")).click();
    console.log("Sent customer feedback success");
  };

  emptyFeedbackCheck = async () => {
    await (await this.app.client.$("#feedback-btn")).click();
    await (await this.app.client.$("#send-feedback-btn")).click();
    await this.app.client.keys(["Escape"]);
  };

  sendRuleContributionCheck = async () => {
    await this.nugetPackageTabCheck();
    await (await this.app.client.$(".awsui_input_2rhyz_fxf4s_7")).setValue("jQuery.vsdoc");
    await (await this.app.client.$(".awsui_input_1mabk_1s4v0_34")).click();
    await (await this.app.client.$("#rule-contribution-btn")).click();
    await (await this.app.client.$("span=Suggestion form")).waitForDisplayed();
    await (await this.app.client.$("#rc-package-name input")).setValue("Azure.ImageOptimizer");
    await (await this.app.client.$("#rc-version-check-box")).click();
    await (await this.app.client.$("#rc-comment input")).setValue("integration-test-rule-contribution");
    await (await this.app.client.$("#rc-send-btn")).click();
    console.log("Sent rule contribution success");
  };

  runThroughSolution = async (
    solutionPath: string,
    portingPlace: string,
    targetFramework: string,
    sendFeedback: boolean,
    sendRuleContribution: boolean
  ) => {
    const solutionNameTagId = `#solution-link-${this.escapeNonAlphaNumeric(solutionPath)}`;
    console.log(`assessing solution ${solutionNameTagId}....`);
    await this.assessSolutionCheck(solutionNameTagId, solutionPath);
    console.log(`assess solution ${solutionNameTagId} success`);
    if (sendFeedback) {
      await this.invalidEmailCheck();
      await this.emptyEmailCheck();
      await this.sendFeedbackCheck();
      await this.emptyFeedbackCheck();
    }
    if (sendRuleContribution) {
      await this.sendRuleContributionCheck();
    }
    console.log(`reassessing solution ${solutionNameTagId}....`);
    const assessmentResults = await this.reassessSolutionCheck(solutionNameTagId, solutionPath);
    console.log(`reassess solution ${solutionNameTagId} success`);
    console.log(`checking tabs in solution ${solutionNameTagId}`);
    const numSourceFiles = await this.solutionTabCheck();
    assessmentResults.push(numSourceFiles);
    const projectName = await this.app.client.$(".project-name");
    if (!projectName.isExisting()) {
      return;
    }
    let projectstring: string = await projectName.getAttribute("id");
    const projects: string[] = projectstring.toString().split(",");
    const solutionPage = `=${solutionPath.split("\\").pop()}`;
    console.log(`checking projects for ${solutionNameTagId}`);
    for (let i = 0; i < 2 && i < projects.length; i++) {
      const project = projects[i];
      await (await this.app.client.$(`#${project}`)).click();
      await this.projectTabCheck();
      if (project == projects[0]) {
        await this.portingProjectsCheck(portingPlace);
      } else {
        await this.portingProjectsCheck("other");
      }
      await this.app.client.pause(2000);
      await (
        await this.app.client.$(".awsui_circle_1612d_189wz_75")
      ).waitForExist({
        reverse: true,
        timeout: 1000000,
      });
      await (await this.app.client.$(solutionNameTagId)).click();
    }
    await this.checkPortingProjectResults(solutionNameTagId, projects[0], targetFramework);
    return assessmentResults;
  };

  checkAssessmentResults = async (solutionPath: string) => {
    const escapedSolutionPath = this.escapeNonAlphaNumeric(solutionPath);
    return await Promise.all([
      await (await this.app.client.$(`#ported-projects-${escapedSolutionPath}`)).getText(),
      await (await this.app.client.$(`#incompatible-packages-${escapedSolutionPath}`)).getText(),
      await (await this.app.client.$(`#incompatible-apis-${escapedSolutionPath}`)).getText(),
      await (await this.app.client.$(`#build-error-${escapedSolutionPath}`)).getText(),
    ]);
  };

  assessSolutionCheck = async (solutionNameTagId: string, solutionPath: string) => {
    await (
      await this.app.client.$(".awsui_circle_1612d_189wz_75")
    ).waitForExist({
      reverse: true,
      timeout: 800000,
    });
    await (await this.app.client.$(solutionNameTagId)).click();
  };

  reassessSolutionCheck = async (solutionNameTagId: string, solutionPath: string) => {
    const reassessSolution = await this.app.client.$("#reassess-solution");
    await reassessSolution.waitForEnabled({ timeout: 600000 });
    await reassessSolution.click();
    await (
      await this.app.client.$(".awsui_circle_1612d_189wz_75")
    ).waitForExist({
      reverse: true,
      timeout: 1000000,
    });
    const results = await this.checkAssessmentResults(solutionPath);
    await (await this.app.client.$(solutionNameTagId)).click();
    return results;
  };

  nugetPackageTabCheck = async () => {
    await (await this.app.client.$(`button[data-testid="nuget-packages"]`)).click();
    await (await this.app.client.$('input[placeholder="Search NuGet package by name"]')).waitForDisplayed();
  };

  tabsCheck = async () => {
    const projectReferenceTab = await this.app.client.$(`button[data-testid="project-references"]`);
    await projectReferenceTab.waitForExist({ timeout: 100000 });
    await projectReferenceTab.click();
    await (
      await this.app.client.$("#project-dependencies")
    ).waitForExist({
      timeout: 600000,
    });
    await this.nugetPackageTabCheck();
    await (await this.app.client.$(`button[data-testid="apis"]`)).click();
    await (await this.app.client.$('input[placeholder="Search by API name"]')).waitForDisplayed();
    await (await this.app.client.$(`button[data-testid="source-files"]`)).click();
    await (await this.app.client.$('input[placeholder="Search by source file name"]')).waitForDisplayed();
    const numSourceFiles = await (await this.app.client.$(".awsui_counter_2qdw9_bb1i6_175")).getText();
    return numSourceFiles;
  };

  solutionTabCheck = async () => {
    const numSourceFiles = await this.tabsCheck();
    await (await this.app.client.$(`button[data-testid="projects"]`)).click();
    await (await this.app.client.$('input[placeholder="Search by project name"]')).waitForDisplayed();
    return numSourceFiles;
  };

  projectTabCheck = async () => {
    await this.tabsCheck();
  };

  portingProjectsCheck = async (selectLocation: string) => {
    const portProjectButton = await this.app.client.$("#port-project-button");
    await portProjectButton.scrollIntoView(false);
    await portProjectButton.click();
    if (selectLocation == "inplace") {
      await (await this.app.client.$("#select-location-button")).click();
      await (await this.app.client.$(`div[data-value="inplace"]`)).click();
      await (await this.app.client.$("#save-button")).click();
    } else if (selectLocation == "copy") {
      await (await this.app.client.$("#select-location-button")).click();
      await (await this.app.client.$(`div[data-value="copy"]`)).click();
      await (await this.app.client.$(`icon="folder-open"`)).click();
      await (await this.app.client.$("#save-button")).click();
      await this.app.client.pause(3000);
      await (
        await this.app.client.$("#incompatible")
      ).waitForExist({
        timeout: 50000,
      });
    }
    await (await this.app.client.$("#port-project-title")).waitForExist();
    await (await this.app.client.$("#port-button")).click();
  };

  checkPortingProjectResults = async (
    solutionNameTagId: string,
    firstProjectId: string,
    expectedTargetFramework: string
  ) => {
    // porting will kick off a new assessment, wait for it to finish before
    // clicking into the solution
    const solutionLink = await this.app.client.$(solutionNameTagId);
    if (await solutionLink.isExisting()) {
      await (
        await this.app.client.$(".awsui_circle_1612d_189wz_75")
      ).waitForExist({
        reverse: true,
        timeout: 800000,
      });
      await solutionLink.click();
    }
    // should be 'project-name-[projectfilepath]'
    const projectFilePath = firstProjectId.split("-")[2];
    const targetFramework = await (await this.app.client.$(`#target-framework-${projectFilePath}`)).getText();
    expect(targetFramework).toBe(expectedTargetFramework);
  };

  validateHighLevelResults = async (results: string[] | undefined, expectedValues: string[]) => {
    // [portedProjects, incompatiblePackages, incompatibleApis, buildErrors, numSourceFiles]
    expect(results).toBeTruthy();
    expect(results ? results[0] : "").toBe(expectedValues[0]);
    expect(results ? results[1] : "").toBe(expectedValues[1]);
    expect(results ? results[2] : "").toBe(expectedValues[2]);
    expect(results ? results[3] : "").toBe(expectedValues[3]);
    expect(results ? results[4] : "").toBe(expectedValues[4]);
  };
}
