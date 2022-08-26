import { Box, Header, SpaceBetween } from "@cloudscape-design/components";
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Redirect, useLocation } from "react-router";

import { Project } from "../../models/project";
import { SolutionDetails } from "../../models/solution";
import { getFileContents } from "../../store/actions/file";
import { RootState } from "../../store/reducers";
import { selectCurrentSourceFilePath, selectSourceFileContents } from "../../store/selectors/solutionSelectors";
import { isLoading, Loadable, Loading } from "../../utils/Loadable";
import { useNugetFlashbarMessages } from "../AssessShared/useNugetFlashbarMessages";
import { InfoLink } from "../InfoLink";
import { AssessFileSourceCodeDisplay } from "./AssessFileSourceCodeDisplay";

interface Props {
  solution: SolutionDetails;
  project: Loadable<Project>;
}

const AssessFileDashboardInternal: React.FC<Props> = ({ solution, project }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const sourceFilePath = useSelector((state: RootState) => selectCurrentSourceFilePath(state, location.pathname));
  const pathToSourceFileContents = useSelector(selectSourceFileContents);
  useNugetFlashbarMessages(project);

  useEffect(() => {
    if (sourceFilePath != null) {
      dispatch(getFileContents.request(sourceFilePath));
    }
  }, [dispatch, sourceFilePath]);

  const sourceFileName = useMemo(() => {
    return window.electron.getFilename(sourceFilePath);
  }, [sourceFilePath]);

  const relativePath = useMemo(() => {
    return window.electron.getRelativePath(solution.solutionFilePath, sourceFilePath);
  }, [solution.solutionFilePath, sourceFilePath]);

  const sourceContent = useMemo(() => {
    if (sourceFilePath != null) {
      return pathToSourceFileContents[sourceFilePath] || Loading<string>();
    }
    return Loading<string>();
  }, [pathToSourceFileContents, sourceFilePath]);

  if (sourceFilePath == null || isLoading(project)) {
    return <Redirect to="/solutions" />;
  }

  return (
    <SpaceBetween size="m">
      <Header
        variant="h1"
        info={
          <InfoLink
            heading="Source file"
            mainContent={
              <>
                <Box variant="p">
                  View incompatible API calls in the project source code, and the replacement suggestions.
                </Box>
              </>
            }
            learnMoreLinks={[]}
          />
        }
        description={<Box variant="small">{relativePath}</Box>}
      >
        {sourceFileName}
      </Header>
      <AssessFileSourceCodeDisplay sourceFileContent={sourceContent} />
    </SpaceBetween>
  );
};

export const AssessFileDashboard = React.memo(AssessFileDashboardInternal);
