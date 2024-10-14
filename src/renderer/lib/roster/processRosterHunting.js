
const AWT_MAP = {
  call: "Callsign",
  calls2band: "Callsign",
  calls2dxcc: "Callsign",
  grids: "Grid",
  dxcc2band: "DXCC",
  dxcc: "DXCC",
  states: "State",
  states2band: "State",
  cnty: "County",
  cqz: "CQz",
  px: "PX",
  pxplus: "PX",
  cont: "Cont",
  cont2band: "Cont",
  cont52band: "Cont"
};

const AWARD_HUNT_EMPTY = {
  Callsign: false,
  QRZ: false,
  OAMS: false,
  Grid: false,
  DXCC: false,
  Marathon: false,
  State: false,
  County: false,
  POTA: false,
  CQz: false,
  ITUz: false,
  PX: false,
  Cont: false,
  Watcher: false
};

const kInversionAlpha = "DD";
const kRow = "#000000";
const kBold = "#000000;font-weight: bold;";
const kUnconf = "background-clip:padding-box;box-shadow: 0 0 7px 3px inset ";
const kLayeredAlpha = "77";
const kLayeredInversionAlpha = "66";
const kLayeredUnconf = "background-clip:padding-box;box-shadow: 0 0 4px 2px inset ";
const kLayeredUnconfAlpha = "AA";

function processRosterHunting(callRoster, rosterSettings, awardTracker)
{
  // these lets, do they rely on anything between the top and here?
  // if not could they be put in the let list at the beginning?
  let hasGtPin = false;
  const currentYear = new Date().getFullYear();
  const currentYearSuffix = `&rsquo;${currentYear - 2000}`;
  const potaEnabled = (window.opener.GT.settings.app.potaEnabled == 1 && window.opener.GT.settings.map.offlineMode == false);
  // TODO: Hunting results might be used to filter, based on the "Callsigns: Only Wanted" option,
  //       so maybe we can move this loop first, and add a check to the filtering loop?
  
  let isAwardTracker = (CR.rosterSettings.referenceNeed == LOGBOOK_AWARD_TRACKER);
  let hunt = {};
  if (!isAwardTracker)
  {
    hunt = {
      Callsign: huntCallsign.checked,
      QRZ: huntQRZ.checked,
      OAMS: huntOAMS.checked,
      Grid: huntGrid.checked,
      DXCC: huntDXCC.checked,
      Marathon: huntMarathon.checked,
      State: huntState.checked,
      County: huntCounty.checked,
      POTA: huntPOTA.checked,
      CQz: huntCQz.checked,
      ITUz: huntITUz.checked,
      PX: huntPX.checked,
      Cont: huntCont.checked,
      Watcher: huntWatcher.checked
    };
  }

 
  // Second loop, hunting and highlighting
  for (const callHash in callRoster)
  {
    let entry = callRoster[callHash];
    let callObj = entry.callObj;

    // Special case check for called station
    if (callObj.qrz == true && entry.tx == false)
    {
      // The instance has to be enabled
      if (window.opener.GT.instances[callObj.instance].crEnable == true)
      {
        // Calling us, but we wouldn't normally display
        // If they are not ignored or we're in a QSO with them, let it through

        // TODO: This is here because it's after the filtering stage
        if ((!(entry.DEcall in CR.ignoredCalls) && !(callObj.dxcc in CR.ignoredDxcc) && !(callObj.grid in CR.ignoredGrid)) ||
          window.opener.GT.instances[callObj.instance].status.DXcall == entry.DEcall)
        {
          entry.tx = true;
        }
      }
    }

    // Only render entries with `tx == true`, ignore the rest
    if (entry.tx == true)
    {
      // In layered mode ("Hunting: mixed") the workHashSuffix becomes a more stricter 'live band',
      // while the layered suffix is a broader 'mixed band'
      let workHashSuffix, layeredHashSuffix;
      if (rosterSettings.layeredMode)
      {
        workHashSuffix = hashMaker(callObj, rosterSettings.layeredMode);
        layeredHashSuffix = hashMaker(callObj, CR.rosterSettings.referenceNeed);
      }
      else
      {
        workHashSuffix = hashMaker(callObj, CR.rosterSettings.referenceNeed);
        layeredHashSuffix = false;
      }
      let workHash = workHashSuffix; // TODO: Remove after replacing all occurrences with Suffix

      let callsign = entry.DEcall;

      callObj.hunting = {};
      callObj.callFlags = {};
      callObj.style = callObj.style || {};
      callObj.DEcallHTML = null;
      callObj.DXcallHTML = null;
      callObj.msgHTML = null;
      callObj.gridHTML = null;

      let colorObject = {};

      let callPointer = (callObj.CQ == true) ? "cursor:pointer" : "";

      let call = "#FFFF00";
      let grid = "#00FFFF";
      let calling = "#90EE90";
      let dxcc = "#FFA500";
      let state = "#90EE90";
      let cnty = "#CCDD00";
      let cont = "#00DDDD";
      let pota = "#fbb6fc";
      let cqz = "#DDDDDD";
      let ituz = "#DDDDDD";
      let wpx = "#FFFF00";

      hasGtPin = false;
      let shouldAlert = false;
      let callBg, gridBg, callingBg, dxccBg, stateBg, cntyBg, contBg, potaBg, cqzBg, ituzBg, wpxBg;
      let callConf, gridConf, callingConf, dxccConf, stateConf, cntyConf, contConf, potaConf, cqzConf, ituzConf, wpxConf;

      callBg = gridBg = callingBg = dxccBg = stateBg = cntyBg = contBg = potaBg = cqzBg = ituzBg = wpxBg = kRow;
      callConf = gridConf = callingConf = dxccConf = stateConf = cntyConf = contConf = potaConf = cqzConf = ituzConf = wpxConf = "";

      let cntyPointer = (callObj.cnty && callObj.qual == false) ? "cursor: pointer;" : "";
      let didWork = false;
      let hash = callsign + workHashSuffix;

      // Call worked in current logbook settings, regardless of hunting mode
      if (hash in CR.tracker.worked.call)
      {
        callObj.callFlags.worked = true;
        didWork = true;
        callConf = `${kUnconf}${call}${kInversionAlpha};`;

        if (hash in CR.tracker.confirmed.call)
        {
          callObj.callFlags.confirmed = true;
          callPointer = "text-decoration: line-through;";
          callConf = "";
        }
      }

      // Calls that have OAMS chat support
      if (callsign in window.opener.GT.gtCallsigns)
      {
        callObj.gt = 0;
        for (const cid in window.opener.GT.gtCallsigns[callsign])
        {
          if (cid in window.opener.GT.gtFlagPins && window.opener.GT.gtFlagPins[cid].canmsg == true)
          {
            callObj.callFlags.oams = true;
            callObj.gt = cid;
            hasGtPin = true;
            if (window.opener.GT.gtFlagPins[cid].src == "GT")
            {
              // a GT user, lets go with it
              break;
            }
          }
        }
      }
      else
      {
        callObj.gt = 0;
      }

    
      // Just All Traffic and Awards now, yay!
      {
        // Skip when "only new calls"
        // Questions: Move to the first loop? 
        if (allOnlyNew.checked == true && didWork && callObj.qrz == false)
        {
          entry.tx = false;
          continue;
        }
        // Special Calls
        if (callObj.DEcall.match("^[A-Z][0-9][A-Z](/w+)?$"))
        {
          callObj.style.call = "class='oneByOne'";
        }

        // Entries currently calling or being called by us
        if (callObj.DEcall == window.opener.GT.instances[callObj.instance].status.DXcall)
        {
          if (window.opener.GT.instances[callObj.instance].status.TxEnabled == 1)
          {
            callObj.hunting.call = "calling";
            callObj.style.call = "class='dxCalling'";
          }
          else
          {
            callObj.hunting.call = "caller";
            callObj.style.call = "class='dxCaller'";
          }
        }

        if (isAwardTracker)
        {
          hunt = { ...AWARD_HUNT_EMPTY };
          if (callObj.awardType in AWT_MAP)
          {
            hunt[AWT_MAP[callObj.awardType]] = true;
          }
          hunt.QRZ = huntQRZ.checked;
          hunt.Watcher = huntWatcher.checked;
        }

        // Hunting for callsigns
        if (hunt.Callsign)
        {
          let hash = callsign + workHashSuffix;
          let layeredHash = rosterSettings.layeredMode && (callsign + layeredHashSuffix);

          if (rosterSettings.huntIndex && !(hash in rosterSettings.huntIndex.call))
          {
            shouldAlert ||= true;
            callObj.reason.push("call");

            if (rosterSettings.workedIndex && hash in rosterSettings.workedIndex.call)
            {
              if (rosterSettings.layeredMode && layeredHash in rosterSettings.huntIndex.call)
              {
                callObj.hunting.call = "worked-and-mixed";
                callConf = `${kLayeredUnconf}${call}${kLayeredUnconfAlpha};`;
                callBg = `${call}${kLayeredInversionAlpha}`;
                call = kBold;
              }
              else
              {
                callObj.hunting.call = "worked";
                callConf = `${kUnconf}${call}${kInversionAlpha};`;
              }
            }
            else
            {
              if (rosterSettings.layeredMode && layeredHash in rosterSettings.huntIndex.call)
              {
                callObj.hunting.call = "mixed";
                callBg = `${call}${kLayeredAlpha};`;
                call = kBold;
              }
              else if (rosterSettings.layeredMode && layeredHash in rosterSettings.workedIndex.call)
              {
                callObj.hunting.call = "mixed-worked";
                callConf = `${kUnconf}${call}${kLayeredAlpha};`;
              }
              else
              {
                callObj.hunting.call = "hunted";
                callBg = `${call}${kInversionAlpha};`;
                call = kBold;
              }
            }
          }
        }

        if (hunt.Watcher)
        {
          shouldAlert ||= processWatchers(callObj);
        }

        // Hunting for "stations calling you"
        if (hunt.QRZ && callObj.qrz == true)
        {
          callObj.callFlags.calling = true
          callObj.hunting.qrz = "hunted";
          shouldAlert = true;
          callObj.reason.push("qrz");
        }

        // Hunting for stations with OAMS
        if (hunt.OAMS && hasGtPin == true)
        {
          callObj.hunting.oams = "hunted";
          shouldAlert = true;
          callObj.reason.push("oams");
        }

        // Hunting for grids
        if (hunt.Grid && callObj.grid.length > 1)
        {
          let hash = callObj.grid.substr(0, 4) + workHashSuffix;
          let layeredHash = rosterSettings.layeredMode && (callObj.grid.substr(0, 4) + layeredHashSuffix)

          if (rosterSettings.huntIndex && !(hash in rosterSettings.huntIndex.grid))
          {
            shouldAlert = true;
            callObj.reason.push("grid");

            if (rosterSettings.workedIndex && hash in rosterSettings.workedIndex.grid)
            {
              if (rosterSettings.layeredMode && layeredHash in rosterSettings.huntIndex.grid)
              {
                callObj.hunting.grid = "worked-and-mixed";
                gridConf = `${kLayeredUnconf}${grid}${kLayeredUnconfAlpha};`;
                gridBg = `${grid}${kLayeredInversionAlpha}`;
                grid = kBold;
              }
              else
              {
                callObj.hunting.grid = "worked";
                gridConf = `${kUnconf}${grid}${kInversionAlpha};`;
              }
            }
            else
            {
              if (rosterSettings.layeredMode && layeredHash in rosterSettings.huntIndex.grid)
              {
                callObj.hunting.grid = "mixed";
                gridBg = `${grid}${kLayeredAlpha};`;
                grid = kBold;
              }
              else if (rosterSettings.layeredMode && layeredHash in rosterSettings.workedIndex.grid)
              {
                callObj.hunting.grid = "mixed-worked";
                gridConf = `${kUnconf}${grid}${kLayeredAlpha};`;
              }
              else
              {
                callObj.hunting.grid = "hunted";
                gridBg = `${grid}${kInversionAlpha};`;
                grid = kBold;
              }
            }
          }
        }

        // Hunting for DXCC
        if (hunt.DXCC)
        {
          let hash = String(callObj.dxcc) + "|" + workHashSuffix;
          let layeredHash = rosterSettings.layeredMode && (String(callObj.dxcc) + "|" + layeredHashSuffix)

          if (rosterSettings.huntIndex && !(hash in rosterSettings.huntIndex.dxcc))
          {
            shouldAlert = true;
            callObj.reason.push("dxcc");

            if (rosterSettings.workedIndex && hash in rosterSettings.workedIndex.dxcc)
            {
              if (rosterSettings.layeredMode && layeredHash in rosterSettings.huntIndex.dxcc)
              {
                callObj.hunting.dxcc = "worked-and-mixed";
                dxccConf = `${kLayeredUnconf}${dxcc}${kLayeredUnconfAlpha};`;
                dxccBg = `${dxcc}${kLayeredInversionAlpha}`;
                dxcc = kBold;
              }
              else
              {
                callObj.hunting.dxcc = "worked";
                dxccConf = `${kUnconf}${dxcc}${kInversionAlpha};`;
              }
            }
            else
            {
              if (rosterSettings.layeredMode && layeredHash in rosterSettings.huntIndex.dxcc)
              {
                callObj.hunting.dxcc = "mixed";
                dxccBg = `${dxcc}${kLayeredAlpha};`;
                dxcc = kBold;
              }
              else if (rosterSettings.layeredMode && layeredHash in rosterSettings.workedIndex.dxcc)
              {
                callObj.hunting.dxcc = "mixed-worked";
                dxccConf = `${kUnconf}${dxcc}${kLayeredAlpha};`;
              }
              else
              {
                callObj.hunting.dxcc = "hunted";
                dxccBg = `${dxcc}${kInversionAlpha};`;
                dxcc = kBold;
              }
            }
          }

          callObj.dxccSuffix = null
          if (hunt.Marathon && callObj.hunting.dxcc != "hunted" && callObj.hunting.dxcc != "checked")
          {
            callObj.reason.push("dxcc-marathon");

            let hash = `${callObj.dxcc}-${currentYear}`;
            if (rosterSettings.huntIndex && !(hash in rosterSettings.huntIndex.dxcc))
            {
              if (!rosterSettings.workedIndex || !(hash in rosterSettings.workedIndex.dxcc))
              {
                callObj.dxccSuffix = currentYearSuffix;

                callObj.hunting.dxccMarathon = "hunted";
                if (!callObj.hunting.dxcc)
                {
                  dxccConf = `${kUnconf}${dxcc}${kLayeredAlpha};`;
                }
              }
            }
          }
        }

        // Hunting for Known States
        if (hunt.State)
        {
          let stateSearch = callObj.state;
          if (stateSearch in window.opener.GT.StateData)
          {
            let hash = stateSearch + workHashSuffix;
            let layeredHash = rosterSettings.layeredMode && (stateSearch + layeredHashSuffix)

            if (rosterSettings.huntIndex && !(hash in rosterSettings.huntIndex.state))
            {
              shouldAlert = true;
              callObj.reason.push("state");

              if (rosterSettings.workedIndex && hash in rosterSettings.workedIndex.state)
              {
                if (rosterSettings.layeredMode && layeredHash in rosterSettings.huntIndex.state)
                {
                  callObj.hunting.state = "worked-and-mixed";
                  stateConf = `${kLayeredUnconf}${state}${kLayeredUnconfAlpha};`;
                  stateBg = `${state}${kLayeredInversionAlpha}`;
                  state = kBold;
                }
                else
                {
                  callObj.hunting.state = "worked";
                  stateConf = `${kUnconf}${state}${kInversionAlpha};`;
                }
              }
              else
              {
                if (rosterSettings.layeredMode && layeredHash in rosterSettings.huntIndex.state)
                {
                  callObj.hunting.state = "mixed";
                  stateBg = `${state}${kLayeredAlpha};`;
                  state = kBold;
                }
                else if (rosterSettings.layeredMode && layeredHash in rosterSettings.workedIndex.state)
                {
                  callObj.hunting.state = "mixed-worked";
                  stateConf = `${kUnconf}${state}${kLayeredAlpha};`;
                }
                else
                {
                  callObj.hunting.state = "hunted";
                  stateBg = `${state}${kInversionAlpha};`;
                  state = kBold;
                }
              }
            }
          }
        }

        // Hunting for US Counties
        if (hunt.County && window.opener.GT.settings.callsignLookups.ulsUseEnable == true)
        {
          let finalDxcc = callObj.dxcc;
          if (callObj.cnty && (finalDxcc == 291 || finalDxcc == 110 || finalDxcc == 6 || finalDxcc == 202) && callObj.cnty.length > 0)
          {
            let hash = callObj.cnty + (rosterSettings.layeredMode ? layeredHashSuffix : workHashSuffix);

            if ((rosterSettings.huntIndex && !(hash in rosterSettings.huntIndex.cnty)) || callObj.qual == false)
            {
              if (callObj.qual == false)
              {
                let counties = window.opener.GT.zipToCounty[callObj.zipcode];
                let foundHit = false;
                for (const cnt in counties)
                {
                  let hh = counties[cnt] + workHash;
                  callObj.cnty = counties[cnt];
                  if (rosterSettings.huntIndex && !(hh in rosterSettings.huntIndex.cnty))
                  {
                    foundHit = true;
                    break;
                  }
                }
                if (foundHit) shouldAlert = true;
              }
              else
              {
                shouldAlert = true;
              }

              if (shouldAlert)
              {
                callObj.reason.push("cnty");

                if (rosterSettings.workedIndex && hash in rosterSettings.workedIndex.cnty)
                {
                  callObj.hunting.cnty = "worked";
                  cntyConf = `${kUnconf}${cnty}${kInversionAlpha};`;
                }
                else
                {
                  callObj.hunting.cnty = "hunted";
                  cntyBg = `${cnty}${kInversionAlpha}`;
                  cnty = kBold;
                }
              }
            }
          }
        }

        // Hunting for POTAs
        if (potaEnabled && hunt.POTA && callObj.pota)
        {
          let hash = CR.dayAsString + callsign + callObj.pota + (rosterSettings.layeredMode ? layeredHashSuffix : workHashSuffix);
          let parkHash = callObj.pota + (rosterSettings.layeredMode ? layeredHashSuffix : workHashSuffix);
          // POTA is only in the worked list
          if (!(hash in CR.tracker.worked.pota))
          {
            shouldAlert = true;
            callObj.reason.push("pota");
            callObj.hunting.pota = "hunted";
            if (parkHash in CR.tracker.worked.pota)
            {
              potaConf = `${kUnconf}${pota}${kInversionAlpha};`;
            }
            else
            {
              potaBg = `${pota}${kInversionAlpha};`;
              pota = kBold;
            }
          }
          else if (parkHash in CR.tracker.worked.pota)
          {
            potaConf = `${kUnconf}${pota}${kInversionAlpha};`;
          }
        }

        // Hunting for CQ Zones
        if (hunt.CQz && callObj.cqz)
        {
          let huntTotal = 1;
          let huntFound = 0, layeredFound = 0, workedFound = 0, layeredWorkedFound = 0, marathonFound = 0;
          let hash = callObj.cqz + "|" + workHashSuffix;
          let layeredHash = rosterSettings.layeredMode && (callObj.cqz + "|" + layeredHashSuffix);
          let marathonHash = huntMarathon.checked && `${callObj.cqz}-${currentYear}`;

          if (rosterSettings.huntIndex && hash in rosterSettings.huntIndex.cqz) huntFound++;
          if (rosterSettings.layeredMode && layeredHash in rosterSettings.huntIndex.cqz) layeredFound++;
          if (rosterSettings.workedIndex && hash in rosterSettings.workedIndex.cqz) workedFound++;
          if (rosterSettings.layeredMode && layeredHash in rosterSettings.workedIndex.cqz) layeredWorkedFound++;
          if (marathonHash)
          {
            if (rosterSettings.huntIndex && marathonHash in rosterSettings.huntIndex.cqz) marathonFound++;
            else if (rosterSettings.workedIndex && marathonHash in rosterSettings.workedIndex.cqz) marathonFound++;
          }

          if (huntFound != huntTotal)
          {
            shouldAlert = true;
            callObj.reason.push("cqz");

            if (rosterSettings.workedIndex && workedFound == huntTotal)
            {
              if (rosterSettings.layeredMode && layeredFound == huntTotal)
              {
                callObj.hunting.cqz = "worked-and-mixed";
                cqzConf = `${kLayeredUnconf}${cqz}${kLayeredUnconfAlpha};`;
                cqzBg = `${cqz}${kLayeredInversionAlpha}`;
                cqz = kBold;
              }
              else
              {
                callObj.hunting.cqz = "worked";
                cqzConf = `${kUnconf}${cqz}${kInversionAlpha};`;
              }
            }
            else
            {
              if (rosterSettings.layeredMode && layeredFound == huntTotal)
              {
                callObj.hunting.cqz = "mixed";
                cqzBg = `${cqz}${kLayeredAlpha};`;
                cqz = kBold;
              }
              else if (rosterSettings.layeredMode && layeredWorkedFound == huntTotal)
              {
                callObj.hunting.cqz = "mixed-worked";
                cqzConf = `${kUnconf}${cqz}${kLayeredAlpha};`;
              }
              else
              {
                callObj.hunting.cqz = "hunted";
                cqzBg = `${cqz}${kInversionAlpha};`;
                cqz = kBold;
              }
            }
          }

          callObj.cqzSuffix = null;
          if (huntMarathon.checked && callObj.hunting.cqz != "hunted" && callObj.hunting.cqz != "worked")
          {
            if (marathonFound != huntTotal)
            {
              callObj.reason.push("cqz-marathon");

              callObj.cqzSuffix = currentYearSuffix;

              callObj.hunting.cqzMarathon = "hunted";
              if (!callObj.hunting.cqz)
              {
                cqzConf = `${kUnconf}${cqz}${kLayeredAlpha};`;
              }
            }
          }
        }

        // Hunting for ITU Zones
        if (hunt.ITUz && callObj.ituz)
        {
          let huntTotal = 1;
          let huntFound = 0, layeredFound = 0, workedFound = 0, layeredWorkedFound = 0;
          let hash = callObj.ituz + "|" + workHashSuffix;
          let layeredHash = rosterSettings.layeredMode && (callObj.ituz + "|" + layeredHashSuffix)

          if (rosterSettings.huntIndex && hash in rosterSettings.huntIndex.ituz) huntFound++;
          if (rosterSettings.layeredMode && layeredHash in rosterSettings.huntIndex.ituz) layeredFound++;
          if (rosterSettings.workedIndex && hash in rosterSettings.workedIndex.ituz) workedFound++;
          if (rosterSettings.layeredMode && layeredHash in rosterSettings.workedIndex.ituz) layeredWorkedFound++;

          if (huntFound != huntTotal)
          {
            shouldAlert = true;
            callObj.reason.push("ituz");

            if (rosterSettings.workedIndex && workedFound == huntTotal)
            {
              if (rosterSettings.layeredMode && layeredFound == huntTotal)
              {
                callObj.hunting.ituz = "worked-and-mixed";
                ituzConf = `${kLayeredUnconf}${ituz}${kLayeredUnconfAlpha};`;
                ituzBg = `${ituz}${kLayeredInversionAlpha}`;
                ituz = kBold;
              }
              else
              {
                callObj.hunting.ituz = "worked";
                ituzConf = `${kUnconf}${ituz}${kInversionAlpha};`;
              }
            }
            else
            {
              if (rosterSettings.layeredMode && layeredFound == huntTotal)
              {
                callObj.hunting.ituz = "mixed";
                ituzBg = `${ituz}${kLayeredAlpha};`;
                ituz = kBold;
              }
              else if (rosterSettings.layeredMode && layeredWorkedFound == huntTotal)
              {
                callObj.hunting.ituz = "mixed-worked";
                ituzConf = `${kUnconf}${ituz}${kLayeredAlpha};`;
              }
              else
              {
                callObj.hunting.ituz = "hunted";
                ituzBg = `${ituz}${kInversionAlpha};`;
                ituz = kBold;
              }
            }
          }
        }

        // Hunting for WPX (Prefixes)
        if ((hunt.PX) && callObj.px)
        {
          let hash = callObj.px + workHashSuffix;
          let layeredHash = rosterSettings.layeredMode && (callObj.px + layeredHashSuffix)

          if (rosterSettings.huntIndex && !(hash in rosterSettings.huntIndex.px))
          {
            shouldAlert = true;
            callObj.reason.push("wpx");

            if (rosterSettings.workedIndex && hash in rosterSettings.workedIndex.px)
            {
              if (rosterSettings.layeredMode && layeredHash in rosterSettings.huntIndex.px)
              {
                callObj.hunting.wpx = "worked-and-mixed";
                wpxConf = `${kLayeredUnconf}${wpx}${kLayeredUnconfAlpha};`;
                wpxBg = `${wpx}${kLayeredInversionAlpha}`;
                wpx = kBold;
              }
              else
              {
                callObj.hunting.wpx = "worked";
                wpxConf = `${kUnconf}${wpx}${kInversionAlpha};`;
              }
            }
            else
            {
              if (rosterSettings.layeredMode && layeredHash in rosterSettings.huntIndex.px)
              {
                callObj.hunting.wpx = "mixed";
                wpxBg = `${wpx}${kLayeredAlpha};`;
                wpx = kBold;
              }
              else if (rosterSettings.layeredMode && layeredHash in rosterSettings.workedIndex.px)
              {
                callObj.hunting.wpx = "mixed-worked";
                wpxConf = `${kUnconf}${wpx}${kLayeredAlpha};`;
              }
              else
              {
                callObj.hunting.wpx = "hunted";
                wpxBg = `${wpx}${kInversionAlpha};`;
                wpx = kBold;
              }
            }
          }
        }

        // Hunting for Continents
        if ((hunt.Cont) && callObj.cont)
        {
          let hash = callObj.cont + workHashSuffix;
          let layeredHash = rosterSettings.layeredMode && (callObj.cont + layeredHashSuffix)

          if (rosterSettings.huntIndex && !(hash in rosterSettings.huntIndex.cont))
          {
            shouldAlert = true;
            callObj.reason.push("cont");

            if (rosterSettings.workedIndex && hash in rosterSettings.workedIndex.cont)
            {
              if (rosterSettings.layeredMode && layeredHash in rosterSettings.huntIndex.cont)
              {
                callObj.hunting.cont = "worked-and-mixed";
                contConf = `${kLayeredUnconf}${cont}${kLayeredUnconfAlpha};`;
                contBg = `${cont}${kLayeredInversionAlpha}`;
                cont = kBold;
              }
              else
              {
                callObj.hunting.cont = "worked";
                contConf = `${kUnconf}${cont}${kInversionAlpha};`;
              }
            }
            else
            {
              if (rosterSettings.layeredMode && layeredHash in rosterSettings.huntIndex.cont)
              {
                callObj.hunting.cont = "mixed";
                contBg = `${cont}${kLayeredAlpha};`;
                cont = kBold;
              }
              else if (rosterSettings.layeredMode && layeredHash in rosterSettings.workedIndex.cont)
              {
                callObj.hunting.cont = "mixed-worked";
                contConf = `${kUnconf}${cont}${kLayeredAlpha};`;
              }
              else
              {
                callObj.hunting.cont = "hunted";
                contBg = `${cont}${kInversionAlpha};`;
                cont = kBold;
              }
            }
          }
        }
      }

      // Station is calling us
      if (callObj.DXcall == window.opener.GT.settings.app.myCall)
      {
        callingBg = "#0000FF" + kInversionAlpha;
        calling = "#FFFF00;text-shadow: 0px 0px 2px #FFFF00";
      }
      else if ((callObj.CQ == true || (CR.rosterSettings.wantRRCQ && callObj.RR73 == true)) && !CR.rosterSettings.cqOnly)
      {
        callingBg = calling + kInversionAlpha;
        calling = kBold;
        // If treating RR73/73 as CQ, soften highlighting to help differentiate foreshadow from an actual CQ
        if (CR.rosterSettings.wantRRCQ && callObj.RR73 == true)
        {
          callingConf = `${kUnconf}#90EE90${kInversionAlpha};`;
          calling = `#90EE90${kInversionAlpha};`
          callingBg = "#000000"
        }
      }
  
      // Assemble all styles
      colorObject.call = "style='" + callConf + "background-color:" + callBg + ";color:" + call + ";" + callPointer + "'";
      colorObject.grid = "style='" + gridConf + "background-color:" + gridBg + ";color:" + grid + ";cursor:pointer'";
      colorObject.calling = "style='" + callingConf + "background-color:" + callingBg + ";color:" + calling + "'";
      colorObject.dxcc = "style='" + dxccConf + "background-color:" + dxccBg + ";color:" + dxcc + "'";
      colorObject.state = "style='" + stateConf + "background-color:" + stateBg + ";color:" + state + "'";
      colorObject.cnty = "style='" + cntyConf + "background-color:" + cntyBg + ";color:" + cnty + ";" + cntyPointer + "'";
      colorObject.pota = "style='" + potaConf + "background-color:" + potaBg + ";color:" + pota + "'";
      colorObject.cont = "style='" + contConf + "background-color:" + contBg + ";color:" + cont + "'";
      colorObject.cqz = "style='" + cqzConf + "background-color:" + cqzBg + ";color:" + cqz + "'";
      colorObject.ituz = "style='" + ituzConf + "background-color:" + ituzBg + ";color:" + ituz + "'";
      colorObject.px = "style='" + wpxConf + "background-color:" + wpxBg + ";color:" + wpx + "'";

      callObj.shouldAlert ||= shouldAlert;
      callObj.style = colorObject;

      rosterSettings.modes[callObj.mode] = true;
      rosterSettings.bands[callObj.band] = true;
    }
  }
}

function buildWatcher(watcher, key)
{
  if (watcher.regex)
  {
    try
    {
      CR.watchersTest[key] = new RegExp(watcher.text, "gi");
    }
    catch (e)
    {
      watcher.watch = false;
      CR.watchersTest[key] = null;
      watcher.error = true;
      wantRenderWatchersTab();
    }
  }
  else
  {
    try
    {
      CR.watchersTest[key] = new RegExp("^" + watcher.text + "$", "gi");
    }
    catch (e)
    {
      watcher.watch = false;
      CR.watchersTest[key] = null;
      watcher.error = true;
      wantRenderWatchersTab();
    }
  }

  if (watcher.type == "Callsign")
  {
    watcher.source = "DEcall";
    watcher.html = "DEcallHTML";
  }
  else if (watcher.type == "Calling")
  {
    watcher.source = "DXcall";
    watcher.html = "DXcallHTML";
  }
  else if (watcher.type == "Grid")
  {
    watcher.source = "grid";
    watcher.html = "gridHTML";
  }
  else
  {
    watcher.source = "msg";
    watcher.html = "msgHTML";
  }
  return CR.watchersTest[key];
}

function processWatchers(callObj)
{
  let now = Date.now();
  for (let key in CR.watchers)
  {
    let watcher = CR.watchers[key];
    if (watcher.watch)
    {
      if (watcher.start && now < watcher.startTime) continue;
      if (watcher.end && now > watcher.endTime)
      {
        if (watcher.autoDelete)
        {
          // Don't call deleteWatcher() as it calls the roster renderer
          delete CR.watchers[key];
          delete CR.watchersTest[key];
          wantRenderWatchersTab();
        }
        else
        {
          watcher.watch = false;
          wantRenderWatchersTab();
        }
        continue;
      }
      CR.watchersTest[key] = CR.watchersTest[key] || buildWatcher(watcher, key);
      if (CR.watchersTest[key])
      {
        try
        {
          if (callObj[watcher.source].match(CR.watchersTest[key]))
          {
            callObj.reason.push("watcher");
            callObj.hunting.watcher = "hunted";
            callObj.watcherKey = key;
            let htmlPrevent = htmlEntities(callObj[watcher.source]);
            callObj[watcher.html] = htmlPrevent.replace(CR.watchersTest[key], (x, y) => `<span class='regexMatch'>${x}</span>`);
            return true;
          }
        }
        catch (e)
        {
          CR.watchersTest[key] = null;
          watcher.watch = false;
          watcher.error = true;
          wantRenderWatchersTab();
        }
      }
    }
  }
  return false;
}
