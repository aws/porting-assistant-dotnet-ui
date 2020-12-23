export type PortingLocation = InplaceLocation | CopyLocation;

export interface InplaceLocation {
  type: "inplace";
}

export interface CopyLocation {
  type: "copy";
  workingDirectory: string;
}

export interface PortingProjects {
  [projectPath: string]: PortingProject;
}

export interface Steps {
  projectFileStep?: Step;
}

export interface PortingProject {
  projectPath: string;
  steps?: Steps;
}

export type Step = "complete" | "incomplete";

export interface PortingProjectChange {
  sourceFile: string;
  lineNumber: number;
  code: string;
  message: string;
}

export interface PortingProjectFileResult {
  success?: boolean;
  projectFile?: string;
  projectName?: string;
  message?: string;
  exception?: any;
}
