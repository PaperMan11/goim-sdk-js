// cmd/wasm/main.go 暴露到 globalThis 的桥接对象类型。
// 只声明本 SDK 实际使用的方法；其余方法保持不暴露，避免误用。

export interface GoimSdkBridge {
  init(
    configJSON: string,
    onSuccess: () => void,
    onError: (code: number, msg: string) => void,
  ): void;
  call(
    method: string,
    argsJSON: string,
    onSuccess: (resultJSON: string) => void,
    onError: (code: number, msg: string) => void,
  ): void;
  syncCall(method: string, argsJSON: string): string;
  login(
    userID: string,
    platformID: number,
    onSuccess: () => void,
    onError: (code: number, msg: string) => void,
  ): void;
  loginWithToken(
    userID: string,
    platformID: number,
    token: string,
    expireTimeSeconds: number,
    onSuccess: () => void,
    onError: (code: number, msg: string) => void,
  ): void;
  logout(
    clearData: boolean,
    onSuccess: () => void,
    onError: (code: number, msg: string) => void,
  ): void;
  connect(onSuccess: () => void, onError: (code: number, msg: string) => void): void;
  disconnect(onSuccess: () => void, onError: (code: number, msg: string) => void): void;
  status(): number;
  setEventCallback(
    cb: ((eventType: string, payloadJSON: string) => void) | null,
  ): void;
  // 日志回调：cb(level, msg)；null 注销。级别/开关由 init 的 logging 配置控制
  setLogCallback(cb: ((level: string, msg: string) => void) | null): void;
  updateToken(
    userID: string,
    platformID: number,
    token: string,
    expireTimeSeconds: number,
  ): void;
  // 注意：shutdown 会结束 Go runtime，本 SDK 故意不暴露。
}

// idb_wrapper.js 暴露的 IndexedDB 桥（SDK 只读，写入仍由 Go 侧负责）
export interface GoimIdbBridge {
  open(): Promise<null>;
  op(operation: string, argsJSON: string): Promise<string>;
}

declare global {
  interface Window {
    goimSdk?: GoimSdkBridge;
    goimIdb?: GoimIdbBridge;
    Go?: new () => {
      importObject: WebAssembly.Imports;
      run(instance: WebAssembly.Instance): Promise<void>;
    };
  }
}
