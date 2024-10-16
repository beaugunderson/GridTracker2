// Basic regexp that identifies a callsign and any pre- and post-indicators.
const CALLSIGN_REGEXP =
  /^([A-Z0-9]+\/){0,1}([0-9][A-Z]{1,2}[0-9]|[A-Z]{1,2}[0-9])([A-Z0-9]+)(\/[A-Z0-9/]+){0,1}$/
/*
  `^ ... $`
    to ensure the callsign has no extraneous characters

  `( [A-Z0-9]+ \/ ){0,1}`
    to match an optional preindicator, separated by `\/` from the rest of the call

  `( [0-9][A-Z]{1,2}[0-9] | [A-Z]{1,2}[0-9] )`
    to match either number-letter-number, number-letter-letter-number, letter-number and letter-letter-number prefixes

  `( [A-Z0-9]+ )`
    for the rest of the callsign, which must include at least one more letter or digit after the prefix

  `( \/ [A-Z0-9/]+ ){0,1}`
    for a optional list of postindicators separated by `\/` from the rest of the call
 */

const GRID_REGEXP = /^[A-Z]{2}[0-9]{2}$/

function processRosterFiltering(callRoster, rosterSettings)
{
  // First loop, exclude calls, mostly based on "Exceptions" settings
  // this whole section is full of individual if's that could be broken out
  for (const callHash in callRoster)
  {
    let entry = callRoster[callHash];
    let callObj = entry.callObj;
    let call = entry.DEcall;

    entry.tx = true;
    callObj.shouldRosterAlert = false;
    callObj.shouldAudioAlert = false;
    callObj.shouldOAMS = false;
    callObj.AH = {};
    callObj.audioAlertReason = {};

    // The awardReason is the "tooltip" on the callsign in the roster, if we're not award tracking
    // It's always "Callsign"
    callObj.awardReason = "Callsign";
    callObj.awardType = null;

    if (!call || !call.match(CALLSIGN_REGEXP))
    {
      // console.error(`Invalid Callsign ${call}`, entry)
      entry.tx = false
      continue;
    }

    if (CR.rosterSettings.columns.Spot == true)
    {
      callObj.spot = window.opener.getSpotTime(callObj.DEcall + callObj.mode + callObj.band);
      if (CR.rosterSettings.onlySpot == true && (callObj.spot.when == 0 || (timeNowSec() - callObj.spot.when > window.opener.GT.settings.reception.viewHistoryTimeSec)))
      {
        entry.tx = false;
        continue;
      }
    }
    else
    {
      callObj.spot = { when: 0, snr: 0 };
    }
    
    if (rosterSettings.now - callObj.age > CR.rosterSettings.rosterTime)
    {
      entry.tx = false;
      entry.rosterAlerted = false;
      entry.audioAlerted = false;
      callObj.qrz = false;
      callObj.reset = true;
      continue;
    }
    if (!callObj.dxcc)
    {
      entry.tx = false;
      continue;
    }
    if (window.opener.GT.instances[callObj.instance].crEnable == false)
    {
      entry.tx = false;
      continue;
    }
    if (call in CR.ignoredCalls)
    {
      entry.tx = false;
      continue;
    }
    if (entry.DXcall in CR.ignoredCQ || entry.DXcall + ":" + callObj.dxcc in CR.ignoredCQ)
    {
      entry.tx = false;
      continue;
    }
    if (callObj.ituz in CR.ignoredITUz)
    {
      entry.tx = false;
      continue;
    }
    if (callObj.cqz in CR.ignoredCQz)
    {
      entry.tx = false;
      continue;
    }
    if (callObj.dxcc in CR.ignoredDxcc)
    {
      entry.tx = false;
      continue;
    }
    if (callObj.grid in CR.ignoredGrid)
    {
      entry.tx = false;
      continue;
    }
    if (CR.rosterSettings.cqOnly == true)
    {
      if (CR.rosterSettings.wantRRCQ == true)
      {
        if (callObj.RR73 == false && callObj.CQ == false)
        {
          entry.tx = false;
          continue;
        }
      }
      else if (callObj.CQ == false)
      {
        entry.tx = false;
        continue;
      }
    }
    if (CR.rosterSettings.requireGrid == true && callObj.grid.length != 4)
    {
      entry.tx = false;
      continue;
    }
    if (CR.rosterSettings.wantMinDB == true && entry.message.SR < CR.rosterSettings.minDb)
    {
      entry.tx = false;
      continue;
    }
    if (CR.rosterSettings.wantMaxDT == true && Math.abs(entry.message.DT) > CR.rosterSettings.maxDT)
    {
      entry.tx = false;
      continue;
    }
    if (CR.rosterSettings.wantMinFreq == true && entry.message.DF < CR.rosterSettings.minFreq)
    {
      entry.tx = false;
      continue;
    }
    if (CR.rosterSettings.wantMaxFreq == true && entry.message.DF > CR.rosterSettings.maxFreq)
    {
      entry.tx = false;
      continue;
    }

    if (callObj.dxcc == window.opener.GT.myDXCC)
    {
      if (CR.rosterSettings.noMyDxcc == true)
      {
        entry.tx = false;
        continue;
      }
    }
    else if (CR.rosterSettings.onlyMyDxcc == true)
    {
      entry.tx = false;
      continue;
    }

    let usesOneOf = 0;
    let checkUses = 0;

    if (window.opener.GT.settings.callsignLookups.lotwUseEnable == true && CR.rosterSettings.usesLoTW == true)
    {
      checkUses++;
      if (call in window.opener.GT.lotwCallsigns)
      {
        usesOneOf++;
        if (CR.rosterSettings.maxLoTW < 27)
        {
          let months = (CR.day - window.opener.GT.lotwCallsigns[call]) / 30;
          if (months > CR.rosterSettings.maxLoTW)
          {
            usesOneOf--;
          }
        }
      }
    }

    if (window.opener.GT.settings.callsignLookups.eqslUseEnable == true && CR.rosterSettings.useseQSL == true)
    {
      checkUses++;
      if (call in window.opener.GT.eqslCallsigns)
      {
        usesOneOf++;
      }
    }

    if (window.opener.GT.settings.callsignLookups.oqrsUseEnable == true && CR.rosterSettings.usesOQRS == true)
    {
      checkUses++;
      if (call in window.opener.GT.oqrsCallsigns)
      {
        usesOneOf++;
      }
    }

    if (checkUses > 0 && usesOneOf == 0)
    {
      entry.tx = false;
      continue;
    }

    if (rosterSettings.isAwardTracker)
    {
      let tx = false;
      let baseHash = hashMaker(callObj, CR.rosterSettings.referenceNeed);

      for (const award in CR.awardTracker)
      {
        if (CR.awardTracker[award].enable)
        {
          tx = testAward(award, callObj, baseHash);
          if (tx)
          {
            let x = CR.awardTracker[award];

            // TODO: Move award reason out of exclusions code?
            callObj.awardReason = CR.awards[x.sponsor].awards[x.name].tooltip + " (" + CR.awards[x.sponsor].sponsor + ")";
            callObj.awardType = CR.awards[x.sponsor].awards[x.name].rule.type;
            callObj.shouldRosterAlert = true;
            if (window.opener.GT.settings.audioAlerts.wanted.huntAward)
            {
              callObj.AH = { huntAward: 1 };
            }
            break;
          }
        }
      }

      entry.tx = tx;
    }
  }
}
