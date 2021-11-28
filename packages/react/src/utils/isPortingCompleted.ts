import { PortingProjects } from "../models/porting";
import { Project } from "../models/project";

export const isPortingCompleted = (
  solutionPath: string,
  project: Project,
  portingProjects: PortingProjects | null | undefined
) => {
  if (portingProjects != null && solutionPath != null) {
    if (
      portingProjects[window.electron.getRelativePath(solutionPath, project.projectFilePath)]?.steps
        ?.projectFileStep === "complete"
    ) {
      return true;
    }
  }
  if (
    project.targetFrameworks?.some(
      framework => framework.toLowerCase().includes("netcoreapp") || framework.toLowerCase().includes("netstandard") || framework.toLowerCase().includes("net")
    )
  ) {
    return true;
  }
  return false;
};
