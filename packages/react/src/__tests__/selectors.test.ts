import { createStore } from "redux";
import  uuid  from 'uuid';

import { ApiAnalysisResult, Project, ProjectApiAnalysisResult, SourceFileToContents } from "../../src/models/project";
import { createRootReducer } from "../../src/store/reducers";
import { RootState } from "../../src/store/reducers";
import { Backend, Electron, Porting } from "../bootstrapElectron";
import { ApiTableData } from "../components/AssessShared/ApiTable";
import { SourceFile } from "../components/AssessShared/FileTable";
import { NugetPackageTableFields } from "../components/AssessShared/NugetPackageTable";
import { TableData } from "../components/AssessSolution/ProjectsTable";
import { DashboardTableData } from "../components/Dashboard/DashboardTable";
import { internetAccessFailed } from "../constants/messages";
import {
  apiAnalysisResult1,
  completePortingProject,
  copyPorting,
  packageAnalysisResult,
  packageAnalysisResultWithDate,
  packageRecommendations,
  project,
  projectAnalysisResult,
  recommendedaction,
  reloadingproject,
  solutionDetails,
  solutionToApiAnalysis,
  solutionToPortingLocation,
  solutionToPortingProjects,
  solutionToProjects,
  sourceFiletoContents,
  tools
} from "../mockData";
import { SolutionDetails } from "../models/solution";
import { pushCurrentMessageUpdate, pushPendingMessageUpdate } from "../store/actions/error";
import { currentMessages, pendingMessages } from "../store/selectors/messageSelectors";
import {
  selectPortingLocation,
  selectPortingProject,
  selectPortingProjects,
  selectPortingProjectsInSolution
} from "../store/selectors/portingSelectors";
import {
  selectApiAnalysis,
  selectCurrentProject,
  selectCurrentProjectApiAnalysis,
  selectCurrentSolutionApiAnalysis,
  selectCurrentSolutionPath,
  selectCurrentSourceFileInvocations,
  selectCurrentSourceFilePath,
  selectCurrentSourceFilePortingActions,
  selectNugetPackages,
  selectProjects,
  selectSolutionToSolutionDetails,
  selectSourceFileContents
} from "../store/selectors/solutionSelectors";
import {
  getApiCounts,
  getNugetCounts,
  getProjectIfExists,
  portedProjects,
  selectApiTableData,
  selectDashboardTableData,
  selectFileTableData,
  selectNugetTableData,
  selectProjectTableData
} from "../store/selectors/tableSelectors";
import { selectHelpInfo } from "../store/selectors/toolsSelectors";
import { checkInternetAccess } from "../utils/checkInternetAccess";
import { filteringCountText } from "../utils/FilteringCountText";
import { Failed, Loaded, Loading, Reloading } from "../utils/Loadable";

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

const getFakeState = (): Partial<RootState> => {
  return {
    solution: {
      solutionToSolutionDetails: solutionToProjects,
      apiAnalysis: solutionToApiAnalysis,
      profileSet: true
    },
    nugetPackage: {
      nugets: { "test-1.1.0": Loaded(packageAnalysisResult) }
    },
    file: {
      sourceFileToContents: {} as SourceFileToContents
    },
    porting: {
      portingLocations: solutionToPortingLocation,
      portingProjects: solutionToPortingProjects
    },
    error: {
      pendingMessages: [],
      currentMessages: []
    },
    tools: tools
  };
};

const store = createStore(createRootReducer(), getFakeState());
const dispatch = store.dispatch;

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

describe("messageSelectors", () => {
  it("pendingMessages", () => {
    dispatch(pushPendingMessageUpdate({ messageId: "id1", type: "info", content: "pending", dismissible: true }));
    const pendingMessagesUpdates = pendingMessages(store.getState());
    const expectResult = [{ messageId: "id1", type: "info", content: "pending", dismissible: true }];
    expect(pendingMessagesUpdates).toEqual(expectResult);
  });
  it("currentMessages", () => {
    dispatch(pushCurrentMessageUpdate({ messageId: "id2", type: "info", content: "current", dismissible: true }));
    const currentMessagesUpdates = currentMessages(store.getState());
    const expectResult = [{ messageId: "id2", type: "info", content: "current", dismissible: true }];
    expect(currentMessagesUpdates).toEqual(expectResult);
  });
});

describe("portingSelectors", () => {
  window.electron = {
    getRelativePath: () => "/test/testproject",
    joinPaths: () => "/test/mock/path"
  } as any;

  it("selecPortingProjects", () => {
    const result = selectPortingProjects(store.getState());
    const expectResult = solutionToPortingProjects;
    expect(result).toEqual(expectResult);
  });
  it("selectPortingLocation", () => {
    const result = selectPortingLocation(store.getState(), "/solutions/" + encodeURIComponent("/test/solution"));
    expect(result).toEqual(copyPorting);
  });
  it("selectPortingLocation return null", () => {
    const result = selectPortingLocation(store.getState(), "/solutions/" + encodeURIComponent("/test/solution"));
    expect(result).toEqual(copyPorting);
  });
  it("selectPortingProjectsInSolution", () => {
    const result = selectPortingProjectsInSolution(
      store.getState(),
      "/solutions/" + encodeURIComponent("/test/solution")
    );
    expect(result).toEqual({ "/test/testproject": completePortingProject });
  });
  it("selectPortingProject", () => {
    const result = selectPortingProject(
      store.getState(),
      "/solutions/" + encodeURIComponent("/test/solution") + "/" + encodeURIComponent("/test/testproject")
    );
    expect(result).toEqual(completePortingProject);
  });

  it("should return null when the current project is loading", () => {
    const result = selectPortingProject(
      store.getState(),
      "/solutions/" + encodeURIComponent("/test/loading") + "/" + encodeURIComponent("/test/testproject")
    );
    expect(result).toBeNull();
  });
  it("should return null when there is no porting project match", () => {
    const result = selectPortingProject(
      store.getState(),
      "/solutions/" + encodeURIComponent("/test/porting") + "/" + encodeURIComponent("/test/testproject")
    );
    expect(result).toBeNull();
  });
});

describe("solutionSelectors", () => {
  it("selectoSolutions", () => {
    const result = selectSolutionToSolutionDetails(store.getState());
    const expectResult = store.getState().solution.solutionToSolutionDetails;
    expect(result).toEqual(expectResult);
  });

  it("selectSolutionToProjects", () => {
    const result = selectApiAnalysis(store.getState());
    const expectResult = store.getState().solution.apiAnalysis;
    expect(result).toEqual(expectResult);
  });

  it("selectNugetPackages", () => {
    const result = selectNugetPackages(store.getState());
    const expectResult = store.getState().nugetPackage.nugets;
    expect(result).toEqual(expectResult);
  });

  it("selectSourceFileContents", () => {
    const result = selectSourceFileContents(store.getState());
    const expectResult = store.getState().file.sourceFileToContents;
    expect(result).toEqual(expectResult);
  });

  it("selectCurrentSolutionPath", () => {
    const result = selectCurrentSolutionPath(store.getState(), "/solutions/" + encodeURIComponent("/test/solution"));
    const expectResult = "/test/solution";
    expect(result).toEqual(expectResult);
  });

  it("selectCurrentSolutionPath without match", () => {
    expect(() => selectCurrentSolutionPath(store.getState(), "/solutions/")).toThrow(
      "Path: /solutions/ does not match expected path"
    );
  });

  it("selctProjects should return loading when cannot find match project", () => {
    const result = selectProjects(store.getState(), "/solutions/" + encodeURIComponent("/test"));
    expect(result).toEqual(Loading<Project[]>());
  });

  it("selctProjects should return loading when project is undefied", () => {
    const result = selectProjects(store.getState(), "/solutions/" + encodeURIComponent("/test/truereloading"));
    expect(result).toEqual(
      Reloading<Project[]>([reloadingproject])
    );
  });

  it("selectCurrentSolutionApiAnalysis", () => {
    const result = selectCurrentSolutionApiAnalysis(
      store.getState(),
      "/solutions/" + encodeURIComponent("/test/solution")
    );
    const expectResult = solutionToApiAnalysis["/test/solution"];
    expect(result).toEqual(expectResult);
  });

  it("selectCurrentProject", () => {
    const result = selectCurrentProject(
      store.getState(),
      "/solutions/" + encodeURIComponent("/test/solution") + "/" + encodeURIComponent("/test/testproject")
    );
    const expectResult = project;
    expect(result).toEqual(Loaded(expectResult));
  });

  it("selectCurrentProject should return path does not match error", () => {
    expect(() => {
      selectCurrentProject(store.getState(), "/solutions/" + encodeURIComponent("/test/solution"));
    }).toThrowError(`Path: /solutions/${encodeURIComponent("/test/solution")} does not match expected path`);
  });

  it("selectCurrentProject should return loading when project is loading", () => {
    const result = selectCurrentProject(
      store.getState(),
      "/solutions/" + encodeURIComponent("/test/loading") + "/" + encodeURIComponent("/test/testproject")
    );
    const expectResult = Loading<Project>();
    expect(result).toEqual(expectResult);
  });

  it("selectCurrentProject should return loading when project path do not match", () => {
    const result = selectCurrentProject(
      store.getState(),
      "/solutions/" + encodeURIComponent("/test/truereloading") + "/" + encodeURIComponent("/test/test")
    );
    const expectResult = Loading<Project>();
    expect(result).toEqual(expectResult);
  });

  it("selectCurrentProject should return reloading when project is reloading", () => {
    const result = selectCurrentProject(
      store.getState(),
      "/solutions/" + encodeURIComponent("/test/truereloading") + "/" + encodeURIComponent("/test/reloading")
    );
    const expectResult = Reloading<Project>(reloadingproject);
    expect(result).toEqual(expectResult);
  });

  it("selectCurrentProject should return failed when project is failed", () => {
    const result = selectCurrentProject(
      store.getState(),
      "/solutions/" + encodeURIComponent("/test/fail") + "/" + encodeURIComponent("/test/testproject")
    );
    const expectResult = Failed("error");
    expect(result).toEqual(expectResult);
  });

  it("selectCurrentProject should return cannot find project on path", () => {
    expect(() => {
      selectCurrentProject(
        store.getState(),
        "/solutions/" + encodeURIComponent("/test/solution") + "/" + encodeURIComponent("test")
      );
    }).toThrowError("Cannot find project on path test");
  });

  it("selectCurrentPorjectApiAnalysis", () => {
    const state = store.getState();
    const result = selectCurrentProjectApiAnalysis(
      state,
      "/solutions/" + encodeURIComponent("/test/solution") + "/" + encodeURIComponent("/test/testproject")
    );
    expect(result).toEqual(Loaded(projectAnalysisResult));
  });

  it("selectCurrentPorjectApiAnalysis with reloading", () => {
    const state = store.getState();
    const result = selectCurrentProjectApiAnalysis(
      state,
      "/solutions/" + encodeURIComponent("/test/reloading") + "/" + encodeURIComponent("/test/reloading")
    );
    expect(result).toEqual(Loading<ProjectApiAnalysisResult>());
  });

  it("selectCurrentSourceFileInvocations", () => {
    const result = selectCurrentSourceFileInvocations(
      store.getState(),
      "/solutions/" +
        encodeURIComponent("/test/solution") +
        "/" +
        encodeURIComponent("/test/testproject") +
        "/" +
        encodeURIComponent("/test/testproject/get.ts")
    );
    const expectResult = Loaded([apiAnalysisResult1]);
    expect(result).toEqual(expectResult);
  });

  it("selectCurrentSourceFileInvocations throw exception", () => {
    const testpath =
      "/solutions/" + encodeURIComponent("/test/solution") + "/" + encodeURIComponent("/test/testproject");

    expect(() => {
      selectCurrentSourceFileInvocations(store.getState(), testpath);
    }).toThrowError(`Path: ${testpath} does not match expected path.`);
  });
  it("selectCurrentSourceFileInvocations should return loading when apiAnalysis is loading", () => {
    const result = selectCurrentSourceFileInvocations(
      store.getState(),
      "/solutions/" +
        encodeURIComponent("/test/loading") +
        "/" +
        encodeURIComponent("/test/loading") +
        "/" +
        encodeURIComponent("/test/testproject/get.ts")
    );
    const expectResult = Loading<ApiAnalysisResult[]>();
    expect(result).toEqual(expectResult);
  });

  it("selectCurrentSourceFileInvocations should return failed when apiAnalysis is failed", () => {
    const result = selectCurrentSourceFileInvocations(
      store.getState(),
      "/solutions/" +
        encodeURIComponent("/test/solution") +
        "/" +
        encodeURIComponent("/test/failed") +
        "/" +
        encodeURIComponent("/test/testproject/get.ts")
    );
    const expectResult = Failed("error", "error");
    expect(result).toEqual(expectResult);
  });

  it("selectCurrentSourceFileInvocations should return reloading when invocation is reloading", () => {
    const result = selectCurrentSourceFileInvocations(
      store.getState(),
      "/solutions/" +
        encodeURIComponent("/test/solution") +
        "/" +
        encodeURIComponent("/test/reloading") +
        "/" +
        encodeURIComponent("/test/testproject/get.ts")
    );
    const expectResult = Reloading([apiAnalysisResult1]);
    expect(result).toEqual(expectResult);
  });

  it("selectCurrentSourceFileInvocations should return loading when cannot find invocation wiht expect sourcefile", () => {
    const result = selectCurrentSourceFileInvocations(
      store.getState(),
      "/solutions/" +
        encodeURIComponent("/test/solution") +
        "/" +
        encodeURIComponent("/test/testproject") +
        "/" +
        encodeURIComponent("/test/testproject/failed")
    );
    const expectResult = Loading<ApiAnalysisResult[]>();
    expect(result).toEqual(expectResult);
  });

  it("selectCurrentSourceFilePortingActions", () => {
    const result = selectCurrentSourceFilePortingActions(
      store.getState(),
      "/solutions/" +
        encodeURIComponent("/test/solution") +
        "/" +
        encodeURIComponent("/test/testproject") +
        "/" +
        encodeURIComponent("/test/testproject/get.ts")
    );
    const expectResult = Loaded([recommendedaction]);
    expect(result).toEqual(expectResult);
  });

  it("selectCurrentSourceFilePortingActions should return failed when apiAnalysis is failed", () => {
    const result = selectCurrentSourceFileInvocations(
      store.getState(),
      "/solutions/" +
        encodeURIComponent("/test/solution") +
        "/" +
        encodeURIComponent("/test/failed") +
        "/" +
        encodeURIComponent("/test/testproject/get.ts")
    );
    const expectResult = Failed("error", "error");
    expect(result).toEqual(expectResult);
  });

  it("selectCurrentSourceFilePortingActions should return reloading when invocation is reloading", () => {
    const result = selectCurrentSourceFileInvocations(
      store.getState(),
      "/solutions/" +
        encodeURIComponent("/test/solution") +
        "/" +
        encodeURIComponent("/test/reloading") +
        "/" +
        encodeURIComponent("/test/testproject/get.ts")
    );
    const expectResult = Reloading([apiAnalysisResult1]);
    expect(result).toEqual(expectResult);
  });

  it("selectCurrentSourceFilePortingActions should return loading when cannot find invocation wiht expect sourcefile", () => {
    const result = selectCurrentSourceFileInvocations(
      store.getState(),
      "/solutions/" +
        encodeURIComponent("/test/solution") +
        "/" +
        encodeURIComponent("/test/testproject") +
        "/" +
        encodeURIComponent("/test/testproject/failed")
    );
    const expectResult = Loading<ApiAnalysisResult[]>();
    expect(result).toEqual(expectResult);
  });

  it("selectCurrentSourceFilePath", () => {
    const result = selectCurrentSourceFilePath(
      store.getState(),
      "/solutions/" +
        encodeURIComponent("/test/solution") +
        "/" +
        encodeURIComponent("/test/reloading") +
        "/" +
        encodeURIComponent("/test/testproject/get.ts")
    );
    const expectResult = "/test/testproject/get.ts";
    expect(result).toEqual(expectResult);
  });

  it("selectCurrentSourceFilePath through errors", () => {
    expect(() =>
      selectCurrentSourceFilePath(
        store.getState(),
        "/solutions/" + encodeURIComponent("/test/solution") + "/" + encodeURIComponent("/test/reloading")
      )
    ).toThrow();
  });
});

describe("toolselctors", () => {
  it("selectHelpInfo", () => {
    const result = selectHelpInfo(store.getState());
    const expectResult = tools;
    expect(result).toEqual(expectResult);
  });
});

describe("tableSelectors utils apis", () => {
  window.electron.getState = jest.fn();
  jest.spyOn(window.electron, "getState").mockReturnValue("netcoreapp3.1");

  it("poretedProjects with one ported projects", () => {
    const result = portedProjects(
      solutionDetails,
      { "/test/testsolution": Loaded(solutionDetails) },
      { "/test/testsolution": { projectPath: "", steps: { projectFileStep: "complete" } } }
    );
    expect(result).toEqual(1);
  });

  it("poretedProjects with loading projects", () => {
    const result = portedProjects(solutionDetails, { "/test/solution": Loading() }, {} as any);
    expect(result).toEqual(0);
  });

  it("poretedProjects with empty solutionFilePath", () => {
    const result = portedProjects({} as SolutionDetails, { "/test/solution": Loading() }, {} as any);
    expect(result).toEqual(0);
  });

  it("getApiCounts with normal project", () => {
    const result = getApiCounts(
      "/test/solution",
      { "/test/solution": { "/test/testproject": Loaded(projectAnalysisResult) } },
      Loaded(solutionDetails),
      "netcoreapp3.1"
    );
    expect(result).toStrictEqual([1, 2]);
  });

  it("getApiCounts with zero project", () => {
    const result = getApiCounts(
      "/test/solution",
      solutionToApiAnalysis,
      Loaded({
        solutionName: "testsolution",
        solutionFilePath: "/test/testsolution",
        failedProjects: [""],
        projects: []
      }),
      "netcoreapp3.1"
    );
    expect(result).toStrictEqual([0, 0]);
  });

  it("getApiCounts with no avalible api analysis", () => {
    const result = getApiCounts("/test/solution", solutionToApiAnalysis, Loaded(solutionDetails), "netcoreapp3.1");
    expect(result).toBeNull();
  });

  it("getApiCounts with wrong solution path", () => {
    const result = getApiCounts("/test/wrongpath", solutionToApiAnalysis, Loaded(solutionDetails), "netcoreapp3.1");
    expect(result).toBeNull();
  });

  it("getNugetCounts with normal solution", () => {
    const result = getNugetCounts(
      "/test/solution",
      {
        "/test/solution": Loaded({
          solutionName: "testsolution",
          solutionFilePath: "/test/testsolution",
          failedProjects: [""],
          projects: [project]
        })
      },
      { "testpackage-3.0.0": Loaded(packageAnalysisResultWithDate) }
    );
    expect(result).toStrictEqual([1, 1]);
  });

  it("getNugetCounts with unloaded solution", () => {
    const result = getNugetCounts(
      "/test/solution",
      { "/test/solution": Loading() },
      { testpackage: Loaded(packageAnalysisResultWithDate) }
    );
    expect(result).toBeNull();
  });

  it("getNugetCounts with unloaded project", () => {
    const result = getNugetCounts(
      "/test/solution",
      { "/test/solution": Loaded(solutionDetails) },
      { testpackage: Loaded(packageAnalysisResultWithDate) }
    );
    expect(result).toBeNull();
  });

  it("getNugetCounts with unloaded not all loaded nugets", () => {
    const result = getNugetCounts(
      "/test/solution",
      {
        "/test/solution": Loaded(solutionDetails)
      },
      { testpackage: Loading() }
    );
    expect(result).toBeNull();
  });

  it("getProjectIfExist with none match path", () => {
    const result = getProjectIfExists({} as any, "xdfdsafa");
    expect(result).toBeNull();
  });
});

describe("selectDashboardTableData", () => {
  window.electron.getState = jest.fn();
  jest.spyOn(window.electron, "getState").mockReturnValue("netcoreapp3.1");

  const fakeStoreData: Partial<RootState> = {
    solution: {
      solutionToSolutionDetails: {
        "/test/solution": Loaded({
          solutionName: "testsolution",
          solutionFilePath: "/test/testsolution",
          failedProjects: [""],
          projects: [project, reloadingproject]
        })
      },
      apiAnalysis: { "/test/solution": { "/test/testproject": Loaded(projectAnalysisResult) } },
      profileSet: true
    },
    nugetPackage: {
      nugets: {
        "testpackage-3.0.0": Loaded({
          packageVersionPair: {
            packageId: "testpackage",
            version: "3.0.0"
          },
          compatibilityResults: {
            "netcoreapp3.1": {
              compatibility: "COMPATIBLE",
              compatibleVersions: ["3.1.0", "3.0.0"]
            }
          },
          recommendations: packageRecommendations,
          lastRequestDate: "2020/6/18/12:12:00"
        })
      }
    },
    file: {
      sourceFileToContents: sourceFiletoContents
    },
    porting: {
      portingLocations: solutionToPortingLocation,
      portingProjects: solutionToPortingProjects
    },
    error: {
      pendingMessages: [],
      currentMessages: []
    },
    tools: tools
  };
  const mockStore = createStore(createRootReducer(), fakeStoreData);

  it("selectDashboardTableData", () => {
    const result = selectDashboardTableData(mockStore.getState());
    const expectResult: DashboardTableData[] = [
      {
        name: "testsolution",
        path: "/test/testsolution",
        portedProjects: 0,
        totalProjects: 2,
        incompatiblePackages: 0,
        totalPackages: 1,
        incompatibleApis: 1,
        totalApis: 2,
        portingActions: 2,
        buildErrors: 1,
        failed: false
      }
    ];
    expect(result).toEqual(expectResult);
  });

  it("selectProjectTableData with unloaded solutions", () => {
    const fakeStore = createStore(createRootReducer(), {
      solution: {
        solutionToSolutionDetails: {
          "/test/solution": Loading<SolutionDetails>()
        },
        apiAnalysis: { "/test/solution": { "/test/testproject": Loaded(projectAnalysisResult) } },
        profileSet: true
      },
      nugetPackage: {
        nugets: {
          "testpackage-3.0.0": Loaded(packageAnalysisResultWithDate)
        }
      },
      file: {
        sourceFileToContents: sourceFiletoContents
      },
      porting: {
        portingLocations: solutionToPortingLocation,
        portingProjects: solutionToPortingProjects
      },
      error: {
        pendingMessages: [],
        currentMessages: []
      },
      tools: tools
    });
    const result = selectDashboardTableData(fakeStore.getState());
    expect(result).toEqual([{ name: "solution", path: "/test/solution" }]);
  });

  it("selectProjectTableData", () => {
    const result = selectProjectTableData(
      mockStore.getState(),
      "/solutions/" + encodeURIComponent("/test/solution") + "/" + encodeURIComponent("/test/testproject")
    );
    const expectResult: TableData[] = [
      {
        projectName: "testProject",
        projectPath: "/test/testproject",
        solutionPath: "/test/solution",
        targetFramework: "netcoreapp3.1",
        referencedProjects: 2,
        incompatibleApis: 1,
        incompatiblePackages: 0,
        totalPackages: 1,
        totalApis: 2,
        portingActions: 2,
        buildErrors: 1,
        ported: true,
        buildFailed: false
      },
      {
        projectName: "testfailedProject",
        projectPath: "/test/reloading",
        solutionPath: "/test/solution",
        targetFramework: "net48",
        referencedProjects: 2,
        incompatibleApis: null,
        incompatiblePackages: 0,
        totalPackages: 1,
        totalApis: 0,
        buildErrors: 0,
        portingActions: 0,
        ported: true,
        buildFailed: false
      }
    ];
    expect(result).toEqual(expectResult);
  });

  it("selectApiTableData", () => {
    const result = selectApiTableData(
      mockStore.getState(),
      "/solutions/" +
        encodeURIComponent("/test/solution") +
        "/" +
        encodeURIComponent("/test/testproject") +
        "/" +
        encodeURIComponent("/test/testproject/get.ts")
    );

    const expectResult: ApiTableData[] = [
      {
        apiName: "abcd",
        packageVersion: "3.0.0",
        packageName: "testpackage",
        calls: 1,
        deprecated: false,
        locations: [{ sourcefilePath: "/test/testproject/get.ts", location: 13 }],
        replacement: "",
        isCompatible: "COMPATIBLE",
        sourceFiles: new Set<string>(["get.ts"])
      },
      {
        apiName: "abcd",
        packageVersion: "1.0.0",
        packageName: "testpackage",
        calls: 1,
        deprecated: false,
        locations: [{ sourcefilePath: "/test/testproject/test.ts", location: 13 }],
        replacement: "test",
        isCompatible: "INCOMPATIBLE",
        sourceFiles: new Set<string>(["test.ts"])
      }
    ];
    expect(result).toEqual(expectResult);
  });

  it("selectApiTableData with failed project", () => {
    const fakeStore = createStore(createRootReducer(), {
      solution: {
        solutionToSolutionDetails: {
          "/test/solution": Loaded({
            solutionName: "testsolution",
            solutionFilePath: "/test/testsolution",
            failedProjects: [""],
            projects: [project, reloadingproject]
          })
        },
        apiAnalysis: { "/test/solution": { "/test/testproject": Failed<ProjectApiAnalysisResult>("failed") } },
        profileSet: true
      },
      nugetPackage: {
        nugets: {
          "testpackage-3.0.0": Loaded(packageAnalysisResultWithDate)
        }
      },
      file: {
        sourceFileToContents: sourceFiletoContents
      },
      porting: {
        portingLocations: solutionToPortingLocation,
        portingProjects: solutionToPortingProjects
      },
      error: {
        pendingMessages: [],
        currentMessages: []
      },
      tools: tools
    });
    const result = selectApiTableData(
      fakeStore.getState(),
      "/solutions/" +
        encodeURIComponent("/test/solution") +
        "/" +
        encodeURIComponent("/test/testproject") +
        "/" +
        encodeURIComponent("/test/testproject/get.ts")
    );
    expect(result).toEqual([]);
  });

  it("selectFileTableData", () => {
    const result = selectFileTableData(
      mockStore.getState(),
      "/solutions/" +
        encodeURIComponent("/test/solution") +
        "/" +
        encodeURIComponent("/test/testproject") +
        "/" +
        encodeURIComponent("/test/testproject/get.ts")
    );
    const expectResult: SourceFile[] = [
      {
        sourceFilePath: "/test/testproject/get.ts",
        incompatibleApis: 0,
        totalApis: 1,
        solutionPath: "/test/testsolution",
        projectPath: "/test/testproject",
        portability: "100%",
        portabilityNumber: 100,
        isProjectPage: true
      },
      {
        sourceFilePath: "/test/testproject/test.ts",
        incompatibleApis: 1,
        totalApis: 1,
        solutionPath: "/test/testsolution",
        projectPath: "/test/testproject",
        portability: "0%",
        portabilityNumber: 0,
        isProjectPage: true
      }
    ];
    expect(result).toEqual(expectResult);
  });

  it("selectFileTableData with failed project", () => {
    const fakeStore = createStore(createRootReducer(), {
      solution: {
        solutionToSolutionDetails: {
          "/test/solution": Loaded({
            solutionName: "testsolution",
            solutionFilePath: "/test/testsolution",
            failedProjects: [""],
            projects: [project, reloadingproject]
          })
        },
        apiAnalysis: { "/test/solution": { "/test/testproject": Failed<ProjectApiAnalysisResult>("failed") } },
        profileSet: true
      },
      nugetPackage: {
        nugets: {
          "testpackage-3.0.0": Loaded(packageAnalysisResultWithDate)
        }
      },
      file: {
        sourceFileToContents: sourceFiletoContents
      },
      porting: {
        portingLocations: solutionToPortingLocation,
        portingProjects: solutionToPortingProjects
      },
      error: {
        pendingMessages: [],
        currentMessages: []
      },
      tools: tools
    });
    const result = selectFileTableData(
      fakeStore.getState(),
      "/solutions/" +
        encodeURIComponent("/test/solution") +
        "/" +
        encodeURIComponent("/test/testproject") +
        "/" +
        encodeURIComponent("/test/testproject/get.ts")
    );

    expect(result).toEqual([]);
  });

  it("selectFileTableData with API reuslt is loading", () => {
    const result = selectFileTableData(
      mockStore.getState(),
      "/solutions/" +
        encodeURIComponent("/test/loading") +
        "/" +
        encodeURIComponent("/test/testproject") +
        "/" +
        encodeURIComponent("/test/testproject/get.ts")
    );
    expect(result).toEqual([]);
  });

  it("selectNugetTableData", () => {
    const result = selectNugetTableData(
      mockStore.getState(),
      "/solutions/" +
        encodeURIComponent("/test/solution") +
        "/" +
        encodeURIComponent("/test/testproject") +
        "/" +
        encodeURIComponent("/test/testproject/get.ts")
    );
    const expectResult: NugetPackageTableFields[] = [
      {
        packageId: "testpackage",
        version: "3.0.0",
        frequency: 1,
        apis: 1,
        failed: false,
        sourceFiles: 1,
        replacement: "test upgrade",
        compatible: "COMPATIBLE",
        deprecated: false
      }
    ];
    expect(result).toEqual(expectResult);
  });
});

describe("checkInternetAccess", () => {
  it("should add internet access error to messages", async () => {
    const result = await checkInternetAccess("", dispatch);
    expect(result).toBe(false);
    const currentMessagesUpdates = currentMessages(store.getState());
    const expectResult = internetAccessFailed();
    expect(currentMessagesUpdates[0]['content']).toEqual(expectResult['content']);
    expect(currentMessagesUpdates[0]['header']).toEqual(expectResult['header'])
  });
})