@echo off
title Games
echo [Games] cd "C:\Users\Mega-Pc\Documents\GitHub\PIDEV-26\BackEnd\Microservices\games"
pushd "C:\Users\Mega-Pc\Documents\GitHub\PIDEV-26\BackEnd\Microservices\games" || (echo Failed to cd to "C:\Users\Mega-Pc\Documents\GitHub\PIDEV-26\BackEnd\Microservices\games" & pause & exit /b 1)
timeout /t 7 /nobreak >nul
mvn -q spring-boot:run
echo.
echo [Games] stopped. Press any key to close tab.
popd
pause >nul
