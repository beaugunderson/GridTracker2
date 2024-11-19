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

  if (GT.activeRoster.logbook.referenceNeed == LOGBOOK_AWARD_TRACKER)
  {
    rosterSettings.onlyHits = false;
    rosterSettings.isAwardTracker = true;
  }

  if (GT.activeRoster.logbook.huntNeed == "mixed")
  {
    rosterSettings.huntIndex = CR.tracker.confirmed;
    rosterSettings.workedIndex = CR.tracker.worked;
    rosterSettings.layeredMode = LAYERED_MODE_FOR[GT.activeRoster.logbook.referenceNeed];
  }
  else if (GT.activeRoster.logbook.huntNeed == "worked")
  {
    rosterSettings.huntIndex = CR.tracker.worked;
    rosterSettings.workedIndex = false;
    rosterSettings.layeredMode = false;
  }
  else if (GT.activeRoster.logbook.huntNeed == "confirmed")
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
