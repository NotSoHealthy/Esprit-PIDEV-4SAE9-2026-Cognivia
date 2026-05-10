@echo off
title frontend
echo [frontend] cd "C:\Users\Mega-Pc\Documents\GitHub\PIDEV-26\FrontEnd\pidev-26"
pushd "C:\Users\Mega-Pc\Documents\GitHub\PIDEV-26\FrontEnd\pidev-26" || (echo Failed to cd to "C:\Users\Mega-Pc\Documents\GitHub\PIDEV-26\FrontEnd\pidev-26" & pause & exit /b 1)
ng serve
echo.
echo [frontend] stopped. Press any key to close tab.
popd
pause >nul
