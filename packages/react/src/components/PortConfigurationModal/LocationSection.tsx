import { Box, Button, ColumnLayout, FormField, Select, SelectProps } from "@awsui/components-react";
import process from "process";
import React, { useMemo } from "react";
import { Controller, FormContextValues } from "react-hook-form";
import { useLocation } from "react-router";

import { usePortingAssistantSelector } from "../../createReduxStore";
import { selectCurrentSolutionDetails } from "../../store/selectors/solutionSelectors";
import { isLoaded } from "../../utils/Loadable";
import { logError } from "../../utils/LogError";

interface Props extends Pick<FormContextValues, "control" | "errors" | "watch" | "setValue"> {
  isSubmitting: boolean;
}

const LocationSectionInternal: React.FC<Props> = ({ control, errors, watch, setValue, isSubmitting }) => {
  const selectedLocation = watch("portingLocation");
  const selectedDirectory = watch("path");
  const location = useLocation();
  const solutionDetails = usePortingAssistantSelector(state => selectCurrentSolutionDetails(state, location.pathname));

  const pathField = useMemo(
    () => (
      <div>
        <Controller
          name="path"
          as={({ onChange, errorText }) => (
            <>
              <FormField
                label="Specify file directory"
                description="Porting Assistant for .NET will copy your solution to the selected location."
                errorText={errorText}
              >
                <Button id="folder-open-button" iconName="folder-open" onClick={openDialog(onChange)} formAction="none" disabled={isSubmitting}>
                  Choose folder
                </Button>
              </FormField>
              {selectedDirectory !== undefined && errorText === undefined && (
                <>
                  <Box margin={{ bottom: "xxs" }} />
                  <Box variant="small">{selectedDirectory}</Box>
                </>
              )}
            </>
          )}
          control={control}
          onChange={([path]) => path}
          valueName="path"
          errorText={errors?.path?.message}
          rules={{
            required: "Path is required.",
            validate: {
              notInSolution: (path: string) =>
                (isLoaded(solutionDetails)
                  ? is_directory_outside_sln_path(path, solutionDetails.data.solutionFilePath, solutionDetails.data.solutionName)
                  : false) || "Directory has to be outside the solution's directory."
            }
          }}
        />
      </div>
    ),
    [control, errors, isSubmitting, selectedDirectory, solutionDetails]
  );

  const copyForm = useMemo(() => pathField, [pathField]);

  const portLocationItems = useMemo(
    (): SelectProps.Option[] => [
      {
        value: "copy",
        label: "Copy to new location",
        disabled: isSubmitting
      },
      {
        value: "inplace",
        label: "Modify source in place"
      }
    ],
    [isSubmitting]
  );

  return (
    <ColumnLayout>
      <div>
        <Controller
          name="portingLocation"
          as={({ onChange, location, errorText }) => (
            <FormField
              label="Write method"
              description="Specify how you want Porting Assistant for .NET to store your solution and its ported projects."
              errorText={errorText}
            >
              <Select
                id="select-location-button"
                selectedOption={location}
                options={portLocationItems}
                onChange={event => onChange(event.detail.selectedOption)}
                disabled={isSubmitting}
              ></Select>
            </FormField>
          )}
          defaultValue={portLocationItems[0]}
          control={control}
          onChange={([location]) => location}
          valueName="location"
          errorText={errors?.portingLocation?.message}
          rules={{
            required: "Location is required."
          }}
        />
      </div>
      {(selectedLocation?.value || "copy") === "copy" && copyForm}
    </ColumnLayout>
  );
};

const openDialog = (onChange: (value: string | undefined) => void) => () =>
  window.electron.dialog
    .showOpenDialog({
      properties: ["openDirectory"]
    })
    .then(result => {
      const directoryName = result.filePaths.length > 0 ? result.filePaths[0] : undefined;
      onChange(directoryName);
    })
    .catch(err => {
      logError("LocationSection.tsx", "Unable to open directory", err);
    });

function is_directory_outside_sln_path(path: string, solutionFilePath: string, solutionName: string) {
    // we need to consider the .sln extension while getting the substring for the solution path
    const relDirPath = solutionFilePath.substring(0, solutionFilePath.length - solutionName.length - 5);
    return !(path.startsWith(relDirPath) || path.trim() == relDirPath.trim());
}

export const LocationSection = React.memo(LocationSectionInternal);
