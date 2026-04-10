# 开发日志

## 文档约定

- 本目录用于记录开发过程中的实现情况、需求调整和当前状态。
- 每次有功能修改、交互变更、结构调整或实现偏移，都要同步更新本文档。
- 本目录中的记录默认使用中文。
- 产品需求的基线文档仍然是 [local_vault_demo_tech_spec.md](/c:/Users/lenovo/Desktop/CourseMaster/local_vault_demo_tech_spec.md)。
- 本文档负责记录“相对于基线文档，当前实际实现成了什么样”。

## 当前相对基线文档的调整

当前实现相对技术文档中的导航描述，已经做了简化。

基线文档中的导航结构：

```text
Workspace
  -> Courses
    -> Course
      -> Items
        -> Item Detail
```

当前实际实现：

```text
Workspace
  -> Add Folder
    -> course
      -> Add Folder
        -> item
      -> item detail
```

具体变化如下：

- 原本独立的 `Courses` 列表页，被折叠进了 `workspace` 页。
- `Workspace` 页面现在直接显示课程列表。
- 打开某个课程后，顶部显示 `Courses`，下方直接显示该课程下的 item 列表。
- 打开某个 item 后，顶部显示 `Items`，进入该 item 的详情页。
- 初始示例课程和示例 item 已移除，不再默认生成 `course1`、`course2`。
- 根层不再显示 `Add a new course` 这样的占位行。
- 课程层不再显示 `Add a new item` 这样的占位行。
- 根层和课程层都改为使用小号 `Add Folder` 按钮触发创建。
- 顶部导航文案统一采用首字母大写：`Workspace`、`Back`、`Courses`、`Items`。
- 数据不再只存在前端内存中，已改为通过 Electron IPC 读写本地 JSON。
- Windows 打包配置已从通用壳模板改为当前项目专用配置。

## 当前界面方向

当前界面遵循“能少就少”的原则，尽量避免编辑器化和工具化外观。

- 原生 Electron 菜单栏已移除。
- 页面中不再显示 `Desktop App Shell`、`Bridge Ready` 等壳层信息。
- 顶部不再显示层级路径串，只保留最小必要的标题或返回按钮。
- 第一层左上角显示 `Workspace`。
- 第二层左侧显示 `Back`，右侧显示 `Courses`。
- 第三层左侧显示 `Back`，右侧显示 `Items`。
- `Add Folder` 和 `Back` 使用同一套按钮边框风格。
- 列表项采用长条形布局。
- 列表内容目前只占据左半边，右半边留空，作为后续扩展区域。
- 整体视觉方向为简约、克制、留白充足。
- 新建按钮固定在标题栏下方。
- 新建输入框只会在点击 `Add Folder` 后临时出现在列表最上方，创建完成或取消后不会保留空白占位。
- Item 详情页已改为真正可编辑的 `Pipeline` 与 `Package` 双卡片结构。

## 当前已实现功能

### Milestone 1：应用壳启动

- Electron + React + TypeScript 工程已能启动。
- preload bridge 已正常注入。
- Electron 窗口能够加载 renderer 页面。

### Milestone 2：虚拟导航骨架

- `workspace` 页面已实现。
- `workspace` 页面可直接显示课程列表。
- 点击课程后可进入该课程下的 item 列表。
- 可通过返回箭头返回上一层。

### Milestone 3：Item 详情页

- 点击 item 后可进入详情页。
- 详情页中已显示 `pipeline` 区块。
- 详情页中已显示 `package` 按钮。
- 从详情页可返回 item 列表。

### Milestone 4：Pipeline 可编辑与保存

- `Pipeline` 已改为可编辑表单，不再是占位内容。
- 当前包含三个输入区块：`Due Date`、`Submission Link`、`Others`。
- 每个输入区块都使用自适应高度文本框。
- 文本框支持回车换行扩展内容。
- 文本框按 `Esc` 会退出当前输入焦点。
- 输入内容会自动保存到本地 JSON。
- 返回上一层前会主动刷新一次待保存内容，避免刚输入的内容丢失。
- 重启应用后，之前输入的内容仍可重新加载。

### 当前新增的交互能力

- `workspace` 页面支持 `add folder`，用于新增课程。
- `courses` 页面支持 `add folder`，用于新增 item。
- 初始化时不再显示任何默认课程或默认 item。
- `Add Folder` 按钮固定显示在标题栏下方。
- 创建输入框只在创建态出现，位置位于列表最上方；创建完成后不再保留空行。
- 课程、新建 item、重命名、删除都已接入本地 JSON 持久化，不再只修改前端状态。
- 应用启动时会自动从本地 JSON 加载课程与 item 数据。
- 本地 JSON 存放在 Electron `userData` 目录下的 `app-data.json`。
- 右键任意课程会弹出虚拟文件夹菜单。
- 右键任意 item 会弹出虚拟文件夹菜单。
- 右键菜单当前包含：`重命名`、`删除`。
- `重命名` 和 `删除` 目前作用于虚拟结构，不涉及真实文件系统。
- `重命名` 已改为行内编辑模式，不再使用弹窗输入。
- 触发重命名后，该行标题会直接切换为可编辑输入框。
- 行内重命名支持回车确认、失焦保存、Esc 取消。
- 删除已改为应用内确认弹层，不再使用浏览器原生确认框。
- 课程和 item 的右键菜单行为已统一维护，避免只改一侧。
- 行内编辑时，当前行会出现高亮边框和背景变化，用于明确提示“正在修改”。
- 新建 course 不再自动命名为 `course3` 这类默认名称，而是先进入固定位置的行内输入状态，让用户直接输入名称。
- 新建 item 也采用相同的固定位置行内输入模式。
- 返回入口已从单独的左箭头改为带边框的 `Back` 按钮。
- `Pipeline` 卡片会显示当前 item 名称与保存状态。
- `Pipeline` 的 `Due Date`、`Submission Link`、`Others` 已支持自动保存。
- `Package` 卡片中的 `Material Links` 已支持自动保存。
- `Package` 卡片中的 `Files` 区块已接通真实本地文件夹。
- 点击 `Open Folder` 或 `Files` 区块时，会自动创建并打开该 item 对应的真实文件夹。
- 真实文件夹默认放在用户 `Documents/CourseMasterWorkspace/<course-id>/<item-id>` 下。
- 如果该文件夹里已有内容，界面会抓取前 5 个文件名纵向显示。
- 已增加 Windows 桌面打包脚本 `npm run package`。
- 打包配置已设置为生成 `NSIS` 安装包和 `win-unpacked` 目录。
- 为适配本地开发机权限环境，Windows 打包已关闭 `signAndEditExecutable`，避免 `winCodeSign` 解压符号链接时报错。

## 当前尚未实现

### Milestone 5：打包为桌面应用

- 打包链路已经接通，但仍未加入自定义应用图标。
- 当前使用默认 Electron 图标。

### 数据层

- 已接入本地 JSON 读写。
- 已通过 IPC 加载和更新真实 workspace 数据。
- 当前数据模型已经扩展到：
  - `course` / `item` 基础信息
  - `dueDate`
  - `submissionLink`
  - `others`
  - `materialLinks`
  - `packagePath`
- 还没有拆成更复杂的结构化 Pipeline section 数据模型。

## 后续记录要求

从现在开始，每次开发完成后都应至少补充以下内容：

1. 本次改了什么。
2. 相对基线文档有哪些偏移。
3. 当前已经实现到哪个 milestone。
4. 还有哪些未完成或临时占位的部分。
