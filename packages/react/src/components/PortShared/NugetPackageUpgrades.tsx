import { useCollection } from "@awsui/collection-hooks";
import {
  Box,
  Container,
  Header,
  Link,
  Modal,
  Pagination,
  Select,
  SelectProps,
  SpaceBetween,
  Table,
  TableProps,
  TextFilter
} from "@awsui/components-react";
import React, { useMemo, useState } from "react";
import { FormContextValues } from "react-hook-form";
import { useLocation } from "react-router";

import { usePortingAssistantSelector } from "../../createReduxStore";
import { ApiAnalysisResult, NugetPackage, Project } from "../../models/project";
import { SolutionDetails } from "../../models/solution";
import { selectCurrentSolutionApiAnalysis, selectNugetPackages } from "../../store/selectors/solutionSelectors";
import { compareSemver } from "../../utils/compareSemver";
import { filteringCountText } from "../../utils/FilteringCountText";
import { getTargetFramework } from "../../utils/getTargetFramework";
import { isLoaded } from "../../utils/Loadable";
import { nugetPackageKey } from "../../utils/NugetPackageKey";
import { TableHeader } from "../TableHeader";
import styles from "./NugetPackageUpgrades.module.scss";
import tableStyles from "./Table.module.scss";

interface Props extends Pick<FormContextValues, "watch"> {
  solution: SolutionDetails;
  projects: Project[];
  onChange: (target: { [packageId: string]: SelectProps.Option }) => void;
  isSubmitting: boolean;
  value?: { [packageId: string]: SelectProps.Option };
}

type DeprecatedApi = { apiName: string; lastVersion?: string };

const escapeNonAlphaNumeric = (solutionPath: string) => {
  return solutionPath.replace(/[^0-9a-zA-Z]/gi, "");
};

const NugetPackageUpgradesInternal: React.FC<Props> = ({ projects, onChange, watch, isSubmitting, value }) => {
  const location = useLocation();
  const nugetPackages = usePortingAssistantSelector(selectNugetPackages);
  const solutionApiAnalysis = usePortingAssistantSelector(state =>
    selectCurrentSolutionApiAnalysis(state, location.pathname)
  );
  const [selectedNugetPackageVersion, setSelectedNugetPackageVersion] = useState<{
    [packageId: string]: SelectProps.Option;
  }>(value || {});
  const target = watch("target");
  const [showModal, setShowModal] = useState(false);
  const [modalItems, setModalItems] = useState<DeprecatedApi[]>([]);
  const [modalTitle, setModalTitle] = useState<string>("");
  const targetFramework = getTargetFramework();

  const nugetPackagesInProjects = useMemo(
    () =>
      Object.values(
        projects.reduce((agg, cur) => {
          cur.packageReferences?.forEach(dep => {
            if (dep.packageId == null) {
              return;
            }
            agg[dep.packageId] = dep;
          });
          return agg;
        }, {} as { [key: string]: NugetPackage })
      ).sort((a, b) => (a.packageId! < b.packageId! ? 0 : 1)),
    [projects]
  );

  const deprecatedApiByPackageVersion = useMemo(() => {
    const apisByPackages = projects.reduce((agg, cur) => {
      const apiAnalysis = solutionApiAnalysis[cur.projectFilePath];
      if (!isLoaded(apiAnalysis) || apiAnalysis.data.sourceFileAnalysisResults == null) {
        return agg;
      }
      Object.values(apiAnalysis.data.sourceFileAnalysisResults).forEach(sourceFileAnalysisResult => {
        sourceFileAnalysisResult.apiAnalysisResults.forEach(api => {
          const key = api.codeEntityDetails.package?.packageId;
          const method = api.codeEntityDetails?.originalDefinition;
          if (
            key == null ||
            method == null ||
            !isLoaded(
              nugetPackages[
                nugetPackageKey(
                  api.codeEntityDetails.package?.packageId || "",
                  api.codeEntityDetails.package?.version || ""
                )
              ]
            )
          ) {
            return;
          }
          if (
            !nugetPackagesInProjects.some(
              n =>
                n.packageId.toLocaleLowerCase() === api.codeEntityDetails.package?.packageId.toLocaleLowerCase() &&
                n.version === api.codeEntityDetails.package?.version
            ) &&
            api.codeEntityDetails != null &&
            api.codeEntityDetails.package?.packageId != null &&
            api.codeEntityDetails.package.packageSourceType === "NUGET"
          ) {
            nugetPackagesInProjects.push({
              packageId: api.codeEntityDetails.package?.packageId,
              version: api.codeEntityDetails.package?.version
            });
          }
          if (agg[key] == null) {
            agg[key] = [];
          }
          agg[key].push(api);
        });
      });
      return agg;
    }, {} as { [nugetPackage: string]: ApiAnalysisResult[] });

    const result = {} as {
      [packageId: string]: { [version: string]: { totalApis: number; deprecatedApis: DeprecatedApi[] } };
    };

    Object.keys(apisByPackages).forEach(packageId => {
      result[packageId] = {};
      const apis = apisByPackages[packageId];
      const packageVersionPair = nugetPackagesInProjects.find(
        p => p.packageId.toLowerCase() === packageId.toLowerCase()
      );
      const key = nugetPackageKey(packageVersionPair?.packageId || "", packageVersionPair?.version || "");
      const nugetPackage = nugetPackages[key];
      if (!isLoaded(nugetPackage) || nugetPackage.data.packageVersionPair.version == null) {
        return;
      }

      const apiCompatVersion: { [api: string]: string } = {};
      nugetPackage.data.compatibilityResults[targetFramework]?.compatibleVersions
        .map(v => v)
        .sort((a, b) => compareSemver(a, b))
        .forEach(version => {
          if (result[packageId][version] === undefined) {
            result[packageId][version] = {
              totalApis: 0,
              deprecatedApis: []
            };
          }
          apis
            .filter(api => api.codeEntityDetails.originalDefinition != null)
            .forEach(api => {
              result[packageId][version].totalApis += 1;
              const apiName = api.codeEntityDetails!.originalDefinition || "";
              if (!api.compatibilityResults[targetFramework]?.compatibleVersions?.some(v => v === version)) {
                result[packageId][version].deprecatedApis.push({
                  apiName: apiName,
                  lastVersion: apiCompatVersion[apiName]
                });
              } else {
                apiCompatVersion[apiName] = version;
              }
            });
        });
    });
    return result;
  }, [nugetPackages, nugetPackagesInProjects, projects, solutionApiAnalysis, targetFramework]);

  const upgradeTable = useMemo(
    () =>
      nugetPackagesInProjects
        .map(nugetPackageInProject => {
          const nugetPackage =
            nugetPackages[nugetPackageKey(nugetPackageInProject?.packageId, nugetPackageInProject?.version)];
          if (!isLoaded(nugetPackage)) {
            return null;
          }
          const compatibleVersion =
            nugetPackage.data.compatibilityResults[target?.id || targetFramework]?.compatibleVersions;
          const options = Object.values(compatibleVersion)
            .filter(
              compatibleVersion =>
                compareSemver(compatibleVersion, nugetPackageInProject.version || "") > 0 &&
                !compatibleVersion.includes("-")
            )
            .map(version => {
              const apis =
                deprecatedApiByPackageVersion[nugetPackageInProject.packageId!] != null &&
                deprecatedApiByPackageVersion[nugetPackageInProject.packageId!][version] != null
                  ? deprecatedApiByPackageVersion[nugetPackageInProject.packageId!][version]
                  : { deprecatedApis: [], totalApis: 0 };
              return {
                id: nugetPackage.data.packageVersionPair.packageId,
                label: version,
                description: `Deprecated API calls: ${apis.deprecatedApis.length} of ${apis.totalApis}`
              };
            });
          if (options.length === 0) {
            return null;
          }

          const selectedApi = getDeprecatedApis(
            nugetPackageInProject,
            selectedNugetPackageVersion,
            deprecatedApiByPackageVersion
          );
          return (
            <tr key={nugetPackage.data.packageVersionPair.packageId}>
              <td>
                <div>{nugetPackage.data.packageVersionPair.packageId}</div>
                <Box variant="small">Version: {nugetPackageInProject.version}</Box>
              </td>
              <td>
                <Select
                  id={`select-version-${escapeNonAlphaNumeric(nugetPackage.data.packageVersionPair.packageId || "")}`}
                  disabled={isSubmitting}
                  className={styles.upgradeSelectField}
                  selectedOption={
                    selectedNugetPackageVersion[nugetPackage.data.packageVersionPair.packageId] || options[0]
                  }
                  options={options}
                  onChange={event => {
                    const result = {
                      ...selectedNugetPackageVersion,
                      [nugetPackage.data.packageVersionPair.packageId]: event.detail.selectedOption
                    };
                    setSelectedNugetPackageVersion(result);
                    onChange(result);
                  }}
                />
              </td>
              <td>
                <div>
                  <Link
                    href="#/"
                    onFollow={event => {
                      event.preventDefault();
                      event.stopPropagation();
                      setModalTitle(`${nugetPackage.data.packageVersionPair.packageId} deprecated API calls`);
                      setModalItems(selectedApi.deprecatedApis);
                      setShowModal(true);
                    }}
                  >
                    {`${selectedApi.deprecatedApis.length} of ${selectedApi.totalApis}`}
                  </Link>
                </div>
              </td>
            </tr>
          );
        })
        .filter(n => n != null),
    [
      deprecatedApiByPackageVersion,
      isSubmitting,
      nugetPackages,
      nugetPackagesInProjects,
      onChange,
      selectedNugetPackageVersion,
      target?.id,
      targetFramework
    ]
  );

  const { items, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(modalItems, {
    filtering: {
      empty: empty
    },
    pagination: { pageSize: 10 },
    sorting: {}
  });

  const sortingColumn = {
    sortingField: "latest-supported-version"
  };

  if (upgradeTable.length === 0) {
    return null;
  }

  return (
    <SpaceBetween size="m">
      <Container header={<Header variant="h2">NuGet package upgrades</Header>}>
        <table className={styles.upgradeTable}>
          <tbody>
            <tr>
              <td>NuGet package</td>
              <td>Upgrade to version</td>
              <td>Deprecated API calls</td>
            </tr>
            {upgradeTable}
          </tbody>
        </table>
      </Container>
      <Modal
        className={styles.modal}
        visible={showModal}
        size="max"
        onDismiss={() => setShowModal(false)}
        header={
          <TableHeader
            title={modalTitle}
            totalItems={modalItems}
            description={"The listed deprecated API calls are those used in this project."}
          />
        }
      >
        <Table<DeprecatedApi>
          {...collectionProps}
          className={tableStyles.borderless}
          items={items}
          empty={empty}
          columnDefinitions={modalColumns}
          sortingColumn={sortingColumn}
          filter={
            <TextFilter
              {...filterProps}
              filteringPlaceholder="Search by deprecated API call"
              countText={filteringCountText(filteredItemsCount!)}
            />
          }
          pagination={<Pagination {...paginationProps} />}
        />
      </Modal>
    </SpaceBetween>
  );
};

const getDeprecatedApis = (
  nugetPackage: NugetPackage,
  selectedNugetPackageVersion: { [packageId: string]: SelectProps.Option },
  deprecatedApiByPackageVersion: {
    [packageId: string]: { [version: string]: { totalApis: number; deprecatedApis: DeprecatedApi[] } };
  }
) => {
  if (selectedNugetPackageVersion[nugetPackage.packageId!] === undefined) {
    return { totalApis: 0, deprecatedApis: [] };
  }
  if (selectedNugetPackageVersion[nugetPackage.packageId!].label !== nugetPackage.version) {
    return { totalApis: 0, deprecatedApis: [] };
  }
  if (deprecatedApiByPackageVersion[nugetPackage.packageId!] === undefined) {
    return { totalApis: 0, deprecatedApis: [] };
  }
  if (
    deprecatedApiByPackageVersion[nugetPackage.packageId!][
      selectedNugetPackageVersion[nugetPackage.packageId!].label as string
    ] === undefined
  ) {
    return { totalApis: 0, deprecatedApis: [] };
  }
  return deprecatedApiByPackageVersion[nugetPackage.packageId!][
    selectedNugetPackageVersion[nugetPackage.packageId!].label as string
  ];
};

const modalColumns: TableProps.ColumnDefinition<DeprecatedApi>[] = [
  { id: "deprecated-api-call", header: "Deprecated API call", cell: item => item.apiName, sortingField: "apiName" },
  {
    id: "latest-supported-version",
    header: "Latest supported version",
    cell: item => item.lastVersion || "-",
    sortingField: "latestVersion"
  }
];

const empty = (
  <Box textAlign="center">
    <Box margin={{ bottom: "xxs" }} padding={{ top: "xs" }}>
      <b>No deprecated APIs</b>
    </Box>

    <Box variant="p" margin={{ bottom: "xs" }}>
      No deprecated APIs to display.
    </Box>
  </Box>
);

export const NugetPackageUpgrades = React.memo(NugetPackageUpgradesInternal);
