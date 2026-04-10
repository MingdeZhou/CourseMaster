import { app, shell } from "electron";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

type StoredWorkspace = {
  courses: StoredCourse[];
};

type StoredCourse = {
  id: string;
  name: string;
  items: StoredItem[];
};

type StoredItem = {
  id: string;
  name: string;
  dueDate: string;
  submissionLink: string;
  others: string;
  materialLinks: string;
  packagePath?: string;
};

export type WorkspaceData = {
  courses: CourseData[];
};

export type CourseData = {
  id: string;
  name: string;
  items: ItemData[];
};

export type ItemData = {
  id: string;
  name: string;
  dueDate: string;
  submissionLink: string;
  others: string;
  materialLinks: string;
  packagePath?: string;
  fileNames: string[];
};

export type ItemDraftPayload = {
  dueDate: string;
  submissionLink: string;
  others: string;
  materialLinks: string;
};

function getDataFilePath() {
  return path.join(app.getPath("userData"), "app-data.json");
}

function getPackageRootPath() {
  return path.join(app.getPath("documents"), "CourseMasterWorkspace");
}

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeStoredWorkspace(raw: unknown): StoredWorkspace {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as { courses?: unknown }).courses)) {
    return { courses: [] };
  }

  return {
    courses: (raw as { courses: unknown[] }).courses.map((course, courseIndex) => {
      const rawCourse = course && typeof course === "object" ? course : {};
      const items = Array.isArray((rawCourse as { items?: unknown }).items)
        ? ((rawCourse as { items: unknown[] }).items ?? [])
        : [];

      return {
        id: sanitizeText((rawCourse as { id?: unknown }).id) || `course-${courseIndex + 1}`,
        name: sanitizeText((rawCourse as { name?: unknown }).name) || `Course ${courseIndex + 1}`,
        items: items.map((item, itemIndex) => {
          const rawItem = item && typeof item === "object" ? item : {};

          return {
            id: sanitizeText((rawItem as { id?: unknown }).id) || `item-${itemIndex + 1}`,
            name: sanitizeText((rawItem as { name?: unknown }).name) || `Item ${itemIndex + 1}`,
            dueDate: sanitizeText((rawItem as { dueDate?: unknown }).dueDate),
            submissionLink: sanitizeText(
              (rawItem as { submissionLink?: unknown }).submissionLink
            ),
            others:
              sanitizeText((rawItem as { others?: unknown }).others) ||
              sanitizeText((rawItem as { pipelineText?: unknown }).pipelineText) ||
              sanitizeText((rawItem as { pipelinePreview?: unknown }).pipelinePreview),
            materialLinks: sanitizeText(
              (rawItem as { materialLinks?: unknown }).materialLinks
            ),
            packagePath: sanitizeText((rawItem as { packagePath?: unknown }).packagePath) || undefined
          };
        })
      };
    })
  };
}

async function ensureDataFile() {
  const dataFilePath = getDataFilePath();
  const directory = path.dirname(dataFilePath);

  await mkdir(directory, { recursive: true });

  try {
    await stat(dataFilePath);
  } catch {
    await writeFile(dataFilePath, JSON.stringify({ courses: [] }, null, 2), "utf8");
  }
}

async function readStoredWorkspace() {
  await ensureDataFile();
  const dataFilePath = getDataFilePath();
  const content = await readFile(dataFilePath, "utf8");

  try {
    return normalizeStoredWorkspace(JSON.parse(content));
  } catch {
    const emptyWorkspace = { courses: [] } satisfies StoredWorkspace;
    await writeStoredWorkspace(emptyWorkspace);
    return emptyWorkspace;
  }
}

async function writeStoredWorkspace(workspace: StoredWorkspace) {
  await ensureDataFile();
  const dataFilePath = getDataFilePath();
  await writeFile(dataFilePath, JSON.stringify(workspace, null, 2), "utf8");
}

async function listPackageFiles(packagePath?: string) {
  if (!packagePath) {
    return [];
  }

  try {
    const entries = await readdir(packagePath, { withFileTypes: true });

    return entries
      .filter((entry) => !entry.name.startsWith("."))
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right))
      .slice(0, 5);
  } catch {
    return [];
  }
}

async function enrichWorkspace(workspace: StoredWorkspace): Promise<WorkspaceData> {
  return {
    courses: await Promise.all(
      workspace.courses.map(async (course) => ({
        id: course.id,
        name: course.name,
        items: await Promise.all(
          course.items.map(async (item) => ({
            ...item,
            fileNames: await listPackageFiles(item.packagePath)
          }))
        )
      }))
    )
  };
}

function findCourse(workspace: StoredWorkspace, courseId: string) {
  return workspace.courses.find((course) => course.id === courseId) ?? null;
}

function findItem(course: StoredCourse, itemId: string) {
  return course.items.find((item) => item.id === itemId) ?? null;
}

export async function loadWorkspaceData() {
  const workspace = await readStoredWorkspace();
  return enrichWorkspace(workspace);
}

export async function createCourseData(name: string) {
  const workspace = await readStoredWorkspace();

  workspace.courses.push({
    id: randomUUID(),
    name,
    items: []
  });

  await writeStoredWorkspace(workspace);
  return enrichWorkspace(workspace);
}

export async function createItemData(courseId: string, name: string) {
  const workspace = await readStoredWorkspace();
  const course = findCourse(workspace, courseId);

  if (!course) {
    throw new Error("未找到对应课程。");
  }

  course.items.push({
    id: randomUUID(),
    name,
    dueDate: "",
    submissionLink: "",
    others: "",
    materialLinks: "",
    packagePath: undefined
  });

  await writeStoredWorkspace(workspace);
  return enrichWorkspace(workspace);
}

export async function renameCourseData(courseId: string, name: string) {
  const workspace = await readStoredWorkspace();
  const course = findCourse(workspace, courseId);

  if (!course) {
    throw new Error("未找到对应课程。");
  }

  course.name = name;
  await writeStoredWorkspace(workspace);
  return enrichWorkspace(workspace);
}

export async function renameItemData(courseId: string, itemId: string, name: string) {
  const workspace = await readStoredWorkspace();
  const course = findCourse(workspace, courseId);

  if (!course) {
    throw new Error("未找到对应课程。");
  }

  const item = findItem(course, itemId);
  if (!item) {
    throw new Error("未找到对应项目。");
  }

  item.name = name;
  await writeStoredWorkspace(workspace);
  return enrichWorkspace(workspace);
}

export async function deleteCourseData(courseId: string) {
  const workspace = await readStoredWorkspace();

  workspace.courses = workspace.courses.filter((course) => course.id !== courseId);

  await writeStoredWorkspace(workspace);
  return enrichWorkspace(workspace);
}

export async function deleteItemData(courseId: string, itemId: string) {
  const workspace = await readStoredWorkspace();
  const course = findCourse(workspace, courseId);

  if (!course) {
    throw new Error("未找到对应课程。");
  }

  course.items = course.items.filter((item) => item.id !== itemId);

  await writeStoredWorkspace(workspace);
  return enrichWorkspace(workspace);
}

export async function saveItemDraftData(
  courseId: string,
  itemId: string,
  draft: ItemDraftPayload
) {
  const workspace = await readStoredWorkspace();
  const course = findCourse(workspace, courseId);

  if (!course) {
    throw new Error("未找到对应课程。");
  }

  const item = findItem(course, itemId);
  if (!item) {
    throw new Error("未找到对应项目。");
  }

  item.dueDate = sanitizeText(draft.dueDate);
  item.submissionLink = sanitizeText(draft.submissionLink);
  item.others = sanitizeText(draft.others);
  item.materialLinks = sanitizeText(draft.materialLinks);

  await writeStoredWorkspace(workspace);
  return enrichWorkspace(workspace);
}

export async function openPackageFolder(courseId: string, itemId: string) {
  const workspace = await readStoredWorkspace();
  const course = findCourse(workspace, courseId);

  if (!course) {
    throw new Error("未找到对应课程。");
  }

  const item = findItem(course, itemId);
  if (!item) {
    throw new Error("未找到对应项目。");
  }

  const packagePath =
    item.packagePath ?? path.join(getPackageRootPath(), course.id, item.id);

  await mkdir(packagePath, { recursive: true });

  if (item.packagePath !== packagePath) {
    item.packagePath = packagePath;
    await writeStoredWorkspace(workspace);
  }

  const openResult = await shell.openPath(packagePath);
  if (openResult) {
    throw new Error(openResult);
  }

  return {
    packagePath,
    workspace: await enrichWorkspace(workspace)
  };
}
