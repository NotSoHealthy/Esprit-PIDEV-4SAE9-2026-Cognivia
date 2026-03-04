@echo off
title eureka
echo [eureka] cd "D:\Files\Uni\PIDEV 26\PIDEV-26\BackEnd\eureka"
pushd "D:\Files\Uni\PIDEV 26\PIDEV-26\BackEnd\eureka" || (echo Failed to cd to "D:\Files\Uni\PIDEV 26\PIDEV-26\BackEnd\eureka" & pause & exit /b 1)
mvn -q spring-boot:run
echo.
echo [eureka] stopped. Press any key to close tab.
popd
pause >nul
