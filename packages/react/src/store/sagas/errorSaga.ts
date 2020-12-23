import { all, call, select, takeEvery } from "redux-saga/effects";
import { getType, PayloadAction } from "typesafe-actions";

import { logErrorAction } from "../../utils/LogError";
import { actions } from "../actions";
import { setErrorUpdate } from "../actions/error";

function* handleFailures(action: PayloadAction<string, any>) {
  logErrorAction(action.type, yield select(), action.payload);
}

function* handleError(action: ReturnType<typeof setErrorUpdate>) {
  const error = action.payload;
  yield call([window.electron, window.electron.telemetry], error);
}

function* watchFailures() {
  for (const subActions of Object.values(actions)) {
    for (const action of Object.values(subActions)) {
      if (typeof action === "object" && action.failure != null) {
        yield takeEvery(getType(action.failure), handleFailures);
      }
    }
  }
}

function* watchError() {
  yield takeEvery(getType(setErrorUpdate), handleError);
}

export default function* errorSaga() {
  yield all([watchFailures(), watchError()]);
}
