Outfile "ExampleInstaller.exe"
InstallDir $PROGRAMFILES\IMOS\Apps\ExampleApp

# Specify the icon file
Icon ".\docker-app-local\3689119.ico"

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
    File /r /x *.dockerignore /x node_modules "docker-app-local\*.*"

    ; Change working directory to the Docker directory
    Push "$INSTDIR\imos-example-app"

    ; Execute Docker build command
    ExecWait 'docker build -t imos-example-app "$INSTDIR"'

SectionEnd

# Fix non safe execution of the installer.
# License agreement, terms and conditions, including restrictions on sharing or reselling the installer.