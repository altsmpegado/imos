; installer.nsi

Outfile "DockerInstaller.exe"
RequestExecutionLevel user

Section

; Set the installation directory
SetOutPath "$INSTDIR"

; Copy Docker container files to the installation directory
File /r /x *.dockerignore /x node_modules "docker-app\*.*"

; Execute Docker build command
ExecWait 'docker build -t docker-app "$INSTDIR"'

SectionEnd
