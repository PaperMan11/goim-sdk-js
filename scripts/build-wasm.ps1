# 从 ../goim-sdk-core 构建 wasm，并把产物同步到 goim-sdk-js/wasm/
# 用法：npm run build:wasm
$ErrorActionPreference = 'Stop'

$sdkRoot = Split-Path -Parent $PSScriptRoot            # goim-sdk-js/
$parent = Split-Path -Parent $sdkRoot                  # goim-all/
$coreDir = Join-Path $parent 'goim-sdk-core'
$outDir = Join-Path $sdkRoot 'wasm'

if (-not (Test-Path $coreDir)) {
    throw "未找到 goim-sdk-core：$coreDir"
}
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Push-Location $coreDir
try {
    $env:GOOS = 'js'
    $env:GOARCH = 'wasm'

    Write-Host '构建 goim.wasm ...'
    & go build -o (Join-Path $outDir 'goim.wasm') ./cmd/wasm
    if ($LASTEXITCODE -ne 0) {
        throw 'go build 失败'
    }

    $goVersion = (& go version) -join ' '
    $goRoot = (& go env GOROOT).Trim()
    $execCandidates = @(
        (Join-Path $goRoot 'lib/wasm/wasm_exec.js'),
        (Join-Path $goRoot 'misc/wasm/wasm_exec.js'),
        (Join-Path $coreDir 'cmd/wasm/dist/wasm_exec.js')
    )
    $execSrc = $execCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
    if (-not $execSrc) {
        throw '未找到 wasm_exec.js（Go 与 SDK 产物目录均缺失）'
    }
    Copy-Item $execSrc (Join-Path $outDir 'wasm_exec.js') -Force
    Copy-Item (Join-Path $coreDir 'cmd/wasm/idb_wrapper.js') (Join-Path $outDir 'idb_wrapper.js') -Force

    $commit = (& git -C $coreDir rev-parse HEAD).Trim()
    $manifest = [ordered]@{
        source      = 'goim-sdk-core'
        commit      = $commit
        goVersion   = $goVersion
        wasmExec    = $execSrc
        wasmSize    = (Get-Item (Join-Path $outDir 'goim.wasm')).Length
        builtAt     = (Get-Date).ToString('o')
    }
    $manifest | ConvertTo-Json | Set-Content (Join-Path $outDir 'manifest.json') -Encoding UTF8

    Write-Host "wasm 构建完成 -> $outDir"
    Write-Host ("commit: {0}" -f $commit)
}
finally {
    Remove-Item Env:GOOS -ErrorAction SilentlyContinue
    Remove-Item Env:GOARCH -ErrorAction SilentlyContinue
    Pop-Location
}
