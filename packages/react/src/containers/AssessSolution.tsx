import { Box } from "@awsui/components-react";
import React, { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { Redirect, useLocation, useRouteMatch } from "react-router";

import { AssessSolutionDashboard } from "../components/AssessSolution/AssessSolutionDashboard";
import { PortingAssistantAppLayout } from "../components/PortingAssistantAppLayout";
import { PortingAssistantBreadcrumb } from "../components/PortingAssistantBreadcrumb";
import { setInfo } from "../store/actions/tools";
import { RootState } from "../store/reducers";
import { selectCurrentSolutionDetails, selectProjects } from "../store/selectors/solutionSelectors";
import { isLoaded, isLoadingWithData } from "../utils/Loadable";

const AssessSolutionInternal: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const currentSolutionDetails = useSelector((state: RootState) =>
    selectCurrentSolutionDetails(state, location.pathname)
  );
  const projects = useSelector((state: RootState) => selectProjects(state, location.pathname));
  const routeMatch = useRouteMatch({ path: route, exact: true, strict: true });

  useEffect(() => {
    dispatch(
      setInfo({
        heading: "Solution assessment report",
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
              substituted and refactored for compatibility.
            </Box>
          </>
        ),
        learnMoreLinks: []
      })
    );
  }, [dispatch, location]);

  const breadcrumbWithCurrent = useMemo(() => {
    if (currentSolutionDetails == null || !isLoaded(currentSolutionDetails)) {
      return [];
    }
    return [
      ...breadcrumb,
      {
        text: currentSolutionDetails.data.solutionName,
        href: `/solutions/${encodeURIComponent(currentSolutionDetails.data.solutionFilePath)}`
      }
    ];
  }, [currentSolutionDetails]);

  if (currentSolutionDetails == null || !isLoaded(currentSolutionDetails)){
    if (isLoadingWithData(currentSolutionDetails)){
      return (
        <PortingAssistantAppLayout
          content={<AssessSolutionDashboard solution={currentSolutionDetails} projects={projects} />}
          breadcrumbs={<PortingAssistantBreadcrumb items={breadcrumbWithCurrent} />}
        />
      );
    }
    if (routeMatch === null) {
      return <Redirect to={location} />;
    } else {
      return <Redirect to="/solutions" />;
    }
  }

  return (
    <PortingAssistantAppLayout
      content={<AssessSolutionDashboard solution={currentSolutionDetails} projects={projects} />}
      breadcrumbs={<PortingAssistantBreadcrumb items={breadcrumbWithCurrent} />}
    />
  );
};

const breadcrumb = [
  { text: "Porting Assistant for .NET", href: "/main" },
  { text: "Assessed solutions", href: "/solutions" }
];
const route = "/solutions/:solution";

export const AssessSolution = React.memo(AssessSolutionInternal);
