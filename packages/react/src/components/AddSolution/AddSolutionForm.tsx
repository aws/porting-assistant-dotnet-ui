import { Box, Button, ColumnLayout, Container, Form, Header, SpaceBetween, Spinner } from "@awsui/components-react";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router";
import { v4 as uuid } from "uuid";

import { externalUrls } from "../../constants/externalUrls";
import { analyzeSolution } from "../../store/actions/backend";
import { pushCurrentMessageUpdate } from "../../store/actions/error";
import { checkInternetAccess } from "../../utils/checkInternetAccess";
import { getTargetFramework } from "../../utils/getTargetFramework";
import { logError } from "../../utils/LogError";
import { InfoLink } from "../InfoLink";
import { UploadSolutionField } from "./UploadSolutionField";

const ImportSolutionInternal: React.FC = () => {
  const history = useHistory();
  const { control, handleSubmit, errors, formState } = useForm({
    mode: "onChange"
  });
  const { isSubmitting } = formState;
  const dispatch = useDispatch();

  return (
    <form
      onSubmit={handleSubmit(async data => {
        if (await checkIfSolutionContainsVBproject(data.solutionFilename)) {
          dispatch(
            pushCurrentMessageUpdate({
                messageId: uuid(),
                groupId: "addsolution",
                type: "error",
                loading: false,
                content: `The selected solution contains .vbproj files. Porting Assistant currently does not support Visual Basic projects.`,
                dismissible: true
            })
        );
        }
        else {
          await addSolution(data);
          const targetFramework = getTargetFramework();
          const haveInternet = await checkInternetAccess(data.solutionFilename, dispatch);
          if (haveInternet) {
            dispatch(
              analyzeSolution.request({
                solutionPath: data.solutionFilename,
                runId: uuid(),
                triggerType: "InitialRequest",
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
            history.push("/solutions");
          }
        }
      })}
    >
      <Form
        header={
          <Header
            variant="h1"
            info={
              <InfoLink
                heading="Assess a new solution"
                mainContent={
                  <p>
                    Porting Assistant for .NET analyzes source code for supported APIs and packages (Microsoft Core APIs
                    and packages, and public and private NuGet packages). It identifies incompatible API calls made from
                    each package and checks whether a package is compatible with .NET Core. Porting Assistant for .NET
                    parses package reference files for each project in the .NET Framework solution and iterates through
                    each referenced public and private NuGet package, as well as each Microsoft Core API and package, to
                    check whether the latest version of the package that is compatible with .NET Core is available.
                  </p>
                }
                learnMoreLinks={[
                  {
                    externalUrl: externalUrls.howItWorks,
                    text: "How Porting Assistant for .NET works"
                  }
                ]}
              />
            }
          >
            Assess a new solution
          </Header>
        }
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            {isSubmitting && <Spinner />}
            <Button onClick={() => history.push("/solutions")} variant="link" formAction="none">
              Cancel
            </Button>
            <Button id="assess-button" formAction="submit" variant="primary" disabled={formState.isSubmitting}>
              Assess
            </Button>
          </SpaceBetween>
        }
      >
        <Container
          header={
            <Header
              variant="h2"
              info={
                <InfoLink
                  heading="Solution (.sln) files"
                  mainContent={
                    <Box variant="p">
                      A solution file (.sln) is created by Visual Studio to organize projects. The .sln contains
                      text-based information that is used to find and load the name-value parameters for the persisted
                      data and the referenced project VSPackages.
                    </Box>
                  }
                  learnMoreLinks={[
                    {
                      externalUrl:
                        "https://docs.microsoft.com/en-us/visualstudio/extensibility/internals/solution-dot-sln-file?view=vs-2019",
                      text: "Solution (.sln) file"
                    }
                  ]}
                />
              }
            >
              Specify solution file path
            </Header>
          }
        >
          <ColumnLayout>
            <Controller
              name="solutionFilename"
              as={<UploadSolutionField />}
              control={control}
              onChange={([filename]) => filename}
              valueName="filename"
              errorText={errors?.solutionFilename?.message}
              rules={{
                required: "Solution filename is required",
                validate: {
                  endsWithSln: (value: string) => value.endsWith(".sln") || "File needs to end with *.sln",
                  doesNotExist: async (value: string) => {
                    const existingSolutionPaths = await window.electron.getState("solutions", {});
                    return (
                      !Object.keys(existingSolutionPaths).some(path => path === value) || "Solution file already exists"
                    );
                  }
                }
              }}
            />
          </ColumnLayout>
        </Container>
      </Form>
    </form>
  );
};

const addSolution = async (data: Record<string, any>) => {
  const paths = await window.electron.getState("solutions", {});
  paths[data.solutionFilename] = { solutionPath: data.solutionFilename };
  window.electron.saveState("solutions", paths);
};

const checkIfSolutionContainsVBproject = async (solutionFilename: string) => {
  var slnFileContents = "";
  try {
    slnFileContents = await window.backend.getFileContents(solutionFilename);
    var lines = slnFileContents.split("\n");
    const pattern = /Project\("\{.*\}"\)/;
    for (const line of lines) {
      if (line.match(pattern)!== null && line.includes(".vbproj")) return true;
    }
  } catch (error) {
    logError("AddSolutionForm.tsx", "Unable to read solution file.", error);
  }
  return false;
}

export const ImportSolution = React.memo(ImportSolutionInternal);
