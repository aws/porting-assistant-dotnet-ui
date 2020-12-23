import { PortingLocation } from "../models/porting";
import { Project } from "../models/project";
import { SolutionDetails } from "../models/solution";

export const getPortingPath = (solution: SolutionDetails, project: Project, portingLocation: PortingLocation) => {
  const relativePath = window.electron.getRelativePath(solution.solutionFilePath, project.projectFilePath);
  switch (portingLocation.type) {
    case "copy":
      return window.electron.joinPaths(portingLocation.workingDirectory, relativePath);
    case "inplace":
      return project.projectFilePath;
  }
};
