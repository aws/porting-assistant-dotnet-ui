import { SelectProps } from "@awsui/components-react";
import { useDispatch } from "react-redux";
import { v4 as uuid } from "uuid";

import { PortingLocation } from "../../models/porting";
import { Project, VersionPair } from "../../models/project";
import { SolutionDetails } from "../../models/solution";
import { analyzeSolution } from "../../store/actions/backend";
import {
    pushCurrentMessageUpdate,
    pushPendingMessageUpdate,
    removeCurrentMessageUpdate
} from "../../store/actions/error";
import { setPortingProjectConfig } from "../../store/actions/porting";
import { checkInternetAccess } from "../../utils/checkInternetAccess";
import { getPortingPath } from "../../utils/getPortingPath";
import { getPortingSolutionPath } from "../../utils/getPortingSolutionPath";
import { getTargetFramework } from "../../utils/getTargetFramework";
import { TableData } from "../AssessSolution/ProjectsTable";

export const handlePortProjectSubmission = async (
    data: Record<string, any>,
    solution: SolutionDetails,
    projects: Project[],
    targetFramework: string,
    portingLocation: PortingLocation,
    preTriggerProjectsTableData: TableData[],
    dispatch: ReturnType<typeof useDispatch>
) => {
    dispatch(
        pushCurrentMessageUpdate({
            messageId: uuid(),
            groupId: "porting",
            type: "success",
            loading: true,
            content: `Porting ${solution.solutionName}. This can take a few minutes.`,
            dismissible: false
        })
    );

    let preTriggerDataArray: string[] = [];
    preTriggerProjectsTableData.forEach(element => {preTriggerDataArray.push(JSON.stringify(element));});

    const portingSolutionPath = getPortingSolutionPath(solution, portingLocation);
    if (portingLocation.type === "copy" && !window.electron.pathExists(portingSolutionPath)) {
        await window.porting.copyDirectory(solution.solutionFilePath, portingLocation.workingDirectory);
    }
    const response = await window.porting.applyPortingProjectFileChanges(
        projects.map(p => {
            let portingProjects = Object.assign({}, p);
            portingProjects.projectFilePath = getPortingPath(solution, p, portingLocation);
            return portingProjects;
        }),
        portingSolutionPath,
        targetFramework,
        Object.entries(data.upgrades).reduce((agg, [key, value]) => {
            agg[key] = {
                originalVersion: (value as SelectProps.Option).value,
                upgradeVersion: (value as SelectProps.Option).label
            } as VersionPair;
            return agg;
        }, {} as { [packageId: string]: VersionPair })
    );

    if (response.status.status === "Success") {
        if (response.value.length > 0) {
            dispatch(removeCurrentMessageUpdate({ groupId: "porting" }));
            dispatch(
                pushCurrentMessageUpdate({
                    messageId: uuid(),
                    groupId: "portingSuccess",
                    type: "success",
                    content: (response.value.length === 1
                        ? `Successfully ported ${response.value[0].projectName}. `
                        : `Successfully ported ${response.value.length} projects. `
                    ).concat("Click view log to see the porting results"),
                    dismissible: true,
                    buttonText: "View log",
                    onButtonClick: () => {
                        let directory = window.electron.getDirectory(solution.solutionFilePath);
                        if (portingLocation.type === "copy" && window.electron.pathExists(portingSolutionPath)) {
                            directory = portingLocation.workingDirectory;
                        }
                        const buildfilepath = window.electron.joinPaths(directory, "PortSolutionResult.txt");
                        if (window.electron.pathExists(portingSolutionPath)) {
                            window.electron.openPath(buildfilepath);
                        }
                    }
                })
            );
            response.value.forEach(project => {
                const projectPath = projects.find(p => p.projectName === project.projectName)?.projectFilePath;
                if (projectPath == null) {
                    return;
                }
                dispatch(
                    setPortingProjectConfig({
                        solutionPath: solution.solutionFilePath,
                        projectPath: projectPath,
                        portingLocation: portingLocation,
                        config: {
                            steps: {
                                projectFileStep: "complete"
                            }
                        }
                    })
                );
            });
        }
        if (response.errorValue.length > 0) {
            response.errorValue.forEach(r =>
                dispatch(
                    pushPendingMessageUpdate({
                        messageId: uuid(),
                        type: "error",
                        header: `Failed to port ${r.projectName}`,
                        content: r.message,
                        dismissible: true
                    })
                )
            );
        }
        const targetFramework = getTargetFramework();

        if (portingLocation.type === "copy" && window.electron.pathExists(portingSolutionPath)) {
            const paths = await window.electron.getState("solutions", {});
            paths[portingSolutionPath] = { solutionPath: portingSolutionPath };
            window.electron.saveState("solutions", paths);
        }
        const haveInternet = await checkInternetAccess(portingSolutionPath, dispatch);
        if (haveInternet) {
            dispatch(
                analyzeSolution.request({
                    solutionPath: portingSolutionPath,
                    runId: uuid(),
                    triggerType: "PortingRequest",
                    settings: {
                        ignoredProjects: [],
                        targetFramework: targetFramework,
                        continiousEnabled: false,
                        actionsOnly: false,
                        compatibleOnly: false
                    },
                    preTriggerData: preTriggerDataArray,
                    force: true
                })
            );
        }
    } else {
        projects.forEach(p =>
            dispatch(
                pushPendingMessageUpdate({
                    messageId: uuid(),
                    type: "error",
                    header: `Failed to port ${p.projectName}`,
                    dismissible: true
                })
            )
        );
    }
};
