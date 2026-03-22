@echo off
title pharmacy
echo [pharmacy] cd "C:\Users\elite\Desktop\Work\PIDEV-26\BackEnd\Microservices\pharmacy"
pushd "C:\Users\elite\Desktop\Work\PIDEV-26\BackEnd\Microservices\pharmacy" || (echo Failed to cd to "C:\Users\elite\Desktop\Work\PIDEV-26\BackEnd\Microservices\pharmacy" & pause & exit /b 1)
timeout /t 7 /nobreak >nul
mvn -q spring-boot:run
echo.
echo [pharmacy] stopped. Press any key to close tab.
popd
pause >nul
