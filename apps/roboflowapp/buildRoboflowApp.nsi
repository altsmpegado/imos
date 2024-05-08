Outfile "imos-roboflow-app-installer.exe"
; InstallDir $PROGRAMFILES\IMOS\Apps\RoboflowApp
InstallDir "C:\imos\Apps\RoboflowApp"
Name "Roboflow App"

# Specify the icon file
Icon ".\imos-roboflowapp\logo.ico"

# Request user agreement
Page license
LicenseData ".\license.txt"
Page instfiles

Section
    # Set the installation directory
    SetOutPath "$INSTDIR"

    # Create the installation directory if it doesn't exist
    CreateDirectory $INSTDIR

    # Copy Docker container files to the installation directory
    File /r /x *.dockerignore /x node_modules "imos-roboflowapp\*.*"

    # Change working directory to the Docker directory
    Push "$INSTDIR\imos-roboflowapp"

    # Execute Docker build command
    ExecWait 'docker build -t imos-roboflowapp "$INSTDIR"'

SectionEnd

# Fix non safe execution of the installer.
# License agreement, terms and conditions, including restrictions on sharing or reselling the installer.