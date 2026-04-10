import { useEffect, useState } from "react";

type Item = {
  id: string;
  name: string;
  pipelinePreview: string;
};

type Course = {
  id: string;
  name: string;
  items: Item[];
};

const demoCourses: Course[] = [];

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

function App() {
  const [courses, setCourses] = useState<Course[]>(demoCourses);
  const [screen, setScreen] = useState<Screen>("workspace");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [renameState, setRenameState] = useState<RenameState>(null);
  const [createState, setCreateState] = useState<CreateState>(null);
  const [deleteState, setDeleteState] = useState<DeleteState>(null);
  const selectedCourse =
    courses.find((course) => course.id === selectedCourseId) ?? null;
  const selectedItem =
    selectedCourse?.items.find((item) => item.id === selectedItemId) ?? null;

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

  function openItems(courseId: string) {
    setSelectedCourseId(courseId);
    setSelectedItemId(null);
    setContextMenu(null);
    setRenameState(null);
    setCreateState(null);
    setDeleteState(null);
    setScreen("items");
  }

  function openItemDetail(itemId: string) {
    if (renameState) {
      return;
    }

    setSelectedItemId(itemId);
    setContextMenu(null);
    setRenameState(null);
    setCreateState(null);
    setDeleteState(null);
    setScreen("detail");
  }

  function goBack() {
    if (screen === "detail") {
      setScreen("items");
      setRenameState(null);
      setCreateState(null);
      setDeleteState(null);
      return;
    }

    if (screen === "items") {
      setScreen("workspace");
      setRenameState(null);
      setCreateState(null);
      setDeleteState(null);
      return;
    }

    setRenameState(null);
    setCreateState(null);
    setDeleteState(null);
    setScreen("workspace");
  }

  function addCourse() {
    setContextMenu(null);
    setRenameState(null);
    setCreateState({
      kind: "course",
      draft: ""
    });
    setDeleteState(null);
  }

  function addItem() {
    if (!selectedCourseId) {
      return;
    }

    setContextMenu(null);
    setRenameState(null);
    setCreateState({
      kind: "item",
      draft: ""
    });
    setDeleteState(null);
  }

  function updateCreateDraft(draft: string) {
    setCreateState((current) => (current ? { ...current, draft } : current));
  }

  function beginRename(kind: "course" | "item", id: string) {
    setContextMenu(null);
    setCreateState(null);

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

  function submitRename() {
    if (!renameState) {
      return;
    }

    const nextName = renameState.draft.trim();

    if (nextName === "") {
      setRenameState(null);
      return;
    }

    if (renameState.kind === "course") {
      setCourses((current) =>
        current.map((course) =>
          course.id === renameState.id ? { ...course, name: nextName } : course
        )
      );
      setRenameState(null);
      return;
    }

    setCourses((current) =>
      current.map((course) => {
        if (course.id !== selectedCourseId) {
          return course;
        }

        return {
          ...course,
          items: course.items.map((item) =>
            item.id === renameState.id ? { ...item, name: nextName } : item
          )
        };
      })
    );
    setRenameState(null);
  }

  function submitCreate() {
    if (!createState) {
      return;
    }

    const nextName = createState.draft.trim();

    if (nextName === "") {
      setCreateState(null);
      return;
    }

    if (createState.kind === "course") {
      const nextCourseId = `course-${Date.now()}`;
      setCourses((current) => [
        ...current,
        {
          id: nextCourseId,
          name: nextName,
          items: []
        }
      ]);
      setCreateState(null);
      return;
    }

    if (!selectedCourseId) {
      setCreateState(null);
      return;
    }

    setCourses((current) =>
      current.map((course) => {
        if (course.id !== selectedCourseId) {
          return course;
        }

        return {
          ...course,
          items: [
            ...course.items,
            {
              id: `item-${Date.now()}`,
              name: nextName,
              pipelinePreview: "New item pipeline notes will appear here."
            }
          ]
        };
      })
    );
    setCreateState(null);
  }

  function deleteCourse(courseId: string) {
    const target = courses.find((course) => course.id === courseId);
    setContextMenu(null);
    setRenameState(null);
    setCreateState(null);
    setDeleteState(null);

    if (!target) {
      return;
    }

    setCourses((current) => current.filter((course) => course.id !== courseId));

    if (selectedCourseId === courseId) {
      setSelectedCourseId(null);
      setSelectedItemId(null);
      setScreen("workspace");
    }
  }

  function deleteItem(itemId: string) {
    const target = selectedCourse?.items.find((item) => item.id === itemId);
    setContextMenu(null);
    setRenameState(null);
    setCreateState(null);
    setDeleteState(null);

    if (!target || !selectedCourseId) {
      return;
    }

    setCourses((current) =>
      current.map((course) => {
        if (course.id !== selectedCourseId) {
          return course;
        }

        return {
          ...course,
          items: course.items.filter((item) => item.id !== itemId)
        };
      })
    );

    if (selectedItemId === itemId) {
      setSelectedItemId(null);
      setScreen("items");
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

    if (contextMenu.kind === "course") {
      const target = courses.find((course) => course.id === contextMenu.id);
      if (!target) {
        return;
      }

      setDeleteState({
        kind: "course",
        id: target.id,
        name: target.name
      });
      setContextMenu(null);
      return;
    }

    const target = selectedCourse?.items.find((item) => item.id === contextMenu.id);
    if (!target) {
      return;
    }

    setDeleteState({
      kind: "item",
      id: target.id,
      name: target.name
    });
    setContextMenu(null);
  }

  function handleRenameKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      submitRename();
      return;
    }

    if (event.key === "Escape") {
      cancelRename();
    }
  }

  function handleCreateKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      submitCreate();
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

  function confirmDelete() {
    if (!deleteState) {
      return;
    }

    if (deleteState.kind === "course") {
      deleteCourse(deleteState.id);
      return;
    }

    deleteItem(deleteState.id);
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
                  onBlur={submitCreate}
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
                    onBlur={submitRename}
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
            <button className="nav-button" type="button" onClick={goBack} aria-label="Back">
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
                  onBlur={submitCreate}
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
                    onBlur={submitRename}
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
            <button className="nav-button" type="button" onClick={goBack} aria-label="Back">
              Back
            </button>
            <p className="eyebrow">Items</p>
          </header>

          <section className="detail-block">
            <div className="detail-block-header">
              <p className="section-label">pipeline</p>
              <button className="package-button" type="button">
                package
              </button>
            </div>
            <div className="pipeline-placeholder">
              <p className="detail-item-name">{selectedItem?.name ?? "item"}</p>
              <p className="pipeline-preview">
                {selectedItem?.pipelinePreview ??
                  "Pipeline content will live here as the main working panel for this item."}
              </p>
              <div className="pipeline-skeleton" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </section>
        </section>

        <section className="blank-pane" aria-hidden="true" />
      </section>
    );
  }

  return (
    <main className="app-shell">
      {screen === "workspace" ? renderWorkspace() : null}
      {screen === "items" ? renderItems() : null}
      {screen === "detail" ? renderDetail() : null}
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
                onClick={confirmDelete}
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
