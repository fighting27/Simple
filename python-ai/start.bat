@echo off
chcp 65001 >nul
echo 🧠 启动 AI 分析服务...
echo.
cd /d "%~dp0"
.venv\Scripts\python app.py
pause
