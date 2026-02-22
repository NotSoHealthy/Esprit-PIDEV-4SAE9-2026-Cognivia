@echo off
setlocal EnableExtensions
cd /d "%~dp0"

REM ---- EDIT THESE FOLDERS (relative to this .bat) ----
set "EUREKA_DIR=eureka"
set "GATEWAY_DIR=gateway"
set "CARE_DIR=Microservices\care"
set "FORUM_DIR=Microservices\forum-service"
set "MON_DIR=Microservices\monitoring"
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
if not exist "%CD%\%MON_DIR%\" (echo [ERROR] Missing: %CD%\%MON_DIR% & pause & exit /b 1)

REM Create runner scripts in a stable folder next to this .bat (not TEMP)
set "RUNDIR=%CD%\run-tabs"
if not exist "%RUNDIR%" mkdir "%RUNDIR%"

call :writeRunner "%RUNDIR%\eureka.cmd" "eureka" "%CD%\%EUREKA_DIR%" 0
call :writeRunner "%RUNDIR%\gateway.cmd" "gateway" "%CD%\%GATEWAY_DIR%" 5
call :writeRunner "%RUNDIR%\care.cmd" "care" "%CD%\%CARE_DIR%" 7
call :writeRunner "%RUNDIR%\forum.cmd" "forum" "%CD%\%FORUM_DIR%" 7
call :writeRunner "%RUNDIR%\monitoring.cmd" "monitoring" "%CD%\%MON_DIR%" 7

REM Start ONE Windows Terminal window with tabs
wt -w 0 ^
  new-tab --title "eureka"       cmd /k "%RUNDIR%\eureka.cmd" ^
  ; new-tab --title "gateway"    cmd /k "%RUNDIR%\gateway.cmd" ^
  ; new-tab --title "care"       cmd /k "%RUNDIR%\care.cmd" ^
  ; new-tab --title "forum"      cmd /k "%RUNDIR%\forum.cmd" ^
  ; new-tab --title "monitoring" cmd /k "%RUNDIR%\monitoring.cmd"

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