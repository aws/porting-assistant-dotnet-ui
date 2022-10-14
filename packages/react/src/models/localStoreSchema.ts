import { PortingLocation } from "./porting";

// Remember to also update the schema in Dotnetmod/packages/electron/src/preload.js
export interface LocalStoreSchema {
  solutions: { [solution: string]: SolutionLocalStoreSchema };
  profile: string;
  targetFramework: TargetFramework;
  share: boolean;
  lastConfirmVersion: string;
  notification: boolean;
  newVersionNotification: boolean;
  email: string;
  useDefaultCreds: boolean;
  cancel: boolean;
  isAssesmentRunning: boolean;
  lastOpenDate: number;
}

export interface SolutionLocalStoreSchema {
  solutionPath: string;
  lastAssessedDate?: string;
  porting?: PortingState;
}

export interface PortingState {
  portingLocation: PortingLocation;
}

export interface TargetFramework {
  id: string;
  label: string;
}
