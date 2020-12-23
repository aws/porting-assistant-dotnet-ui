export const paths = {
  dashboard: "/solutions",
  addSolution: "/add-solution",
  solution: "/solutions/:solution",
  project: "/solutions/:solution/:project",
  sourceFile: "/solutions/:solution/:project/:sourceFile",
  portSolution: "/port-solution/:solution",
  portProject: "/port-solution/:solution/:project",
  portInitSolution: "/init-port-solution/:solution"
};

export const pathValues = Object.values(paths);
