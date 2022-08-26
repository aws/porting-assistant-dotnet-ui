import { Box } from "@cloudscape-design/components";
import React, { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { Redirect, useLocation, useRouteMatch } from "react-router";

import { PortingAssistantAppLayout } from "../components/PortingAssistantAppLayout";
import { PortingAssistantBreadcrumb } from "../components/PortingAssistantBreadcrumb";
import { PortProjectDashboard } from "../components/PortProject/PortProjectDashboard";
import { Project } from "../models/project";
import { openTools, setInfo } from "../store/actions/tools";
import { RootState } from "../store/reducers";
import { selectPortingLocation } from "../store/selectors/portingSelectors";
import {
  selectCurrentProject,
  selectCurrentSolutionDetails,
  selectCurrentSolutionPath
} from "../store/selectors/solutionSelectors";
import { isLoaded, isReloading } from "../utils/Loadable";

const PortProjectInternal: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation<{ projects?: Project[] }>();
  const currentSolutionPath = useSelector((state: RootState) => selectCurrentSolutionPath(state, location.pathname));
  const currentSolution = useSelector((state: RootState) => selectCurrentSolutionDetails(state, location.pathname));
  const currentProject = useSelector((state: RootState) => selectCurrentProject(state, location.pathname));
  const routeMatch = useRouteMatch({ path: route, exact: true, strict: true });
  const portingLocation = useSelector((state: RootState) => selectPortingLocation(state, location.pathname));

  useEffect(() => {
    dispatch(
      setInfo({
        heading: "Port project",
        mainContent: (
          <Box variant="p">
            Once you select an application for porting, Porting Assistant for .NET can speed up the process by setting
            up the project file with updated NuGet/Microsoft packages and formatted package references in a format that
            is compatible with .NET Core. You can use the updated project file to start refactoring your application.
            When you select an application for porting, Porting Assistant for .NET copies the .NET Framework source code
            and the associated project files to a .NET Core compatible format. If there are any known replacements,
            Porting Assistant applies them. When a project is ported, it may not be entirely .NET Core compatible
            because there may be other APIs, packages, and code blocks that must be substituted and refactored for
            compatibility.
          </Box>
        ),
        learnMoreLinks: []
      })
    );
  }, [dispatch]);

  const breadcrumbWithCurrent = useMemo(() => {
    if (!isLoaded(currentSolution) || !isLoaded(currentProject)) {
      return [];
    }
    return [
      ...breadcrumb,
      {
        text: currentSolution.data.solutionName,
        href: `/solutions/${encodeURIComponent(currentSolution.data.solutionFilePath)}`
      },
      {
        text: currentProject.data.projectName || "",
        href: `/solutions/${encodeURIComponent(currentSolution.data.solutionFilePath)}/${encodeURIComponent(
          currentProject.data.projectFilePath
        )}`
      },
      {
        text: `Port ${currentProject.data.projectName || ""}`,
        href: `/port-solution/${encodeURIComponent(
          currentSolution.data.solutionFilePath
        )}/portingProjectFile/${encodeURIComponent(currentProject.data.projectFilePath)}`
      }
    ];
  }, [currentProject, currentSolution]);

  if (!isLoaded(currentSolution)) {
    if (routeMatch === null) {
      return <Redirect to={location} />;
    } else {
      return <Redirect to="/" />;
    }
  }

  if (!isLoaded(currentProject) && !isReloading(currentProject)) {
    return <Redirect to={`/port-solution/${encodeURIComponent(currentSolutionPath)}`} />;
  }

  if (portingLocation == null) {
    return <Redirect to={`/init-port-solution/${encodeURIComponent(currentSolutionPath)}`} />;
  }

  return (
    <PortingAssistantAppLayout
      contentType="form"
      content={
        <PortProjectDashboard
          solution={currentSolution.data}
          project={currentProject.data}
          portingLocation={portingLocation!}
        />
      }
      breadcrumbs={<PortingAssistantBreadcrumb items={breadcrumbWithCurrent} />}
      onToolsChange={event => dispatch(openTools({ isOpen: event.detail.open }))}
    />
  );
};

const breadcrumb = [
  { text: "Porting Assistant for .NET", href: "/main" },
  { text: "Assessed solutions", href: "/solutions" }
];
const route = "/port-solution/:solution";

export const PortProject = React.memo(PortProjectInternal);
