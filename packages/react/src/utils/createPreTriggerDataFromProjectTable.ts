import { TableData } from "../components/AssessSolution/ProjectsTable";
import { PreTriggerData } from "../models/project";

export const createPreTriggerDataFromProjectsTable = (projectsTable: TableData[] ) => {
  let preTriggerDataDictionary: { [projectName: string]: PreTriggerData} = {};
  projectsTable.forEach((project) => {
    let preTriggerDatum: PreTriggerData = {
      projectName: project.projectName,
      projectPath: project.projectPath,
      solutionPath: project.solutionPath,
      targetFramework: project.targetFramework,
      incompatibleApis: project.incompatibleApis,
      totalApis: project.totalApis,
      buildErrors: project.buildErrors,
      ported: project.ported
    }
    preTriggerDataDictionary[project.projectName] = preTriggerDatum
  })
  return preTriggerDataDictionary;
}  
