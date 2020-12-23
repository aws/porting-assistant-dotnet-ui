import { ipcRenderer } from "electron";

export const invokeBackend = (channel: string, ...args: any[]) => {
  console.log(`Invoking ${channel}`);
  return ipcRenderer.invoke(channel, ...args);
};

export const listenBackend = (
  channel: string,
  callback: (message: string) => void
) => {
  return ipcRenderer.on(channel, (_event, message) => {
    console.log(`Received ${channel}`);
    callback(message);
  });
};
