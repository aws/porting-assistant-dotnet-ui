import { SelectProps } from "@awsui/components-react";

export const getSupportedVersion = async () => {
    var options : SelectProps.Option[] = [];
    const supportedVersions = await window.backend.getSupportedVersion();
    supportedVersions.forEach(element => {
        options.push(
          {
          label: element.displayName,
          value: element.versionKey,
          });
      });
    return options;
}