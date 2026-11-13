// Goim 客户端：把回调式 goimSdk 桥接成 Promise API，并挂载各业务模块。

import type { GoimSdkBridge } from './bridge';
import { GoimError } from './errors';
import { parseEvent, type GoimEvent } from './events';
import { loadGoimSdk, type LoadOptions } from './loader';
import { AuthModule } from './modules/auth';
import { ConversationsModule } from './modules/conversations';
import { GroupsModule } from './modules/groups';
import { MessagesModule } from './modules/messages';
import { UsersModule } from './modules/users';
import type { SyncStateValue, TransportStatusValue } from './types';

export type GoimLogLevel = 'debug' | 'info' | 'warn' | 'error';

// 与 goim-sdk-core 的 logger.Config 对齐（JSON 字段名保持一致）
export interface GoimLogConfig {
  disable?: boolean; // 全部静默
  level?: GoimLogLevel; // 级别阈值（空或非法值按 info）
  format?: 'console' | 'json';
  // wasm 无 stdout / 文件系统，该字段实际无效，仅与核心配置保持一致
  outputPaths?: string[];
  development?: boolean; // 开发模式：console 彩色级别 + warn 及以上堆栈
}

export type LogHandler = (level: GoimLogLevel, message: string) => void;

export interface GoimConfig {
  baseURL: string;
  endpoint: string;
  platformID?: number;
  deviceID?: string;
  sdkVersion?: string;
  compression?: 'none' | 'gzip' | 'zlib';
  // 受信环境（本地联调）用 admin bootstrap 登录；生产请用 loginWithToken
  adminSecret?: string;
  adminUserID?: string;
  // wasm 下非空即启用 IndexedDB（传 "idb" 即可）
  sessionDataPath?: string;
  // 日志开关/级别；不传则静默，传了默认输出到 console（可用 onLog 接管）
  logging?: GoimLogConfig;
}

export type EventHandler<T = unknown> = (event: GoimEvent<T>) => void;

interface Session {
  userID: string;
  platformID: number;
}

export class Goim {
  private static instance: Goim | undefined; // 所有实例共享，单例模式

  private readonly handlers = new Set<EventHandler>();
  private readonly logHandlers = new Set<LogHandler>();
  private session: Session | undefined;

  readonly auth: AuthModule;
  readonly conversations: ConversationsModule;
  readonly messages: MessagesModule;
  readonly users: UsersModule;
  readonly groups: GroupsModule;

  private constructor(
    private readonly bridge: GoimSdkBridge,
    private readonly config: GoimConfig,
  ) {
    this.auth = new AuthModule(this);
    this.conversations = new ConversationsModule(this);
    this.messages = new MessagesModule(this);
    this.users = new UsersModule(this);
    this.groups = new GroupsModule(this);
    this.bindEvents();
  }

  static async init(config: GoimConfig, options: LoadOptions = {}): Promise<Goim> {
    if (Goim.instance) return Goim.instance;
    if (!config.baseURL || !config.endpoint) {
      throw new GoimError(90010, 'init 需要 baseURL 与 endpoint');
    }

    const bridge = await loadGoimSdk(options);
    const initConfig = {
      baseURL: config.baseURL,
      endpoint: config.endpoint,
      platformID: config.platformID ?? 1,
      deviceID: config.deviceID ?? '',
      sdkVersion: config.sdkVersion ?? '',
      compression: config.compression ?? 'none',
      sessionDataPath: config.sessionDataPath ?? 'idb',
      adminSecret: config.adminSecret ?? '',
      adminUserID: config.adminUserID ?? '',
      logging: config.logging,
    };

    // 必须在 init 前注册：构建期（如 IndexedDB 打开失败）的日志也能被宿主拿到
    bridge.setLogCallback((level, msg) => {
      const instance = Goim.instance;
      if (instance) {
        instance.dispatchLog(level, msg, config);
        return;
      }
      if (config.logging && !config.logging.disable) {
        defaultConsoleLog(level, msg);
      }
    });

    await new Promise<void>((resolve, reject) => {
      bridge.init(
        JSON.stringify(initConfig),
        resolve,
        (code, msg) => reject(new GoimError(code, msg)),
      );
    });

    Goim.instance = new Goim(bridge, config);
    return Goim.instance;
  }

  // ———— 会话与账号 ————

  get platformID(): number {
    return this.config.platformID ?? 1;
  }

  get currentUserID(): string | undefined {
    return this.session?.userID;
  }

  requireUserID(): string {
    if (!this.session) {
      throw new GoimError(90011, '尚未登录');
    }
    return this.session.userID;
  }

  async login(userID: string, platformID = this.platformID): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.bridge.login(userID, platformID, resolve, (code, msg) =>
        reject(new GoimError(code, msg)),
      );
    });
    this.session = { userID, platformID };
  }

  async loginWithToken(
    userID: string,
    token: string,
    expireTimeSeconds: number,
    platformID = this.platformID,
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.bridge.loginWithToken(
        userID,
        platformID,
        token,
        expireTimeSeconds,
        resolve,
        (code, msg) => reject(new GoimError(code, msg)),
      );
    });
    this.session = { userID, platformID };
  }

  async logout(clearData = false): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.bridge.logout(clearData, resolve, (code, msg) =>
        reject(new GoimError(code, msg)),
      );
    });
    this.session = undefined;
  }

  async connect(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.bridge.connect(resolve, (code, msg) => reject(new GoimError(code, msg)));
    });
  }

  async disconnect(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.bridge.disconnect(resolve, (code, msg) =>
        reject(new GoimError(code, msg)),
      );
    });
  }

  // 只断连并解绑事件；不调 shutdown（会终止 Go runtime，实例不可恢复）
  async close(): Promise<void> {
    await this.disconnect();
    this.bridge.setEventCallback(null);
    this.session = undefined;
  }

  updateToken(token: string, expireTimeSeconds: number): void {
    const session = this.session;
    if (!session) {
      throw new GoimError(90011, '尚未登录，无法更新 token');
    }
    this.bridge.updateToken(
      session.userID,
      session.platformID,
      token,
      expireTimeSeconds,
    );
  }

  // ———— 状态 ————

  status(): TransportStatusValue {
    return this.bridge.status() as TransportStatusValue;
  }

  syncState(): SyncStateValue {
    const raw = this.bridge.syncCall('SyncState', '');
    const env = JSON.parse(raw) as {
      code: number;
      data?: number;
      msg?: string;
    };
    if (env.code !== 0) {
      throw new GoimError(env.code, env.msg ?? '');
    }
    return (env.data ?? 0) as SyncStateValue;
  }

  // ———— 事件 ————

  on(handler: EventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  onEvent(name: string, handler: EventHandler): () => void {
    return this.on((event) => {
      if (event.name === name) handler(event);
    });
  }

  // ———— 日志 ————

  // 接管 SDK 日志输出（注册后不再默认打印到 console）；级别由 init 的 logging 控制
  onLog(handler: LogHandler): () => void {
    this.logHandlers.add(handler);
    return () => this.logHandlers.delete(handler);
  }

  private dispatchLog(
    level: string,
    message: string,
    config: GoimConfig,
  ): void {
    if (this.logHandlers.size > 0) {
      for (const handler of this.logHandlers) {
        handler(level as GoimLogLevel, message);
      }
      return;
    }
    if (config.logging && !config.logging.disable) {
      defaultConsoleLog(level, message);
    }
  }

  // ———— 反射调用入口（模块内部使用） ————

  call<T>(method: string, args: unknown[] = []): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.bridge.call(
        method,
        JSON.stringify(args),
        (resultJSON) => {
          if (!resultJSON) {
            resolve(undefined as T);
            return;
          }
          try {
            resolve(JSON.parse(resultJSON) as T);
          } catch {
            resolve(resultJSON as unknown as T);
          }
        },
        (code, msg) => reject(new GoimError(code, msg)),
      );
    });
  }

  private bindEvents(): void {
    this.bridge.setEventCallback((eventType, payloadJSON) => {
      const event = parseEvent(eventType, payloadJSON);
      for (const handler of this.handlers) {
        handler(event);
      }
    });
  }
}

// 默认日志出口：浏览器 wasm 无 stdout，按级别打到 console
function defaultConsoleLog(level: string, message: string): void {
  switch (level) {
    case 'debug':
      console.debug(`[goim-sdk][${level}] ${message}`);
      break;
    case 'warn':
      console.warn(`[goim-sdk][${level}] ${message}`);
      break;
    case 'error':
      console.error(`[goim-sdk][${level}] ${message}`);
      break;
    default:
      console.info(`[goim-sdk][${level}] ${message}`);
  }
}
