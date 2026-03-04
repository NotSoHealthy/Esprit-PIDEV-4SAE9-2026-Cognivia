@echo off
title care
echo [care] cd "D:\Files\Uni\PIDEV 26\PIDEV-26\BackEnd\Microservices\care"
pushd "D:\Files\Uni\PIDEV 26\PIDEV-26\BackEnd\Microservices\care" || (echo Failed to cd to "D:\Files\Uni\PIDEV 26\PIDEV-26\BackEnd\Microservices\care" & pause & exit /b 1)
timeout /t 7 /nobreak >nul
mvn -q spring-boot:run
echo.
echo [care] stopped. Press any key to close tab.
popd
pause >nul
