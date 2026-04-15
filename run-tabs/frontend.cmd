@echo off
title frontend
echo [frontend] cd "C:\Users\elite\Desktop\Work\PIDEV-26\FrontEnd\pidev-26"
pushd "C:\Users\elite\Desktop\Work\PIDEV-26\FrontEnd\pidev-26" || (echo Failed to cd to "C:\Users\elite\Desktop\Work\PIDEV-26\FrontEnd\pidev-26" & pause & exit /b 1)
ng serve
echo.
echo [frontend] stopped. Press any key to close tab.
popd
pause >nul
