# Raina

Raina 是一个以塔罗主题为核心的 AI Web 应用。

它不是一个“只有聊天框”的大模型 Demo，而是把下面几类能力组合在一起：

- 登录注册与鉴权
- AI 流式聊天
- 基于本地文档的 RAG 问答
- 今日运势生成
- 塔罗牌阵抽取与解读
- 塔罗图鉴浏览
- 中英文 i18n
- 前后端严格类型校验

这个仓库是一个 pnpm workspace Monorepo，包含两个子项目：

- `app`: Vue 3 前端
- `server`: NestJS 后端

如果你是 0 基础同学，可以把这个项目当作一个“完整 AI 产品原型”来学习。它比单独学 Vue、Nest、LangChain 更有上下文，因为你能看到一个真实项目是怎样把前端、后端、数据库、模型服务、文件上传、流式接口和国际化连成一条链路的。

## 1. 项目亮点

- 前端使用 Vue 3 + Vite + Pinia + Vue Router + Tailwind CSS + DaisyUI
- 前端接入 vue-i18n，实现中英文切换
- 前端聊天区域使用 `@tanstack/vue-virtual` 做虚拟列表，适合长对话场景
- 前端 API 层使用 Zod 校验服务端返回，避免“接口明明报错但前端悄悄吃掉”的问题
- 后端使用 NestJS + Knex + MySQL，自动初始化表结构
- 后端使用 JWT 鉴权，并要求核心页面必须登录后访问
- 后端提供普通接口 + SSE 流式接口
- 后端接入 LangChain + Ollama，支持本地模型调用
- 后端支持上传文档并构建内存向量检索，实现 RAG
- 前后端都使用 TypeScript、Zod、ESLint、Prettier
- UI 不再使用内联 SVG，而是统一改为 `lucide-vue-next`

## 2. 项目结构

```text
raina/
├─ app/                    # Vue 3 前端
│  ├─ src/
│  │  ├─ api/              # 前端 API 封装与 Zod 响应校验
│  │  ├─ components/       # 顶部栏、侧边栏、弹窗、消息列表、toast 等
│  │  ├─ i18n/             # 中英文词条与语言切换逻辑
│  │  ├─ router/           # 路由与登录守卫
│  │  ├─ stores/           # Pinia 状态管理
│  │  ├─ views/            # 页面级组件
│  │  └─ resources/        # 塔罗牌静态资源
│  └─ package.json
├─ server/                 # NestJS 后端
│  ├─ src/
│  │  ├─ ai/               # AI 会话、流式响应、模型工厂
│  │  ├─ auth/             # JWT 鉴权守卫
│  │  ├─ bootstrap/        # 启动时加载历史会话
│  │  ├─ code/             # 业务状态码与 message 映射
│  │  ├─ config/           # 环境变量配置
│  │  ├─ controller/       # 通用响应封装
│  │  ├─ dao/              # 数据访问层
│  │  ├─ db/               # MySQL / Redis / 缓存初始化
│  │  ├─ file/             # 文件上传、文件列表、文件删除
│  │  ├─ i18n/             # 后端 locale 检测
│  │  ├─ rag/              # 文档切分、Embedding、检索
│  │  ├─ service/          # 用户、会话、文件服务
│  │  └─ utils/            # JWT、hash、消息转换等工具
│  └─ package.json
├─ package.json            # Monorepo 根脚本
└─ pnpm-workspace.yaml
```

## 3. 技术栈总览

## 前端 app

- Vue 3
- Vite
- TypeScript
- Pinia
- Vue Router
- vue-i18n
- @tanstack/vue-query
- @tanstack/vue-virtual
- Tailwind CSS 4
- DaisyUI
- lucide-vue-next
- marked
- Zod

## 后端 server

- NestJS 11
- TypeScript
- Knex
- MySQL 8
- Redis
- LRU Cache
- JWT
- Zod
- LangChain
- Ollama
- MemoryVectorStore
- SSE

## 工程化

- pnpm workspace
- ESLint
- Prettier
- strict TypeScript

## 4. 核心功能说明

## 4.1 登录与注册

前端提供登录页和注册页，用户登录成功后会把 token 存到 `localStorage`。

路由守卫会检查：

- 未登录时访问聊天页或图鉴页，自动跳转到登录页
- 已登录时访问登录页或注册页，自动回到首页

相关代码：

- `app/src/views/LoginView.vue`
- `app/src/views/RegisterView.vue`
- `app/src/stores/auth.ts`
- `app/src/router/index.ts`

## 4.2 AI 聊天

聊天页支持：

- 普通多轮问答
- 流式输出
- 切换模型模式
- 与塔罗牌抽牌结果联合提问

前端会把消息流拆成两种形态：

- 新建会话并开始流式对话
- 已有会话继续流式对话

后端用 SSE 把大模型输出按 chunk 推回前端。

相关代码：

- `app/src/views/ChatView.vue`
- `app/src/stores/chat.ts`
- `app/src/api/index.ts`
- `server/src/ai/ai.controller.ts`
- `server/src/service/session.ts`

## 4.3 会话持久化

用户的聊天会话会保存到 MySQL：

- `sessions` 表保存会话元数据
- `messages` 表保存聊天内容

后端启动时还会把历史消息重新 hydrate 回内存中的 AI Agent，保证重启服务后会话上下文仍然可继续使用。

相关代码：

- `server/src/db/mysql.ts`
- `server/src/dao/session.ts`
- `server/src/dao/message.ts`
- `server/src/bootstrap/load-history.ts`
- `server/src/ai/manager.ts`

## 4.4 文件上传与 RAG

项目支持用户上传文档到后端。

后端会：

- 把文件按用户目录保存
- 读取文档内容
- 用 `RecursiveCharacterTextSplitter` 做切分
- 用 `OllamaEmbeddings` 生成向量
- 用 `MemoryVectorStore` 做相似度检索

这样在 RAG 模式下，模型回答时会参考用户文档内容。

相关代码：

- `server/src/file/file.controller.ts`
- `server/src/service/file.ts`
- `server/src/rag/index.ts`
- `server/src/ai/model.ts`

## 4.5 今日运势

今日运势不是写死文案，而是：

- 先随机抽一张牌
- 再把牌面信息提交给后端
- 后端调用 Ollama 生成简短解读

如果模型服务不可用，后端会返回结构化业务错误，而不是直接让前端收到一个不透明的 500。

相关代码：

- `app/src/components/FortuneModal.vue`
- `server/src/ai/ai.controller.ts`

## 4.6 塔罗牌阵与图鉴

前端内置了 Rider-Waite Tarot 牌组资源，支持：

- 单张解读
- 时间流牌阵
- 人际关系牌阵
- 十字牌阵
- 图鉴浏览
- 按套牌/关键词搜索

相关代码：

- `app/src/components/ToolsModal.vue`
- `app/src/views/ExploreView.vue`
- `app/src/stores/tarot.ts`
- `app/src/resources/cards.json`

## 4.7 国际化 i18n

项目支持中英文切换。

前端：

- 通过 `vue-i18n` 管理文案
- 用户语言偏好保存在 `localStorage`
- 登录、注册、聊天、图鉴、弹窗、toast 等都已接入 i18n

后端：

- 读取 `Accept-Language`
- 返回本地化 `message`
- 部分 AI 提示词根据语言切换

相关代码：

- `app/src/i18n/`
- `server/src/i18n/index.ts`
- `server/src/code/index.ts`

## 4.8 用户体验细节

这个项目虽然是 AI 原型，但做了不少“产品感”细节：

- 顶部导航与主题切换
- 登录/注册/退出的 toast 反馈
- 退出登录确认弹窗
- 长对话虚拟列表
- 工具卡片、图鉴、运势弹窗
- 主页面与鉴权页面分离

## 5. 前端技术点详解

## 5.1 状态管理

Pinia 按领域拆分 store：

- `auth.ts`: token 登录态
- `chat.ts`: 会话列表、当前会话、发送消息、流式处理
- `tarot.ts`: 牌组数据与抽牌逻辑
- `ui.ts`: 各类弹窗开关
- `toast.ts`: 全局 toast

对 0 基础同学来说，可以重点先读 `chat.ts`，因为它串起了：

- API 请求
- 会话创建
- 流式更新
- 消息追加
- 错误回退

## 5.2 API 层设计

前端 API 层统一放在 `app/src/api/index.ts`，特点是：

- 统一带 `Authorization`
- 统一带 `Accept-Language`
- 统一做 Zod 响应校验
- 普通接口和 SSE 接口分开封装

这比“在组件里直接 fetch”更适合真实项目。

## 5.3 虚拟列表

聊天消息很多时，如果全部真实渲染，性能会下降。

项目使用 `@tanstack/vue-virtual` 实现虚拟列表，只渲染视口附近消息，提升大对话场景的滚动性能。

相关代码：

- `app/src/components/VirtualMessageList.vue`

## 5.4 UI 技术方案

前端样式由两层组成：

- Tailwind CSS 负责原子类布局
- DaisyUI 负责按钮、弹窗、表单、alert 等基础视觉组件

这套方案适合中小型产品原型，开发效率高。

## 6. 后端技术点详解

## 6.1 为什么使用 NestJS

NestJS 适合做结构清晰的中大型 Node.js 后端，因为它天然鼓励你按模块组织代码：

- Controller 处理 HTTP 请求
- Service 处理业务逻辑
- DAO 处理数据库访问
- Guard 处理鉴权

对学习者来说，它比把所有逻辑堆进一个 `index.ts` 更容易维护。

## 6.2 统一接口前缀

后端启动时通过：

```ts
app.setGlobalPrefix("api/v1");
```

统一所有接口前缀，前端再通过 Vite 代理把 `/api/*` 转发到 `/api/v1/*`。

这样前后端联调会更清晰，也便于以后继续迭代版本。

## 6.3 鉴权机制

后端使用 JWT。

基本流程：

1. 用户登录/注册成功
2. 服务端生成 token
3. 前端后续请求通过 `Authorization: Bearer <token>` 传递
4. `AuthGuard` 解析 token，校验用户身份

相关代码：

- `server/src/auth/auth.guard.ts`
- `server/src/utils/jwt.ts`
- `server/src/user/user.controller.ts`

## 6.4 MySQL 自动建表

后端启动时会自动检查并创建三张核心表：

- `users`
- `sessions`
- `messages`

对学习者来说，这一点很友好，因为你不需要先写一堆 SQL migration 才能启动项目。

相关代码：

- `server/src/db/mysql.ts`

## 6.5 Redis 与缓存

项目同时支持：

- Redis
- 本地 LRU Cache

如果 Redis 没开，也不会导致整个应用无法运行。

这体现了一个真实项目常见的设计思想：

- 核心功能优先可用
- 增强能力按环境可选开启

相关代码：

- `server/src/db/cache.ts`
- `server/src/db/redis.ts`

## 6.6 SSE 流式输出

后端没有用 WebSocket，而是使用 SSE：

- 协议简单
- 适合“服务端持续推文本片段”的聊天场景
- 前端解析成本更低

相关代码：

- `server/src/ai/ai.controller.ts`
- `app/src/api/index.ts`

## 6.7 Zod 参数校验

后端接口层广泛使用 Zod 校验请求体，比如：

- 会话 ID
- 问题内容
- 模型类型
- 重命名标题
- 删除文件名

优点是：

- 参数错误能尽早返回
- 类型与运行时校验统一
- 比手写 `if (!body.xxx)` 更健壮

## 7. 运行项目

## 7.1 环境准备

推荐本地环境：

- Node.js 20+
- pnpm 10+
- MySQL 8+
- Ollama

可选：

- Redis

## 7.2 安装依赖

在仓库根目录执行：

```bash
pnpm install
```

## 7.3 初始化 MySQL

默认数据库名是 `raina`。

```bash
mysql -uroot -ppass
CREATE DATABASE raina;
```

如果你的用户名、密码、端口不同，请在 `server/.env` 中修改。

## 7.4 配置后端环境变量

复制模板：

```bash
cd server
cp .env.example .env
```

关键变量如下：

```bash
APP_NAME=raina
APP_HOST=0.0.0.0
PORT=3000

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=pass
MYSQL_DB=raina

JWT_KEY=raina
JWT_ISSUER=raina
JWT_SUBJECT=raina

AI_MODE_NAME=qwen3
AI_BASE_URL=http://localhost:11434

RAG_EMBEDDING_MODEL=nomic-embed-text
RAG_DOCS_DIR=./docs
```

## 7.5 安装并启动 Ollama

拉取模型：

```bash
ollama pull qwen3
ollama pull nomic-embed-text
```

启动服务：

```bash
ollama serve
```

如果不启动 Ollama：

- 登录注册仍然可以用
- 非模型依赖页面仍可打开
- 但聊天、RAG、今日运势等需要模型的能力会失败

## 7.6 启动前后端

在根目录执行：

```bash
pnpm dev
```

它会同时启动：

- 前端 Vite
- 后端 NestJS

默认地址：

- 前端: `http://localhost:5173`
- 后端: `http://localhost:3000`

## 7.7 构建

```bash
pnpm build
```

## 8. 常用脚本

根目录：

```bash
pnpm dev
pnpm lint
pnpm format
pnpm build
pnpm docker
pnpm ollama
```

前端：

```bash
cd app
pnpm dev
pnpm build
pnpm lint
pnpm format
```

后端：

```bash
cd server
pnpm start:dev
pnpm start:prod
pnpm lint
pnpm format
```

## 9. 0 基础学习路线

如果你是第一次接触这类项目，建议按下面顺序阅读：

### 第 1 阶段：先把项目跑起来

目标：

- 看到登录页
- 能注册账号
- 能进入聊天页
- 能打开图鉴和运势弹窗

建议阅读：

- `package.json`
- `app/src/main.ts`
- `server/src/main.ts`
- `app/vite.config.ts`

### 第 2 阶段：理解前端页面是怎么组织的

目标：

- 理解登录页、聊天页、图鉴页怎么切换
- 理解弹窗和顶部栏如何协作

建议阅读：

- `app/src/App.vue`
- `app/src/router/index.ts`
- `app/src/views/LoginView.vue`
- `app/src/views/ChatView.vue`
- `app/src/views/ExploreView.vue`

### 第 3 阶段：理解状态管理

目标：

- 看懂 token、会话、消息、抽牌状态分别在哪管理

建议阅读：

- `app/src/stores/auth.ts`
- `app/src/stores/chat.ts`
- `app/src/stores/ui.ts`
- `app/src/stores/tarot.ts`

### 第 4 阶段：理解接口通信

目标：

- 看懂前端怎么请求后端
- 看懂后端怎么做参数校验和统一返回

建议阅读：

- `app/src/api/index.ts`
- `server/src/controller/response.ts`
- `server/src/code/index.ts`
- `server/src/ai/ai.controller.ts`
- `server/src/user/user.controller.ts`

### 第 5 阶段：理解 AI 与 RAG

目标：

- 看懂聊天为什么能流式输出
- 看懂文件上传后为什么能做“基于文档问答”

建议阅读：

- `server/src/service/session.ts`
- `server/src/ai/model.ts`
- `server/src/rag/index.ts`
- `server/src/file/file.controller.ts`

### 第 6 阶段：理解工程化

目标：

- 学会一个真实项目如何做类型、格式化、国际化和可维护目录结构

建议阅读：

- `app/eslint.config.ts`
- `server/eslint.config.mjs`
- `app/src/i18n/`
- `server/src/i18n/index.ts`

## 10. 常见问题

## 10.1 前端提示代理失败

如果 Vite 控制台出现 `http proxy error`，通常不是代理规则错了，而是后端没成功启动。

优先检查：

- MySQL 是否可连接
- 后端 `.env` 是否存在
- `PORT` 是否被占用

## 10.2 今日运势或聊天返回模型错误

优先检查：

- `ollama serve` 是否启动
- `AI_BASE_URL` 是否正确
- `qwen3` 是否已拉取
- `nomic-embed-text` 是否已拉取

## 10.3 登录后仍然提示 token 无效

可能原因：

- 你修改过 `JWT_KEY`
- 浏览器里残留了旧 token

处理方式：

- 清空浏览器 localStorage 中的 `token`
- 重新登录

## 10.4 历史消息加载时报类型错误

本项目已经兼容了 MySQL `tinyint(1)` 可能返回 `0/1` 的情况。

如果你自己扩展了表结构，建议继续保持：

- 后端先做数据归一化
- 前端再做 Zod 兼容校验

## 11. 这个项目适合写进简历吗

答案是适合，前提是你要能讲清楚“自己解决了什么问题”，而不只是说“做了一个 AI 项目”。

相比“调用一个大模型接口，做个聊天框”的项目，Raina 的优势在于：

- 有完整前后端
- 有鉴权
- 有会话持久化
- 有流式传输
- 有文件上传和 RAG
- 有国际化
- 有工程化约束
- 有明确的产品主题，不是通用套壳

## 12. 简历项目描述示例

你可以把它写成下面这种风格。

## 简历版描述 1

Raina 是一个基于 Vue 3 + NestJS + LangChain + Ollama 的塔罗主题 AI 应用，支持 JWT 登录鉴权、流式聊天、会话持久化、文件上传与 RAG 检索、今日运势生成、塔罗牌阵抽取、图鉴浏览和中英文国际化。项目采用 pnpm workspace 管理前后端，前端使用 Zod 校验接口响应与虚拟列表优化长对话性能，后端使用 Knex + MySQL 管理用户/会话/消息数据，并通过 SSE 实现模型流式输出。

## 简历版描述 2

- 负责基于 Vue 3、Pinia、Vue Router、Tailwind CSS 构建 AI 产品前端，完成登录注册、聊天页、图鉴页、塔罗工具弹窗、全局 toast 和国际化切换
- 负责基于 NestJS、Knex、MySQL、JWT 搭建后端服务，实现用户鉴权、会话持久化、消息存储、文件上传与删除、统一错误码和多语言响应
- 基于 LangChain 与 Ollama 实现流式聊天和本地 RAG 能力，支持文档切分、Embedding、向量检索与上下文增强问答
- 通过 `@tanstack/vue-virtual` 优化长对话渲染性能，通过 Zod 和 TypeScript 收敛前后端契约，提升系统稳定性与可维护性

## 面试时可以强调的技术关键词

- AI 产品原型
- Vue 3 工程化
- NestJS 架构化后端
- JWT 鉴权
- SSE 流式传输
- RAG
- LangChain
- Ollama
- MySQL
- Redis
- Zod
- i18n
- Monorepo

## 13. 面试表达

如果面试官继续追问“为什么这样设计”“你具体解决了什么问题”，可以按下面的结构来回答：

- 设计原因
- 解决的问题
- 带来的收益

这样表达会比单纯说“我用了 Vue 3、NestJS、LangChain”更有说服力。

## 13.1 为什么前端要做 API 层统一封装

设计原因：

- 不希望每个页面都自己写 `fetch`
- 不希望 token、语言头、错误处理散落在各个组件里
- 需要把接口返回和运行时类型校验统一起来

解决的问题：

- 避免页面逻辑和请求逻辑耦合
- 避免后端字段变化后前端静默出错
- 避免出现一部分请求带 token，一部分请求忘记带 token 的问题

带来的收益：

- API 调用方式统一
- 登录、聊天、文件上传、会话历史都能复用同一套请求规则
- 接口异常更容易排查，前端稳定性更高

你在面试里可以这样说：

“我把前端接口统一收敛到 `app/src/api/index.ts`，把鉴权头、国际化请求头、普通 JSON 接口和 SSE 流式接口都封装起来，并用 Zod 对响应做运行时校验。这样做的目的是把接口契约管理前置，减少组件里分散的请求逻辑，也能更早发现服务端字段类型不一致的问题。”

## 13.2 为什么聊天要用 SSE，而不是普通轮询

设计原因：

- AI 聊天最核心的体验是边生成边展示
- 普通轮询会让用户感觉“卡住了”
- WebSocket 当然也可以做，但这个场景用 SSE 更轻量

解决的问题：

- 用户等待完整回答返回的时间过长
- 长文本输出时体验不自然
- 聊天系统难以呈现“实时生成”的产品感

带来的收益：

- 可以逐块渲染模型输出
- 用户更早看到反馈
- 服务端实现简单，前端解析成本也低

你在面试里可以这样说：

“聊天场景里我优先选择了 SSE，因为它很适合服务端持续推送文本片段。相对于轮询，它能显著改善首字返回体验；相对于 WebSocket，这个项目的实现复杂度更低，更适合 AI 输出流的单向传输场景。”

## 13.3 为什么会话要同时做内存态和数据库持久化

设计原因：

- 模型多轮对话依赖上下文
- 只放内存里，服务一重启会话就丢
- 只放数据库里，每次都重新拼上下文，响应和代码复杂度都会上升

解决的问题：

- 服务重启导致用户历史会话丢失
- 长对话场景下上下文恢复困难
- 单纯依赖数据库读取会增加每次请求的恢复成本

带来的收益：

- 用户能看到历史会话
- 服务启动时可以从数据库把消息重新 hydrate 到内存 Agent
- 保证体验连续性，同时保持运行时响应效率

你在面试里可以这样说：

“我把会话拆成了两层：数据库负责持久化，内存中的 Agent 负责运行时上下文。这样既能保证服务重启后会话还能恢复，又不会把所有上下文拼接成本都压到每次请求上。”

## 13.4 为什么要做 RAG，而不是只让模型自由回答

设计原因：

- 通用模型对用户私有文档并不了解
- 如果没有检索增强，回答很容易变成泛化内容
- 项目需要体现“从通用聊天到知识增强问答”的能力升级

解决的问题：

- 用户上传了资料，但模型回答仍然脱离资料内容
- 纯大模型回答缺少针对性
- AI 项目容易停留在“通用聊天框 Demo”层面

带来的收益：

- 支持基于用户文档回答问题
- 项目能力从聊天扩展到知识问答
- 在简历和面试里更能体现 AI 工程能力，而不只是模型调用

你在面试里可以这样说：

“我增加了文档上传和检索增强能力，后端会对文档切分、生成 embedding，并在问答前检索相关片段作为上下文。这样模型回答就不是泛泛而谈，而是能够围绕用户自己的资料展开。”

## 13.5 为什么前后端都要接入 Zod

设计原因：

- TypeScript 只能约束编译期，不能保证运行时输入一定合法
- 前端和后端都可能接收到不可信数据
- 项目里既有表单输入，也有接口返回，非常适合做运行时校验

解决的问题：

- 接口参数错误时没有统一拦截
- 后端字段类型漂移导致前端运行时报错
- 调试时只能靠猜字段格式

带来的收益：

- 请求参数和响应结构都有明确边界
- 错误更早暴露
- 类型与校验逻辑统一，维护成本更低

你在面试里可以这样说：

“我没有只依赖 TypeScript 的静态类型，而是让前后端都接入 Zod。后端用它校验请求参数，前端用它校验接口响应，这样能把接口契约问题尽量拦截在边界层，而不是等到页面渲染时才爆炸。”

## 13.6 为什么前端要用虚拟列表

设计原因：

- AI 聊天会天然累积大量消息
- 如果所有消息都真实渲染，滚动和更新性能会明显下降
- 这个问题在短对话里不明显，但真实使用时一定会出现

解决的问题：

- 长会话滚动卡顿
- 页面节点过多导致渲染压力增大
- 消息持续流式更新时性能波动

带来的收益：

- 长对话体验更稳定
- 页面渲染压力更可控
- 能体现你对性能问题有预判，而不是只做功能堆叠

你在面试里可以这样说：

“聊天类应用的性能瓶颈往往不在首屏，而在长时间使用后的消息堆积，所以我用 `@tanstack/vue-virtual` 做了消息虚拟列表，把渲染数量控制在视口附近，提升长对话场景下的滚动和更新性能。”

## 13.7 为什么做国际化，而不是最后再补

设计原因：

- 国际化不是简单替换文案，它会影响页面结构、接口 message、用户提示和语言状态管理
- 如果项目已经成型再做 i18n，改动成本会更高
- 这个项目定位是完整产品原型，不是只服务单一语言环境

解决的问题：

- 文案硬编码难以维护
- 登录提示、错误信息、按钮文案无法统一切换
- 后端返回 message 和前端 UI 文案语言不一致

带来的收益：

- 中英文切换体验完整
- 文案管理更集中
- 项目在“产品完整度”上更接近真实业务系统

你在面试里可以这样说：

“我把 i18n 当成产品基础能力而不是最后装饰。前端通过 `vue-i18n` 管理页面文案，后端通过 `Accept-Language` 返回本地化 message，这样用户切换语言后，页面提示和接口返回能保持一致。”

## 13.8 为什么这个项目有资格作为核心项目

设计原因：

- 核心项目不能只证明“我会调用接口”
- 它应该证明你具备产品实现、工程组织和问题排查能力

解决的问题：

- 普通 Demo 项目难以体现工程复杂度
- 面试官很难从一个纯静态项目判断你的真实能力

带来的收益：

- 这个项目同时覆盖前端、后端、AI、数据库、鉴权、流式传输、RAG、国际化和工程化
- 既能展示实现能力，也能展示设计取舍能力
- 适合在面试中展开讲述，延展空间大

你在面试里可以这样总结：

“这个项目不是简单把大模型接口接到网页上，而是把登录鉴权、会话持久化、流式传输、文档检索、国际化和工程化约束整合成了一个完整产品原型。我想展示的不只是功能完成度，更是我对系统设计、边界处理和产品体验的理解。”

## 14. 高频面试问答

这一节不是继续堆技术名词，而是把真实面试里最常见的追问整理成三层：

- 面试官可能怎么问
- 你应该怎么答
- 如果继续深挖可以怎么展开

你可以把这一节当成项目答辩提纲来使用。

## 14.1 这个项目和普通 AI Demo 有什么区别

面试官可能怎么问：

- 现在很多同学都做了 AI 聊天项目，你这个项目的区别是什么？

你应该怎么答：

- 这个项目不是单纯接一个大模型接口做聊天框，而是完整覆盖了登录鉴权、会话持久化、SSE 流式传输、文件上传、RAG 检索、国际化、前后端类型约束和产品化交互
- 前端不是静态页面，而是真正围绕聊天、今日运势、牌阵、图鉴做了完整用户流
- 后端也不只是转发模型请求，而是做了用户体系、会话管理、消息落库、文档检索和统一错误码

如果继续深挖可以怎么展开：

- 说明为什么“完整产品原型”比“单接口聊天页”更能体现工程能力
- 继续展开你在鉴权、流式输出和 RAG 上做的具体设计

## 14.2 为什么选 Vue 3 + NestJS 这套组合

面试官可能怎么问：

- 你为什么前端选 Vue，后端选 NestJS？

你应该怎么答：

- 前端选 Vue 3 是因为组合式 API、Pinia、Router 和生态工具链比较适合快速搭建结构清晰的产品原型
- 后端选 NestJS 是因为它天然按模块拆分 Controller、Service、Guard、Module，适合会话、用户、文件、AI 这类边界明确的业务
- 这套组合的优点是上手效率和工程可维护性之间比较平衡

如果继续深挖可以怎么展开：

- 对比如果只用 Express/Koa 手写，随着模块增多目录和依赖边界会更难收敛
- 对比前端如果用更重的全栈方案，初期原型反而会牺牲迭代效率

## 14.3 你为什么要做登录鉴权

面试官可能怎么问：

- AI 项目为什么还要做登录？直接开放体验不是更快吗？

你应该怎么答：

- 因为这个项目不是一次性 Demo，而是面向真实用户流程的产品原型
- 只要涉及会话历史、文件上传、用户私有文档、RAG 检索，就必须把数据隔离和身份体系考虑进去
- 登录之后用户才能建立自己的会话空间，文件和问答也才能和具体用户绑定

如果继续深挖可以怎么展开：

- 继续说明 JWT 的设计和路由守卫如何配合
- 继续说明为什么文件上传、会话删除、历史查询都需要登录态保护

## 14.4 聊天为什么要做流式输出

面试官可能怎么问：

- 为什么不等模型完整返回再展示？

你应该怎么答：

- AI 产品里最关键的体验之一就是“首字返回时间”
- 如果等完整回答返回，用户会明显感觉系统卡住
- 流式输出可以更早给用户反馈，提升交互即时性，也更符合大模型产品的预期体验

如果继续深挖可以怎么展开：

- 展开说明为什么选择 SSE 而不是轮询
- 继续说明前端如何一边接收 chunk 一边更新最后一条 assistant 消息

## 14.5 会话为什么要落库

面试官可能怎么问：

- 为什么不把聊天上下文只存在内存里？

你应该怎么答：

- 只放内存最大的问题是服务重启后上下文会丢
- 用户如果刷新页面或第二次进入系统，就看不到历史记录
- 所以我把会话和消息落到 MySQL，再在服务启动时把历史数据重新恢复到运行时 Agent 中

如果继续深挖可以怎么展开：

- 可以继续说明 `sessions` 和 `messages` 两张表分别负责什么
- 可以继续解释“数据库持久化 + 内存态上下文”这两层结构为什么比单一方案更合理

## 14.6 为什么要做 RAG

面试官可能怎么问：

- 你做 RAG 的价值是什么？直接让模型回答不行吗？

你应该怎么答：

- 通用模型只知道公共知识，不知道用户自己的资料
- 一旦场景变成“基于我上传的文档回答问题”，就必须让模型先看到和问题相关的文档上下文
- 所以我做了文档上传、切分、embedding、相似度检索，再把命中的文档片段拼进 prompt

如果继续深挖可以怎么展开：

- 继续说明为什么当前选择的是 `MemoryVectorStore`
- 继续说明后续如何扩展成持久化向量库，比如 pgvector、Milvus、Qdrant

## 14.7 前后端为什么都做 Zod 校验

面试官可能怎么问：

- 既然已经有 TypeScript，为什么还要用 Zod？

你应该怎么答：

- TypeScript 只能在编译期约束类型，不能保证运行时数据一定合法
- 后端收到的请求体和前端收到的接口返回，本质上都是不可信输入
- 我让后端用 Zod 校验参数，让前端用 Zod 校验响应，这样接口契约问题能更早暴露

如果继续深挖可以怎么展开：

- 可以举你这次修复过的例子，比如 `is_user` 从 MySQL 返回 `0/1` 导致前端 Zod 报错
- 说明为什么边界层校验比到页面里才报错更容易维护

## 14.8 为什么前端还要做虚拟列表

面试官可能怎么问：

- 一个聊天项目为什么要考虑虚拟列表，是不是过度设计？

你应该怎么答：

- AI 对话天然会累积大量消息，短期看不出问题，但长会话一定会出现性能压力
- 如果所有消息都真实渲染，滚动和更新都会越来越慢
- 所以我提前用 `@tanstack/vue-virtual` 做了消息虚拟列表，这是针对聊天场景的性能设计，而不是为了炫技

如果继续深挖可以怎么展开：

- 可以说明虚拟列表对长对话滚动性能的意义
- 可以继续说明为什么这个优化比单纯做样式更能体现工程意识

## 14.9 国际化为什么值得放在这个项目里

面试官可能怎么问：

- 一个个人项目为什么还要做 i18n？

你应该怎么答：

- 因为国际化不是最后换几段文案，而是会影响页面提示、错误信息、接口 message、语言状态保存这些基础能力
- 如果项目目标是完整产品原型，那 i18n 本身就是产品能力的一部分
- 我不仅让前端文案支持中英文切换，也让后端根据 `Accept-Language` 返回本地化消息，保证体验一致

如果继续深挖可以怎么展开：

- 可以继续说明前端 `vue-i18n` 和后端 locale 检测的配合方式
- 可以继续说明国际化如何帮助项目更接近真实业务系统

## 14.10 如果让你继续迭代这个项目，你会先做什么

面试官可能怎么问：

- 如果给你一周时间继续优化，你优先做什么？

你应该怎么答：

- 第一优先级会放在向量库持久化、Docker Compose 一键启动和更完整的错误监控
- 第二优先级会做消息重新生成、文件处理进度、会话搜索和更细粒度的权限控制
- 这样能同时提升项目的可部署性、可维护性和产品完成度

如果继续深挖可以怎么展开：

- 从“工程优先”和“产品优先”两个维度分别讲
- 说明为什么你会先做基础设施，再做功能堆叠

## 15. 后续可继续扩展的方向

如果你想把它继续打磨成更强的作品集项目，可以继续加：

- 消息重新生成
- 会话搜索
- 用户资料页
- 文件解析进度条
- 向量库持久化
- 多模型切换面板
- 更精细的权限系统
- Docker Compose 一键启动
- E2E 测试

## 16. 总结

Raina 的价值不在于“用了多少新名词”，而在于它已经具备一个 AI 应用从前端交互、后端接口、数据存储、模型调用、RAG 检索到工程化约束的完整闭环。

如果你能把这个项目真正跑起来、读懂、复述清楚，再基于它做二次迭代，它完全可以作为一个有竞争力的核心项目写进简历。
