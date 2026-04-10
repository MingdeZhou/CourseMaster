import { useEffect, useRef, useState } from "react";

type Screen = "workspace" | "items" | "detail";
type ContextMenuState =
  | {
      kind: "course" | "item";
      id: string;
      x: number;
      y: number;
    }
  | null;
type RenameState =
  | {
      kind: "course" | "item";
      id: string;
      draft: string;
    }
  | null;
type CreateState =
  | {
      kind: "course" | "item";
      draft: string;
    }
  | null;
type DeleteState =
  | {
      kind: "course" | "item";
      id: string;
      name: string;
    }
  | null;
type DetailDraft = ItemDraftPayload;
type SaveState = "idle" | "saving" | "saved" | "error";

function getDetailDraft(item: WorkspaceItem): DetailDraft {
  return {
    dueDate: item.dueDate,
    submissionLink: item.submissionLink,
    others: item.others,
    materialLinks: item.materialLinks
  };
}

function AutoGrowField({
  label,
  value,
  placeholder,
  onChange,
  onCommit
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onCommit: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  return (
    <label className="detail-field">
      <span className="detail-field-label">{label}</span>
      <textarea
        ref={textareaRef}
        className="detail-textarea"
        value={value}
        rows={1}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onCommit}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.currentTarget.blur();
          }
        }}
      />
    </label>
  );
}

function App() {
  const [courses, setCourses] = useState<WorkspaceCourse[]>([]);
  const [screen, setScreen] = useState<Screen>("workspace");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [renameState, setRenameState] = useState<RenameState>(null);
  const [createState, setCreateState] = useState<CreateState>(null);
  const [deleteState, setDeleteState] = useState<DeleteState>(null);
  const [detailDraft, setDetailDraft] = useState<DetailDraft | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [screenMessage, setScreenMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveTimerRef = useRef<number | null>(null);
  const draftRef = useRef<DetailDraft | null>(null);
  const selectedCourseIdRef = useRef<string | null>(null);
  const selectedItemIdRef = useRef<string | null>(null);
  const screenRef = useRef<Screen>("workspace");
  const isSubmittingCreateRef = useRef(false);
  const isSubmittingRenameRef = useRef(false);

  const selectedCourse =
    courses.find((course) => course.id === selectedCourseId) ?? null;
  const selectedItem =
    selectedCourse?.items.find((item) => item.id === selectedItemId) ?? null;

  useEffect(() => {
    selectedCourseIdRef.current = selectedCourseId;
  }, [selectedCourseId]);

  useEffect(() => {
    selectedItemIdRef.current = selectedItemId;
  }, [selectedItemId]);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    draftRef.current = detailDraft;
  }, [detailDraft]);

  useEffect(() => {
    void loadWorkspace();

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    function handlePointerDown() {
      setContextMenu(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenu]);

  useEffect(() => {
    if (!deleteState) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDeleteState(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [deleteState]);

  useEffect(() => {
    if (!selectedItem) {
      setDetailDraft(null);
      setSaveState("idle");
      return;
    }

    setDetailDraft(getDetailDraft(selectedItem));
    setSaveState("idle");
  }, [selectedCourseId, selectedItemId]);

  function applyWorkspace(nextWorkspace: WorkspaceData) {
    setCourses(nextWorkspace.courses);

    const currentCourse = nextWorkspace.courses.find(
      (course) => course.id === selectedCourseIdRef.current
    );

    if (!currentCourse) {
      if (selectedCourseIdRef.current) {
        setSelectedCourseId(null);
      }

      if (selectedItemIdRef.current) {
        setSelectedItemId(null);
      }

      if (screenRef.current !== "workspace") {
        setScreen("workspace");
      }

      return;
    }

    const currentItem = currentCourse.items.find(
      (item) => item.id === selectedItemIdRef.current
    );

    if (!currentItem && selectedItemIdRef.current) {
      setSelectedItemId(null);

      if (screenRef.current === "detail") {
        setScreen("items");
      }
    }
  }

  async function loadWorkspace() {
    setIsLoading(true);
    setScreenMessage(null);

    try {
      const nextWorkspace = await window.appBridge.loadWorkspace();
      applyWorkspace(nextWorkspace);
    } catch (error) {
      setScreenMessage(
        error instanceof Error ? error.message : "加载本地数据失败，请稍后重试。"
      );
    } finally {
      setIsLoading(false);
    }
  }

  function clearTransientStates() {
    setContextMenu(null);
    setRenameState(null);
    setCreateState(null);
    setDeleteState(null);
  }

  function openItems(courseId: string) {
    clearTransientStates();
    setSelectedCourseId(courseId);
    setSelectedItemId(null);
    setScreenMessage(null);
    setScreen("items");
  }

  function openItemDetail(itemId: string) {
    if (renameState) {
      return;
    }

    clearTransientStates();
    setSelectedItemId(itemId);
    setScreenMessage(null);
    setScreen("detail");
  }

  async function flushDraftSave() {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const currentCourseId = selectedCourseIdRef.current;
    const currentItemId = selectedItemIdRef.current;
    const currentDraft = draftRef.current;

    if (!currentCourseId || !currentItemId || !currentDraft) {
      return;
    }

    try {
      const nextWorkspace = await window.appBridge.saveItemDraft(
        currentCourseId,
        currentItemId,
        currentDraft
      );
      applyWorkspace(nextWorkspace);
      setSaveState("saved");
    } catch (error) {
      setSaveState("error");
      setScreenMessage(
        error instanceof Error ? error.message : "保存 Pipeline 失败，请稍后重试。"
      );
    }
  }

  async function goBack() {
    await flushDraftSave();

    if (screen === "detail") {
      clearTransientStates();
      setScreen("items");
      return;
    }

    if (screen === "items") {
      clearTransientStates();
      setScreen("workspace");
      return;
    }

    clearTransientStates();
    setScreen("workspace");
  }

  function addCourse() {
    setContextMenu(null);
    setRenameState(null);
    setDeleteState(null);
    setCreateState({
      kind: "course",
      draft: ""
    });
    setScreenMessage(null);
  }

  function addItem() {
    if (!selectedCourseId) {
      return;
    }

    setContextMenu(null);
    setRenameState(null);
    setDeleteState(null);
    setCreateState({
      kind: "item",
      draft: ""
    });
    setScreenMessage(null);
  }

  function updateCreateDraft(draft: string) {
    setCreateState((current) => (current ? { ...current, draft } : current));
  }

  function beginRename(kind: "course" | "item", id: string) {
    setContextMenu(null);
    setCreateState(null);
    setScreenMessage(null);

    if (kind === "course") {
      const target = courses.find((course) => course.id === id);
      if (!target) {
        return;
      }

      setRenameState({
        kind,
        id,
        draft: target.name
      });
      return;
    }

    const target = selectedCourse?.items.find((item) => item.id === id);
    if (!target) {
      return;
    }

    setRenameState({
      kind,
      id,
      draft: target.name
    });
  }

  function updateRenameDraft(draft: string) {
    setRenameState((current) => (current ? { ...current, draft } : current));
  }

  function cancelRename() {
    setRenameState(null);
  }

  function cancelCreate() {
    setCreateState(null);
  }

  async function submitRename() {
    if (!renameState || isSubmittingRenameRef.current) {
      return;
    }

    const nextName = renameState.draft.trim();

    if (nextName === "") {
      setRenameState(null);
      return;
    }

    isSubmittingRenameRef.current = true;

    try {
      const nextWorkspace =
        renameState.kind === "course"
          ? await window.appBridge.renameCourse(renameState.id, nextName)
          : await window.appBridge.renameItem(
              selectedCourseId ?? "",
              renameState.id,
              nextName
            );

      applyWorkspace(nextWorkspace);
      setRenameState(null);
    } catch (error) {
      setScreenMessage(
        error instanceof Error ? error.message : "重命名失败，请稍后重试。"
      );
    } finally {
      isSubmittingRenameRef.current = false;
    }
  }

  async function submitCreate() {
    if (!createState || isSubmittingCreateRef.current) {
      return;
    }

    const nextName = createState.draft.trim();

    if (nextName === "") {
      setCreateState(null);
      return;
    }

    isSubmittingCreateRef.current = true;

    try {
      const nextWorkspace =
        createState.kind === "course"
          ? await window.appBridge.createCourse(nextName)
          : await window.appBridge.createItem(selectedCourseId ?? "", nextName);

      applyWorkspace(nextWorkspace);
      setCreateState(null);
    } catch (error) {
      setScreenMessage(
        error instanceof Error ? error.message : "创建文件夹失败，请稍后重试。"
      );
    } finally {
      isSubmittingCreateRef.current = false;
    }
  }

  function requestDelete(kind: "course" | "item", id: string) {
    if (kind === "course") {
      const target = courses.find((course) => course.id === id);
      if (!target) {
        return;
      }

      setDeleteState({
        kind,
        id,
        name: target.name
      });
      setContextMenu(null);
      return;
    }

    const target = selectedCourse?.items.find((item) => item.id === id);
    if (!target) {
      return;
    }

    setDeleteState({
      kind,
      id,
      name: target.name
    });
    setContextMenu(null);
  }

  async function confirmDelete() {
    if (!deleteState) {
      return;
    }

    try {
      const nextWorkspace =
        deleteState.kind === "course"
          ? await window.appBridge.deleteCourse(deleteState.id)
          : await window.appBridge.deleteItem(selectedCourseId ?? "", deleteState.id);

      applyWorkspace(nextWorkspace);
      setDeleteState(null);
    } catch (error) {
      setScreenMessage(
        error instanceof Error ? error.message : "删除失败，请稍后重试。"
      );
    }
  }

  function openContextMenu(
    event: React.MouseEvent<HTMLElement>,
    kind: "course" | "item",
    id: string
  ) {
    event.preventDefault();
    setContextMenu({
      kind,
      id,
      x: event.clientX,
      y: event.clientY
    });
  }

  function handleRenameAction() {
    if (!contextMenu) {
      return;
    }

    beginRename(contextMenu.kind, contextMenu.id);
  }

  function handleDeleteAction() {
    if (!contextMenu) {
      return;
    }

    requestDelete(contextMenu.kind, contextMenu.id);
  }

  function handleRenameKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      void submitRename();
      return;
    }

    if (event.key === "Escape") {
      cancelRename();
    }
  }

  function handleCreateKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      void submitCreate();
      return;
    }

    if (event.key === "Escape") {
      cancelCreate();
    }
  }

  function handleRowKeyDown(
    event: React.KeyboardEvent<HTMLElement>,
    action: () => void,
    disabled = false
  ) {
    if (disabled) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
    }
  }

  function updateDraftField(field: keyof DetailDraft, value: string) {
    setDetailDraft((current) => {
      if (!current) {
        return current;
      }

      const nextDraft = { ...current, [field]: value };
      draftRef.current = nextDraft;
      return nextDraft;
    });

    setSaveState("saving");
    setScreenMessage(null);

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      void flushDraftSave();
    }, 500);
  }

  async function handleOpenPackage() {
    if (!selectedCourseId || !selectedItemId) {
      return;
    }

    try {
      const result = await window.appBridge.openPackage(selectedCourseId, selectedItemId);
      applyWorkspace(result.workspace);
      setScreenMessage(`已打开文件夹：${result.packagePath}`);
    } catch (error) {
      setScreenMessage(
        error instanceof Error ? error.message : "打开 Package 文件夹失败，请稍后重试。"
      );
    }
  }

  function getSaveLabel() {
    if (saveState === "saving") {
      return "Saving...";
    }

    if (saveState === "saved") {
      return "Saved";
    }

    if (saveState === "error") {
      return "Save failed";
    }

    return "";
  }

  function renderWorkspace() {
    return (
      <section className="screen-layout">
        <section className="list-pane">
          <header className="nav-bar">
            <p className="eyebrow">Workspace</p>
          </header>

          <div className="toolbar-row">
            <button className="nav-button" type="button" onClick={addCourse}>
              Add Folder
            </button>
          </div>

          {createState?.kind === "course" ? (
            <div className="composer-slot">
              <div className="list-row list-row-editing list-row-static">
                <input
                  className="rename-input"
                  value={createState.draft}
                  autoFocus
                  placeholder="Enter course name"
                  onChange={(event) => updateCreateDraft(event.target.value)}
                  onKeyDown={handleCreateKeyDown}
                  onBlur={() => void submitCreate()}
                />
                <span className="list-meta">new course</span>
              </div>
            </div>
          ) : null}

          <section className="list-stack" aria-label="Workspace Courses">
            {courses.map((course) => (
              <div
                key={course.id}
                className={
                  renameState?.kind === "course" && renameState.id === course.id
                    ? "list-row list-row-editing"
                    : "list-row"
                }
                role="button"
                tabIndex={0}
                onClick={() => openItems(course.id)}
                onKeyDown={(event) =>
                  handleRowKeyDown(
                    event,
                    () => openItems(course.id),
                    renameState?.kind === "course" && renameState.id === course.id
                  )
                }
                onContextMenu={(event) => openContextMenu(event, "course", course.id)}
              >
                {renameState?.kind === "course" && renameState.id === course.id ? (
                  <input
                    className="rename-input"
                    value={renameState.draft}
                    autoFocus
                    onChange={(event) => updateRenameDraft(event.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    onBlur={() => void submitRename()}
                    onClick={(event) => event.stopPropagation()}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                ) : (
                  <span className="list-title">{course.name}</span>
                )}
                <span className="list-meta">{course.items.length} items</span>
              </div>
            ))}
          </section>
        </section>

        <section className="blank-pane" aria-hidden="true" />
      </section>
    );
  }

  function renderItems() {
    return (
      <section className="screen-layout">
        <section className="list-pane">
          <header className="nav-bar">
            <button className="nav-button" type="button" onClick={() => void goBack()}>
              Back
            </button>
            <p className="eyebrow">Courses</p>
          </header>

          <div className="toolbar-row">
            <button className="nav-button" type="button" onClick={addItem}>
              Add Folder
            </button>
          </div>

          {createState?.kind === "item" ? (
            <div className="composer-slot">
              <div className="list-row list-row-editing list-row-static">
                <input
                  className="rename-input"
                  value={createState.draft}
                  autoFocus
                  placeholder="Enter item name"
                  onChange={(event) => updateCreateDraft(event.target.value)}
                  onKeyDown={handleCreateKeyDown}
                  onBlur={() => void submitCreate()}
                />
                <span className="list-meta">new item</span>
              </div>
            </div>
          ) : null}

          <section className="list-stack" aria-label="Items List">
            {selectedCourse?.items.map((item) => (
              <div
                key={item.id}
                className={
                  renameState?.kind === "item" && renameState.id === item.id
                    ? "list-row list-row-editing"
                    : "list-row"
                }
                role="button"
                tabIndex={0}
                onClick={() => openItemDetail(item.id)}
                onKeyDown={(event) =>
                  handleRowKeyDown(
                    event,
                    () => openItemDetail(item.id),
                    renameState?.kind === "item" && renameState.id === item.id
                  )
                }
                onContextMenu={(event) => openContextMenu(event, "item", item.id)}
              >
                {renameState?.kind === "item" && renameState.id === item.id ? (
                  <input
                    className="rename-input"
                    value={renameState.draft}
                    autoFocus
                    onChange={(event) => updateRenameDraft(event.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    onBlur={() => void submitRename()}
                    onClick={(event) => event.stopPropagation()}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                ) : (
                  <span className="list-title">{item.name}</span>
                )}
                <span className="list-meta">open detail</span>
              </div>
            ))}
          </section>
        </section>

        <section className="blank-pane" aria-hidden="true" />
      </section>
    );
  }

  function renderDetail() {
    return (
      <section className="screen-layout">
        <section className="list-pane detail-pane">
          <header className="nav-bar">
            <button className="nav-button" type="button" onClick={() => void goBack()}>
              Back
            </button>
            <p className="eyebrow">Items</p>
          </header>

          <div className="detail-header">
            <div>
              <p className="detail-title">Pipeline</p>
              <p className="detail-item-name">{selectedItem?.name ?? "Item"}</p>
            </div>
            <span className="save-indicator">{getSaveLabel()}</span>
          </div>

          <section className="detail-card">
            <AutoGrowField
              label="Due Date"
              value={detailDraft?.dueDate ?? ""}
              placeholder="Enter due date"
              onChange={(value) => updateDraftField("dueDate", value)}
              onCommit={() => void flushDraftSave()}
            />
            <AutoGrowField
              label="Submission Link"
              value={detailDraft?.submissionLink ?? ""}
              placeholder="Paste submission link"
              onChange={(value) => updateDraftField("submissionLink", value)}
              onCommit={() => void flushDraftSave()}
            />
            <AutoGrowField
              label="Others"
              value={detailDraft?.others ?? ""}
              placeholder="Add notes, instructions, reminders"
              onChange={(value) => updateDraftField("others", value)}
              onCommit={() => void flushDraftSave()}
            />
          </section>

          <section className="detail-card">
            <div className="detail-card-top">
              <p className="detail-title">Package</p>
              <button className="package-button" type="button" onClick={() => void handleOpenPackage()}>
                Open Folder
              </button>
            </div>

            <AutoGrowField
              label="Material Links"
              value={detailDraft?.materialLinks ?? ""}
              placeholder="Paste source links or references"
              onChange={(value) => updateDraftField("materialLinks", value)}
              onCommit={() => void flushDraftSave()}
            />

            <button className="files-panel" type="button" onClick={() => void handleOpenPackage()}>
              <span className="detail-field-label">Files</span>
              <span className="files-hint">Click to open the real folder</span>
              {selectedItem?.fileNames.length ? (
                <div className="file-list" aria-label="Package Files">
                  {selectedItem.fileNames.map((fileName) => (
                    <span key={fileName} className="file-entry">
                      {fileName}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="files-empty">Empty</span>
              )}
            </button>
          </section>
        </section>

        <section className="blank-pane" aria-hidden="true" />
      </section>
    );
  }

  return (
    <main className="app-shell">
      {screenMessage ? <p className="screen-message">{screenMessage}</p> : null}
      {isLoading ? <p className="screen-message">Loading workspace...</p> : null}
      {!isLoading && screen === "workspace" ? renderWorkspace() : null}
      {!isLoading && screen === "items" ? renderItems() : null}
      {!isLoading && screen === "detail" ? renderDetail() : null}
      {contextMenu ? (
        <div
          className="context-menu"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 164),
            top: Math.min(contextMenu.y, window.innerHeight - 120)
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button className="context-menu-button" type="button" onClick={handleRenameAction}>
            重命名
          </button>
          <button
            className="context-menu-button context-menu-button-danger"
            type="button"
            onClick={handleDeleteAction}
          >
            删除
          </button>
        </div>
      ) : null}
      {deleteState ? (
        <div className="dialog-backdrop" onClick={() => setDeleteState(null)}>
          <div className="dialog-card" onClick={(event) => event.stopPropagation()}>
            <p className="dialog-title">删除文件夹</p>
            <p className="dialog-copy">
              你将删除虚拟文件夹 “{deleteState.name}”。此操作只会影响应用内结构，不会删除真实文件系统中的内容。
            </p>
            <div className="dialog-actions">
              <button className="dialog-button" type="button" onClick={() => setDeleteState(null)}>
                取消
              </button>
              <button
                className="dialog-button dialog-button-danger"
                type="button"
                onClick={() => void confirmDelete()}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default App;
