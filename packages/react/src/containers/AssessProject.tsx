import { Box } from "@awsui/components-react";
import React, { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { Redirect, useLocation, useRouteMatch } from "react-router";

import { AssessProjectDashboard } from "../components/AssessProject/AssessProjectDashboard";
import { PortingAssistantAppLayout } from "../components/PortingAssistantAppLayout";
import { PortingAssistantBreadcrumb } from "../components/PortingAssistantBreadcrumb";
import { setInfo } from "../store/actions/tools";
import { RootState } from "../store/reducers";
import { selectCurrentProject, selectCurrentSolutionDetails } from "../store/selectors/solutionSelectors";
import { isFailed, isLoaded, isLoading } from "../utils/Loadable";

const AssessProjectInternal: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const currentSolutionDetails = useSelector((state: RootState) =>
    selectCurrentSolutionDetails(state, location.pathname)
  );
  const currentProject = useSelector((state: RootState) => selectCurrentProject(state, location.pathname));
  const routeMatch = useRouteMatch({ path: route, exact: true, strict: true });

  useEffect(() => {
    dispatch(
      setInfo({
        heading: "Project assessment report",
        mainContent: (
          <>
            <Box variant="p">
              Once you select an application for porting, Porting Assistant for .NET can speed up the process by setting
              up the project file with updated NuGet/Microsoft packages and formatted package references in a format
              that is compatible with .NET Core. You can use the updated project file to start refactoring your
              application. When you select an application for porting, Porting Assistant for .NET copies the .NET
              Framework source code and the associated project files to a .NET Core compatible format. If there are any
              known replacements, Porting Assistant for .NET applies them. When a project is ported, it may not be
              entirely .NET Core compatible because there may be other APIs, packages, and code blocks that must be
              substituted and refactored for compatibility
            </Box>
          </>
        ),
        learnMoreLinks: []
      })
    );
  }, [dispatch, location]);

  const breadcrumbWithCurrent = useMemo(() => {
    if (
      currentSolutionDetails == null ||
      !isLoaded(currentSolutionDetails) ||
      currentProject == null ||
      isLoading(currentProject) ||
      isFailed(currentProject)
    ) {
      return [];
    }
    return [
      ...breadcrumb,
      {
        text: currentSolutionDetails.data.solutionName,
        href: `/solutions/${encodeURIComponent(currentSolutionDetails.data.solutionFilePath)}`
      },
      {
        text: currentProject.data.projectName || "",
        href: `/solutions/${encodeURIComponent(currentSolutionDetails.data.solutionFilePath)}/${encodeURIComponent(
          currentProject.data.projectFilePath
        )}`
      }
    ];
  }, [currentProject, currentSolutionDetails]);

  if (currentSolutionDetails == null || !isLoaded(currentSolutionDetails) || currentProject == null) {
    if (routeMatch === null) {
      return <Redirect to={location} />;
    } else {
      return <Redirect to="/solutions" />;
    }
  }

  return (
    <PortingAssistantAppLayout
      content={<AssessProjectDashboard solution={currentSolutionDetails.data} project={currentProject} />}
      breadcrumbs={<PortingAssistantBreadcrumb items={breadcrumbWithCurrent} />}
    />
  );
};

const breadcrumb = [
  { text: "Porting Assistant for .NET", href: "/main" },
  { text: "Assessed solutions", href: "/solutions" }
];
const route = "/solutions/:solution/:project";

export const AssessProject = React.memo(AssessProjectInternal);
