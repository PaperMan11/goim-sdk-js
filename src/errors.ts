// call 层错误码（与 goim-sdk-core pkg/call/error.go 对齐）
export const CallErrorCode = {
  Internal: 90001,
  NotInitialized: 90010,
  NotLoggedIn: 90011,
  UnknownMethod: 90012,
  InvalidArgs: 90013,
} as const;

// GoimError 携带服务端业务码；msg 为 Go 侧已剥离 rpc 前缀的原始报错
export class GoimError extends Error {
  readonly code: number;

  constructor(code: number, msg: string) {
    super(msg || `goim error ${code}`);
    this.name = 'GoimError';
    this.code = code;
  }
}

export function isGoimError(err: unknown): err is GoimError {
  return err instanceof GoimError;
}
