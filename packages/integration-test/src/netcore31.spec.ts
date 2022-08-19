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
import { TestRunner, TargetFrameworks } from "./testRunner";
import { expectedWCFConfig, expectedWCFProgram, expectedWCFStartup, expectedWebFormsProgramcs, expectedMVCAppWithIISConfigProgramcs } from "./constants";

describe("netcore 3.1 test suite", () => {
    let app: Application;
    let runner: TestRunner;

    beforeAll(async () => {
        app = await startApp();
        runner = new TestRunner(app);
        await runner.setupTargetFramework(TargetFrameworks.netcore31);
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

    test("run through mvcmusicstore on .netcore 3.1", async () => {
      const solutionFolderPath: string = path.join(
        testSolutionPath(),
        "netcore3.1",
        "mvcmusicstore",
        "sourceCode",
        "mvcmusicstore"
      );
      const solutionPath: string = path.join(solutionFolderPath, "MvcMusicStore.sln");
      await addSolution(app, solutionPath);
      await app.client.refresh();
      const results = await runner.runThroughSolution(solutionPath, "inplace", "netcoreapp3.1", false, false);
      await runner.validateHighLevelResults(results, ["0 of 1", "2 of 6", "50 of 85", "0", "(21)"]);
      const controllerFolderPath: string = path.join(solutionFolderPath, "MvcMusicStore", "Controllers");
      const getAccountController = fs.readFile(path.join(controllerFolderPath, "AccountController.cs"), "utf8");
      const getStoreManagerController = fs.readFile(path.join(controllerFolderPath, "StoreManagerController.cs"), "utf8");
      expect((await getAccountController).indexOf("Microsoft.AspNetCore.Mvc")).not.toBe(-1);
      expect((await getStoreManagerController).indexOf("Microsoft.EntityFrameworkCore")).not.toBe(-1);
    });

    test("run through wcf on .netcore3.1", async () => {
      const solutionFolderPath: string = path.join(testSolutionPath(), "netcore3.1", "wcftcpselfhost");
      const solutionPath: string = path.join(solutionFolderPath, "WCFTCPSelfHost.sln");
      await addSolution(app, solutionPath);
      await app.client.refresh();
      const results = await runner.runThroughSolution(solutionPath, "inplace", "netcoreapp3.1", false, false);
      await runner.validateHighLevelResults(results, ["0 of 3", "0 of 0", "14 of 46", "0", "(11)"]);

      const selfHostProjectPath: string = path.join(solutionFolderPath, "WCFTCPSelfHost");

      const getCsProj = fs.readFile(path.join(selfHostProjectPath, "WCFTCPSelfHost.csproj"), "utf-8");

      expect((await getCsProj).indexOf("CoreWCF.Primitives")).not.toBe(-1);
      expect((await getCsProj).indexOf("CoreWCF.Http")).not.toBe(-1);
      expect((await getCsProj).indexOf("CoreWCF.NetTcp")).not.toBe(-1);

      const getStartup = fs.readFile(path.join(selfHostProjectPath, "Startup.cs"), "utf-8");

      const getProgram = fs.readFile(path.join(selfHostProjectPath, "Program.cs"), "utf-8");

      const getConfig = fs.readFile(path.join(selfHostProjectPath, "corewcf_ported.config"), "utf-8");

     expect(await getStartup).toBe(expectedWCFStartup("netcore3.1"));
      expect(await getProgram).toBe(expectedWCFProgram);
      expect((await getConfig).replace(/(\r\n|\n|\r)/gm, "")).toBe(expectedWCFConfig.replace(/(\r\n|\n|\r)/gm, ""));
    });

    test("run through NopCommerce 3.1.0", async () => {
      const solutionFolderPath: string = path.join(testSolutionPath(), "netcore3.1", "nopCommerce-release-3.10", "src");
      const solutionPath: string = path.join(solutionFolderPath, "NopCommerce.sln");
      await addSolution(app, solutionPath);
      await app.client.refresh();
      const results = await runner.runThroughSolution(solutionPath, "inplace", "netcoreapp3.1", false, false);
      await runner.validateHighLevelResults(results, ["0 of 40", "37 of 38", "498 of 1357", "0", "(1565)"]);

      const getCatalogController = fs.readFile(
        path.join(solutionFolderPath, "Libraries", "Nop.Core", "Nop.Core.csproj"),
        "utf8"
      );
      expect((await getCatalogController).indexOf('Include="Autofac" Version="4.0.0"')).not.toBe(-1);
    });

    test("run through eCommerceOnBlazor .netcore 3.1", async () => {
        const solutionFolderPath: string = path.join(
            testSolutionPath(),
            "netcore3.1",
            "eShopOnBlazor"
        );
        const solutionPath: string = path.join(solutionFolderPath, "eShopOnBlazor.sln");
        await addSolution(app, solutionPath);
        await app.client.refresh();
        const results = await runner.runThroughSolution(solutionPath, "inplace", "netcoreapp3.1", false, false);
        await runner.validateHighLevelResults(results, ['0 of 1', '16 of 44', '56 of 147', '0', '(37)']);
        const layoutFolderPath: string = path.join(solutionFolderPath, "src", "eShopLegacyWebForms", "Layouts");
        const siteRazorFile = fs.readFile(path.join(layoutFolderPath, "site.razor.cs"), "utf8");
        const getProgramcsFile = fs.readFile(path.join(solutionFolderPath,"src", "eShopLegacyWebForms", "Program.cs"), "utf8");
        const getCsProj = fs.readFile(path.join(solutionFolderPath, "src", "eShopLegacyWebForms", "eShopLegacyWebForms.csproj"), "utf-8");
        const getDefaultRazorFile = fs.readFile(path.join(solutionFolderPath, "src", "eShopLegacyWebForms", "Pages","Default.razor.cs"), "utf-8");
        expect((await siteRazorFile).indexOf("Microsoft.AspNetCore.Components")).not.toBe(-1);
        expect((await getDefaultRazorFile).indexOf("Microsoft.AspNetCore.Components")).not.toBe(-1);
        expect((await getProgramcsFile).replace(/(\r\n|\n|\r)/gm, "")).toBe(expectedWebFormsProgramcs.replace(/(\r\n|\n|\r)/gm, ""));
        expect((await getCsProj).indexOf("netcoreapp3.1")).not.toBe(-1);
    });


    test("run through test MVC proj with IIS config .netcore 3.1", async () => {
        const solutionFolderPath: string = path.join(
            testSolutionPath(),
            "netcore3.1",
            "IIS"
        );
        const solutionPath: string = path.join(solutionFolderPath, "MVCAppWithIISConfig.sln");
        await addSolution(app, solutionPath);
        await app.client.refresh();
        const results = await runner.runThroughSolution(solutionPath, "inplace", "netcoreapp3.1", false, false);
        await runner.validateHighLevelResults(results, ['0 of 1', '8 of 14', '16 of 24', '0', '(9)']);
        const getStartcsFile = fs.readFile(path.join(solutionFolderPath, "MVCAppWithIISConfig", "Startup.cs"), "utf-8");
        const getProgramcsFile = fs.readFile(path.join(solutionFolderPath, "MVCAppWithIISConfig", "Program.cs"), "utf-8");
        const getMiddlewareHandlerFile = fs.readFile(path.join(solutionFolderPath, "MVCAppWithIISConfig","Middleware", "AppShutDownHandler.cs"), "utf-8");
        const getMiddlewareModuleFile = fs.readFile(path.join(solutionFolderPath, "MVCAppWithIISConfig","Middleware", "AppShutDownModule.cs"), "utf-8");
        expect((await getStartcsFile).indexOf("Microsoft.AspNetCore.Rewrite")).not.toBe(-1);
        expect((await getStartcsFile).indexOf("Microsoft.AspNetCore.ResponseCompression")).not.toBe(-1);
        expect((await getStartcsFile).indexOf("Microsoft.AspNetCore.HttpsPolicy")).not.toBe(-1);
        expect((await getStartcsFile).indexOf("Microsoft.AspNetCore.Mvc")).not.toBe(-1);
        expect((await getStartcsFile).indexOf("app.UseMiddleware<TestMvcApplication.AppShutDownModule>()")).not.toBe(-1);
        expect((await getProgramcsFile).replace(/(\r\n|\n|\r)/gm, "")).toBe(expectedMVCAppWithIISConfigProgramcs.replace(/(\r\n|\n|\r)/gm, ""));
        expect((await getMiddlewareHandlerFile).indexOf("Microsoft.AspNetCore.Http")).not.toBe(-1);
        expect((await getMiddlewareModuleFile).indexOf("Microsoft.AspNetCore.Http")).not.toBe(-1);
    });
});
