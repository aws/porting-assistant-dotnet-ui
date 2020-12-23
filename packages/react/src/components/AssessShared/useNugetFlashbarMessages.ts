import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { matchPath, useHistory, useLocation } from "react-router";
import { v4 as uuid } from "uuid";

import { pathValues } from "../../constants/paths";
import { Project } from "../../models/project";
import { pushCurrentMessageUpdate } from "../../store/actions/error";
import { selectNugetPackages, selectSolutionToSolutionDetails } from "../../store/selectors/solutionSelectors";
import { isFailed, isLoaded, Loadable, Loaded } from "../../utils/Loadable";
import { nugetPackageKey } from "../../utils/NugetPackageKey";

export const useNugetFlashbarMessages = (projects?: Loadable<Project[] | Project>) => {
  const nugetPackages = useSelector(selectNugetPackages);
  const dispatch = useDispatch();
  const location = useLocation();
  const history = useHistory();
  const solutionToSolutionDetails = useSelector(selectSolutionToSolutionDetails);
  const match = matchPath<{ solution: string; project: string }>(location.pathname, {
    path: pathValues,
    exact: true,
    strict: false
  });
  const hasSolution = match != null && match.params?.solution != null;

  useEffect(() => {
    let allProjects: Loadable<Project[] | Project> =
      projects == null
        ? Loaded(Object.values(solutionToSolutionDetails).flatMap(s => (isLoaded(s) ? s.data.projects : [])))
        : projects;

    if (!isLoaded(allProjects)) {
      return;
    }
    const invalidNugets = new Set<string>();
    const loadedProjects = Array.isArray(allProjects.data) ? allProjects.data : [allProjects.data];
    const allNugetPackages = loadedProjects.flatMap(p => p.packageReferences || []);
    allNugetPackages.forEach(n => {
      if (n.packageId != null && isFailed(nugetPackages[nugetPackageKey(n.packageId, n.version)])) {
        invalidNugets.add(n.packageId);
      }
    });
    if (invalidNugets.size > 0) {
      if (hasSolution) {
        dispatch(
          pushCurrentMessageUpdate({
            messageId: uuid(),
            groupId: "NugetFailed",
            content: `Failed to determine compatibility of ${invalidNugets.size} NuGet packages. The assessment might not be accurate.`,
            type: "info",
            buttonText: "View NuGet packages",
            onButtonClick: () => history.push(location.pathname, { activeTabId: "nuget-packages" }),
            dismissible: true
          })
        );
      } else {
        dispatch(
          pushCurrentMessageUpdate({
            messageId: uuid(),
            groupId: "NugetFailed",
            content: `Failed to determine compatibility of ${invalidNugets.size} NuGet packages. Assessments might not be accurate.`,
            type: "info",
            dismissible: true
          })
        );
      }
    }
  }, [dispatch, hasSolution, history, location.pathname, nugetPackages, projects, solutionToSolutionDetails]);
};
