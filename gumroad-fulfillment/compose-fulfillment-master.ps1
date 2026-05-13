Add-Type -AssemblyName System.Drawing

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$masterPath = 'C:\Users\Matt\Downloads\ChatGPT Image May 13, 2026, 11_51_42 AM.png'
$logoPath = 'C:\Users\Matt\Desktop\Transparent.png'
$outPng = Join-Path $scriptDir 'START-HERE-ACCESS-YOUR-COMPLETE-BILLING-REVIEW-master.png'
$outJpg = Join-Path $scriptDir 'START-HERE-ACCESS-YOUR-COMPLETE-BILLING-REVIEW-master.jpg'

$master = New-Object System.Drawing.Bitmap($masterPath)
$logo = New-Object System.Drawing.Bitmap($logoPath)
$w = $logo.Width; $h = $logo.Height
$visited = New-Object 'bool[,]' $w,$h
$q = New-Object System.Collections.Generic.Queue[System.Drawing.Point]

function IsBg([System.Drawing.Color]$c) {
  $max = [Math]::Max($c.R, [Math]::Max($c.G, $c.B))
  $min = [Math]::Min($c.R, [Math]::Min($c.G, $c.B))
  return ($c.A -gt 0 -and ($max - $min) -le 20 -and $max -ge 178)
}
function Enqueue([int]$x,[int]$y) {
  if ($x -lt 0 -or $y -lt 0 -or $x -ge $w -or $y -ge $h) { return }
  if ($visited[$x,$y]) { return }
  $c = $logo.GetPixel($x,$y)
  if (IsBg $c) {
    $visited[$x,$y] = $true
    $q.Enqueue([System.Drawing.Point]::new($x,$y))
  }
}
for ($x=0; $x -lt $w; $x++) { Enqueue $x 0; Enqueue $x ($h-1) }
for ($y=0; $y -lt $h; $y++) { Enqueue 0 $y; Enqueue ($w-1) $y }
while ($q.Count -gt 0) {
  $p = $q.Dequeue()
  $logo.SetPixel($p.X,$p.Y,[System.Drawing.Color]::FromArgb(0,255,255,255))
  Enqueue ($p.X+1) $p.Y
  Enqueue ($p.X-1) $p.Y
  Enqueue $p.X ($p.Y+1)
  Enqueue $p.X ($p.Y-1)
}

$minX=$w; $minY=$h; $maxX=0; $maxY=0
for ($y=0; $y -lt $h; $y++) {
  for ($x=0; $x -lt $w; $x++) {
    if ($logo.GetPixel($x,$y).A -gt 10) {
      if ($x -lt $minX) { $minX=$x }
      if ($y -lt $minY) { $minY=$y }
      if ($x -gt $maxX) { $maxX=$x }
      if ($y -gt $maxY) { $maxY=$y }
    }
  }
}
$crop = [System.Drawing.Rectangle]::FromLTRB($minX,$minY,$maxX+1,$maxY+1)
$cleanLogo = $logo.Clone($crop, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Remove only the old logo pixels, preserving the master image background so no square patch appears.
$pageBg = [System.Drawing.Color]::FromArgb(250,251,251)
for ($y=44; $y -le 224; $y++) {
  for ($x=54; $x -le 218; $x++) {
    $c = $master.GetPixel($x,$y)
    $diff = [Math]::Abs($c.R - 250) + [Math]::Abs($c.G - 251) + [Math]::Abs($c.B - 251)
    if ($diff -gt 16) {
      $master.SetPixel($x,$y,$pageBg)
    }
  }
}

$g = [System.Drawing.Graphics]::FromImage($master)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Match the original shield placement and scale in the supplied master.
$dest = [System.Drawing.Rectangle]::new(76, 57, 128, 157)
$g.DrawImage($cleanLogo, $dest)

$master.Save($outPng, [System.Drawing.Imaging.ImageFormat]::Png)
$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters(1)
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 96L)
$master.Save($outJpg, $encoder, $params)

$g.Dispose(); $cleanLogo.Dispose(); $logo.Dispose(); $master.Dispose()
Write-Output "Wrote $outPng"
Write-Output "Wrote $outJpg"
