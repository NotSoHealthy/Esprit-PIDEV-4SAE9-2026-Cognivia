@echo off
title SurveillanceAndEquipment
echo [SurveillanceAndEquipment] cd "C:\Users\elite\Desktop\Work\PIDEV-26\BackEnd\Microservices\surveillance-and-equipment"
pushd "C:\Users\elite\Desktop\Work\PIDEV-26\BackEnd\Microservices\surveillance-and-equipment" || (echo Failed to cd to "C:\Users\elite\Desktop\Work\PIDEV-26\BackEnd\Microservices\surveillance-and-equipment" & pause & exit /b 1)
timeout /t 7 /nobreak >nul
mvn -q spring-boot:run
echo.
echo [SurveillanceAndEquipment] stopped. Press any key to close tab.
popd
pause >nul
