@echo off
title care
echo [care] cd "C:\Users\souha\OneDrive\Bureau\PIDEV-26\BackEnd\Microservices\care"
pushd "C:\Users\souha\OneDrive\Bureau\PIDEV-26\BackEnd\Microservices\care" || (echo Failed to cd to "C:\Users\souha\OneDrive\Bureau\PIDEV-26\BackEnd\Microservices\care" & pause & exit /b 1)
timeout /t 7 /nobreak >nul
mvn -q spring-boot:run
echo.
echo [care] stopped. Press any key to close tab.
popd
pause >nul
