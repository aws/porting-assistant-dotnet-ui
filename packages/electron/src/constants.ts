export const commonErrors: {
  searchText: string;
  error: string;
  message: string;
}[] = [
  {
    searchText: "UnauthorizedAccessException",
    error: "Unauthorized Access",
    message:
      "Encountered file access issue. {}. Check logs for additional information",
  },
  {
    searchText: "Missing MSBuild Path",
    error: "Missing MSBuild Path",
    message:
      "Cannot find MSBuild on your machine. Please install MSBuild to build the project.",
  },
  {
    searchText: "Duplicate packages in packages.config",
    error: "Duplicate packages found in packages.config",
    message: "Duplicate packages found in packages.config",
  },
];
