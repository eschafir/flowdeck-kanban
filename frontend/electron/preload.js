const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("flowdeck", {
  loadWorkspace: () => ipcRenderer.invoke("workspace:load"),
  saveWorkspace: (workspace) => ipcRenderer.invoke("workspace:save", workspace),
  exportBoardFile: (defaultFilename, content) =>
    ipcRenderer.invoke("board:export", { defaultFilename, content }),
  importBoardFile: () => ipcRenderer.invoke("board:import"),
});
