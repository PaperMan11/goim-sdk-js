# 一键构建：先构建 wasm（依赖 ../goim-sdk-core），再编译 TypeScript，产物在 wasm/ 与 dist/
# 用法：powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build.ps1
$ErrorActionPreference = 'Stop'

$sdkRoot = Split-Path -Parent $PSScriptRoot
Push-Location $sdkRoot
try {
    if (-not (Test-Path 'node_modules')) {
        Write-Host '安装依赖 ...'
        if (Test-Path 'package-lock.json') { & npm ci } else { & npm install }
        if ($LASTEXITCODE -ne 0) {
            throw '依赖安装失败'
        }
    }

    Write-Host '构建 wasm ...'
    & (Join-Path $PSScriptRoot 'build-wasm.ps1')

    Write-Host '编译 TypeScript ...'
    & npm run build
    if ($LASTEXITCODE -ne 0) {
        throw 'TypeScript 编译失败'
    }

    Write-Host '校验产物 ...'
    foreach ($f in @(
        'wasm/goim.wasm',
        'wasm/wasm_exec.js',
        'wasm/idb_wrapper.js',
        'wasm/manifest.json',
        'dist/index.js',
        'dist/index.d.ts'
    )) {
        $item = Get-Item $f -ErrorAction SilentlyContinue
        if (-not $item -or $item.Length -eq 0) {
            throw "缺少产物：$f"
        }
    }

    $wasmSize = (Get-Item 'wasm/goim.wasm').Length
    $wasmMB = [math]::Round($wasmSize / 1MB, 1)
    Write-Host '构建完成 -> dist/ wasm/'
    Write-Host "goim.wasm：$wasmMB MB"
}
finally {
    Pop-Location
}
