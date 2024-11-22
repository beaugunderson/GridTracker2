!include "MUI2.nsh"

!macro preInit

  ${if} ${Silent}
    Banner::show /set 76 "Please wait..." "Installing update"
  ${endIf}

!macroEnd

!macro customInstall

  WriteRegStr HKCU "Software\Microsoft\Windows NT\CurrentVersion\AppCompatFlags\Layers" "$INSTDIR\GridTracker2.exe" '~ GDIDPISCALING DPIUNAWARE'

!macroEnd