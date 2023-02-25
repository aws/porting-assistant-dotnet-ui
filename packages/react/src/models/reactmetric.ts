export interface ReactMetric {
  TargetFramework?: string,
  Timestamp?: Date,
  PortingAssistantVersion?: string,
  MetricSource?: string, 
  MetricType?: MetricsType,     //  UIClickEvent/Error
  Content?: string,
  SessionId?: string,
  SolutionPath?: string,
  ProjectGuid?: (string | null | undefined)[],
  RunId?: string
}

export enum MetricsType  {
  UIClickEvent= "UIClickEvent",
  UIError ="UIError"
}