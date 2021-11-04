import { useCollection } from "@awsui/collection-hooks";
import { Box, Button, Pagination, SpaceBetween, Table, TableProps, TextFilter } from "@awsui/components-react";
import React, { useMemo, useState } from "react";
import { useHistory, useLocation } from "react-router";

import { usePortingAssistantSelector } from "../../createReduxStore";
import { HistoryState } from "../../models/locationState";
import { selectFileTableData } from "../../store/selectors/tableSelectors";
import { filteringCountText } from "../../utils/FilteringCountText";
import { InfoLink } from "../InfoLink";
import { LinkComponent } from "../LinkComponent";
import { TableHeader } from "../TableHeader";

export interface SourceFile {
  solutionPath: string;
  projectPath: string;
  sourceFilePath: string;
  incompatibleApis: number;
  totalApis: number;
  portability: string;
  portabilityNumber: number;
  isProjectPage: boolean;
}

const FileTableInternal: React.FC = () => {
  const location = useLocation<HistoryState>();
  const history = useHistory();
  const [selected, setSelected] = useState<SourceFile[]>([]);
  const [filterText, setFilterText] = useState(location.state?.activeFilter || "");
  const [fromNugetPackageTab, setFromNugetPackageTab] = useState(location.state?.fromNugetPackageTab || false);
  const [sortDetail, setSortDetail] = useState<TableProps.SortingState<SourceFile>>({
    sortingColumn: {
      sortingField: "sourceFilePath"
    },
    isDescending: false
  });
  const tableItems = usePortingAssistantSelector(state => selectFileTableData(state, location.pathname));
  const isLoading = useMemo(() => tableItems == null, [tableItems]);
  const loadedItems = useMemo(() => tableItems || [], [tableItems]);

  const filteredItems = useMemo(() => {
    const allItems = loadedItems;
    const isEmpty = filterText === "";
    const filterItems = filterText.split(",");
    
    if (isEmpty)
    {
      if (fromNugetPackageTab) return [];
      else return allItems;
    } 
    else 
    {
      return allItems.filter(
        item => {
          return filterItems.some(fitem => {
            let pathElements = item.sourceFilePath.split("\\")
            return pathElements[pathElements.length - 1].toLowerCase() === fitem.toLowerCase()
          })
        }
      );
    }
  }, [filterText, loadedItems]);

  const curPage = useMemo(() => location.state?.activePage || 1, [location.state]);

  const curItems = useMemo(() => {
    const descending = sortDetail.isDescending ? -1 : 1;
    const sortedItems = filteredItems.sort((a, b) => {
      const column = columnDefinitions.find(c => c.sortingField === sortDetail.sortingColumn.sortingField);
      if (column?.sortingField != null) {
        if ((a as any)[column.sortingField] === (b as any)[column.sortingField]) {
          return 0;
        }
        return ((a as any)[column.sortingField] > (b as any)[column.sortingField] ? 1 : -1) * descending;
      }
      return 1 * descending;
    });
    return sortedItems.slice((curPage - 1) * PAGE_SIZE, (curPage - 1) * PAGE_SIZE + PAGE_SIZE);
  }, [curPage, filteredItems, sortDetail.sortingColumn, sortDetail.isDescending]);

  const { items, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(curItems, {
    filtering: {
      empty: empty
    },
    pagination: { pageSize: PAGE_SIZE },
    sorting: {}
  });

  return (
    <Table<SourceFile>
      {...collectionProps}
      loadingText="Loading source files"
      sortingColumn={sortDetail?.sortingColumn}
      sortingDescending={sortDetail?.isDescending}
      onSortingChange={e => {
        setSortDetail(e.detail);
      }}
      columnDefinitions={columnDefinitions}
      loading={isLoading}
      items={items}
      selectionType="single"
      trackBy="sourceFilePath"
      selectedItems={selected}
      onSelectionChange={event => setSelected(event.detail.selectedItems)}
      filter={
        <TextFilter
          {...filterProps}
          filteringPlaceholder="Search by source file name"
          countText={filteringCountText(filteredItemsCount!)}
          onChange={e => setFilterText(e.detail.filteringText)}
        />
      }
      pagination={
        <Pagination
          {...paginationProps}
          pagesCount={Math.ceil(filteredItems.length / PAGE_SIZE)}
          currentPageIndex={curPage}
          onChange={e => {
            history.push({
              pathname: location.pathname,
              state: {
                activePage: e.detail.currentPageIndex,
                activeTabId: location.state?.activeTabId
              }
            });
          }}
        />
      }
      header={
        <TableHeader
          title="Source files"
          infoLink={
            <>
              <InfoLink
                heading="Source files"
                mainContent={
                  <>
                    <Box variant="p">
                      Select a source file to view the incompatible API calls and replacement suggestions in the source
                      code.
                    </Box>
                    <Box variant="h4">Columns</Box>
                    <Box variant="p">
                      <Box variant="strong">Source file name</Box> - Name of the source file.
                    </Box>
                    <Box variant="p">
                      <Box variant="strong">Incompatible API calls</Box> - The number of incompatible API calls in the
                      source file.
                    </Box>
                  </>
                }
                learnMoreLinks={[]}
              />
            </>
          }
          totalItems={filteredItems}
          actionButtons={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                disabled={selected.length !== 1}
                onClick={() =>
                  history.push({
                    pathname: `/solutions/${encodeURIComponent(selected[0].solutionPath)}/${encodeURIComponent(
                      selected[0].projectPath
                    )}/${encodeURIComponent(selected[0].sourceFilePath)}`,
                    state: { solutionOnly: !selected[0].isProjectPage }
                  })
                }
                id="view-details-button"
              >
                View details
              </Button>
            </SpaceBetween>
          }
        />
      }
      empty={empty}
    ></Table>
  );
};

const PAGE_SIZE = 10;

const empty = (
  <Box textAlign="center">
    <Box margin={{ bottom: "xxs" }} padding={{ top: "xs" }}>
      <b>No source files</b>
    </Box>

    <Box variant="p" margin={{ bottom: "xs" }}>
      No source files to display.
    </Box>
  </Box>
);

const columnDefinitions: TableProps.ColumnDefinition<SourceFile>[] = [
  {
    id: "source-file",
    header: "Source file name",
    cell: item => (
      <LinkComponent
        location={{
          pathName: `/solutions/${encodeURIComponent(item.solutionPath)}/${encodeURIComponent(
            item.projectPath
          )}/${encodeURIComponent(item.sourceFilePath)}`,
          state: { solutionOnly: item.isProjectPage }
        }}
      >
        {window.electron.getRelativePath(
          item.isProjectPage ? item.projectPath : item.solutionPath,
          item.sourceFilePath
        )}
      </LinkComponent>
    ),
    sortingField: "sourceFilePath",
    sortingComparator: (a: SourceFile, b: SourceFile) => {
      const aPath = window.electron.getRelativePath(a.isProjectPage ? a.projectPath : a.solutionPath, a.sourceFilePath);
      const bPath = window.electron.getRelativePath(b.isProjectPage ? b.projectPath : b.solutionPath, b.sourceFilePath);
      return aPath.localeCompare(bPath);
    }
  },
  {
    id: "incompatible-api-calls",
    header: "Incompatible API calls",
    cell: item => `${item.incompatibleApis} of ${item.totalApis}`,
    sortingField: "incompatibleApis",
    sortingComparator: (a: SourceFile, b: SourceFile) => a.incompatibleApis - b.incompatibleApis
  }
];

export const FileTable = React.memo(FileTableInternal);
