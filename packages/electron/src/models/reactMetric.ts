export interface ReactMetric {
  TargetFramework?: string,
  Timestamp?: Date,
  PortingAssistantVersion?: string,
  MetricSource?: string, 
  MetricType?: MetricType,     //  UIClickEvent/Error
  Content?: string,
  SessionId?: string,
  SolutionPath?: string,
  ProjectGuid?: (string | null |undefined)[],
  RunId?: string
}

export enum MetricType  {
  UIClickEvent= "UIClickEvent",
  UIError ="UIError"
}