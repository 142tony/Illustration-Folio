@echo off
rem 設定轉碼後的圖片存放在 "resized" 子資料夾中，避免覆蓋原檔
set "output_dir=%~dp0resized"
if not exist "%output_dir%" mkdir "%output_dir%"

echo 正在處理圖片，請稍候...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "[System.Reflection.Assembly]::LoadWithPartialName('System.Drawing') | Out-Null;" ^
    "Get-ChildItem -LiteralPath '%~dp0' -File | Where-Object { $_.Extension -match '^\.(jpg|jpeg|png|bmp)$' } | ForEach-Object {" ^
        "$fn = $_.Name;" ^
        "try {" ^
            "$img = [System.Drawing.Image]::FromFile($_.FullName);" ^
            "$newWidth = [math]::Max(1, [int]($img.Width * 0.5));" ^
            "$newHeight = [math]::Max(1, [int]($img.Height * 0.5));" ^
            "$bmp = New-Object System.Drawing.Bitmap($newWidth, $newHeight);" ^
            "$g = [System.Drawing.Graphics]::FromImage($bmp);" ^
            "$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic;" ^
            "$g.DrawImage($img, 0, 0, $newWidth, $newHeight);" ^
            "$g.Dispose();" ^
            "$img.Dispose();" ^
            "$outFile = Join-Path '%output_dir%' $fn;" ^
            "$fmt = [System.Drawing.Imaging.ImageFormat]::Png;" ^
            "if ($_.Extension -match 'jpg|jpeg') { $fmt = [System.Drawing.Imaging.ImageFormat]::Jpeg }" ^
            "if ($_.Extension -match 'bmp') { $fmt = [System.Drawing.Imaging.ImageFormat]::Bmp }" ^
            "$bmp.Save($outFile, $fmt);" ^
            "$bmp.Dispose();" ^
            "Write-Host '已完成:' $fn;" ^
        "} catch {" ^
            "Write-Host '失敗:' $fn '原因:' $_.Exception.Message -ForegroundColor Red;" ^
        "}" ^
    "}"

echo.
echo 所有圖片處理完畢！新圖片已存放在 resized 資料夾。
pause