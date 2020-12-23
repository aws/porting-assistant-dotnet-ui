import { produce } from "immer";
import { createReducer } from "typesafe-actions";

import { PackageToPackageAnalysisResult } from "../../models/project";
import { Failed, Loaded, Loading } from "../../utils/Loadable";
import { nugetPackageKey } from "../../utils/NugetPackageKey";
import { getNugetPackageWithData } from "../actions/nugetPackage";

export const nugetPackageReducer = createReducer({
  nugets: {} as PackageToPackageAnalysisResult
})
  .handleAction(getNugetPackageWithData.request, (state, action) =>
    produce(state, draftState => {
      action.payload.nugetPackages.forEach(n => {
        if (n.packageId == null) {
          return;
        }
        draftState.nugets[nugetPackageKey(n.packageId, n.version)] = Loading();
      });
    })
  )
  .handleAction(getNugetPackageWithData.success, (state, action) =>
    produce(state, draftState => {
      draftState.nugets[
        nugetPackageKey(action.payload.packageVersionPair.packageId, action.payload.packageVersionPair.version)
      ] = Loaded({
        lastRequestDate: new Date().toUTCString(),
        ...action.payload
      });
    })
  )
  .handleAction(getNugetPackageWithData.failure, (state, action) =>
    produce(state, draftState => {
      if (action.payload.nugetPackage.packageId == null) {
        return;
      }
      draftState.nugets[
        nugetPackageKey(action.payload.nugetPackage.packageId, action.payload.nugetPackage.version)
      ] = Failed(action.payload.error);
    })
  );
