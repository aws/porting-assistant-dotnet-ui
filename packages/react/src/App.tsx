import React, { useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useDispatch } from "react-redux";
import { MemoryRouter, Redirect, Route, RouteProps, Switch } from "react-router-dom";
import { v4 as uuid } from "uuid";

import { PortingAssistantAppLayout } from "./components/PortingAssistantAppLayout";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { externalUrls } from "./constants/externalUrls";
import { paths } from "./constants/paths";
import { AddSolution } from "./containers/AddSolution";
import { AssessFile } from "./containers/AssessFile";
import { AssessProject } from "./containers/AssessProject";
import { AssessSolution } from "./containers/AssessSolution";
import { Dashboard } from "./containers/Dashboard";
import { EditSettings } from "./containers/EditSettings";
import { Main } from "./containers/Main";
import { PortProject } from "./containers/PortProject";
import { PortSolution } from "./containers/PortSolution";
import { Settings } from "./containers/Settings";
import { Setup } from "./containers/Setup";
import { usePortingAssistantSelector } from "./createReduxStore";
import { init } from "./store/actions/backend";
import { setCurrentMessageUpdate, setErrorUpdate } from "./store/actions/error";
import { checkInternetElectron } from "./utils/checkInternetAccess";

interface RouteWithErrorProps extends RouteProps {
  requireProfile: boolean;
}

const RouteWithError: React.FC<RouteWithErrorProps> = ({ children, requireProfile, ...props }) => {
  const dispatch = useDispatch();
  const profileSet = usePortingAssistantSelector(state => state.solution.profileSet);
  if (requireProfile && !profileSet) {
    return <Redirect to="/main" />;
  }

  return (
    <Route {...props}>
      <ErrorBoundary
        fallback={<PortingAssistantAppLayout navigation={<Sidebar />} content={<div></div>} headerSelector="#topbar" />}
        onError={(error, componentStack) => {
          dispatch(
            setCurrentMessageUpdate([
              {
                messageId: uuid(),
                type: "error",
                content: (
                  <>
                    An unexpected error happened. If this problem persists, please contact us at{" "}
                    <a href="#/" onClick={() => window.electron.openExternalUrl(`mailto:${externalUrls.email}`)}>
                      {externalUrls.email}
                    </a>
                    .
                  </>
                ),
                buttonText: "Reload application",
                onButtonClick: () => window.location.reload()
              }
            ])
          );
          dispatch(
            setErrorUpdate({
              name: error?.name,
              error: error?.message,
              stack: error?.stack,
              stackTrace: componentStack
            })
          );
        }}
      >
        {children}
      </ErrorBoundary>
    </Route>
  );
};

const AppInternal: React.FC<{}> = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    checkInternetElectron(dispatch);
    const hasProfile = window.electron.getState("profile");
    if (hasProfile) {
      dispatch(init(false));
    }
  }, [dispatch]);

  return (
    <MemoryRouter>
      <TopBar />
      <Switch>
        <RouteWithError requireProfile={false} path="/main" exact strict>
          <Main />
        </RouteWithError>
        <RouteWithError requireProfile={false} path="/setup" exact strict>
          <Setup />
        </RouteWithError>
        <RouteWithError requireProfile={true} path="/settings" exact strict>
          <Settings />
        </RouteWithError>
        <RouteWithError requireProfile={true} path="/edit-settings" exact strict>
          <EditSettings />
        </RouteWithError>
        <RouteWithError requireProfile={true} path={paths.dashboard} exact strict>
          <Dashboard />
        </RouteWithError>
        <RouteWithError requireProfile={true} path={paths.addSolution} exact strict>
          <AddSolution />
        </RouteWithError>
        <RouteWithError requireProfile={true} path={paths.solution} exact strict>
          <AssessSolution />
        </RouteWithError>
        <RouteWithError requireProfile={true} path={paths.project} exact strict>
          <AssessProject />
        </RouteWithError>
        <RouteWithError requireProfile={true} path={paths.sourceFile} exact strict>
          <AssessFile />
        </RouteWithError>
        <RouteWithError requireProfile={true} path={paths.portSolution} exact strict>
          <PortSolution />
        </RouteWithError>
        <RouteWithError requireProfile={true} path={paths.portProject} exact strict>
          <PortProject />
        </RouteWithError>
        <Redirect to={paths.dashboard} />
      </Switch>
    </MemoryRouter>
  );
};

export default React.memo(AppInternal);
