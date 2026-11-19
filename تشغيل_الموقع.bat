@echo off
title Jami al-Sunan Platform
cls
echo ========================================================
echo   Starting Jami' al-Sunan al-Nabawiyyah Platform...
echo   Opening browser at http://localhost:3000
echo ========================================================
start http://localhost:3000
call npm.cmd run dev
pause
