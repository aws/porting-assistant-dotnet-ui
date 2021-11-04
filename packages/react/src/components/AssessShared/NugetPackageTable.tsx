import { useCollection } from "@awsui/collection-hooks";
import { Box, Pagination, Table, TableProps, TextFilter } from "@awsui/components-react";
import StatusIndicator from "@awsui/components-react/status-indicator/internal";
import React, { useMemo, useState } from "react";
import { render } from "react-dom";
import { useSelector } from "react-redux";
import { matchPath, Route, useLocation } from "react-router";
import { Link } from "react-router-dom";

import { pathValues } from "../../constants/paths";
import { usePortingAssistantSelector } from "../../createReduxStore";
import { project, projectPath, sourceFile } from "../../mockData";
import { HistoryState } from "../../models/locationState";
import { Compatibility, NugetPackage, Project } from "../../models/project";
import { SolutionDetails } from "../../models/solution";
import { selectNugetPackages, selectProjects } from "../../store/selectors/solutionSelectors";
import { selectNugetTableData } from "../../store/selectors/tableSelectors";
import { filteringCountText } from "../../utils/FilteringCountText";
import { isFailed, isLoaded, Loadable } from "../../utils/Loadable";
import { nugetPackageKey } from "../../utils/NugetPackageKey";
import { AssessProjectDashboard } from "../AssessProject/AssessProjectDashboard";
import { InfoLink } from "../InfoLink";
import { LinkComponent } from "../LinkComponent";
import { PortingAssistantAppLayout } from "../PortingAssistantAppLayout";
import { TableHeader } from "../TableHeader";
import { FileTable, SourceFile } from "./FileTable";

export type NugetPackageTableFields = NugetPackage & {
  frequency: number;
  sourceFiles: number;
  sourceFilesList: string[];
  apis: number;
  replacement: string;
  compatible: Compatibility;
  failed: boolean;
  deprecated: boolean;
};

const NugetPackageTableInternal: React.FC = () => {
  const location = useLocation<HistoryState>();
  const nugetPackages = useSelector(selectNugetPackages);
  const nugetPackagesWithFields = usePortingAssistantSelector(state => selectNugetTableData(state, location.pathname));
  const projects = usePortingAssistantSelector(state => selectProjects(state, location.pathname));

  const isSingleProject = useMemo(() => {
    const match = matchPath<{ solution: string; project: string }>(location.pathname, {
      path: pathValues,
      exact: true,
      strict: false
    });
    if (match == null || match.params?.project == null) {
      return false;
    }
    return true;
  }, [location.pathname]);

  const isTableLoading = useMemo(() => {
    if (!isLoaded(projects)) {
      return false;
    }
    const allNugetpackages = projects.data.flatMap(p => p.packageReferences || []);
    if (allNugetpackages.length === 0) {
      return false;
    }
    return (
      allNugetpackages.filter(
        dep =>
          dep.packageId != null &&
          (isLoaded(nugetPackages[nugetPackageKey(dep.packageId, dep.version)]) ||
            isFailed(nugetPackages[nugetPackageKey(dep.packageId, dep.version)]))
      ).length === 0
    );
  }, [nugetPackages, projects]);

  const columnDefinitions: TableProps.ColumnDefinition<NugetPackageTableFields>[] = [
    {
      id: "package-id",
      header: "Name",
      cell: item => <div id={`package-id-${escapeNonAlphaNumeric(item.packageId || "")}`}>{item.packageId}</div>,
      sortingField: "packageId"
    },
    {
      id: "package-version",
      header: "Version",
      cell: item => <div id={`package-version-${escapeNonAlphaNumeric(item.packageId || "")}`}>{item.version}</div>,
      sortingField: "version"
    },
    {
      id: "projects",
      header: "Projects",
      cell: item => <div id={`projects-${escapeNonAlphaNumeric(item.packageId || "")}`}>{item.frequency}</div>,
      sortingField: "frequency"
    },
    {
      id: "source-files",
      header: "Source Files",
      cell: item => 
        <Link to={{
                pathname: location.pathname ,
                state: {
                  activeFilter: item.sourceFilesList.join(),
                  activeTabId: "source-files",
                  fromNugetPackageTab: true
              }
            }}>
        <div id={`source-files-${escapeNonAlphaNumeric(item.packageId || "")}`}>
        {item.sourceFiles}
        </div>
        </Link>,
      sortingField: "sourceFiles"
    },
    {
      id: "apis",
      header: "APIs",
      cell: item => <div id={`apis-${escapeNonAlphaNumeric(item.packageId || "")}`}>{item.apis}</div>,
      sortingField: "apis"
    },
    {
      id: "status",
      header: "Status",
      cell: item => (
        <div id={`compatibility-${escapeNonAlphaNumeric(item.packageId || "")}`}>
          {item.failed ? (
            <StatusIndicator type="warning">Failed</StatusIndicator>
          ) : item.compatible === "COMPATIBLE" ? (
            <StatusIndicator type="success">Compatible</StatusIndicator>
          ) : item.compatible === "UNKNOWN" ? (
            <StatusIndicator type="info">Unknown</StatusIndicator>
          ) : item.deprecated ? (
            <StatusIndicator type="info">Deprecated</StatusIndicator>
          ) : (
            <StatusIndicator type="error">Incompatible</StatusIndicator>
          )}
        </div>
      ),
      sortingField: "compatible"
      // minWidth: "150px"
    },
    {
      id: "suggested-replacement",
      header: "Suggested replacement",
      cell: item => (
        <div id={`suggested-replacement-${escapeNonAlphaNumeric(item.packageId || "")}`}>{item.replacement}</div>
      ),
      sortingField: "replacement"
    }
  ];
  
  const columnDefinitionWithProject = columnDefinitions.filter(
    definition => definition.id !== "projects" || !isSingleProject
  );

  const { items, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(
    nugetPackagesWithFields,
    {
      filtering: {
        empty: empty
      },
      pagination: {},
      sorting: {}
    }
  );

  return (
    <Table<NugetPackageTableFields>
      {...collectionProps}
      loadingText="Loading packages"
      columnDefinitions={columnDefinitionWithProject}
      loading={isTableLoading}
      items={items}
      filter={
        <TextFilter
          {...filterProps}
          filteringPlaceholder="Search NuGet package by name"
          countText={filteringCountText(filteredItemsCount!)}
        />
      }
      pagination={<Pagination {...paginationProps} />}
      header={
        <TableHeader
          title="NuGet packages"
          totalItems={nugetPackagesWithFields}
          infoLink={
            <InfoLink
              heading="NuGet packages"
              mainContent={
                <>
                  <Box variant="p">
                    A NuGet package is a single .zip file that includes compiled code, files related to the code, and a
                    descriptive manifest.
                  </Box>

                  <Box variant="h4">Columns</Box>
                  <Box variant="p">
                    <Box variant="strong">Name</Box> - Name of the NuGet package.
                  </Box>
                  <Box variant="p">
                    <Box variant="strong">Version</Box> - The package version.
                  </Box>
                  <Box variant="p">
                    <Box variant="strong">Projects</Box> - The number of projects that include the NuGet package.
                  </Box>
                  <Box variant="p">
                    <Box variant="strong">Source files</Box> - The number of source files that include APIs from the
                    Nuget package.
                  </Box>
                  <Box variant="p">
                    <Box variant="strong">APIs</Box> - The number of instances of API calls from the package within the
                    project.
                  </Box>
                  <Box variant="p">
                    <Box variant="strong">Status</Box> - Compatibility status of the NuGet package.
                  </Box>
                  <Box variant="p">
                    <Box variant="strong">Suggested replacements</Box> - Suggested replacements for compatiblity.
                  </Box>
                  <Box variant="p">
                    <Box variant="strong">Notes:</Box> Porting Assistant does not support assessing the compatibility of
                    private NuGet packages. Private NuGet packages will have the compatibility result of unknown. To
                    assess the compatibility of private NuGet packages, add the solution of the package as a separate
                    assessment.
                  </Box>
                </>
              }
              learnMoreLinks={[
                {
                  externalUrl: "https://docs.microsoft.com/en-us/nuget/what-is-nuget",
                  text: "An introduction to NuGet"
                }
              ]}
            />
          }
        />
      }
      empty={empty}
    ></Table>
  );
};


const empty = (
  <Box textAlign="center">
    <Box margin={{ bottom: "xxs" }} padding={{ top: "xs" }}>
      <b>No NuGet packages</b>
    </Box>

    <Box variant="p" margin={{ bottom: "xs" }}>
      No NuGet packages to display.
    </Box>
  </Box>
);

const escapeNonAlphaNumeric = (solutionPath: string) => {
  return solutionPath.replace(/[^0-9a-zA-Z]/gi, "");
};

export const NugetPackageTable = React.memo(NugetPackageTableInternal);
