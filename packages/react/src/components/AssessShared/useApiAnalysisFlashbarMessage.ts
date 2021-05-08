import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useLocation } from "react-router";
import { v4 as uuid } from "uuid";

import { Project, ProjectApiAnalysisResult } from "../../models/project";
import { SolutionDetails } from "../../models/solution";
import { pushCurrentMessageUpdate } from "../../store/actions/error";
import { selectApiAnalysis, selectSolutionToSolutionDetails } from "../../store/selectors/solutionSelectors";
import { isFailed, isLoaded, Loadable, Loaded } from "../../utils/Loadable";

export const useApiAnalysisFlashbarMessage = (solution?: SolutionDetails, project?: Loadable<Project>) => {
  const apiAnalysis = useSelector(selectApiAnalysis);
  const dispatch = useDispatch();
  const location = useLocation();
  const history = useHistory();
  const solutionToSolutionDetails = useSelector(selectSolutionToSolutionDetails);

  useEffect(() => {
    let allApisAnalysis: { project: string; result: Loadable<ProjectApiAnalysisResult> }[] = [];
    let allProjects: Loadable<Project[] | Project>;
    if (project != null && solution != null) {
      allProjects = project;
    } else if (solution != null) {
      const solutionDetails = solutionToSolutionDetails[solution.solutionFilePath];
      if (!isLoaded(solutionDetails)) return;
      allProjects = Loaded(solutionDetails.data.projects);
    } else {
      allProjects = Loaded(Object.values(solutionToSolutionDetails).flatMap(s => (isLoaded(s) ? s.data.projects : [])));
    }
    if (!isLoaded(allProjects)) {
      return;
    }
    const invalidProjects = new Set<string>();
    const loadedProjects = Array.isArray(allProjects.data) ? allProjects.data : [allProjects.data];
    if (solution != null) {
      loadedProjects.forEach(loadedProject => {
        allApisAnalysis.push({
          project: loadedProject.projectFilePath,
          result: apiAnalysis[solution.solutionFilePath][loadedProject.projectFilePath]
        });
      });
    } else {
      allApisAnalysis.push(
        ...Object.values(apiAnalysis).flatMap(projectToApi =>
          Object.entries(projectToApi).map(([project, result]) => ({
            project,
            result
          }))
        )
      );
    }

    allApisAnalysis.forEach(api => {
      if (isFailed(api.result)) {
        invalidProjects.add(api.project);
      }
    });

    if (invalidProjects.size > 0) {
      dispatch(
        pushCurrentMessageUpdate({
          messageId: uuid(),
          groupId: "ApiFailed",
          content: `Failed to build ${invalidProjects.size} projects${
            solution == null ? "" : " in " + solution.solutionName
          }. 
            You must be able to build your project in Visual Studio. 
            If this error persists after installing the .NET Developer Pack for this Framework version, 
            contact support in the Porting Assistant help menu.`,
          type: "error",
          dismissible: true
        })
      );
    }
  }, [apiAnalysis, dispatch, history, location.pathname, project, solution, solutionToSolutionDetails]);
};
