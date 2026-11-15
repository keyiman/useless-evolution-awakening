# 停止一键 Demo：只停止本项目的 API/静态站点进程
$ErrorActionPreference = 'SilentlyContinue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

$port = 8787
if (Test-Path '.env') {
  $line = Get-Content '.env' | Where-Object { $_ -match '^\s*PORT\s*=\s*(\d+)' } | Select-Object -First 1
  if ($line -and $line -match '(\d+)') { $port = [int]$Matches[1] }
}

$conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if (-not $conns) {
  Write-Host "  Demo 没有在运行（端口 $port 空闲）。" -ForegroundColor DarkGray
  exit 0
}

$pids = $conns.OwningProcess | Sort-Object -Unique
$stopped = 0
foreach ($id in $pids) {
  $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$id" -ErrorAction SilentlyContinue
  $cmd = [string]$proc.CommandLine
  if ($cmd -match 'server[\\/]index\.ts' -or $cmd -match 'useless-evolution' -or $cmd -match [regex]::Escape($root)) {
    Write-Host "  停止进程 $id ..." -ForegroundColor Cyan
    & taskkill /PID $id /T /F 2>$null | Out-Null
    $stopped++
  } else {
    Write-Host "  端口 $port 被其他程序占用，未停止：" -ForegroundColor DarkYellow
    Write-Host "  $cmd" -ForegroundColor DarkGray
  }
}

if ($stopped -gt 0) {
  Write-Host "  Demo 已停止（端口 $port 已释放）。" -ForegroundColor Green
} else {
  Write-Host '  没有找到本项目的 Demo 进程。' -ForegroundColor DarkGray
}
