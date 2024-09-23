function prepareRosterSettings()
{
  let rosterSettings = {
    bands: {},
    modes: {},
    callMode: CR.rosterSettings.callsign,
    onlyHits: false,
    isAwardTracker: false,
    now: timeNowSec()
  }

  if (rosterSettings.callMode == "hits")
  {
    rosterSettings.callMode = "all"
    rosterSettings.onlyHits = true;
  }
  if (referenceNeed.value == LOGBOOK_AWARD_TRACKER)
  {
    rosterSettings.callMode = "all";
    rosterSettings.onlyHits = false;
    rosterSettings.isAwardTracker = true;
    CR.rosterSettings.huntNeed = huntNeed.value = "confirmed";
  }
  // this appears to be determine if we should show the OAMS column
  // if the user is not in offline mode and has OAMS enabled, this could
  // be it's own function maybe?
  rosterSettings.canMsg =
    window.opener.GT.mapSettings.offlineMode == false &&
    window.opener.GT.appSettings.gtShareEnable == true &&
    window.opener.GT.appSettings.gtMsgEnable == true;

  if (CR.rosterSettings.huntNeed == "mixed")
  {
    rosterSettings.huntIndex = CR.tracker.confirmed;
    rosterSettings.workedIndex = CR.tracker.worked;
    rosterSettings.layeredMode = LAYERED_MODE_FOR[String(CR.rosterSettings.reference)];
  }
  else if (CR.rosterSettings.huntNeed == "worked")
  {
    rosterSettings.huntIndex = CR.tracker.worked;
    rosterSettings.workedIndex = false;
    rosterSettings.layeredMode = false;
  }
  else if (CR.rosterSettings.huntNeed == "confirmed")
  {
    rosterSettings.huntIndex = CR.tracker.confirmed;
    rosterSettings.workedIndex = CR.tracker.worked;
    rosterSettings.layeredMode = false;
  }
  else
  {
    console.log("Invalid/Unknown huntNeed");
    rosterSettings.huntIndex = false;
    rosterSettings.workedIndex = false;
    rosterSettings.layeredMode = false;
  }

  return rosterSettings;
}
