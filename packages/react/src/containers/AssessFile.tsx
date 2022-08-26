import { Box } from "@cloudscape-design/components";
import React, { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { Redirect, useLocation, useRouteMatch } from "react-router";

import { AssessFileDashboard } from "../components/AssessFile/AssessFileDashboard";
import { PortingAssistantAppLayout } from "../components/PortingAssistantAppLayout";
import { PortingAssistantBreadcrumb } from "../components/PortingAssistantBreadcrumb";
import { pathValues } from "../constants/paths";
import { setInfo } from "../store/actions/tools";
import { RootState } from "../store/reducers";
import {
  selectCurrentProject,
  selectCurrentSolutionDetails,
  selectCurrentSourceFilePath
} from "../store/selectors/solutionSelectors";
import { isFailed, isLoaded, isLoading } from "../utils/Loadable";

const AssessFileInternal: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation<{ solutionOnly?: boolean }>();
  const currentSolutionDetails = useSelector((state: RootState) =>
    selectCurrentSolutionDetails(state, location.pathname)
  );
  const currentProject = useSelector((state: RootState) => selectCurrentProject(state, location.pathname));
  const sourceFilePath = useSelector((state: RootState) => selectCurrentSourceFilePath(state, location.pathname));
  const routeMatch = useRouteMatch({ path: route, exact: true, strict: true });

  useEffect(() => {
    dispatch(
      setInfo({
        heading: "Source file",
        mainContent: (
          <Box variant="p">
            View incompatible API calls in the project source code, and the replacement suggestions.
          </Box>
        ),
        learnMoreLinks: []
      })
    );
  }, [dispatch, location]);

  const isSolutionOnly = location.state?.solutionOnly === true;

  const breadcrumbWithCurrent = useMemo(() => {
    if (
      currentSolutionDetails == null ||
      currentProject == null ||
      isLoading(currentProject) ||
      isFailed(currentProject) ||
      isLoading(currentSolutionDetails) ||
      isFailed(currentSolutionDetails) ||
      sourceFilePath == null
    ) {
      return [];
    }
    return [
      ...breadcrumb,
      {
        text: currentSolutionDetails.data.solutionName,
        href: `/solutions/${encodeURIComponent(currentSolutionDetails.data.solutionFilePath)}`
      },
      ...(isSolutionOnly
        ? []
        : [
            {
              text: currentProject.data.projectName || "",
              href: `/solutions/${encodeURIComponent(
                currentSolutionDetails.data.solutionFilePath
              )}/${encodeURIComponent(currentProject.data.projectFilePath)}`
            }
          ]),
      {
        text: window.electron.getFilename(sourceFilePath),
        href: `/solutions/${encodeURIComponent(currentSolutionDetails.data.solutionFilePath)}/${encodeURIComponent(
          currentProject.data.projectFilePath
        )}/${encodeURIComponent(sourceFilePath)}`
      }
    ];
  }, [currentProject, currentSolutionDetails, isSolutionOnly, sourceFilePath]);

  if (
    currentSolutionDetails == null ||
    !isLoaded(currentSolutionDetails) ||
    currentProject == null ||
    sourceFilePath == null
  ) {
    if (routeMatch === null) {
      return <Redirect to={location} />;
    } else {
      return <Redirect to="/solutions" />;
    }
  }

  return (
    <PortingAssistantAppLayout
      content={<AssessFileDashboard solution={currentSolutionDetails.data} project={currentProject} />}
      breadcrumbs={<PortingAssistantBreadcrumb items={breadcrumbWithCurrent} />}
    />
  );
};

const breadcrumb = [
  { text: "Porting Assistant for .NET", href: "/main" },
  { text: "Assessed solutions", href: "/solutions" }
];
const route = pathValues;

export const AssessFile = React.memo(AssessFileInternal);
