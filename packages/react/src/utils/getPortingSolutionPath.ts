import { PortingLocation } from "../models/porting";
import { SolutionDetails } from "../models/solution";

export const getPortingSolutionPath = (solutionDetails: SolutionDetails, portingLocation: PortingLocation) => {
  switch (portingLocation.type) {
    case "copy":
      return window.electron.joinPaths(
        portingLocation.workingDirectory,
        window.electron.getFilename(solutionDetails.solutionFilePath)
      );
    case "inplace":
      return solutionDetails.solutionFilePath;
  }
};
