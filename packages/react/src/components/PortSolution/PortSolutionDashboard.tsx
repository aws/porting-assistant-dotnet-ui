import { Box, Button, Form, Header, SpaceBetween } from "@awsui/components-react";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { Redirect, useHistory, useLocation } from "react-router";

import { usePortingAssistantSelector } from "../../createReduxStore";
import { Project } from "../../models/project";
import { SolutionDetails } from "../../models/solution";
import { selectPortingLocation } from "../../store/selectors/portingSelectors";
import { InfoLink } from "../InfoLink";
import { handlePortProjectSubmission } from "../PortShared/handlePortProjectSubmission";
import { NugetPackageUpgrades } from "../PortShared/NugetPackageUpgrades";
import { PortSettings } from "../PortShared/PortSettings";
import { PortSolutionSummary } from "./PortSolutionSummary";

interface Props {
  solution: SolutionDetails;
  projects: Project[];
}

const PortSolutionDashboardInternal: React.FC<Props> = ({ solution, projects }) => {
  const { control, handleSubmit, watch, formState, setError } = useForm({
    mode: "onChange"
  });
  const { isSubmitting } = formState;
  const history = useHistory();
  const dispatch = useDispatch();
  const location = useLocation();
  const portingLocation = usePortingAssistantSelector(state => selectPortingLocation(state, location.pathname));
  const targetFramework = window.electron.getState("targetFramework");

  if (projects?.length === 0 || portingLocation == null) {
    return <Redirect to={`/solutions/${encodeURIComponent(solution.solutionFilePath)}`} />;
  }
  return (
    <form
      onSubmit={handleSubmit(async data => {
        if (targetFramework.id == null) {
          setError("targetFramework", { type: "required", message: "Target Framework is required." });
          return;
        }
        handlePortProjectSubmission(data, solution, projects, targetFramework.id, portingLocation, dispatch);
        history.push("/solutions");
      })}
    >
      <Form
        header={
          <Header
            variant="h1"
            description="Porting Assistant for .NET upgrades packages to their latest compatible version and changes relevant project reference file to a format compatible with .NET Core. Porting Assistant for .NET does not eliminate the need to make source code changes."
            info={
              <InfoLink
                heading="Port projects"
                mainContent={
                  <Box variant="p">
                    Once you select an application for porting, Porting Assistant for .NET can speed up the process by
                    setting up the project file with updated NuGet/Microsoft packages and formatted package references
                    in a format that is compatible with .NET Core. You can use the updated project file to start
                    refactoring your application. When you select an application for porting, Porting Assistant for .NET
                    copies the .NET Framework source code and the associated project files to a .NET Core compatible
                    format. If there are any known replacements, Porting Assistant for .NET applies them. When a project
                    is ported, it may not be entirely .NET Core compatible because there may be other APIs, packages,
                    and code blocks that must be substituted and refactored for compatibility.
                  </Box>
                }
                learnMoreLinks={[]}
              />
            }
          >
            <div id="port-solution-titles">Port projects</div>
          </Header>
        }
        actions={
          <div>
            <Button variant="link" formAction="none" onClick={() => history.goBack()}>
              Cancel
            </Button>
            <Button variant="primary" formAction="submit">
              Port
            </Button>
          </div>
        }
      >
        <SpaceBetween size="m">
          <PortSolutionSummary projects={projects} />
          <PortSettings
            solutionDetails={solution}
            portingLocation={portingLocation}
            targetFramework={targetFramework.label as string}
          />
          <Controller
            as={NugetPackageUpgrades}
            solution={solution}
            projects={projects}
            watch={watch}
            onChange={result => result[0]}
            control={control}
            isSubmitting={isSubmitting}
            defaultValue={{}}
            name="upgrades"
          />
        </SpaceBetween>
      </Form>
    </form>
  );
};

export const PortSolutionDashboard = React.memo(PortSolutionDashboardInternal);
