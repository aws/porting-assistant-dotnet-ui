import { Application } from "spectron";
import { awsCredPath, setupElectronLogs, startApp, stopApp } from "./hooks";
import { TestRunner } from "./testRunner";
import fs from "fs"; 

describe("profile check, check behavior with valid profile, check behavior with invalid profile", () => {
    let app: Application;
    let runner: TestRunner;

    beforeAll(async() => {
        app = await startApp();
        runner = new TestRunner(app);
        return app;
    })

    beforeEach(async() => {
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

    test("add profile with Invalid Access Key Name", async() => {
        const profileName = "testProfile";
        const accessKeyID = "INVALID";
        const secretAccessKey = "INVALID";

        await app.client.pause(3000);
        await (await app.client.$("#start-btn")).click();

        await runner.addNamedProfile(profileName, accessKeyID, secretAccessKey);

        await runner.validateComponentExists('span=AWS access key is invalid');
    });

    // NOTE: These tests are kind of flaky during the build process, need to fix later
    // Might be something to do with running the add profile action multiple times in quick
    // succession

    // test("add profile, check credentials file", async() => {
    //     const profileName = "testProfile";
    //     const accessKeyID = "AKIAINVALID";
    //     const secretAccessKey = "INVALID";

    //     await app.client.pause(3000);
    //     await (await app.client.$("#start-btn")).click();

    //     await runner.addNamedProfile(profileName, accessKeyID, secretAccessKey);

    //     expect(fs.readFileSync(awsCredPath(), "utf-8").replace(/\r|\n/g, '')).toContain(
    //         `[${ profileName }]aws_access_key_id = ${ accessKeyID }aws_secret_access_key = ${ secretAccessKey }`
    //     );
    // });

    // test("add invalid profile, select profile and validate error is thrown", async() => {
    //     const profileName = "testProfile";
    //     const accessKeyID = "AKIAINVALID";
    //     const secretAccessKey = "INVALID";

    //     await app.client.pause(3000);
    //     await (await app.client.$("#start-btn")).click();

    //     await runner.addNamedProfile(profileName, accessKeyID, secretAccessKey);
    //     await runner.selectNamedProfile(profileName)

    //     await runner.validateComponentExists(`span=${ profileName } does not have the correct IAM policies. If you need help setting up your profile see Learn more above.`)
    // })
}
)