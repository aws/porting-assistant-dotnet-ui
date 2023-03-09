import { ReactNode } from "react";

import { CopyLocation, InplaceLocation } from "./models/porting";
import { PortingProject } from "./models/porting";
import {
  ApiAnalysisResult,
  ApiRecommendation,
  CodeEntityDetails,
  CompatibleTargets,
  PackageAnalysisResult,
  PackageAnalysisResultWithDate,
  Project,
  ProjectApiAnalysisResult,
  ProjectToApiAnalysis,
  Recommendations,
  RecommendedAction,
  RemovedSolutions,
  SolutionToApiAnalysis,
  SolutionToSolutionDetails,
  SourceFileAnalysisResult,
  SourceFileToContents,
  TextSpan
} from "./models/project";
import { SolutionDetails } from "./models/solution";
import { HelpInfo } from "./models/tools";
import { SetPortingProjectConfig } from "./store/actions/porting";
import { SolutionToPortingLocation, SolutionToPortingProjects } from "./store/reducers/porting";
import { Failed, Loaded, Loading, Reloading } from "./utils/Loadable";

// fake test data
export const compatibleTargets: CompatibleTargets = "net6.0";
export const projectPath = "/test/testproject";
export const sourceFile = "/test/testproject/get.ts";

export const codeEntityDetail1: CodeEntityDetails = {
  codeEntityType: "Method",
  namespace: "test",
  name: "get",
  signature: "abcd",
  originalDefinition: "abcd",
  textSpan: {
    startCharPosition: 1,
    endCharPosition: 10,
    startLinePosition: 13,
    endLinePosition: 24
  },
  package: {
    packageId: "testpackage",
    version: "1.0.0"
  }
};

export const codeEntityDetail2: CodeEntityDetails = {
  codeEntityType: "Method",
  namespace: "test",
  name: "get",
  signature: "abcd",
  originalDefinition: "abcd",
  textSpan: {
    startCharPosition: 1,
    endCharPosition: 10,
    startLinePosition: 13,
    endLinePosition: 24
  },
  package: {
    packageId: "testpackage",
    version: "3.0.0"
  }
};

export const packageRecommendations: Recommendations = {
  recommendedActions: [
    { recommendedActionType: "UpgradePackage", description: "test upgrade", targetCPU: ["arm, x86, x64"], textSpan: {} }
  ]
};

export const apiRecommendations: ApiRecommendation = {
  recommendedActionType: "ReplaceNamespace",
  description: "test",
  codeEntityDetails: codeEntityDetail1,
  targetCPU: ["arm, x86, x64"],
  textSpan: {}
};

export const noRecommendations: ApiRecommendation = {
  recommendedActionType: "NoRecommendation",
  description: "",
  codeEntityDetails: codeEntityDetail2,
  targetCPU: ["arm, x86, x64"],
  textSpan: {}
};

export const apiAnalysisResult1: ApiAnalysisResult = {
  codeEntityDetails: codeEntityDetail2,
  recommendations: { recommendedActions: [noRecommendations] },
  compatibilityResults: {
    "net6.0": {
      compatibility: "COMPATIBLE",
      compatibleVersions: ["3.0.0", "3.1.0"]
    }
  }
};

export const apiAnalysisResult2: ApiAnalysisResult = {
  codeEntityDetails: codeEntityDetail1,
  recommendations: { recommendedActions: [apiRecommendations] },
  compatibilityResults: {
    "net6.0": {
      compatibility: "INCOMPATIBLE",
      compatibleVersions: ["3.0.0", "3.1.0"]
    }
  }
};

export const apiAnalysisResult3: ApiAnalysisResult = {
  codeEntityDetails: {} as CodeEntityDetails,
  recommendations: { recommendedActions: [apiRecommendations] },
  compatibilityResults: {
    "net6.0": {
      compatibility: "INCOMPATIBLE",
      compatibleVersions: ["3.0.0", "3.1.0"]
    }
  }
};

export const packageAnalysisResult: PackageAnalysisResult = {
  packageVersionPair: {
    packageId: "test",
    version: "1.1.0"
  },
  compatibilityResults: {
    "net6.0": {
      compatibility: "INCOMPATIBLE",
      compatibleVersions: ["1.1.0", "1.0.0"]
    }
  },
  recommendations: packageRecommendations
};

export const packageAnalysisResultModify: PackageAnalysisResult = {
  packageVersionPair: {
    packageId: "test",
    version: "1.0.0"
  },
  compatibilityResults: {
    "net6.0": {
      compatibility: "COMPATIBLE",
      compatibleVersions: ["1.1.0", "1.0.0"]
    }
  },
  recommendations: packageRecommendations
};

export const project: Project = {
  projectName: "testProject",
  projectFilePath: "/test/testproject",
  projectGuid: "xxxx",
  projectReferences: [{ referencePath: "/test/a" }, { referencePath: "/test/b" }],
  targetFrameworks: ["net6.0"],
  packageReferences: [{ packageId: "testpackage", version: "3.0.0" }],
  isBuildFailed: false
};

export const failedproject: Project = {
  projectName: "testfailedProject",
  projectFilePath: "/test/failed",
  projectGuid: "xxxx",
  projectReferences: [{ referencePath: "/test/c" }, { referencePath: "/test/d" }],
  targetFrameworks: ["net48"],
  packageReferences: [{ packageId: "testpackage", version: "3.0.0" }],
  isBuildFailed: true
};

export const reloadingproject: Project = {
  projectName: "testfailedProject",
  projectFilePath: "/test/reloading",
  projectGuid: "xxxx",
  projectReferences: [{ referencePath: "/test/c" }, { referencePath: "/test/d" }],
  targetFrameworks: ["net48"],
  packageReferences: [{ packageId: "testpackage", version: "3.0.0" }],
  isBuildFailed: true
};

export const solutionDetails: SolutionDetails = {
  solutionName: "testsolution",
  solutionFilePath: "/test/testsolution",
  failedProjects: [""],
  projects: [project, failedproject, reloadingproject]
};

export const solutionDetails2: SolutionDetails = {
  solutionName: "testsolution",
  solutionFilePath: "/test/testsolution",
  failedProjects: [""]
} as SolutionDetails;

export const solutionDetailsReloading: SolutionDetails = {
  solutionName: "testsolution",
  solutionFilePath: "/test/testsolution",
  failedProjects: [""],
  projects: [reloadingproject]
};

export const recommendedaction: RecommendedAction = {
  recommendedActionType: "ReplaceApi",
  description: "no no no",
  textSpan: {} as TextSpan,
  targetCPU: ["64"]
};

export const sourceFileAnalysisResult1: SourceFileAnalysisResult = {
  sourceFileName: "get.ts",
  sourceFilePath: "/test/testproject/get.ts",
  apiAnalysisResults: [apiAnalysisResult1],
  recommendedActions: [recommendedaction]
};

export const sourceFileAnalysisResult2: SourceFileAnalysisResult = {
  sourceFileName: "test.ts",
  sourceFilePath: "/test/testproject/test.ts",
  apiAnalysisResults: [apiAnalysisResult2, apiAnalysisResult3],
  recommendedActions: [recommendedaction]
};

export const projectAnalysisResult: ProjectApiAnalysisResult = {
  solutionFile: "/test/solution",
  projectFile: "/test/testproject",
  projectGuid: "00000000",
  errors: [""],
  sourceFileAnalysisResults: [sourceFileAnalysisResult1, sourceFileAnalysisResult2],
  targetFrameworks: [],
  projectName: "testproject",
  projectType: "testtype",
  featureType: "testfeature",
  isBuildFailed: false,
  projectReferences: [],
  packageReferences: []
};

export const removedSolutions: RemovedSolutions = {
  "/test/testproject/test.ts": false
}

export const projectToApiAnalysis: ProjectToApiAnalysis = {
  "/test/testproject": Loaded(projectAnalysisResult),
  "/test/loading": Loading<ProjectApiAnalysisResult>(),
  "/test/reloading": Reloading<ProjectApiAnalysisResult>(projectAnalysisResult),
  "/test/failed": Failed<ProjectApiAnalysisResult>("error", "error")
};

export const packageAnalysisResultWithDate: PackageAnalysisResultWithDate = {
  packageVersionPair: {
    packageId: "test",
    version: "1.0.0"
  },
  compatibilityResults: {
    "net6.0": {
      compatibility: "COMPATIBLE",
      compatibleVersions: ["1.1.0", "1.0.0"]
    }
  },
  recommendations: packageRecommendations,
  lastRequestDate: "2020/6/18/12:12:00"
};

export const inplacePorting: InplaceLocation = {
  type: "inplace"
};

export const copyPorting: CopyLocation = {
  type: "copy",
  workingDirectory: "/usr/xxx/workplace/test/"
};

export const completePortingProject: PortingProject = {
  projectPath: "/test/testproject",
  steps: {
    projectFileStep: "complete"
  }
};

export const incompletePortingProject: PortingProject = {
  projectPath: "/test/testproject",
  steps: {
    projectFileStep: "incomplete"
  }
};

export const emptyPortingProject: PortingProject = {
  projectPath: "/test/testproject"
};

export const setcompletePortingProjectConfig: SetPortingProjectConfig = {
  solutionPath: "/test/solution",
  projectPath: "/test/testproject",
  portingLocation: inplacePorting,
  config: completePortingProject
};

export const setincompletePortingProjectConfig: SetPortingProjectConfig = {
  solutionPath: "/test/solution",
  projectPath: "/test/testproject",
  portingLocation: inplacePorting,
  config: incompletePortingProject
};

export const setcompletePortingProjectConfigCopy: SetPortingProjectConfig = {
  solutionPath: "/test/solution",
  projectPath: "/test/testproject",
  portingLocation: copyPorting,
  config: completePortingProject
};

export const setincompletePortingProjectConfigCopy: SetPortingProjectConfig = {
  solutionPath: "/test/solution",
  projectPath: "/test/testproject",
  portingLocation: copyPorting,
  config: incompletePortingProject
};

export const solutionToPortingProjects: SolutionToPortingProjects = {
  "/test/solution": {
    "/test/testproject": completePortingProject
  },
  "/test/port": {
    "/test/testproject": incompletePortingProject
  }
};

export const solutionToPortingLocation: SolutionToPortingLocation = {
  "/test/solution": copyPorting
};

export const solutionToProjects: SolutionToSolutionDetails = {
  "/test/solution": Loaded(solutionDetails),
  "/test/testsolution": Loaded(solutionDetails2),
  "/test/loading": Loading<SolutionDetails>(),
  "/test/reloading": Reloading(solutionDetailsReloading),
  "/test/truereloading": Reloading(solutionDetailsReloading),
  "/test/fail": Failed("error")
};

export const solutionToApiAnalysis: SolutionToApiAnalysis = {
  "/test/solution": projectToApiAnalysis,
  "/test/loading": projectToApiAnalysis,
  "/test/reloading": projectToApiAnalysis,
  "/test/failed": projectToApiAnalysis
};

export const heloInfo: HelpInfo = {
  heading: "test",
  mainContent: {} as ReactNode,
  learnMoreLinks: [
    {
      externalUrl: "/test/url",
      text: "test"
    }
  ]
};

export const tools = {
  isOpen: true,
  info: heloInfo
};

export const sourceFiletoContents: SourceFileToContents = {
  "get.ts": Loaded("test")
};
