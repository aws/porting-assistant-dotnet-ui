import { logError } from "./LogError";

export const checkIfSolutionContainsVBproject = async (solutionFilename: string) => {
    var slnFileContents = "";
    try {
        slnFileContents = await window.backend.getFileContents(solutionFilename);
        var lines = slnFileContents.split("\n");
        const pattern = /Project\("\{.*\}"\)/;
        for (const line of lines) {
            if (line.match(pattern) !== null && line.includes(".vbproj")) return true;
        }
    } catch (error) {
        logError("AddSolutionForm.tsx", "Unable to read solution file.", error);
    }
    return false;
}