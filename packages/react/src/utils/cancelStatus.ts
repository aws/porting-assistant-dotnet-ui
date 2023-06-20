export const getCancelStatus = (solutionPath: string) : boolean => {
  return solutionPath? window.electron.getState("cancelStatus")[solutionPath] || false : false;
}

export const setCancelStatus = (solutionPath: string, status: boolean) : void => {
  var oldState = window.electron.getState("cancelStatus")
  oldState[solutionPath] = status;
  window.electron.saveState("cancelStatus", oldState);
}