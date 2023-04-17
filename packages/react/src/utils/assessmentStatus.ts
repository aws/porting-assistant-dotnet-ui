export const getAssessmentStatus = (solutionPath: string) : boolean => {
  return window.electron.getState("currentAssessmentStatus")[solutionPath] || false;
}

export const setAssessmentStatus = (solutionPath: string, status: boolean) : void => {
  var oldState = window.electron.getState("currentAssessmentStatus")
  oldState[solutionPath] = status;
  window.electron.saveState("currentAssessmentStatus", oldState);
}