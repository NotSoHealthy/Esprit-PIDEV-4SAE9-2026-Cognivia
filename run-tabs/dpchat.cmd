@echo off
title dpchat
echo [dpchat] cd "C:\Users\Mega-Pc\Documents\GitHub\PIDEV-26\BackEnd\Microservices\dpchat"
pushd "C:\Users\Mega-Pc\Documents\GitHub\PIDEV-26\BackEnd\Microservices\dpchat" || (echo Failed to cd to "C:\Users\Mega-Pc\Documents\GitHub\PIDEV-26\BackEnd\Microservices\dpchat" & pause & exit /b 1)
timeout /t 7 /nobreak >nul
mvn -q spring-boot:run
echo.
echo [dpchat] stopped. Press any key to close tab.
popd
pause >nul
