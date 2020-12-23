import { Project } from "./project";

export interface SolutionDetails {
  solutionName: string;
  solutionFilePath: string;
  failedProjects: string[];
  projects: Project[];
}
