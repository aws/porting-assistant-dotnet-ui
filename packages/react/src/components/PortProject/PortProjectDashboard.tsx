import { Box, Button, Form, Header, SpaceBetween } from "@awsui/components-react";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router";

import { PortingLocation } from "../../models/porting";
import { Project } from "../../models/project";
import { SolutionDetails } from "../../models/solution";
import { InfoLink } from "../InfoLink";
import { handlePortProjectSubmission } from "../PortShared/handlePortProjectSubmission";
import { NugetPackageUpgrades } from "../PortShared/NugetPackageUpgrades";
import { PortSettings } from "../PortShared/PortSettings";
import { useWebFormsFlashbarMessage } from "../PortShared/useWebFormsFlashbarMessage";

interface Props {
  solution: SolutionDetails;
  project: Project;
  portingLocation: PortingLocation;
}

const PortProjectDashboardInternal: React.FC<Props> = ({ solution, project, portingLocation }) => {
  const { control, handleSubmit, watch, formState, setError } = useForm();
  const { isSubmitting } = formState;
  const history = useHistory();
  const dispatch = useDispatch();
  const targetFramework = window.electron.getState("targetFramework");

  const hasWebForms = (project.featureType == "WebForms");

  useWebFormsFlashbarMessage(hasWebForms);

  return (
    <form
      onSubmit={handleSubmit(async data => {
        if (targetFramework.id == null) {
          setError("targetFramework", { type: "required", message: "Target Framework is required." });
          return;
        }
        handlePortProjectSubmission(data, solution, [project], targetFramework.id, portingLocation, [], dispatch);
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
            <div id="port-project-title">Port {project.projectName}</div>
          </Header>
        }
        actions={
          <div>
            <Button variant="link" formAction="none" onClick={() => history.goBack()}>
              Cancel
            </Button>
            <Button id="port-button" variant="primary" formAction="submit">
              Port
            </Button>
          </div>
        }
      >
        <SpaceBetween size="m">
          <PortSettings
            solutionDetails={solution}
            portingLocation={portingLocation}
            targetFramework={targetFramework.label as string}
          />
          <Controller
            as={NugetPackageUpgrades}
            solution={solution}
            projects={[project]}
            watch={watch}
            onChange={([result]) => result}
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

export const PortProjectDashboard = React.memo(PortProjectDashboardInternal);
