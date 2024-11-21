!include MUI2.nsh

!macro customInstall
  WriteRegStr HKCU "Software\Microsoft\Windows NT\CurrentVersion\AppCompatFlags\Layers" "$INSTDIR\GridTracker2.exe" '~ GDIDPISCALING DPIUNAWARE'
!macroend