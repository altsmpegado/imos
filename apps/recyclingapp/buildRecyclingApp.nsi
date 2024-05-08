Outfile "imos-recycling-app-installer.exe"
InstallDir "C:\imos\Apps\RecyclingApp"
Name "Recycling App"

# Specify the icon file
Icon ".\imos-recyclingapp\logo.ico"

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
    File /r /x *.dockerignore /x node_modules "imos-recyclingapp\*.*"

    # Change working directory to the Docker directory
    Push "$INSTDIR\imos-recyclingapp"

    # Execute Docker build command
    ExecWait '"$INSTDIR\build_images.bat"'

SectionEnd

# Fix non safe execution of the installer.
# License agreement, terms and conditions, including restrictions on sharing or reselling the installer.