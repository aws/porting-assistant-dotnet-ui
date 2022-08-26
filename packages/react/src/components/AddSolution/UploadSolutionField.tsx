import { Button, FormField } from "@cloudscape-design/components";
import React, { useCallback } from "react";

import { logError } from "../../utils/LogError";
import styles from "./UploadSolutionField.module.scss";

interface OwnProps {
  onChange?: (filename: string | undefined) => void;
  errorText?: string;
  filename?: string;
}

type Props = OwnProps;

export const UploadSolutionField: React.FC<Props> = ({ onChange, errorText, filename }) => {
  const uploadCode = useCallback(
    () =>
      window.electron.dialog
        .showOpenDialog({
          properties: ["openFile"],
          filters: [{ name: "Solution files", extensions: ["sln"] }]
        })
        .then(result => {
          const filename = result.filePaths.length > 0 ? result.filePaths[0] : undefined;
          if (onChange !== undefined) {
            onChange(filename);
          }
        })
        .catch(err => {
          logError("UploadSolutionField.tsx", "Unable to open file", err);
        }),
    [onChange]
  );

  return (
    <>
      <FormField
        label="Solution file"
        description="Specify the source file for your solution."
        errorText={errorText}
        constraintText="Filetype must be .sln"
      >
        <Button iconName="folder-open" onClick={() => uploadCode()} formAction="none">
          Choose file
        </Button>
      </FormField>
      {filename !== undefined && errorText === undefined && (
        <div className={styles.file}>
          <div className={styles.metadata}>
            <div className={styles.filename}>{window.electron.getFilename(filename)}</div>
            <div className={styles.description}>{filename}</div>
          </div>
        </div>
      )}
    </>
  );
};
