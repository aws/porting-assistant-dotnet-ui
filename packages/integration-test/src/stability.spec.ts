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

const expectedWCFProgram: string =`
using CoreWCF.Configuration;
using System.Net;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;


namespace WCFTCPSelfHost
{
	public class Program
	{
		public static void Main(string[] args)
		{
      //All Ports set are default.
			IWebHost host = CreateWebHostBuilder(args).Build();
      host.Run();
		}

    public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
      WebHost.CreateDefaultBuilder(args)
				 .UseKestrel(options => { })
.UseNetTcp(8000)				 .UseStartup<Startup>();
	}
}
`;

const expectedWCFStartup: string =`
using CoreWCF.Configuration;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace WCFTCPSelfHost
{
   public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            string pathToXml = @"C:\\testsolutions\\wcftcpselfhost\\WCFTCPSelfHost\\corewcf_ported.config";
            services.AddServiceModelServices();
            services.AddServiceModelConfigurationManagerFile(pathToXml);
        }

        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            app.UseServiceModel();
        }
    }
}
`;

const expectedWCFConfig: string =
`<?xml version="1.0" encoding="utf-16" standalone="yes"?>
<configuration>
  <system.serviceModel>
    <bindings>
      <netTcpBinding>
        <binding name="EndPointConfiguration">
          <security mode="None" />
        </binding>
      </netTcpBinding>
    </bindings>
    <behaviors>
      <serviceBehaviors>
        <behavior name="mexBehavior">
          <serviceMetadata httpGetEnabled="true" policyVersion="Policy15" />
        </behavior>
      </serviceBehaviors>
    </behaviors>
    <services>
      <service name="WcfServiceLibrary1.Service1" behaviorConfiguration="mexBehavior">
        <endpoint address="/Service1" binding="netTcpBinding" bindingConfiguration="EndPointConfiguration" contract="WcfServiceLibrary1.IService1" />
      </service>
    </services>
  </system.serviceModel>
</configuration>`;

describe("stability check, assess a solution, reassess the solution, check all solution tabs make sure loaded, check all projects for all solution, make sure loaded, check porting for all projects", () => {
  let app: Application;

  const escapeNonAlphaNumeric = (solutionPath: string) => {
    return solutionPath.replace(/[^0-9a-zA-Z]/gi, "");
  };

  const selectProfile = async () => {
    await app.client.pause(3000);
    await (await app.client.$("#start-btn")).click();
    await addNamedProfileCheck();
    await (await app.client.$("#profile-selection")).click();
    await (await app.client.$('[title="default"]')).click();
    await (await app.client.$("#next-btn")).click();
    await(await app.client.$("=Assess a new solution")).waitForDisplayed({
      timeout: 60000,
    });
  };

  const addNamedProfileCheck = async () => {
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

  const emptyEmailCheck = async () => {
    await (await app.client.$("#feedback-btn")).click();
    await (await app.client.$('#email-btn')).click();
    await (
      await app.client.$("span=Invalid e-mail format.")
    ).waitForExist({
      timeout: 1000,
    });
    await app.client.keys(["Escape"]);
  };

  const invalidEmailCheck = async () => {
    await (await app.client.$("#feedback-btn")).click();
    await (await app.client.$('#email-input input')).setValue("integration.test.com");
    await (await app.client.$('#email-btn')).click();
    await (
      await app.client.$("span=Invalid e-mail format.")
    ).waitForExist({
      timeout: 1000,
    });
    await app.client.keys(["Escape"]);
  }

  const setupEmail = async () => {
    await (await app.client.$('#email-input input')).setValue("integration@test.com");
    await (await app.client.$('#email-btn')).click();
  };

  const sendFeedbackCheck = async () => {
    await (await app.client.$("#feedback-btn")).click();
    await setupEmail();
    await (await app.client.$("#fb-category-selection")).click();
    await (await app.client.$('[data-testid="general"]')).click();
    await (await app.client.$('#fb-text input')).setValue("integration-test-feedback");
    await (await app.client.$("#send-feedback-btn")).click();
    console.log("Sent customer feedback success");
  };

  const emptyFeedbackCheck = async () => {
    await (await app.client.$("#feedback-btn")).click();
    await (await app.client.$("#send-feedback-btn")).click();
    await app.client.keys(["Escape"]);
  };

  const sendRuleContributionCheck = async () => {
    await (await app.client.$(`a[data-testid="nuget-packages"]`)).click();
    await (await app.client.$("=NuGet packages")).waitForDisplayed();
    await (await app.client.$('._input_wtz7u_3')).setValue('jQuery.vsdoc');
    await (await app.client.$('._label_4pfx5_7')).click();
    await (await app.client.$('#rule-contribution-btn')).click();
    await (await app.client.$("=Suggest replacement")).waitForDisplayed();
    await (await app.client.$('#rc-package-name input')).setValue("Azure.ImageOptimizer");
    await (await app.client.$('#rc-version-check-box')).click();
    await (await app.client.$('#rc-comment input')).setValue("integration-test-rule-contribution");
    await (await app.client.$("#rc-send-btn")).click();
    console.log("Sent rule contribution success");
  };

  const runThroughSolution = async (
    solutionPath: string,
    portingPlace: string,
    targetFramework: string,
    sendFeedback: boolean,
    sendRuleContribution: boolean,
  ) => {
    const solutionNameTagId = `#solution-link-${escapeNonAlphaNumeric(
      solutionPath
    )}`;
    console.log(`assessing solution ${solutionNameTagId}....`);
    await assessSolutionCheck(solutionNameTagId);
    console.log(`assess solution ${solutionNameTagId} success`);
    if (sendFeedback) {
      await invalidEmailCheck();
      await emptyEmailCheck();
      await sendFeedbackCheck();
      await emptyFeedbackCheck();
    }
    if (sendRuleContribution) {
      await sendRuleContributionCheck();
    }
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
      const project = projects[i];
      await projectTabCheck();
      await (await app.client.$(`#${project}`)).click();
      if (project == projects[0]) {
        await portingProjectsCheck(portingPlace);
      } else {
        await portingProjectsCheck("other");
      }
      await app.client.pause(2000);
      await (
        await app.client.$("._circle_oh9fc_75")
      ).waitForExist({
        reverse: true,
        timeout: 1000000,
      });
      await (await app.client.$(solutionNameTagId)).click();
    }
    await checkPortingProjectResults(
      solutionNameTagId,
      projects[0],
      targetFramework
    );
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
    await (
      await app.client.$("._circle_oh9fc_75")
    ).waitForExist({
      reverse: true,
      timeout: 800000,
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
      timeout: 1000000,
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

  const projectTabCheck = async () => {
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
    expectedTargetFramework: string
  ) => {
    // porting will kick off a new assessment, wait for it to finish before
    // clicking into the solution
    const solutionLink = await app.client.$(solutionNameTagId);
    if (await solutionLink.isExisting()) {
      await (
        await app.client.$("._circle_oh9fc_75")
      ).waitForExist({
        reverse: true,
        timeout: 800000,
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
      false,
      false
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
      true,
      true
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
      false,
      false
    );
    await validateHighLevelResults(results, [
      "1 of 1",
      "0 of 13",
      "5 of 249",
      "0",
      "(21)",
    ]);
  });

  test("run through wcf", async () => {
    const solutionFolderPath: string = path.join(
      testSolutionPath(),
      "wcftcpselfhost"
    );
    const solutionPath: string = path.join(
      solutionFolderPath,
      "WCFTCPSelfHost.sln"
    );
    await addSolution(app, solutionPath);
    await app.client.refresh();
    const results = await runThroughSolution(
      solutionPath,
      "inplace",
      "netcoreapp3.1",
      false,
      false
    );
    await validateHighLevelResults(results, [
      "0 of 3",
      "0 of 0",
      "8 of 26",
      "0",
      "(11)",
    ]);

    const selfHostProjectPath: string = path.join(
      solutionFolderPath,
      "WCFTCPSelfHost",
    )

    const getCsProj = fs.readFile(
      path.join(selfHostProjectPath, "WCFTCPSelfHost.csproj"),
      "utf-8"
    )

    expect((await getCsProj).indexOf("CoreWCF.Primitives")).not.toBe(-1);
    expect((await getCsProj).indexOf("CoreWCF.Http")).not.toBe(-1);
    expect((await getCsProj).indexOf("CoreWCF.NetTcp")).not.toBe(-1);

    const getStartup = fs.readFile(
      path.join(selfHostProjectPath, "Startup.cs"),
      "utf-8"
    )

    const getProgram = fs.readFile(
      path.join(selfHostProjectPath, "Program.cs"),
      "utf-8"
    )

    const getConfig = fs.readFile(
      path.join(selfHostProjectPath, "corewcf_ported.config"),
      "utf-8"
    )

    expect((await getStartup)).toBe(expectedWCFStartup);
    expect((await getProgram)).toBe(expectedWCFProgram);
    expect((await getConfig).replace(/(\r\n|\n|\r)/gm, "")).toBe(expectedWCFConfig.replace(/(\r\n|\n|\r)/gm, ""));
  });

  test("run through wcf on net 6.0", async () => {
    const solutionFolderPath: string = path.join(
      testSolutionPath(),
      "wcftcpselfhost"
    );
    const solutionPath: string = path.join(
      solutionFolderPath,
      "WCFTCPSelfHost.sln"
    );
    await addSolution(app, solutionPath);
    await app.client.refresh();
    const results = await runThroughSolution(
      solutionPath,
      "inplace",
      "netcoreapp3.1",
      false,
      false
    );
    await validateHighLevelResults(results, [
      "0 of 3",
      "0 of 0",
      "8 of 26",
      "0",
      "(11)",
    ]);
  });

  test("run through mvcmusicstore on net 6.0", async () => {
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
      "net6.0",
      false,
      false
    );
    await validateHighLevelResults(results, [
      "0 of 1",
      "2 of 6",
      "50 of 81",
      "0",
      "(21)",
    ]);
  });
});
