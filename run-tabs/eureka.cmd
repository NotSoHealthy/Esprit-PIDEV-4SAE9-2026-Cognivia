@echo off
title eureka
echo [eureka] cd "C:\Users\elite\Desktop\Work\PIDEV-26\BackEnd\eureka"
pushd "C:\Users\elite\Desktop\Work\PIDEV-26\BackEnd\eureka" || (echo Failed to cd to "C:\Users\elite\Desktop\Work\PIDEV-26\BackEnd\eureka" & pause & exit /b 1)
mvn -q spring-boot:run
echo.
echo [eureka] stopped. Press any key to close tab.
popd
pause >nul
