@echo off
cd /d "D:\Chandan Ecosystem\Tution MVP\backend"
start /min "Tuition Server" node --experimental-sqlite server.js
start /min "Tuition Link" "C:\Users\Asus\AppData\Local\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe" http 5000