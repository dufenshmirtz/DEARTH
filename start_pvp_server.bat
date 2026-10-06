@echo off
setlocal
cd /d "%~dp0"

set "NODE_EXE="
set "BUNDLED_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if exist "%BUNDLED_NODE%" set "NODE_EXE=%BUNDLED_NODE%"
if not defined NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE_EXE if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles(x86)%\nodejs\node.exe"
if not defined NODE_EXE if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "NODE_EXE=%LOCALAPPDATA%\Programs\nodejs\node.exe"
if not defined NODE_EXE if exist "%NVM_SYMLINK%\node.exe" set "NODE_EXE=%NVM_SYMLINK%\node.exe"
if not defined NODE_EXE (
  for /f "delims=" %%N in ('where node 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%N"
)

if not defined NODE_EXE (
  echo.
  echo  Node.js was not found on this PC.
  echo  Install the LTS version from https://nodejs.org
  echo  or run:  winget install OpenJS.NodeJS.LTS
  echo  Then close this window and run start_pvp_server.bat again.
  echo.
  pause
  exit /b 1
)

echo Using Node: %NODE_EXE%
"%NODE_EXE%" "%~dp0server.js"
pause
