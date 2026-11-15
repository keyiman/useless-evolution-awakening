# 一键启动 Demo：构建 → 启动 API/静态站点 → 打开浏览器
# 关闭此窗口或按 Ctrl+C 即可停止（也可双击“停止Demo.bat”）
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

$port = 8787
if (Test-Path '.env') {
  $line = Get-Content '.env' | Where-Object { $_ -match '^\s*PORT\s*=\s*(\d+)' } | Select-Object -First 1
  if ($line -and $line -match '(\d+)') { $port = [int]$Matches[1] }
}
$url = "http://127.0.0.1:$port/"
$healthUrl = "http://127.0.0.1:$port/api/health"

function Test-Demo {
  try {
    $r = Invoke-WebRequest -UseBasicParsing $healthUrl -TimeoutSec 2
    return ($r.StatusCode -eq 200)
  } catch { return $false }
}

Write-Host ''
Write-Host '  废物进化论 · 器官库' -ForegroundColor Yellow
Write-Host '  -------------------------' -ForegroundColor DarkGray

if (Test-Demo) {
  Write-Host "  Demo 已经在运行：$url" -ForegroundColor Green
  if (-not $env:DEMO_NO_BROWSER) { Start-Process $url }
  Write-Host '  这个窗口可以直接关闭；要停止服务请双击“停止Demo.bat”。' -ForegroundColor DarkGray
  Read-Host '  按 Enter 关闭'
  exit 0
}

if (-not (Test-Path '.env')) {
  Copy-Item '.env.example' '.env'
  Write-Host '  已从 .env.example 创建 .env（API Key 需自行填写，Demo 离线也能玩）' -ForegroundColor DarkYellow
}

if (-not (Test-Path 'node_modules')) {
  Write-Host '  首次启动：安装依赖（可能需要几分钟）...' -ForegroundColor Cyan
  & npm.cmd install
  if ($LASTEXITCODE -ne 0) { throw 'npm install 失败' }
}

Write-Host '  构建最新版本...' -ForegroundColor Cyan
& npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw '构建失败，请查看上方 TypeScript/Vite 报错' }

$busy = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($busy) {
  throw "端口 $port 已被其他程序占用，请先关闭它，或修改 .env 里的 PORT"
}

New-Item -ItemType Directory -Force '.run' | Out-Null
$outLog = Join-Path $root '.run\demo.log'
$errLog = Join-Path $root '.run\demo.err.log'
Remove-Item $outLog, $errLog -ErrorAction SilentlyContinue

Write-Host '  启动服务...' -ForegroundColor Cyan
$proc = Start-Process -FilePath 'npm.cmd' -ArgumentList 'start' -WorkingDirectory $root -NoNewWindow -PassThru `
  -RedirectStandardOutput $outLog -RedirectStandardError $errLog

$ok = $false
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Milliseconds 500
  if (Test-Demo) { $ok = $true; break }
  if ($proc.HasExited) { break }
}

if (-not $ok) {
  Write-Host '  启动失败。最近日志：' -ForegroundColor Red
  if (Test-Path $outLog) { Get-Content $outLog -Tail 20 }
  if (Test-Path $errLog) { Get-Content $errLog -Tail 20 }
  if (-not $proc.HasExited) { & taskkill /PID $proc.Id /T /F 2>$null | Out-Null }
  throw "无法访问 $healthUrl"
}

Write-Host ''
Write-Host "  已启动：$url" -ForegroundColor Green
Write-Host "  日志：$outLog" -ForegroundColor DarkGray
Write-Host '  按 Ctrl+C 或关闭此窗口停止 Demo。' -ForegroundColor DarkGray
Write-Host ''
if (-not $env:DEMO_NO_BROWSER) { Start-Process $url }

try {
  Wait-Process -Id $proc.Id
} finally {
  if (-not $proc.HasExited) { & taskkill /PID $proc.Id /T /F 2>$null | Out-Null }
  Write-Host '  Demo 已停止。' -ForegroundColor DarkGray
}
