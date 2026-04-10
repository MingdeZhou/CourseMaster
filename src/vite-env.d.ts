/// <reference types="vite/client" />

declare global {
  type WorkspaceItem = {
    id: string;
    name: string;
    dueDate: string;
    submissionLink: string;
    others: string;
    materialLinks: string;
    packagePath?: string;
    fileNames: string[];
  };

  type WorkspaceCourse = {
    id: string;
    name: string;
    items: WorkspaceItem[];
  };

  type WorkspaceData = {
    courses: WorkspaceCourse[];
  };

  type ItemDraftPayload = {
    dueDate: string;
    submissionLink: string;
    others: string;
    materialLinks: string;
  };

  interface Window {
    appBridge: {
      loadWorkspace: () => Promise<WorkspaceData>;
      createCourse: (name: string) => Promise<WorkspaceData>;
      createItem: (courseId: string, name: string) => Promise<WorkspaceData>;
      renameCourse: (courseId: string, name: string) => Promise<WorkspaceData>;
      renameItem: (courseId: string, itemId: string, name: string) => Promise<WorkspaceData>;
      deleteCourse: (courseId: string) => Promise<WorkspaceData>;
      deleteItem: (courseId: string, itemId: string) => Promise<WorkspaceData>;
      saveItemDraft: (
        courseId: string,
        itemId: string,
        draft: ItemDraftPayload
      ) => Promise<WorkspaceData>;
      openPackage: (
        courseId: string,
        itemId: string
      ) => Promise<{
        packagePath: string;
        workspace: WorkspaceData;
      }>;
    };
  }
}

export {};
