function renderRoster(callRoster, rosterSettings)
{
  let columnOverrides = {
    Callsign: true
  }

  if (window.opener.GT.callsignLookups.eqslUseEnable == true)
  {
    useseQSLDiv.style.display = "";
  }
  else
  {
    columnOverrides.eQSL = false;
    useseQSLDiv.style.display = "none";
  }

  if (window.opener.GT.callsignLookups.oqrsUseEnable == true)
  {
    usesOQRSDiv.style.display = "";
  }
  else
  {
    columnOverrides.OQRS = false;
    usesOQRSDiv.style.display = "none";
  }

  if (window.opener.GT.callsignLookups.lotwUseEnable == true)
  {
    usesLoTWDiv.style.display = "";
  }
  else
  {
    columnOverrides.LoTW = false;
    usesLoTWDiv.style.display = "none";
  }

  if (rosterSettings.canMsg == true)
  {
    huntingMatrixOAMSDiv.style.display = "";
  }
  else
  {
    huntingMatrixOAMSDiv.style.display = "none";
    columnOverrides.OAMS = false;
  }

  if (window.opener.GT.appSettings.potaEnabled == 1 && window.opener.GT.mapSettings.offlineMode == false)
  {
    huntingMatrixPotaDiv.style.display = "";
  }
  else
  {
    huntingMatrixPotaDiv.style.display = "none";
    columnOverrides.POTA = false;
  }
  
  // dealing with spots
  if (CR.rosterSettings.columns.Spot == true) onlySpotDiv.style.display = "";
  else onlySpotDiv.style.display = "none";

  // callmode (all or only new)
  if (rosterSettings.callMode == "all") allOnlyNewDiv.style.display = "";
  else allOnlyNewDiv.style.display = "none";
  
  // Show the roster count in the window title

  // let visibleCallList = callRoster.filter(entry => entry.tx);

  let visibleCallList = [];
  for (const entry in callRoster)
  {
    // entry should populate in general
    if (callRoster[entry].tx == true)
    {
      visibleCallList.push(callRoster[entry]);
    }
  }

  let totalCount = Object.keys(callRoster).length;
  let visibleCount = visibleCallList.length;
  let huntedCount = visibleCallList.filter(obj => Object.keys(obj.callObj.hunting).length > 0).length
  let countParts = [];

  if (totalCount != visibleCount)
  {
    countParts.push(`${totalCount} heard`);
  }

  countParts.push(`${visibleCount} in roster`);

  if (huntedCount != visibleCount)
  {
    countParts.push(`${huntedCount} wanted`);
  }

  window.document.title = `Call Roster: ${countParts.join(" • ")}`;
  let multiInstance = false;
  if (listShortInstances().length > 0)
  {
    window.document.title += " | " + listShortInstances().join(" • ");
    multiInstance = true;
  }
  let multiBand = Object.keys(rosterSettings.bands).length > 1;
  let showBands = multiBand || CR.rosterSettings.columns.Band;
  let showModes = (Object.keys(rosterSettings.modes).length > 1) || CR.rosterSettings.columns.Mode;

  columnOverrides.Band = showBands;
  columnOverrides.Mode = showModes;
  const rosterColumns = rosterColumnList(CR.rosterSettings.columns, columnOverrides);

  if (CR.rosterSettings.compact)
  {
    sortCallList(visibleCallList, "Age", false, rosterColumns);
  }
  else
  {
    sortCallList(visibleCallList, CR.rosterSettings.sortColumn, CR.rosterSettings.sortReverse);
  }

  let worker = CR.rosterSettings.compact ? renderCompactRosterHeaders() : renderNormalRosterHeaders(rosterColumns);

  // Third loop: render all rows
  for (const x in visibleCallList)
  {
    let callObj = visibleCallList[x].callObj;

    // TODO: This is filtering
    if (callObj.shouldAlert == false && rosterSettings.onlyHits == true && callObj.qrz == false)
    { continue; }

    if (callObj.DEcall.match("^[KNW][0-9][A-W|Y|Z](/w+)?$"))
    { callObj.style.call = "class='oneByOne'"; }
    if (callObj.DEcall == window.opener.GT.instances[callObj.instance].status.DXcall)
    {
      if (window.opener.GT.instances[callObj.instance].status.TxEnabled == 1)
      {
        callObj.style.call = "class='dxCalling'";
      }
      else
      {
        callObj.style.call = "class='dxCaller'";
      }
    }

    worker += CR.rosterSettings.compact ? renderCompactRosterRow(callObj, multiInstance || multiBand) : renderNormalRosterRow(rosterColumns, callObj);
  }

  worker += CR.rosterSettings.compact ? renderCompactRosterFooter() : renderNormalRosterFooter();

  RosterTable.innerHTML = worker;
}
