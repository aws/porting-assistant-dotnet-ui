import { Box, ColumnLayout, Container, Header, SpaceBetween, StatusIndicator } from "@cloudscape-design/components";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router";

import { usePortingAssistantSelector } from "../../createReduxStore";
import { Project } from "../../models/project";
import { selectPortingProjectsInSolution } from "../../store/selectors/portingSelectors";
import {
  selectCurrentSolutionApiAnalysis,
  selectCurrentSolutionDetails,
  selectCurrentSolutionPath,
  selectNugetPackages
} from "../../store/selectors/solutionSelectors";
import { getCompatibleApi } from "../../utils/getCompatibleApi";
import { getCompatibleNugetsAgg } from "../../utils/getCompatibleNugets";
import { getTargetFramework } from "../../utils/getTargetFramework";
import { isPortingCompleted } from "../../utils/isPortingCompleted";
import { CompatiblePackage } from "../AssessShared/CompatiblePackage";
import { SummaryItem } from "../AssessShared/SummaryItem";
import { InfoLink } from "../InfoLink";

interface Props {
  project: Project;
}

const ProjectSummaryInternal: React.FC<Props> = ({ project }) => {
  const location = useLocation();
  const nugetPackages = useSelector(selectNugetPackages);
  const targetFramework = getTargetFramework();
  const apiAnalysis = usePortingAssistantSelector(state => selectCurrentSolutionApiAnalysis(state, location.pathname));
  const solutionProjects = usePortingAssistantSelector(state => selectCurrentSolutionDetails(state, location.pathname));
  const nugetCompatibilities = useMemo(() => {
    const allNugetDependencies = new Set(project.packageReferences);
    return getCompatibleNugetsAgg([...allNugetDependencies], nugetPackages);
  }, [project.packageReferences, nugetPackages]);
  const portingProjects = usePortingAssistantSelector(state =>
    selectPortingProjectsInSolution(state, location.pathname)
  );
  const solutionPath = usePortingAssistantSelector(state => selectCurrentSolutionPath(state, location.pathname));

  const apiCompatibilities = useMemo(() => {
    return getCompatibleApi(solutionProjects, apiAnalysis, project.projectFilePath, null, targetFramework);
  }, [apiAnalysis, project.projectFilePath, solutionProjects, targetFramework]);

  return (
    <Container header={<Header variant="h2">Assessment overview</Header>}>
      <ColumnLayout columns={3} variant="text-grid">
        <div>
          <SpaceBetween size="l">
            <SummaryItem
              label="Port status"
              content={
                isPortingCompleted(solutionPath, project, portingProjects) ? (
                  <StatusIndicator type="success">Ported</StatusIndicator>
                ) : (
                  <StatusIndicator type="stopped">Not ported</StatusIndicator>
                )
              }
            />
            <SummaryItem label="Target framework version" content={project.targetFrameworks?.join(", ") || "-"} />
          </SpaceBetween>
        </div>
        <div>
          <SpaceBetween size="l">
            <CompatiblePackage
              title="Incompatible NuGet packages"
              infoLink={
                <InfoLink
                  heading="Incompatible NuGet packages"
                  mainContent={
                    <Box variant="p">
                      Porting Assistant for .NET parses package reference files for each project in the .NET Framework
                      solution and iterates through each referenced public and private NuGet package to check whether
                      the latest version of the package that is compatible with .NET Core is available. To speed up the
                      process, Porting Assistant for .NET includes a precompiled database of all public NuGet packages
                      and their compatibility status. For private packages, Porting Assistant for .NET uses dotnet tools
                      to determine the compatibility of a package.
                    </Box>
                  }
                  learnMoreLinks={[
                    {
                      externalUrl: "https://docs.microsoft.com/en-us/nuget/what-is-nuget",
                      text: "An introduction to NuGet"
                    }
                  ]}
                />
              }
              compatible={nugetCompatibilities.nugetAggregates.compatible}
              incompatible={nugetCompatibilities.nugetAggregates.incompatible}
              unknown={nugetCompatibilities.nugetAggregates.unknown}
              isLoading={!nugetCompatibilities.isAllNugetLoaded}
            />
          </SpaceBetween>
        </div>
        <div>
          <SpaceBetween size="l">
            <CompatiblePackage
              title="Incompatible APIs"
              infoLink={
                <InfoLink
                  heading="Incompatible APIs"
                  mainContent={
                    <Box variant="p">
                      Porting Assistant for .NET analyzes source code and both public and private NuGet package
                      dependencies of your .NET application. It identifies incompatible API calls made from each NuGet
                      package and checks whether a NuGet package is compatible with .NET Core.
                    </Box>
                  }
                  learnMoreLinks={[]}
                />
              }
              compatible={apiCompatibilities.values[0]}
              incompatible={apiCompatibilities.values[1] - apiCompatibilities.values[0]}
              unknown={0}
              isLoading={apiCompatibilities.isApisLoading}
            />
          </SpaceBetween>
        </div>
      </ColumnLayout>
    </Container>
  );
};

export const ProjectSummary = React.memo(ProjectSummaryInternal);
