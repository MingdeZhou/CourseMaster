import { contextBridge } from "electron";

try {
  contextBridge.exposeInMainWorld("appBridge", {
    appName: "Desktop App Shell",
    runtime: {
      platform: process.platform,
      chrome: process.versions.chrome,
      electron: process.versions.electron,
      node: process.versions.node
    }
  });

  console.log("[preload] appBridge exposed");
} catch (error) {
  console.error("[preload] Failed to expose appBridge.", error);
  throw error;
}
