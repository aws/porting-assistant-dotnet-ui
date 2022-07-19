export const getTargetFramework = () => window.electron.getState("targetFramework")?.id || "net6.0";
