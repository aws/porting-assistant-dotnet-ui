import { Box, Button, Flashbar, Header, NonCancelableCustomEvent, ProgressBar,SpaceBetween, Tabs, TabsProps } from "@awsui/components-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector} from "react-redux";
import { Redirect, useHistory, useLocation } from "react-router";
import { v4 as uuid } from "uuid";
import { data } from "vis-network";

import { paths } from "../../constants/paths";
import { usePortingAssistantSelector } from "../../createReduxStore";
import { HistoryState } from "../../models/locationState";
import { PreTriggerData,Project } from "../../models/project";
import { MetricSource, MetricType, ReactMetric } from "../../models/reactmetric";
import { SolutionDetails } from "../../models/solution";
import { analyzeSolution, exportSolution, openSolutionInIDE } from "../../store/actions/backend";
import { selectPortingLocation } from "../../store/selectors/portingSelectors";
import { selectAssesmentStatus, selectCurrentSolutionPath } from "../../store/selectors/solutionSelectors";
import { selectProjectTableData } from "../../store/selectors/tableSelectors";
import { setAssessmentStatus } from "../../utils/assessmentStatus";
import { checkInternetAccess } from "../../utils/checkInternetAccess";
import { createPreTriggerDataFromProjectsTable } from "../../utils/createPreTriggerDataFromProjectTable";
import { getErrorMetric } from "../../utils/getErrorMetric";
import { getTargetFramework } from "../../utils/getTargetFramework";
import { getTotalProjects } from "../../utils/getTotalProjects";
import { hasNewData, isLoaded, isLoading, isLoadingWithData, Loadable } from "../../utils/Loadable";
import { ApiTable } from "../AssessShared/ApiTable";
import { FileTable } from "../AssessShared/FileTable";
import { NugetPackageTable } from "../AssessShared/NugetPackageTable";
import { ProjectReferences } from "../AssessShared/ProjectReferences";
import { useApiAnalysisFlashbarMessage } from "../AssessShared/useApiAnalysisFlashbarMessage";
import { useNugetFlashbarMessages } from "../AssessShared/useNugetFlashbarMessages";
import { CustomerFeedbackModal } from "../CustomerContribution/CustomerFeedbackModal";
import { InfoLink } from "../InfoLink";
import { PortConfigurationModal } from "../PortConfigurationModal/PortConfigurationModal";
import { getPercent } from "./../../utils/getPercent"
import { ProjectsTable, TableData } from "./ProjectsTable";
import { SolutionSummary } from "./SolutionSummary";
interface Props {
  solution: Loadable<SolutionDetails>;
  projects: Loadable<Project[]>;
}

const AssessSolutionDashboardInternal: React.FC<Props> = ({ solution, projects }) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation<HistoryState>();
  const portingLocation = usePortingAssistantSelector(state => selectPortingLocation(state, location.pathname));
  const isAssesmentRunning = useSelector(selectAssesmentStatus);
  const [showPortingModal, setShowPortingModal] = useState(false);
  const targetFramework = getTargetFramework();
  const [feedbackModal, setFeedbackModalVisible] = React.useState(false);
  const [emailModal, setEmailModalVisible] = React.useState(false);
  const solutionPath = usePortingAssistantSelector(state => selectCurrentSolutionPath(state, location.pathname));
  const [totalProjects, setTotalProjects] = useState<number>(0);
  useNugetFlashbarMessages(projects);
  useApiAnalysisFlashbarMessage(solution);
  
  useEffect(()=> { 
    (async () => {
      setTotalProjects(await getTotalProjects(solutionPath));   
    })();
  }, [solutionPath]); 

  const projectsTable = usePortingAssistantSelector(state => selectProjectTableData(state, location.pathname));
 var preTriggerDataDictionary: { [projectName: string]: PreTriggerData} = createPreTriggerDataFromProjectsTable(projectsTable);

 const tabs = useMemo(
    () => [
      {
        label: "Projects",
        id: "projects",
        content: <ProjectsTable solution={solution} />
      },
      {
        label: "Project references",
        id: "project-references",
        content: <ProjectReferences projects={projects} />
      },
      {
        label: "NuGet packages",
        id: "nuget-packages",
        content: <NugetPackageTable />
      },
      {
        label: "APIs",
        id: "apis",
        content: <ApiTable />
      },
      {
        label: "Source files",
        id: "source-files",
        content: <FileTable />
      }
    ],
    [solution, projects]
  );

  const onChangeTab = useCallback(
    (event: NonCancelableCustomEvent<TabsProps.ChangeDetail>) => {
      history.push(location.pathname, { activeTabId: event.detail.activeTabId, activePageId: 1 });
    },
    [history, location.pathname]
  );

  if (solution == null) {
    return <Redirect to="/solutions" />;
  }

  return (
    <SpaceBetween size="m">
      <CustomerFeedbackModal
        visible={feedbackModal}
        setModalVisible={setFeedbackModalVisible}
      ></CustomerFeedbackModal>

      <Header
        variant="h1"
        info={
          <InfoLink
            heading="Solution assessment report"
            mainContent={
              <>
                <p>
                  Once you select an application for porting, Porting Assistant for .NET can speed up the process by
                  setting up the project file with updated NuGet/Microsoft packages and formatted package references in
                  a format that is compatible with .NET Core. You can use the updated project file to start refactoring
                  your application. When you select an application for porting, Porting Assistant for .NET copies the
                  .NET Framework source code and the associated project files to a .NET Core compatible format. If there
                  are any known replacements, Porting Assistant for .NET applies them. When a project is ported, it may
                  not be entirely .NET Core compatible because there may be other APIs, packages, and code blocks that
                  must be substituted and refactored for compatibility.
                </p>
              </>
            }
            learnMoreLinks={[]}
          />
        }
        description={
          <Box variant="small">
            Improve the compatibility of your solution by refactoring the source code for each project and reassessing
            it.
          </Box>
        }
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              iconName="download"
              disabled={!isLoaded(solution)}
              onClick={() => isLoaded(solution) && dispatch(exportSolution({ solutionPath: solution.data.solutionFilePath }))}
            >
              Export assessment report
            </Button>
            <Button
              iconName="external"
              iconAlign="right"
              disabled={!isLoaded(solution)}
              onClick={() => isLoaded(solution) && dispatch(openSolutionInIDE(solution.data.solutionFilePath))}
            >
              View in Visual Studio
            </Button>
            <Button
              iconName="refresh"
              id="reassess-solution"
              disabled={!isLoaded(solution) && !(isLoading(solution) || isLoadingWithData(solution))}
              onClick={async () => {
                try {
                  if (isLoaded(solution)) {
                    let clickMetric: ReactMetric = {
                      SolutionPath: solution.data.solutionFilePath,
                      MetricSource: MetricSource.ReassessSolution,
                      MetricType: MetricType.UIClickEvent
                    }
                    window.electron.writeReactLog(clickMetric);
                    const haveInternet = await checkInternetAccess(solution.data.solutionFilePath, dispatch);
                    if (haveInternet) {
                      dispatch(
                        analyzeSolution.request({
                          solutionPath: solution.data.solutionFilePath,
                          runId: uuid(),
                          triggerType: "UserRequest",
                          settings: {
                            ignoredProjects: [],
                            targetFramework: targetFramework,
                            continiousEnabled: false,
                            actionsOnly: false,
                            compatibleOnly: false
                          },
                          preTriggerData: preTriggerDataDictionary,
                          force: true
                        })
                      );
                      history.push(paths.dashboard);
                    }
                  }
                } catch (err) {
                  const errorMetric = getErrorMetric(err, MetricSource.ReassessSolution);
                  window.electron.writeReactLog(errorMetric);
                  throw err;
                }
              }}
            >
              Reassess solution
            </Button>

            <Button
              id="feedback-btn"
              onClick={() => {
                setFeedbackModalVisible(
                  true
                );
              }}
            >
              Send Feedback
            </Button>

            <Button
              id="port-solution-button"
              key="port-solution"
              variant="primary"
              disabled={!isLoaded(projects) || !isLoaded(solution)}
              onClick={() => {
                try {
                  if (isLoaded(solution)){
                    let clickMetric: ReactMetric = {
                      SolutionPath: solution.data.solutionFilePath,
                      MetricSource: MetricSource.PortSolutionSelect,
                      MetricType: MetricType.UIClickEvent
                    };
                    window.electron.writeReactLog(clickMetric);
                    if (portingLocation == null) {
                      setShowPortingModal(true);
                    } else {
                      if (isLoaded(projects)) {
                        history.push({
                          pathname: `/port-solution/${encodeURIComponent(solution.data.solutionFilePath)}`,
                          state: {
                            projects: projects.data
                          }
                        });
                      }
                    }
                  }
                } catch (err) {
                  const errorMetric = getErrorMetric(err, MetricSource.PortSolutionSelect);
                  window.electron.writeReactLog(errorMetric);
                  throw err;
                }
              }}
            >
              Port solution
            </Button>
            <PortConfigurationModal
              solution={solution}
              visible={showPortingModal && isLoaded(solution)}
              onDismiss={() => setShowPortingModal(false)}
              onSubmit={() => {
                try {
                  if (isLoaded(solution)) {
                    let clickMetric: ReactMetric = {
                      SolutionPath: solution.data.solutionFilePath,
                      MetricSource: MetricSource.PortSolutionSelect,
                      MetricType: MetricType.UIClickEvent
                    }
                    window.electron.writeReactLog(clickMetric);
                    history.push({
                      pathname: `/port-solution/${encodeURIComponent(solution.data.solutionFilePath)}`,
                      state: {
                        projects: hasNewData(projects) ? projects.data : []
                      }
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
        }
      >
        {hasNewData(solution)? solution.data.solutionName : ""}
      </Header>
      <Flashbar
      items={[
        {
          content: (
            <ProgressBar
              value={ isLoaded(solution)? 100: isLoadingWithData(solution)? 100*solution.data.projects.length/totalProjects :0}
              variant="flash"
              description="Percentage of Total Projects Assessed"
              label="Progress Bar"
            />
          )
        }
      ]}
    />
      <SolutionSummary solution={solution} projects={projects} />
      <Tabs tabs={tabs} activeTabId={location.state?.activeTabId || "projects"} onChange={onChangeTab} />
    </SpaceBetween>
  );
};

export const AssessSolutionDashboard = React.memo(AssessSolutionDashboardInternal);
