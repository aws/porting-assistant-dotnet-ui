import {
  Alert,
  Box,
  Button,
  ButtonDropdown,
  FormField,
  Header,
  Input,
  Modal,
  NonCancelableCustomEvent,
  SpaceBetween,
  Tabs,
  TabsProps,
  TextContent
} from "@awsui/components-react";
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
import { checkInternetAccess } from "../../utils/checkInternetAccess";
import { getTargetFramework } from "../../utils/getTargetFramework";
import { isLoaded, Loadable } from "../../utils/Loadable";
import { sendCustomerFeedback } from "../../utils/sendCustomerFeedback";
import { ApiTable } from "../AssessShared/ApiTable";
import { EnterEmailModal, isEmailSet } from "../AssessShared/EnterEmailModal";
import { FileTable } from "../AssessShared/FileTable";
import { NugetPackageTable } from "../AssessShared/NugetPackageTable";
import { ProjectReferences } from "../AssessShared/ProjectReferences";
import { useApiAnalysisFlashbarMessage } from "../AssessShared/useApiAnalysisFlashbarMessage";
import { useNugetFlashbarMessages } from "../AssessShared/useNugetFlashbarMessages";
import { InfoLink } from "../InfoLink";
import { PortConfigurationModal } from "../PortConfigurationModal/PortConfigurationModal";
import { ProjectsTable } from "./ProjectsTable";
import { SolutionSummary } from "./SolutionSummary";

interface Props {
  solution: SolutionDetails;
  projects: Loadable<Project[]>;
}

export interface CustomerFeedback {
  feedback: string;
  category: string;
  email: string;
  date: string;
}

const AssessSolutionDashboardInternal: React.FC<Props> = ({ solution, projects }) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation<HistoryState>();
  const portingLocation = usePortingAssistantSelector(state => selectPortingLocation(state, location.pathname));
  const [showPortingModal, setShowPortingModal] = useState(false);
  const targetFramework = getTargetFramework();
  const [feedbackModal, setFeedbackModalVisible] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [categoryType, setCategory] = React.useState("");
  const [emailModal, setEmailModalVisible] = React.useState(false);

  const [isCategoryEmpty, setIsCategoryEmpty] = React.useState(false);
  const [isValueEmpty, setIsValueEmpty] = React.useState(false);

  const email = window.electron.getState("email");

  useNugetFlashbarMessages(projects);
  useApiAnalysisFlashbarMessage(solution);

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
      <EnterEmailModal
        visible={emailModal}
        onCancel={() => setEmailModalVisible(false)}
        onSaveExit={() => {
          setEmailModalVisible(false);
          setFeedbackModalVisible(true);
        }}
      ></EnterEmailModal>

      <Modal
        onDismiss={() => {
          setFeedbackModalVisible(false);
          setInputValue("");
          setCategory("");
          setIsCategoryEmpty(false);
          setIsValueEmpty(false);
        }}
        visible={feedbackModal}
        closeAriaLabel="Close modal"
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => {
                  setFeedbackModalVisible(false);
                  setInputValue("");
                  setCategory("");
                  setIsCategoryEmpty(false);
                  setIsValueEmpty(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  if (categoryType === "" || categoryType == null) {
                    setIsCategoryEmpty(true);
                  }
                  if (inputValue === "" || inputValue == null) {
                    setIsValueEmpty(true);
                  }

                  if((!(categoryType === "" || categoryType == null)) && (!(inputValue === "" || inputValue == null))) {

                  
                  const cur_date = Date().toString();

                  const submission: CustomerFeedback = {
                    feedback: inputValue,
                    category: categoryType,
                    email: email,
                    date: cur_date.replace(/[^a-zA-Z0-9]/g, '-')
                  };

                  const result = await sendCustomerFeedback(submission);
                  console.log("result: " + result);

                  setFeedbackModalVisible(false);
                  setInputValue("");
                  setCategory("");
                  setIsCategoryEmpty(false);
                  setIsValueEmpty(false);
                }
                }}
              >
                Send
              </Button>
            </SpaceBetween>
          </Box>
        }
        header={<React.Fragment>Send feeback?</React.Fragment>}
      >
        <SpaceBetween size="s">
          <Alert
            onDismiss={() => setIsValueEmpty(false)}
            visible={isValueEmpty}
            dismissAriaLabel="Close alert"
            header="No Feedback Entered"
          >
            Please enter in non-empty feedback.
          </Alert>
          <Alert
            onDismiss={() => setIsCategoryEmpty(false)}
            visible={isCategoryEmpty}
            dismissAriaLabel="Close alert"
            header="Feedback Category Not Selected"
          >
            Please select a category for your feedback.
          </Alert>

          <TextContent>
            <h5>All feedback will be sent to the .NET Porting Assistant team. </h5>
          </TextContent>

          <ButtonDropdown
            items={[
              { text: "General", id: "general" },
              { text: "Question", id: "question" },
              { text: "Error", id: "error" }
            ]}
            onItemClick={e => {
              setIsCategoryEmpty(false);
              if (e.detail.id === "general") {
                console.log("general");
                setCategory("general");
              } else if (e.detail.id === "question") {
                setCategory("question");
                console.log("question");
              } else {
                setCategory("error");
                console.log("error");
                //enter additional logic for searching for any errors on screen to send to team
              }
            }}
          >
            Feedback Category
          </ButtonDropdown>

          <FormField>
            <Input
              value={inputValue}
              onChange={event => {
                setInputValue(event.detail.value);
                setIsValueEmpty(false);
              }}
              placeholder="Enter feedback"
            />
          </FormField>
        </SpaceBetween>
        Email linked with this feedback is: {email}
      </Modal>

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
                        compatibleOnly: false
                      },
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
      <Tabs tabs={tabs} activeTabId={location.state?.activeTabId || "projects"} onChange={onChangeTab} />
    </SpaceBetween>
  );
};

export const AssessSolutionDashboard = React.memo(AssessSolutionDashboardInternal);
