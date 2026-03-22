@echo off
title dpchat
echo [dpchat] cd "C:\Users\elite\Desktop\Work\PIDEV-26\BackEnd\Microservices\dpchat"
pushd "C:\Users\elite\Desktop\Work\PIDEV-26\BackEnd\Microservices\dpchat" || (echo Failed to cd to "C:\Users\elite\Desktop\Work\PIDEV-26\BackEnd\Microservices\dpchat" & pause & exit /b 1)
timeout /t 7 /nobreak >nul
mvn -q spring-boot:run
echo.
echo [dpchat] stopped. Press any key to close tab.
popd
pause >nul
