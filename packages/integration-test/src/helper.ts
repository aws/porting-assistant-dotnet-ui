import { Application } from "spectron";
var unzipper = require("unzipper");
import { existsSync, createReadStream, rmdirSync, readFileSync } from "fs";

const escapeNonAlphaNumeric = (solutionPath: string) => {
  return solutionPath.replace(/[^0-9a-zA-Z]/gi, "");
};

export const resetTestSolutions = () => {
  if (existsSync("C:\\testsolutions")) {
    rmdirSync("C:\\testsolutions", { recursive: true });
  }
  createReadStream("C:\\test-solutions.zip").pipe(
    unzipper.Extract({ path: "C:\\" })
  );
};

const addNamedProfileCheck = async (app: Application) => {
  // profile selection model element is on top of add named profile link
  // and will intercept the click so we offset by 3 pixels down
  await (
    await app.client.$("#add-named-profile")
  ).click({
    button: "left",
    x: 0,
    y: 3,
  });
  await (await app.client.$("#add-profile-button")).click();
  await (
    await app.client.$("span=Profile is required")
  ).waitForExist({
    timeout: 1000,
  });
  await app.client.keys(["Escape"]);
  await (
    await app.client.$("#profile-selection")
  ).waitForExist({
    timeout: 1000,
  });
};

const selectTargetFramework = async (
  app: Application,
  targetFramework: string
) => {
  await (await app.client.$("#targetFramework-selection")).click();
  await (await app.client.$(`[title="${targetFramework}"]`)).click();
};

export const selectProfile = async (
  app: Application,
  targetFramework: string
) => {
  await app.client.pause(3000);
  await (await app.client.$("#start-btn")).click();
  await selectTargetFramework(app, targetFramework);
  await addNamedProfileCheck(app);
  await (await app.client.$("#profile-selection")).click();
  await (await app.client.$('[title="default"]')).click();
  await (await app.client.$("#next-btn")).click();
  await (
    await app.client.$("=Assess a new solution")
  ).waitForDisplayed({
    timeout: 60000,
  });
};

export const runThroughSolution = async (
  solutionPath: string,
  portingPlace: string,
  targetFramework: string,
  app: Application
) => {
  const solutionNameTagId = `#solution-link-${escapeNonAlphaNumeric(
    solutionPath
  )}`;
  console.log(`assessing solution ${solutionNameTagId}....`);
  await assessSolutionCheck(solutionNameTagId, app);
  console.log(`assess solution ${solutionNameTagId} success`);
  console.log(`reassessing solution ${solutionNameTagId}....`);
  const assessmentResults = await reassessSolutionCheck(
    solutionNameTagId,
    solutionPath,
    app
  );
  console.log(`reassess solution ${solutionNameTagId} success`);
  console.log(`checking tabs in solution ${solutionNameTagId}`);
  const numSourceFiles = await solutionTabCheck(app);
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
    const project = projects[i];
    await projectTabCheck(app);
    await (await app.client.$(`#${project}`)).click();
    if (project == projects[0]) {
      await portingProjectsCheck(portingPlace, app);
    } else {
      await portingProjectsCheck("other", app);
    }
    await app.client.pause(2000);
    await (
      await app.client.$("._circle_oh9fc_75")
    ).waitForExist({
      reverse: true,
      timeout: 1200000,
    });
    await (await app.client.$(solutionNameTagId)).click();
  }
  await checkPortingProjectResults(
    solutionNameTagId,
    projects[0],
    targetFramework,
    app
  );
  return assessmentResults;
};

const checkAssessmentResults = async (
  solutionPath: string,
  app: Application
) => {
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
    await (await app.client.$(`#build-error-${escapedSolutionPath}`)).getText(),
  ]);
};

const assessSolutionCheck = async (
  solutionNameTagId: string,
  app: Application
) => {
  await (
    await app.client.$("._circle_oh9fc_75")
  ).waitForExist({
    reverse: true,
    timeout: 1000000,
  });
  await (await app.client.$(solutionNameTagId)).click();
};

const reassessSolutionCheck = async (
  solutionNameTagId: string,
  solutionPath: string,
  app: Application
) => {
  const reassessSolution = await app.client.$("#reassess-solution");
  await reassessSolution.waitForEnabled({ timeout: 1000000 });
  await reassessSolution.click();
  await (
    await app.client.$("._circle_oh9fc_75")
  ).waitForExist({
    reverse: true,
    timeout: 1000000,
  });
  const results = await checkAssessmentResults(solutionPath, app);
  await (await app.client.$(solutionNameTagId)).click();
  return results;
};

const solutionTabCheck = async (app: Application) => {
  const projectReferenceTab = await app.client.$(
    `a[data-testid="project-references"]`
  );
  await projectReferenceTab.waitForExist({ timeout: 100000 });
  await projectReferenceTab.click();
  await (
    await app.client.$("#project-dependencies")
  ).waitForExist({
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

const projectTabCheck = async (app: Application) => {
  await (await app.client.$(`a[data-testid="project-references"]`)).click();
  await (
    await app.client.$("#project-dependencies")
  ).waitForExist({
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

const portingProjectsCheck = async (
  selectLocation: string,
  app: Application
) => {
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
    await (
      await app.client.$("#incompatible")
    ).waitForExist({
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
  app: Application
) => {
  // porting will kick off a new assessment, wait for it to finish before
  // clicking into the solution
  const solutionLink = await app.client.$(solutionNameTagId);
  if (await solutionLink.isExisting()) {
    await (
      await app.client.$("._circle_oh9fc_75")
    ).waitForExist({
      reverse: true,
      timeout: 1600000,
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

export const validateHighLevelResults = async (
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

function hashString(str: string){
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash += Math.pow(str.charCodeAt(i) * 31, str.length - i);
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

export const validatePortingResults = async (
  expectedResultsPath : string,
  receivedResultsPath : string
) => {
  var expected = JSON.parse(readFileSync(expectedResultsPath, "utf8"));
  var received  = JSON.parse(readFileSync(receivedResultsPath, "utf8"));

  var expectedHash = 0;
  var receivedHash = 0;
  expected.forEach((r: any) => expectedHash += hashString(JSON.stringify(r)));
  received.forEach((r: any) => receivedHash += hashString(JSON.stringify(r)));

  return expectedHash === receivedHash;
}


