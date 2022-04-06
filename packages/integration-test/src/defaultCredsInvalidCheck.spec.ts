import { Application } from "spectron";
import { awsCredPath, setupElectronLogs, startApp, stopApp } from "./hooks";
import { TestRunner } from "./testRunner";
import fs from "fs";

describe("default creds check, check behavior with invalid profile", () => {
    let app: Application;
    let runner: TestRunner;

    beforeAll(async () => {
        process.env["AWS_ACCESS_KEY_ID"] = "InValid";
        process.env["AWS_SECRET_ACCESS_KEY"] = "InValid";
        app = await startApp();
        runner = new TestRunner(app);
        return app;
    })

    beforeEach(async () => {
        await app.client.refresh();
    })

    afterEach(async () => {
        setupElectronLogs(app);
        await app.client.pause(1000);
        await app.client.refresh();
    });

    afterAll(async () => {
        await app.client.execute("window.test.clearState();");
        await stopApp(app);
    });

    test("set default credentials with invalid key", async () => {
        await app.client.pause(3000);
        await (await app.client.$("#start-btn")).click();
        await runner.selectDefaultCredentials();
        await (await app.client.$("#next-btn")).click();
        await runner.validateComponentExists('span=Default Credentials does not have the correct IAM policies. If you need help setting up your profile see Learn more above.');
    });
}
)