import { Box, Button, Header, SpaceBetween, Tabs, TabsProps } from "@awsui/components-react";
import { NonCancelableCustomEvent } from "@awsui/components-react/internal/events";
import React, { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Redirect, useHistory, useLocation } from "react-router";

import { usePortingAssistantSelector } from "../../createReduxStore";
import { HistoryState } from "../../models/locationState";
import { Project } from "../../models/project";
import { MetricSource, MetricType, ReactMetric } from "../../models/reactmetric";
import { SolutionDetails } from "../../models/solution";
import { RootState } from "../../store/reducers";
import { selectPortingLocation } from "../../store/selectors/portingSelectors";
import { selectProjects } from "../../store/selectors/solutionSelectors";
import { getErrorMetric } from "../../utils/getErrorMetric";
import { isFailed, isLoaded, isLoading, Loadable } from "../../utils/Loadable";
import { ApiTable } from "../AssessShared/ApiTable";
import { FileTable } from "../AssessShared/FileTable";
import { NugetPackageTable } from "../AssessShared/NugetPackageTable";
import { ProjectReferences } from "../AssessShared/ProjectReferences";
import { useNugetFlashbarMessages } from "../AssessShared/useNugetFlashbarMessages";
import { InfoLink } from "../InfoLink";
import { PortConfigurationModal } from "../PortConfigurationModal/PortConfigurationModal";
import { ProjectSummary } from "./ProjectSummary";

interface Props {
  solution: Loadable<SolutionDetails>;
  project: Loadable<Project>;
}

const AssessProjectDashboardInternal: React.FC<Props> = ({ solution, project }) => {
  const location = useLocation<HistoryState>();
  const projectsInSolution = useSelector((state: RootState) => selectProjects(state, location.pathname));
  const portingLocation = usePortingAssistantSelector(state => selectPortingLocation(state, location.pathname));
  const history = useHistory();
  const [showPortingModal, setShowPortingModal] = useState(false);
  useNugetFlashbarMessages(project);

  const onChangeTab = useCallback(
    (event: NonCancelableCustomEvent<TabsProps.ChangeDetail>) => {
      history.push(location.pathname, { activeTabId: event.detail.activeTabId, activePageId: 1 });
    },
    [history, location.pathname]
  );

  const tabs = useMemo(
    () => [
      {
        label: "NuGet packages",
        id: "nuget-packages",
        content: <NugetPackageTable />
      },
      {
        label: "Project references",
        id: "project-references",
        content: <ProjectReferences projects={projectsInSolution} />
      },
      {
        label: "APIs",
        id: "apis",
        content: <ApiTable />
      },
      {
        label: "Source Files",
        id: "source-files",
        content: <FileTable />
      }
    ],
    [projectsInSolution]
  );

  if (solution == null || project == null || isLoading(project) || isFailed(project)) {
    return <Redirect to="/solutions" />;
  }

  return (
    <SpaceBetween size="m">
      <Header
        variant="h1"
        info={
          <InfoLink
            heading="Project assessment report"
            mainContent={
              <>
                <Box variant="p">
                  Once you select an application for porting, Porting Assistant for .NET can speed up the process by
                  setting up the project file with updated NuGet/Microsoft packages and formatted package references in
                  a format that is compatible with .NET Core. You can use the updated project file to start refactoring
                  your application. When you select an application for porting, Porting Assistant for .NET copies the
                  .NET Framework source code and the associated project files to a .NET Core compatible format. If there
                  are any known replacements, Porting Assistant for .NET applies them. When a project is ported, it may
                  not be entirely .NET Core compatible because there may be other APIs, packages, and code blocks that
                  must be substituted and refactored for compatibility
                </Box>
              </>
            }
            learnMoreLinks={[]}
          />
        }
        description={
          <Box variant="small">
            You can improve the compatibility of your project by refactoring the code in your IDE. Port your project
            when you have reached your desired level of compatibility.
          </Box>
        }
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              id="port-project-button"
              variant="primary"
              onClick={() => {
                try {
                  if (isLoaded(solution)) {
                    let clickMetric: ReactMetric = {
                      SolutionPath: solution.data.solutionFilePath,
                      MetricType: MetricType.UIClickEvent,
                      MetricSource: MetricSource.PortProjectSelect,
                      ProjectGuid: [project.data.projectGuid]
                    }
                    window.electron.writeReactLog(clickMetric);
                    if (portingLocation == null) {
                      setShowPortingModal(true);
                    } else {
                      history.push({
                        pathname: `/port-solution/${encodeURIComponent(solution.data.solutionFilePath)}/${encodeURIComponent(
                          project.data.projectFilePath
                        )}`
                      });
                    }
                  }
                } catch (err) {
                  const errorMetric = getErrorMetric(err, MetricSource.PortProjectSelect);
                  window.electron.writeReactLog(errorMetric);
                  throw err;
                }
              }}
            >
              Port project
            </Button>
          </SpaceBetween>
        }
      >
        {project.data.projectName}
      </Header>
      <ProjectSummary project={project.data} />
      <Tabs tabs={tabs} activeTabId={location.state?.activeTabId || "nuget-packages"} onChange={onChangeTab} />
      <PortConfigurationModal
        solution={solution}
        visible={showPortingModal}
        onDismiss={() => setShowPortingModal(false)}
        onSubmit={() => {
          try {
            if (isLoaded(solution)) {
              let clickMetric: ReactMetric = {
                SolutionPath: solution.data.solutionFilePath,
                ProjectGuid: [project.data.projectGuid],
                MetricSource: MetricSource.PortProjectSelect,
                MetricType: MetricType.UIClickEvent
              }
              window.electron.writeReactLog(clickMetric);
              history.push({
                pathname: `/port-solution/${encodeURIComponent(solution.data.solutionFilePath)}/${encodeURIComponent(
                  project.data.projectFilePath
                )}`
              });
            }
          } catch (err) {
            const errorMetric = getErrorMetric(err, MetricSource.PortSolutionSelect);
            window.electron.writeReactLog(errorMetric);
            throw err;
          }
        }}
      />
    </SpaceBetween>
  );
};

export const AssessProjectDashboard = React.memo(AssessProjectDashboardInternal);
