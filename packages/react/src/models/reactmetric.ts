export interface ReactMetric {
  TargetFramework?: string,
  Timestamp?: Date,
  PortingAssistantVersion?: string,
  MetricSource?: MetricSource, 
  MetricType?: MetricType,     //  UIClickEvent/Error
  Content?: string,
  SessionId?: string,
  SolutionPath?: string,
  ProjectGuid?: (string | null | undefined)[],
  RunId?: string
}

export enum MetricType  {
  UIClickEvent = "UIClickEvent",
  UIError = "UIError"
}

export enum MetricSource {
  AddSoution = "AddSolution", // Metrics emit when adding a new solution
  PortProjectSelect = "PortProjectSelect", // Metrics emit when Port Project button is interacted with redirecting to Port Dashboard
  PortSolutionSelect = "PortSolutionSelect", // Metrics emit when Port Solution button is interacted with redirecting to Port Dashboard
  PortProject = "PortProject", // Metrics emit during Porting Project
  PortSolution = "PortSolution", // Metrics emit during Porting Solution
  AssessSolution = "AssessSolution", // Metrics emit during Assessing a Solution
  ReassessSolution = "ReassessSolution", //  Metrics emit during Reassessing a Solution
  CancelAssessment = "CancelAssessment", // Metrics emit during Cancel Assessment
  RemoveSolution = "RemoveSolution" // Metrics emit when Solution is removed
}