import { useCollection } from "@awsui/collection-hooks";
import { Box, Button, Pagination, SpaceBetween, Spinner, Table, TableProps, TextFilter } from "@awsui/components-react";
import StatusIndicator from "@awsui/components-react/status-indicator";
import React, { useMemo, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";

import { usePortingAssistantSelector } from "../../createReduxStore";
import { HistoryState } from "../../models/locationState";
import { MetricSource, MetricType, ReactMetric } from "../../models/reactmetric";
import { SolutionDetails } from "../../models/solution";
import { selectPortingLocation } from "../../store/selectors/portingSelectors";
import { selectProjects } from "../../store/selectors/solutionSelectors";
import { selectProjectTableData } from "../../store/selectors/tableSelectors";
import { filteringCountText } from "../../utils/FilteringCountText";
import { getErrorMetric } from "../../utils/getErrorMetric";
import { getHash } from "../../utils/getHash";
import { hasNewData, isLoaded, isLoading, isReloading, Loadable } from "../../utils/Loadable";
import { InfoLink } from "../InfoLink";
import { LinkComponent } from "../LinkComponent";
import { PortConfigurationModal } from "../PortConfigurationModal/PortConfigurationModal";
import { TableHeader } from "../TableHeader";

interface Props {
  solution: Loadable<SolutionDetails>;
}

export interface TableData {
  projectName: string;
  projectPath: string;
  solutionPath: string;
  targetFramework: string;
  referencedProjects: number;
  incompatiblePackages: number | null;
  totalPackages: number | null;
  incompatibleApis: number | null;
  totalApis: number | null;
  buildErrors: number | null;
  portingActions: number | null;
  ported: boolean;
  buildFailed: boolean;
}

const ProjectsTableInternal: React.FC<Props> = ({ solution }) => {
  const [selectedItems, setSelectedItems] = useState(Array<TableData>());
  const [showPortingModal, setShowPortingModal] = useState(false);
  const location = useLocation<HistoryState>();
  const history = useHistory();
  const portingLocation = usePortingAssistantSelector(state => selectPortingLocation(state, location.pathname));
  const projects = usePortingAssistantSelector(state => selectProjects(state, location.pathname));
  const tableData = usePortingAssistantSelector(state => selectProjectTableData(state, location.pathname));
  const empty = useMemo(
    () => (
      <Box textAlign="center">
        <Box margin={{ bottom: "xxs" }} padding={{ top: "xs" }}>
          <b>Solution has no projects</b>
        </Box>
      </Box>
    ),
    []
  );

  const { items, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(tableData, {
    filtering: {
      empty: empty
    },
    pagination: {},
    sorting: {}
  });

  return (
    <Table<TableData>
      {...collectionProps}
      loadingText="Loading packages"
      columnDefinitions={columnDefinitions}
      loading={(isLoading(projects) && !hasNewData(projects)) || isReloading(projects)}
      items={items}
      selectionType="multi"
      trackBy="projectPath"
      selectedItems={selectedItems}
      onSelectionChange={event => setSelectedItems(event.detail.selectedItems)}
      filter={
        <TextFilter
          {...filterProps}
          filteringPlaceholder="Search by project name"
          countText={filteringCountText(filteredItemsCount!)}
        />
      }
      pagination={<Pagination {...paginationProps} />}
      header={
        <TableHeader
          title="Projects"
          infoLink={
            <InfoLink
              heading="Projects"
              mainContent={
                <>
                  <Box variant="p">
                    Each project is identified by Visual Studio with a .csproj file. All of the project configuration is
                    contained in the .xml file.
                  </Box>

                  <Box variant="h4">Columns</Box>
                  <Box variant="p">
                    <Box variant="strong">Name</Box> - Name of the project.
                  </Box>
                  <Box variant="p">
                    <Box variant="strong">Project framework</Box> - Target framework of the project.
                  </Box>
                  <Box variant="p">
                    <Box variant="strong">Referenced projects</Box> - Number of other projects that are referenced by
                    project.
                  </Box>
                  <Box variant="p">
                    <Box variant="strong">Incompatible packages</Box> - The number of incompatible NuGet packages
                    referenced by project.
                  </Box>
                  <Box variant="p">
                    <Box variant="strong">Incompatible APIs</Box> - The number of incompatible instances of API calls
                    within the project.
                  </Box>
                  <Box variant="p">
                    <Box variant="strong">Build errors</Box> - The number of build errors in the project.
                  </Box>
                  <Box variant="p">
                    <Box variant="strong">Porting actions</Box> - The number of porting actions in the project.
                  </Box>
                  <Box variant="p">
                    <Box variant="strong">Port status</Box> - Port status of the project.
                  </Box>
                </>
              }
              learnMoreLinks={[
                {
                  externalUrl:
                    "https://docs.microsoft.com/en-us/aspnet/web-forms/overview/deployment/web-deployment-in-the-enterprise/understanding-the-project-file#msbuild-and-the-project-file",
                  text: "Understanding the project file"
                }
              ]}
            />
          }
          selectedItems={selectedItems}
          totalItems={tableData}
          description="Port your project when you have reached your desired level of compatibility."
          actionButtons={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                id="view-details-button"
                key="view-details"
                disabled={selectedItems.length !== 1}
                onClick={() =>
                  history.push(
                    `/solutions/${encodeURIComponent(selectedItems[0].solutionPath)}/${encodeURIComponent(
                      selectedItems[0].projectPath
                    )}`
                  )
                }
              >
                View details
              </Button>
              <Button
                id="port-project-button"
                key="port-project"
                disabled={selectedItems.length === 0 || !isLoaded(projects)}
                onClick={() => {
                    try {
                      if (isLoaded(projects)) {
                        let clickMetric: ReactMetric = {
                          SolutionPath: getHash(selectedItems[0].solutionPath),
                          ProjectGuid: projects.data.filter(p =>
                            selectedItems.some(s => p.projectFilePath === s.projectPath)
                          ).map(p => p.projectGuid),
                          MetricSource: MetricSource.PortSolutionSelect,
                          MetricType: MetricType.UIClickEvent
                        }
                        window.electron.writeReactLog(clickMetric);
  
                        if (portingLocation == null) {
                          setShowPortingModal(true);
                        } else {
                        history.push({
                          pathname: `/port-solution/${encodeURIComponent(selectedItems[0].solutionPath)}`,
                          state: {
                            projects: projects.data.filter(p =>
                              selectedItems.some(s => p.projectFilePath === s.projectPath)
                            )
                          }
                        });
                      }
                    }
                    } catch (err) {
                      const errorMetric = getErrorMetric(err, MetricSource.PortSolutionSelect);
                      window.electron.writeReactLog(errorMetric);
                      throw err;
                    }
                }}
              >
                Port project
              </Button>
              <PortConfigurationModal
                solution={solution}
                visible={showPortingModal}
                onDismiss={() => setShowPortingModal(false)}
                onSubmit={() => {
                  history.push({
                    pathname: `/port-solution/${encodeURIComponent(selectedItems[0].solutionPath)}`,
                    state: {
                      projects: isLoaded(projects)
                        ? projects.data.filter(p => selectedItems.some(s => p.projectFilePath === s.projectPath))
                        : []
                    }
                  });
                }}
              />
            </SpaceBetween>
          }
        />
      }
      empty={empty}
    ></Table>
  );
};

const escapeNonAlphaNumeric = (solutionPath: string) => {
  return solutionPath.replace(/[^0-9a-zA-Z]/gi, "");
};

const columnDefinitions: TableProps.ColumnDefinition<TableData>[] = [
  {
    id: "project-name",
    header: "Name",
    cell: item => (
      <LinkComponent
        id={`project-name-${escapeNonAlphaNumeric(item.projectPath)}`}
        className="project-name"
        location={{
          pathName: `/solutions/${encodeURIComponent(item.solutionPath)}/${encodeURIComponent(item.projectPath)}`
        }}
      >
        {item.projectName}
      </LinkComponent>
    ),
    sortingField: "projectName"
  },
  {
    id: "target-framework",
    header: "Project framework",
    cell: item => <div id={`target-framework-${escapeNonAlphaNumeric(item.projectPath)}`}>{item.targetFramework}</div>,
    sortingField: "projectFramework"
    //minWidth: "200px"
  },
  {
    id: "project-references",
    header: "Referenced projects",
    cell: item => (
      <div id={`project-references-${escapeNonAlphaNumeric(item.projectPath)}`}>{item.referencedProjects}</div>
    ),
    sortingField: "referencedProjects"
  },
  {
    id: "nuget-compatibility",
    header: "Incompatible packages",
    cell: item => {
      return item.incompatiblePackages == null ? (
        <Spinner />
      ) : (
        <div id={`nuget-compatibility-${escapeNonAlphaNumeric(item.projectPath)}`}>
          {item.incompatiblePackages} of {item.totalPackages}
        </div>
      );
    },
    sortingField: "incompatiblePackages"
  },
  {
    id: "api-compatibility",
    header: "Incompatible APIs",
    cell: item => {
      if (item.incompatibleApis == null) {
        return <Spinner />;
      }
      return (
        <div id={`api-compatibility-${escapeNonAlphaNumeric(item.projectPath)}`}>
          {item.buildFailed === true ? "-" : `${item.incompatibleApis} of ${item.totalApis}`}
        </div>
      );
    },
    sortingField: "incompatibleApis"
  },
  {
    id: "build-error",
    header: "Build errors",
    cell: item => {
      if (item.buildErrors == null) {
        return <Spinner />;
      }
      return (
        <div id={`build-errors-${escapeNonAlphaNumeric(item.projectPath)}`}>
          {item.buildFailed === true ? (
            <StatusIndicator type="error">Build failed</StatusIndicator>
          ) : (
            `${item.buildErrors}`
          )}
        </div>
      );
    },
    sortingField: "buildErrors"
  },
  {
    id: "porting-actions",
    header: "Porting actions",
    cell: item => {
      if (item.portingActions == null) {
        return <Spinner />;
      }
      return <div id={`build-errors-${escapeNonAlphaNumeric(item.projectPath)}`}>{item.portingActions}</div>;
    },
    sortingField: "portingActions"
  },
  {
    id: "ported",
    header: "Port status",
    cell: item => {
      return (
        <div id={`ported-${escapeNonAlphaNumeric(item.projectPath)}`}>
          {item.ported ? (
            <StatusIndicator type="success">Ported</StatusIndicator>
          ) : (
            <StatusIndicator type="stopped">Not ported</StatusIndicator>
          )}
        </div>
      );
    },
    sortingField: "ported"
    // width: 150
  }
];

export const ProjectsTable = React.memo(ProjectsTableInternal);
