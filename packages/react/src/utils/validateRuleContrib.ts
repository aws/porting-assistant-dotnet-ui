import axios from "axios";
import { validate } from "compare-versions";

export const checkPackageExists = async (packageName: string, packageVersion?: string) => {
  let query = `https://azuresearch-usnc.nuget.org/query?q=${packageName}`;
  if (packageVersion) {
    query = query + `&semVerLevel=${packageVersion}`;
  }
  const response = await axios.get(query);
  if (response.status !== 200) {
    throw new Error(
      `Unable to query for provided package. URL: ${query}, Response: ${response.status} - ${response.statusText}`
    );
  }
  const responseData = response.data;

  if (responseData["totalHits"] == 0) {
    return false;
  }

  // iterate through all results to find match
  for (const result of responseData["data"]) {
    if (result["id"] === packageName) {
      if (packageVersion && result["version"] === packageVersion) {
        return true;
      }
      return true;
    }
  }

  return false;
};

export const validateVersion = (packageVersion: string) => {
  return validate(packageVersion);
};
