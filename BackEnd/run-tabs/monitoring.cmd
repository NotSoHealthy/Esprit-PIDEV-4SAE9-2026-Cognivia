@echo off
title monitoring
echo [monitoring] cd "C:\Users\elite\Desktop\Work\PIDEV-26\BackEnd\Microservices\monitoring"
pushd "C:\Users\elite\Desktop\Work\PIDEV-26\BackEnd\Microservices\monitoring" || (echo Failed to cd to "C:\Users\elite\Desktop\Work\PIDEV-26\BackEnd\Microservices\monitoring" & pause & exit /b 1)
timeout /t 7 /nobreak >nul
mvn -q spring-boot:run
echo.
echo [monitoring] stopped. Press any key to close tab.
popd
pause >nul
