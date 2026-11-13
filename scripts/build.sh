#!/usr/bin/env bash
# 一键构建：先构建 wasm（依赖 ../goim-sdk-core），再编译 TypeScript，产物在 wasm/ 与 dist/
# 用法：bash scripts/build.sh
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sdk_root="$(dirname "$script_dir")"
cd "$sdk_root"

if [ ! -d node_modules ]; then
    echo '安装依赖 ...'
    if [ -f package-lock.json ]; then
        npm ci
    else
        npm install
    fi
fi

echo '构建 wasm ...'
bash "$script_dir/build-wasm.sh"

echo '编译 TypeScript ...'
npm run build

echo '校验产物 ...'
for f in \
    wasm/goim.wasm \
    wasm/wasm_exec.js \
    wasm/idb_wrapper.js \
    wasm/manifest.json \
    dist/index.js \
    dist/index.d.ts; do
    if [ ! -s "$f" ]; then
        echo "缺少产物：$f" >&2
        exit 1
    fi
done

wasm_size="$(wc -c < wasm/goim.wasm | tr -d '[:space:]')"
echo '构建完成 -> dist/ wasm/'
echo "goim.wasm：$((wasm_size / 1048576)) MB"
