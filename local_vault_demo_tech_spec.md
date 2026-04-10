# Workspace 桌面应用最小 Demo 技术文档（重写版）

## 1. 文档目标

本文档定义一个新的最小可运行 Demo（MVP）方案。该方案不再以“显示真实文件系统目录树”为核心，而是改为：

- 打包成一个本地桌面应用
- 应用打开后呈现一个干净的、像文件系统一样的导航界面
- 顶层固定为 `Workspace`
- `Workspace` 下进入 `Courses`
- `Courses` 下进入 `Items`
- 用户通过“点击进入 / 点击返回”的方式在层级中导航
- 点进某个 `Item` 后，进入一个详情页，而不是继续看文件树
- 详情页中包含两个核心区块：
  - `Pipeline`：一个分块的、可编辑的工作笔记页面
  - `Package`：一个按钮，用于打开该 Item 对应的真实本地文件夹
- 第一次点击 `Package` 时，系统自动创建这个 Item 的专属文件夹
- 之后再次点击 `Package` 时，总是打开同一个文件夹

本产品的定位已经从“本地文件系统浏览器”调整为：

**一个面向课程和作业流程管理的桌面工作台，每个 Item 绑定一个真实本地材料文件夹。**

---

## 2. 产品核心理解

### 2.1 这不是什么

本应用不是：

- 通用文件管理器
- 真实磁盘目录树浏览器
- 直接把整个本机文件系统映射进 UI 的工具
- 以文件树为核心的知识库产品

### 2.2 这是什么

本应用更像：

- 一个课程工作台
- 一个作业项目管理器
- 一个“虚拟导航 + 本地材料包”系统

其中：

- 前台界面是**虚拟层级结构**
- 后台每个 Item 都可以绑定一个**真实本地文件夹**
- 用户在软件里管理“这项作业该怎么做”
- 用户在外部文件夹里管理“这项作业的材料和输出文件”

### 2.3 Pipeline 与 Package 的职责划分

#### Pipeline

Pipeline 是该 Item 的工作页，本质上是一个：

**漂亮的、分块的、可编辑的笔记本页面**

用户可以在里面：

- 写文字
- 填链接
- 填 due date
- 填 submission link
- 记录步骤
- 写自己的备注
- 记录材料来源
- 记录提交窗口信息

后续可继续拆成多个区块，例如：

- Information
- Material Links
- Submission Window

也就是说：

**Pipeline 管“怎么做”和“要知道什么”。**

#### Package

Package 是一个按钮，不在应用内显示文件树。

它的行为是：

- 第一次点击时：自动创建一个专属文件夹
- 之后点击时：总是打开同一个真实文件夹

用户会在这个文件夹里：

- 放 PDF
- 放图片
- 放 dataset
- 放代码
- 放输出文件
- 放与作业有关的任何原始材料或产出物

也就是说：

**Package 管“材料放哪里”。**

---

## 3. 用户使用流程

目标用户的典型使用路径如下：

1. 打开应用
2. 进入 `Workspace`
3. 点击进入 `Courses`
4. 选择某个课程
5. 进入该课程下的 `Items`
6. 选择某个 Item
7. 进入该 Item 的详情页
8. 在 `Pipeline` 中查看或编辑：
   - 作业说明
   - 提交链接
   - due date
   - 材料链接
   - 自己的流程备注
9. 点击 `Package`
10. 系统打开该 Item 对应的真实本地文件夹
11. 用户在外部资源管理器中处理文件
12. 下次回来时，再进入该 Item，继续参考 Pipeline 并打开 Package

所以整个产品体验是：

**“软件里管理流程，系统文件夹里管理材料。”**

---

## 4. 本次最小 Demo 范围

### 4.1 本次要实现的功能

1. 打开桌面应用
2. 显示 `Workspace` 入口
3. 进入 `Courses` 页面
4. 进入某个课程下的 `Items` 页面
5. 进入某个 `Item` 的详情页
6. 在详情页显示：
   - `Pipeline` 区块
   - `Package` 按钮
7. `Pipeline` 中支持最基本的文本输入与保存
8. 点击 `Package` 时：
   - 若不存在专属文件夹，则自动创建
   - 然后用系统资源管理器打开该文件夹

### 4.2 本次不实现的功能

以下功能暂时不做：

- 真正的多用户系统
- 云同步
- AI 问答
- 内容搜索
- 文件内嵌预览
- 在应用中直接浏览 package 内部文件树
- 复杂标签系统
- 富文本编辑器
- 拖拽导入事件管理
- 复杂数据库关系
- deadline 自动提醒

---

## 5. 技术选型

推荐最小 Demo 使用：

- **Electron**：桌面应用壳
- **React**：界面层
- **TypeScript**：主开发语言
- **Node.js fs/path**：本地文件夹创建与路径处理
- **Electron shell**：打开外部资源管理器
- **本地 JSON 或轻量持久化文件**：先保存最小数据

说明：

由于当前目标是快速验证产品交互，不需要一开始就上完整数据库。最小 Demo 可以先把数据存成一个本地 JSON 文件；等后续功能清晰后，再升级到 SQLite。

---

## 6. 核心产品结构

### 6.1 虚拟层级导航

应用内看到的结构不是磁盘目录，而是产品定义好的导航层级：

```text
Workspace
  └─ Courses
       └─ Course A
            └─ Items
                 └─ Assignment 1
                 └─ Assignment 2
```

用户交互方式不是左侧树状展开，而是：

- 点击进入下一层
- 点击返回上一层

更接近 Finder 或 macOS 文件夹式导航，而不是 IDE 侧边树结构。

### 6.2 Item 详情页结构

进入某个 Item 后，不再继续往下显示层级，而是进入一个详情页面。

页面核心区域：

#### 顶部
- Item 名称
- 返回按钮
- `Package` 按钮

#### 主体
- `Pipeline` 面板

#### Pipeline 未来可拆分的子块
- Information
- Material Links
- Submission Window
- Notes

最小 Demo 阶段先不要求全部结构化，只要能显示一个可编辑的大面板即可。

---

## 7. 数据模型设计

### 7.1 最小数据模型

建议最小 Demo 先维护以下概念：

#### Workspace

```ts
type Workspace = {
  courses: Course[]
}
```

#### Course

```ts
type Course = {
  id: string
  name: string
  items: Item[]
}
```

#### Item

```ts
type Item = {
  id: string
  name: string
  pipelineText: string
  packagePath?: string
}
```

#### 字段说明

- `id`：唯一标识
- `name`：显示名称
- `pipelineText`：当前最小版本的 Pipeline 内容
- `packagePath`：该 Item 对应的真实本地文件夹路径

### 7.2 后续可扩展结构

未来可以把 `pipelineText` 拆为结构化字段：

```ts
type PipelineData = {
  information?: string
  materialLinks?: string
  submissionWindow?: string
  dueDate?: string
  submissionLink?: string
  notes?: string
}
```

但最小 Demo 阶段不必复杂化。

---

## 8. Package 文件夹策略

### 8.1 设计原则

每个 Item 对应一个真实本地文件夹。

但这个文件夹不是用户手动先选出来的，而是应用自己管理：

- 第一次点击 `Package` 时自动创建
- 后续固定复用

### 8.2 推荐路径策略

建议所有 package folder 统一放在应用约定的根目录下，例如：

```text
%USERPROFILE%/Documents/CourseMasterWorkspace/
  └─ Course A/
       └─ Assignment 1/
```

最小 Demo 阶段可以采用简单规则：

- 一个固定 workspace 根目录
- 下面按 `courseName/itemName` 建文件夹

也可以用更稳定的形式：

```text
CourseMasterWorkspace/
  └─ <course-id>/
       └─ <item-id>/
```

UI 中显示名字，磁盘上用 id 保证唯一性。

### 8.3 Package 按钮行为

点击 `Package` 时执行：

1. 查找该 Item 是否已有 `packagePath`
2. 如果没有：
   - 计算默认路径
   - 自动创建目录
   - 写回 Item 数据
3. 调用系统资源管理器打开该目录

因此：

- 第一次点击 = “创建并打开”
- 后续点击 = “直接打开”

---

## 9. Pipeline 设计

### 9.1 最小版本目标

Pipeline 先实现为一个：

- 美观的面板
- 支持编辑文本
- 支持保存
- 下次重新打开仍能看到上次写的内容

### 9.2 最小交互

- 打开 Item 时加载内容
- 输入文字
- 自动保存或点击保存
- 切换页面后内容不丢失

### 9.3 后续增强方向

之后可继续升级为：

- 分块编辑
- 可插入链接字段
- due date 专门字段
- submission link 专门字段
- 多 section 卡片式 UI

---

## 10. 页面结构设计

### 10.1 页面流转

最小 Demo 建议采用单窗口、多页面状态切换：

- Workspace Page
- Courses Page
- Items Page
- Item Detail Page

通过 React 状态切换页面，而不是多窗口。

### 10.2 界面示意

#### Workspace 页面

```text
Workspace

[ Courses ]
```

#### Courses 页面

```text
< Back
Courses

[ Course A ]
[ Course B ]
```

#### Items 页面

```text
< Back
Course A

[ Assignment 1 ]
[ Assignment 2 ]
```

#### Item Detail 页面

```text
< Back                     [ Package ]
Assignment 1

-----------------------------
Pipeline
-----------------------------
[ 可编辑内容区域 ]
```

---

## 11. 核心模块设计

### 11.1 导航模块

职责：

- 管理当前所在页面
- 支持点击进入下一层
- 支持点击返回上一层

最小 Demo 不需要复杂路由系统，可以用 React state 控制。

### 11.2 数据读取与保存模块

职责：

- 加载 workspace 数据
- 保存课程、item、pipeline 内容
- 更新 packagePath

最小 Demo 可先使用本地 JSON 文件，例如：

```text
app-data.json
```

内容示意：

```json
{
  "courses": [
    {
      "id": "course-1",
      "name": "Course A",
      "items": [
        {
          "id": "item-1",
          "name": "Assignment 1",
          "pipelineText": "Write your notes here",
          "packagePath": "%USERPROFILE%/Documents/CourseMasterWorkspace/course-1/item-1"
        }
      ]
    }
  ]
}
```

### 11.3 Package 管理模块

职责：

- 创建文件夹
- 校验文件夹是否存在
- 打开资源管理器

需要用到：

- `fs.mkdir`
- `fs.existsSync`
- `path.join`
- Electron 的 `shell.openPath()` 或等效打开方式

### 11.4 Pipeline 编辑模块

职责：

- 显示文本内容
- 接收用户编辑
- 保存到本地数据文件

最小版可以先用：

- 文本区域 textarea
- 保存按钮或自动保存

---

## 12. IPC 设计

前端不能直接碰文件系统，仍然应通过 Electron 主进程暴露受控 API。

建议在 preload 中暴露：

```ts
window.appBridge = {
  loadWorkspace: () => Promise<Workspace>,
  savePipeline: (itemId: string, text: string) => Promise<void>,
  openPackage: (courseId: string, itemId: string) => Promise<string>
}
```

### 接口说明

#### `loadWorkspace()`
加载整个虚拟导航数据

#### `savePipeline(itemId, text)`
保存某个 Item 的 pipeline 内容

#### `openPackage(courseId, itemId)`
- 确保 package folder 存在
- 自动创建（如果需要）
- 打开它
- 返回最终路径

---

## 13. 最小 Demo 的页面行为规则

### 13.1 Workspace 页面

- 点击 `Courses`
- 进入课程列表

### 13.2 Courses 页面

- 点击某个课程
- 进入该课程下的 Items 页面
- 支持返回

### 13.3 Items 页面

- 点击某个 Item
- 进入 Item Detail 页面
- 支持返回

### 13.4 Item Detail 页面

- 显示 Item 名称
- 显示 Pipeline 面板
- 显示 Package 按钮
- 点击 Package 时创建并或打开对应真实文件夹
- 支持返回 Items 页面

---

## 14. 错误处理

最小 Demo 需要处理以下情况：

### 14.1 Package 文件夹创建失败
- 提示用户创建失败
- 不让界面静默失败

### 14.2 打开文件夹失败
- 提示用户无法打开资源管理器

### 14.3 Pipeline 保存失败
- 提示保存失败
- 允许重试

### 14.4 本地数据文件损坏
- 提示初始化失败
- 可回退到默认示例数据

---

## 15. 最小实现清单

开发完成最小 Demo，至少应具备：

### Electron 层
- 创建主窗口
- preload 注入 appBridge
- 本地 JSON 数据读写
- Package 文件夹自动创建
- 打开系统资源管理器

### React 层
- Workspace 页面
- Courses 页面
- Items 页面
- Item Detail 页面
- Pipeline 编辑区域
- Back 导航
- Package 按钮

### 数据层
- 示例课程数据
- Item 与 packagePath 的绑定
- Pipeline 内容持久化

---

## 16. 新的里程碑拆分

### Milestone 1：应用壳启动

目标：

- 初始化 Electron + React + TypeScript
- 能弹出桌面窗口

验收标准：

- 应用能启动
- 页面显示基础内容

### Milestone 2：虚拟导航骨架

目标：

- 搭出 Workspace -> Courses -> Items 的导航结构
- 支持点击进入和点击返回

验收标准：

- 用户可从 Workspace 进入 Courses
- 可从 Courses 进入 Items
- 可返回上一层

### Milestone 3：Item 详情页

目标：

- 点击某个 Item 后进入详情页
- 页面展示 Pipeline 区块和 Package 按钮

验收标准：

- 能进入 Item 页面
- 页面中可见 Pipeline 与 Package

### Milestone 4：Pipeline 可编辑与保存

目标：

- Pipeline 支持输入文本
- 点开后，左侧界面卡片叫做Pipeline，卡片内部从上到小分成几栏，
Due Date:
Submission Link:
Others:
其中每一行都是自适应的，过长了或者按回车可以自动拓展新的一行，按esc可以退出

- 再往下是一个新的卡片，命名为Package，卡片
Materials Links: 这里一样和上面一样，是一个可输入文本的输入框，自适应高度，按回车可以拓展新的一行，按esc可以退出
Files:对应一个资源管理器里的真实文件夹，点击时直接弹出资源管理器内的文件夹，不点击时抓取前5个文件的名字竖向显示在这里，比如
Files:
file1
file2
file3

最后总体的结构应该是：
用户刚创建一个新的item时，点进来的界面为

Pipeline
Due Date:
(可输入文本框)
Submission Link:
(可输入文本框)
Others:
(可输入文本框)

Package
Material Links:
(可输入文本框)
Files:
(空)

用户点开Files并在里面装入真实文件后，Package部分变成
Package
Material Links:
(可输入文本框)
Files:
file1
file2
file3
file4
file5
...


### Milestone 6：打包为桌面应用

目标：

- 打包成 Windows 本地应用

验收标准：

- 可执行应用能正常启动
- Package 打开行为符合预期


