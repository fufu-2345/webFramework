@echo off
call npm install
cd apps\front
call npm install
cd ..\apps\back
call npm install
cd ..\..
call code .
echo.
echo.
echo ** you can close this page **
echo.