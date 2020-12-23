import { createAsyncAction } from "typesafe-actions";

import { NugetPackage, PackageAnalysisResult } from "../../models/project";

export interface getNugetPackageWithDataRequestPayload {
  nugetPackages: NugetPackage[];
}
export interface getNugetPackageWithDataFailurePayload {
  nugetPackage: NugetPackage;
  error: string;
}
export const getNugetPackageWithData = createAsyncAction(
  "getNugetPackageWithData_Request",
  "getNugetPackageWithData_Success",
  "getNugetPackageWithData_Failure"
)<getNugetPackageWithDataRequestPayload, PackageAnalysisResult, getNugetPackageWithDataFailurePayload>();
