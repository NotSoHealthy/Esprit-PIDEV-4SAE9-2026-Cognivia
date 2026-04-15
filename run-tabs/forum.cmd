@echo off
title forum
echo [forum] cd "C:\Users\elite\Desktop\Work\PIDEV-26\BackEnd\Microservices\forum-service"
pushd "C:\Users\elite\Desktop\Work\PIDEV-26\BackEnd\Microservices\forum-service" || (echo Failed to cd to "C:\Users\elite\Desktop\Work\PIDEV-26\BackEnd\Microservices\forum-service" & pause & exit /b 1)
timeout /t 7 /nobreak >nul
mvn -q spring-boot:run
echo.
echo [forum] stopped. Press any key to close tab.
popd
pause >nul
