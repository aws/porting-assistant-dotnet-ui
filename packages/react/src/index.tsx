import "./bootstrapElectron";
import "ace-builds";
import "ace-builds/webpack-resolver";
import "@awsui/global-styles/index.css";

import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import App from "./App";
import { createReduxStore } from "./createReduxStore";

const store = createReduxStore();
ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
);

window.reduxStore = store;
