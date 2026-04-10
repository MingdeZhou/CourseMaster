import { app, BrowserWindow, Menu, ipcMain } from "electron";
import path from "node:path";
import {
  createCourseData,
  createItemData,
  deleteCourseData,
  deleteItemData,
  loadWorkspaceData,
  openPackageFolder,
  renameCourseData,
  renameItemData,
  saveItemDraftData
} from "./workspaceStore";

const isDev = !app.isPackaged;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 900,
    minHeight: 600,
    title: "Workspace",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.webContents.on("preload-error", (_event, preloadPath, error) => {
    console.error("[preload-error]", preloadPath, error);
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL) => {
      console.error("[did-fail-load]", { errorCode, errorDescription, validatedURL });
    }
  );

  if (isDev) {
    void mainWindow.loadURL("http://127.0.0.1:5173");
    mainWindow.webContents.openDevTools({ mode: "detach" });
    return;
  }

  void mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  ipcMain.handle("workspace:load", () => loadWorkspaceData());
  ipcMain.handle("course:create", (_event, name: string) => createCourseData(name));
  ipcMain.handle("item:create", (_event, courseId: string, name: string) =>
    createItemData(courseId, name)
  );
  ipcMain.handle("course:rename", (_event, courseId: string, name: string) =>
    renameCourseData(courseId, name)
  );
  ipcMain.handle("item:rename", (_event, courseId: string, itemId: string, name: string) =>
    renameItemData(courseId, itemId, name)
  );
  ipcMain.handle("course:delete", (_event, courseId: string) => deleteCourseData(courseId));
  ipcMain.handle("item:delete", (_event, courseId: string, itemId: string) =>
    deleteItemData(courseId, itemId)
  );
  ipcMain.handle(
    "item:saveDraft",
    (_event, courseId: string, itemId: string, draft: Parameters<typeof saveItemDraftData>[2]) =>
      saveItemDraftData(courseId, itemId, draft)
  );
  ipcMain.handle("package:open", (_event, courseId: string, itemId: string) =>
    openPackageFolder(courseId, itemId)
  );
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
