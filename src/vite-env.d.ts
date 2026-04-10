/// <reference types="vite/client" />

declare global {
  interface Window {
    appBridge: {
      appName: string;
      runtime: {
        platform: string;
        chrome: string;
        electron: string;
        node: string;
      };
    };
  }
}

export {};
