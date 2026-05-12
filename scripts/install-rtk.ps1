param(
  [string]$Version = 'v0.39.0',
  [string]$InstallDir = "$env:USERPROFILE\\.local\\bin"
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host "Installing RTK $Version ..."
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

$tmpDir = Join-Path $env:TEMP ("rtk_install_" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null
$zipPath = Join-Path $tmpDir 'rtk.zip'
$url = "https://github.com/rtk-ai/rtk/releases/download/$Version/rtk-x86_64-pc-windows-msvc.zip"

Invoke-WebRequest -Uri $url -OutFile $zipPath -Headers @{ 'User-Agent'='Mozilla/5.0' }
Expand-Archive -Path $zipPath -DestinationPath $tmpDir -Force

$exe = Get-ChildItem -Path $tmpDir -Recurse -Filter 'rtk.exe' | Select-Object -First 1
if (-not $exe) {
  throw 'rtk.exe not found in downloaded archive.'
}

$target = Join-Path $InstallDir 'rtk.exe'
Copy-Item -LiteralPath $exe.FullName -Destination $target -Force

$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if ([string]::IsNullOrWhiteSpace($userPath)) { $userPath = '' }
$parts = $userPath -split ';' | Where-Object { $_ -ne '' }
if (-not ($parts -contains $InstallDir)) {
  $newPath = if ($userPath) { $userPath.TrimEnd(';') + ';' + $InstallDir } else { $InstallDir }
  [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
  Write-Host "Added to user PATH: $InstallDir"
} else {
  Write-Host "PATH already contains: $InstallDir"
}

if (-not (($env:Path -split ';') -contains $InstallDir)) {
  $env:Path = $env:Path + ';' + $InstallDir
}

Write-Host "RTK path: $target"
rtk --version
rtk gain

Write-Host "Running Codex init ..."
Push-Location (Resolve-Path (Join-Path $PSScriptRoot '..'))
try {
  rtk init -g --codex
} finally {
  Pop-Location
}

Write-Host 'Done. Please restart terminal/Codex to apply PATH changes globally.'
