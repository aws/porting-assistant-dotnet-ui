import { SelectProps } from "@awsui/components-react";

export const getSupportedVersion = async () : Promise<[SelectProps.Option[], string]> => {
    var options : SelectProps.Option[] = [];
    const result = await window.backend.getSupportedVersion();
    if (result.errorValue == null || result.errorValue.trim() === "")
    {
        result.value.forEach(element => {
            options.push(
              {
              label: element.displayName,
              value: element.targetFrameworkMoniker,
              });
          });
    }
    return [options, result.errorValue];
}