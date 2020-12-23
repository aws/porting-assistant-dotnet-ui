import { all } from "redux-saga/effects";

import backendSaga from "./backendSaga";
import errorSaga from "./errorSaga";
import portingSaga from "./portingSaga";

const createRootSaga = () => {
  function* rootSaga() {
    yield all([backendSaga(), errorSaga(), portingSaga()]);
  }
  return rootSaga;
};

export default createRootSaga;
