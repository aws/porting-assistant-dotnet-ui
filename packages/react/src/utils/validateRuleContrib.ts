import axios from "axios";
import { validate } from "compare-versions";

import { PackageContribution } from "../components/Feedback/PackageRuleContribution";

export interface ValidationResult {
  valid: boolean;
  field?: string;
  message?: string;
}

// Use error handling
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

  if (responseData["totalHits"] === 0) {
    return false;
  }

  // iterate through all results to find match
  for (const result of responseData["data"]) {
    if (packageVersion) {
      if (result["id"] === packageName && result["version"] === packageVersion) return true;
    } else {
      if (result["id"] === packageName) return true;
    }
  }

  return false;
};

export const validateVersion = (packageVersion: string) => {
  return validate(packageVersion);
};

export const validatePackageInput = async (submission: PackageContribution): Promise<ValidationResult> => {
  // Check that package name is not blank
  if (submission.packageName === "") {
    return { valid: false, field: "packageName", message: "Required" };
  }
  // Check that version, if not latest, is not blank
  if (!submission.packageVersionLatest && submission.packageVersion === "") {
    return { valid: false, field: "packageVersion", message: "Required" };
  }

  if (submission.targetFramework.length === 0) {
    return { valid: false, field: "targetFramework", message: "Required" };
  }

  // Only check if the package name exists, since we can use latest version
  if (submission.packageVersionLatest) {
    if (!(await checkPackageExists(submission.packageName))) {
      return { valid: false, field: "packageName", message: "Package not found" };
    }
    return { valid: true };
  }
  // Ensure SemVer formatting for version
  if (!validateVersion(submission.packageVersion)) {
    return { valid: false, field: "packageVersion", message: "Invalid version format (SemVer)" };
  }
  // Check package name/version combo
  if (!(await checkPackageExists(submission.packageName, submission.packageVersion))) {
    return {
      valid: false,
      field: "packageName/packageVersion",
      message: "Package/version combination not found"
    };
  }
  return { valid: true };
};
