; installer.nsi

Outfile "DockerInstaller.exe"
InstallDir $PROGRAMFILES\YourApp

Section

; Set the installation directory
SetOutPath "$INSTDIR"

; Copy Docker container files to the installation directory
File /r /x *.dockerignore /x node_modules "docker-app\*.*"

Push "$INSTDIR\docker-app"
; Execute Docker build command
ExecWait 'docker build -t docker-app "$INSTDIR"'

SectionEnd
