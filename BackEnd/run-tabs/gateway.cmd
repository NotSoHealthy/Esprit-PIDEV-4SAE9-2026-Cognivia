@echo off
title gateway
echo [gateway] cd "C:\Users\elite\Desktop\Work\PIDEV-26\BackEnd\gateway"
pushd "C:\Users\elite\Desktop\Work\PIDEV-26\BackEnd\gateway" || (echo Failed to cd to "C:\Users\elite\Desktop\Work\PIDEV-26\BackEnd\gateway" & pause & exit /b 1)
timeout /t 5 /nobreak >nul
mvn -q spring-boot:run
echo.
echo [gateway] stopped. Press any key to close tab.
popd
pause >nul
