@echo off
setlocal EnableExtensions
cd /d "%~dp0"

REM ---- EDIT THESE FOLDERS (relative to this .bat) ----
set "EUREKA_DIR=BackEnd\eureka"
set "GATEWAY_DIR=BackEnd\gateway"
set "CARE_DIR=BackEnd\Microservices\care"
set "FORUM_DIR=BackEnd\Microservices\forum-service"
set "DPCHAT_DIR=BackEnd\Microservices\dpchat"
set "MON_DIR=BackEnd\Microservices\monitoring"
set "SAE_DIR=BackEnd\Microservices\surveillance-and-equipment"
set "GAM_DIR=BackEnd\Microservices\games"
set "PHARMACY_DIR=BackEnd\Microservices\pharmacy"
set "APPOINTMENT_DIR=BackEnd\Microservices\appointment-service"
set "NOTIFICATION_DIR=BackEnd\Microservices\notifications"
set "FRONTEND_DIR=FrontEnd\pidev-26"
REM ----------------------------------------------------

where wt >nul 2>nul
if errorlevel 1 (
  echo [ERROR] wt.exe not found. Install Windows Terminal.
  pause
  exit /b 1
)

REM Validate directories
if not exist "%CD%\%EUREKA_DIR%\" (echo [ERROR] Missing: %CD%\%EUREKA_DIR% & pause & exit /b 1)
if not exist "%CD%\%GATEWAY_DIR%\" (echo [ERROR] Missing: %CD%\%GATEWAY_DIR% & pause & exit /b 1)
if not exist "%CD%\%CARE_DIR%\" (echo [ERROR] Missing: %CD%\%CARE_DIR% & pause & exit /b 1)
if not exist "%CD%\%FORUM_DIR%\" (echo [ERROR] Missing: %CD%\%FORUM_DIR% & pause & exit /b 1)
if not exist "%CD%\%DPCHAT_DIR%\" (echo [ERROR] Missing: %CD%\%DPCHAT_DIR% & pause & exit /b 1)
if not exist "%CD%\%MON_DIR%\" (echo [ERROR] Missing: %CD%\%MON_DIR% & pause & exit /b 1)
if not exist "%CD%\%SAE_DIR%\" (echo [ERROR] Missing: %CD%\%SAE_DIR% & pause & exit /b 1)
if not exist "%CD%\%GAM_DIR%\" (echo [ERROR] Missing: %CD%\%GAM_DIR% & pause & exit /b 1)
if not exist "%CD%\%PHARMACY_DIR%\" (echo [ERROR] Missing: %CD%\%PHARMACY_DIR% & pause & exit /b 1)
if not exist "%CD%\%APPOINTMENT_DIR%\" (echo [ERROR] Missing: %CD%\%APPOINTMENT_DIR% & pause & exit /b 1)
if not exist "%CD%\%NOTIFICATION_DIR%\" (echo [ERROR] Missing: %CD%\%NOTIFICATION_DIR% & pause & exit /b 1)
if not exist "%CD%\%FRONTEND_DIR%\" (echo [ERROR] Missing: %CD%\%FRONTEND_DIR% & pause & exit /b 1)

REM Create runner scripts in a stable folder next to this .bat (not TEMP)
set "RUNDIR=%CD%\run-tabs"
if not exist "%RUNDIR%" mkdir "%RUNDIR%"

call :writeRunner     "%RUNDIR%\eureka.cmd"                   "eureka"                    "%CD%\%EUREKA_DIR%"     0
call :writeRunner     "%RUNDIR%\gateway.cmd"                  "gateway"                   "%CD%\%GATEWAY_DIR%"    5
call :writeRunner     "%RUNDIR%\care.cmd"                     "care"                      "%CD%\%CARE_DIR%"       7
call :writeRunner     "%RUNDIR%\forum.cmd"                    "forum"                     "%CD%\%FORUM_DIR%"      7
call :writeRunner     "%RUNDIR%\dpchat.cmd"                   "dpchat"                    "%CD%\%DPCHAT_DIR%"     7
call :writeRunner     "%RUNDIR%\monitoring.cmd"               "monitoring"                "%CD%\%MON_DIR%"        7
call :writeRunner     "%RUNDIR%\SurveillanceAndEquipment.cmd" "SurveillanceAndEquipment"  "%CD%\%SAE_DIR%"        7
call :writeRunner     "%RUNDIR%\Games.cmd"                    "Games"                     "%CD%\%GAM_DIR%"        7
call :writeRunner     "%RUNDIR%\pharmacy.cmd"                 "pharmacy"                  "%CD%\%PHARMACY_DIR%"   7
call :writeRunner     "%RUNDIR%\appointment.cmd"              "appointment"               "%CD%\%APPOINTMENT_DIR%"   7
call :writeRunner     "%RUNDIR%\notifications.cmd"              "notifications"               "%CD%\%NOTIFICATION_DIR%"  7
call :writeFrontend   "%RUNDIR%\frontend.cmd"                 "frontend"                  "%CD%\%FRONTEND_DIR%"

REM Start ONE Windows Terminal window with tabs
wt -w 0 ^
  new-tab --title "eureka"                     cmd /k "%RUNDIR%\eureka.cmd" ^
  ; new-tab --title "gateway"                  cmd /k "%RUNDIR%\gateway.cmd" ^
  ; new-tab --title "care"                     cmd /k "%RUNDIR%\care.cmd" ^
  ; new-tab --title "forum"                    cmd /k "%RUNDIR%\forum.cmd" ^
  ; new-tab --title "dpchat"                   cmd /k "%RUNDIR%\dpchat.cmd" ^
  ; new-tab --title "monitoring"               cmd /k "%RUNDIR%\monitoring.cmd" ^
  ; new-tab --title "SurveillanceAndEquipment" cmd /k "%RUNDIR%\SurveillanceAndEquipment.cmd" ^
  ; new-tab --title "Games"                    cmd /k "%RUNDIR%\Games.cmd" ^
  ; new-tab --title "pharmacy"                 cmd /k "%RUNDIR%\pharmacy.cmd" ^
  ; new-tab --title "appointment"              cmd /k "%RUNDIR%\appointment.cmd" ^
  ; new-tab --title "notifications"              cmd /k "%RUNDIR%\notifications.cmd" ^
  ; new-tab --title "frontend"                 cmd /k "%RUNDIR%\frontend.cmd"

exit /b 0

:writeRunner
set "FILE=%~1"
set "TITLE=%~2"
set "DIR=%~3"
set "DELAY=%~4"

> "%FILE%"  echo @echo off
>>"%FILE%"  echo title %TITLE%
>>"%FILE%"  echo echo [%TITLE%] cd "%DIR%"
>>"%FILE%"  echo pushd "%DIR%" ^|^| ^(echo Failed to cd to "%DIR%" ^& pause ^& exit /b 1^)
if not "%DELAY%"=="0" (
>>"%FILE%"  echo timeout /t %DELAY% /nobreak ^>nul
)
>>"%FILE%"  echo mvn -q spring-boot:run
>>"%FILE%"  echo echo.
>>"%FILE%"  echo echo [%TITLE%] stopped. Press any key to close tab.
>>"%FILE%"  echo popd
>>"%FILE%"  echo pause ^>nul
exit /b 0

:writeFrontend
set "FILE=%~1"
set "TITLE=%~2"
set "DIR=%~3"

> "%FILE%"  echo @echo off
>>"%FILE%"  echo title %TITLE%
>>"%FILE%"  echo echo [%TITLE%] cd "%DIR%"
>>"%FILE%"  echo pushd "%DIR%" ^|^| ^(echo Failed to cd to "%DIR%" ^& pause ^& exit /b 1^)
>>"%FILE%"  echo ng serve
>>"%FILE%"  echo echo.
>>"%FILE%"  echo echo [%TITLE%] stopped. Press any key to close tab.
>>"%FILE%"  echo popd
>>"%FILE%"  echo pause ^>nul
exit /b 0