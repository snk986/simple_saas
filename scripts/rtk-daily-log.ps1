param(
  [string]$ProjectRoot = "D:\project\simple_saas",
  [string]$LogFile = "D:\project\simple_saas\docs\checklists\rtk-daily-log.csv"
)

$ErrorActionPreference = "Stop"

$rtkPath = "C:\Users\Admin\.local\bin\rtk.exe"
if (Get-Command rtk -ErrorAction SilentlyContinue) {
  $rtkPath = "rtk"
}

if (-not (Test-Path $ProjectRoot)) {
  throw "Project root not found: $ProjectRoot"
}

Push-Location $ProjectRoot
try {
  $daily = & $rtkPath gain --daily 2>&1
  $total = & $rtkPath gain 2>&1
} finally {
  Pop-Location
}

if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to run RTK gain commands.`n$daily`n$total"
  exit 1
}

$line = ($daily | Select-String -Pattern "^\d{4}-\d{2}-\d{2}\s+" | Select-Object -Last 1).Line
if (-not $line) {
  Write-Error "Could not parse daily summary from rtk gain --daily output."
  exit 1
}

$parts = [regex]::Split($line.Trim(), "\s+") | Where-Object { $_ -ne "" }
if ($parts.Count -lt 7) {
  Write-Error "Unexpected daily summary format: $line"
  exit 1
}

$date = $parts[0]
$cmds = $parts[1]
$input = $parts[2]
$output = $parts[3]
$saved = $parts[4]
$savePct = $parts[5]
$time = $parts[6]
$timestamp = (Get-Date).ToString("s")

if (-not (Test-Path $LogFile)) {
  "timestamp,date,cmds,input,output,saved,save_pct,time" | Out-File -FilePath $LogFile -Encoding utf8
}

"$timestamp,$date,$cmds,$input,$output,$saved,$savePct,$time" | Out-File -FilePath $LogFile -Append -Encoding utf8

Write-Output "Logged RTK daily stats to $LogFile"
Write-Output "date=$date cmds=$cmds saved=$saved save%=$savePct"
