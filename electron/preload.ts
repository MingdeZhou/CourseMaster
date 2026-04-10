import { contextBridge, ipcRenderer } from "electron";

try {
  contextBridge.exposeInMainWorld("appBridge", {
    loadWorkspace: () => ipcRenderer.invoke("workspace:load"),
    createCourse: (name: string) => ipcRenderer.invoke("course:create", name),
    createItem: (courseId: string, name: string) =>
      ipcRenderer.invoke("item:create", courseId, name),
    renameCourse: (courseId: string, name: string) =>
      ipcRenderer.invoke("course:rename", courseId, name),
    renameItem: (courseId: string, itemId: string, name: string) =>
      ipcRenderer.invoke("item:rename", courseId, itemId, name),
    deleteCourse: (courseId: string) => ipcRenderer.invoke("course:delete", courseId),
    deleteItem: (courseId: string, itemId: string) =>
      ipcRenderer.invoke("item:delete", courseId, itemId),
    saveItemDraft: (
      courseId: string,
      itemId: string,
      draft: {
        dueDate: string;
        submissionLink: string;
        others: string;
        materialLinks: string;
      }
    ) => ipcRenderer.invoke("item:saveDraft", courseId, itemId, draft),
    openPackage: (courseId: string, itemId: string) =>
      ipcRenderer.invoke("package:open", courseId, itemId)
  });

  console.log("[preload] appBridge exposed");
} catch (error) {
  console.error("[preload] Failed to expose appBridge.", error);
  throw error;
}
