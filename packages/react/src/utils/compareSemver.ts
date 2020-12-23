import compareVersions, { validate } from "compare-versions";

export const compareSemver = (a: string, b: string) => {
  if (!validate(a) && !validate(b)) {
    return a.localeCompare(b);
  }
  if (!validate(a)) {
    return -1;
  }
  if (!validate(b)) {
    return 1;
  }
  return compareVersions(a, b);
};
