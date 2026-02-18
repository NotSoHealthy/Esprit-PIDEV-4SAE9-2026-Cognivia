@echo off
title monitoring
echo [monitoring] cd "D:\Files\Uni\PIDEV 26\PIDEV-26\BackEnd\Microservices\monitoring"
pushd "D:\Files\Uni\PIDEV 26\PIDEV-26\BackEnd\Microservices\monitoring" || (echo Failed to cd to "D:\Files\Uni\PIDEV 26\PIDEV-26\BackEnd\Microservices\monitoring" & pause & exit /b 1)
timeout /t 7 /nobreak >nul
mvn -q spring-boot:run
echo.
echo [monitoring] stopped. Press any key to close tab.
popd
pause >nul
