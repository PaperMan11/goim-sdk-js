# @goim/web-sdk

[goim-sdk-core](../goim-sdk-core) 的 Web（wasm）薄封装：把 wasm 暴露的回调式 `goimSdk` 桥接成 Promise API，并按业务域拆成 `auth` / `conversations` / `messages` / `users` / `groups` 五个模块。

- 基于 Go + `syscall/js` 编译出的 `goim.wasm`，浏览器内直接运行 core 的完整 IM 能力
- 本地会话/消息缓存走 IndexedDB（`idb_wrapper.js`），写入由 Go 侧负责，JS 侧只读
- 事件、日志均为宿主回调（wasm 无 stdout）
- TypeScript 严格模式，输出 `dist/` + 类型声明

## 目录结构

```
goim-sdk-js/
├── src/
│   ├── client.ts        # Goim 单例、配置、会话/连接/事件/日志
│   ├── bridge.ts        # window.goimSdk / goimIdb / Go 的全局类型声明
│   ├── loader.ts        # 注入桥脚本 → 实例化 wasm → 等待 goimSdk 注册
│   ├── events.ts        # 事件类型常量与载荷解析
│   ├── idb.ts           # IndexedDB 只读查询
│   ├── errors.ts        # GoimError / call 层错误码
│   ├── types.ts         # 与 core pkg/model 对齐的 DTO
│   └── modules/         # 业务模块（auth/conversations/messages/users/groups）
├── wasm/                # 构建产物：goim.wasm / wasm_exec.js / idb_wrapper.js / manifest.json
├── scripts/
│   ├── build-wasm.ps1   # Windows 构建 wasm
│   └── build-wasm.sh    # Linux / macOS / Git Bash 构建 wasm
└── dist/                # npm run build 产物（被 .gitignore 忽略）
```

## 环境要求

- Node.js 18+（使用 `fetch` / `WebAssembly.instantiateStreaming`）
- 构建 wasm 时需要 Go 工具链，且同级目录存在 `../goim-sdk-core`
- `scripts/build-wasm.sh` 需要 bash（Windows 可用 Git Bash）

## 安装与构建

```bash
npm install

# 编译 TypeScript → dist/
npm run build
npm run dev          # 监听模式

# 从 ../goim-sdk-core 构建 wasm 并同步到 wasm/
npm run build:wasm   # Windows（PowerShell）
bash scripts/build-wasm.sh   # Linux / macOS / Git Bash

# 一键构建（wasm + TypeScript + 产物校验）
bash scripts/build.sh                                  # Linux / macOS / Git Bash
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build.ps1   # Windows
```

`build.sh` / `build.ps1` 会依次：依赖缺失时安装 → 调用对应平台的 `build-wasm` → `npm run build` → 校验 `wasm/` 与 `dist/` 关键产物非空，最后打印 wasm 体积。

`build-wasm` 会向 `wasm/` 输出：

| 文件 | 说明 |
| --- | --- |
| `goim.wasm` | core 编译产物（约 21MB，首次加载耗时主要来自这里） |
| `wasm_exec.js` | Go 运行时胶水脚本，取自 `$GOROOT/lib/wasm` 或 `misc/wasm` |
| `idb_wrapper.js` | IndexedDB 桥，**必须先于 `wasm_exec.js` 注入** |
| `manifest.json` | 构建溯源：`source` / `commit` / `goVersion` / `wasmExec` / `wasmSize` / `builtAt` |

## 快速开始

```ts
import { Goim, GoimError, EventType, eventNameOf } from '@goim/web-sdk';

const goim = await Goim.init({
  baseURL: 'https://im.example.com/api/v1',
  endpoint: 'wss://im.example.com/ws',
  platformID: 1,
  compression: 'gzip',
  logging: { level: 'debug' },
});

// 生产环境：用服务端下发的 token 登录
await goim.loginWithToken('user001', token, expireTimeSeconds);
await goim.connect();

// 事件（name 为 Go 侧事件名，可用 eventNameOf 转换）
goim.onEvent(eventNameOf(EventType.NewMsg), (event) => {
  console.log('新消息', event.payload);
});

// 发送文本消息（单聊传 userID，群聊传 groupID）
const resp = await goim.messages.sendText(
  { sessionType: 1, userID: 'user002' },
  'hello',
);

// 本地缓存读取（需先等待 SyncFinish 事件）
const local = await goim.messages.historyLocal('c2c_user001_user002');
```

`init` 的第二个参数是加载选项：

```ts
await Goim.init(config, {
  wasmBasePath: '/wasm/',   // 默认取 SDK 目录旁的 ../wasm/
  timeoutMs: 60_000,        // 等待 goimSdk 注册的超时
});
```

部署时需把 `dist/` 与 `wasm/` 一起发布，并保证静态服务对 `.wasm` 返回 `application/wasm`（否则会降级为 arrayBuffer 实例化，仍可用但更慢）。

## 配置项（`GoimConfig`）

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `baseURL` | string | 必填 | HTTP API 基础地址（含 `/api/v1` 前缀） |
| `endpoint` | string | 必填 | WS 连接地址（`ws://` / `wss://`） |
| `platformID` | number | `1` | 默认平台 ID |
| `deviceID` | string | `''` | 设备 ID，空则 core 自动生成并持久化 |
| `sdkVersion` | string | `''` | SDK 版本号，空则用编译期版本 |
| `compression` | `'none' \| 'gzip' \| 'zlib'` | `'none'` | 压缩算法 |
| `sessionDataPath` | string | `'idb'` | wasm 下 `'idb'` 表示启用 IndexedDB；传空串则走内存存储，本地读接口将无数据 |
| `adminSecret` | string | `''` | 应用密钥，仅受信环境/本地联调用 admin bootstrap；生产请用 `loginWithToken` |
| `adminUserID` | string | `''` | 管理员账号，默认 `imAdmin` |
| `logging` | `GoimLogConfig` | 不传 | 日志配置，见下文「日志」 |

`GoimConfig` 中的 `logging` 与 core 的 `logger.Config` 字段一一对应：

```ts
interface GoimLogConfig {
  disable?: boolean;                     // 全部静默
  level?: 'debug' | 'info' | 'warn' | 'error'; // 默认 info
  format?: 'console' | 'json';
  outputPaths?: string[];                // wasm 无 stdout / 文件系统，实际无效
  development?: boolean;                 // 彩色级别 + warn 及以上堆栈
}
```

## API

### `Goim`

| 方法 | 说明 |
| --- | --- |
| `Goim.init(config, options?)` | 加载 wasm 并初始化，进程内单例，重复调用返回同一实例 |
| `platformID` / `currentUserID` | 当前平台 ID / 已登录用户 ID |
| `login(userID, platformID?)` | 本地联调用的简易登录（需 core 允许） |
| `loginWithToken(userID, token, expireTimeSeconds, platformID?)` | 终端模式登录，**生产环境使用** |
| `logout(clearData?)` | 登出，`clearData` 为 true 时清空本地数据 |
| `connect()` / `disconnect()` | 建立 / 断开 WS |
| `close()` | 断连并解绑事件回调，不终止 Go runtime（可再次 `connect`） |
| `updateToken(token, expireTimeSeconds)` | 预取模式下的 token 注入 |
| `status()` | 连接状态：0 未连接 / 1 连接中 / 2 已连接 |
| `syncState()` | 同步状态：0 未同步 / 1 同步中 / 2 已同步 / 3 同步失败 |
| `on(handler)` / `onEvent(name, handler)` | 订阅全部事件 / 指定事件，返回解绑函数 |
| `onLog(handler)` | 接管 SDK 日志输出，返回解绑函数 |
| `call(method, args?)` | 底层反射调用入口，一般用各业务模块即可 |

### 业务模块

`auth`

| 方法 | 说明 |
| --- | --- |
| `login(userID, platformID?)` | 同 `Goim.login` |
| `loginWithToken(userID, token, expireTimeSeconds, platformID?)` | 同 `Goim.loginWithToken` |
| `logout(clearData?)` | 同 `Goim.logout` |
| `parseToken(token)` | 解析 token → `{ token, userID? }` |

`messages`

| 方法 | 说明 |
| --- | --- |
| `sendText(target, text, { clientMsgID? })` | 构造并发送文本消息（contentType=101），返回 `SendMsgResp` |
| `send(msg)` | 发送现成 `MsgData`（图片 / 自定义消息自行补齐字段） |
| `historyLocal(conversationID, ownerUserID?)` | 本地 IndexedDB 历史消息，需先等待 SyncFinish |
| `pullBySeq(conversationID, begin, end, num?, order?, userID?)` | 服务端按 seq 拉取，`order` 0 升序 / 1 降序 |
| `markRead(conversationID, hasReadSeq, seqs?)` | 标记已读 |
| `revoke(conversationID, seq)` | 撤回消息 |

`conversations`

| 方法 | 说明 |
| --- | --- |
| `listLocal(ownerUserID?)` | 本地 IndexedDB 会话列表 |
| `getAll(ownerUserID?)` | HTTP 全量会话（服务端权威数据） |
| `get(conversationID, ownerUserID?)` | 单个会话详情 |

`users`

| 方法 | 说明 |
| --- | --- |
| `register(users)` | 注册用户资料（未注册用户也可调用，用于补昵称/头像） |
| `getUsersInfo(userIDs)` | 批量拉取用户资料 |

`groups`

| 方法 | 说明 |
| --- | --- |
| `getGroupsInfo(groupIDs)` | 批量拉取群资料 |

`SendTarget`：`{ sessionType, userID?, groupID? }`，单聊填 `userID`，群聊填 `groupID`（`sessionType=3`）。

## 事件

事件对象结构：

```ts
interface GoimEvent<T = unknown> {
  type: number;      // EventType 数值
  name: string;      // Go 侧事件名，如 'EventNewMsg'
  timestamp: number; // 毫秒
  payload: T;        // 具体事件载荷（Go 侧二次 JSON 解析后的对象）
}
```

`EventType` 为与 core 严格同序的数值常量（`NewMsg=1` … `ConversationCreated=53`），`EVENT_NAMES` 为数值 → 名称映射，`eventNameOf(type)` 用于取名称：

```ts
import { EventType, eventNameOf } from '@goim/web-sdk';

goim.onEvent(eventNameOf(EventType.SyncFinish), () => {
  // 此后本地缓存可读
});
```

连接 / 登录 / 同步类事件同样通过该通道推送（`EventConnect`、`EventLoginSuccess`、`EventSyncStart`、`EventSyncFinish`、`EventForceLogout` 等）。

## 日志

wasm 无 stdout，SDK 日志必须经回调输出。JS SDK 已在 `init` 前注册回调：

- 传了 `logging` 且未 `disable`：默认按级别打到 `console`（`debug` / `info` / `warn` / `error`）
- 调用 `onLog(handler)` 后：由 handler 接管，不再打印到 console
- 未传 `logging` 且未注册 handler：静默

```ts
goim.onLog((level, msg) => logger[level](`[goim] ${msg}`));
```

级别过滤在 Go 侧完成，`init` 时的 `logging.level` 即阈值。

## 错误处理

所有 Promise 失败都会抛出 `GoimError`：

```ts
import { GoimError, isGoimError, CallErrorCode } from '@goim/web-sdk';

try {
  await goim.messages.sendText(target, 'hello');
} catch (err) {
  if (isGoimError(err)) {
    console.warn(err.code, err.message); // message 为 Go 侧剥离 rpc 前缀的原始报错
  }
}
```

call 层错误码（与 core `pkg/call/error.go` 对齐）：

| 常量 | 值 | 说明 |
| --- | --- | --- |
| `CallErrorCode.Internal` | 90001 | 内部错误 |
| `CallErrorCode.NotInitialized` | 90010 | 未初始化（含 wasm 加载/超时） |
| `CallErrorCode.NotLoggedIn` | 90011 | 未登录 |
| `CallErrorCode.UnknownMethod` | 90012 | 方法不存在 |
| `CallErrorCode.InvalidArgs` | 90013 | 参数非法 |

## CI

CI 需要同时拿到 `goim-sdk-core` 与本仓库，并保持二者为**同级目录**（`build-wasm` 脚本按 `../goim-sdk-core` 定位 core）。

流水线建议拆成两个 job：

| job | 步骤 | 说明 |
| --- | --- | --- |
| `build` | `npm ci` → `tsc --noEmit` → `npm run build` | 只依赖 Node，最快，PR 必跑 |
| `wasm` | checkout core → `setup-go` → `bash scripts/build.sh` → 校验产物 | 依赖 Go 工具链，可只在 `main` 或 nightly 跑 |

`wasm` job 的产物校验要点：

- `wasm/goim.wasm` 非空（建议 > 20MB，明显偏小说明构建异常）
- `wasm/wasm_exec.js`、`wasm/idb_wrapper.js` 存在
- `wasm/manifest.json` 能解析，且 `commit` / `goVersion` / `wasmSize` 字段齐全
- 约 21MB 的 wasm 不建议入库或作为构建缓存长期保存，按需用 `actions/upload-artifact` 传递

可参考的 GitHub Actions 配置：

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx tsc -p tsconfig.json --noEmit
      - run: npm run build

  wasm:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          path: goim-all/goim-sdk-js
      - uses: actions/checkout@v4
        with:
          repository: PaperMan11/goim-sdk-core   # 私有仓库需配置 token
          path: goim-all/goim-sdk-core
      - uses: actions/setup-go@v5
        with:
          go-version-file: goim-all/goim-sdk-core/go.mod
      - name: Build wasm
        working-directory: goim-all/goim-sdk-js
        run: bash scripts/build.sh
      - name: Verify artifacts
        working-directory: goim-all/goim-sdk-js
        run: |
          test -s wasm/goim.wasm
          test -f wasm/wasm_exec.js
          test -f wasm/idb_wrapper.js
          node -e "const m=require('./wasm/manifest.json'); \
            if(!m.commit||!m.goVersion||!m.wasmSize){process.exit(1)}; \
            console.log('commit', m.commit, 'size', m.wasmSize)"
      - uses: actions/upload-artifact@v4
        with:
          name: goim-wasm
          path: goim-all/goim-sdk-js/wasm/
          retention-days: 7
```

POSIX shell 脚本在 `ubuntu-latest` 可直接执行；Windows runner 用 `npm run build:wasm` 走 PowerShell 版本。

## 实现与注意事项

- **调用通道**：业务方法均经 `goim.call` → `window.goimSdk.call` → wasm 内 `dispatcher.Call` 反射分发；`status` / `syncState` 走同步的 `syncCall`（仅限纯本地不阻塞方法，否则会与 Go 等待 JS Promise 形成死锁）。
- **单例**：`Goim.init` 返回全进程唯一实例，对应唯一的 `goimSdk` / Go runtime。`close()` 只断连解绑，不重置单例；要彻底重启需整页重载（底层 `shutdown` 会终止 Go runtime）。
- **加载顺序**：`idb_wrapper.js` 必须先于 `wasm_exec.js` 注入，否则 Go 侧 init 访问 `goimIdb` 会失败。
- **本地读旁路**：`historyLocal` / `listLocal` 通过 `idb_wrapper.js` 直读 IndexedDB，不经过 Go；其 store 结构需与 core `pkg/storage/idb_storage.go` 保持一致。
- **版本对齐**：`EventType` 数值、DTO 字段、错误码均与 core 强耦合，升级 core 时同步检查 `wasm/manifest.json` 的 `commit`。
