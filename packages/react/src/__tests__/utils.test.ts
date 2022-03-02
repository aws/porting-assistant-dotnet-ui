import path from "path";
import { createStore } from "redux";

import { createRootReducer } from "../../src/store/reducers";
import { Backend, Electron, Porting } from "../bootstrapElectron";
import { PackageContribution } from "../components/CustomerContribution/PackageRuleContribution";
import {
  copyPorting,
  inplacePorting,
  noRecommendations,
  packageAnalysisResult,
  packageAnalysisResultWithDate,
  project,
  projectPath,
  projectToApiAnalysis,
  solutionDetails,
  sourceFile
} from "../mockData";
import { PortingProjects } from "../models/porting";
import {
  PackageAnalysisResult,
  PackageToPackageAnalysisResult,
  Project,
  ProjectApiAnalysisResult,
  ProjectToApiAnalysis
} from "../models/project";
import { SolutionDetails } from "../models/solution";
import { checkIfSolutionContainsVBproject } from "../utils/checkVBProjects";
import { compareSemver } from "../utils/compareSemver";
import { filteringCountText } from "../utils/FilteringCountText";
import { getCompatibleApi } from "../utils/getCompatibleApi";
import { getCompatibleNugetsAgg, getIncompatibleNugets } from "../utils/getCompatibleNugets";
import { getPercent, getPercentNumber } from "../utils/getPercent";
import { getPortingPath } from "../utils/getPortingPath";
import { getPortingSolutionPath } from "../utils/getPortingSolutionPath";
import { isPortingCompleted } from "../utils/isPortingCompleted";
import { Failed, Loaded, Loading } from "../utils/Loadable";
import { logError, logErrorAction } from "../utils/LogError";
import { nugetPackageKey } from "../utils/NugetPackageKey";
import { checkPackageExists, validatePackageInput, validateVersion } from "../utils/validateRuleContrib";

afterEach(() => jest.clearAllMocks());
declare global {
  namespace NodeJS {
    interface Global {
      document: Document;
      window: {
        electron: Electron;
        backend: Backend;
        porting: Porting;
        reduxStore: any;
      };
      navigator: Navigator;
    }
  }
}

describe("filterCountText", () => {
  it("count 0", () => {
    const count = 0;
    const output = "0 matches";
    expect(filteringCountText(count)).toEqual(output);
  });
  it("count 1", () => {
    const count = 1;
    const output = "1 match";
    expect(filteringCountText(count)).toEqual(output);
  });
  it("count 2", () => {
    const count = 2;
    const output = "2 matches";
    expect(filteringCountText(count)).toEqual(output);
  });
});

describe("LogError", () => {
  it("log error", () => {
    const consoleMock = jest.spyOn(console, "error");
    expect(consoleMock.mock.calls.length).toBe(0);
    logError("test_file", "error message", {});
    expect(consoleMock.mock.calls.length).toBe(1);
  });
  it("log action", () => {
    const store = createStore(createRootReducer(), {});
    const state = store.getState();
    const consoleMock = jest.spyOn(console, "error");
    expect(consoleMock.mock.calls.length).toBe(0);
    logErrorAction("error", state, "error");
    expect(consoleMock.mock.calls.length).toBe(1);
  });
});

describe("getCompatibleApi", () => {
  it("should return 1 compatible when there is avaliable Api", () => {
    const result = getCompatibleApi(Loaded(solutionDetails), projectToApiAnalysis, projectPath, sourceFile);
    const expectResult = { failureCount: 0, isApisLoading: false, values: [1, 1] };
    expect(result).toEqual(expectResult);
  });

  it("should return isApiLoading when there is no corresponding response avaliable", () => {
    const result = getCompatibleApi(Loaded(solutionDetails), null, projectPath, sourceFile);
    const expectResult = { failureCount: 0, isApisLoading: true, values: [0, 0] };
    expect(result).toEqual(expectResult);
  });

  it("should return isApiLoading when the project is loading", () => {
    const result = getCompatibleApi(Loading(), projectToApiAnalysis, projectPath, sourceFile);
    const expectResult = { failureCount: 0, isApisLoading: true, values: [0, 0] };
    expect(result).toEqual(expectResult);
  });

  it("should return failed when the project failed", () => {
    const projectToApiAnalysis: ProjectToApiAnalysis = {
      "/test/testproject": Failed("test")
    };
    const result = getCompatibleApi(Loaded(solutionDetails), projectToApiAnalysis, null, sourceFile);
    const expectResult = { failureCount: 1, isApisLoading: false, values: [0, 0] };
    expect(result).toEqual(expectResult);
  });

  it("should return value with 2 when the souceFile is null", () => {
    const result = getCompatibleApi(Loaded(solutionDetails), projectToApiAnalysis, projectPath, null);
    const expectResult = { failureCount: 0, isApisLoading: false, values: [1, 2] };
    expect(result).toEqual(expectResult);
  });

  it("should return failureCount 1 when there is no match path", () => {
    const project: Project = {
      projectName: "testProject",
      projectFilePath: "/test/test",
      projectGuid: "xxxx",
      projectReferences: [{ referencePath: "/test/a" }, { referencePath: "/test/b" }],
      targetFrameworks: ["net6.0"],
      packageReferences: [{ packageId: "testpackage", version: "3.0.0" }],
      isBuildFailed: false
    };
    const solutionDetails: SolutionDetails = {
      solutionName: "testSolution",
      solutionFilePath: "/test/testSoluiton.sln",
      failedProjects: [],
      projects: [project]
    };
    const result = getCompatibleApi(Loaded(solutionDetails), projectToApiAnalysis, projectPath, sourceFile);
    const expectResult = { failureCount: 1, isApisLoading: false, values: [0, 0] };
    expect(result).toEqual(expectResult);
  });

  it("should return 0 value when there is no compatible Api", () => {
    const projectToApiAnalysis: ProjectToApiAnalysis = {
      "/test/testproject": Loaded({
        solutionFile: "/test.sln",
        projectFile: "/test/testproject",
        errors: [],
        sourceFileAnalysisResults: [
          {
            sourceFileName: "get.ts",
            sourceFilePath: "/test/testproject/get.ts",
            apiAnalysisResults: [
              {
                codeEntityDetails: {
                  codeEntityType: "Namespace",
                  namespace: "test",
                  signature: "get",
                  originalDefinition: "abc",
                  textSpan: {
                    startCharPosition: 1,
                    endCharPosition: 10,
                    startLinePosition: 13,
                    endLinePosition: 24
                  },
                  name: "get_call",
                  package: {
                    packageId: "testpackage",
                    version: "2.9.0"
                  }
                },
                compatibilityResults: {
                  "net6.0": {
                    compatibility: "INCOMPATIBLE",
                    compatibleVersions: ["3.0.0"]
                  }
                },
                recommendations: {
                  recommendedActions: [noRecommendations]
                }
              }
            ],
            recommendedActions: [
              {
                recommendedActionType: "UpgradePackage",
                description: "test",
                textSpan: {
                  startCharPosition: 1,
                  endCharPosition: 10,
                  startLinePosition: 13,
                  endLinePosition: 24
                },
                targetCPU: ["x86", "64", "arm"]
              }
            ]
          }
        ]
      })
    };
    const result = getCompatibleApi(Loaded(solutionDetails), projectToApiAnalysis, projectPath, sourceFile);
    const expectResult = { failureCount: 0, isApisLoading: false, values: [0, 1] };
    expect(result).toEqual(expectResult);
  });

  it("should return null when the apiIsLoading", () => {
    const result = getCompatibleApi(
      Loaded(solutionDetails),
      { "/test/testproject": Loading<ProjectApiAnalysisResult>() },
      projectPath,
      sourceFile
    );
    const expectResult = { failureCount: 0, isApisLoading: true, values: [0, 0] };
    expect(result).toEqual(expectResult);
  });

  it("should return isApiLoading true when testpackage is loading", () => {
    const result = getCompatibleApi(Loaded(solutionDetails), projectToApiAnalysis, "/test/loading", sourceFile);
    const expectResult = { failureCount: 0, isApisLoading: true, values: [0, 0] };
    expect(result).toEqual(expectResult);
  });

  it("should return isloading when testpackage is failed", () => {
    const result = getCompatibleApi(Loaded(solutionDetails), projectToApiAnalysis, "/test/failed", sourceFile);
    const expectResult = { failureCount: 0, isApisLoading: true, values: [0, 0] };
    expect(result).toEqual(expectResult);
  });
});

describe("getCompatibleNuget.ts", () => {
  const nugetPackages = [
    { packageId: "testpackage", version: "3.0.0" },
    { packageId: "test", version: "1.1.0" },
    { packageId: "errorpackage" }
  ];
  const packageToNugetPackage: PackageToPackageAnalysisResult = {
    "testpackage-3.0.0": Loaded(packageAnalysisResultWithDate),
    "test-1.1.0": Loaded(packageAnalysisResult)
  };
  jest.spyOn(window.electron, "getState").mockReturnValue("net6.0");

  it("should return 1 compatible and 1 incompatiible", () => {
    const result = getCompatibleNugetsAgg(nugetPackages, packageToNugetPackage);
    const expectResult = {
      isAllNugetLoaded: true,
      nugetAggregates: {
        compatible: 1,
        incompatible: 1,
        unknown: 0
      }
    };
    expect(result).toEqual(expectResult);
    expect(getIncompatibleNugets(packageToNugetPackage, nugetPackages)).toEqual(1);
  });

  it("should return false for isAllNugetLoaded when package 'xxxx' is random", () => {
    nugetPackages.push({ packageId: "xxxx", version: "1.0.0" });
    const result = getCompatibleNugetsAgg(nugetPackages, packageToNugetPackage);
    const expectResult = {
      isAllNugetLoaded: false,
      nugetAggregates: {
        compatible: 0,
        incompatible: 0,
        unknown: 0
      }
    };
    expect(result).toEqual(expectResult);
    expect(getIncompatibleNugets(packageToNugetPackage, nugetPackages)).toBeNull();
  });

  it("should return isAllNugetLoading is false", () => {
    const result = getCompatibleNugetsAgg([{ packageId: "test", version: "1.1.0" }], {
      "test-1.1.0": Failed<PackageAnalysisResult>("failed")
    });
    const expectResult = {
      isAllNugetLoaded: false,
      nugetAggregates: {
        compatible: 0,
        incompatible: 0,
        unknown: 0
      }
    };
    expect(result).toEqual(expectResult);
    expect(getIncompatibleNugets(packageToNugetPackage, nugetPackages)).toBeNull();
  });

  it("should return empty when there is no compatiblitiy result", () => {
    const nugetAnalysisResult = {
      "test-1.1.0": Loaded({} as PackageAnalysisResult)
    };
    const result = getCompatibleNugetsAgg([{ packageId: "test", version: "1.1.0" }], nugetAnalysisResult);
    const expectResult = {
      isAllNugetLoaded: true,
      nugetAggregates: {
        compatible: 0,
        incompatible: 0,
        unknown: 0
      }
    };
    expect(result).toEqual(expectResult);
    expect(getIncompatibleNugets(packageToNugetPackage, nugetPackages)).toBeNull();
  });
});

describe("getPercent", () => {
  it("should return 5/10 = 50 percent when denominator is not zero", () => {
    const result = getPercent(5, 10);
    const expectResult = "50%";
    expect(result).toEqual(expectResult);
    expect(getPercentNumber(5, 10)).toEqual(50);
  });

  it("should return - when denominator is zero", () => {
    const result = getPercent(5, 0);
    const expectResult = "-";
    expect(result).toEqual(expectResult);
    expect(getPercentNumber(5, 0)).toEqual(null);
  });
});

describe("getPortingSolutionPath", () => {
  jest.spyOn(window.electron, "joinPaths");
  it("inplace porting", () => {
    const result = getPortingSolutionPath(solutionDetails, inplacePorting);
    const expectResult = solutionDetails.solutionFilePath;
    expect(result).toEqual(expectResult);
  });

  it("copy porting", () => {
    const result = getPortingSolutionPath(solutionDetails, copyPorting);
    const expectResult = "/test/mock/path";
    expect(result).toEqual(expectResult);
  });
});

describe("isPortingCompleted", () => {
  jest.spyOn(window.electron, "getRelativePath");
  it("should return complete when porting project is complete", () => {
    var project: Project = {
      projectName: "testProject",
      projectFilePath: "/test/testproject",
      projectGuid: "xxxx",
      projectReferences: [{ referencePath: "/test/a" }, { referencePath: "/test/b" }],
      targetFrameworks: ["netframework4.5"],
      packageReferences: [{ packageId: "testpackage", version: "3.0.0" }],
      isBuildFailed: false
    };
    var portingProjects: PortingProjects = {
      "/test/path": {
        projectPath: "/test/path",
        steps: {
          projectFileStep: "complete"
        }
      }
    };
    const result = isPortingCompleted("/test/soluton.sln", project, portingProjects);
    expect(result).toEqual(true);
  });
  it("should return complete when targetFramework is net6.0", () => {
    var project: Project = {
      projectName: "testProject",
      projectFilePath: "/test/testproject",
      projectGuid: "xxxx",
      projectReferences: [{ referencePath: "/test/a" }, { referencePath: "/test/b" }],
      targetFrameworks: ["net6.0"],
      packageReferences: [{ packageId: "testpackage", version: "3.0.0" }],
      isBuildFailed: false
    };
    var portingProjects: PortingProjects = {
      "test/solution": {
        projectPath: "/test/testproject"
      }
    };
    const result = isPortingCompleted("test/path", project, portingProjects);
    expect(result).toEqual(true);
  });
  it("should return incomplete", () => {
    var project: Project = {
      projectName: "testProject",
      projectFilePath: "/test/testproject",
      projectGuid: "xxxx",
      projectReferences: [{ referencePath: "/test/a" }, { referencePath: "/test/b" }],
      targetFrameworks: ["xxx"],
      packageReferences: [{ packageId: "testpackage", version: "3.0.0" }],
      isBuildFailed: false
    };
    var portingProjects: PortingProjects = {
      "test/solution": {
        projectPath: "/test/testproject"
      }
    };
    const result = isPortingCompleted("/test/solution.sln", project, portingProjects);
    expect(result).toEqual(false);
  });
});

describe("NugetPackageKey", () => {
  it("should match nuget package key", () => {
    const result = nugetPackageKey("testpackage", "3.0.0");
    expect(result).toEqual("testpackage-3.0.0");
  });
});

describe("getPortingPath", () => {
  const mockRelativePath = jest.spyOn(window.electron, "getRelativePath").mockReturnValue("/test/path");
  const mockJoinPath = jest.spyOn(window.electron, "joinPaths").mockReturnValue("/test/mock/path");

  it("inplace porting", () => {
    const result = getPortingPath(solutionDetails, project, inplacePorting);
    const expectResult = project.projectFilePath;
    expect(result).toEqual(expectResult);
    expect(mockRelativePath).toHaveBeenCalledWith(solutionDetails.solutionFilePath, project.projectFilePath);
  });
  it("copy porting", () => {
    const result = getPortingPath(solutionDetails, project, copyPorting);
    const expectResult = "/test/mock/path";
    expect(result).toEqual(expectResult);
    expect(mockRelativePath).toHaveBeenCalledWith(solutionDetails.solutionFilePath, project.projectFilePath);
    expect(mockJoinPath).toHaveBeenCalledWith(copyPorting.workingDirectory, "/test/path");
  });
});

describe("CompareSemver", () => {
  it("3.0.0 should be greater than 2.0.0", () => {
    expect(compareSemver("3.0.0", "2.0.0")).toEqual(1);
  });
  it("test invalided", () => {
    const result = compareSemver("a", "b");
    expect(result).toEqual(-1);
  });
  it("test version is invalid", () => {
    expect(compareSemver("a", "3.0.0")).toEqual(-1);
  });
  it("test target version is invalid", () => {
    expect(compareSemver("3.0.0", "b")).toEqual(1);
  });
});

describe("checkPackageExists", () => {
  it("Azure.ImageOptimizer, version 1.1.0.39, does exist", async () => {
    const result = await checkPackageExists("Azure.ImageOptimizer", "1.1.0.39");
    expect(result).toBeTruthy();
  });

  it("Foo.Bar.Foo, version 0.0.0, does not exist", async () => {
    const result = await checkPackageExists("Foo.Bar.Foo", "0.0.0");
    expect(result).toBeFalsy();
  });

  it("Azure.ImageOptimizer, latest version, does exist", async () => {
    const result = await checkPackageExists("Azure.ImageOptimizer");
    expect(result).toBeTruthy();
  });

  it("Foo.Bar.Foo, latest version, does not exist", async () => {
    const result = await checkPackageExists("Foo.Bar.Foo");
    expect(result).toBeFalsy();
  });
});

describe("validateVersion", () => {
  it("1.0.0, valid SemVer", () => {
    expect(validateVersion("1.0.0")).toBeTruthy();
  });

  it("ajsdbnjasdajsn, invalid SemVer", () => {
    expect(validateVersion("ajsdbnjasdajsn")).toBeFalsy();
  });

  it("1.2.3-prerelease+build, valid SemVer", () => {
    expect(validateVersion("1.2.3-prerelease+build")).toBeTruthy();
  });

  it("vsdfs1.2.3, invalid SemVer", () => {
    expect(validateVersion("vsdfs1.2.3")).toBeFalsy();
  });
});

describe("validatePackageInput", () => {
  it("Azure.ImageOptimizer, version 1.1.0.39, does exist", async () => {
    const submission: PackageContribution = {
      packageNameSource: "",
      packageVersionSource: "",
      packageName: "Azure.ImageOptimizer",
      packageVersion: "1.1.0.39",
      packageVersionLatest: false,
      targetFramework: [{ label: "", value: "" }],
      comments: ""
    };
    const result = await validatePackageInput(submission);
    expect(result).toEqual({
      valid: true
    });
  });

  it("Foo.Bar.Foo, version 0.0.0, does not exist", async () => {
    const submission: PackageContribution = {
      packageNameSource: "",
      packageVersionSource: "",
      packageName: "Foo.Bar.Foo",
      packageVersion: "0.0.0",
      packageVersionLatest: false,
      targetFramework: [{ label: "", value: "" }],
      comments: ""
    };
    const result = await validatePackageInput(submission);
    expect(result).toEqual({
      valid: false,
      field: "packageName/packageVersion",
      message: "Package/version combination not found"
    });
  });

  it("Azure.ImageOptimizer, latest version, does exist", async () => {
    const submission: PackageContribution = {
      packageNameSource: "",
      packageVersionSource: "",
      packageName: "Azure.ImageOptimizer",
      packageVersion: "",
      packageVersionLatest: true,
      targetFramework: [{ label: "", value: "" }],
      comments: ""
    };
    const result = await validatePackageInput(submission);
    expect(result).toEqual({
      valid: true
    });
  });

  it("Foo.Bar.Foo, latest version, does not exist", async () => {
    const submission: PackageContribution = {
      packageNameSource: "",
      packageVersionSource: "",
      packageName: "Foo.Bar.Foo",
      packageVersion: "",
      packageVersionLatest: true,
      targetFramework: [{ label: "", value: "" }],
      comments: ""
    };
    const result = await validatePackageInput(submission);
    expect(result).toEqual({
      valid: false,
      field: "packageName",
      message: "Package not found"
    });
  });

  it("Azure.ImageOptimizer, version asndjas332, invalid SemVer", async () => {
    const submission: PackageContribution = {
      packageNameSource: "",
      packageVersionSource: "",
      packageName: "Azure.ImageOptimizer",
      packageVersion: "asndjas332",
      packageVersionLatest: false,
      targetFramework: [{ label: "", value: "" }],
      comments: ""
    };
    const result = await validatePackageInput(submission);
    expect(result).toEqual({
      valid: false,
      field: "packageVersion",
      message: "Invalid version format (SemVer)"
    });
  });

  it("Azure.ImageOptimizer, empty version, version required", async () => {
    const submission: PackageContribution = {
      packageNameSource: "",
      packageVersionSource: "",
      packageName: "Azure.ImageOptimizer",
      packageVersion: "",
      packageVersionLatest: false,
      targetFramework: [{ label: "", value: "" }],
      comments: ""
    };
    const result = await validatePackageInput(submission);
    expect(result).toEqual({
      valid: false,
      field: "packageVersion",
      message: "Required"
    });
  });

  it("Azure.ImageOptimizer, version 9.9.9, does not exist", async () => {
    const submission: PackageContribution = {
      packageNameSource: "",
      packageVersionSource: "",
      packageName: "Azure.ImageOptimizer",
      packageVersion: "9.9.9",
      packageVersionLatest: false,
      targetFramework: [{ label: "", value: "" }],
      comments: ""
    };
    const result = await validatePackageInput(submission);
    expect(result).toEqual({
      valid: false,
      field: "packageName/packageVersion",
      message: "Package/version combination not found"
    });
  });
});

describe("vbProjectCheck", () => {
    it("vbProject returns True", async () => {
        const solutionPath = path.join(__dirname + "/resources/VBTestProject.sln");
        const result = await checkIfSolutionContainsVBproject(solutionPath);
        expect(result).toEqual(true);
    });

    it("non vbProject returns False", async () => {
        const solutionPath = path.join(__dirname + "/resources/NopCommerce.sln");
        const result = await checkIfSolutionContainsVBproject(solutionPath);
        expect(result).toEqual(false);
    });
});