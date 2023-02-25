import { Loadable } from "../utils/Loadable";
import { SolutionDetails } from "./solution";

export interface SolutionProject {
  solutionPath: string;
  projectPath: string;
}

export interface Project {
  projectName?: string | null;
  projectFilePath: string;
  projectGuid?: string | null;
  projectType?: string | null;
  featureType?: string | null;
  targetFrameworks?: string[] | null;
  packageReferences?: NugetPackage[] | null;
  projectReferences?: ProjectReference[] | null;
  isBuildFailed: boolean;
}

export interface ProjectReference {
  referencePath?: string;
}

export interface NugetPackage {
  packageId: string;
  version?: string;
  packageSourceType?: PackageSourceType;
}

export interface PackageAnalysisResult {
  packageVersionPair: NugetPackage;
  compatibilityResults: { [targetFramework: string]: CompatibilityResult };
  recommendations: Recommendations;
}

export interface PackageAnalysisResultWithDate extends PackageAnalysisResult {
  lastRequestDate?: string;
}

export interface ProjectApiAnalysisResult {
  solutionFile: string;
  projectFile: string;
  projectGuid?: string;
  errors: string[];
  sourceFileAnalysisResults: SourceFileAnalysisResult[];
  targetFrameworks: string[];
  projectName: string;
  projectType: string;
  featureType: string;
  isBuildFailed: boolean;
  packageReferences: NugetPackage[];
  projectReferences: ProjectReference[];
}

export interface SourceFileAnalysisResult {
  sourceFileName: string;
  sourceFilePath: string;
  apiAnalysisResults: ApiAnalysisResult[];
  recommendedActions: RecommendedAction[];
}

export interface ApiAnalysisResult {
  codeEntityDetails: CodeEntityDetails;
  compatibilityResults: { [targetFramework: string]: CompatibilityResult };
  recommendations: Recommendations;
}

export interface CompatibilityResult {
  compatibility: Compatibility;
  compatibleVersions: string[];
}

export interface Recommendations {
  recommendedActions: RecommendedAction[];
}

export interface RecommendedAction {
  recommendedActionType: RecommendedActionType;
  description?: string | null;
  textSpan: TextSpan;
  targetCPU: string[];
}
export interface ApiRecommendation extends RecommendedAction {
  codeEntityDetails?: CodeEntityDetails | null;
}

export interface PackageRecommendation extends RecommendedAction {
  PackageId?: string;
  Version?: string;
  TargetVersions?: string[];
}

export interface CodeEntityDetails {
  codeEntityType: CodeEntityType;
  namespace?: string;
  name?: string;
  signature?: string;
  originalDefinition?: string;
  textSpan?: TextSpan;
  package?: NugetPackage;
}

export interface TextSpan {
  startCharPosition?: number;
  endCharPosition?: number;
  startLinePosition?: number;
  endLinePosition?: number;
}

export interface VersionPair {
  originalVersion: string;
  upgradeVersion: string;
}

export interface PreTriggerData {
  projectName: string;
  projectPath: string;
  solutionPath: string;
  targetFramework: string;
  incompatibleApis: number | null;
  totalApis: number | null;
  buildErrors: number | null;
  ported: boolean;
  sourceFileAnalysisResults: SourceFileAnalysisResult[] | null;

}

export type CompatibleTargets = string;
export type Compatibility = "UNKNOWN" | "COMPATIBLE" | "INCOMPATIBLE" | "DEPRACATED";
export type RecommendedActionType =
  | "UpgradePackage"
  | "ReplaceApi"
  | "ReplaceNamespace"
  | "ReplacePackage"
  | "NoRecommendation";
export type CodeEntityType =
  | "Namespace"
  | "Class"
  | "Method"
  | "InstanceAttribute"
  | "ClassAttribute"
  | "Annotation"
  | "Declaration"
  | "Using"
  | "Enum"
  | "Struct";
export type PackageSourceType = "SDK" | "NUGET" | "PORTABILITY_ANALYZER" | "RECOMMENDATION" | "PRIVATE";
export type SolutionToSolutionDetails = { [solutionPath: string]: Loadable<SolutionDetails> };
export type ProjectToApiAnalysis = { [project: string]: Loadable<ProjectApiAnalysisResult> };
export type SolutionToApiAnalysis = { [solutionPath: string]: ProjectToApiAnalysis };
export type SourceFileToContents = { [sourceFilePath: string]: Loadable<string> };
export type PackageToPackageAnalysisResult = { [packageVersionPair: string]: Loadable<PackageAnalysisResultWithDate> };
export type RemovedSolutions = {[key: string]: boolean}
