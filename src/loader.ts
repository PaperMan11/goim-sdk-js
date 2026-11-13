// wasm 资源加载器：注入浏览器桥脚本 → 实例化 goim.wasm → 等待 goimSdk 注册。
//
// 顺序敏感：idb_wrapper.js 必须先于 wasm_exec.js 注入，Go 侧 init 时会直接
// 访问 goimIdb；wasm_exec.js 提供全局 Go 类。

import type { GoimSdkBridge } from './bridge';
import { GoimError } from './errors';

export interface LoadOptions {
  // wasm 资源目录；默认取 SDK 目录下的 ../wasm/
  wasmBasePath?: string;
  // 等待 goimSdk 注册的超时（首次加载含 22MB wasm 下载）
  timeoutMs?: number;
}

let loadPromise: Promise<GoimSdkBridge> | undefined;

function defaultBasePath(): string {
  return new URL('../wasm/', import.meta.url).href;
}

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-goim-src="${src}"]`)) {
      resolve();
      return;
    }
    const el = document.createElement('script');
    el.src = src;
    el.async = false; // 保持脚本按注入顺序执行
    el.dataset.goimSrc = src;
    el.onload = () => resolve();
    el.onerror = () =>
      reject(new GoimError(90010, `加载脚本失败: ${src}`));
    document.head.appendChild(el);
  });
}

async function instantiate(base: string): Promise<WebAssembly.Instance> {
  const goCtor = window.Go;
  if (!goCtor) {
    throw new GoimError(90010, 'wasm_exec.js 未注入，window.Go 不存在');
  }
  const go = new goCtor();
  const wasmURL = new URL('goim.wasm', base).href;

  try {
    const { instance } = await WebAssembly.instantiateStreaming(
      fetch(wasmURL),
      go.importObject,
    );
    void go.run(instance); // Go main 常驻，不 await
    return instance;
  } catch (streamErr) {
    // 静态服务未返回 application/wasm 时降级为 arrayBuffer 实例化
    const resp = await fetch(wasmURL);
    const bytes = await resp.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(bytes, go.importObject);
    void go.run(instance);
    console.warn('[goim] instantiateStreaming 失败，已降级实例化:', streamErr);
    return instance;
  }
}

function waitForBridge(timeoutMs: number): Promise<GoimSdkBridge> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (window.goimSdk) {
        resolve(window.goimSdk);
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(
          new GoimError(
            90010,
            `等待 goimSdk 超时（${timeoutMs}ms），检查 wasm 是否加载成功`,
          ),
        );
        return;
      }
      setTimeout(tick, 20);
    };
    tick();
  });
}

// 单例加载：页面内重复调用 init 复用同一 wasm 实例。
// shutdown 会终止 Go runtime，之后必须整页重载，故不提供重启能力。
export function loadGoimSdk(options: LoadOptions = {}): Promise<GoimSdkBridge> {
  if (window.goimSdk) return Promise.resolve(window.goimSdk);
  if (loadPromise) return loadPromise;

  // 调用方可传相对路径（如 /wasm/），这里统一转成绝对 URL 供 new URL 使用
  const base = new URL(
    options.wasmBasePath ?? defaultBasePath(),
    location.href,
  ).href;
  const timeoutMs = options.timeoutMs ?? 60_000;

  loadPromise = (async () => {
    await injectScript(new URL('idb_wrapper.js', base).href);
    await injectScript(new URL('wasm_exec.js', base).href);
    await instantiate(base);
    return waitForBridge(timeoutMs);
  })().catch((err) => {
    loadPromise = undefined; // 失败允许重试
    throw err;
  });

  return loadPromise;
}
