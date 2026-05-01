@echo off
:: 確保 UTF-8 編碼
chcp 65001 >nul

echo ========================================
echo   Illustration Folio - Git 自動上傳工具
echo ========================================

:: 1. 初始化檢查
if not exist ".git" (
    echo [INFO] 正在初始化 Git 倉庫...
    git init
)

:: 2. 加入暫存區
echo [1/4] 正在將檔案加入暫存區...
git add .

:: 3. 處理提交訊息 (解決空格造成的 pathspec 錯誤)
set "msg="
set /p msg="[2/4] 請輸入 Commit 訊息: "

if "%msg%"=="" (
    set "msg=Update portfolio assets"
)

:: 4. 執行提交
git commit -m "%msg%"

:: 5. 分支與遠端設定
git branch -M main
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo [3/4] 正在設定遠端倉庫...
    git remote add origin https://github.com/142tony/Illustration-Folio.git
) else (
    echo [3/4] 遠端倉庫已設定。
)

:: 6. 推送
echo [4/4] 正在推送到 GitHub...
git push -u origin main

echo ========================================
echo   上傳完成！
echo ========================================
pause