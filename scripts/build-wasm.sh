#!/usr/bin/env bash
# 从 ../goim-sdk-core 构建 wasm，并把产物同步到 goim-sdk-js/wasm/
# 用法：bash scripts/build-wasm.sh
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sdk_root="$(dirname "$script_dir")"                    # goim-sdk-js/
parent="$(dirname "$sdk_root")"                        # goim-all/
core_dir="$parent/goim-sdk-core"
out_dir="$sdk_root/wasm"

if [ ! -d "$core_dir" ]; then
    echo "未找到 goim-sdk-core：$core_dir" >&2
    exit 1
fi
mkdir -p "$out_dir"

# 转义 JSON 字符串值（路径可能含反斜杠 / 引号）
json_escape() {
    printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

(
    cd "$core_dir"
    export GOOS=js
    export GOARCH=wasm

    echo '构建 goim.wasm ...'
    go build -o "$out_dir/goim.wasm" ./cmd/wasm

    go_version="$(go version)"
    go_root="$(go env GOROOT)"

    exec_src=''
    for candidate in \
        "$go_root/lib/wasm/wasm_exec.js" \
        "$go_root/misc/wasm/wasm_exec.js" \
        "$core_dir/cmd/wasm/dist/wasm_exec.js"; do
        if [ -f "$candidate" ]; then
            exec_src="$candidate"
            break
        fi
    done
    if [ -z "$exec_src" ]; then
        echo '未找到 wasm_exec.js（Go 与 SDK 产物目录均缺失）' >&2
        exit 1
    fi

    cp -f "$exec_src" "$out_dir/wasm_exec.js"
    cp -f "$core_dir/cmd/wasm/idb_wrapper.js" "$out_dir/idb_wrapper.js"

    commit="$(git -C "$core_dir" rev-parse HEAD)"
    wasm_size="$(wc -c < "$out_dir/goim.wasm" | tr -d '[:space:]')"
    built_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

    cat > "$out_dir/manifest.json" <<EOF
{
  "source": "goim-sdk-core",
  "commit": "$(json_escape "$commit")",
  "goVersion": "$(json_escape "$go_version")",
  "wasmExec": "$(json_escape "$exec_src")",
  "wasmSize": $wasm_size,
  "builtAt": "$built_at"
}
EOF

    echo "wasm 构建完成 -> $out_dir"
    echo "commit：$commit"
)
