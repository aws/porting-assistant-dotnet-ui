import { NugetPackage } from "../models/project";
import { PackageToPackageAnalysisResult } from "../models/project";
import { getTargetFramework } from "./getTargetFramework";
import { isLoaded, isLoading } from "./Loadable";
import { nugetPackageKey } from "./NugetPackageKey";

export const getIncompatibleNugets = (
  packageToPackageAnalysisResult: PackageToPackageAnalysisResult,
  nugetToCheck: NugetPackage[]
) => {
  const result = getCompatibleNugetsAgg(nugetToCheck, packageToPackageAnalysisResult);
  if (!result.isAllNugetLoaded) {
    return null;
  }
  return result.nugetAggregates.incompatible;
};

export const getCompatibleNugetsAgg = (
  nugetToCheck: NugetPackage[],
  packageToPackageAnalysisResult: PackageToPackageAnalysisResult
) => {
  const allNugetDependencies = nugetToCheck.reduce((agg, cur) => {
    if (cur.packageId == null || cur.version == null) {
      return agg;
    }
    agg[nugetPackageKey(cur.packageId, cur.version)] = cur;
    return agg;
  }, {} as { [packageVersion: string]: NugetPackage });

  let isAllNugetLoaded = !Object.keys(allNugetDependencies).some(cur => {
    const loadedCur = packageToPackageAnalysisResult[cur];
    if (isLoading(loadedCur)) {
      return true;
    }
    return false;
  });

  const nugetAggregates = Array.from(Object.values(allNugetDependencies)).reduce(
    (agg, cur) => {
      const loadedCur = packageToPackageAnalysisResult[nugetPackageKey(cur.packageId, cur?.version)];
      const TARGET_VERSION = getTargetFramework();
      if (isLoaded(loadedCur)) {
        if (loadedCur.data.compatibilityResults == null) {
          return agg;
        }
        const compatibility = loadedCur.data.compatibilityResults[TARGET_VERSION]?.compatibility;
        if (compatibility === "COMPATIBLE") {
          agg.compatible += 1;
        } else {
          agg.incompatible += 1;
        }
      } else {
        isAllNugetLoaded = false;
        return agg;
      }
      return agg;
    },
    {
      compatible: 0,
      incompatible: 0,
      unknown: 0
    }
  );
  return {
    isAllNugetLoaded,
    nugetAggregates
  };
};

export const LOADING_AGGREGATES = {
  isAllNugetLoaded: false,
  nugetAggregates: {
    compatible: 0,
    incompatible: 0,
    unknown: 0
  }
};

export type NUGET_COMPATABILITIES = INUGET_COMPATABILITIES

interface INUGET_COMPATABILITIES {
  isAllNugetLoaded: boolean,
  nugetAggregates: {
    compatible: number,
    incompatible: number,
    unknown: number
  }
}
