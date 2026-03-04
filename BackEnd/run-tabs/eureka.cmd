@echo off
title eureka
echo [eureka] cd "C:\Users\souha\OneDrive\Bureau\PIDEV-26\BackEnd\eureka"
pushd "C:\Users\souha\OneDrive\Bureau\PIDEV-26\BackEnd\eureka" || (echo Failed to cd to "C:\Users\souha\OneDrive\Bureau\PIDEV-26\BackEnd\eureka" & pause & exit /b 1)
mvn -q spring-boot:run
echo.
echo [eureka] stopped. Press any key to close tab.
popd
pause >nul
