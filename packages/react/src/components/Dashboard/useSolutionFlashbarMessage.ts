import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { v4 as uuid } from "uuid";

import { pushCurrentMessageUpdate, removeCurrentMessageUpdate } from "../../store/actions/error";
import { DashboardTableData } from "./DashboardTable";

export const useSolutionFlashbarMessage = (tableData: DashboardTableData[]) => {
  const dispatch = useDispatch();
  const prevLoadingSolutions = useRef(Array<DashboardTableData>());

  useEffect(() => {
    const loadingSolutions: DashboardTableData[] = [];
    const failedSolutions: DashboardTableData[] = [];
    tableData.forEach(data => {
      if (data.incompatibleApis == null || data.incompatiblePackages == null) {
        loadingSolutions.push(data);
      }
      if (data.failed === true) {
        failedSolutions.push(data);
      }
    });
    if (loadingSolutions.length === 1) {
      dispatch(
        pushCurrentMessageUpdate({
          messageId: uuid(),
          groupId: "assess",
          type: "success",
          loading: true,
          content: `Assessing ${loadingSolutions[0].name}. This can take a few minutes.`,
          dismissible: false
        })
      );
    }
    if (loadingSolutions.length > 1) {
      dispatch(
        pushCurrentMessageUpdate({
          messageId: uuid(),
          groupId: "assess",
          type: "success",
          loading: true,
          content: `Assessing solutions. This can take a few minutes.`,
          dismissible: false
        })
      );
    }
    const completed = prevLoadingSolutions.current.filter(s => !loadingSolutions.some(ls => ls.path === s.path));
    if (completed.length === 1) {
      dispatch(
        pushCurrentMessageUpdate({
          messageId: uuid(),
          groupId: "assessSuccess",
          type: "success",
          content: `Successfully assessed ${completed[0].name}.`,
          dismissible: true
        })
      );
    }
    if (completed.length > 1) {
      dispatch(
        pushCurrentMessageUpdate({
          messageId: uuid(),
          groupId: "assessSuccess",
          type: "success",
          content: `Successfully assessed ${completed.length} solutions.`,
          dismissible: true
        })
      );
    }

    if (failedSolutions.length === 1) {
      dispatch(
        pushCurrentMessageUpdate({
          messageId: uuid(),
          groupId: "assessFailed",
          type: "error",
          content: `Failed to assess ${failedSolutions[0].name}. You must be able to build your project in Visual Studio. If this error persists, contact support in the Porting Assistant help menu.`,
          dismissible: true
        })
      );
    }

    if (failedSolutions.length > 1) {
      dispatch(
        pushCurrentMessageUpdate({
          messageId: uuid(),
          groupId: "assessFailed",
          type: "error",
          content: `Failed to assess ${failedSolutions.length} solutions. You must be able to build your project in Visual Studio. If this error persists, contact support in the Porting Assistant help menu.`,
          dismissible: true
        })
      );
    }

    if (loadingSolutions.length === 0) {
      dispatch(removeCurrentMessageUpdate({ groupId: "assess" }));
    }
    if (loadingSolutions !== prevLoadingSolutions.current) {
      prevLoadingSolutions.current = loadingSolutions;
    }
  }, [dispatch, tableData]);
};
