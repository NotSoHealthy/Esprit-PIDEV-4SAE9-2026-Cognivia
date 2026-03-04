@echo off
title SurveillanceAndEquipment
echo [SurveillanceAndEquipment] cd "D:\Files\Uni\PIDEV 26\PIDEV-26\BackEnd\Microservices\SurveillanceAndEquipment"
pushd "D:\Files\Uni\PIDEV 26\PIDEV-26\BackEnd\Microservices\SurveillanceAndEquipment" || (echo Failed to cd to "D:\Files\Uni\PIDEV 26\PIDEV-26\BackEnd\Microservices\SurveillanceAndEquipment" & pause & exit /b 1)
timeout /t 7 /nobreak >nul
mvn -q spring-boot:run
echo.
echo [SurveillanceAndEquipment] stopped. Press any key to close tab.
popd
pause >nul
