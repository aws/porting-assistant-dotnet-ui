import { Box } from "@cloudscape-design/components";
import React, { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { Redirect, useLocation, useRouteMatch } from "react-router";

import { PortingAssistantAppLayout } from "../components/PortingAssistantAppLayout";
import { PortingAssistantBreadcrumb } from "../components/PortingAssistantBreadcrumb";
import { PortSolutionDashboard } from "../components/PortSolution/PortSolutionDashboard";
import { Project } from "../models/project";
import { openTools, setInfo } from "../store/actions/tools";
import { RootState } from "../store/reducers";
import { selectCurrentSolutionDetails } from "../store/selectors/solutionSelectors";
import { isLoaded } from "../utils/Loadable";

const PortSolutionInternal: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation<{ projects: Project[] }>();
  const currentSolutioDetails = useSelector((state: RootState) =>
    selectCurrentSolutionDetails(state, location.pathname)
  );
  const projects = location.state?.projects || [];
  const routeMatch = useRouteMatch({ path: route, exact: true, strict: true });

  useEffect(() => {
    dispatch(
      setInfo({
        heading: "Port solution",
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
    if (currentSolutioDetails == null || !isLoaded(currentSolutioDetails)) {
      return [];
    }
    return [
      ...breadcrumb,
      {
        text: currentSolutioDetails.data.solutionName,
        href: `/solutions/${encodeURIComponent(currentSolutioDetails.data.solutionFilePath)}`
      },
      {
        text: `Port ${currentSolutioDetails.data.solutionName}`,
        href: `/port-solution/${encodeURIComponent(currentSolutioDetails.data.solutionFilePath)}`
      }
    ];
  }, [currentSolutioDetails]);

  if (currentSolutioDetails == null || !isLoaded(currentSolutioDetails)) {
    if (routeMatch === null) {
      return <Redirect to={location} />;
    } else {
      return <Redirect to="/" />;
    }
  }

  return (
    <PortingAssistantAppLayout
      contentType="form"
      content={<PortSolutionDashboard solution={currentSolutioDetails.data} projects={projects} />}
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

export const PortSolution = React.memo(PortSolutionInternal);
