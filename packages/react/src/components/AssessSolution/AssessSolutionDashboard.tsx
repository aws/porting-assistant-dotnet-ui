import { Box, Button, Header, NonCancelableCustomEvent, SpaceBetween, Tabs, TabsProps } from "@awsui/components-react";
import { systemPreferences } from "electron";
import { electron } from "process";
import React, { useCallback, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Redirect, useHistory, useLocation } from "react-router";
import { v4 as uuid } from "uuid";

import { paths } from "../../constants/paths";
import { usePortingAssistantSelector } from "../../createReduxStore";
import { HistoryState } from "../../models/locationState";
import { Project } from "../../models/project";
import { SolutionDetails } from "../../models/solution";
import { analyzeSolution, exportSolution, openSolutionInIDE } from "../../store/actions/backend";
import { selectPortingLocation } from "../../store/selectors/portingSelectors";
import { selectProjectTableData } from "../../store/selectors/tableSelectors";
import { checkInternetAccess } from "../../utils/checkInternetAccess";
import { getTargetFramework } from "../../utils/getTargetFramework";
import { isLoaded, Loadable } from "../../utils/Loadable";
import { AddCustomMsBuildForm } from "../AddCustomMSBuild/AddCustomMSBuild";
import { ApiTable } from "../AssessShared/ApiTable";
import { EnterEmailModal, isEmailSet } from "../AssessShared/EnterEmailModal";
import { FileTable } from "../AssessShared/FileTable";
import { NugetPackageTable } from "../AssessShared/NugetPackageTable";
import { ProjectReferences } from "../AssessShared/ProjectReferences";
import { useApiAnalysisFlashbarMessage } from "../AssessShared/useApiAnalysisFlashbarMessage";
import { useNugetFlashbarMessages } from "../AssessShared/useNugetFlashbarMessages";
import { CustomerFeedbackModal } from "../CustomerContribution/CustomerFeedbackModal";
import { InfoLink } from "../InfoLink";
import { PortConfigurationModal } from "../PortConfigurationModal/PortConfigurationModal";
import { ProjectsTable } from "./ProjectsTable";
import { SolutionSummary } from "./SolutionSummary";

interface Props {
  solution: SolutionDetails;
  projects: Loadable<Project[]>;
}

const AssessSolutionDashboardInternal: React.FC<Props> = ({ solution, projects }) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation<HistoryState>();
  const portingLocation = usePortingAssistantSelector(state => selectPortingLocation(state, location.pathname));
  const [showPortingModal, setShowPortingModal] = useState(false);
  const targetFramework = getTargetFramework();
  const [feedbackModal, setFeedbackModalVisible] = React.useState(false);
  const [emailModal, setEmailModalVisible] = React.useState(false);
  const [selectedMSbuild, setselectedMSbuild] = useState<any>();
  const [msBuildArguments, setmsBuildArguments] = useState<any[]>([]);

  useNugetFlashbarMessages(projects);
  useApiAnalysisFlashbarMessage(solution);

  const projectsTable = usePortingAssistantSelector(state => selectProjectTableData(state, location.pathname));
  let preTriggerDataArray: string[] = [];
  projectsTable.forEach(element => { preTriggerDataArray.push(JSON.stringify(element)); });
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

  const addSolution = async (solutionPath: any, msBuildArgumentsArray: string[], selectedMSbuild: string) => {
    const paths = await window.electron.getState("solutions", {});
    paths[solutionPath] = { solutionPath: solutionPath, msBuildPath: selectedMSbuild, msBuildArguments: msBuildArgumentsArray };
    window.electron.saveState("solutions", paths);
  };

  return (
    <SpaceBetween size="m">
      <EnterEmailModal
        visible={emailModal}
        onCancel={() => setEmailModalVisible(false)}
        onSaveExit={() => {
          setEmailModalVisible(false);
          setFeedbackModalVisible(true);
        }}
      ></EnterEmailModal>

      <CustomerFeedbackModal
        visible={feedbackModal}
        setModalVisible={setFeedbackModalVisible}
        showEmailModal={() => {
          setFeedbackModalVisible(false);
          setEmailModalVisible(true);
        }}
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
              onClick={() => dispatch(exportSolution({ solutionPath: solution.solutionFilePath }))}
            >
              Export assessment report
            </Button>
            <Button
              iconName="external"
              iconAlign="right"
              onClick={() => dispatch(openSolutionInIDE(solution.solutionFilePath))}
            >
              View in Visual Studio
            </Button>
            <Button
              iconName="refresh"
              id="reassess-solution"
              onClick={async () => {
                const haveInternet = await checkInternetAccess(solution.solutionFilePath, dispatch);
                if (haveInternet) {
                  const msBuildArgumentsArray = [];

                  for (const msBuildArgument of msBuildArguments) {
                    msBuildArgumentsArray.push(msBuildArgument.value);
                  }

                  await addSolution(solution.solutionFilePath, msBuildArgumentsArray, selectedMSbuild.label);
                  dispatch(
                    analyzeSolution.request({
                      solutionPath: solution.solutionFilePath,                      
                      runId: uuid(),
                      triggerType: "UserRequest",
                      settings: {
                        ignoredProjects: [],
                        targetFramework: targetFramework,
                        continiousEnabled: false,
                        actionsOnly: false,
                        compatibleOnly: false,
                        msbuildPath: selectedMSbuild.label,
                        msBuildArguments: msBuildArgumentsArray,
                      },
                      preTriggerData: preTriggerDataArray,
                      force: true
                    })
                  );
                  history.push(paths.dashboard);
                }
              }}
            >
              Reassess solution
            </Button>

            <Button
              id="feedback-btn"
              onClick={() => {
                if (!isEmailSet()) {
                  console.log("No Email; Entering Email Modal");
                  setEmailModalVisible(true);
                } else {
                  console.log("Email exists; Entering ");
                  setFeedbackModalVisible(true);
                }
              }}
            >
              Send Feedback
            </Button>

            <Button
              id="port-solution-button"
              key="port-solution"
              variant="primary"
              disabled={!isLoaded(projects)}
              onClick={() => {
                if (portingLocation == null) {
                  setShowPortingModal(true);
                } else {
                  if (isLoaded(projects)) {
                    history.push({
                      pathname: `/port-solution/${encodeURIComponent(solution.solutionFilePath)}`,
                      state: {
                        projects: projects.data
                      }
                    });
                  }
                }
              }}
            >
              Port solution
            </Button>
            <PortConfigurationModal
              solution={solution}
              visible={showPortingModal}
              onDismiss={() => setShowPortingModal(false)}
              onSubmit={() => {
                history.push({
                  pathname: `/port-solution/${encodeURIComponent(solution.solutionFilePath)}`,
                  state: {
                    projects: isLoaded(projects) ? projects.data : []
                  }
                });
              }}
            />
          </SpaceBetween>
        }
      >
        {solution.solutionName}
      </Header>

      <SolutionSummary solution={solution} projects={projects} />
      <AddCustomMsBuildForm solution={solution} setselectedMSbuild={setselectedMSbuild} setMSBuildArgumentsLst={setmsBuildArguments}></AddCustomMsBuildForm>
      <Tabs tabs={tabs} activeTabId={location.state?.activeTabId || "projects"} onChange={onChangeTab} />
    </SpaceBetween>
  );
};

export const AssessSolutionDashboard = React.memo(AssessSolutionDashboardInternal);
