Outfile "imos-datavis-app-installer.exe"
# InstallDir $PROGRAMFILES\IMOS\Apps\DataVisApp
InstallDir "C:\imos\Apps\DataVisApp"
Name "Data Vision App"

# Specify the icon file
Icon ".\imos-datavisapp\logo.ico"

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
    File /r /x *.gitignore "imos-datavisapp\*.*"

    Push "$INSTDIR\imos-datavisapp"

    # Execute Docker build command
    # ExecWait 'docker compose -p imos-datavisapp up --no-start'
    ExecWait '"$INSTDIR\build_images.bat"'

SectionEnd

# Fix non safe execution of the installer.
# License agreement, terms and conditions, including restrictions on sharing or reselling the installer.