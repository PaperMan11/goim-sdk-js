import type { Goim } from '../client';

// 模块基类：只持有 client 引用，通过 client.call 走反射分发表。
// 使用 import type，避免 client ↔ modules 的运行时循环依赖。
export class ModuleBase {
  constructor(protected readonly goim: Goim) {}
}
