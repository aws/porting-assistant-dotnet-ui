export const nugetPackageKey = (packageId?: string, version?: string) =>
  `${packageId?.toLocaleLowerCase() || ""}-${version?.toLocaleLowerCase() || ""}`;
