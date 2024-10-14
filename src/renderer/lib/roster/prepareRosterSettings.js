function prepareRosterSettings()
{
  let rosterSettings = {
    bands: {},
    modes: {},
    onlyHits: CR.rosterSettings.onlyHits,
    canMsg: window.opener.oamsCanMsg(),
    isAwardTracker: false,
    now: timeNowSec()
  }

  if (referenceNeed.value == LOGBOOK_AWARD_TRACKER)
  {
    rosterSettings.onlyHits = false;
    rosterSettings.isAwardTracker = true;
    CR.rosterSettings.huntNeed = huntNeed.value = "confirmed";
  }

  if (CR.rosterSettings.huntNeed == "mixed")
  {
    rosterSettings.huntIndex = CR.tracker.confirmed;
    rosterSettings.workedIndex = CR.tracker.worked;
    rosterSettings.layeredMode = LAYERED_MODE_FOR[CR.rosterSettings.referenceNeed];
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
