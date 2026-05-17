param(
  [string]$Title = "Claude Code",
  [string]$Message = "Notification"
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ico = [System.Drawing.Icon]::ExtractAssociatedIcon("C:\Windows\explorer.exe")
$ni = New-Object System.Windows.Forms.NotifyIcon
$ni.Icon = $ico
$ni.BalloonTipTitle = $Title
$ni.BalloonTipText = $Message
$ni.BalloonTipIcon = "Info"
$ni.Visible = $true
$ni.ShowBalloonTip(5000)
Start-Sleep 6
$ni.Visible = $false
$ni.Dispose()
