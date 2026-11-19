# @raina/app

完整的 TanStack Start + Nitro 应用；单一进程提供 React 页面、服务端函数与业务 API。

## 代码结构

- `src/routes/`：文件路由、SSR 页面和原生 Start 服务端路由；`routeTree.gen.ts` 自动生成。
- `src/server/`：认证、参数化 MySQL 查询、Redis 生命周期与锁、会话、上传、OpenAI SDK 和 RAG。
- `plugins/runtime.ts`：Nitro 启动时连接 MySQL / Redis，关闭时释放连接。
- `src/components/ui/`：shadcn `base-nova` registry 组件，使用 `@base-ui/react`，配置见 `components.json`。
- `src/api/`：浏览器 API 客户端和 SSE 解码器。
- `scripts/setup-db.ts`：创建数据库及初始表结构。
- `public/tarot/`：78 张牌面及卡背。

## 业务 API

| 路径                       | 方法                 | 用途                                      |
| -------------------------- | -------------------- | ----------------------------------------- |
| `/api/auth/register`       | POST                 | 邮箱、密码注册并设置 Cookie               |
| `/api/auth/login`          | POST                 | 邮箱、密码登录并设置 Cookie               |
| `/api/auth/logout`         | POST                 | 删除 Cookie                               |
| `/api/sessions`            | GET                  | 当前用户会话                              |
| `/api/sessions/:id`        | GET / PATCH / DELETE | 历史、重命名、级联删除                    |
| `/api/chat`                | POST                 | 新建或继续会话；`stream` 选择 SSE 或 JSON |
| `/api/documents`           | GET / POST           | 文档列表、上传                            |
| `/api/documents/:filename` | DELETE               | 删除当前用户文档                          |
| `/api/tarot/daily`         | POST                 | 每日运势解读                              |

API 使用 JSON `{ code, message, ... }` 响应和对应 HTTP 状态码。`/api/chat` 接收 `{ sessionId?, question, model: "openai" | "openai-rag", stream }`。SSE 数据是 JSON `session`、`chunk`、`done` 事件，模型失败使用 `event: error`。只有完整生成并持久化成功后才发送 `done`；断开连接会取消模型请求并释放锁。

## 状态、认证与持久化

每个 Router 实例使用独立 QueryClient。聊天历史与乐观／流式消息使用同一缓存，应用 Context 保存选中会话及发送状态。数据库是消息历史的唯一持久来源，无需启动时加载所有用户的历史。Markdown 禁用原始 HTML。

密码采用随机盐 scrypt；JWT 只存入 HttpOnly、SameSite=Lax Cookie。SSR 和每个受保护 API 都验证 JWT 与数据库用户，所有会话操作都校验归属。变更接口拒绝不同 Origin 的请求。Redis 的会话锁阻止跨进程并发写入；`REDIS_ENABLED=false` 时只支持单进程锁。

上传只接受 UTF-8 `.md` / `.txt`，单文件最多 8 MiB，每人最多 100 个文件；使用用户 UUID 目录与内容哈希文件名。聊天使用 Yukino 的 `ds-openai` 配置；RAG 通过 `ali-openai` 调用 `qwen3.7-text-embedding-flash` 并使用余弦相似度检索。嵌入按最多 20 个片段分批请求，Redis 缓存按数据库、用户、嵌入模型、端点和文档内容隔离；文件变更后使用新缓存键。一次检索最多处理 16 MiB / 2048 个片段，模型请求总超时为 120 秒。

配置、运行与测试步骤见根目录 README。参考：[TanStack Start 服务端路由](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes)、[Nitro 生命周期](https://nitro.build/docs/plugins)、[OpenAI SDK](https://github.com/openai/openai-node)、[阿里云嵌入接口](https://help.aliyun.com/en/model-studio/embedding-interfaces-compatible-with-openai)。
