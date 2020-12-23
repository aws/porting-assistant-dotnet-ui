export const getTargetFramework = () => window.electron.getState("targetFramework")?.id || "netcoreapp3.1";
