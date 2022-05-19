import { useCollection } from "@awsui/collection-hooks";
import {
  Box,
  Button,
  ButtonDropdown,
  Modal,
  Pagination,
  SpaceBetween,
  Table,
  TableProps,
  TextFilter
} from "@awsui/components-react";
import StatusIndicator from "@awsui/components-react/status-indicator/internal";
import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { v4 as uuid } from "uuid";

import { externalUrls } from "../../constants/externalUrls";
import { PreTriggerData } from "../../models/project";
import { analyzeSolution, exportSolution, openSolutionInIDE, removeSolution } from "../../store/actions/backend";
import { pushCurrentMessageUpdate, removeCurrentMessageUpdate } from "../../store/actions/error";
import { removePortedSolution } from "../../store/actions/porting";
import { selectSolutionToSolutionDetails} from "../../store/selectors/solutionSelectors";
import { getErrorCounts, selectDashboardTableData, selectSolutionToApiAnalysis
 } from "../../store/selectors/tableSelectors";
import { checkInternetAccess } from "../../utils/checkInternetAccess";
import { filteringCountText } from "../../utils/FilteringCountText";
import { getCompatibleApi } from "../../utils/getCompatibleApi";
import { getTargetFramework } from "../../utils/getTargetFramework";
import { isLoaded } from "../../utils/Loadable";
import { useNugetFlashbarMessages } from "../AssessShared/useNugetFlashbarMessages";
import { InfoLink } from "../InfoLink";
import { LinkComponent } from "../LinkComponent";
import { TableHeader } from "../TableHeader";
import styles from "./DashboardTable.module.scss";
import { useSolutionFlashbarMessage } from "./useSolutionFlashbarMessage";

export interface DashboardTableData {
  name: string;
  path: string;
  portedProjects?: number;
  totalProjects?: number;
  incompatiblePackages?: number;
  totalPackages?: number;
  incompatibleApis?: number;
  totalApis?: number;
  buildErrors?: number;
  portingActions?: number;
  failed?: boolean;
}

const DashboardTableInternal: React.FC = () => {
  const [selectedItems, setSelectedItems] = useState(Array<DashboardTableData>());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const dispatch = useDispatch();
  const history = useHistory();
  const solutionToSolutionDetails = useSelector(selectSolutionToSolutionDetails);
  
  const tableData = useSelector(selectDashboardTableData);
  const targetFramework = getTargetFramework();
  useNugetFlashbarMessages();
  useSolutionFlashbarMessage(tableData);
  const apiAnalysis = useSelector(selectSolutionToApiAnalysis); 
  const deleteSolution = useMemo(
    () => (solutionPath: string) => {
      dispatch(removeSolution(solutionPath));
      dispatch(removePortedSolution(solutionPath));
      setSelectedItems([]);
    },
    [dispatch]
  );

  const reassessSolution = useMemo(
    () => async (solutionPath: string) => {
      dispatch(
        removeCurrentMessageUpdate({
          groupId: "assessSuccess"
        })
      );

      let projectTableData: PreTriggerData[] = [];
      const solutionDetails = solutionToSolutionDetails[solutionPath];
      const projectToApiAnalysis = apiAnalysis[solutionPath];
      if (isLoaded(solutionDetails)) {
          projectTableData = solutionDetails.data.projects.map<PreTriggerData>(project => {
            const apis = getCompatibleApi(
              solutionDetails,
              projectToApiAnalysis,
              project.projectFilePath,
              null,
              targetFramework
            );
            var projectApiAnalysisResult = projectToApiAnalysis[project.projectFilePath];
            var sourceFileAnalysisResults = (isLoaded(projectApiAnalysisResult))?
                 projectApiAnalysisResult.data.sourceFileAnalysisResults: null;
            return {
              projectName: project.projectName || "-",
              projectPath: project.projectFilePath || "-",
              solutionPath: solutionPath || "-",
              targetFramework: project.targetFrameworks?.join(", ") || "-",
              incompatibleApis: apis.isApisLoading ? null : apis.values[1] - apis.values[0],
              totalApis: apis.values[1],
              buildErrors: getErrorCounts(projectToApiAnalysis, project.projectFilePath, null),
              ported: false,
              sourceFileAnalysisResults: sourceFileAnalysisResults
            };
          });
      }
      
      const haveInternet = await checkInternetAccess(solutionPath, dispatch);
      if (haveInternet) {
        let preTriggerDataArray: string[] = [];
        projectTableData.forEach(element => {preTriggerDataArray.push(JSON.stringify(element));});

        dispatch(
          analyzeSolution.request({
            solutionPath: solutionPath,
            runId: uuid(),
            triggerType: "UserRequest",
            settings: {
              ignoredProjects: [],
              targetFramework: targetFramework,
              continiousEnabled: false,
              actionsOnly: false,
              compatibleOnly: false
            },
            preTriggerData: preTriggerDataArray,
            force: true
          })
        );
      }
    },
    [dispatch, targetFramework]
  );

  const header = useMemo(
    () => (
      <TableHeader
        title="Assessed solutions"
        infoLink={
          <InfoLink
            heading="Assessed solutions"
            mainContent={
              <>
                <p>
                  Select a solution to view the solution details, including an assessment overview. You can also port
                  your projects when you have attained your desired compatibility for the projects. To reassess a
                  solution, choose Reassess solution. To assess a new solution choose the Assess a new solution button.
                </p>
                <h4>Build errors</h4>
                <p>The total number of build errors for solutions.</p>
                <h4>Porting actions</h4>
                <p>The total number of porting actions for solutions.</p>
              </>
            }
            learnMoreLinks={[
              {
                externalUrl: externalUrls.howItWorks,
                text: "How Porting Assistant for .NET works"
              }
            ]}
          />
        }
        description="Porting Assistant for .NET has successfully assessed the following solutions for .NET Core compatibility. Improve the compatibility of your solutions by refactoring the code in your IDE."
        totalItems={Object.values(solutionToSolutionDetails).map(solutionDetail =>
          isLoaded(solutionDetail) ? solutionDetail.data : undefined
        )}
        selectedItems={selectedItems}
        actionButtons={
          <SpaceBetween size="xs" direction="horizontal">
            <Button
              id="view-details-button"
              key="view-details"
              disabled={
                selectedItems.length !== 1 ||
                (selectedItems.length === 1 &&
                  (selectedItems[0].portedProjects == null ||
                    selectedItems[0].incompatiblePackages == null ||
                    selectedItems[0].incompatibleApis == null ||
                    selectedItems[0].portingActions == null ||
                    selectedItems[0].buildErrors == null))
              }
              onClick={() => history.push(`/solutions/${encodeURIComponent(selectedItems[0].path)}`)}
            >
              View details
            </Button>
            <ButtonDropdown
              id="actions-dropdown"
              key="actions-dropdown"
              items={[
                { text: "Export assessment report", id: "download" },
                { text: "View in Visual Studio", id: "view" },
                { text: "Remove", id: "delete" }
              ]}
              disabled={selectedItems.length === 0}
              onItemClick={event => {
                switch (event.detail.id) {
                  case "download":
                    dispatch(exportSolution({ solutionPath: selectedItems[0].path }));
                    break;
                  case "delete":
                    setShowDeleteModal(true);
                    break;
                  case "view":
                    dispatch(openSolutionInIDE(selectedItems[0].path));
                }
              }}
            >
              Actions
            </ButtonDropdown>
            <Button
              id="reassess-solution"
              key="reassess-solution"
              disabled={selectedItems.length === 0}
              onClick={() => {
                reassessSolution(selectedItems[0].path);
              }}
              iconName="refresh"
            >
              Reassess solution
            </Button>
            <Button
              id="assess-new-solution-button"
              variant="primary"
              key="assess-new-solution"
              onClick={() => history.push("/add-solution")}
            >
              Assess a new solution
            </Button>
            <Modal
              visible={showDeleteModal}
              header={`Remove ${selectedItems[0]?.name}?`}
              footer={
                <Box variant="span" float="right">
                  <Button
                    id="cancel-remove-button"
                    variant="link"
                    formAction="none"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    id="remove-solution-button"
                    variant="primary"
                    formAction="none"
                    onClick={() => {
                      deleteSolution(selectedItems[0].path);
                      dispatch(
                        pushCurrentMessageUpdate({
                          type: "success",
                          messageId: uuid(),
                          content: `Successfully removed ${selectedItems[0].name}.`,
                          dismissible: true
                        })
                      );
                      setShowDeleteModal(false);
                    }}
                  >
                    Remove
                  </Button>
                </Box>
              }
              onDismiss={() => setShowDeleteModal(false)}
            >
              The assessment report for your solution will be removed from the Porting Assistant for .NET tool. Your
              source code will not be deleted.
            </Modal>
          </SpaceBetween>
        }
      />
    ),
    [deleteSolution, dispatch, history, reassessSolution, selectedItems, showDeleteModal, solutionToSolutionDetails]
  );

  const empty = useMemo(
    () => (
      <Box textAlign="center">
        <Box margin={{ bottom: "xxs" }} padding={{ top: "xs" }}>
          <b>No solutions</b>
        </Box>

        <Box variant="p" margin={{ bottom: "xs" }}>
          No solutions to display.
        </Box>
        <Box margin={{ bottom: "m" }}>
          <Button onClick={() => history.push("/add-solution")}>Add a solution</Button>
        </Box>
      </Box>
    ),
    [history]
  );

  const { items, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(tableData, {
    filtering: {
      empty: empty,
      fields: ["solutionName"]
    },
    pagination: {},
    sorting: {}
  });

  return (
    <Table<DashboardTableData>
      {...collectionProps}
      id="dashboard-table"
      loadingText="Loading solutions"
      columnDefinitions={columnDefinitions}
      loading={tableData == null}
      items={items}
      selectionType="single"
      trackBy="path"
      selectedItems={selectedItems}
      onSelectionChange={event => setSelectedItems(event.detail.selectedItems)}
      filter={
        <TextFilter
          {...filterProps}
          filteringPlaceholder="Search by solution name"
          countText={filteringCountText(filteredItemsCount!)}
        />
      }
      pagination={<Pagination {...paginationProps} />}
      header={header}
      empty={empty}
    ></Table>
  );
};

const escapeNonAlphaNumeric = (solutionPath: string) => {
  return solutionPath?.replace(/[^0-9a-zA-Z]/gi, "");
};

const columnDefinitions: TableProps.ColumnDefinition<DashboardTableData>[] = [
  {
    id: "name",
    header: "Name",
    cell: item =>
      (
        <LinkComponent
          id={`solution-link-${escapeNonAlphaNumeric(item.path)}`}
          className="solution-link"
          location={{ pathName: `/solutions/${encodeURIComponent(item.path)}` }}
        >
          {item.name}
        </LinkComponent>
      ),
    sortingField: "name"
  },
  {
    id: "ported-projects",
    header: "Ported projects",
    cell: item => (
      <div id={`ported-projects-${escapeNonAlphaNumeric(item.path)}`} className="ported-projects">
        {item.portedProjects == null ? inProgress() : `${item.portedProjects} of ${item.totalProjects}`}
      </div>
    ),
    sortingField: "portedProjects"
  },
  {
    id: "incompatible-packages",
    header: "Incompatible packages",
    cell: item => (
      <div id={`incompatible-packages-${escapeNonAlphaNumeric(item.path)}`} className="compatible-packages">
        {item.incompatiblePackages == null ? inProgress() : `${item.incompatiblePackages} of ${item.totalPackages}`}
      </div>
    ),
    sortingField: "incompatiblePackages"
  },
  {
    id: "incompatible-apis",
    header: "Incompatible APIs",
    cell: item => (
      <div id={`incompatible-apis-${escapeNonAlphaNumeric(item.path)}`} className="compatible-apis">
        {item.incompatibleApis == null ? inProgress() : `${item.incompatibleApis} of ${item.totalApis}`}
      </div>
    ),
    sortingField: "incompatibleApis"
  },
  {
    id: "build-error",
    header: "Build errors",
    cell: item => (
      <div id={`build-error-${escapeNonAlphaNumeric(item.path)}`} className="build-error">
        {item.failed === true ? (
          <StatusIndicator type="error">Build failed</StatusIndicator>
        ) : item.buildErrors == null ? (
          inProgress()
        ) : (
          item.buildErrors
        )}
      </div>
    ),
    sortingField: "buildErrors"
  },
  {
    id: "porting-action",
    header: "Porting actions",
    cell: item => (
      <div id={`porting-action-${escapeNonAlphaNumeric(item.path)}`} className="porting-action">
        {item.portingActions == null ? inProgress() : item.portingActions}
      </div>
    ),
    sortingField: "portingActions"
  }
];

const inProgress = () => <StatusIndicator type="in-progress">In progress</StatusIndicator>;
export const DashboardTable = React.memo(DashboardTableInternal);
