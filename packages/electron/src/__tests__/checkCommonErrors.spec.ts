import path from "path";
import { checkCommonErrors } from "../utils/checkCommonErrors";
import fs from "fs";

describe("checkCommonErrors", () => {
  it("should detect common errors and message", async () => {
    const appDataDir =
      process.env.APPDATA ||
      (process.platform == "darwin"
        ? process.env.HOME + "/Library/Preferences"
        : process.env.HOME + "/.local/share");

    const testLogFile = path.join(
      appDataDir,
      "Porting Assistant for .NET",
      "logs",
      "test",
      `portingAssistant-backend-${new Date()
        .toLocaleDateString("en-CA")
        .slice(0, 10)
        .replace(/-/g, "")}.log`
    );
    console.log(testLogFile);

    if (!fs.existsSync(path.dirname(testLogFile))) {
      fs.mkdirSync(path.dirname(testLogFile), { recursive: true });
    }

    let start = new Date("2022-02-24 11:00:00");

    const testLine1 = `[2022-02-24 10:00:15 ERR] (1.5.3) PortingAssistant.Client.Analysis.PortingAssistantAnalysisHandler: System.UnauthorizedAccessException: Access to the path 'system.web.json' is denied. \n`;
    const testLine2 = `[2022-02-24 10:00:48 ERR] (1.6.4) PortingAssistant.Client.Analysis.PortingAssistantAnalysisHandler: Build error: Missing MSBuild Path \n`;

    fs.writeFileSync(testLogFile, testLine1 + testLine2);

    let errors = await checkCommonErrors(start, testLogFile);

    // start is beyond error time stamps, should return nothing
    expect(errors.length).toEqual(0);

    start = new Date("2022-02-24 10:00:00");
    errors = await checkCommonErrors(start, testLogFile);
    expect(errors.length).toEqual(2);
    expect(errors[0].error).toEqual("Unauthorized Access");
    // should include file name in error message
    expect(errors[0].message).toEqual(
      "Encountered file access issue. Access to the path 'system.web.json' is denied. Check logs for additional information"
    );
    expect(errors[1].error).toEqual("Missing MSBuild Path");

    // cleanup
    fs.rmSync(path.dirname(testLogFile), { recursive: true, force: true });
    expect(fs.existsSync(path.dirname(testLogFile))).toEqual(true);
  });
});
