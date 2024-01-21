Outfile "DockerInstaller.exe"
InstallDir $PROGRAMFILES\IMOS\Apps\DockerApp

# Specify the icon file
Icon ".\docker-app\3689119.ico"

# Request user agreement
Page license
LicenseData ".\license.txt"
Page instfiles

Section
    ; Set the installation directory
    SetOutPath "$INSTDIR"

    ; Create the installation directory if it doesn't exist
    CreateDirectory $INSTDIR

    ; Copy Docker container files to the installation directory
    File /r /x *.dockerignore /x node_modules "docker-app\*.*"

    ; Change working directory to the Docker directory
    Push "$INSTDIR\docker-app"

    ; Execute Docker build command
    ExecWait 'docker build -t docker-app "$INSTDIR"'

SectionEnd
