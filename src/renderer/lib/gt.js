// GridTracker Copyright © 2024 GridTracker.org
// All rights reserved.
// See LICENSE for more information.
const gtVersionStr = electron.ipcRenderer.sendSync("appVersion");
var gtVersion = parseInt(gtVersionStr.replace(/\./g, ""));

GT.startingUp = true;
// var GT is in screen.js
GT.startVersion = 0;

if (typeof GT.localStorage.currentVersion != "undefined")
{
  GT.startVersion = parseInt(GT.localStorage.currentVersion);
}

GT.firstRun = false;

if (typeof GT.localStorage.currentVersion == "undefined" || GT.localStorage.currentVersion != String(gtVersion))
{
  if (typeof GT.localStorage.currentVersion == "undefined")
  {
    GT.firstRun = true;
  }
  GT.localStorage.currentVersion = String(gtVersion);
}

const gtShortVersion = "v" + gtVersionStr;

const gtUserAgent = "GridTracker/" + gtVersionStr;

GT.dirSeperator = path.sep;

GT.platform = os.platform();
if (GT.platform.indexOf("win") == 0 || GT.platform.indexOf("Win") == 0)
{
  GT.platform = "windows";
}
if (GT.platform.indexOf("inux") > -1)
{
  GT.platform = "linux";
}
if (GT.platform.indexOf("darwin") > -1)
{
  GT.platform = "mac";
}

GT.popupWindowHandle = null;
GT.popupWindowInitialized = false;
GT.callRosterWindowHandle = null;
GT.conditionsWindowHandle = null;
GT.conditionsWindowInitialized = false;
GT.chatWindowHandle = null;
GT.chatWindowInitialized = false;
GT.statsWindowHandle = null;
GT.statsWindowInitialized = false;
GT.lookupWindowHandle = null;
GT.lookupWindowInitialized = false;
GT.baWindowHandle = null;
GT.baWindowInitialized = false;
GT.alertWindowHandle = null;
GT.alertWindowInitialized = false;
GT.myDXGrid = "";
GT.appSettings = {};
GT.mapSettings = {};
GT.legendColors = {};
GT.adifLogSettings = {};
GT.msgSettings = {};
GT.audioSettings = {};
GT.speechAvailable = false;
GT.receptionSettings = {};
GT.receptionReports = {
  lastDownloadTimeSec: 0,
  lastSequenceNumber: "0",
  spots: {}
};
GT.N1MMSettings = {};
GT.log4OMSettings = {};
GT.dxkLogSettings = {};
GT.HRDLogbookLogSettings = {};
GT.acLogSettings = {};
GT.trustedQslSettings = {};
GT.callsignLookups = {};
GT.startupLogs = [];
GT.mapMemory = [];

GT.acknowledgedCalls = {};

function loadAllSettings()
{
  for (let x in GT.localStorage)
  {
    if (!validSettings.includes(x) && typeof GT.localStorage[x] == "string")
    {
      delete GT.localStorage[x];
    }
  }

  GT.appSettings = loadDefaultsAndMerge("appSettings", def_appSettings);
  GT.mapSettings = loadDefaultsAndMerge("mapSettings", def_mapSettings);
  GT.legendColors = loadDefaultsAndMerge("legendColors", def_legendColors);
  GT.audioSettings = loadDefaultsAndMerge("audioSettings", def_audioSettings);
  GT.adifLogSettings = loadDefaultsAndMerge("adifLogSettings", def_adifLogSettings);
  if (typeof GT.adifLogSettings.lastFetch.lotw_qso == "string")
  {
    // covnert to int!
    GT.adifLogSettings.lastFetch.lotw_qso = Date.parse(dateToISO8601(GT.adifLogSettings.lastFetch.lotw_qso, "Z"));
    GT.adifLogSettings.lastFetch.lotw_qsl = Date.parse(dateToISO8601(GT.adifLogSettings.lastFetch.lotw_qsl, "Z"));
    saveAdifSettings();
  }
  GT.msgSettings = loadDefaultsAndMerge("msgSettings", def_msgSettings);
  GT.receptionSettings = loadDefaultsAndMerge("receptionSettings", def_receptionSettings);
  GT.N1MMSettings = loadDefaultsAndMerge("N1MMSettings", def_N1MMSettings);
  GT.log4OMSettings = loadDefaultsAndMerge("log4OMSettings", def_log4OMSettings);
  GT.dxkLogSettings = loadDefaultsAndMerge("dxkLogSettings", def_dxkLogSettings);
  GT.HRDLogbookLogSettings = loadDefaultsAndMerge("HRDLogbookLogSettings", def_HRDLogbookLogSettings);
  GT.pstrotatorSettings = loadDefaultsAndMerge("pstrotatorSettings", def_pstrotatorSettings);
  GT.acLogSettings = loadDefaultsAndMerge("acLogSettings", def_acLogSettings);
  GT.trustedQslSettings = loadDefaultsAndMerge("trustedQslSettings", def_trustedQslSettings);
  GT.callsignLookups = loadDefaultsAndMerge("callsignLookups", def_callsignLookups);
  GT.bandActivity = loadDefaultsAndMerge("bandActivity", def_bandActivity);

  GT.startupLogs = loadArrayIfExists("startupLogs");
  GT.mapMemory = loadArrayIfExists("mapMemory");

  if (GT.mapMemory.length != 7)
  {
    GT.mapMemory = [];
    for (let x = 0; x < 7; x++)
    {
      GT.mapMemory[x] = { ...def_mapMemory };
    }
  }
  else
  {
    for (let x in GT.mapMemory)
    {
      GT.mapMemory[x] = { ...def_mapMemory, ...GT.mapMemory[x] };
    }
  }
  GT.appSettings.mapMemory = JSON.stringify(GT.mapMemory);
}

loadAllSettings();

const k_frequencyBucket = 10000;

GT.flightDuration = 30;
GT.crScript = GT.appSettings.crScript;
GT.spotView = GT.appSettings.spotView;
GT.myLat = GT.mapSettings.latitude;
GT.myLon = GT.mapSettings.longitude;
GT.useTransform = false;
GT.currentOverlay = GT.mapSettings.trophyOverlay;

function loadDefaultsAndMerge(key, def)
{
  var settings = {};
  if (key in GT.localStorage)
  {
    settings = JSON.parse(GT.localStorage[key]);
  }
  var merged = deepmerge(def, settings);
  for (var x in merged)
  {
    if (!(x in def))
    {
      delete merged[x];
    }
  }
  GT.localStorage[key] = JSON.stringify(merged);
  return merged;
}

function loadArrayIfExists(key)
{
  var data = [];
  if (key in GT.localStorage)
  {
    data = JSON.parse(GT.localStorage[key]);
  }
  return data;
}

function loadObjectIfExists(key)
{
  var data = {};
  if (key in GT.localStorage)
  {
    data = JSON.parse(GT.localStorage[key]);
  }
  return data;
}

function saveAppSettings()
{
  GT.localStorage.appSettings = JSON.stringify(GT.appSettings);
}

function saveMapSettings()
{
  GT.localStorage.mapSettings = JSON.stringify(GT.mapSettings);
}

function saveLegendColors()
{
  GT.localStorage.legendColors = JSON.stringify(GT.legendColors);
}

function saveAdifSettings()
{
  GT.localStorage.adifLogSettings = JSON.stringify(GT.adifLogSettings);
}

function saveStartupLogs()
{
  GT.localStorage.startupLogs = JSON.stringify(GT.startupLogs);
}

function saveLogSettings()
{
  GT.localStorage.adifLogSettings = JSON.stringify(GT.adifLogSettings);
  GT.localStorage.N1MMSettings = JSON.stringify(GT.N1MMSettings);
  GT.localStorage.log4OMSettings = JSON.stringify(GT.log4OMSettings);
  GT.localStorage.dxkLogSettings = JSON.stringify(GT.dxkLogSettings);
  GT.localStorage.HRDLogbookLogSettings = JSON.stringify(GT.HRDLogbookLogSettings);
  GT.localStorage.pstrotatorSettings = JSON.stringify(GT.pstrotatorSettings);
  GT.localStorage.acLogSettings = JSON.stringify(GT.acLogSettings);
  GT.localStorage.trustedQslSettings = JSON.stringify(GT.trustedQslSettings);
}

function saveAllSettings()
{
  try
  {
    saveAppSettings();
    saveAudioSettings();
    saveAdifSettings();
    saveLogSettings();

    mapMemory(6, true, true);
    GT.mapSettings.zoom = GT.map.getView().getZoom() / 0.333;
    saveMapSettings();

    saveLegendColors();
    saveCallsignSettings();

    if (GT.rosterInitialized)
    {
      GT.callRosterWindowHandle.window.writeRosterSettings();
    }
  }
  catch (e)
  {
    console.error(e);
  }
}

function saveAndCloseApp(shouldRestart = false)
{
  GT.closing = true;
  saveReceptionReports();

  try
  {
    var data = {};

    data.version = gtVersion;
    data.tracker = GT.tracker;
    data.myQsoGrids = GT.myQsoGrids;
    data.myQsoCalls = GT.myQsoCalls;
    data.g_QSOhash = GT.QSOhash;

    fs.writeFileSync(GT.GTappData + "internal_qso.json", JSON.stringify(data));

  }
  catch (e)
  {
    console.error(e);
  }

  if (GT.map)
  {
    mapMemory(6, true, true);
    GT.mapSettings.zoom = GT.map.getView().getZoom() / 0.333;
    saveMapSettings();
  }

  if (GT.wsjtUdpServer != null)
  {
    try
    {
      if (multicastEnable.checked == true && GT.appSettings.wsjtIP != "")
      {
        GT.wsjtUdpServer.dropMembership(GT.appSettings.wsjtIP);
      }
      GT.wsjtUdpServer.close();
    }
    catch (e)
    {
      console.error(e);
    }
  }

  if (GT.forwardUdpServer != null)
  {
    try
    {
      GT.forwardUdpServer.close();
    }
    catch (e)
    {
      console.error(e);
    }
  }

  saveAppSettings();
  saveAudioSettings();
  saveAdifSettings();
  saveMapSettings();
  saveLegendColors();
  saveCallsignSettings();
  saveLogSettings();

  if (GT.rosterInitialized)
  {
    GT.callRosterWindowHandle.window.writeRosterSettings();
  }

  saveGridTrackerSettings();
  if (shouldRestart == true)
  {
    electron.ipcRenderer.sendSync("restartGridTracker2");
  }
}

function clearAndReload()
{
  GT.closing = true;
  if (GT.wsjtUdpServer != null)
  {
    GT.wsjtUdpServer.close();
    GT.wsjtUdpServer = null;
  }

  GT.localStorage = {};
  saveGridTrackerSettings();

  electron.ipcRenderer.sendSync("restartGridTracker2");
}

// Must be impemented somewhere
window.addEventListener("beforeunload", function ()
{
  saveAndCloseApp();
});

GT.wsjtxProcessRunning = false;
GT.wsjtxIni = null;
GT.setNewUdpPortTimeoutHandle = null;
GT.map = null;
GT.menuShowing = true;
GT.closing = false;
GT.liveGrids = {};
GT.qsoGrids = {};
GT.liveCallsigns = {};

GT.flightPaths = Array();
GT.flightPathOffset = 0;
GT.flightPathLineDash = [9, 3, 3];
GT.flightPathTotal = (9 + 3 + 3) * 2;

GT.lastMessages = Array();
GT.lastTraffic = Array();

GT.maps = Array();
GT.modes = {};
GT.modes_phone = {};
GT.colorBands = [
  "OOB",
  "4000m",
  "2200m",
  "630m",
  "160m",
  "80m",
  "60m",
  "40m",
  "30m",
  "20m",
  "17m",
  "15m",
  "12m",
  "11m",
  "10m",
  "8m",
  "6m",
  "4m",
  "2m",
  "1.25m",
  "70cm",
  "33cm",
  "23cm",
  "13cm",
  "9cm",
  "5cm",
  "3cm",
  "1.2cm",
  "6mm",
  "4mm",
  "2.5mm",
  "2mm",
  "1mm"
];

GT.pathIgnore = {};
GT.pathIgnore.RU = true;
GT.pathIgnore.FTRU = true;
GT.pathIgnore.FD = true;
GT.pathIgnore.TEST = true;
GT.pathIgnore.DX = true;
GT.pathIgnore.CQ = true;

GT.replaceCQ = {};
GT.replaceCQ.ASIA = "AS";

GT.myDXCC = -1;
GT.QSOhash = {};
GT.myQsoCalls = {};
GT.myQsoGrids = {};
GT.QSLcount = 0;
GT.QSOcount = 0;
GT.ignoreMessages = 0;
GT.lastTimeSinceMessageInSeconds = timeNowSec();
GT.loadQSOs = false;
GT.mainBorderColor = "#222222FF";
GT.pushPinMode = false;
GT.pskBandActivityTimerHandle = null;
GT.wsjtxLogPath = "";
GT.dxccInfo = {};
GT.prefixToMap = {};
GT.directCallToDXCC = {};
GT.directCallToCQzone = {};
GT.directCallToITUzone = {};
GT.prefixToCQzone = {};
GT.prefixToITUzone = {};
GT.dxccToAltName = {};
GT.dxccToCountryCode = {};
GT.altNameToDXCC = {};
GT.dxccToADIFName = {};
GT.gridToDXCC = {};
GT.gridToState = {};
GT.StateData = {};
GT.cqZones = {};
GT.wacZones = {};
GT.wasZones = {};
GT.wacpZones = {};
GT.ituZones = {};
GT.dxccCount = {};
GT.tracker = {};
GT.lastTrasmissionTimeSec = timeNowSec();
GT.getPostBuffer = getPostBuffer;

const PSKREPORTER_INTERVAL_IN_SECONDS = 5 * 60;

initQSOdata();

GT.mapsLayer = Array();
GT.offlineMapsLayer = Array();
GT.tileLayer = null;
GT.mapView = null;
GT.layerSources = {};
GT.layerVectors = {};

GT.scaleLine = null;
GT.scaleUnits = {};

GT.scaleUnits.MI = "us";
GT.scaleUnits.KM = "metric";
GT.scaleUnits.NM = "nautical";
GT.scaleUnits.DG = "degrees";

GT.mouseX = 0;
GT.mouseY = 0;
GT.screenX = 0;
GT.screenY = 0;

GT.appData = "";
GT.GTappData = "";
GT.scriptDir = "";
GT.qsoLogFile = "";
GT.clublogLogFile = "";
GT.LoTWLogFile = "";
GT.QrzLogFile = "";
GT.userMediaDir = "";
GT.gtMediaDir = path.resolve(resourcesPath, "media");
GT.localeString = navigator.language;
GT.voices = null;
GT.shapeData = {};
GT.countyData = {};
GT.zipToCounty = {};
GT.stateToCounty = {};
GT.cntyToCounty = {};
GT.us48Data = {};

GT.pskColors = {};
GT.pskColors.OOB = "888888";
GT.pskColors["4000m"] = "45E0FF";
GT.pskColors["2200m"] = "FF4500";
GT.pskColors["630m"] = "1E90FF";
GT.pskColors["160m"] = "7CFC00";
GT.pskColors["80m"] = "E550E5";
GT.pskColors["60m"] = "99CCFF";
GT.pskColors["40m"] = "00FFFF";
GT.pskColors["30m"] = "62FF62";
GT.pskColors["20m"] = "FFC40C";
GT.pskColors["17m"] = "F2F261";
GT.pskColors["15m"] = "CCA166";
GT.pskColors["12m"] = "CB3D3D";
GT.pskColors["11m"] = "00FF00";
GT.pskColors["10m"] = "FF69B4";
GT.pskColors["8m"] = "8b00fb";
GT.pskColors["6m"] = "4dfff9";
GT.pskColors["4m"] = "93ff05";
GT.pskColors["2m"] = "FF1493";
GT.pskColors["1.25m"] = "beff00";
GT.pskColors["70cm"] = "999900";
GT.pskColors["33cm"] = "ff8c90";
GT.pskColors["23cm"] = "5AB8C7";
GT.pskColors["13cm"] = "ff7540";
GT.pskColors["9cm"] = "b77ac7";
GT.pskColors["5cm"] = "b77ac7";
GT.pskColors["3cm"] = "696969";
GT.pskColors["1.2cm"] = "b77ac7";
GT.pskColors["6mm"] = "b77ac7";
GT.pskColors["4mm"] = "b77ac7";
GT.pskColors["2.5mm"] = "b77ac7";
GT.pskColors["2mm"] = "b77ac7";
GT.pskColors["1mm"] = "b77ac7";

GT.bandToColor = {};
GT.colorLeafletPins = {};
GT.colorLeafletQPins = {};

GT.UTCoptions = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short"
};

GT.LocalOptions = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZoneName: "short"
};

GT.GraylineImageArray = Array();
GT.GraylineImageArray[0] = "img/shadow_on_32.png";
GT.GraylineImageArray[1] = "img/shadow_off_32.png";
GT.gtFlagImageArray = Array();
GT.gtFlagImageArray[1] = "img/flag_on.png";
GT.gtFlagImageArray[0] = "img/flag_off.png";
GT.gtShareFlagImageArray = Array();
GT.gtShareFlagImageArray[1] = "img/share-on.png";
GT.gtShareFlagImageArray[0] = "img/share-off.png";
GT.mapImageArray = Array();
GT.mapImageArray[1] = "img/online_map.png";
GT.mapImageArray[0] = "img/offline_map.png";
GT.pinImageArray = Array();
GT.pinImageArray[1] = "img/red_pin_32.png";
GT.pinImageArray[0] = "img/gt_grid.png";
GT.qsoLockImageArray = Array();
GT.qsoLockImageArray[0] = "img/qso_unlocked_32.png";
GT.qsoLockImageArray[1] = "img/qso_locked_32.png";
GT.qslLockImageArray = Array();
GT.qslLockImageArray[0] = "img/qsl_unlocked_32.png";
GT.qslLockImageArray[1] = "img/qsl_locked_32.png";
GT.alertImageArray = Array();
GT.alertImageArray[0] = "img/unmuted-button.png";
GT.alertImageArray[1] = "img/muted-button.png";
GT.spotImageArray = Array();
GT.spotImageArray[0] = "img/spots.png";
GT.spotImageArray[1] = "img/spots.png";
GT.spotImageArray[2] = "img/heat.png";
GT.maidenheadModeImageArray = Array();
GT.maidenheadModeImageArray[0] = "img/mh4_32.png";
GT.maidenheadModeImageArray[1] = "img/mh6_32.png";
GT.predImageArray = Array();
GT.predImageArray[0] = "img/no-pred.png";
GT.predImageArray[1] = "img/muf.png";
GT.predImageArray[2] = "img/fof2.png";
GT.predImageArray[3] = "img/epi.png";
GT.predImageArray[4] = "img/auf.png";

GT.viewInfo = {};
GT.viewInfo[0] = ["qsoGrids", "Grids", 0, 0, 0];
GT.viewInfo[1] = ["cqZones", "CQ Zones", 0, 0, 40];
GT.viewInfo[2] = ["ituZones", "ITU Zones", 0, 0, 90];
GT.viewInfo[3] = ["wacZones", "Continents", 0, 0, 6];
GT.viewInfo[4] = ["wasZones", "US States", 0, 0, 50];
GT.viewInfo[5] = ["dxccInfo", "DXCCs", 0, 0, 340];
GT.viewInfo[6] = ["countyData", "US Counties", 0, 0, 3220];
GT.viewInfo[7] = ["us48Data", "US Continental Grids", 0, 0, 488];
GT.viewInfo[8] = ["wacpZones", "CA Provinces", 0, 0, 13];
GT.soundCard = GT.appSettings.soundCard;
GT.gridAlpha = "88";

if (typeof GT.mapMemory[6] == "undefined") GT.mapMemory[6] = GT.mapMemory[0];

function qsoBackupFileInit()
{
  var adifHeader = "GridTracker v" + gtVersion + " <EOH>\r\n";
  if (!fs.existsSync(GT.qsoLogFile))
  {
    fs.writeFileSync(GT.qsoLogFile, adifHeader);
  }
}

function toggleMapViewFiltersCollapse()
{
  GT.appSettings.collapsedMapViewFilters = !GT.appSettings.collapsedMapViewFilters;
  displayMapViewFilters();
  saveAppSettings();
}

function checkMapViewFiltersMaximize()
{
  // If the user clicks the Map View Filters when minimized, it maximizes
  if (GT.appSettings.collapsedMapViewFilters == true)
  {
    toggleMapViewFiltersCollapse();
  }
}

function displayMapViewFilters()
{
  if (GT.appSettings.collapsedMapViewFilters == true)
  {
    mapViewFiltersTable.style.display = "none";
    mapViewFiltersCollapseImg.src = "img/maximize.png";
    mapViewFiltersCollapseImg.title = I18N("roster.menu.ShowControls");
  }
  else
  {
    mapViewFiltersTable.style.display = "";
    mapViewFiltersCollapseImg.src = "img/minimize.png";
    mapViewFiltersCollapseImg.title = I18N("roster.menu.HideControls");
  }
}

function gtBandFilterChanged(selector)
{
  GT.appSettings.gtBandFilter = selector.value;

  removePaths();
  redrawGrids();
  redrawPins();
  redrawSpots();
  redrawParks();
}

function gtModeFilterChanged(selector)
{
  GT.appSettings.gtModeFilter = selector.value;

  removePaths();
  redrawGrids();
  redrawPins();
  redrawSpots();
  redrawParks();
}

function gtPropFilterChanged(selector)
{
  GT.appSettings.gtPropFilter = selector.value;

  redrawGrids();
  redrawSpots();
}

function setBandAndModeToAuto()
{
  GT.appSettings.gtModeFilter = GT.appSettings.gtBandFilter = gtBandFilter.value = gtModeFilter.value = "auto";
  redrawGrids();
  redrawPins();
  redrawSpots();
  redrawParks();
}

function hideLiveGrid(i)
{
  if (GT.layerSources.live.hasFeature(GT.liveGrids[i].rectangle))
  {
    GT.layerSources.live.removeFeature(GT.liveGrids[i].rectangle);
  }
}

function liveTriangleGrid(i)
{
  if (GT.liveGrids[i].isTriangle == false)
  {
    if (GT.layerSources.live.hasFeature(GT.liveGrids[i].rectangle))
    {
      GT.layerSources.live.removeFeature(GT.liveGrids[i].rectangle);
    }

    gridToTriangle(i, GT.liveGrids[i].rectangle, false);
    GT.liveGrids[i].isTriangle = true;
    GT.layerSources.live.addFeature(GT.liveGrids[i].rectangle);
  }
}

function qsoTriangleGrid(i)
{
  if (GT.qsoGrids[i].isTriangle == false)
  {
    if (GT.layerSources.qso.hasFeature(GT.qsoGrids[i].rectangle))
    {
      GT.layerSources.qso.removeFeature(GT.qsoGrids[i].rectangle);
    }

    gridToTriangle(i, GT.qsoGrids[i].rectangle, true);
    GT.qsoGrids[i].isTriangle = true;
    GT.layerSources.qso.addFeature(GT.qsoGrids[i].rectangle);
  }
}

function setGridView()
{
  GT.appSettings.gridViewMode = gtGridViewMode.value;
  saveAppSettings();
  redrawGrids();
}

function cycleGridView()
{
  var mode = GT.appSettings.gridViewMode;
  mode++;
  if (mode > 3) mode = 1;
  if (mode < 1) mode = 1;
  gtGridViewMode.value = GT.appSettings.gridViewMode = mode;

  saveAppSettings();
  redrawGrids();
}

function toggleEarth()
{
  GT.appSettings.graylineImgSrc ^= 1;
  graylineImg.src = GT.GraylineImageArray[GT.appSettings.graylineImgSrc];
  if (GT.appSettings.graylineImgSrc == 1 || GT.useTransform == true)
  {
    dayNight.hide();
    GT.nightTime = dayNight.refresh();
  }
  else
  {
    GT.nightTime = dayNight.refresh();
    dayNight.show();
  }
  Grayline.style.display = (GT.useTransform) ? "none" : "";
}

function toggleOffline()
{
  if (GT.map == null) return;

  if (GT.mapSettings.offlineMode == true)
  {
    GT.mapSettings.offlineMode = false;
    offlineImg.src = GT.mapImageArray[1];
    conditionsButton.style.display = "";
    gtFlagButton.style.display = "";
    gtShareButton.style.display = "";
    lookupButton.style.display = "";
    buttonSpotsBoxDiv.style.display = "";
    donateButton.style.display = (GT.appSettings.myCall in GT.acknowledgedCalls) ? "none" : "";
    radarButton.style.display = "";
    mapSelect.style.display = "";
    mapNightSelect.style.display = "";
    offlineMapSelect.style.display = "none";
    offlineMapNightSelect.style.display = "none";
    potaButton.style.display = (GT.appSettings.potaEnabled == 1 && GT.appSettings.potaShowMenu) ? "" : "none";

    if (GT.appSettings.gtShareEnable == true)
    {
      gtFlagButton.style.display = "";
      if (GT.appSettings.gtMsgEnable == true) { msgButton.style.display = ""; }
      else msgButton.style.display = "none";
    }
    else
    {
      msgButton.style.display = "none";
      gtFlagButton.style.display = "none";
    }

    for (var key in GT.adifLogSettings.menu)
    {
      var value = GT.adifLogSettings.menu[key];
      var where = key + "Div";
      document.getElementById(key).checked = value;
      if (value == true)
      {
        document.getElementById(where).style.display = "";
      }
      else
      {
        document.getElementById(where).style.display = "none";
      }
    }
    bandActivityDiv.style.display = "block";
    if (GT.lookupWindowInitialized == false)
    {
      openLookupWindow(false);
    }
  }
  else
  {
    openLookupWindow(false);

    GT.mapSettings.offlineMode = true;
    offlineImg.src = GT.mapImageArray[0];
    conditionsButton.style.display = "none";
    buttonPsk24CheckBoxDiv.style.display = "none";
    buttonQRZCheckBoxDiv.style.display = "none";
    buttonLOTWCheckBoxDiv.style.display = "none";
    buttonClubCheckBoxDiv.style.display = "none";
    gtFlagButton.style.display = "none";
    bandActivityDiv.style.display = "none";
    gtShareButton.style.display = "none";
    msgButton.style.display = "none";
    donateButton.style.display = "none";
    potaButton.style.display = "none";
    buttonSpotsBoxDiv.style.display = "none";
    lookupButton.style.display = "none";
    radarButton.style.display = "none";
    mapSelect.style.display = "none";
    mapNightSelect.style.display = "none";
    offlineMapSelect.style.display = "";
    offlineMapNightSelect.style.display = "";
    setGtShareButtons();
  }
  displayNexrad();
  displayPredLayer();

  loadMapSettings();
  changeMapValues();
  goProcessRoster();
}

// from GridTracker.html
function ignoreMessagesToggle()
{
  GT.ignoreMessages ^= 1;
  if (GT.ignoreMessages == 0)
  {
    txrxdec.style.backgroundColor = "Green";
    txrxdec.style.borderColor = "GreenYellow";
    txrxdec.innerHTML = "RECEIVE";
    txrxdec.title = "Click to ignore incoming messages";
  }
  else
  {
    txrxdec.style.backgroundColor = "DimGray";
    txrxdec.style.borderColor = "DarkGray";
    txrxdec.innerHTML = "IGNORE";
    txrxdec.title = "Click to resume reading messages";
  }
}

// from GridTracker.html
function toggleTime()
{
  GT.appSettings.useLocalTime ^= 1;
  displayTime();
}

function dateToString(dateTime)
{
  if (GT.appSettings.useLocalTime == 1) { return dateTime.toLocaleString().replace(/,/g, ""); }
  else return dateTime.toUTCString().replace(/GMT/g, "UTC").replace(/,/g, "");
}

function userDayString(Msec)
{
  var dateTime;
  if (Msec != null) dateTime = new Date(Msec);
  else dateTime = new Date();

  var ds = dateTime.toUTCString().replace(/GMT/g, "UTC").replace(/,/g, "");
  var dra = ds.split(" ");
  dra.shift();
  dra.pop();
  dra.pop();
  return dra.join(" ");
}

function userTimeString(Msec)
{
  var dateTime;
  if (Msec != null) dateTime = new Date(Msec);
  else dateTime = new Date();
  return dateToString(dateTime);
}

GT.trackerWorkerCallbacks = {
  processed: applyQSOs
};

GT.trackerWorker = new Worker("./lib/trackerWorker.js");

GT.trackerWorker.onmessage = function(event)
{
  if ("type" in event.data)
  {
    if (event.data.type in GT.trackerWorkerCallbacks)
    {
      GT.trackerWorkerCallbacks[event.data.type](event.data);
    }
    else console.log("trackerWorkerCallback: unknown event type : " + event.data.type);
  }
  else console.log("trackerWorkerCallback: no event type");
};

function refreshQSOs()
{
  // Don't bother, we have other logs coming
  if (GT.adifLogCount > 0) return;

  clearOrLoadButton.style.display = "none";
  busyDiv.style.display = "block";

  var task = {};
  task.type = "process";
  task.QSOhash = GT.QSOhash;
  GT.trackerWorker.postMessage(task);
}

function applyQSOs(task)
{
  if (task != null)
  {
    GT.tracker = task.tracker;
  }

  if (GT.adifLogCount == 0)
  {
    clearOrLoadButton.style.display = "block";
    busyDiv.style.display = "none";

    updateRosterWorked();
    goProcessRoster();
    redrawGrids(false);
  }
}

function addLiveCallsign(
  finalGrid,
  finalDXcall,
  finalDEcall,
  finalRSTsent,
  finalTime,
  ifinalMsg,
  mode,
  band,
  confirmed,
  isQSO,
  finalRSTrecv,
  finalDxcc,
  finalState,
  finalCont,
  finalCnty,
  finalCqZone,
  finalItuZone,
  finalVucc = [],
  finalPropMode = "",
  finalDigital = false,
  finalPhone = false,
  finalIOTA = "",
  finalSatName = "",
  finalPOTA = null
)
{
  var callsign = null;
  var wspr = mode == "WSPR" ? band : null;
  var hash = "";

  var finalMsg = ifinalMsg.trim();
  if (finalMsg.length > 40) finalMsg = finalMsg.substring(0, 40) + "...";

  if (finalDxcc < 1) finalDxcc = callsignToDxcc(finalDXcall);

  hash = finalDXcall + band + mode;

  if (hash in GT.liveCallsigns) callsign = GT.liveCallsigns[hash];

  if (finalDxcc in GT.dxccCount) GT.dxccCount[finalDxcc]++;
  else GT.dxccCount[finalDxcc] = 1;

  if (wspr != null && validateMapBandAndMode(band, mode))
  {
    qthToBox(finalGrid, finalDXcall, false, false, finalDEcall, band, wspr, hash, false);
  }

  if (callsign == null)
  {
    var newCallsign = {};
    newCallsign.DEcall = finalDXcall;
    newCallsign.grid = finalGrid;
    newCallsign.field = finalGrid.substring(0, 2);
    newCallsign.mode = mode;
    newCallsign.band = band;
    newCallsign.msg = finalMsg;
    newCallsign.dxcc = finalDxcc;
    newCallsign.worked = false;
    newCallsign.confirmed = false;
    newCallsign.RSTsent = "-";
    newCallsign.RSTrecv = "-";
    newCallsign.dt = 0.0;
    newCallsign.qso = false;
    newCallsign.distance = 0;
    newCallsign.px = null;
    newCallsign.zone = null;
    newCallsign.pota = null;
    newCallsign.cnty = finalCnty;
    newCallsign.cont = finalCont;
    if (finalDxcc > -1)
    {
      newCallsign.px = getWpx(finalDXcall);
      if (newCallsign.px)
      {
        newCallsign.zone = Number(
          newCallsign.px.charAt(newCallsign.px.length - 1)
        );
      }

      if (newCallsign.cont == null)
      {
        newCallsign.cont = GT.dxccInfo[finalDxcc].continent;
        if (newCallsign.dxcc == 390 && newCallsign.zone == 1) { newCallsign.cont = "EU"; }
      }
    }
    if (finalRSTsent != null)
    {
      newCallsign.RSTsent = finalRSTsent;
    }
    if (finalRSTrecv != null)
    {
      newCallsign.RSTrecv = finalRSTrecv;
    }
    newCallsign.time = finalTime;
    newCallsign.age = finalTime;
    newCallsign.delta = -1;
    newCallsign.DXcall = finalDEcall;
    newCallsign.wspr = wspr;
    newCallsign.state = finalState;
    newCallsign.alerted = false;
    newCallsign.instance = null;
    newCallsign.shouldAlert = false;
    newCallsign.zipcode = null;
    newCallsign.qrz = false;
    newCallsign.vucc_grids = [];
    newCallsign.propMode = "";
    newCallsign.digital = finalDigital;
    newCallsign.phone = finalPhone;
    newCallsign.IOTA = finalIOTA;
    newCallsign.satName = finalSatName;
    newCallsign.hash = hash;

    if (newCallsign.state == null && isKnownCallsignDXCC(newCallsign.dxcc))
    {
      var fourGrid = finalGrid.substr(0, 4);
      if (fourGrid in GT.gridToState && GT.gridToState[fourGrid].length == 1)
      {
        newCallsign.state = GT.gridToState[fourGrid][0];
      }
    }

    if (GT.callsignLookups.ulsUseEnable && isKnownCallsignUS(finalDxcc) && (newCallsign.state == null || newCallsign.cnty == null))
    {
      lookupKnownCallsign(newCallsign);
    }
    else if (newCallsign.state == null)
    {
      if (finalDxcc == 1 && GT.callsignLookups.cacUseEnable && finalDXcall in GT.cacCallsigns)
      {
        newCallsign.state = "CA-" + GT.cacCallsigns[finalDXcall];
      }
    }
    GT.liveCallsigns[hash] = newCallsign;
  }
  else
  {
    if (callsign.DXcall != "Self" && finalTime > callsign.time)
    {
      callsign.time = finalTime;
      callsign.age = finalTime;
      callsign.mode = mode;
      callsign.band = band;
      callsign.delta = -1;
      callsign.DXcall = finalDEcall;
      callsign.msg = finalMsg;
      callsign.dxcc = finalDxcc;
      callsign.wspr = wspr;
      if (finalGrid.length > callsign.grid.length) callsign.grid = finalGrid;
      if (finalGrid.length == callsign.grid.length && finalGrid != callsign.grid) callsign.grid = finalGrid;
      callsign.field = callsign.grid.substring(0, 2);
      if (finalRSTsent != null) callsign.RSTsent = finalRSTsent;
      if (finalRSTrecv != null) callsign.RSTrecv = finalRSTrecv;
      callsign.vucc_grids = [];
      callsign.propMode = "";
      callsign.digital = finalDigital;
      callsign.phone = finalPhone;
      callsign.IOTA = finalIOTA;
      callsign.satName = finalSatName;
    }
  }
}

function timeoutSetUdpPort()
{
  GT.appSettings.wsjtUdpPort = udpPortInput.value;
  lastMsgTimeDiv.innerHTML = I18N("gt.timeoutSetUdpPort");
  GT.setNewUdpPortTimeoutHandle = null;
}

function setUdpPort()
{
  if (GT.setNewUdpPortTimeoutHandle != null) { nodeTimers.clearTimeout(GT.setNewUdpPortTimeoutHandle); }
  lastMsgTimeDiv.innerHTML = I18N("gt.setUdpPort");
  GT.setNewUdpPortTimeoutHandle = nodeTimers.setTimeout(timeoutSetUdpPort, 1000);
}

function changeGridDecay()
{
  GT.appSettings.gridsquareDecayTime = parseInt(gridDecay.value);
  decayRateTd.innerHTML =
    Number(GT.appSettings.gridsquareDecayTime) == 0
      ? "<I>No Decay</I>"
      : toDHMS(Number(GT.appSettings.gridsquareDecayTime));
}

function changeMouseOverValue()
{
  GT.mapSettings.mouseOver = mouseOverValue.checked;
  saveMapSettings();
}

function changeMergeOverlayValue()
{
  GT.mapSettings.mergeOverlay = mergeOverlayValue.checked;
  saveMapSettings();
  setTrophyOverlay(GT.currentOverlay);
}

function getPathColor()
{
  if (GT.mapSettings.nightMapEnable && GT.nightTime)
  {
    if (GT.mapSettings.nightPathColor == 0) return "#000";
    if (GT.mapSettings.nightPathColor == 361) return "#FFF";
    return "hsl(" + GT.mapSettings.nightPathColor + ", 100%, 50%)";
  }
  else
  {
    if (GT.mapSettings.pathColor == 0) return "#000";
    if (GT.mapSettings.pathColor == 361) return "#FFF";
    return "hsl(" + GT.mapSettings.pathColor + ", 100%, 50%)";
  }
}

function getQrzPathColor()
{
  if (GT.mapSettings.nightMapEnable && GT.nightTime)
  {
    if (GT.mapSettings.nightQrzPathColor == 0) return "#000";
    if (GT.mapSettings.nightQrzPathColor == 361) return "#FFF";
    return "hsl(" + GT.mapSettings.nightQrzPathColor + ", 100%, 50%)";
  }
  else
  {
    if (GT.mapSettings.qrzPathColor == 0) return "#000";
    if (GT.mapSettings.qrzPathColor == 361) return "#FFF";
    return "hsl(" + GT.mapSettings.qrzPathColor + ", 100%, 50%)";
  }
}

function changeGrayline()
{
  GT.mapSettings.graylineOpacity = graylineValue.value;
  showDarknessTd.innerHTML = parseInt(graylineValue.value * 100) + "%";
  saveMapSettings();
  GT.nightTime = dayNight.refresh();
}

function changePathValues()
{
  GT.appSettings.pathWidthWeight = pathWidthValue.value;
  GT.appSettings.qrzPathWidthWeight = qrzPathWidthValue.value;
  GT.mapSettings.pathColor = pathColorValue.value;
  GT.mapSettings.qrzPathColor = qrzPathColorValue.value;

  pathWidthTd.innerHTML = pathWidthValue.value;
  qrzPathWidthTd.innerHTML = qrzPathWidthValue.value;
  setMapColors();
  saveMapSettings();
  styleAllFlightPaths();
}

function styleAllFlightPaths()
{
  for (var i = GT.flightPaths.length - 1; i >= 0; i--)
  {
    var featureStyle = GT.flightPaths[i].getStyle();
    var featureStroke = featureStyle.getStroke();

    var color = GT.flightPaths[i].isQRZ ? getQrzPathColor() : getPathColor();
    var width = GT.flightPaths[i].isQRZ ? qrzPathWidthValue.value : pathWidthValue.value;

    if (width == 0)
    {
      if ("Arrow" in GT.flightPaths[i]) { GT.layerSources.flight.removeFeature(GT.flightPaths[i].Arrow); }
      GT.layerSources.flight.removeFeature(GT.flightPaths[i]);
      delete GT.flightPaths[i];
      GT.flightPaths[i] = null;

      GT.flightPaths.splice(i, 1);
      continue;
    }

    featureStroke.setWidth(width);

    if (GT.flightPaths[i].isShapeFlight == 0) featureStroke.setColor(color);

    featureStyle.setStroke(featureStroke);
    GT.flightPaths[i].setStyle(featureStyle);

    if ("Arrow" in GT.flightPaths[i])
    {
      var stroke = new ol.style.Stroke({
        color: color,
        width: width
      });
      var thisStle = new ol.style.Style({
        image: new ol.style.Circle({
          stroke: stroke,
          radius: 3
        })
      });
      GT.flightPaths[i].Arrow.setStyle(thisStle);
    }
  }
  if (GT.transmitFlightPath != null)
  {
    var featureStyle = GT.transmitFlightPath.getStyle();
    var featureStroke = featureStyle.getStroke();

    if (qrzPathWidthValue.value == 0)
    {
      GT.layerSources.transmit.clear();
      GT.transmitFlightPath = null;
    }
    else
    {
      featureStroke.setWidth(qrzPathWidthValue.value);
      featureStroke.setColor(getQrzPathColor());
      featureStyle.setStroke(featureStroke);
      GT.transmitFlightPath.setStyle(featureStyle);

      if ("Arrow" in GT.transmitFlightPath)
      {
        var stroke = new ol.style.Stroke({
          color: getQrzPathColor(),
          width: qrzPathWidthValue.value
        });
        var thisStle = new ol.style.Style({
          image: new ol.style.Circle({
            stroke: stroke,
            radius: 3
          })
        });
        GT.transmitFlightPath.Arrow.setStyle(thisStle);
      }
    }
  }
}

function compareCallsignTime(a, b)
{
  if (a.time < b.time) return -1;
  if (a.time > b.time) return 1;
  return 0;
}

function createSpotTipTable(toolElement)
{
  try
  {
    var now = timeNowSec();
    var worker = "";
    if (toolElement.spot in GT.receptionReports.spots)
    {
      GT.layerSources.pskHop.clear();
      var report = GT.receptionReports.spots[toolElement.spot];

      var LL = squareToCenter(GT.appSettings.myRawGrid);
      var fromPoint = ol.proj.fromLonLat([LL.o, LL.a]);

      worker = "<table id='tooltipTable' class='darkTable' ><tr><th colspan=2 style='color:cyan'>Rx Spot</th></tr>";
      worker += "<tr><td>Call</td><td style='color:#ff0' >" + formatCallsign(report.call) + "</td></tr>";
      worker += "<tr><td>dB</td><td style='color:#DD44DD' >" + formatSignalReport(Number(report.snr)) + "</td></tr>";
      worker += "<tr><td>Age</td><td>" + toDHMS(Number(now - report.when)) + "</td></tr>";

      if (report.dxcc > 0)
      {
        worker += "<tr><td>DXCC</td><td style='color:orange;'>" + GT.dxccToAltName[report.dxcc] + " <font color='lightgreen'>(" + GT.dxccInfo[report.dxcc].pp + ")</font></td>";
      }

      worker += "<tr><td>Grid</td><td style='color:cyan;cursor:pointer' >" + report.grid + "</td></tr>";
      worker += "<tr><td>Freq</td><td style='color:lightgreen' >" + formatMhz(report.freq) + " <font color='yellow'>(" + report.band + ")</font></td></tr>";
      worker += "<tr><td>Mode</td><td style='color:orange' >" + report.mode + "</td></tr>";

      LL = squareToCenter(report.grid);

      report.bearing = parseInt(MyCircle.bearing(GT.myLat, GT.myLon, LL.a, LL.o));
      worker += "<tr><td>Dist</td><td style='color:cyan'>" + parseInt(MyCircle.distance(GT.myLat, GT.myLon, LL.a, LL.o, distanceUnit.value) * MyCircle.validateRadius(distanceUnit.value)) + distanceUnit.value.toLowerCase() + "</td></tr>";
      worker += "<tr><td>Azim</td><td style='color:yellow'>" + report.bearing + "&deg;</td></tr>";
      worker += "<tr><td>Time</td><td>" + userTimeString(report.when * 1000) + "</td></tr>";
      if ("source" in report)
      {
        let color = (report.source == "O" ? "cyan;font-size: larger" : "orange");
        let fullSource = (report.source == "O" ? "OAMS Realtime Network" : "PSK-Reporter");
        worker += "<tr><td>Source</td><td style='color:" + color + ";'>" + fullSource + "</font></td>";
      }
      worker += "</table>";

      var strokeWeight = pathWidthValue.value;
      var toPoint = ol.proj.fromLonLat([LL.o, LL.a]);

      flightFeature(
        [fromPoint, toPoint],
        {
          weight: strokeWeight,
          color: getQrzPathColor(),
          steps: 75
        },
        "pskHop",
        false
      );
    }
    myTooltip.innerHTML = worker;
    return 10;
  }
  catch (err)
  {
    console.error("Unexpected error at createSpotTipTable", toolElement, err)
  }
}

function createTooltTipTable(toolElement)
{
  if ("spot" in toolElement)
  {
    return createSpotTipTable(toolElement);
  }
  var colspan = 10;
  if (GT.callsignLookups.lotwUseEnable == true) colspan++;
  if (GT.callsignLookups.eqslUseEnable == true) colspan++;
  if (GT.callsignLookups.oqrsUseEnable == true) colspan++;
  if (toolElement.qso == true) colspan += 2;

  var worker = "<table id='tooltipTable' class='darkTable' ><tr><th colspan=" +
    colspan + " style='color:cyan'>" +
    toolElement.qth + " (<font color='white'>" + I18N((toolElement.qso ? "gt.gridView.logbook" : "gt.gridView.live")) + "</font>)</th></tr>";
  if (toolElement.qth in GT.gridToDXCC)
  {
    worker += "<tr><th colspan=" + colspan + " style='color:yellow'><small>";
    for (var x = 0; x < GT.gridToDXCC[toolElement.qth].length; x++)
    {
      worker += GT.dxccToAltName[GT.gridToDXCC[toolElement.qth][x]];
      if (toolElement.qth in GT.gridToState)
      {
        worker += " (<font color='orange'>";
        var added = false;
        for (var y = 0; y < GT.gridToState[toolElement.qth].length; y++)
        {
          if (GT.gridToDXCC[toolElement.qth][x] == GT.StateData[GT.gridToState[toolElement.qth][y]].dxcc)
          {
            worker += GT.StateData[GT.gridToState[toolElement.qth][y]].name + " / ";
            added = true;
          }
        }
        if (added == true) { worker = worker.substr(0, worker.length - " / ".length); }
        worker += "</font>)";
      }
      if (x + 1 < GT.gridToDXCC[toolElement.qth].length) worker += ", ";
    }
    worker += "</small></th></tr>";
  }
  var newCallList = Array();
  if (toolElement.qso == true)
  {
    if (Object.keys(toolElement.hashes).length > 0)
    {
      worker += "<tr align='center'>" +
          "<td>" + I18N("gt.newCallList.Call") + "</td>" +
          "<td>" + I18N("gt.newCallList.Freq") + "</td>" +
          "<td>" + I18N("gt.newCallList.Sent") + "</td>" +
          "<td>" + I18N("gt.newCallList.Rcvd") + "</td>" +
          "<td>" + I18N("gt.newCallList.Station") + "</td>" +
          "<td>" + I18N("gt.newCallList.Mode") + "</td>" +
          "<td>" + I18N("gt.newCallList.Band") + "</td>" +
          "<td>" + I18N("gt.newCallList.QSL") + "</td>" +
          "<td>" + I18N("gt.newCallList.LastMsg") + "</td>" +
          "<td>" + I18N("gt.newCallList.DXCC") + "</td>" +
          "<td>" + I18N("gt.newCallList.Time") + "</td>";

      if (GT.callsignLookups.lotwUseEnable == true) worker += "<td>" + I18N("gt.qsoPage.LoTW") + "</td>";
      if (GT.callsignLookups.eqslUseEnable == true) worker += "<td>" + I18N("gt.qsoPage.eQSL") + "</td>";
      if (GT.callsignLookups.oqrsUseEnable == true) worker += "<td>" + I18N("gt.qsoPage.OQRS") + "</td>";
      worker += "</tr>";
    }
    for (var KeyIsHash in toolElement.hashes)
    {
      if (KeyIsHash in GT.QSOhash)
      {
        newCallList.push(GT.QSOhash[KeyIsHash]);
      }
    }
    if (toolElement.qth in GT.liveGrids && GT.liveGrids[toolElement.qth].rectangle != null && GT.liveGrids[toolElement.qth].isTriangle == false)
    {
      for (var KeyIsCall in GT.liveGrids[toolElement.qth].rectangle.liveHash)
      {
        if (KeyIsCall in GT.liveCallsigns && GT.appSettings.gridViewMode == 3) { newCallList.push(GT.liveCallsigns[KeyIsCall]); }
      }
    }
  }
  else
  {
    if (toolElement.liveHash != null && Object.keys(toolElement.liveHash).length > 0)
    {
      worker +=
        "<tr align='center'>" +
          "<td>" + I18N("gt.newCallList.Call") + "</td>" +
          "<td>" + I18N("gt.newCallList.Freq") + "</td>" +
          "<td>" + I18N("gt.newCallList.Sent") + "</td>" +
          "<td>" + I18N("gt.newCallList.Rcvd") + "</td>" +
          "<td>" + I18N("gt.newCallList.Station") + "</td>" +
          "<td>" + I18N("gt.newCallList.Mode") + "</td>" +
          "<td>" + I18N("gt.newCallList.Band") + "</td>" +
          "<td>" + I18N("gt.newCallList.LastMsg") + "</td>" +
          "<td>" + I18N("gt.newCallList.DXCC") + "</td>" +
          "<td>" + I18N("gt.newCallList.Time") + "</td>";

      if (GT.callsignLookups.lotwUseEnable == true) worker += "<td>" + I18N("gt.newCallList.LoTW") + "</td>";
      if (GT.callsignLookups.eqslUseEnable == true) worker += "<td>" + I18N("gt.newCallList.eQSL") + "</td>";
      if (GT.callsignLookups.oqrsUseEnable == true) worker += "<td>" + I18N("gt.newCallList.OQRS") + "</td>";
      worker += "</tr>";
    }
    for (var KeyIsCall in toolElement.liveHash)
    {
      if (KeyIsCall in GT.liveCallsigns) { newCallList.push(GT.liveCallsigns[KeyIsCall]); }
    }
  }
  newCallList.sort(compareCallsignTime).reverse();
  for (var x = 0; x < newCallList.length; x++)
  {
    var callsign = newCallList[x];
    var bgDX = " style='font-weight:bold;color:cyan;' ";
    var bgDE = " style='font-weight:bold;color:yellow;' ";
    if (callsign.DXcall == GT.appSettings.myCall) { bgDX = " style='background-color:cyan;color:#000;font-weight:bold' "; }
    if (callsign.DEcall == GT.appSettings.myCall) { bgDE = " style='background-color:#FFFF00;color:#000;font-weight:bold' "; }
    if (typeof callsign.msg == "undefined" || callsign.msg == "") { callsign.msg = "-"; }
    var ageString = "";
    if (timeNowSec() - callsign.time < 3601) { ageString = toDHMS(timeNowSec() - callsign.time); }
    else
    {
      ageString = userTimeString(callsign.time * 1000);
    }
    worker += "<tr><td" + bgDE + ">";
    worker +=
      "<div style='display:inline-table;cursor:pointer' onclick='startLookup(\"" +
      callsign.DEcall +
      "\",\"" +
      toolElement.qth +
      "\");' >" +
      formatCallsign(callsign.DEcall) +
      "</div>";
    worker += "</td>";
    worker += "<td>" + (callsign.delta > -1 ? callsign.delta : "-") + "</td>";
    worker += "<td>" + callsign.RSTsent + "</td>";
    worker += "<td>" + callsign.RSTrecv + "</td>" + "<td" + bgDX + ">";
    if (callsign.DXcall.indexOf("CQ") == 0 || callsign.DXcall == "-") { worker += formatCallsign(callsign.DXcall); }
    else
    {
      worker +=
        "<div  style='display:inline-table;cursor:pointer' onclick='startLookup(\"" +
        callsign.DXcall +
        "\",null);' >" +
        formatCallsign(callsign.DXcall) +
        "</div>";
    }
    worker +=
      "</td>" +
      "<td style='color:lightblue'>" +
      callsign.mode +
      "</td>" +
      "<td style='color:lightgreen'>" +
      callsign.band +
      "</td>";
    if (toolElement.qso == true)
    {
      worker +=
        "<td align='center'>" +
        (callsign.confirmed ? "&#10004;" : "") +
        "</td>";
    }
    worker +=
      "<td>" +
      callsign.msg +
      "</td><td style='color:yellow'>" +
      GT.dxccToAltName[callsign.dxcc] +
      " <font color='lightgreen'>(" +
      GT.dxccInfo[callsign.dxcc].pp +
      ")</font></td>" +
      "<td align='center' style='color:lightblue' >" +
      ageString +
      "</td>";

    if (GT.callsignLookups.lotwUseEnable == true)
    {
      worker +=
        "<td align='center'>" +
        (callsign.DEcall in GT.lotwCallsigns ? "&#10004;" : "") +
        "</td>";
    }
    if (GT.callsignLookups.eqslUseEnable == true)
    {
      worker +=
        "<td align='center'>" +
        (callsign.DEcall in GT.eqslCallsigns ? "&#10004;" : "") +
        "</td>";
    }
    if (GT.callsignLookups.oqrsUseEnable == true)
    {
      worker +=
        "<td align='center'>" +
        (callsign.DEcall in GT.oqrsCallsigns ? "&#10004;" : "") +
        "</td>";
    }

    worker += "</tr>";
  }
  worker += "</table>";
  myTooltip.innerHTML = worker;
  return newCallList.length;
}

function leftClickGtFlag(feature)
{
  var e = window.event;
  if ((e.which && e.which == 1) || (e.button && e.button == 1))
  {
    startLookup(GT.gtFlagPins[feature.key].call, GT.gtFlagPins[feature.key].grid);
  }
  return false;
}

function openConditionsWindow(show = true)
{
  if (GT.conditionsWindowHandle == null)
  {
    GT.conditionsWindowHandle = window.open("gt_conditions.html","gt_conditions");
  }
  else if (GT.conditionsWindowInitialized)
  {
    show ? electron.ipcRenderer.send("showWin", "gt_conditions") : electron.ipcRenderer.send("hideWin", "gt_conditions");
  }
}

function toggleConditionsBox()
{
  if (GT.conditionsWindowInitialized)
  {
    electron.ipcRenderer.send("toggleWin", "gt_conditions");
  }
}

GT.rosterInitialized = false;
GT.callRoster = {};
GT.rosterUpdateTimer = null;

function insertMessageInRoster(newMessage, msgDEcallsign, msgDXcallsign, callObj, hash)
{
  if (GT.rosterUpdateTimer != null)
  {
    nodeTimers.clearTimeout(GT.rosterUpdateTimer);
    GT.rosterUpdateTimer = null;
  }

  var now = timeNowSec();
  if (!(hash in GT.callRoster))
  {
    GT.callRoster[hash] = {};
    callObj.life = now;
    callObj.reset = false;
  }
  if (callObj.reset)
  {
    callObj.life = now;
    callObj.reset = false;
  }

  if (typeof callObj.life == "undefined")
  {
    callObj.life = now;
    callObj.reset = false;
  }

  GT.callRoster[hash].message = newMessage;
  GT.callRoster[hash].callObj = callObj;
  GT.callRoster[hash].DXcall = msgDXcallsign;
  GT.callRoster[hash].DEcall = msgDEcallsign;

  GT.rosterUpdateTimer = nodeTimers.setTimeout(delayedRosterUpdate, 150);
}

function delayedRosterUpdate()
{
  GT.rosterUpdateTimer = null;
  goProcessRoster();
}

function openCallRosterWindow(show = true)
{
  if (GT.callRosterWindowHandle == null)
  {
    GT.callRosterWindowHandle = window.open("gt_roster.html", "gt_roster");
  }
  else if (GT.rosterInitialized)
  {
    electron.ipcRenderer.send("toggleWin", "gt_roster");
    goProcessRoster();
  }
}

function updateRosterWorked()
{
  if (GT.rosterInitialized)
  {
    try
    {
      GT.callRosterWindowHandle.window.updateWorked();
    }
    catch (e)
    {
      console.error(e);
    }
  }
}

function updateRosterInstances()
{
  if (GT.rosterInitialized)
  {
    try
    {
      GT.callRosterWindowHandle.window.updateInstances();
    }
    catch (e)
    {
      console.error(e);
    }
  }
}

// Called from GridTracher.html
function changeLogbookPage()
{
  qsoItemsPerPageTd.innerHTML = GT.appSettings.qsoItemsPerPage = parseInt(qsoItemsPerPageValue.value);
  saveAppSettings();
}

GT.qslAuthorityTimer = null;
// Called from GridTracher.html
function qslAuthorityChanged()
{
  if (GT.qslAuthorityTimer != null)
  {
    nodeTimers.clearTimeout(GT.qslAuthorityTimer);
    GT.qslAuthorityTimer = null;
  }

  GT.appSettings.qslAuthority = qslAuthority.value;
  saveAppSettings();
  // we set the timer as calling directly will pause the input queue
  GT.qslAuthorityTimer = nodeTimers.setTimeout(reloadFromQslAuthorityChanged, 500);
}

function reloadFromQslAuthorityChanged()
{
  GT.qslAuthorityTimer = null;
  clearQSOs(false, "startupAdifLoadCheck"); // do not clear what's on disk!
}

function updateLogbook()
{
  showWorkedBox(0, 0, true);
}

function openStatsWindow(show = true)
{
  if (GT.statsWindowHandle == null)
  {
    GT.statsWindowHandle = window.open("gt_stats.html", "gt_stats");
  }
  else if (GT.statsWindowInitialized == true)
  {
    show ? electron.ipcRenderer.send("showWin", "gt_stats") : electron.ipcRenderer.send("hideWin", "gt_stats");
  }
}

function showMessaging(show = true, cid)
{
  if (GT.chatWindowHandle == null)
  {
    GT.chatWindowHandle = window.open("gt_chat.html", "gt_chat");
  }
  else if (GT.chatWindowInitialized)
  {
    show ? electron.ipcRenderer.send("showWin", "gt_chat") : electron.ipcRenderer.send("hideWin", "gt_chat");
    if (typeof cid != "undefined") GT.chatWindowHandle.window.openId(cid);
  }
}

function toggleMessaging()
{
  if (GT.chatWindowInitialized)
  {
    electron.ipcRenderer.send("toggleWin", "gt_chat");
  }
}

function initPopupWindow()
{
  if (GT.popupWindowHandle == null)
  {
    GT.popupWindowHandle = window.open("gt_popup.html", "gt_popup");
  }
}

function renderTooltipWindow(feature)
{
  if (GT.popupWindowInitialized)
  {
    var positionInfo = myTooltip.getBoundingClientRect();
    GT.popupWindowHandle.window.resizeTo(parseInt(positionInfo.width + 20), parseInt(positionInfo.height + 40));
    GT.popupWindowHandle.window.adifTable.innerHTML = myTooltip.innerHTML;
    electron.ipcRenderer.send("showWin", "gt_popup");
  }
}

function onRightClickGridSquare(feature)
{
  var e = window.event;
  if ((e.which && e.button == 2 && event.shiftKey) || (e.button && e.button == 2 && event.shiftKey))
  {
    createTooltTipTable(feature);
    selectElementContents(myTooltip);
  }
  else if (e.button == 0 && GT.mapSettings.mouseOver == false)
  {
    mouseOverDataItem(feature, false);
  }
  else if ((e.which && e.which == 3) || (e.button && e.button == 2))
  {
    createTooltTipTable(feature);
    renderTooltipWindow(feature);
    mouseOutOfDataItem();
  }
  else if ((e.which && e.which == 1) || (e.button && e.button == 0))
  {
    if ("spot" in feature)
    {
      spotLookupAndSetCall(feature.spot);
    }
  }
  return false;
}

function onMouseUpdate(e)
{
  GT.mouseX = e.pageX;
  GT.mouseY = e.pageY;
  GT.screenX = e.screenX;
  GT.screenY = e.screenY;
  mouseMoveGrid();
}

function getMouseX()
{
  return GT.mouseX;
}

function getMouseY()
{
  return GT.mouseY;
}
GT.tempGridBox = null;

function tempGridToBox(iQTH, oldGrid, borderColor, boxColor, layer)
{
  var borderWeight = 2;
  var newGridBox = null;
  var LL = squareToLatLong(iQTH.substr(0, 4));
  if (oldGrid)
  {
    if (GT.layerSources.temp.hasFeature(oldGrid)) { GT.layerSources.temp.removeFeature(oldGrid); }
  }
  var bounds = [
    [LL.lo1, LL.la1],
    [LL.lo2, LL.la2]
  ];
  newGridBox = rectangle(bounds);
  newGridBox.setId(iQTH);
  const featureStyle = new ol.style.Style({
    fill: new ol.style.Fill({
      color: boxColor
    }),
    stroke: new ol.style.Stroke({
      color: borderColor,
      width: borderWeight,
      lineJoin: "round"
    }),
    zIndex: 60
  });
  newGridBox.setStyle(featureStyle);
  newGridBox.grid = iQTH;
  newGridBox.size = 0;
  GT.layerSources.temp.addFeature(newGridBox);
  return newGridBox;
}
GT.tempGrids = Array();

function onMyKeyDown(event)
{
  if (event.keyCode == 27)
  {
    rootSettingsDiv.style.display = "none";
    helpDiv.style.display = "none";
    GT.helpShow = false;
  }
  if (GT.movingButton != null)
  {
    if (event.key == "ArrowRight")
    {
      panelRightArrow();
    }
    else if (event.key == "ArrowLeft")
    {
      panelLeftArrow();
    }
    else if (event.keyCode == 27 || event.keyCode == 13)
    {
      buttonPanelMouseLeave();
    }
  }
  if (rootSettingsDiv.style.display == "none")
  {
    if (event.code in GT.hotKeys)
    {
      if (typeof GT.hotKeys[event.code].param1 != "undefined")
      {
        var param2 = null;
        if (typeof GT.hotKeys[event.code].param2 != "undefined")
        {
          if (typeof event[GT.hotKeys[event.code].param2] != "undefined") { param2 = event[GT.hotKeys[event.code].param2]; }
        }
        GT.hotKeys[event.code].func(GT.hotKeys[event.code].param1, param2);
      }
      else
      {
        if (event.ctrlKey == false) GT.hotKeys[event.code].func();
      }
    }
    else if (event.key in GT.hotKeys)
    {
      if (typeof GT.hotKeys[event.key].param1 != "undefined")
      {
        var param2 = null;
        if (typeof GT.hotKeys[event.key].param2 != "undefined")
        {
          if (typeof event[GT.hotKeys[event.key].param2] != "undefined") { param2 = event[GT.hotKeys[event.key].param2]; }
        }
        GT.hotKeys[event.key].func(GT.hotKeys[event.key].param1, param2);
      }
      else
      {
        if (event.ctrlKey == false) GT.hotKeys[event.key].func();
      }
    }
  }
}

function clearTempGrids()
{
  GT.layerSources.temp.clear();
  GT.tempGrids = Array();
}

GT.currentShapes = {};

function clearCurrentShapes()
{
  GT.layerSources.award.clear();
  GT.currentShapes = {};
}

function mapMemory(x, save, internal = false)
{
  if (save == true)
  {
    GT.mapMemory[x].LoLa = ol.proj.toLonLat(GT.mapView.getCenter(), GT.mapSettings.projection);
    GT.mapMemory[x].zoom = GT.mapView.getZoom() / 0.333;
    GT.mapMemory[x].bearing = GT.mapView.getRotation();
    GT.localStorage.mapMemory = JSON.stringify(GT.mapMemory);
    if (internal == false)
    {
      playAlertMediaFile("Clicky-3.mp3");
    }
  }
  else
  {
    if (GT.mapMemory[x].zoom != -1)
    {
      GT.mapView.setCenter(ol.proj.fromLonLat(GT.mapMemory[x].LoLa, GT.mapSettings.projection));
      GT.mapView.setZoom(GT.mapMemory[x].zoom * 0.333);
      GT.mapView.setRotation(GT.mapMemory[x].bearing);
    }
  }
}

GT.hotKeys = {};

function registerHotKey(key, func, param1, param2)
{
  GT.hotKeys[key] = {};
  GT.hotKeys[key].func = func;
  GT.hotKeys[key].param1 = param1;
  GT.hotKeys[key].param2 = param2;
}

function registerHotKeys()
{
  registerHotKey("1", setTrophyOverlay, 0);
  registerHotKey("2", setTrophyOverlay, 1);
  registerHotKey("3", setTrophyOverlay, 2);
  registerHotKey("4", setTrophyOverlay, 3);
  registerHotKey("5", setTrophyOverlay, 4);
  registerHotKey("6", setTrophyOverlay, 5);
  registerHotKey("7", setTrophyOverlay, 6);
  registerHotKey("8", setTrophyOverlay, 7);
  registerHotKey("9", setTrophyOverlay, 8);
  registerHotKey("0", toggleNexrad);
  registerHotKey("Equal", cycleTrophyOverlay);

  registerHotKey("KeyA", toggleAnimate);
  registerHotKey("KeyB", toggleAllGrids);
  registerHotKey("KeyC", showConditionsBox);
  registerHotKey("KeyD", toggleMoon);
  registerHotKey("KeyE", toggleMoonTrack);
  registerHotKey("KeyF", toggleSpotPaths);
  registerHotKey("KeyG", toggleGtMap);
  registerHotKey("KeyH", toggleTimezones);
  registerHotKey("KeyI", showRootInfoBox);

  registerHotKey("KeyL", adifLoadDialog);
  registerHotKey("KeyM", toggleAlertMute);
  registerHotKey("KeyN", toggleEarth);
  registerHotKey("KeyO", cycleSpotsView);
  registerHotKey("KeyP", togglePushPinMode);
  registerHotKey("KeyQ", cycleGridView);
  registerHotKey("KeyR", openCallRosterWindow);
  registerHotKey("KeyS", showSettingsBox);
  registerHotKey("KeyT", toggleSpotOverGrids);
  registerHotKey("KeyU", toggleMergeOverlay);
  registerHotKey("KeyW", toggleGridMode);
  registerHotKey("KeyX", toggleMouseTrack);
  registerHotKey("KeyZ", setCenterQTH);
  registerHotKey("Minus", toggleCRScript);

  registerHotKey("F5", mapMemory, 0, "shiftKey");
  registerHotKey("F6", mapMemory, 1, "shiftKey");
  registerHotKey("F7", mapMemory, 2, "shiftKey");
  registerHotKey("F8", mapMemory, 3, "shiftKey");
  registerHotKey("F9", mapMemory, 4, "shiftKey");
  registerHotKey("F10", mapMemory, 5, "shiftKey");
  registerHotKey("F11", toggleFullscreen);
  registerHotKey("F12", toggleMenu);
  registerHotKey("F1", toggleHelp);
  registerHotKey("?", toggleHelp);
}

function toggleMoon()
{
  GT.appSettings.moonTrack ^= 1;

  if (GT.appSettings.moonTrack == 1)
  {
    moonLayer.show();
  }
  else
  {
    moonLayer.hide();
  }
}

function toggleMoonTrack()
{
  GT.appSettings.moonPath ^= 1;

  moonLayer.refresh();
}

function toggleFullscreen()
{
  if (document.fullscreenElement == null)
  {
    mainBody.requestFullscreen();
  }
  else
  {
    document.exitFullscreen();
  }
}

function toggleMenu()
{
  if (GT.menuShowing == false) collapseMenu(false);
  else collapseMenu(true);
}

GT.helpShow = false;
function toggleHelp()
{
  GT.helpShow = !GT.helpShow;
  if (GT.helpShow == true)
  {
    helpDiv.style.display = "block";
  }
  else helpDiv.style.display = "none";
}

function onMyKeyUp(event) { }

function cycleTrophyOverlay()
{
  GT.currentOverlay++;
  GT.currentOverlay %= 9;

  setTrophyOverlay(GT.currentOverlay);
}

function didWork(testObj)
{
  return testObj.worked;
}

function didConfirm(testObj)
{
  return testObj.confirmed;
}

function makeTitleInfo(mapWindow)
{
  var band = GT.appSettings.gtBandFilter.length == 0 ? "Mixed" : GT.appSettings.gtBandFilter == "auto" ? GT.appSettings.myBand : GT.appSettings.gtBandFilter;
  var mode = GT.appSettings.gtModeFilter.length == 0 ? "Mixed" : GT.appSettings.gtModeFilter == "auto" ? GT.appSettings.myMode : GT.appSettings.gtModeFilter;

  var news = `GridTracker2 [Band: ${band} Mode: ${mode}`;
  var end = "]";

  if (mapWindow)
  {
    news += ` Layer: ${GT.viewInfo[GT.currentOverlay][1]}`;
  }

  if (GT.currentOverlay == 0 && GT.appSettings.gridViewMode == 1) { return news + end; }

  var workline = ` - Worked ${GT.viewInfo[GT.currentOverlay][2]} Confirmed ${GT.viewInfo[GT.currentOverlay][3]}`;
  if (GT.viewInfo[GT.currentOverlay][2] <= GT.viewInfo[GT.currentOverlay][4] && GT.viewInfo[GT.currentOverlay][4] > 0)
  {
    end = ` Needed ${(GT.viewInfo[GT.currentOverlay][4] - GT.viewInfo[GT.currentOverlay][2])}]`;
  }
  return news + workline + end;
}

function gtTrophyLayerChanged(element)
{
  setTrophyOverlay(element.value);
  saveMapSettings();
}

function setTrophyOverlay(which)
{
  gtTrophyLayer.value = GT.currentOverlay = GT.mapSettings.trophyOverlay = which;
  window.document.title = makeTitleInfo(true);
  // trophyImg.src = GT.trophyImageArray[which];
  myTrophyTooltip.style.zIndex = -1;
  clearCurrentShapes();
  // set the scope of key
  var key = 0;

  if (which == 0)
  {
    for (key in GT.layerVectors)
    {
      GT.layerVectors[key].setVisible(true);
    }
    GT.layerVectors.award.setVisible(false);
    if (GT.timezoneLayer)
    {
      GT.timezoneLayer.setVisible(true);
    }
  }
  else
  {
    if (GT.mapSettings.mergeOverlay == false)
    {
      for (key in GT.layerVectors)
      {
        GT.layerVectors[key].setVisible(false);
      }
    }
    else
    {
      for (key in GT.layerVectors)
      {
        GT.layerVectors[key].setVisible(true);
      }
    }
    GT.layerVectors.award.setVisible(true);
    if (GT.timezoneLayer)
    {
      GT.timezoneLayer.setVisible(false);
    }
    mapLoseFocus();
  }

  if (GT.appSettings.gtFlagImgSrc > 0 && GT.appSettings.gtShareEnable == true && GT.mapSettings.offlineMode == false)
  {
    GT.layerVectors.gtflags.setVisible(true);
  }
  else
  {
    GT.layerVectors.gtflags.setVisible(false);
  }

  if (which == 1)
  {
    for (key in GT.cqZones)
    {
      var boxColor = "#FF000015";
      var borderColor = "#005500FF";
      var borderWeight = 1;
      if (didConfirm(GT.cqZones[key]))
      {
        boxColor = "#00FF0066";
      }
      else if (didWork(GT.cqZones[key]))
      {
        boxColor = "#FFFF0066";
      }

      GT.currentShapes[key] = shapeFeature(
        key,
        GT.cqZones[key].geo,
        "cqzone",
        boxColor,
        borderColor,
        borderWeight
      );
      GT.layerSources.award.addFeature(GT.currentShapes[key]);
    }
  }
  if (which == 2)
  {
    for (key in GT.ituZones)
    {
      var boxColor = "#FF000015";
      var borderColor = "#800080FF";
      var borderWeight = 1;
      if (didConfirm(GT.ituZones[key]))
      {
        boxColor = "#00FF0066";
        borderWeight = 1;
      }
      else if (didWork(GT.ituZones[key]))
      {
        boxColor = "#FFFF0066";
        borderWeight = 1;
      }

      GT.currentShapes[key] = shapeFeature(
        key,
        GT.ituZones[key].geo,
        "ituzone",
        boxColor,
        borderColor,
        borderWeight
      );
      GT.layerSources.award.addFeature(GT.currentShapes[key]);
    }
  }
  if (which == 3)
  {
    for (key in GT.wacZones)
    {
      var boxColor = "#FF000015";
      var borderColor = "#006666FF";
      var borderWeight = 1;
      var originalKey = key;
      if (didConfirm(GT.wacZones[key]))
      {
        boxColor = "#00FF0066";
      }
      else if (didWork(GT.wacZones[key]))
      {
        boxColor = "#FFFF0066";
      }

      GT.currentShapes[originalKey] = shapeFeature(
        originalKey,
        GT.wacZones[originalKey].geo,
        "wac",
        boxColor,
        borderColor,
        borderWeight
      );
      GT.layerSources.award.addFeature(GT.currentShapes[originalKey]);
    }
  }
  if (which == 4)
  {
    for (key in GT.wasZones)
    {
      var boxColor = "#FF000020";
      var borderColor = "#0000FFFF";
      var borderWeight = 1;
      if (didConfirm(GT.wasZones[key]))
      {
        boxColor = "#00FF0066";
      }
      else if (didWork(GT.wasZones[key]))
      {
        boxColor = "#FFFF0066";
      }

      GT.currentShapes[key] = shapeFeature(
        key,
        GT.wasZones[key].geo,
        "was",
        boxColor,
        borderColor,
        borderWeight
      );
      GT.layerSources.award.addFeature(GT.currentShapes[key]);
    }
  }
  if (which == 5)
  {
    for (key in GT.dxccInfo)
    {
      var boxColor = "#FF000015";
      var borderColor = "#0000FFFF";
      var borderWeight = 1;
      if (didConfirm(GT.dxccInfo[key]))
      {
        boxColor = "#00FF0066";
      }
      else if (didWork(GT.dxccInfo[key]))
      {
        boxColor = "#FFFF0066";
      }

      if (GT.dxccInfo[key].geo != "deleted")
      {
        GT.currentShapes[key] = shapeFeature(
          key,
          GT.dxccInfo[key].geo,
          "dxcc",
          boxColor,
          borderColor,
          borderWeight
        );
        GT.layerSources.award.addFeature(GT.currentShapes[key]);
      }
    }
  }
  if (which == 6)
  {
    for (key in GT.countyData)
    {
      var boxColor = "#00000000";
      var borderColor = "#0000FFFF";
      var borderWeight = 0.1;
      if (didConfirm(GT.countyData[key]))
      {
        boxColor = "#00FF0066";
        borderWeight = 1;
      }
      else if (didWork(GT.countyData[key]))
      {
        boxColor = "#FFFF0066";
        borderWeight = 1;
      }

      GT.currentShapes[key] = shapeFeature(
        key,
        GT.countyData[key].geo,
        "usc",
        boxColor,
        borderColor,
        borderWeight
      );
      GT.layerSources.award.addFeature(GT.currentShapes[key]);
    }
  }
  if (which == 7)
  {
    for (key in GT.us48Data)
    {
      var LL = squareToLatLong(key);
      var bounds = [
        [LL.lo1, LL.la1],
        [LL.lo2, LL.la2]
      ];

      var boxColor = "#FF000015";
      var borderColor = "#0000FFFF";
      var borderWeight = 0.1;
      if (GT.us48Data[key].confirmed)
      {
        boxColor = "#00FF0066";
        borderWeight = 0.2;
      }
      else if (GT.us48Data[key].worked)
      {
        boxColor = "#FFFF0066";
        borderWeight = 0.2;
      }

      GT.currentShapes[key] = gridFeature(
        key,
        rectangle(bounds),
        "us48",
        boxColor,
        borderColor,
        borderWeight
      );
      GT.layerSources.award.addFeature(GT.currentShapes[key]);
    }
  }
  if (which == 8)
  {
    for (key in GT.wacpZones)
    {
      var boxColor = "#FF000020";
      var borderColor = "#0000FFFF";
      var borderWeight = 1;
      if (didConfirm(GT.wacpZones[key]))
      {
        boxColor = "#00FF0066";
      }
      else if (didWork(GT.wacpZones[key]))
      {
        boxColor = "#FFFF0066";
      }

      GT.currentShapes[key] = shapeFeature(
        key,
        GT.wacpZones[key].geo,
        "wacp",
        boxColor,
        borderColor,
        borderWeight
      );
      GT.layerSources.award.addFeature(GT.currentShapes[key]);
    }
  }

  updateSpotView(true);
}

function gridFeature(key, objectData, propname, fillColor, borderColor, borderWidth)
{
  var style = new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: borderColor,
      width: borderWidth
    }),
    fill: new ol.style.Fill({
      color: fillColor
    })
  });

  objectData.setStyle(style);
  objectData.set("prop", propname);
  objectData.set("grid", key);
  objectData.size = 2;
  return objectData;
}

function moonOver(feature)
{
  if (GT.currentOverlay != 0) return false;

  var data = subLunar(timeNowSec());
  var object = doRAconvert(GT.myLon, GT.myLat, data.RA, data.Dec);
  var elevation = object.elevation.toFixed(1);
  var elColor = "yellow";
  if (elevation <= 0) elColor = "red";
  if (elevation > 10.0) elColor = "lightgreen";
  var worker = "<table class='darkTable'>";
  worker += "<tr><th colspan=2 style='font-size:15px;color:cyan;'>Moon</th></tr>";
  worker += "<tr><th >Azimuth</th><td  style='color:lightgreen'>" + object.azimuth.toFixed(1) + "&deg;</td></tr>";
  worker += "<tr><th >Elevation</th><td  style='color:" + elColor + "'>" + elevation + "</td></tr>";
  worker += "</table>";
  myMoonTooltip.innerHTML = worker;

  moonMove();

  myMoonTooltip.style.zIndex = 499;
  myMoonTooltip.style.display = "block";

  return true;
}

function moonMove(feature)
{
  var positionInfo = myMoonTooltip.getBoundingClientRect();
  myMoonTooltip.style.left = getMouseX() - positionInfo.width / 2 + "px";
  myMoonTooltip.style.top = getMouseY() - positionInfo.height - 22 + "px";
}

function moonOut(feature)
{
  myMoonTooltip.style.zIndex = -1;
}

function trophyOver(feature)
{
  var name = feature.getGeometryName();
  var infoObject = {};
  var trophy = "";
  var zone = null;

  var key = feature.get("prop");
  if (key == "cqzone")
  {
    trophy = "CQ Zone";
    infoObject = GT.cqZones[name];
    zone = name;
    name = GT.cqZones[name].name;
  }
  else if (key == "ituzone")
  {
    trophy = "ITU Zone";
    infoObject = GT.ituZones[name];
  }
  else if (key == "wac" && name in GT.wacZones)
  {
    trophy = "Continent";
    infoObject = GT.wacZones[name];
  }
  else if (key == "was" && name in GT.wasZones)
  {
    trophy = "US State";
    infoObject = GT.wasZones[name];
    name = GT.StateData[name].name;
  }
  else if (key == "wacp" && name in GT.wacpZones)
  {
    trophy = "CA Provinces";
    infoObject = GT.wacpZones[name];
    name = GT.StateData[name].name;
  }
  else if (key == "dxcc" && name in GT.dxccInfo)
  {
    trophy = "DXCC";
    var ref = name;
    infoObject = GT.dxccInfo[ref];
    name = GT.dxccInfo[ref].name + " <font color='orange'>(" + GT.dxccInfo[ref].pp + ")</font>";
  }
  else if (key == "usc")
  {
    trophy = "US County";
    infoObject = GT.countyData[name];
    name = infoObject.geo.properties.n + ", " + infoObject.geo.properties.st;
  }
  else if (key == "us48")
  {
    trophy = "US Continental Grids";
    infoObject = GT.us48Data[feature.get("grid")];
    name = feature.get("grid");

    if (name in GT.gridToState)
    {
      zone = "";
      for (var x = 0; x < GT.gridToDXCC[name].length; x++)
      {
        if (name in GT.gridToState)
        {
          for (var y = 0; y < GT.gridToState[name].length; y++)
          {
            if (GT.gridToDXCC[name][x] == GT.StateData[GT.gridToState[name][y]].dxcc && GT.gridToDXCC[name][x] == 291)
            {
              zone += GT.StateData[GT.gridToState[name][y]].name + ", ";
            }
          }
        }
      }
      zone = zone.substr(0, zone.length - 2);
    }
  }

  var worker = "<table>";
  worker += "<tr><th colspan=2 >" + trophy + "</th></tr>";
  worker += "<tr><td colspan=2><font color='white'><b>" + name + "</b></font></td></tr>";

  if (zone)
  {
    worker += " <tr><td colspan=2><font color='lightgreen'>" + zone + "</font></td></tr>";
  }

  var wc1Table = "<td></td>";
  if (infoObject.worked)
  {
    wc1Table = "<td align=center><table class='darkTable'>";
    wc1Table += "<tr><td colspan=2 ><font  color='yellow'>" + I18N("gt.wcTable.Worked") + "</font></td></tr>";
    wc1Table += "<tr><td align=right><font color='green'>Band</font></td>";
    wc1Table += "<td align=left><table class='subtable'>";
    var keys = Object.keys(infoObject.worked_bands).sort();
    for (key in keys)
    {
      wc1Table += "<tr><td align=right>" + keys[key] + "</td><td align=left> <font color='white'>(" + infoObject.worked_bands[keys[key]] + ") </font></td></tr>";
    }
    wc1Table += "</table></td>";
    wc1Table += "</tr>";
    wc1Table += "<tr>";
    wc1Table += "<td align=right><font color='orange'>" + I18N("gt.wcTable.Mode") + "</font></td>";
    wc1Table += "<td align=left><table class='subtable'>";
    keys = Object.keys(infoObject.worked_modes).sort();
    for (key in keys)
    {
      wc1Table += "<tr><td align=right>" + keys[key] + "</td><td align=left> <font color='white'>(" + infoObject.worked_modes[keys[key]] + ") </font></td></tr>";
    }

    wc1Table += "</table></td>";
    wc1Table += "</tr>";
    wc1Table += "</table></td>";
  }
  var wcTable = "<td></td>";
  if (infoObject.confirmed)
  {
    wcTable = "<td align=center><table class='darkTable'>";
    wcTable += "<tr><td colspan=2 ><font  color='lightgreen'>" + I18N("gt.wcTable.Confirmed") + "</font></td></tr>";
    wcTable += "<tr><td align=right><font color='green'>" + I18N("gt.wcTable.Band") + "</font></td>";
    wcTable += "<td align=left><table class='subtable'>";
    var keys = Object.keys(infoObject.confirmed_bands).sort();
    for (key in keys)
    {
      wcTable += "<tr><td align=right>" + keys[key] + "</td><td align=left> <font color='white'>(" + infoObject.confirmed_bands[keys[key]] + ") </font></td></tr>";
    }
    wcTable += "</table></td>";
    wcTable += "</tr>";
    wcTable += "<tr>";
    wcTable += "<td align=right><font color='orange'>" + I18N("gt.wcTable.Mode") + "</font></td>";
    wcTable += "<td align=left><table class='subtable'>";
    keys = Object.keys(infoObject.confirmed_modes).sort();
    for (key in keys)
    {
      wcTable += "<tr><td align=right>" + keys[key] + "</td><td align=left> <font color='white'>(" + infoObject.confirmed_modes[keys[key]] + ") </font></td></tr>";
    }
    wcTable += "</table></td>";
    wcTable += "</tr>";
    wcTable += "</table></td>";
  }
  if (!infoObject.worked && !infoObject.confirmed)
  {
    worker +=
      "<tr><td colspan=2 ><font  color='orange'>" + I18N("gt.wcTable.Needed") + "</font></td></tr>";
  }
  else
  {
    worker += "<tr>" + wc1Table + wcTable + "</tr>";
  }

  worker += "</table>";

  myTrophyTooltip.innerHTML = "<div style='font-size:15px;color:cyan;' class='roundBorder'>" + worker + "</div>";

  trophyMove(feature);
  myTrophyTooltip.style.zIndex = 499;
  myTrophyTooltip.style.display = "block";
  return true;
}

function trophyMove(feature)
{
  var positionInfo = myTrophyTooltip.getBoundingClientRect();
  myTrophyTooltip.style.left = getMouseX() - positionInfo.width / 2 + "px";
  myTrophyTooltip.style.top = getMouseY() - positionInfo.height - 22 + "px";
}

function trophyOut(feature)
{
  myTrophyTooltip.style.zIndex = -1;
}

GT.MyCurrentGrid = "";
GT.MyGridIsUp = false;

function mouseDownGrid(longlat)
{
  var grid = latLonToGridSquare(longlat[1], longlat[0]);
  GT.MyCurrentGrid = grid.substr(0, 4);
  var worker = "";
  worker += "<table align='center' class='darkTable'><tr style='color:white;'>";
  var bearing = parseInt(MyCircle.bearing(GT.myLat, GT.myLon, longlat[1], longlat[0]));
  worker += "<tr><td>Dist</td><td style='color:lightgreen'>" +
    parseInt(
      MyCircle.distance(
        GT.myLat,
        GT.myLon,
        longlat[1],
        longlat[0],
        distanceUnit.value
      ) * MyCircle.validateRadius(distanceUnit.value)
    ) +
    distanceUnit.value.toLowerCase() +
    "</td></tr>";
  worker += "<tr><td>Azim</td><td style='color:yellow'>" + bearing + "&deg;</td></tr>";
  worker += "<tr><td>Lat</td><td style='color:orange'>" + longlat[1].toFixed(3) + "</td></tr>";
  worker += "<tr><td>Long</td><td style='color:lightblue'>" + longlat[0].toFixed(3) + "</td></tr></table>";
  if (grid in GT.gridToDXCC)
  {
    worker += "<table align='center' class='darkTable' style='border-top:none'><tr style='color:white;'>";
    worker += "<tr style='color:orange;'>";
    for (var x = 0; x < GT.gridToDXCC[grid].length; x++)
    {
      worker +=
        "<td>" +
        GT.dxccToAltName[GT.gridToDXCC[grid][x]] +
        " <font color='lightgreen'>(" +
        GT.dxccInfo[GT.gridToDXCC[grid][x]].pp +
        ")</font></td>";
    }
    if (grid in GT.gridToState)
    {
      worker += "</tr><tr style='color:yellow;'>";
      for (var x = 0; x < GT.gridToDXCC[grid].length; x++)
      {
        worker += "<td>";
        if (grid in GT.gridToState)
        {
          for (var y = 0; y < GT.gridToState[grid].length; y++)
          {
            if (GT.gridToDXCC[grid][x] == GT.StateData[GT.gridToState[grid][y]].dxcc)
            {
              worker += GT.StateData[GT.gridToState[grid][y]].name + "<br/>";
            }
          }
        }
        worker += "</td>";
      }
    }
    worker += "</tr></table>";
  }

  GT.tempGridBox = tempGridToBox(grid, GT.tempGridBox, "#000000FF", "#00000000");
  myGridTooltip.innerHTML = "<div style='font-size:14px;font-weight:bold;color:cyan;margin:0 auto' class='roundBorder'>" + grid + "</div>" + worker;
  GT.MyGridIsUp = true;

  mouseMoveGrid();
  myGridTooltip.style.zIndex = 499;
  myGridTooltip.style.display = "block";
}

function mouseMoveGrid()
{
  if (GT.MyGridIsUp == true)
  {
    var positionInfo = myGridTooltip.getBoundingClientRect();
    myGridTooltip.style.left = getMouseX() - positionInfo.width / 2 + "px";
    myGridTooltip.style.top = getMouseY() - positionInfo.height - 22 + "px";
  }
}

function mouseUpGrid()
{
  GT.MyGridIsUp = false;
  myGridTooltip.style.zIndex = -1;

  if (GT.tempGridBox)
  {
    if (GT.layerSources.temp.hasFeature(GT.tempGridBox)) { GT.layerSources.temp.removeFeature(GT.tempGridBox); }
    GT.tempGridBox = null;
  }
}

function createFlagTipTable(feature)
{
  var worker = "";
  var key = feature.key;
  var dxcc = callsignToDxcc(GT.gtFlagPins[key].call);
  var dxccName = GT.dxccToAltName[dxcc];
  var workColor = "cyan";

  if (GT.gtFlagPins[key].call + GT.appSettings.myBand + GT.appSettings.myMode in GT.tracker.worked.call)
  {
    workColor = "yellow";
  }
  if (GT.gtFlagPins[key].call + GT.appSettings.myBand + GT.appSettings.myMode in GT.tracker.confirmed.call)
  {
    workColor = "#00FF00";
  }

  worker += "<div style='background-color:" + workColor + ";color:#000;font-weight:bold;font-size:18px;border:2px solid gray;margin:0px' class='roundBorder'>" + formatCallsign(GT.gtFlagPins[key].call) + "</div>";
  worker += "<table id='tooltipTable' class='darkTable' >";
  worker += "<tr><td>DXCC</td><td style='color:orange;'>" + dxccName + " <font color='lightgreen'>(" + GT.dxccInfo[dxcc].pp + ")</font></td>";
  worker += "<tr><td>Grid</td><td style='color:cyan;' >" + GT.gtFlagPins[key].grid + "</td></tr>";
  worker += "<tr><td>Freq</td><td style='color:lightgreen' >" + formatMhz(Number(GT.gtFlagPins[key].freq / 1000), 3, 3) + " <font color='yellow'>(" + formatBand(Number(GT.gtFlagPins[key].freq / 1000000)) + ")</font></td></tr>";
  worker += "<tr><td>Mode</td><td style='color:orange' >" + GT.gtFlagPins[key].mode + "</td></tr>";

  var LL = squareToCenter(GT.gtFlagPins[key].grid);
  var bearing = parseInt(MyCircle.bearing(GT.myLat, GT.myLon, LL.a, LL.o));

  worker += "<tr><td>Dist</td><td style='color:cyan'>" + parseInt(MyCircle.distance(GT.myLat, GT.myLon, LL.a, LL.o, distanceUnit.value) * MyCircle.validateRadius(distanceUnit.value)) + distanceUnit.value.toLowerCase() + "</td></tr>";
  worker += "<tr><td>Azim</td><td style='color:yellow'>" + bearing + "&deg;</td></tr>";
  worker += "</table>";

  myFlagtip.innerHTML = worker;
}

function mouseOverGtFlag(feature)
{
  createFlagTipTable(feature);
  mouseGtFlagMove(feature);

  myFlagtip.style.zIndex = 499;
  myFlagtip.style.display = "block";
  return true;
}

function mouseGtFlagMove(feature)
{
  var positionInfo = myFlagtip.getBoundingClientRect();
  myFlagtip.style.left = getMouseX() - positionInfo.width / 2 + "px";
  myFlagtip.style.top = getMouseY() - positionInfo.height - 22 + "px";
}

function mouseOutGtFlag(feature)
{
  myFlagtip.style.zIndex = -1;
}

function mouseOverTimezone(feature)
{
  var style = new ol.style.Style({
    fill: new ol.style.Fill({
      color: "#FFFF0088"
    })
  });
  feature.setStyle(style);

  createTimezoneTipTable(feature);

  TimezoneMove();

  myTimezoneTip.style.zIndex = 499;
  myTimezoneTip.style.display = "block";

  return true;
}

function createTimezoneTipTable(feature)
{
  var props = feature.getProperties();

  moment.locale(navigator.languages[0]);
  var m = moment().tz(props.tzid);
  var abbr = m.format("zz");
  var zone = m.format("Z");
  if (zone.indexOf(abbr) > -1) abbr = "";
  else abbr = " <font color='orange'>(" + abbr + ")</font>";

  worker = "<div style='background-color:cyan;color:#000;font-weight:bold;font-size:16px;border:2px solid gray;margin:0px;padding:1px' class='roundBorder'>" + props.tzid + "</div>";
  worker += "<table id='tooltipTable' class='darkTable' align=center>";
  worker += "<tr><td style='color:yellow;font-weight:bold'>" + m.format("LLLL") + "</td></tr>";
  worker += "<tr><td style='color:#00FF00;font-weight:bold'>" + zone + abbr + "</td></tr>";
  worker += "</table>";

  myTimezoneTip.innerHTML = worker;
}

function TimezoneMove()
{
  var positionInfo = myTimezoneTip.getBoundingClientRect();
  myTimezoneTip.style.left = getMouseX() - positionInfo.width / 2 + "px";
  myTimezoneTip.style.top = getMouseY() - positionInfo.height - 22 + "px";
}

function mouseOutZimezone(feature)
{
  myTimezoneTip.style.zIndex = -1;
  feature.setStyle(null);
}

function mouseOverSpotItem(feature, fromHover)
{
  if (GT.MyGridIsUp) return false;
  if (GT.mapSettings.mouseOver == true && fromHover == false) return false;
  if (GT.mapSettings.mouseOver == false && fromHover == true) return false;

  createTooltTipTable(feature);

  mouseMoveDataItem(feature);

  myTooltip.style.zIndex = 500;
  myTooltip.style.display = "block";
  return true;
}

function mouseOverDataItem(feature, fromHover)
{
  if (GT.currentOverlay != 0) return false;
  if (GT.MyGridIsUp) return false;
  if (GT.mapSettings.mouseOver == true && fromHover == false) return false;
  if (GT.mapSettings.mouseOver == false && fromHover == true) return false;

  createTooltTipTable(feature);

  mouseMoveDataItem(feature);

  myTooltip.style.zIndex = 500;
  myTooltip.style.display = "block";
  return true;
}

function mouseMoveDataItem(feature)
{
  var positionInfo = myTooltip.getBoundingClientRect();
  var windowWidth = window.innerWidth;
  var windowHeight = window.innerHeight;
  var top = 0;
  var left = 0;
  var noRoomLeft = false;
  var noRoomRight = false;

  top = getMouseY() - (positionInfo.height / 2);
  // Favor the left side over the right side (avoid covering the work panel if possible)
  if (getMouseX() - positionInfo.width < 0)
  {
    noRoomLeft = true;
    left = getMouseX() + 10;
  }
  else
  {
    left = getMouseX() - (10 + positionInfo.width);
  }
  if (windowWidth - getMouseX() < positionInfo.width)
  {
    noRoomRight = true;
  }

  if (noRoomLeft == true && noRoomRight == true)
  {
    if (positionInfo.width >= windowWidth)
    {
      left = 0;
    }
    else
    {
      left = getMouseX() - (positionInfo.width / 2);
      if (left + positionInfo.width > windowWidth)
      {
        left = windowWidth - positionInfo.width;
      }
    }

    top = getMouseY() + 10;
    if (positionInfo.height < getMouseY() - 10)
    {
      top = (getMouseY() - positionInfo.height) - 10;
    }
  }
  else
  {
    if (top + positionInfo.height > windowHeight)
    {
      top = windowHeight - positionInfo.height;
    }
  }
  if (top < 0) { top = 0; }
  if (left < 0) { left = 0; }
  myTooltip.style.top = parseInt(top) + "px";
  myTooltip.style.left = parseInt(left) + "px";
}

function mouseOutOfDataItem(feature)
{
  myTooltip.style.zIndex = -1;

  if (GT.spotView == 1) GT.layerSources.pskHop.clear();
}

function reloadInfo()
{
  if (GT.statsWindowInitialized == true)
  {
    GT.statsWindowHandle.window.reloadInfo();
  }
}

function twoWideToLatLong(qth)
{
  qth = qth.toUpperCase();
  var a = qth.charCodeAt(0) - 65;
  var b = qth.charCodeAt(1) - 65;

  var la1 = b * 10;
  var lo1 = a * 20;
  var la2 = la1 + 10;
  var lo2 = lo1 + 20;
  var LatLong = [];

  la1 -= 90;
  lo1 -= 180;
  la2 -= 90;
  lo2 -= 180;
  LatLong.la1 = la1;
  LatLong.lo1 = lo1;
  LatLong.la2 = la2;
  LatLong.lo2 = lo2;
  return LatLong;
}

function squareToCenter(qth)
{
  var LL = squareToLatLongAll(qth);
  var obj = {};
  obj.a = LL.la2 - (LL.la2 - LL.la1) / 2;
  obj.o = LL.lo2 - (LL.lo2 - LL.lo1) / 2;
  return obj;
}

function squareToLatLongAll(qth)
{
  qth = qth.toUpperCase();
  var a = qth.charCodeAt(0) - 65;
  var b = qth.charCodeAt(1) - 65;
  var c = qth.charCodeAt(2) - 48;
  var d = qth.charCodeAt(3) - 48;
  var la1 = b * 10 + d;
  var lo1 = a * 20 + c * 2;
  var la2;
  var lo2;
  var LatLong = [];
  if (qth.length == 4)
  {
    la2 = la1 + 1;
    lo2 = lo1 + 2;
    LatLong.size = 4;
  }
  else
  {
    var lo3;
    var la3;
    var e = qth.charCodeAt(4) - 65;
    var f = qth.charCodeAt(5) - 65;
    var R = 5 / 60;
    var T = 2.5 / 60;
    lo3 = (e * 5) / 60;
    la3 = (f * 2.5) / 60;
    la1 += la3;
    lo1 += lo3;
    la2 = la1 + T;
    lo2 = lo1 + R;
    LatLong.size = 6;
  }

  la1 -= 90;
  lo1 -= 180;
  la2 -= 90;
  lo2 -= 180;
  LatLong.la1 = la1;
  LatLong.lo1 = lo1;
  LatLong.la2 = la2;
  LatLong.lo2 = lo2;
  return LatLong;
}

function squareToLatLong(qth)
{
  qth = qth.toUpperCase();
  var a = qth.charCodeAt(0) - 65;
  var b = qth.charCodeAt(1) - 65;
  var c = qth.charCodeAt(2) - 48;
  var d = qth.charCodeAt(3) - 48;
  var la1 = b * 10 + d;
  var lo1 = a * 20 + c * 2;
  var la2;
  var lo2;
  var LatLong = [];
  if (qth.length == 4 || GT.pushPinMode == false || GT.appSettings.sixWideMode == 0)
  {
    la2 = la1 + 1;
    lo2 = lo1 + 2;
    LatLong.size = 4;
  }
  else
  {
    var lo3;
    var la3;
    var e = qth.charCodeAt(4) - 65;
    var f = qth.charCodeAt(5) - 65;
    var R = 5 / 60;
    var T = 2.5 / 60;
    lo3 = (e * 5) / 60;
    la3 = (f * 2.5) / 60;
    la1 += la3;
    lo1 += lo3;
    la2 = la1 + T;
    lo2 = lo1 + R;
    LatLong.size = 6;
  }
  la1 -= 90;
  lo1 -= 180;
  la2 -= 90;
  lo2 -= 180;
  LatLong.la1 = la1;
  LatLong.lo1 = lo1;
  LatLong.la2 = la2;
  LatLong.lo2 = lo2;
  return LatLong;
}

function iconFeature(center, iconObj, zIndex, propName)
{
  var feature = new ol.Feature({
    geometry: new ol.geom.Point(center),
    prop: propName
  });

  if (GT.useTransform)
  {
    feature.getGeometry().transform("EPSG:3857", GT.mapSettings.projection);
  }

  var iconStyle = new ol.style.Style({
    zIndex: zIndex,
    image: iconObj
  });

  feature.setStyle(iconStyle);
  return feature;
}

function qthToQsoBox(iQTH, iHash, locked, DE, worked, confirmed, band)
{
  if (GT.appSettings.gridViewMode == 1) return null;

  var borderColor = GT.mainBorderColor;
  var boxColor = GT.legendColors.QSX + GT.gridAlpha;
  var borderWeight = 0.5;
  var myDEbox = false;
  if (worked)
  {
    boxColor = GT.legendColors.QSO + GT.gridAlpha;
  }
  if (confirmed)
  {
    boxColor = GT.legendColors.QSL + GT.gridAlpha;
  }

  var zIndex = 2;
  var entityVisibility = GT.appSettings.gridViewMode > 1;
  if (GT.pushPinMode == false || GT.appSettings.sixWideMode == 0) iQTH = iQTH.substr(0, 4);
  else iQTH = iQTH.substr(0, 6);
  var rect = null;

  if (iQTH in GT.qsoGrids)
  {
    rect = GT.qsoGrids[iQTH];
  }

  if (rect == null)
  {
    var triangleView = false;
    if (GT.appSettings.gridViewMode == 3 && iQTH in GT.liveGrids && entityVisibility == true && GT.pushPinMode == false)
    {
      if (confirmed)
      {
        hideLiveGrid(iQTH);
      }
      else
      {
        liveTriangleGrid(iQTH);
        triangleView = true;
      }
    }
    LL = squareToLatLong(iQTH);
    if (LL.size == 6)
    {
      borderColor = "#000000FF";
      zIndex = 50;
    }
    newRect = {};
    newRect.qth = iQTH;

    var bounds = [
      [LL.lo1, LL.la1],
      [LL.lo2, LL.la2]
    ];
    if (triangleView == true) newRect.rectangle = triangle(bounds, true);
    else newRect.rectangle = rectangle(bounds);

    newRect.isTriangle = triangleView;

    const featureHoverStyle = new ol.style.Style({
      fill: new ol.style.Fill({
        color: boxColor
      }),
      stroke: new ol.style.Stroke({
        color: borderColor,
        width: borderWeight,
        lineJoin: "round"
      }),
      zIndex: zIndex
    });
    newRect.rectangle.setStyle(featureHoverStyle);

    newRect.rectangle.qth = iQTH;

    if (GT.pushPinMode == false && entityVisibility == true) { GT.layerSources.qso.addFeature(newRect.rectangle); }

    var newPin = GT.colorLeafletQPins.worked[band];
    if (confirmed) newPin = GT.colorLeafletQPins.confirmed[band];

    let lat = LL.la2 - (LL.la2 - LL.la1) / 2;
    let lon = LL.lo2 - (LL.lo2 - LL.lo1) / 2;

    newRect.rectangle.pin = iconFeature(
      ol.proj.fromLonLat([lon, lat]),
      GT.appSettings.sixWideMode == 1 ? newPin : GT.pushPinIconOff,
      zIndex,
      "pin"
    );
    newRect.rectangle.pin.qth = iQTH;
    newRect.rectangle.pin.hashes = {};
    newRect.rectangle.pin.hashes[iHash] = 1;
    newRect.rectangle.pin.size = LL.size;

    if (GT.pushPinMode && entityVisibility == true) { GT.layerSources.qsoPins.addFeature(newRect.rectangle.pin); }

    newRect.rectangle.locked = locked;
    newRect.rectangle.worked = worked;
    newRect.rectangle.confirmed = confirmed;
    newRect.rectangle.size = LL.size;
    newRect.rectangle.hashes = {};
    newRect.rectangle.hashes[iHash] = 1;
    newRect.rectangle.qso = true;

    newRect.rectangle.pin.qso = true;
    GT.qsoGrids[iQTH] = newRect;
  }
  else
  {
    if (!(iHash in rect.rectangle.hashes))
    {
      rect.rectangle.hashes[iHash] = 1;
      rect.rectangle.pin.hashes[iHash] = 1;
    }
    if (!confirmed && rect.rectangle.confirmed)
    {
      return rect.rectangle;
    }
    if (worked && !rect.rectangle.worked) rect.rectangle.worked = worked;
    if (confirmed && !rect.rectangle.confirmed) { rect.rectangle.confirmed = confirmed; }
    borderColor = GT.mainBorderColor;
    if (myDEbox) borderWeight = 1;
    zIndex = 2;
    if (rect.rectangle.size == 6)
    {
      borderColor = "#000000FF";
      zIndex = 50;
    }

    const featureHoverStyle = new ol.style.Style({
      fill: new ol.style.Fill({
        color: boxColor
      }),
      stroke: new ol.style.Stroke({
        color: borderColor,
        width: borderWeight,
        lineJoin: "round"
      }),
      zIndex: zIndex
    });
    rect.rectangle.setStyle(featureHoverStyle);
  }
}

function qthToBox(iQTH, iDEcallsign, iCQ, locked, DE, band, wspr, hash, fromLive)
{
  if (GT.appSettings.gridViewMode == 2) return null;

  var borderColor = GT.mainBorderColor;
  var boxColor = GT.legendColors.QSX + GT.gridAlpha;
  var borderWeight = 0.5;
  var myDEbox = false;
  if (DE == "CQ" || iCQ)
  {
    boxColor = GT.legendColors.CQ + GT.gridAlpha;
  }

  if (DE == GT.appSettings.myCall)
  {
    borderColor = "#FF0000FF";
    boxColor = GT.legendColors.QRZ + GT.gridAlpha;
    borderWeight = 1.0;
    myDEbox = true;
  }
  if (DE.indexOf("CQ DX") > -1)
  {
    boxColor = GT.legendColors.CQDX + GT.gridAlpha;
  }
  if (locked)
  {
    boxColor = GT.legendColors.QTH + GT.gridAlpha;
    borderColor = "#000000FF";
    borderOpacity = 1;
  }
  if (wspr != null)
  {
    if (wspr in GT.pskColors)
    {
      boxColor = "#" + GT.pskColors[wspr] + GT.gridAlpha
    }
    else
    {
      boxColor = "#" + GT.pskColors.OOB + GT.gridAlpha;
    }
  }
  var zIndex = 2;
  if (GT.pushPinMode == false || GT.appSettings.sixWideMode == 0) iQTH = iQTH.substr(0, 4);
  else iQTH = iQTH.substr(0, 6);
  var rect = null;
  if (iQTH == "")
  {
    for (var key in GT.liveGrids)
    {
      if (hash in GT.liveGrids[key].rectangle.liveHash)
      {
        rect = GT.liveGrids[key];
        break;
      }
    }
  }
  else
  {
    if (iQTH in GT.liveGrids)
    {
      rect = GT.liveGrids[iQTH];
    }
  }
  if (rect == null)
  {
    if (iQTH != "")
    {
      // Valid QTH
      var entityVisibility = true;
      var triangleView = false;
      if (Number(GT.appSettings.gridViewMode) == 3 && iQTH in GT.qsoGrids && GT.pushPinMode == false)
      {
        if (GT.mapSettings.splitQSL || GT.qsoGrids[iQTH].rectangle.confirmed == false)
        {
          qsoTriangleGrid(iQTH);
          triangleView = true;
          entityVisibility = true;
        }
        else entityVisibility = false;
      }
      LL = squareToLatLong(iQTH);
      if (LL.size == 6)
      {
        borderColor = "#000000FF";
        // borderWeight = 1.0;
        zIndex = 50;
      }
      newRect = {};
      newRect.age = GT.timeNow;
      newRect.qth = iQTH;

      var bounds = [
        [LL.lo1, LL.la1],
        [LL.lo2, LL.la2]
      ];
      if (triangleView == true) newRect.rectangle = triangle(bounds, false);
      else newRect.rectangle = rectangle(bounds);

      newRect.isTriangle = triangleView;
      newRect.rectangle.setId(iQTH);

      const featureHoverStyle = new ol.style.Style({
        fill: new ol.style.Fill({
          color: boxColor
        }),
        stroke: new ol.style.Stroke({
          color: borderColor,
          width: borderWeight,
          lineJoin: "round"
        }),
        zIndex: zIndex
      });
      newRect.rectangle.setStyle(featureHoverStyle);

      newRect.rectangle.qth = iQTH;

      if (GT.pushPinMode == false && entityVisibility)
      {
        GT.layerSources.live.addFeature(newRect.rectangle);
      }

      let lat = LL.la2 - (LL.la2 - LL.la1) / 2;
      let lon = LL.lo2 - (LL.lo2 - LL.lo1) / 2;

      newRect.rectangle.pin = iconFeature(
        ol.proj.fromLonLat([lon, lat]),
        GT.colorLeafletPins[band],
        zIndex,
        "pin"
      );
      newRect.rectangle.pin.qth = iQTH;
      newRect.rectangle.pin.liveHash = {};
      newRect.rectangle.pin.liveHash[hash] = 1;
      newRect.rectangle.pin.size = LL.size;

      if (GT.pushPinMode && entityVisibility == true) { GT.layerSources.livePins.addFeature(newRect.rectangle.pin); }

      newRect.rectangle.locked = locked;
      newRect.rectangle.size = LL.size;
      newRect.rectangle.liveHash = {};
      newRect.rectangle.liveHash[hash] = 1;
      newRect.rectangle.qso = false;

      newRect.rectangle.pin.qso = false;
      GT.liveGrids[iQTH] = newRect;
    }
  }
  else
  {
    if (!(hash in rect.rectangle.liveHash))
    {
      rect.rectangle.liveHash[hash] = 1;
      rect.rectangle.pin.liveHash[hash] = 1;
    }
    rect.rectangle.locked = rect.rectangle.locked | locked;
    if (rect.rectangle.locked)
    {
      boxColor = GT.legendColors.QTH + GT.gridAlpha;
      borderColor = "#000000FF";
      borderOpacity = 1;
    }
    if (myDEbox) borderWeight = 1;
    if (rect.rectangle.size == 6)
    {
      borderColor = "#000000FF";
      // borderWeight = 1.0;
      zIndex = 50;
    }

    if (fromLive)
    {
      // Reset the age of the old grid if this is a live update
      rect.age = GT.timeNow;
    }

    const featureHoverStyle = new ol.style.Style({
      fill: new ol.style.Fill({
        color: boxColor
      }),
      stroke: new ol.style.Stroke({
        color: borderColor,
        width: borderWeight,
        lineJoin: "round"
      }),
      zIndex: zIndex
    });
    rect.rectangle.setStyle(featureHoverStyle);
  }
}

function alphaTo(rgba, alphaFloat)
{
  var alphaInt = parseInt(alphaFloat * 255);
  var alphaHex = alphaInt.toString(16);
  if (alphaHex.length == 1)
  {
    alphaHex = "0" + alphaHex;
  }
  return rgba.slice(0, -2) + alphaHex;
}

function intAlphaToRGB(rgb, alphaInt)
{
  var alphaHex = alphaInt.toString(16);
  if (alphaHex.length == 1)
  {
    alphaHex = "0" + alphaHex;
  }
  return rgb + alphaHex;
}

function dimFunction(qthObj)
{
  if (qthObj.rectangle.locked == false)
  {
    var featureStyle = qthObj.rectangle.getStyle();
    var featureFill = featureStyle.getFill();
    var fillColor = featureFill.getColor();
    var featureStroke = featureStyle.getStroke();
    var strokeColor = featureStroke.getColor();
    var percent = 1.0 - (GT.timeNow - qthObj.age) / gridDecay.value;
    var alpha = Math.max(0.06, (GT.mapSettings.gridAlpha / 255) * percent);

    fillColor = alphaTo(fillColor, alpha);
    featureFill.setColor(fillColor);
    featureStyle.setFill(featureFill);

    strokeColor = alphaTo(strokeColor, alpha);
    featureStroke.setColor(strokeColor);
    featureStyle.setStroke(featureStroke);

    qthObj.rectangle.setStyle(featureStyle);
  }
}

function changeTrafficDecode()
{
  GT.mapSettings.trafficDecode = trafficDecode.checked;
  trafficDecodeView();
  saveMapSettings();
}

function trafficDecodeView()
{
  if (GT.mapSettings.trafficDecode == false)
  {
    trafficDiv.innerHTML = "";
    GT.lastTraffic = [];
  }
}

function changeFitQRZvalue()
{
  GT.mapSettings.fitQRZ = fitQRZvalue.checked;
  saveMapSettings();
}

function changeQrzDxccFallbackValue()
{
  GT.mapSettings.qrzDxccFallback = qrzDxccFallbackValue.checked;
  saveMapSettings();
}

function changeCqHiliteValue(check)
{
  GT.mapSettings.CQhilite = check.checked;
  saveMapSettings();
  if (check.checked == false) removePaths();
}

function changeFocusRigValue(check)
{
  GT.mapSettings.focusRig = check.checked;
  saveMapSettings();
}

function changeHaltOntTxValue(check)
{
  GT.mapSettings.haltAllOnTx = check.checked;
  saveMapSettings();
}

function changeSplitQSL()
{
  GT.mapSettings.splitQSL = splitQSLValue.checked;
  saveMapSettings();
  redrawGrids();
}

function setAnimateView()
{
  animationSpeedTd.style.display = animateValue.checked ? "" : "none";
}

function toggleAnimate()
{
  animateValue.checked = !animateValue.checked;
  changeAnimate();
}

function toggleAllGrids()
{
  GT.mapSettings.showAllGrids = !GT.mapSettings.showAllGrids;
  gridOverlayImg.style.filter = GT.mapSettings.showAllGrids ? "" : "grayscale(1)";
  drawAllGrids();
}

function changeAnimate()
{
  GT.mapSettings.animate = animateValue.checked;
  saveMapSettings();

  var dash = [];
  var dashOff = 0;
  if (GT.mapSettings.animate == true)
  {
    dash = GT.flightPathLineDash;
    dashOff = GT.flightPathTotal - GT.flightPathOffset;
  }

  for (var i = GT.flightPaths.length - 1; i >= 0; i--)
  {
    if (GT.flightPaths[i].isShapeFlight == 0)
    {
      var featureStyle = GT.flightPaths[i].getStyle();
      var featureStroke = featureStyle.getStroke();

      featureStroke.setLineDash(dash);
      featureStroke.setLineDashOffset(dashOff);

      featureStyle.setStroke(featureStroke);
      GT.flightPaths[i].setStyle(featureStyle);
    }
  }
  if (GT.transmitFlightPath != null)
  {
    var featureStyle = GT.transmitFlightPath.getStyle();
    var featureStroke = featureStyle.getStroke();

    featureStroke.setLineDash(dash);
    featureStroke.setLineDashOffset(dashOff);

    featureStyle.setStroke(featureStroke);
    GT.transmitFlightPath.setStyle(featureStyle);
  }
  setAnimateView();
}

function changeAnimateSpeedValue()
{
  GT.mapSettings.animateSpeed = 21 - animateSpeedValue.value;
  saveMapSettings();
}

GT.animateFrame = 0;
GT.nextDimTime = 0;
GT.last = 0;

function removeFlightPathsAndDimSquares()
{
  for (var i = GT.flightPaths.length - 1; i >= 0; i--)
  {
    if (GT.flightPaths[i].age < GT.timeNow)
    {
      if (typeof GT.flightPaths[i].Arrow != "undefined") { GT.layerSources.flight.removeFeature(GT.flightPaths[i].Arrow); }
      GT.layerSources.flight.removeFeature(GT.flightPaths[i]);
      delete GT.flightPaths[i];
      GT.flightPaths[i] = null;

      GT.flightPaths.splice(i, 1);
    }
  }

  if (GT.timeNow >= GT.nextDimTime)
  {
    dimGridsquare();
    GT.nextDimTime = GT.timeNow + 8;
  }
}

function animatePaths()
{
  requestAnimationFrame(animatePaths);

  GT.last ^= GT.last;
  if (GT.last == 1) return;

  GT.animateFrame++;
  GT.animateFrame %= GT.mapSettings.animateSpeed;

  if (GT.animateFrame > 0) return;

  if (GT.mapSettings.animate == false) return;

  GT.flightPathOffset += 1;
  GT.flightPathOffset %= GT.flightPathTotal;

  var targetOffset = GT.flightPathTotal - GT.flightPathOffset;
  var featureStyle = null;
  var featureStroke = null;
  for (var i = 0; i < GT.flightPaths.length; i++)
  {
    if (GT.flightPaths[i].isShapeFlight == 0)
    {
      featureStyle = GT.flightPaths[i].getStyle();
      featureStroke = featureStyle.getStroke();
      featureStroke.setLineDashOffset(targetOffset);
      GT.flightPaths[i].setStyle(featureStyle);
    }
  }

  if (GT.transmitFlightPath != null)
  {
    var featureStyle = GT.transmitFlightPath.getStyle();
    var featureStroke = featureStyle.getStroke();

    featureStroke.setLineDashOffset(targetOffset);

    featureStyle.setStroke(featureStroke);
    GT.transmitFlightPath.setStyle(featureStyle);
  }
}

function removePaths()
{
  GT.layerSources.flight.clear();
  GT.flightPaths = Array();
}

function fadePaths()
{
  if (pathWidthValue.value == 0)
  {
    removePaths();
  }
}

function dimGridsquare()
{
  if (gridDecay.value == 0) return;
  for (var i in GT.liveGrids)
  {
    dimFunction(GT.liveGrids[i]);

    if (GT.timeNow - GT.liveGrids[i].age >= gridDecay.value && GT.liveGrids[i].rectangle.locked == false)
    {
      // Walk the rectangles DEcall's and remove them from GT.liveCallsigns
      for (var CallIsKey in GT.liveGrids[i].rectangle.liveHash)
      {
        if (CallIsKey in GT.liveCallsigns)
        {
          delete GT.liveCallsigns[CallIsKey];
        }
      }
      if (GT.liveGrids[i].rectangle.pin != null)
      {
        if (GT.layerSources.livePins.hasFeature(GT.liveGrids[i].rectangle.pin))
        {
          GT.layerSources.livePins.removeFeature(GT.liveGrids[i].rectangle.pin);
        }
      }
      if (GT.layerSources.live.hasFeature(GT.liveGrids[i].rectangle))
      {
        GT.layerSources.live.removeFeature(GT.liveGrids[i].rectangle);

        if (GT.appSettings.gridViewMode == 3 && i in GT.qsoGrids)
        {
          if (GT.qsoGrids[i].isTriangle)
          {
            triangleToGrid(i, GT.qsoGrids[i].rectangle);
            GT.qsoGrids[i].isTriangle = false;
          }
        }
      }

      GT.liveGrids[i] = null;
      delete GT.liveGrids[i];
    }
  }
}

function updateCountStats()
{
  var count = Object.keys(GT.liveCallsigns).length;

  if (GT.appSettings.myCall in GT.liveCallsigns) count--;

  callsignCount.innerHTML = count;

  qsoCount.innerHTML = GT.QSOcount;
  qslCount.innerHTML = GT.QSLcount;

  countryCount.innerHTML = Object.keys(GT.dxccCount).length;

  if (Object.keys(GT.QSOhash).length > 0)
  {
    clearOrLoadButton.innerHTML = I18N("quickLoad.clearLog.label");
    GT.loadQSOs = false;
  }
  else
  {
    clearOrLoadButton.innerHTML = I18N("quickLoad.loadLog.label");
    GT.loadQSOs = true;
  }
}

function clearGrids()
{
  GT.layerSources.live.clear();
  GT.layerSources.livePins.clear();
  GT.liveGrids = {};
}

function clearQsoGrids()
{
  GT.layerSources.qso.clear();
  GT.layerSources.qsoPins.clear();

  GT.qsoGrids = {};

  for (var key in GT.dxccInfo)
  {
    GT.dxccInfo[key].worked = false;
    GT.dxccInfo[key].confirmed = false;
    GT.dxccInfo[key].worked_bands = {};
    GT.dxccInfo[key].confirmed_bands = {};
    GT.dxccInfo[key].worked_modes = {};
    GT.dxccInfo[key].confirmed_modes = {};
  }
  for (var key in GT.cqZones)
  {
    GT.cqZones[key].worked = false;
    GT.cqZones[key].confirmed = false;

    GT.cqZones[key].worked_bands = {};
    GT.cqZones[key].confirmed_bands = {};
    GT.cqZones[key].worked_modes = {};
    GT.cqZones[key].confirmed_modes = {};
  }
  for (var key in GT.ituZones)
  {
    GT.ituZones[key].worked = false;
    GT.ituZones[key].confirmed = false;

    GT.ituZones[key].worked_bands = {};
    GT.ituZones[key].confirmed_bands = {};
    GT.ituZones[key].worked_modes = {};
    GT.ituZones[key].confirmed_modes = {};
  }
  for (var key in GT.wasZones)
  {
    GT.wasZones[key].worked = false;
    GT.wasZones[key].confirmed = false;

    GT.wasZones[key].worked_bands = {};
    GT.wasZones[key].confirmed_bands = {};
    GT.wasZones[key].worked_modes = {};
    GT.wasZones[key].confirmed_modes = {};
  }
  for (var key in GT.wacpZones)
  {
    GT.wacpZones[key].worked = false;
    GT.wacpZones[key].confirmed = false;

    GT.wacpZones[key].worked_bands = {};
    GT.wacpZones[key].confirmed_bands = {};
    GT.wacpZones[key].worked_modes = {};
    GT.wacpZones[key].confirmed_modes = {};
  }
  for (var key in GT.wacZones)
  {
    GT.wacZones[key].worked = false;
    GT.wacZones[key].confirmed = false;
    GT.wacZones[key].worked_bands = {};
    GT.wacZones[key].confirmed_bands = {};
    GT.wacZones[key].worked_modes = {};
    GT.wacZones[key].confirmed_modes = {};
  }
  for (var key in GT.countyData)
  {
    GT.countyData[key].worked = false;
    GT.countyData[key].confirmed = false;
    GT.countyData[key].worked_bands = {};
    GT.countyData[key].confirmed_bands = {};
    GT.countyData[key].worked_modes = {};
    GT.countyData[key].confirmed_modes = {};
  }
  for (var key in GT.us48Data)
  {
    GT.us48Data[key].worked = false;
    GT.us48Data[key].confirmed = false;
    GT.us48Data[key].worked_bands = {};
    GT.us48Data[key].confirmed_bands = {};
    GT.us48Data[key].worked_modes = {};
    GT.us48Data[key].confirmed_modes = {};
  }
}

function clearCalls()
{
  removePaths();
  GT.liveCallsigns = {};
  GT.dxccCount = {};
}

function clearLive()
{
  GT.Decodes = 0;

  GT.lastMessages = Array();
  GT.lastTraffic = Array();
  GT.callRoster = {};
  GT.dxccCount = {};

  removePaths();
  removePaths();
  clearGrids();
  clearCalls();
  clearTempGrids();
  setHomeGridsquare();
  redrawGrids();

  updateRosterWorked();
  goProcessRoster();
}

function clearOrLoadQSOs()
{
  if (GT.loadQSOs == true)
  {
    startupAdifLoadCheck();
  }
  else
  {
    clearQSOs();
  }
}

function clearAndLoadQSOs()
{
  clearQSOs(true, "startupAdifLoadCheck");
}

function clearQSOs(clearFiles = true, nextFunc = null)
{
  // in adif.js
  clearAdifWorkerQSO(clearFiles, nextFunc);
}

// callback from adifWorker
function clearQSOcallback(clearFiles, nextFunc)
{
  initQSOdata();
  GT.QSOhash = {};
  GT.myQsoCalls = {};
  GT.myQsoGrids = {};
  GT.QSLcount = 0;
  GT.QSOcount = 0;
  setTrophyOverlay(GT.currentOverlay);

  updateRosterWorked();
  goProcessRoster();
  redrawGrids(false);

  if (clearFiles == true)
  {
    clearLogFilesAndCounts();
  }
  if (nextFunc != null && typeof window[nextFunc] == "function")
  {
    // this should be startupAdifLoadCheck, but it's open ended :)
    window[nextFunc]();
  }
}

function clearLogFilesAndCounts()
{
  tryToDeleteLog("LogbookOfTheWorld.adif");
  tryToDeleteLog("qrz.adif");
  tryToDeleteLog("clublog.adif");
  GT.adifLogSettings.downloads = {};
  GT.adifLogSettings.lastFetch.lotw_qso = 0;
  GT.adifLogSettings.lastFetch.lotw_qsl = 0;
  saveAdifSettings();
}

function getCurrentBandModeHTML()
{
  var band = GT.appSettings.gtBandFilter == "auto" ? GT.appSettings.myBand + " (Auto)" : GT.appSettings.gtBandFilter.length == 0 ? "Mixed Bands" : GT.appSettings.gtBandFilter;
  var mode = GT.appSettings.gtModeFilter == "auto" ? GT.appSettings.myMode + " (Auto)" : GT.appSettings.gtModeFilter.length == 0 ? "Mixed Modes" : GT.appSettings.gtModeFilter;
  return (
    "<div style='vertical-align:top;display:inline-block;margin-bottom:3px;color:lightgreen;font-weight:bold;font-size:larger'>" + I18N("stats.viewing") + ": <text style='color:yellow'>" +
    band +
    "</text> / <text style='color:orange'>" +
    mode +
    "</text></b></div><br/>"
  );
}

GT.currentDay = 0;
GT.nightTime = false;
GT.currentNightState = false;
GT.timeNow = timeNowSec();

function displayTime()
{
  GT.timeNow = timeNowSec();
  if (menuDiv.className == "menuDivStart" && GT.menuShowing == true)
  {
    menuDiv.className = "menuDivEnd";
    mapDiv.className = "mapDivEnd";
    spotsDiv.className = "spotsDivEnd";
    GT.map.updateSize();
  }

  currentTime.innerHTML = "<font color='lightblue'>" + userTimeString(null) + "</font>";
  if (GT.lastTimeSinceMessageInSeconds > 0)
  {
    var since = GT.timeNow - GT.lastTimeSinceMessageInSeconds;
    secondsAgoMsg.innerHTML = toDHMS(since);
    if (since > 17 && since < 122)
    {
      secondsAgoMsg.style.backgroundColor = "yellow";
      secondsAgoMsg.style.color = "#000";
    }
    else if (since > 121)
    {
      secondsAgoMsg.style.backgroundColor = "red";
      secondsAgoMsg.style.color = "#000";
    }
    else
    {
      secondsAgoMsg.style.backgroundColor = "blue";
      secondsAgoMsg.style.color = "#FF0";
    }
  }
  else secondsAgoMsg.innerHTML = "<b>Never</b>";

  checkWsjtxListener();

  if (GT.timeNow % 22 == 0)
  {
    GT.nightTime = dayNight.refresh();
    moonLayer.refresh();
  }

  pskSpotCheck(GT.timeNow);

  if (GT.currentNightState != GT.nightTime)
  {
    changeMapLayer();
    styleAllFlightPaths();
    GT.currentNightState = GT.nightTime;
  }
}

function timeNowSec()
{
  return parseInt(Date.now() / 1000);
}

function createGlobalHeatmapLayer(name, blur, radius)
{
  GT.layerSources[name] = new ol.source.Vector({});
  GT.layerVectors[name] = new ol.layer.Heatmap({
    source: GT.layerSources[name],
    blur: blur,
    radius: radius,
    zIndex: Object.keys(GT.layerVectors).length + 1
  });
  GT.layerVectors[name].set("name", name);
}

function createGlobalMapLayer(name, maxResolution, minResolution)
{
  GT.layerSources[name] = new ol.source.Vector({});
  if (
    typeof maxResolution == "undefined" &&
    typeof minResolution == "undefined"
  )
  {
    var zIndex = Object.keys(GT.layerVectors).length + 1;

    GT.layerVectors[name] = new ol.layer.Vector({
      source: GT.layerSources[name],
      zIndex: zIndex
    });
  }
  else if (typeof minResolution == "undefined")
  {
    GT.layerVectors[name] = new ol.layer.Vector({
      source: GT.layerSources[name],
      maxResolution: maxResolution,
      zIndex: Object.keys(GT.layerVectors).length + 1
    });
  }
  else
  {
    GT.layerVectors[name] = new ol.layer.Vector({
      source: GT.layerSources[name],
      maxResolution: maxResolution,
      minResolution: minResolution,
      zIndex: Object.keys(GT.layerVectors).length + 1
    });
  }
  GT.layerVectors[name].set("name", name);
}

function createGeoJsonLayer(name, url, color, stroke)
{
  var style = new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: color,
      width: stroke
    }),
    fill: new ol.style.Fill({
      color: "#00000000"
    })
  });

  var layerSource = new ol.source.Vector({
    url: url,
    format: new ol.format.GeoJSON({ geometryName: name }),
    overlaps: false
  });

  var layerVector = new ol.layer.Vector({
    source: layerSource,
    style: style,
    visible: true,
    zIndex: 1
  });
  layerVector.set("name", name);
  return layerVector;
}

GT.gtFlagIcon = new ol.style.Icon({
  src: "img/flag_gt_user.png",
  anchorYUnits: "pixels",
  anchorXUnits: "pixels",
  anchor: [12, 17]
});

GT.pushPinIconOff = new ol.style.Icon({
  src: "img/red-circle.png",
  anchorYUnits: "pixels",
  anchorXUnits: "pixels",
  anchor: [5, 18]
});

function toggleMouseTrack()
{
  GT.appSettings.mouseTrack ^= 1;
  displayMouseTrack();
}

function displayMouseTrack()
{
  mouseTrackDiv.style.display = (GT.appSettings.mouseTrack == 1) ? "block" : "none";
}

GT.Nexrad = null;

GT.hoverFunctors = Object();
GT.lastHover = { feature: null, functor: null };

function initHoverFunctors()
{
  //  { hover: , move: , out: };
  GT.hoverFunctors.tz = { hover: mouseOverTimezone, move: TimezoneMove, out: mouseOutZimezone };
  GT.hoverFunctors.grid = { hover: mouseOverDataItem, move: mouseMoveDataItem, out: mouseOutOfDataItem };
  GT.hoverFunctors.pin = { hover: mouseOverDataItem, move: mouseMoveDataItem, out: mouseOutOfDataItem };
  GT.hoverFunctors.moon = { hover: moonOver, move: moonMove, out: moonOut };
  GT.hoverFunctors.dxcc = { hover: trophyOver, move: trophyMove, out: trophyOut };
  GT.hoverFunctors.cqzone = { hover: trophyOver, move: trophyMove, out: trophyOut };
  GT.hoverFunctors.ituzone = { hover: trophyOver, move: trophyMove, out: trophyOut };
  GT.hoverFunctors.wac = { hover: trophyOver, move: trophyMove, out: trophyOut };
  GT.hoverFunctors.was = { hover: trophyOver, move: trophyMove, out: trophyOut };
  GT.hoverFunctors.wacp = { hover: trophyOver, move: trophyMove, out: trophyOut };
  GT.hoverFunctors.usc = { hover: trophyOver, move: trophyMove, out: trophyOut };
  GT.hoverFunctors.us48 = { hover: trophyOver, move: trophyMove, out: trophyOut };
  GT.hoverFunctors.parkFlag = { hover: mouseOverPark, move: mouseParkMove, out: mouseOutPark };
  GT.hoverFunctors.gtFlag = { hover: mouseOverGtFlag, move: mouseGtFlagMove, out: mouseOutGtFlag };
  GT.hoverFunctors.spot = { hover: mouseOverSpotItem, move: mouseMoveDataItem, out: mouseOutOfDataItem };
}

function mapApiKeyInputChanged()
{
  let map = GT.maps[GT.mapSettings.mapIndex];
  if ("keyId" in map)
  {
    let showUpdateButton = false;
    if (GT.mapSettings.apiKeys[map.keyId] != mapApiKeyInput.value)
    {
      showUpdateButton = true;
    }
    GT.mapSettings.apiKeys[map.keyId] = mapApiKeyInput.value;
    if (mapApiKeyInput.value == "")
    {
      showUpdateButton = false;
    }
    ValidateText(mapApiKeyInput);
    mapApiKeyApplyDiv.style.display = showUpdateButton ? "" : "none";
  }
}

function nightMapApiKeyInputChanged()
{
  let map = GT.maps[GT.mapSettings.nightMapIndex];
  if ("keyId" in map)
  {
    let showUpdateButton = false;
    if (GT.mapSettings.apiKeys[map.keyId] != nightMapApiKeyInput.value)
    {
      showUpdateButton = true;
    }
    GT.mapSettings.apiKeys[map.keyId] = nightMapApiKeyInput.value;
    if (nightMapApiKeyInput.value == "")
    {
      showUpdateButton = false;
    }
    ValidateText(nightMapApiKeyInput);
    nightMapApiKeyApplyDiv.style.display = showUpdateButton ? "" : "none";
  }
}

function ProcessGroupMapSource(map)
{
  // Double check
  if (map in GT.maps)
  {
    let apiKey = "";
    if ("keyId" in GT.maps[map])
    {
      if (!(GT.maps[map].keyId in GT.mapSettings.apiKeys))
      {
        GT.mapSettings.apiKeys[GT.maps[map].keyId] = apiKey;
      }
      else
      {
        apiKey = GT.mapSettings.apiKeys[GT.maps[map].keyId];
      }
    }
    let layers = [];
    for (let x in GT.maps[map].group)
    {
      // Only "_url"'s are processed for {r7} and {k}
      // It sets "url" otherwise, "url" must be present in the group entry!
      if ("_url" in GT.maps[map].group[x])
      {
        // Apply apiKey if needed
        let url = GT.maps[map].group[x]._url.replace("{k}", apiKey);
        // Apply random number from 0-7 if needed
        GT.maps[map].group[x].url = url.replace("{r7}", Math.floor(Math.random() * 8));
      }
      else if (!("url" in GT.maps[map].group[x]))
      {
        alert("Map: " + map + "\n" + "Missing 'url' or '_url' in group (" + x + ") " + "\nPlease fix!");
      }

      let source = new GT.mapSourceTypes[GT.maps[map].group[x].sourceType](GT.maps[map].group[x]);
      layers[x] = new ol.layer.Tile({ source: source });
    }
    GT.mapsLayer[map] = layers;
  }
}

GT.mapSourceTypes = {
  XYZ: ol.source.XYZ,
  TileWMS: ol.source.TileWMS,
  Group: null
};

function initAEQDprojection()
{
  if (ol.proj.proj4.isRegistered())
  {
    ol.proj.proj4.unregister();
    // This is a hack because OpenLayers sucks
    // I patched ol.js to insert the function below
    // Tb.proj.addProjections=Ji,
    // +++ Tb.proj.deleteProjection=function(i){delete ii[i],delete oi[i]},
    // Tb.proj.clearAllProjections=function(){ni(),ai()}
    delete ol.proj.deleteProjection("AEQD");
    proj4.defs("AEQD", '+');
  }
 
  proj4.defs("AEQD", '+proj=aeqd +lat_0=' + GT.myLat + ' +lon_0=' + GT.myLon + ' +x_0=0 +y_0=0 +a=6371000 +b=6371000 +units=m');
  ol.proj.proj4.register(proj4);
}

function tryRecenterAEQD()
{
  // Only if we're AEQD
  if (GT.mapSettings.projection == "AEQD")
  {
    // we fake a change
    GT.mapSettings.projection = "EPSG:3857";
    changeMapProjection(false);
    centerOn(GT.appSettings.myGrid);
  }
}

function changeMapProjection(honorMemory = true)
{
  if (honorMemory)
  {
    // save the current map view
    mapMemory(6, true, true);
  }

  // remove flights
  removePaths();

  if (GT.mapSettings.projection == "AEQD")
  {
    GT.mapSettings.projection = "EPSG:3857";
    projectionImg.style.filter = "grayscale(1)";
  }
  else
  {
    GT.mapSettings.projection = "AEQD";
    projectionImg.style.filter = "";
  }

  delete GT.map;

  renderMap();

  if (honorMemory)
  {
    // load the current map view
    mapMemory(6, false);
  }

  drawAllGrids();
  displayPredLayer();
  GT.timezoneLayer = null;
  displayTimezones();
  GT.Nexrad = null;
  displayNexrad();
  redrawGrids();
  redrawSpots();
  redrawParks();
  redrawPins();
  setTrophyOverlay(GT.currentOverlay);
}

class RotateNorthControl extends ol.control.Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options) {
    const options = opt_options || {};

    const button = document.createElement('button');
    button.innerHTML = "<img src='img/north.png' style='width:1em'></img>";
    button.title = "Reset Heading";

    const element = document.createElement('div');
    element.className = 'rotate-north ol-unselectable ol-control';
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    button.addEventListener('click', this.handleRotateNorth.bind(this), false);
  }

  handleRotateNorth() {
    this.getMap().getView().setRotation(0);
  }
}

function initMap()
{
  initHoverFunctors();

  GT.maps = requireJson("data/maps.json");
  if (GT.maps)
  {
    var saveSettings = false;
    GT.maps = Object.keys(GT.maps).sort().reduce((obj, key) => { obj[key] = GT.maps[key]; return obj; }, {});

    if (!(GT.mapSettings.mapIndex in GT.maps))
    {
      GT.mapSettings.mapIndex = def_mapSettings.mapIndex;
      saveSettings = true;
    }
    if (!(GT.mapSettings.nightMapIndex in GT.maps))
    {
      GT.mapSettings.nightMapIndex = def_mapSettings.nightMapIndex;
      saveSettings = true;
    }
    if (!(GT.mapSettings.offlineMapIndex in GT.maps))
    {
      GT.mapSettings.offlineMapIndex = def_mapSettings.offlineMapIndex;
      saveSettings = true;
    }
    if (!(GT.mapSettings.offlineNightMapIndex in GT.maps))
    {
      GT.mapSettings.offlineNightMapIndex = def_mapSettings.offlineNightMapIndex;
      saveSettings = true;
    }
    if (saveSettings)
    {
      saveMapSettings();
    }
    for (const key in GT.maps)
    {
      GT.maps[key].attributions = "&copy; <a href='https://gridtracker.org' target='_blank'>GridTracker2</a> " + GT.maps[key].attributions;
      if (GT.maps[key].sourceType == "Group")
      {
        ProcessGroupMapSource(key);
      }
      else
      {
        GT.mapsLayer[key] = new GT.mapSourceTypes[GT.maps[key].sourceType](GT.maps[key]);
      }

      var option = document.createElement("option");
      option.value = key;
      option.text = key;
      mapSelect.appendChild(option);

      option = document.createElement("option");
      option.value = key;
      option.text = key;
      mapNightSelect.appendChild(option);
      if (GT.maps[key].offline == true)
      {
        GT.offlineMapsLayer[key] = new ol.source.XYZ(GT.maps[key]);

        option = document.createElement("option");
        option.value = key;
        option.text = key;
        offlineMapSelect.appendChild(option);

        option = document.createElement("option");
        option.value = key;
        option.text = key;
        offlineMapNightSelect.appendChild(option);
      }
    }
    mapSelect.value = GT.mapSettings.mapIndex;
    offlineMapSelect.value = GT.mapSettings.offlineMapIndex;

    mapNightSelect.value = GT.mapSettings.nightMapIndex;
    offlineMapNightSelect.value = GT.mapSettings.offlineNightMapIndex;
  }
  else GT.mapsLayer[0] = new ol.source.OSM();

  if (GT.mapSettings.offlineMode)
  {
    GT.tileLayer = new ol.layer.Tile({
      source: GT.offlineMapsLayer[offlineMapSelect.value]
    });
  }
  else
  {
    if (GT.maps[mapSelect.value].sourceType == "Group")
    {
      GT.tileLayer = new ol.layer.Group({ layers: GT.mapsLayer[mapSelect.value] });
    }
    else
    {
      GT.tileLayer = new ol.layer.Tile({ source: GT.mapsLayer[mapSelect.value] });
    }
  }

  mapDiv.addEventListener("pointermove", mapMoveEvent);

  mapDiv.addEventListener("mouseleave", mapLoseFocus, false);
  mapDiv.addEventListener("contextmenu", function (event)
  {
    event.preventDefault();
  });

  renderMap();
  requestAnimationFrame(animatePaths);
}

function renderMap()
{
  initAEQDprojection();

  document.getElementById("mapDiv").innerHTML = "";

  GT.scaleLine = new ol.control.ScaleLine({
    units: GT.scaleUnits[GT.appSettings.distanceUnit]
  });

  GT.mapControl = [
    GT.scaleLine,
    new ol.control.Rotate(),
    new ol.control.Zoom(),
    new ol.control.FullScreen({ source: "mainBody" }),
    new ol.control.Attribution({ collapsible: false, collapsed: false }),
    new RotateNorthControl()
  ];

  createGlobalMapLayer("award");
  createGlobalHeatmapLayer("pskHeat", 20, 15);
  createGlobalMapLayer("qso");
  createGlobalMapLayer("qsoPins");
  createGlobalMapLayer("live");
  createGlobalMapLayer("livePins");
  createGlobalMapLayer("lineGrids");
  createGlobalMapLayer("longGrids", 4500);
  createGlobalMapLayer("bigGrids", 50000, 4501);
  createGlobalMapLayer("pskFlights");
  createGlobalMapLayer("pskSpots");
  createGlobalMapLayer("pskHop");
  createGlobalMapLayer("pota");
  createGlobalMapLayer("flight");
  createGlobalMapLayer("transmit");
  createGlobalMapLayer("gtflags");
  createGlobalMapLayer("temp");
  createGlobalMapLayer("tz");

  if (GT.mapSettings.projection != "EPSG:3857")
  {
    GT.useTransform = true;
  }
  else
  {
    GT.useTransform = false;
  }

  GT.mapView = new ol.View({
    center: ol.proj.transform([GT.myLon, GT.myLat], "EPSG:4326", GT.mapSettings.projection),
    zoom: GT.mapSettings.zoom * 0.333,
    projection: GT.mapSettings.projection
  });

  GT.map = new ol.Map({
    target: "mapDiv",
    layers: [
      GT.tileLayer,
      GT.layerVectors.award,
      GT.layerVectors.pskHeat,
      GT.layerVectors.qso,
      GT.layerVectors.qsoPins,
      GT.layerVectors.live,
      GT.layerVectors.livePins,
      GT.layerVectors.lineGrids,
      GT.layerVectors.longGrids,
      GT.layerVectors.bigGrids,
      GT.layerVectors.pskFlights,
      GT.layerVectors.pskSpots,
      GT.layerVectors.pskHop,
      GT.layerVectors.pota,
      GT.layerVectors.flight,
      GT.layerVectors.transmit,
      GT.layerVectors.gtflags,
      GT.layerVectors.temp,
      GT.layerVectors.tz
    ],
    interactions: ol.interaction.defaults.defaults({
      dragPan: false,
      mouseWheelZoom: false
    }).extend([
      new ol.interaction.DragPan({ kinetic: false }),
      new ol.interaction.MouseWheelZoom({ duration: 0 }),
      new ol.interaction.DragRotateAndZoom({ duration: 0 })
    ]),
    controls: GT.mapControl,
    view: GT.mapView
  });



  GT.map.on("pointerdown", function (event)
  {
    var shouldReturn = false;
    var features = GT.map.getFeaturesAtPixel(event.pixel);
    if (features != null && features.length > 0)
    {
      features = features.reverse();
      var finalGridFeature = null;
      for (var index in features)
      {
        if (!(features[index].values_.prop in GT.hoverFunctors)) continue;
        if (features[index].size == 6)
        {
          noFeature = false;
          finalGridFeature = features[index];
        }
        if (features[index].size == 4 && finalGridFeature == null)
        {
          noFeature = false;
          finalGridFeature = features[index];
        }
        if (features[index].size == 1)
        {
          leftClickGtFlag(features[index]);
          shouldReturn = true;
        }
        if (features[index].size == 22)
        {
          leftClickPota(features[index].key);
          shouldReturn = true;
        }
      }
      if (finalGridFeature)
      {
        onRightClickGridSquare(finalGridFeature);
        shouldReturn = true;
      }
    }

    if (event.activePointers[0].buttons == 1 && event.activePointers[0].ctrlKey == true)
    {
      var LL = ol.proj.toLonLat(event.coordinate, GT.mapSettings.projection);
      var info = {};
      info.callObj = {};
      info.callObj.distance = 1; // We just need the heading, but distance makes it valid
      info.callObj.heading = parseInt(MyCircle.bearing(GT.myLat, GT.myLon, LL[1], LL[0]));
      aimRotator(info);
    }

    if (shouldReturn) return true;

    if (event.activePointers[0].buttons == 2 && GT.currentOverlay == 0)
    {
      mouseDownGrid(ol.proj.toLonLat(event.coordinate, GT.mapSettings.projection));
      return true;
    }
  });

  GT.map.on("pointerup", function (event)
  {
    mouseUpGrid();
    if (GT.mapSettings.mouseOver == false)
    {
      mouseOutOfDataItem();
    }
  });

  document.getElementById("menuDiv").style.display = "block";

  dayNight.init(GT.map);
  if (GT.appSettings.graylineImgSrc == 1 || GT.useTransform == true)
  {
    dayNight.hide();
  }
  else
  {
    GT.nightTime = dayNight.show();
  }
  Grayline.style.display = (GT.useTransform) ? "none" : "";

  moonLayer.init(GT.map);
  if (GT.appSettings.moonTrack == 1)
  {
    moonLayer.show();
  }
  else
  {
    moonLayer.hide();
  }

  GT.tileLayer.setOpacity(Number(GT.mapSettings.mapOpacity));

  nightMapEnable.checked = GT.mapSettings.nightMapEnable;
  changeNightMapEnable(nightMapEnable);
}

function mapMoveEvent(event)
{
  onMouseUpdate(event);

  var mousePosition = GT.map.getEventPixel(event);
  if (GT.appSettings.mouseTrack == 1)
  {
    var mouseLngLat = GT.map.getEventCoordinate(event);
    if (mouseLngLat)
    {
      var LL = ol.proj.toLonLat(mouseLngLat, GT.mapSettings.projection);
      if (isNaN(LL[0]))
      {
        mouseTrackDiv.innerHTML = "";
      }
      else
      {
        var dist = parseInt(MyCircle.distance(GT.myLat, GT.myLon, LL[1], LL[0], distanceUnit.value) * MyCircle.validateRadius(distanceUnit.value)) + distanceUnit.value.toLowerCase();
        var azim = parseInt(MyCircle.bearing(GT.myLat, GT.myLon, LL[1], LL[0])) + "&deg;";
        var gg = latLonToGridSquare(LL[1], LL[0], 6);
        mouseTrackDiv.innerHTML = LL[1].toFixed(3) + ", " + LL[0].toFixed(3) + " " + dist + " " + azim + " " + gg;
      }
    }
  }

  let noFeature = true;
  let features = GT.map.getFeaturesAtPixel(mousePosition);
  if (features != null && features.length > 0)
  {
    for (let index in features)
    {
      if (!(features[index].values_.prop in GT.hoverFunctors)) continue;
      if (GT.lastHover.feature)
      {
        if (features[index] != GT.lastHover.feature)
        {
          GT.lastHover.functor.out(GT.lastHover.feature);
          GT.lastHover.feature = null;
        }
        else
        {
          // feature is still up.
          GT.hoverFunctors[features[index].values_.prop].move(features[index]);
          noFeature = false;
          break;
        }
      }
      if (GT.lastHover.feature == null)
      {
        if (GT.hoverFunctors[features[index].values_.prop].hover(features[index], true))
        {
          // feature was displayed.
          GT.lastHover.feature = features[index];
          GT.lastHover.functor = GT.hoverFunctors[features[index].values_.prop];
          noFeature = false;
          break;
        }
      }
    }
  }

  if (noFeature && GT.lastHover.feature)
  {
    GT.lastHover.functor.out(GT.lastHover.feature);
    GT.lastHover.feature = null;
  }
}

function changeNightMapEnable(check)
{
  if (check.checked)
  {
    nightMapTd.style.display = "";
    spotNightPathColorDiv.style.display = "";
    GT.mapSettings.nightMapEnable = true;
    GT.nightTime = dayNight.refresh();
  }
  else
  {
    nightMapTd.style.display = "none";
    spotNightPathColorDiv.style.display = "none";
    GT.mapSettings.nightMapEnable = false;
  }
  changeMapLayer();
  styleAllFlightPaths();
  redrawSpots();
  saveMapSettings();
}

GT.lasttimezone = null;

GT.nexradInterval = null;

function createNexRad()
{
  var layerSource = new ol.source.TileWMS({
    projection: "EPSG:3857",
    url: "https://mapservices.weather.noaa.gov/eventdriven/services/radar/radar_base_reflectivity_time/ImageServer/WMSServer",
    attributions: `<a href="https://radar.weather.gov/" target="_blank">NWS</a>`,
    params: { LAYERS: "0" }
  });

  var layerVector = new ol.layer.Tile({
    source: layerSource,
    visible: true,
    opacity: 0.6,
    zIndex: 900
  });

  layerVector.set("name", "radar");

  return layerVector;
}

function toggleNexrad()
{
  GT.mapSettings.usNexrad = !GT.mapSettings.usNexrad;
  displayNexrad();
  saveMapSettings();
}

function displayNexrad()
{
  if (GT.mapSettings.usNexrad && GT.mapSettings.offlineMode == false)
  {
    if (GT.Nexrad == null)
    {
      GT.Nexrad = createNexRad();
      GT.map.addLayer(GT.Nexrad);
    }

    if (GT.nexradInterval == null) { GT.nexradInterval = nodeTimers.setInterval(nexradRefresh, 600000); }
  }
  else
  {
    if (GT.nexradInterval != null)
    {
      nodeTimers.clearInterval(GT.nexradInterval);
      GT.nexradInterval = null;
    }
    if (GT.Nexrad)
    {
      GT.map.removeLayer(GT.Nexrad);
      GT.Nexrad = null;
    }
  }

  radarImg.style.filter = GT.mapSettings.usNexrad ? "" : "grayscale(1)";
}

function nexradRefresh()
{
  if (GT.Nexrad != null && GT.mapSettings.offlineMode == false)
  {
    GT.Nexrad.getSource().updateParams({ ol3_salt: Math.random() });
    GT.Nexrad.getSource().refresh();
  }
}

function collapseMenu(shouldCollapse)
{
  if (shouldCollapse == true)
  {
    GT.menuShowing = false;
    mapDiv.className = "mapDivStart";
    menuDiv.className = "menuDivStart";
    spotsDiv.className = "spotsDivStart";
    chevronDiv.className = "chevronDivEnd";
  }
  else
  {
    GT.menuShowing = true;
    chevronDiv.className = "chevronDivStart";
    displayTime();
  }
  GT.map.updateSize();
}

function mapLoseFocus()
{
  if (GT.lastHover.feature)
  {
    GT.lastHover.functor.out(GT.lastHover.feature);
    GT.lastHover.feature = null;
  }
}

function lineString(points, count)
{
  var thing;
  if (GT.useTransform)
  {
    var line = lineGeometry(points, count);
    var thing = new ol.geom.LineString(line);
  }
  else
  {
    var fromPoint = ol.proj.fromLonLat(points[0]);
    var toPoint = ol.proj.fromLonLat(points[1]);
    let pointsA = [ fromPoint, toPoint ];
    thing = new ol.geom.LineString(pointsA);
  }

  var rect = new ol.Feature({
    geometry: thing,
    prop: "lineString"
  });
  if (GT.useTransform)
  {
    rect.getGeometry().transform("EPSG:3857", GT.mapSettings.projection);
  }
  return rect;
}

function rectangle(bounds, options)
{
  var thing = new ol.geom.Polygon([
    [
      ol.proj.fromLonLat([bounds[0][0], bounds[0][1]]),
      ol.proj.fromLonLat([bounds[0][0], bounds[1][1]]),
      ol.proj.fromLonLat([bounds[1][0], bounds[1][1]]),
      ol.proj.fromLonLat([bounds[1][0], bounds[0][1]])
    ]
  ]);
  var rect = new ol.Feature({
    prop: "grid",
    geometry: thing
  });
  if (GT.useTransform)
  {
    rect.getGeometry().transform("EPSG:3857", GT.mapSettings.projection);
  }
  return rect;
}

function triangle(bounds, topLeft)
{
  var thing = null;

  if (topLeft)
  {
    thing = new ol.geom.Polygon([
      [
        ol.proj.fromLonLat([bounds[0][0], bounds[0][1]]),
        ol.proj.fromLonLat([bounds[0][0], bounds[1][1]]),
        ol.proj.fromLonLat([bounds[1][0], bounds[1][1]]),
        ol.proj.fromLonLat([bounds[0][0], bounds[0][1]])
      ]
    ]);
  }
  else
  {
    thing = new ol.geom.Polygon([
      [
        ol.proj.fromLonLat([bounds[0][0], bounds[0][1]]),
        ol.proj.fromLonLat([bounds[1][0], bounds[1][1]]),
        ol.proj.fromLonLat([bounds[1][0], bounds[0][1]]),
        ol.proj.fromLonLat([bounds[0][0], bounds[0][1]])
      ]
    ]);
  }

  var rect = new ol.Feature({
    prop: "grid",
    geometry: thing
  });
  if (GT.useTransform)
  {
    rect.getGeometry().transform("EPSG:3857", GT.mapSettings.projection);
  }
  return rect;
}

function triangleToGrid(iQTH, feature)
{
  var LL = squareToLatLong(iQTH);
  var bounds = [
    [LL.lo1, LL.la1],
    [LL.lo2, LL.la2]
  ];

  var thing = new ol.geom.Polygon([
    [
      ol.proj.fromLonLat([bounds[0][0], bounds[0][1]]),
      ol.proj.fromLonLat([bounds[0][0], bounds[1][1]]),
      ol.proj.fromLonLat([bounds[1][0], bounds[1][1]]),
      ol.proj.fromLonLat([bounds[1][0], bounds[0][1]]),
      ol.proj.fromLonLat([bounds[0][0], bounds[0][1]])
    ]
  ]);

  feature.setGeometry(thing);
  if (GT.useTransform)
  {
    feature.getGeometry().transform("EPSG:3857", GT.mapSettings.projection);
  }
}

function gridToTriangle(iQTH, feature, topLeft)
{
  var LL = squareToLatLong(iQTH);
  var bounds = [
    [LL.lo1, LL.la1],
    [LL.lo2, LL.la2]
  ];
  var thing = null;

  if (topLeft)
  {
    thing = new ol.geom.Polygon([
      [
        ol.proj.fromLonLat([bounds[0][0], bounds[0][1]]),
        ol.proj.fromLonLat([bounds[0][0], bounds[1][1]]),
        ol.proj.fromLonLat([bounds[1][0], bounds[1][1]]),
        ol.proj.fromLonLat([bounds[0][0], bounds[0][1]])
      ]
    ]);
  }
  else
  {
    thing = new ol.geom.Polygon([
      [
        ol.proj.fromLonLat([bounds[0][0], bounds[0][1]]),
        ol.proj.fromLonLat([bounds[1][0], bounds[1][1]]),
        ol.proj.fromLonLat([bounds[1][0], bounds[0][1]]),
        ol.proj.fromLonLat([bounds[0][0], bounds[0][1]])
      ]
    ]);
  }

  feature.setGeometry(thing);
  if (GT.useTransform)
  {
    feature.getGeometry().transform("EPSG:3857", GT.mapSettings.projection);
  }
}

function liveHash(call, band, mode)
{
  return call + band + mode;
}

function setHomeGridsquare()
{
  let hash = GT.appSettings.myGrid;

  qthToBox(GT.appSettings.myGrid, GT.appSettings.myCall, false, true, "", GT.appSettings.myBand, null, hash, false);

  let push = false;

  if (!(hash in GT.liveCallsigns))
  {
    newCallsign = {};
    push = true;
  }
  else
  {
    newCallsign = GT.liveCallsigns[hash];
  }

  newCallsign.DEcall = GT.appSettings.myCall;
  newCallsign.grid = GT.appSettings.myGrid;
  newCallsign.field = newCallsign.grid.substring(0, 2);
  newCallsign.wspr = null;
  newCallsign.msg = GT.appSettings.myGrid;
  newCallsign.RSTsent = "-";
  newCallsign.RSTrecv = "-";
  newCallsign.time = timeNowSec();
  newCallsign.delta = -1;
  newCallsign.DXcall = "Self";
  newCallsign.mode = GT.appSettings.myMode;
  newCallsign.band = GT.appSettings.myBand;
  newCallsign.worked = false;
  newCallsign.confirmed = false;
  newCallsign.state = null;
  newCallsign.zipcode = null;
  newCallsign.cnty = null;
  newCallsign.qual = false;
  newCallsign.instance = null;
  newCallsign.alerted = false;
  newCallsign.shouldAlert = false;
  newCallsign.locked = true;

  GT.myDXCC = newCallsign.dxcc = callsignToDxcc(GT.appSettings.myCall);

  if (push) GT.liveCallsigns[hash] = newCallsign;
}

GT.transmitFlightPath = null;

function haltAllTx(allTx = false)
{
  for (var instance in GT.instances)
  {
    if (instance != GT.activeInstance || allTx == true)
    {
      var responseArray = Buffer.alloc(1024);
      var length = 0;

      var port = GT.instances[instance].remote.port;
      var address = GT.instances[instance].remote.address;

      length = encodeQUINT32(responseArray, length, 0xadbccbda);
      length = encodeQUINT32(responseArray, length, 2);
      length = encodeQUINT32(responseArray, length, 8);
      length = encodeQUTF8(responseArray, length, instance);
      length = encodeQBOOL(responseArray, length, 0);

      responseArray = responseArray.slice(0, length);
      wsjtUdpMessage(responseArray, responseArray.length, port, address);
    }
  }
}

function initiateQso(thisCall)
{
  if (thisCall in GT.callRoster && GT.callRoster[thisCall].message.instance in GT.instances)
  {
    if (GT.mapSettings.focusRig && GT.activeInstance != GT.callRoster[thisCall].message.instance)
    {
      activeRig(GT.callRoster[thisCall].message.instance);
    }
    if (GT.mapSettings.haltAllOnTx)
    {
      haltAllTx();
    }

    var newMessage = GT.callRoster[thisCall].message;
    var responseArray = Buffer.alloc(1024);
    var length = 0;
    var instance = GT.callRoster[thisCall].message.instance;
    var port = GT.instances[instance].remote.port;
    var address = GT.instances[instance].remote.address;
    length = encodeQUINT32(responseArray, length, newMessage.magic_key);
    length = encodeQUINT32(responseArray, length, newMessage.schema_number);
    length = encodeQUINT32(responseArray, length, 4);
    length = encodeQUTF8(responseArray, length, newMessage.Id);
    length = encodeQUINT32(responseArray, length, newMessage.TM);
    length = encodeQINT32(responseArray, length, newMessage.SR);
    length = encodeQDOUBLE(responseArray, length, newMessage.DT);
    length = encodeQUINT32(responseArray, length, newMessage.DF);
    length = encodeQUTF8(responseArray, length, newMessage.MO);
    length = encodeQUTF8(responseArray, length, newMessage.Msg);
    length = encodeQBOOL(responseArray, length, newMessage.LC);
    length = encodeQBOOL(responseArray, length, 0);

    responseArray = responseArray.slice(0, length);
    wsjtUdpMessage(responseArray, responseArray.length, port, address);
  }
}

function spotLookupAndSetCall(spot)
{
  var call = GT.receptionReports.spots[spot].call;
  var grid = GT.receptionReports.spots[spot].grid;
  var band = GT.receptionReports.spots[spot].band;
  var mode = GT.receptionReports.spots[spot].mode;
  for (var instance in GT.instances)
  {
    if (GT.instances[instance].valid && GT.instances[instance].status.Band == band && GT.instances[instance].status.MO == mode)
    {
      setCallAndGrid(call, grid, instance);
      return;
    }
  }
  setCallAndGrid(call, grid, null);
}

function setCallAndGrid(callsign, grid, instance = null, genMessages = true)
{
  var thisInstance = null;
  var port;
  var address;
  if (instance != null)
  {
    if (instance in GT.instances)
    {
      thisInstance = GT.instances[instance].status;
      port = GT.instances[instance].remote.port;
      address = GT.instances[instance].remote.address;
    }
  }
  else
  {
    if (GT.instances[GT.activeInstance].valid)
    {
      thisInstance = GT.instances[GT.activeInstance].status;
      port = GT.instances[GT.activeInstance].remote.port;
      address = GT.instances[GT.activeInstance].remote.address;
    }
  }
  if (thisInstance && (thisInstance.TxEnabled == 0 || genMessages == false))
  {
    var responseArray = Buffer.alloc(1024);
    var length = 0;
    length = encodeQUINT32(responseArray, length, thisInstance.magic_key);
    length = encodeQUINT32(responseArray, length, thisInstance.schema_number);
    length = encodeQUINT32(responseArray, length, 15);
    length = encodeQUTF8(responseArray, length, thisInstance.Id);
    length = encodeQUTF8(responseArray, length, thisInstance.MO);
    length = encodeQUINT32(responseArray, length, thisInstance.FreqTol);
    length = encodeQUTF8(responseArray, length, thisInstance.Submode);
    length = encodeQBOOL(responseArray, length, thisInstance.Fastmode);
    length = encodeQUINT32(responseArray, length, thisInstance.TRP);
    length = encodeQUINT32(responseArray, length, thisInstance.RxDF);

    if (genMessages == true)
    {
      length = encodeQUTF8(responseArray, length, callsign);

      var hash = liveHash(callsign, thisInstance.Band, thisInstance.MO);
      if (hash in GT.liveCallsigns && GT.liveCallsigns[hash].grid.length > 1) { grid = GT.liveCallsigns[hash].grid; }

      if (grid.length == 0) grid = " ";

      length = encodeQUTF8(responseArray, length, grid);
      length = encodeQBOOL(responseArray, length, 1);

      responseArray = responseArray.slice(0, length);
      wsjtUdpMessage(responseArray, responseArray.length, port, address);
      addLastTraffic("<font color='lightgreen'>Generated Msgs</font>");
    }
    else
    {
      // Callsign
      length = encodeQUTF8(responseArray, length, " ");
      // Grid
      length = encodeQUTF8(responseArray, length, " ");
      length = encodeQBOOL(responseArray, length, 1);

      responseArray = responseArray.slice(0, length);
      wsjtUdpMessage(responseArray, responseArray.length, port, address);

      responseArray = Buffer.alloc(1024);
      length = 0;
      length = encodeQUINT32(responseArray, length, thisInstance.magic_key);
      length = encodeQUINT32(responseArray, length, thisInstance.schema_number);
      length = encodeQUINT32(responseArray, length, 9);
      length = encodeQUTF8(responseArray, length, thisInstance.Id);
      length = encodeQUTF8(responseArray, length, "");
      length = encodeQBOOL(responseArray, length, 0);

      responseArray = responseArray.slice(0, length);
      wsjtUdpMessage(responseArray, responseArray.length, port, address);
    }
  }
  if (thisInstance && thisInstance.TxEnabled == 1 && genMessages == true)
  {
    addLastTraffic("<font color='yellow'>Transmit Enabled!</font><br/><font color='yellow'>Generate Msgs Aborted</font>");
  }
}

GT.wsjtHandlers = {
  0: handleWsjtxNotSupported,
  1: handleWsjtxStatus,
  2: handleWsjtxDecode,
  3: handleWsjtxClear,
  4: handleWsjtxNotSupported,
  5: handleWsjtxQSO,
  6: handleWsjtxClose,
  7: handleWsjtxNotSupported,
  8: handleWsjtxNotSupported,
  9: handleWsjtxNotSupported,
  10: handleWsjtxWSPR,
  11: handleWsjtxNotSupported,
  12: handleWsjtxADIF
};

GT.oldQSOTimer = null;

function handleWsjtxADIF(newMessage)
{
  if (GT.oldQSOTimer)
  {
    nodeTimers.clearTimeout(GT.oldQSOTimer);
    GT.oldQSOTimer = null;
  }

  sendToLogger(newMessage.ADIF);
}

function handleWsjtxQSO(newMessage)
{
  if (GT.oldQSOTimer)
  {
    nodeTimers.clearTimeout(GT.oldQSOTimer);
    GT.oldQSOTimer = null;
  }

  GT.oldStyleLogMessage = Object.assign({}, newMessage);

  GT.oldQSOTimer = nodeTimers.setTimeout(oldSendToLogger, 3000);
}

function handleWsjtxNotSupported(newMessage) { }

GT.lastBand = "";
GT.lastMode = "";

GT.weAreDecoding = false;
GT.localDXcall = "";

GT.countIndex = 0;
GT.lastCountIndex = 0;

function rigChange(up)
{
  if (GT.activeInstance == "") return;

  var targetInstance = 0;
  if (up)
  {
    targetInstance = GT.instances[GT.activeInstance].intId + 1;
  }
  else
  {
    targetInstance = GT.instances[GT.activeInstance].intId - 1;
    if (targetInstance < 0) targetInstance = GT.instancesIndex.length - 1;
  }

  targetInstance %= GT.instancesIndex.length;

  setRig(targetInstance);
}

function setRig(instanceId)
{
  if (GT.instances[GT.instancesIndex[instanceId]].valid)
  {
    if (GT.lastMapView != null)
    {
      GT.mapView.animate({ zoom: GT.lastMapView.zoom, duration: 100 });
      GT.mapView.animate({ center: GT.lastMapView.LoLa, duration: 100 });
      GT.lastMapView = null;
    }

    GT.activeInstance = GT.instancesIndex[instanceId];

    handleWsjtxStatus(GT.instances[GT.activeInstance].status);
    handleClosed(GT.instances[GT.activeInstance].status);
  }
}

function activeRig(instance)
{
  if (GT.instances[instance].valid)
  {
    if (GT.lastMapView != null)
    {
      GT.mapView.animate({ zoom: GT.lastMapView.zoom, duration: 100 });
      GT.mapView.animate({ center: GT.lastMapView.LoLa, duration: 100 });
      GT.lastMapView = null;
    }

    GT.activeInstance = instance;

    handleWsjtxStatus(GT.instances[GT.activeInstance].status);
    handleClosed(GT.instances[GT.activeInstance].status);
  }
}

GT.lastTransmitCallsign = {};
GT.lastStatusCallsign = {};
GT.lastTxMessage = null;

function handleWsjtxStatus(newMessage)
{
  if (GT.ignoreMessages == 1) return;

  if (GT.rosterInitialized)
  {
    try
    {
      GT.callRosterWindowHandle.window.processStatus(newMessage);
    }
    catch (e)
    {
      console.error(e);
    }
  }

  if (GT.activeInstance == "")
  {
    GT.activeInstance = newMessage.instance;
  }

  if (Object.keys(GT.instances).length > 1)
  {
    rigWrap.style.display = "";
  }
  else
  {
    rigWrap.style.display = "none";
  }

  var DXcall = newMessage.DXcall.trim();

  if (DXcall.length > 1)
  {
    if (!(newMessage.instance in GT.lastTransmitCallsign)) { GT.lastTransmitCallsign[newMessage.instance] = ""; }

    if (!(newMessage.instance in GT.lastStatusCallsign)) { GT.lastStatusCallsign[newMessage.instance] = ""; }

    if (lookupOnTx.checked == true && newMessage.Transmitting == 1 && GT.lastTransmitCallsign[newMessage.instance] != DXcall)
    {
      openLookupWindow(true);
      GT.lastTransmitCallsign[newMessage.instance] = DXcall;
    }

    if (GT.lastStatusCallsign[newMessage.instance] != DXcall)
    {
      GT.lastStatusCallsign[newMessage.instance] = DXcall;
      lookupCallsign(DXcall, newMessage.DXgrid.trim());
    }
  }

  if (GT.rosterInitialized && GT.callRosterWindowHandle.window.CR.rosterSettings.clearRosterOnBandChange && GT.instances[newMessage.instance].oldStatus)
  {
    if (GT.instances[newMessage.instance].oldStatus.Band != newMessage.Band || GT.instances[newMessage.instance].oldStatus.MO != newMessage.MO)
    {
      for (const call in GT.callRoster)
      {
        if (GT.callRoster[call].callObj.instance == newMessage.instance) { delete GT.callRoster[call]; }
      }
      if (GT.activeInstance == newMessage.instance)
      {
        goProcessRoster();
      }
    }
  }

  if (newMessage.Transmitting == 1)
  {
    GT.lastTrasmissionTimeSec = GT.timeNow;
  }

  if (GT.activeInstance == newMessage.instance)
  {
    var sp = newMessage.Id.split(" - ");
    rigDiv.innerHTML = sp[sp.length - 1].substring(0, 18);

    var bandChange = false;
    var modeChange = false;

    wsjtxMode.innerHTML = "<font color='orange'>" + newMessage.MO + "</font>";
    GT.appSettings.myMode = newMessage.MO;
    GT.appSettings.myBand = newMessage.Band;
    if (GT.lastBand != GT.appSettings.myBand)
    {
      GT.lastBand = GT.appSettings.myBand;
      bandChange = true;
      if (GT.pskBandActivityTimerHandle != null)
      {
        nodeTimers.clearInterval(GT.pskBandActivityTimerHandle);
        GT.pskBandActivityTimerHandle = null;
      }
    }
    if (GT.lastMode != GT.appSettings.myMode)
    {
      GT.lastMode = GT.appSettings.myMode;
      modeChange = true;
      if (GT.pskBandActivityTimerHandle != null)
      {
        nodeTimers.clearInterval(GT.pskBandActivityTimerHandle);
        GT.pskBandActivityTimerHandle = null;
      }
    }
    if (GT.pskBandActivityTimerHandle == null) pskGetBandActivity();
    if (bandChange || modeChange || GT.startingUp)
    {
      removePaths();
      goProcessRoster();
      redrawGrids();
      redrawSpots();
      redrawParks();
      redrawPins();

      var msg = "<font color='yellow'>" + GT.appSettings.myBand + "</font> / <font color='orange'>" + GT.appSettings.myMode + "</font>";
      addLastTraffic(msg);
      ackAlerts();
      updateChatWindow();
      oamsBandActivityCheck();
      GT.gtLiveStatusUpdate = true;
      GT.startingUp = false;
    }

    GT.appSettings.myRawFreq = newMessage.Frequency;
    frequency.innerHTML = "<font color='lightgreen'>" + formatMhz(Number(newMessage.Frequency / 1000), 3, 3) + " Hz </font><font color='yellow'>(" + GT.appSettings.myBand + ")</font>";
    GT.appSettings.myRawCall = newMessage.DEcall.trim();
    GT.appSettings.myRawGrid = newMessage.DEgrid.trim().substr(0, 6);

    if (GT.appSettings.myRawGrid != GT.appSettings.myGrid)
    {
      let LL = squareToCenter(GT.appSettings.myRawGrid);
      GT.mapSettings.latitude = GT.myLat = LL.a;
      GT.mapSettings.longitude = GT.myLon = LL.o;
      tryUpdateQTH(GT.appSettings.myRawGrid);
      nodeTimers.setTimeout(tryRecenterAEQD, 32);
    }

    dxCallBoxDiv.className = "DXCallBox";

    var hash = DXcall + GT.appSettings.myBand + GT.appSettings.myMode;

    if (hash in GT.tracker.worked.call)
    {
      dxCallBoxDiv.className = "DXCallBoxWorked";
    }
    if (hash in GT.tracker.confirmed.call)
    {
      dxCallBoxDiv.className = "DXCallBoxConfirmed";
    }

    if (GT.appSettings.clearOnCQ && newMessage.Transmitting == 1 && newMessage.TxMessage && GT.lastTxMessage != newMessage.TxMessage)
    {
      GT.lastTxMessage = newMessage.TxMessage;
      if (newMessage.TxMessage.substring(0, 2) == "CQ" && DXcall.length > 0)
      {
        setCallAndGrid("", "", newMessage.instance, false);
        DXcall = "";
        newMessage.DXgrid = "";
      }
    }

    GT.localDXcall = DXcall;
    localDXcall.innerHTML = formatCallsign(DXcall);
    if (localDXcall.innerHTML.length == 0)
    {
      localDXcall.innerHTML = "-";
      GT.localDXcall = "";
    }
    localDXGrid.innerHTML = GT.myDXGrid = newMessage.DXgrid.trim();

    if (GT.myDXGrid.length == 0 && hash in GT.liveCallsigns)
    {
      localDXGrid.innerHTML = GT.myDXGrid = GT.liveCallsigns[hash].grid.substr(0, 4);
    }

    if (localDXGrid.innerHTML.length == 0)
    {
      localDXGrid.innerHTML = "-";
      localDXDistance.innerHTML = "&nbsp;";
      localDXAzimuth.innerHTML = "&nbsp;";
    }
    else
    {
      var LL = squareToCenter(GT.myDXGrid);
      localDXDistance.innerHTML = parseInt(MyCircle.distance(GT.myLat, GT.myLon, LL.a, LL.o, distanceUnit.value) * MyCircle.validateRadius(distanceUnit.value)) + distanceUnit.value.toLowerCase();
      localDXAzimuth.innerHTML = parseInt(MyCircle.bearing(GT.myLat, GT.myLon, LL.a, LL.o)) + "&deg;";
    }

    if (localDXcall.innerHTML != "-")
    {
      localDXReport.innerHTML = formatSignalReport(Number(newMessage.Report.trim()));
      if (DXcall.length > 0)
      {
        localDXCountry.innerHTML = GT.dxccToAltName[callsignToDxcc(DXcall)];
      }
      else
      {
        localDXCountry.innerHTML = "&nbsp;";
      }
    }
    else
    {
      localDXReport.innerHTML = localDXCountry.innerHTML = "";
    }

    GT.appSettings.myCall = newMessage.DEcall;
 


    if (newMessage.Decoding == 1)
    {
      // Decoding
      fadePaths();
      txrxdec.style.backgroundColor = "Blue";
      txrxdec.style.borderColor = "Cyan";
      txrxdec.innerHTML = "DECODE";
      GT.countIndex++;
      GT.weAreDecoding = true;
    }
    else
    {
      GT.weAreDecoding = false;

      if (GT.countIndex != GT.lastCountIndex)
      {
        GT.lastCountIndex = GT.countIndex;

        updateCountStats();

        if (bandChange || modeChange) reloadInfo();
        var worker = "";

        worker += "<div  style='vertical-align:top;display:inline-block;margin-right:8px;'>";
        worker += "<table class='darkTable' align=center>";
        worker += "<tr><th colspan=7>Last " + GT.lastMessages.length + " Decoded Messages</th></tr>";
        worker += "<tr><th>Time</th><th>dB</th><th>DT</th><th>Freq</th><th>Mode</th><th>Message</th><th>DXCC</th></tr>";

        worker += GT.lastMessages.join("");

        worker += "</table></div>";

        setStatsDiv("decodeLastListDiv", worker);
        setStatsDivHeight("decodeLastListDiv", getStatsWindowHeight() + 26 + "px");

        if (GT.appSettings.gtShareEnable == true && Object.keys(GT.spotCollector).length > 0)
        {
          gtChatSendSpots(GT.spotCollector, GT.spotDetailsCollector);
          GT.spotCollector = {};
          GT.spotDetailsCollector = {};
        }
      }

      txrxdec.style.backgroundColor = "Green";
      txrxdec.style.borderColor = "GreenYellow";
      txrxdec.innerHTML = "RECEIVE";
    }

    if (newMessage.TxEnabled)
    {
      if (GT.mapSettings.fitQRZ && (GT.spotView == 0 || GT.receptionSettings.mergeSpots))
      {
        if (GT.lastMapView == null)
        {
          GT.lastMapView = {};
          GT.lastMapView.LoLa = GT.mapView.getCenter();
          GT.lastMapView.zoom = GT.mapView.getZoom();
        }
        if (GT.myDXGrid.length > 0)
        {
          fitViewBetweenPoints([getPoint(GT.appSettings.myRawGrid), getPoint(GT.myDXGrid)]);
        }
        else if (GT.mapSettings.qrzDxccFallback && DXcall.length > 0 && callsignToDxcc(DXcall) > 0)
        {
          var dxcc = callsignToDxcc(DXcall);
          var Lat = GT.dxccInfo[dxcc].lat;
          var Lon = GT.dxccInfo[dxcc].lon;
          fitViewBetweenPoints([getPoint(GT.appSettings.myRawGrid), ol.proj.fromLonLat([Lon, Lat])], 15);
        }
      }
    }
    else
    {
      if (GT.lastMapView != null)
      {
        GT.mapView.animate({ zoom: GT.lastMapView.zoom, duration: 1200 });
        GT.mapView.animate({ center: GT.lastMapView.LoLa, duration: 1200 });
        GT.lastMapView = null;
      }
    }

    if (newMessage.Transmitting == 0)
    {
      // Not Transmitting
      GT.lastTxMessage = null;
      GT.layerSources.transmit.clear();
      GT.transmitFlightPath = null;
    }
    else
    {
      txrxdec.style.backgroundColor = "Red";
      txrxdec.style.borderColor = "Orange";
      txrxdec.innerHTML = "TRANSMIT";
      GT.layerSources.transmit.clear();
      GT.transmitFlightPath = null;

      if (qrzPathWidthValue.value != 0 && GT.appSettings.gridViewMode != 2 && validateGridFromString(GT.appSettings.myRawGrid))
      {
        var strokeColor = getQrzPathColor();
        var strokeWeight = qrzPathWidthValue.value;
        var LL = squareToCenter(GT.appSettings.myRawGrid);
        var fromPoint = ol.proj.fromLonLat([LL.o, LL.a]);
        var toPoint = null;

        if (validateGridFromString(GT.myDXGrid))
        {
          LL = squareToCenter(GT.myDXGrid);
          toPoint = ol.proj.fromLonLat([LL.o, LL.a]);
        }
        else if (GT.mapSettings.qrzDxccFallback && DXcall.length > 0 && callsignToDxcc(DXcall) > 0)
        {
          var dxcc = callsignToDxcc(DXcall);
          toPoint = ol.proj.fromLonLat([GT.dxccInfo[dxcc].lon, GT.dxccInfo[dxcc].lat]);

          var locality = GT.dxccInfo[dxcc].geo;
          if (locality == "deleted") locality = null;

          if (locality != null)
          {
            var feature = shapeFeature("qrz", locality, "qrz", "#FFFF0010", "#FF0000FF", 1.0);
            GT.layerSources.transmit.addFeature(feature);
          }
        }

        if (toPoint)
        {
          try
          {
            GT.transmitFlightPath = flightFeature(
              [fromPoint, toPoint],
              {
                weight: strokeWeight,
                color: strokeColor,
                steps: 75,
                zIndex: 90
              },
              "transmit",
              true
            );
          }
          catch (err)
          {
            console.error("Unexpected error inside handleWsjtxStatus", err)
          }
        }
      }
      GT.weAreDecoding = false;
    }
  }

  if (newMessage.Decoding == 0)
  {
    goProcessRoster();
    processClassicAlerts();
  }
}

function reportDecodes()
{
  if (Object.keys(GT.decodeCollector).length > 0)
  {
    gtChatSendDecodes(GT.decodeCollector);
    GT.decodeCollector = {};
  }
}

GT.lastMapView = null;

function drawTraffic()
{
  while (GT.lastTraffic.length > 60) GT.lastTraffic.pop();

  var worker = GT.lastTraffic.join("<br/>");
  worker = worker.split("80%'><br/>").join("80%'>");
  if (GT.localDXcall.length > 1)
  {
    worker = worker
      .split(GT.localDXcall)
      .join("<font style='color:cyan'>" + GT.localDXcall + "</font>");
  }
  if (GT.appSettings.myRawCall.length > 1)
  {
    worker = worker
      .split(GT.appSettings.myRawCall)
      .join("<font style='color:yellow'>" + GT.appSettings.myRawCall + "</font>");
  }
  trafficDiv.innerHTML = worker;
}

function getPoint(grid)
{
  var LL = squareToCenter(grid);
  return ol.proj.fromLonLat([LL.o, LL.a]);
}

function fitViewBetweenPoints(points, maxZoom = 20)
{
  var start = ol.proj.toLonLat(points[0], GT.mapSettings.projection);
  var end = ol.proj.toLonLat(points[1], GT.mapSettings.projection);

  if (Math.abs(start[0] - end[0]) > 180)
  {
    // Wrapped
    if (end[0] < start[0])
    {
      start[0] -= 360;
    }
    else
    {
      end[0] -= 360;
    }
  }

  start = ol.proj.fromLonLat(start);
  end = ol.proj.fromLonLat(end);
  var line = new ol.geom.LineString([start, end]);
  var feature = new ol.Feature({ geometry: line });
  if (GT.useTransform)
  {
    rect.getGeometry().transform("EPSG:3857", GT.mapSettings.projection);
  }
  var extent = feature.getGeometry().getExtent();

  GT.mapView.fit(extent, {
    duration: 500,
    maxZoom: maxZoom,
    padding: [75, 75, 75, 75]
  });
}

GT.spotCollector = {};
GT.spotDetailsCollector = {};
GT.decodeCollector = {};

function handleWsjtxDecode(newMessage)
{
  // eg: "YK7DAQ RR73; 3O5GAS <JI1BXD> +14"
  if (newMessage.Msg.indexOf(" RR73; ") > -1)
  {
    let parts = newMessage.Msg.split("RR73; ");
    // parts[0] is "YK7DAQ " includes space
    // parts[1] is "3O5GAS <JI1BXD> +14" no leading space, a useable message
    let caller = parts[1].split(" ")[1];
    // caller is "<JI1BXD>"
    let first = parts[0] + caller + " RR73";
    // first is "YK7DAQ <JI1BXD> RR73"
    finalWsjtxDecode(newMessage, true, parts[1]);
    // Send the RR73 last as it's more important to us
    finalWsjtxDecode(newMessage, true, first);
  }
  else
  {
    // A classic mode 0 decoded messages
    finalWsjtxDecode(newMessage);
  }
}

function finalWsjtxDecode(newMessage, isFox = false, foxMessage)
{
  var didAlert = false;
  var didCustomAlert = false;
  var validQTH = false;
  var CQ = false;
  var RR73 = false;
  var msgDEcallsign = "";
  var msgDXcallsign = "";
  var theirQTH = "";
  var countryName = "";
  var newF;
  if (newMessage.OF > 0)
  {
    newF = formatMhz(Number((newMessage.OF + newMessage.DF) / 1000), 3, 3);
  }
  else
  {
    newF = newMessage.DF;
  }
  var theTimeStamp = timeNowSec() - (timeNowSec() % 86400) + parseInt(newMessage.TM / 1000);

  var theMessage = (isFox == true ? foxMessage : newMessage.Msg);

  // Break up the decoded message
  var decodeWords = theMessage.split(" ").slice(0, 5);
  while (decodeWords[decodeWords.length - 1] == "") decodeWords.pop();

  if (decodeWords.length > 1)
  {
    if (theMessage.indexOf("<") != -1)
    {
      for (const i in decodeWords)
      {
        decodeWords[i] = decodeWords[i].replace("<", "").replace(">", "");
        if (decodeWords[i].indexOf("...") != -1)
        {
          if (i != 0)
          {
            // simply ignore <...> , we don't know who they are and we aint talking to them.
            return;
          }
          else
          {
            decodeWords[0] = "UNKNOWN";
          }
        }
      }
    }

    // Grab the last word in the decoded message
    var qth = decodeWords[decodeWords.length - 1].trim();
    if (qth.length == 4)
    {
      var LETTERS = qth.substr(0, 2);
      var NUMBERS = qth.substr(2, 2);
      if (/^[A-R]+$/.test(LETTERS) && /^[0-9]+$/.test(NUMBERS))
      {
        theirQTH = LETTERS + NUMBERS;
        if (theirQTH != "RR73")
        {
          validQTH = true;
        }
        else
        {
          theirQTH = "";
          validQTH = false;
        }
      }
    }

    if (validQTH) msgDEcallsign = decodeWords[decodeWords.length - 2].trim();
    if (validQTH == false && decodeWords.length == 3) { msgDEcallsign = decodeWords[decodeWords.length - 2].trim(); }
    if (validQTH == false && decodeWords.length == 2) { msgDEcallsign = decodeWords[decodeWords.length - 1].trim(); }
    if (decodeWords[0] == "CQ")
    {
      CQ = true;
      msgDXcallsign = "CQ";
    }

    if (decodeWords.length == 4 && CQ == true)
    {
      msgDXcallsign += " " + decodeWords[1];
    }
    if (decodeWords.length == 3 && CQ == true && validQTH == false)
    {
      msgDXcallsign += " " + decodeWords[1];
    }
    if (decodeWords.length < 4 && CQ == false)
    {
      msgDXcallsign = decodeWords[0];
    }
    if (decodeWords.length >= 3 && CQ == true && validQTH == false)
    {
      if (validateNumAndLetter(decodeWords[decodeWords.length - 1].trim())) { msgDEcallsign = decodeWords[decodeWords.length - 1].trim(); }
      else msgDEcallsign = decodeWords[decodeWords.length - 2].trim();
    }

    if (decodeWords.length >= 4 && CQ == false)
    {
      msgDXcallsign = decodeWords[0];
      msgDEcallsign = decodeWords[1];
    }

    if (decodeWords[2] == "RR73")
    {
      RR73 = true;
    }

    var callsign = null;

    var hash = msgDEcallsign + newMessage.OB + newMessage.OM;
    if (hash in GT.liveCallsigns) callsign = GT.liveCallsigns[hash];

    var canPath = false;
    if (
      (GT.appSettings.gtBandFilter.length == 0 ||
        (GT.appSettings.gtBandFilter == "auto" && newMessage.OB == GT.appSettings.myBand) ||
        newMessage.OB == GT.appSettings.gtBandFilter) &&
      (GT.appSettings.gtModeFilter.length == 0 ||
        (GT.appSettings.gtModeFilter == "auto" && newMessage.OM == GT.appSettings.myMode) ||
        newMessage.OM == GT.appSettings.gtModeFilter ||
        GT.appSettings.gtModeFilter == "Digital")
    )
    {
      qthToBox(theirQTH, msgDEcallsign, CQ, false, msgDXcallsign, newMessage.OB, null, hash, true);
      canPath = true;
    }

    if (theirQTH in GT.liveGrids)
    {
      GT.liveGrids[theirQTH].age = GT.timeNow;
    }

    if (callsign == null)
    {
      let newCallsign = {};
      newCallsign.DEcall = msgDEcallsign;
      newCallsign.grid = theirQTH;
      newCallsign.field = theirQTH.substring(0, 2);
      newCallsign.wspr = null;
      newCallsign.msg = newMessage.Msg;
      newCallsign.RSTsent = newMessage.SR;
      newCallsign.RSTrecv = "-";
      newCallsign.time = theTimeStamp;
      newCallsign.life = newCallsign.age = timeNowSec();
      newCallsign.delta = newMessage.DF;
      newCallsign.dt = newMessage.DT.toFixed(2);
      newCallsign.DXcall = msgDXcallsign.trim();
      newCallsign.state = null;
      newCallsign.zipcode = null;
      newCallsign.worked = false;
      newCallsign.confirmed = false;
      newCallsign.qso = false;
      newCallsign.dxcc = callsignToDxcc(newCallsign.DEcall);
      newCallsign.px = null;
      newCallsign.pota = null;
      newCallsign.zone = null;
      newCallsign.vucc_grids = [];
      newCallsign.propMode = "";
      newCallsign.digital = true;
      newCallsign.phone = false;
      newCallsign.IOTA = "";
      newCallsign.satName = "";
      newCallsign.hash = hash;
      if (newCallsign.dxcc != -1)
      {
        newCallsign.px = getWpx(newCallsign.DEcall);
        if (newCallsign.px)
        {
          newCallsign.zone = Number(
            newCallsign.px.charAt(newCallsign.px.length - 1)
          );
        }

        newCallsign.cont = GT.dxccInfo[newCallsign.dxcc].continent;
        if (newCallsign.dxcc == 390 && newCallsign.zone == 1) { newCallsign.cont = "EU"; }
      }

      newCallsign.ituz = ituZoneFromCallsign(newCallsign.DEcall, newCallsign.dxcc);
      newCallsign.cqz = cqZoneFromCallsign(newCallsign.DEcall, newCallsign.dxcc);
      newCallsign.distance = 0;
      newCallsign.heading = 0;

      newCallsign.cnty = null;
      newCallsign.qual = false;

      getLookupCachedObject(msgDEcallsign, null, null, null, newCallsign);

      if (newCallsign.dxcc in GT.dxccCount) GT.dxccCount[newCallsign.dxcc]++;
      else GT.dxccCount[newCallsign.dxcc] = 1;

      newCallsign.alerted = false;
      newCallsign.shouldAlert = false;
      GT.liveCallsigns[hash] = newCallsign;
      callsign = newCallsign;
    }
    else
    {
      if (validQTH)
      {
        callsign.grid = theirQTH;
      }

      callsign.time = theTimeStamp;
      callsign.age = timeNowSec();

      callsign.RSTsent = newMessage.SR;
      callsign.delta = newMessage.DF;
      callsign.DXcall = msgDXcallsign.trim();
      callsign.msg = newMessage.Msg;
      callsign.dt = newMessage.DT.toFixed(2);
    }
    callsign.mode = newMessage.OM;
    callsign.band = newMessage.OB;
    callsign.instance = newMessage.instance;
    callsign.grid = callsign.grid.substr(0, 4);
    callsign.field = callsign.grid.substring(0, 2);
    callsign.CQ = CQ;
    callsign.RR73 = RR73;
    callsign.UTC = toColonHMS(parseInt(newMessage.TM / 1000));
    callsign.qrz = (msgDXcallsign == GT.appSettings.myCall);

    if (callsign.grid.length > 0 && isKnownCallsignDXCC(callsign.dxcc))
    {
      if (callsign.grid in GT.gridToState && GT.gridToState[callsign.grid].length == 1)
      {
        callsign.state = GT.gridToState[callsign.grid][0];
      }
    }

    if (GT.callsignLookups.ulsUseEnable == true && isKnownCallsignUSplus(callsign.dxcc) && (callsign.state == null || callsign.cnty == null))
    {
      lookupKnownCallsign(callsign);
    }

    if (callsign.state == null)
    {
      if (callsign.dxcc == 1 && GT.callsignLookups.cacUseEnable && callsign.DEcall in GT.cacCallsigns)
      {
        callsign.state = "CA-" + GT.cacCallsigns[callsign.DEcall];
      }
    }

    if (callsign.distance == 0 && callsign.grid.length > 0)
    {
      var LL = squareToCenter(callsign.grid);
      callsign.distance = MyCircle.distance(GT.myLat, GT.myLon, LL.a, LL.o, distanceUnit.value);
      callsign.heading = MyCircle.bearing(GT.myLat, GT.myLon, LL.a, LL.o);
    }

    if (GT.appSettings.potaEnabled == 1)
    {
      callsign.pota = null;
      if (callsign.DEcall in GT.pota.callSpots || callsign.DEcall in GT.pota.callSchedule)
      {
        var now = Date.now();
        if (callsign.DEcall in GT.pota.callSpots)
        {
          if (GT.pota.callSpots[callsign.DEcall] in GT.pota.parkSpots && GT.pota.parkSpots[GT.pota.callSpots[callsign.DEcall]][callsign.DEcall].expire > now)
          {
            callsign.pota = GT.pota.callSpots[callsign.DEcall];
          }
        }
        else if (callsign.DEcall in GT.pota.callSchedule)
        {
          for (var i in GT.pota.callSchedule[callsign.DEcall])
          {
            if (now < GT.pota.callSchedule[callsign.DEcall][i].end && now >= GT.pota.callSchedule[callsign.DEcall][i].start)
            {
              callsign.pota = GT.pota.callSchedule[callsign.DEcall][i].id;
              break;
            }
          }
        }
        if (callsign.pota)
        {
          potaSpotFromDecode(callsign);
        }
        else if (CQ == true && msgDXcallsign == "CQ POTA")
        {
          callsign.pota = "?-????";
        }
      }
      else if (CQ == true && msgDXcallsign == "CQ POTA")
      {
        callsign.pota = "?-????";
      }
    }

    if (newMessage.NW)
    {
      didCustomAlert = processAlertMessage(decodeWords, theMessage.substr(0, 30).trim(), callsign.band, callsign.mode);

      didAlert = checkClassicAlerts(CQ, callsign, newMessage, msgDXcallsign);

      insertMessageInRoster(newMessage, msgDEcallsign, msgDXcallsign, callsign, hash);

      if (GT.mapSettings.trafficDecode && (didAlert == true || didCustomAlert == true))
      {
        var traffic = htmlEntities(theMessage);
        if (didAlert == true)
        {
          traffic = "⚠️ " + traffic;
        }
        if (didCustomAlert == true)
        {
          traffic = traffic + " 🚩";
        }

        GT.lastTraffic.unshift(traffic);
        GT.lastTraffic.unshift(userTimeString(null));
        GT.lastTraffic.unshift("<hr style='border-color:#333;margin-top:0px;margin-bottom:2px;width:80%'>");
        drawTraffic();
        lastMessageWasInfo = true;
      }

      if (GT.appSettings.gtSpotEnable == true && newMessage.OF > 0)
      {
        let freq = callsign.delta + newMessage.OF;
        if (callsign.DEcall in GT.gtCallsigns)
        {
          for (const cid in GT.gtCallsigns[callsign.DEcall])
          {
            if (cid in GT.gtFlagPins && GT.gtFlagPins[cid].o == 1)
            {
              GT.spotCollector[cid] = callsign.RSTsent;
              GT.spotDetailsCollector[cid] = [freq, callsign.mode];
            }
          }
        }
        freq = freq - (freq % k_frequencyBucket);
        GT.decodeCollector[freq] ??= 0;
        GT.decodeCollector[freq]++;
      }
    }

    if (callsign.dxcc != -1) countryName = GT.dxccToAltName[callsign.dxcc];
    if (canPath == true)
    {
      if (callsign.DXcall.indexOf("CQ") < 0 && GT.appSettings.gridViewMode != 2)
      {
        // Nothing special, we know the callers grid
        if (callsign.grid != "")
        {
          // Our msgDEcallsign is not sending a CQ.
          // Let's see if we can locate who he's talking to in our known list
          var DEcallsign = null;
          if (callsign.DXcall + newMessage.OB + newMessage.OM in GT.liveCallsigns)
          {
            DEcallsign = GT.liveCallsigns[callsign.DXcall + newMessage.OB + newMessage.OM];
          }
          else if (callsign.DXcall in GT.liveCallsigns)
          {
            DEcallsign = GT.liveCallsigns[callsign.DXcall];
          }

          if (DEcallsign != null && DEcallsign.grid != "")
          {
            var strokeColor = getPathColor();
            var strokeWeight = pathWidthValue.value;
            var flightPath = null;
            var isQRZ = false;
            if (msgDXcallsign == GT.appSettings.myCall)
            {
              strokeColor = getQrzPathColor();
              strokeWeight = qrzPathWidthValue.value;
              isQRZ = true;
            }

            if (strokeWeight != 0)
            {
              var fromPoint = getPoint(callsign.grid);
              var toPoint = getPoint(DEcallsign.grid);

              try
              {
                flightPath = flightFeature(
                  [fromPoint, toPoint],
                  {
                    weight: strokeWeight,
                    color: strokeColor,
                    steps: 75,
                    zIndex: 90
                  },
                  "flight",
                  true
                );

                flightPath.age = GT.timeNow + GT.flightDuration;
                flightPath.isShapeFlight = 0;
                flightPath.isQRZ = isQRZ;

                GT.flightPaths.push(flightPath);
              }
              catch (err)
              {
                console.error("Unexpected error inside handleWsjtxDecode 1", err)
              }
            }
          }
        }
        else if (GT.mapSettings.qrzDxccFallback && msgDXcallsign == GT.appSettings.myCall && callsign.dxcc > 0)
        {
          // the caller is calling us, but they don't have a grid, so lookup the DXCC and show it
          var strokeColor = getQrzPathColor();
          var strokeWeight = qrzPathWidthValue.value;
          var flightPath = null;
          var isQRZ = true;
          var DEcallsign = GT.liveCallsigns[GT.appSettings.myCall];

          if (strokeWeight != 0)
          {
            var toPoint = getPoint(DEcallsign.grid);

            var Lat = GT.dxccInfo[callsign.dxcc].lat;
            var Lon = GT.dxccInfo[callsign.dxcc].lon;
            var fromPoint = ol.proj.fromLonLat([Lon, Lat]);

            try
            {
              flightPath = flightFeature(
                [fromPoint, toPoint],
                {
                  weight: strokeWeight,
                  color: strokeColor,
                  steps: 75,
                  zIndex: 90
                },
                "flight",
                true
              );

              flightPath.age = GT.timeNow + GT.flightDuration;
              flightPath.isShapeFlight = 0;
              flightPath.isQRZ = isQRZ;

              GT.flightPaths.push(flightPath);
            }
            catch (err)
            {
              console.error("Unexpected error inside handleWsjtxDecode 2", err)
            }

            var feature = shapeFeature(
              "qrz",
              GT.dxccInfo[callsign.dxcc].geo,
              "qrz",
              "#FFFF0010",
              "#FF0000FF",
              1.0
            );
            feature.age = GT.timeNow + GT.flightDuration;
            feature.isShapeFlight = 1;
            feature.isQRZ = isQRZ;
            GT.layerSources.flight.addFeature(feature);
            GT.flightPaths.push(feature);
          }
        }
      }
      else if (GT.mapSettings.CQhilite && msgDXcallsign.indexOf("CQ ") == 0 && callsign.grid != "" && GT.appSettings.gridViewMode != 2 && pathWidthValue.value != 0)
      {
        var CCd = msgDXcallsign.replace("CQ ", "").split(" ")[0];
        if (CCd.length < 5 && !(CCd in GT.pathIgnore))
        {
          var locality = null;
          // Direct lookup US states, Continents, possibly
          if (CCd in GT.replaceCQ) CCd = GT.replaceCQ[CCd];

          if (CCd.length == 2 && CCd in GT.shapeData)
          {
            locality = GT.shapeData[CCd];
          }
          else if (CCd.length == 3)
          {
            // maybe it's DEL, or WYO. check the first two letters
            if (CCd.substr(0, 2) in GT.shapeData) { locality = GT.shapeData[CCd.substr(0, 2)]; }
          }

          if (locality == null)
          {
            // Check the prefix for dxcc direct
            if (CCd in GT.prefixToMap)
            {
              locality = GT.dxccInfo[GT.prefixToMap[CCd]].geo;
              if (locality == "deleted")
              {
                locality = null;
              }
            }
          }

          if (locality != null)
          {
            var strokeColor = getPathColor();
            var strokeWeight = pathWidthValue.value;
            var flightPath = null;

            var feature = shapeFeature(
              CCd,
              locality,
              CCd,
              "#00000000",
              "#FF0000C0",
              strokeWeight
            );

            feature.age = GT.timeNow + GT.flightDuration;
            feature.isShapeFlight = 1;
            feature.isQRZ = false;
            GT.layerSources.flight.addFeature(feature);
            GT.flightPaths.push(feature);

            var fromPoint = getPoint(callsign.grid);
            var toPoint = ol.proj.fromLonLat(locality.properties.center);

            try
            {
              flightPath = flightFeature(
                [fromPoint, toPoint],
                {
                  weight: strokeWeight,
                  color: strokeColor,
                  steps: 75,
                  zIndex: 90
                },
                "flight",
                true
              );

              flightPath.age = GT.timeNow + GT.flightDuration;
              flightPath.isShapeFlight = 0;
              flightPath.isQRZ = false;
              GT.flightPaths.push(flightPath);
            }
            catch (err)
            {
              console.error("Unexpected error inside handleWsjtxDecode 3", err)
            }
          }
        }
      }
    }
  }

  var bgColor = "black";
  if (newMessage.LC > 0) bgColor = "#880000";

  GT.lastMessages.unshift(
    "<tr style='background-color:" +
    bgColor +
    "'><td style='color:lightblue'>" +
    userTimeString(theTimeStamp * 1000) +
    "</td><td style='color:orange'>" +
    newMessage.SR +
    "</td><td style='color:gray'>" +
    newMessage.DT.toFixed(1) +
    "</td><td style='color:lightgreen'>" +
    newF +
    "</td><td>" +
    newMessage.MO +
    "</td><td style='color:" +
    (CQ ? "cyan" : "white") +
    "'>" +
    htmlEntities(theMessage) +
    "</td><td style='color:yellow'>" +
    countryName +
    "</td></tr>"
  );

  while (GT.lastMessages.length > 100) GT.lastMessages.pop();
}

function addLastTraffic(traffic)
{
  GT.lastTraffic.unshift(traffic);
  GT.lastTraffic.unshift(
    "<hr style='border-color:#333;margin-top:0px;margin-bottom:2px;width:80%'>"
  );
  drawTraffic();
}

function htmlEntities(str)
{
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shapeFeature(
  key,
  geoJsonData,
  propname,
  fillColor,
  borderColor,
  borderWidth
)
{
  var feature = new ol.format.GeoJSON({
    geometryName: key
  }).readFeature(geoJsonData, {
    featureProjection: GT.mapSettings.projection
  });

  var style = new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: borderColor,
      width: borderWidth
    }),
    fill: new ol.style.Fill({
      color: fillColor
    })
  });

  feature.setStyle(style);
  feature.set("prop", propname);
  feature.size = 2;
  return feature;
}

function handleWsjtxClear(newMessage)
{
  for (var hash in GT.liveCallsigns)
  {
    if (GT.liveCallsigns[hash].instance == newMessage.instance || GT.liveCallsigns[hash].mode == GT.instances[newMessage.instance].status.MO)
    {
      delete GT.liveCallsigns[hash];
    }
  }
  for (var call in GT.callRoster)
  {
    if (GT.callRoster[call].callObj.instance == newMessage.instance) { delete GT.callRoster[call]; }
  }

  redrawGrids();
  redrawPins();

  updateCountStats();
  goProcessRoster();
}

function goProcessRoster()
{
  var now = timeNowSec();
  for (const call in GT.callRoster)
  {
    if (now - GT.callRoster[call].callObj.age > 300)
    {
      GT.callRoster[call].callObj.alerted = false;
      GT.callRoster[call].callObj.shouldAlert = false;
      delete GT.callRoster[call];
      continue;
    }
  }
  if (GT.rosterInitialized)
  {
    try
    {
      GT.callRosterWindowHandle.window.processRoster(GT.callRoster);
    }
    catch (e)
    {
      console.log("Call Roster exception");
      console.log(e.message);
    }
  }
}

function handleClosed(newMessage)
{
  if (GT.activeInstance == newMessage.Id && GT.instances[newMessage.Id].open == false)
  {
    txrxdec.style.backgroundColor = "Purple";
    txrxdec.style.borderColor = "Purple";
    var name = newMessage.Id.toUpperCase().split(" - ");
    var txt = name[name.length - 1];
    txrxdec.innerHTML = txt + " Closed";
  }
}

function handleWsjtxClose(newMessage)
{
  updateCountStats();
  GT.instances[newMessage.Id].open = false;
  handleClosed(newMessage);
  updateRosterInstances();
}

function handleWsjtxWSPR(newMessage)
{
  if (GT.ignoreMessages == 1) return;
  let callsign = newMessage.Callsign.replace("<", "").replace(">", "").trim();

  addLiveCallsign(
    newMessage.Grid,
    callsign,
    "-",
    Number(newMessage.SR),
    timeNowSec(),
    "Pwr:" + newMessage.Power + " Freq:" + formatMhz(Number(newMessage.Frequency / 1000), 3, 3) + " Delta:" + Number(newMessage.DT).toFixed(2) + " Drift:" +
    newMessage.Drift,
    "WSPR",
    formatBand(Number(newMessage.Frequency / 1000000)),
    false,
    false,
    null,
    callsignToDxcc(callsign),
    null,
    null,
    null,
    "",
    ""
  );

  processAlertMessage(callsign + " " + newMessage.Grid);

  updateCountStats();
}

function centerOn(grid)
{
  if (grid.length >= 4)
  {
    var LL = squareToLatLong(grid);
    GT.map
      .getView()
      .setCenter(
        ol.proj.fromLonLat([
          LL.lo2 - (LL.lo2 - LL.lo1) / 2,
          LL.la2 - (LL.la2 - LL.la1) / 2
        ], GT.mapSettings.projection)
      );
  }
}

function setCenterQTH()
{
  if (GT.appSettings.myGrid.length >= 4)
  {
    // Grab home QTH Gridsquare from Center QTH
    var LL = squareToLatLong(GT.appSettings.myGrid);

    GT.map
      .getView()
      .setCenter(
        ol.proj.fromLonLat([
          LL.lo2 - (LL.lo2 - LL.lo1) / 2,
          LL.la2 - (LL.la2 - LL.la1) / 2
        ], GT.mapSettings.projection)
      );
  }

}

function saveCenterGridsquare()
{
  let LL = squareToCenter(homeQTHInput.value);
  GT.mapSettings.latitude = GT.myLat = LL.a;
  GT.mapSettings.longitude = GT.myLon = LL.o;
  tryUpdateQTH(homeQTHInput.value);
  tryRecenterAEQD();
}

function tryUpdateQTH(grid)
{
  if (grid != GT.appSettings.myGrid)
  {
    let hash = GT.appSettings.myGrid;
    if (hash in GT.liveGrids)
    {
      GT.liveGrids[hash].rectangle.locked = false;
      delete GT.liveGrids[hash].rectangle.liveHash[hash];
      delete GT.liveCallsigns[hash];
    }

    homeQTHInput.value = GT.appSettings.myGrid = GT.appSettings.myRawGrid = grid;

    setHomeGridsquare();
    redrawGrids();
  }
}

function setCenterGridsquare()
{
  if (GT.mapMemory[6].zoom != -1)
  {
    mapMemory(6, false);
    return;
  }

  setCenterQTH();
}

function changeLookupMerge()
{
  GT.appSettings.lookupMerge = lookupMerge.checked;
  GT.appSettings.lookupMissingGrid = lookupMissingGrid.checked;
  lookupMissingGridDiv.style.display = GT.appSettings.lookupMerge ? "" : "none";
}

function changelookupOnTx()
{
  GT.appSettings.lookupOnTx = lookupOnTx.checked;
  GT.appSettings.lookupCloseLog = lookupCloseLog.checked;
}

function exportSettings()
{
  saveAllSettings();
  var filename = GT.appData + GT.dirSeperator + "gt_settings.json";
  var toWrite = JSON.stringify(GT.localStorage);
  fs.writeFileSync(filename, toWrite);

  checkForSettings();
}

function checkForSettings()
{
  var filename = GT.appData + GT.dirSeperator + "gt_settings.json";
  if (fs.existsSync(filename))
  {
    importSettingsButton.style.display = "";
    importSettingsFile.style.display = "";
    importSettingsFile.innerHTML = filename;
  }
  else
  {
    importSettingsButton.style.display = "none";
    importSettingsFile.style.display = "none";
  }
}

function importSettings()
{
  checkForSettings();

  var filename = GT.appData + GT.dirSeperator + "gt_settings.json";
  if (fs.existsSync(filename))
  {
    var data = require(filename);
    if (typeof data.appSettings != "undefined")
    {
      GT.localStorage = {};
      for (var key in data)
      {
        GT.localStorage[key] = data[key];
      }
      saveGridTrackerSettings();
      electron.ipcRenderer.sendSync("restartGridTracker2");
    }
    else
    {
      importSettingsFile.innerHTML = "<font style='color:red'>Settings File Corrupt!</font>";
    }
  }
}

function showCallsignBox(redraw)
{
  var worker = "<div style='vertical-align:top;display:inline-block;margin:2px;color:cyan;font-weight:bold'>" + I18N("gt.callsignBox.title") + "</div><br/>";

  GT.newCallsignCount = Object.keys(GT.liveCallsigns).length;
  if (GT.newCallsignCount > 0)
  {
    var newCallList = Array();

    worker +=
      "<div  style='display:inline-block;padding-right:8px;overflow:auto;overflow-x:hidden;height:" +
      Math.min(GT.newCallsignCount * 24 + 26, getStatsWindowHeight()) + "px;'>" +
        "<table class='darkTable' align=center>" +
        "<th align=left>" + I18N("gt.callsignBox.callsign") + "</th>" +
        "<th align=left>" + I18N("gt.callsignBox.Grid") + "</th>" +
        "<th>" + I18N("gt.callsignBox.DXCC") + "</th>" +
        "<th>" + I18N("gt.callsignBox.CQ") + "</th>" +
        "<th>" + I18N("gt.callsignBox.ITU") + "</th>" +
        "<th>" + I18N("gt.callsignBox.Flag") + "</th>" +
        "<th align=left>" + I18N("gt.callsignBox.QSO") + "</th>" +
        "<th>" + I18N("gt.callsignBox.QSL") + "</th>" +
        "<th>" + I18N("gt.callsignBox.When") + "</th>"; // <th>ITUz</th><th>CQz</th><th>ISO</th>";
    if (GT.callsignLookups.lotwUseEnable == true) worker += "<th>" + I18N("gt.callsignBox.LoTW") + "</th>";
    if (GT.callsignLookups.eqslUseEnable == true) worker += "<th>" + I18N("gt.callsignBox.eQSL") + "</th>";
    if (GT.callsignLookups.oqrsUseEnable == true) worker += "<th>" + I18N("gt.callsignBox.OQRS") + "</th>";
    for (var x in GT.liveCallsigns)
    {
      if (GT.liveCallsigns[x].dxcc != -1)
      {
        newCallList.push(GT.liveCallsigns[x]);
      }
    }
    newCallList.sort(compareCallsignTime).reverse();
    for (var x in newCallList)
    {
      if (newCallList[x].DEcall == GT.appSettings.myRawCall) continue;
      var grid = newCallList[x].grid ? newCallList[x].grid : "-";
      var cqzone = newCallList[x].cqz ? newCallList[x].cqz : "-";
      var ituzone = newCallList[x].ituz ? newCallList[x].ituz : "-";
      var geo = GT.dxccInfo[newCallList[x].dxcc];
      var thisCall = formatCallsign(newCallList[x].DEcall);
      worker +=
        "<tr><td align=left style='color:#ff0;cursor:pointer'  onClick='window.opener.startLookup(\"" +
        newCallList[x].DEcall +
        "\",\"" +
        grid +
        "\");'>" +
        thisCall +
        "</td><td align=left style='color:cyan;' >" +
        grid +
        "</td><td  style='color:orange;'>" +
        geo.name +
        "<font style='color:lightgreen;'> (" +
        geo.pp +
        ")<font></td>";
      worker += "<td>" + cqzone + "</td><td>" + ituzone + "</td>";
      worker +=
        "<td align='center' style='margin:0;padding:0'><img style='padding-top:4px' src='img/flags/16/" +
        geo.flag +
        "'></td>";
      worker +=
        "<td>" +
        (thisCall in GT.tracker.worked.call ? "&#10004;" : "") +
        "</td><td>" +
        (thisCall in GT.tracker.confirmed.call ? "&#10004;" : "") +
        "</td>";
      var ageString = "";
      if (timeNowSec() - newCallList[x].time < 3601) { ageString = toDHMS(timeNowSec() - newCallList[x].time); }
      else
      {
        ageString = userTimeString(newCallList[x].time * 1000);
      }
      worker += "<td>" + ageString + "</td>";
      if (GT.callsignLookups.lotwUseEnable == true)
      {
        worker +=
          "<td align='center'>" +
          (thisCall in GT.lotwCallsigns ? "&#10004;" : "") +
          "</td>";
      }
      if (GT.callsignLookups.eqslUseEnable == true)
      {
        worker +=
          "<td align='center'>" +
          (thisCall in GT.eqslCallsigns ? "&#10004;" : "") +
          "</td>";
      }
      if (GT.callsignLookups.oqrsUseEnable == true)
      {
        worker +=
          "<td align='center'>" +
          (thisCall in GT.oqrsCallsigns ? "&#10004;" : "") +
          "</td>";
      }
      worker += "</tr>";
    }
    worker += "</table></div>";
  }

  var heard = 0;
  var List = {};
  if (Object.keys(GT.dxccCount).length > 0)
  {
    for (var key in GT.dxccCount)
    {
      if (key != -1)
      {
        var item = {};
        item.total = GT.dxccCount[key];
        item.confirmed = GT.dxccInfo[key].confirmed;
        item.worked = GT.dxccInfo[key].worked;
        item.dxcc = key;
        item.flag = GT.dxccInfo[key].flag;
        List[GT.dxccToAltName[key]] = item;
        heard++;
      }
    }
    worker +=
      "<div  style='vertical-align:top;display:inline-block;margin-right:2px;overflow:auto;overflow-x:hidden;height:" +
      Math.min(
        Object.keys(GT.dxccCount).length * 23 + 45,
        getStatsWindowHeight()
      ) +
      "px;'>" +
        "<table class='darkTable' align=center>" +
        "<tr><th colspan=4 style='font-weight:bold'>DXCC (" + heard + ")</th>" +
        "<tr>" +
        "<th align=left>" + I18N("gt.callsignBox.Name") + "</th>" +
        "<th>" + I18N("gt.callsignBox.Flag") + "</th>" +
        "<th align=left>" + I18N("gt.callsignBox.Calls") + "</th>" +
        "</tr>";
    Object.keys(List)
      .sort()
      .forEach(function (key, i)
      {
        worker += "<tr><td align=left style='color:#ff0;' >" + key + "</td>";
        worker +=
          "<td align='center' style='margin:0;padding:0'><img style='padding-top:3px' src='img/flags/16/" +
          List[key].flag +
          "'></td>";
        worker +=
          "<td align=left style='color:lightblue;' >" +
          List[key].total +
          "</td>";
        worker += "</tr>";
      });
    worker += "</table></div>";
  }
  worker += "</div>";
  setStatsDiv("callsignListDiv", worker);
}

function setStatsDiv(div, worker)
{
  if (GT.statsWindowInitialized)
  {
    GT.statsWindowHandle.window[div].innerHTML = worker;
  }
}

function setStatsDivHeight(div, heightWithPx)
{
  if (GT.statsWindowInitialized)
  {
    GT.statsWindowHandle.window[div].style.height = heightWithPx;
  }
}
function getStatsWindowHeight()
{
  if (GT.statsWindowInitialized)
  {
    return GT.statsWindowHandle.window.window.innerHeight - 63;
  }
  return 300;
}

function setLookupDiv(div, worker)
{
  if (GT.lookupWindowInitialized && typeof GT.lookupWindowHandle.window[div].innerHTML !== "undefined")
  {
    GT.lookupWindowHandle.window[div].innerHTML = worker;
  }
}

function setLookupDivHeight(div, heightWithPx)
{
  if (GT.lookupWindowInitialized && typeof GT.lookupWindowHandle.window[div].style !== "undefined")
  {
    GT.lookupWindowHandle.window[div].style.height = heightWithPx;
  }
}
function getLookupWindowHeight()
{
  if (GT.lookupWindowInitialized && typeof GT.lookupWindowHandle.window.window !== "undefined")
  {
    return GT.lookupWindowHandle.window.window.innerHeight;
  }
  return 300;
}

function showConditionsBox()
{
  if (GT.mapSettings.offlineMode == false)
  {
    toggleConditionsBox();
  }
}

function myCallCompare(a, b)
{
  return a.DEcall.localeCompare(b.DEcall);
}

function myGridCompare(a, b)
{
  return a.grid.localeCompare(b.grid);
}

function myModeCompare(a, b)
{
  return a.mode.localeCompare(b.mode);
}

function myDxccCompare(a, b)
{
  return GT.dxccToAltName[a.dxcc].localeCompare(GT.dxccToAltName[b.dxcc]);
}

function myDxccIntCompare(a, b)
{
  if (!(a in GT.dxccToAltName)) return 0;
  if (!(b in GT.dxccToAltName)) { return GT.dxccToAltName[a].localeCompare(GT.dxccToAltName[b]); }
}

function myTimeCompare(a, b)
{
  if (a.time > b.time) return 1;
  if (a.time < b.time) return -1;
  return 0;
}

function myBandCompare(a, b)
{
  return a.band.localeCompare(b.band);
}

function myConfirmedCompare(a, b)
{
  if (a.confirmed && !b.confirmed) return 1;
  if (!a.confirmed && b.confirmed) return -1;
  return 0;
}

GT.sortFunction = [
  myCallCompare,
  myGridCompare,
  myModeCompare,
  myDxccCompare,
  myTimeCompare,
  myBandCompare,
  myConfirmedCompare
];

GT.lastSortIndex = 4;

GT.qsoPages = 1;
GT.qsoPage = 0;
GT.lastSortType = 0;
GT.searchWB = "";
GT.gridSearch = "";
GT.filterBand = "Mixed";
GT.filterMode = "Mixed";
GT.filterDxcc = 0;
GT.filterQSL = "All";

GT.lastSearchSelection = null;

function resetSearch()
{
  GT.lastSortIndex = 4;
  GT.qsoPages = 1;
  GT.qsoPage = 0;
  GT.lastSortType = 2;
  GT.searchWB = "";
  GT.gridSearch = "";

  GT.filterBand = "Mixed";
  GT.filterMode = "Mixed";
  GT.filterDxcc = 0;
  GT.filterQSL = "All";

  GT.lastSearchSelection = null;
}

function showWorkedByCall(callsign, event)
{
  event.preventDefault();

  resetSearch();
  GT.searchWB = callsign;
  if (event.shiftKey == true) GT.filterQSL = "true";
  openInfoTab("qsobox", "workedBoxDiv", showWorkedBox);
}

function showWorkedSearchChanged(object, index)
{
  ValidateCallsign(object, null);
  GT.searchWB = object.value.toUpperCase();
  GT.lastSearchSelection = object.id;
  showWorkedBox(index, 0);
}

function showWorkedSearchGrid(object, index)
{
  ValidateCallsign(object, null);
  GT.gridSearch = object.value.toUpperCase();
  GT.lastSearchSelection = object.id;
  showWorkedBox(index, 0);
}

function filterBandFunction(event, index)
{
  GT.filterBand = this.value;
  GT.lastSearchSelection = this.id;
  showWorkedBox(index, 0);
}

function filterModeFunction(event, index)
{
  GT.filterMode = this.value;
  GT.lastSearchSelection = this.id;
  showWorkedBox(index, 0);
}

function filterDxccFunction(event, index)
{
  GT.filterDxcc = this.value;
  GT.lastSearchSelection = this.id;
  showWorkedBox(index, 0);
}

function filterQSLFunction(event, index)
{
  GT.filterQSL = this.value;
  GT.lastSearchSelection = this.id;
  showWorkedBox(index, 0);
}

function showWorkedBox(sortIndex, nextPage, redraw)
{
  try
  {
    var myObjects = null;
    var mySort = sortIndex;
    var bands = {};
    var modes = {};
    var dxccs = {};
    var confSrcs = {};
    var ObjectCount = 0;

    myObjects = GT.QSOhash;

    if (sortIndex == null || typeof sortIndex == "undefined")
    {
      mySort = 4;
      GT.lastSortIndex = 4;
      GT.lastSortType = 2;
    }

    var list = Object.values(myObjects);

    if (GT.searchWB.length > 0)
    {
      let regExTest = new RegExp(GT.searchWB, "gi")
      list = list.filter(function (value)
      {
        return value.DEcall.match(regExTest);
      });
    }

    if (GT.gridSearch.length > 0)
    {
      list = list.filter(function (value)
      {
        var x = value.grid.indexOf(GT.gridSearch);
        var y = value.vucc_grids.indexOf(GT.gridSearch);
        return x == 0 || y == 0;
      });
    }

    for (var key in list)
    {
      bands[list[key].band] = list[key].band;
      modes[list[key].mode] = list[key].mode;

      var pp = list[key].dxcc in GT.dxccInfo ? GT.dxccInfo[list[key].dxcc].pp : "?";

      dxccs[GT.dxccToAltName[list[key].dxcc] + " (" + pp + ")"] = list[key].dxcc;
      if (list[key].confirmed)
      {
        confSrcs = Object.assign(confSrcs, list[key].confSrcs);
      }
    }

    if (GT.filterBand != "Mixed")
    {
      list = list.filter(function (value)
      {
        return value.band == GT.filterBand;
      });
    }

    if (GT.filterMode != "Mixed")
    {
      list = list.filter(function (value)
      {
        if (
          GT.filterMode == "Phone" &&
          value.mode in GT.modes_phone &&
          GT.modes_phone[value.mode]
        ) { return true; }
        if (
          GT.filterMode == "Digital" &&
          value.mode in GT.modes &&
          GT.modes[value.mode]
        ) { return true; }
        return value.mode == GT.filterMode;
      });
    }

    if (GT.filterDxcc != 0)
    {
      list = list.filter(function (value)
      {
        return value.dxcc == GT.filterDxcc;
      });
    }

    if (GT.filterQSL != "All")
    {
      list = list.filter(function (value)
      {
        if (GT.filterQSL == "false" || GT.filterQSL == "true")
        {
          return value.confirmed == (GT.filterQSL == "true");
        }
        else
        {
          if (value.confirmed && GT.filterQSL in value.confSrcs)
          {
            return true;
          }
          return false;
        }
      });
    }

    if (typeof redraw == "undefined")
    {
      if (typeof nextPage == "undefined")
      {
        nextPage = 0;
        if (GT.lastSortIndex != mySort)
        {
          list = list.sort(GT.sortFunction[mySort]);
          GT.lastSortIndex = mySort;
          GT.lastSortType = 1;
          GT.qsoPage = 0;
        }
        else
        {
          list = list.sort(GT.sortFunction[mySort]).reverse();
          GT.lastSortIndex = -1;
          GT.lastSortType = 2;
          GT.qsoPage = 0;
        }
      }
      else
      {
        if (GT.lastSortType == 1)
        {
          list = list.sort(GT.sortFunction[mySort]);
        }
        else
        {
          list = list.sort(GT.sortFunction[mySort]).reverse();
        }
      }
    }
    else
    {
      mySort = GT.lastSortIndex;
      if (mySort == -1) mySort = 4;

      if (GT.lastSortType == 1)
      {
        list = list.sort(GT.sortFunction[mySort]);
      }
      else
      {
        list = list.sort(GT.sortFunction[mySort]).reverse();
      }
    }

    ObjectCount = list.length;

    GT.qsoPages = parseInt(ObjectCount / GT.appSettings.qsoItemsPerPage) + 1;

    GT.qsoPage += nextPage;
    GT.qsoPage %= GT.qsoPages;
    if (GT.qsoPage < 0) GT.qsoPage = GT.qsoPages - 1;

    var startIndex = GT.qsoPage * GT.appSettings.qsoItemsPerPage;
    var endIndex = startIndex + GT.appSettings.qsoItemsPerPage;
    if (endIndex > ObjectCount) endIndex = ObjectCount;

    var workHead = "<b> Entries (" + ObjectCount + ")</b>";

    if (GT.qsoPages > 1)
    {
      workHead += "<br/><font  style='font-size:15px;' color='cyan' onClick='window.opener.showWorkedBox(" + mySort + ", -1);'>&#8678;&nbsp;</font>";
      workHead += " Page " + (GT.qsoPage + 1) + " of " + GT.qsoPages + " (" + (endIndex - startIndex) + ") ";
      workHead += "<font  style='font-size:16px;' color='cyan' onClick='window.opener.showWorkedBox(" + mySort + ", 1);'>&nbsp;&#8680;</font>";
    }
    setStatsDiv("workedHeadDiv", workHead);

    if (myObjects != null)
    {
      var worker = "";
      worker += "<table  id='logTable' style='white-space:nowrap;overflow:auto;overflow-x;hidden;' class='darkTable' align=center>";
      worker += "<tr><th><input type='text' id='searchWB' style='margin:0px' class='inputTextValue' value='" + GT.searchWB + "' size='8' oninput='window.opener.showWorkedSearchChanged(this);' / >";
      if (GT.searchWB.length > 0)
      {
        worker += "<img title='Clear Callsign' onclick='searchWB.value=\"\";window.opener.showWorkedSearchChanged(searchWB);' src='img/trash_24x48.png' style='width: 30px; margin:0px; padding:0px; margin-bottom: -4px; cursor: pointer;'/>";
      }
      worker += "</th>";
      worker += "<th><input type='text' id='searchGrid' style='margin:0px' class='inputTextValue' value='" + GT.gridSearch + "' size='6' oninput='window.opener.showWorkedSearchGrid(this);' / >";
      if (GT.gridSearch.length > 0)
      {
        worker += "<img title='Clear Grid' onclick='searchGrid.value=\"\";window.opener.showWorkedSearchGrid(searchGrid);' src='img/trash_24x48.png' style='width: 30px; margin:0px; padding:0px; margin-bottom: -4px; cursor: pointer;'/>";
      }
      worker += "</th>";
      worker += "<th><div id='bandFilterDiv'></div></th>";
      worker += "<th><div id='modeFilterDiv'></div></th>";
      worker += "<th><div id='qslFilterDiv'></div></th>";
      worker += "<th></th>";
      worker += "<th></th>";
      if (GT.filterDxcc != 0)
      {
        worker += "<th style='border-right:none;'><div id='dxccFilterDiv'></div></th>";
        worker += "<th style='border-left:none;'><img title='Show All' onclick='window.opener.GT.filterDxcc = 0; window.opener.showWorkedBox();' src='img/trash_24x48.png' style='width: 30px; margin:0px; padding:0px; margin-bottom: -4px; cursor: pointer'/></th>";
      }
      else
      {
        worker += "<th colspan=2><div id='dxccFilterDiv'></div><th>";
      }

      worker += "</tr> ";
      worker += "<tr><th style='cursor:pointer;' align=center onclick='window.opener.showWorkedBox(0);'>" + I18N("gt.qsoPage.Station") + "</th>";
      worker += "<th style='cursor:pointer;' align=center onclick='window.opener.showWorkedBox(1);'>" + I18N("gt.qsoPage.Grid") + "</th>";
      worker += "<th style='cursor:pointer;' align=center onclick='window.opener.showWorkedBox(5);'>" + I18N("gt.qsoPage.Band") + "</th>";
      worker += "<th style='cursor:pointer;' align=center onclick='window.opener.showWorkedBox(2);'>" + I18N("gt.qsoPage.Mode") + "</th>";
      worker += "<th style='cursor:pointer;' align=center onclick='window.opener.showWorkedBox(6);'>" + I18N("gt.qsoPage.QSL") + "</th>";
      worker += "<th align=center>" + I18N("gt.qsoPage.Sent") + "</th>";
      worker += "<th align=center>" + I18N("gt.qsoPage.Rcvd") + "</th>";
      worker += "<th style='cursor:pointer;' align=center onclick='window.opener.showWorkedBox(3);'>" + I18N("gt.qsoPage.DXCC") + "</th>";
      worker += "<th style='cursor:pointer;' align=center onclick='window.opener.showWorkedBox(3);'>" + I18N("gt.qsoPage.Flag") + "</th>";
      worker += "<th align=center>" + I18N("roster.secondary.wanted.state") + "</th>";
      worker += "<th style='cursor:pointer;' align=center onclick='window.opener.showWorkedBox(4);'>" + I18N("gt.qsoPage.When") + "</th>";

      if (GT.callsignLookups.lotwUseEnable == true) worker += "<th>" + I18N("gt.qsoPage.LoTW") + "</th>";
      if (GT.callsignLookups.eqslUseEnable == true) worker += "<th>" + I18N("gt.qsoPage.eQSL") + "</th>";
      if (GT.callsignLookups.oqrsUseEnable == true) worker += "<th>" + I18N("gt.qsoPage.OQRS") + "</th>";
      worker += "</tr>";

      for (var i = startIndex; i < endIndex; i++)
      {
        let confTitle = "";
        let confTd = "";
        let key = list[i];
        if (key.confirmed)
        {
          let srcs = {};
          Object.keys(key.confSrcs).forEach(src => { srcs[GT.confSrcNames[src]] = true; });
          confTd = Object.keys(key.confSrcs).join("");
          confTitle = "title='" + Object.keys(srcs).join(", ") + "'";
        }
        worker += "<tr align=left><td style='color:#ff0;cursor:pointer' onclick='window.opener.startLookup(\"" + key.DEcall + "\",\"" + key.grid + "\");' >" + formatCallsign(key.DEcall) + "</td>";
        worker += "<td style='color:cyan;'>" + key.grid + (key.vucc_grids.length ? ", " + key.vucc_grids.join(", ") : "") + "</td>";
        worker += "<td style='color:lightgreen'>" + key.band + "</td>";
        worker += "<td style='color:lightblue'>" + key.mode + "</td>";
        worker += "<td align=left " + confTitle + ">" + confTd + "</td>";
        worker += "<td>" + key.RSTsent + "</td>";
        worker += "<td>" + key.RSTrecv + "</td>";
        worker += "<td style='color:orange'>" + GT.dxccToAltName[key.dxcc] + " <font color='lightgreen'>(" + (key.dxcc in GT.dxccInfo ? GT.dxccInfo[key.dxcc].pp : "?") + ")</font></td>";
        worker += "<td align=center style='margin:0;padding:0' ><img style='padding-top:4px' src='img/flags/16/" + (key.dxcc in GT.dxccInfo ? GT.dxccInfo[key.dxcc].flag : "_United Nations.png") + "'></td>";
        if (key.state)
        {
          let title = (key.state in GT.StateData) ? "title='" + GT.StateData[key.state].name + "'" : "";
          worker += "<td align=center style='color:lightgreen' " + title + ">" + key.state.substr(3) + "</td>";
        }
        else
        {
          worker += "<td></td>";
        }
        worker += "<td style='color:lightblue'>" + userTimeString(key.time * 1000) + "</td>";
        if (GT.callsignLookups.lotwUseEnable == true)
        {
          worker += "<td align=center>" + (key.DEcall in GT.lotwCallsigns ? "&#10004;" : "") + "</td>";
        }
        if (GT.callsignLookups.eqslUseEnable == true)
        {
          worker += "<td align=center>" + (key.DEcall in GT.eqslCallsigns ? "&#10004;" : "") + "</td>";
        }
        if (GT.callsignLookups.oqrsUseEnable == true)
        {
          if (key.DEcall in GT.oqrsCallsigns)
          {
            if (key.confirmed == false)
            {
              worker +=
                "<td style='cursor:pointer;' align='left' " +
                "onClick='window.opener.openSite(\"https://clublog.org/logsearch/logsearch.php?log=" +
                key.DEcall + "&call=" + key.DXcall + "&SubmitLogSearch=Show+contacts\");'>" +
                "&#10004; &#128236;</td>";
            }
            else
            {
              worker += "<td>&#10004;</td>";
            }
          }
          else
          {
            worker += "<td></td>";
          }
        }
        worker += "</tr>";
      }

      worker += "</table>";

      setStatsDiv("workedListDiv", worker);

      statsValidateCallByElement("searchWB");
      statsValidateCallByElement("searchGrid");

      var newSelect = document.createElement("select");
      newSelect.id = "bandFilter";
      newSelect.title = "Band Filter";
      var option = document.createElement("option");
      option.value = "Mixed";
      option.text = "Mixed";
      newSelect.appendChild(option);
      Object.keys(bands)
        .sort(function (a, b)
        {
          return parseInt(a) - parseInt(b);
        })
        .forEach(function (key)
        {
          var option = document.createElement("option");
          option.value = key;
          option.text = key;
          newSelect.appendChild(option);
        });
      statsAppendChild(
        "bandFilterDiv",
        newSelect,
        "filterBandFunction",
        GT.filterBand,
        true
      );

      newSelect = document.createElement("select");
      newSelect.id = "modeFilter";
      newSelect.title = "Mode Filter";
      option = document.createElement("option");
      option.value = "Mixed";
      option.text = "Mixed";
      newSelect.appendChild(option);

      option = document.createElement("option");
      option.value = "Phone";
      option.text = "Phone";
      newSelect.appendChild(option);

      option = document.createElement("option");
      option.value = "Digital";
      option.text = "Digital";
      newSelect.appendChild(option);

      Object.keys(modes)
        .sort()
        .forEach(function (key)
        {
          var option = document.createElement("option");
          option.value = key;
          option.text = key;
          newSelect.appendChild(option);
        });

      statsAppendChild(
        "modeFilterDiv",
        newSelect,
        "filterModeFunction",
        GT.filterMode,
        true
      );

      newSelect = document.createElement("select");
      newSelect.id = "dxccFilter";
      newSelect.title = "DXCC Filter";
      option = document.createElement("option");
      option.value = 0;
      option.text = "All";
      newSelect.appendChild(option);

      Object.keys(dxccs)
        .sort()
        .forEach(function (key)
        {
          var option = document.createElement("option");
          option.value = dxccs[key];
          option.text = key;
          newSelect.appendChild(option);
        });

      statsAppendChild(
        "dxccFilterDiv",
        newSelect,
        "filterDxccFunction",
        GT.filterDxcc,
        true
      );

      newSelect = document.createElement("select");
      newSelect.id = "qslFilter";
      newSelect.title = "QSL Filter";
      option = document.createElement("option");
      option.value = "All";
      option.text = "All";
      newSelect.appendChild(option);

      option = document.createElement("option");
      option.value = true;
      option.text = "Yes";
      newSelect.appendChild(option);

      option = document.createElement("option");
      option.value = false;
      option.text = "No";
      newSelect.appendChild(option);

      Object.keys(confSrcs)
        .forEach(function (key)
        {
          var option = document.createElement("option");
          option.value = key
          option.text = GT.confSrcNames[key];
          newSelect.appendChild(option);
        });

      statsAppendChild(
        "qslFilterDiv",
        newSelect,
        "filterQSLFunction",
        GT.filterQSL,
        true
      );

      statsFocus(GT.lastSearchSelection);

      setStatsDivHeight("workedListDiv", getStatsWindowHeight() - 6 + "px");
    }
    else setStatsDiv("workedListDiv", "None");

    myObjects = null;
  }
  catch (e)
  {
    console.error(e);
  }
}

function statsValidateCallByElement(elementString)
{
  if (GT.statsWindowInitialized)
  {
    GT.statsWindowHandle.window.validateCallByElement(elementString);
  }
}
function statsFocus(selection)
{
  if (GT.statsWindowInitialized)
  {
    GT.statsWindowHandle.window.statsFocus(selection);
  }
}

function lookupValidateCallByElement(elementString)
{
  if (GT.lookupWindowInitialized && typeof GT.lookupWindowHandle.window.validateCallByElement !== "undefined")
  {
    GT.lookupWindowHandle.window.validateCallByElement(elementString);
  }
}

function statsAppendChild(elementString, object, onInputString, defaultValue)
{
  if (GT.statsWindowInitialized)
  {
    GT.statsWindowHandle.window.appendToChild(
      elementString,
      object,
      onInputString,
      defaultValue
    );
  }
}

function searchWorked(dxcc, band, mode)
{
  resetSearch();
  GT.filterDxcc = dxcc;
  if (band.length > 0)
  {
    GT.filterBand = band;
  }
  if (mode.length > 0)
  {
    GT.filterMode = mode;
  }
  showWorkedBox(null, 0);
}

function getBandSlots()
{
  var worker = "";
  var bands = (GT.myDXCC in GT.callsignDatabaseUSplus) ? GT.us_bands : GT.non_us_bands;
  var bandslots = {};
  var total = 0;
  bandslots.Mixed = 0;
  bandslots.Phone = 0;
  bandslots.Digital = 0;
  for (const band in bands)
  {
    bandslots[bands[band]] = 0;
  }
  for (const key in GT.dxccInfo)
  {
    if (GT.dxccInfo[key].geo != "deleted")
    {
      if (key + "|" in GT.tracker.confirmed.dxcc)
      {
        bandslots.Mixed++;
        if (key + "|dg" in GT.tracker.confirmed.dxcc)
        {
          bandslots.Digital++;
        }
        if (key + "|ph" in GT.tracker.confirmed.dxcc)
        {
          bandslots.Phone++;
        }
        for (const band in bands)
        {
          if (key + "|" + bands[band] in GT.tracker.confirmed.dxcc)
          {
            bandslots[bands[band]]++;
          }
        }
      }
    }
  }
  worker += "<table class='darkTable' align=center>";
  worker += "<tr><th colspan=" + (bands.length + 4) + ">Confirmed Band Slots</th></tr>";
  worker += "<tr>";
  worker += "<th>Mixed</th>";
  worker += "<th>Phone</th>";
  worker += "<th>Digital</th>";
  for (const band in bands)
  {
    worker += "<th><font color=" + GT.pskColors[bands[band]] + ">" + bands[band] + "</font></th>";
  }
  worker += "<th>Total</th></tr><tr>";
  worker += "<td>" + bandslots.Mixed + "</td>";
  worker += "<td>" + bandslots.Phone + "</td>";
  worker += "<td>" + bandslots.Digital + "</td>";
  for (const band in bands)
  {
    total += bandslots[bands[band]];
    worker += "<td>" + bandslots[bands[band]] + "</td>";
  }
  worker += "<td>" + total + "</td></tr></table><br/>";

  return worker;
}

function showDXCCsBox()
{
  var worker = getBandSlots();
  var band = GT.appSettings.gtBandFilter == "auto" ? GT.appSettings.myBand : GT.appSettings.gtBandFilter.length == 0 ? "" : GT.appSettings.gtBandFilter;
  var mode = GT.appSettings.gtModeFilter == "auto" ? GT.appSettings.myMode : GT.appSettings.gtModeFilter.length == 0 ? "" : GT.appSettings.gtModeFilter;
  worker += getCurrentBandModeHTML();
  var confirmed = 0;
  var worked = 0;
  var needed = 0;
  var List = {};
  var ListConfirmed = {};
  var ListNotWorked = {};
  for (var key in GT.dxccInfo)
  {
    if (key != -1 && Number(GT.dxccInfo[key].dxcc) > 0)
    {
      if (GT.dxccInfo[key].worked == true)
      {
        var item = {};
        item.dxcc = GT.dxccInfo[key].dxcc;
        item.flag = GT.dxccInfo[key].flag;
        item.confirmed = GT.dxccInfo[key].confirmed;
        List[GT.dxccInfo[key].name] = item;
        worked++;
      }
      if (GT.dxccInfo[key].confirmed == true)
      {
        var item = {};
        item.dxcc = GT.dxccInfo[key].dxcc;
        item.flag = GT.dxccInfo[key].flag;
        item.confirmed = GT.dxccInfo[key].confirmed;
        ListConfirmed[GT.dxccInfo[key].name] = item;
        confirmed++;
      }
      if (GT.dxccInfo[key].worked == false && GT.dxccInfo[key].confirmed == false && GT.dxccInfo[key].pp != "" && GT.dxccInfo[key].geo != "deleted")
      {
        var item = {};
        item.dxcc = GT.dxccInfo[key].dxcc;
        item.flag = GT.dxccInfo[key].flag;
        item.confirmed = GT.dxccInfo[key].confirmed;
        ListNotWorked[GT.dxccInfo[key].name] = item;
        needed++;
      }
    }
  }

  if (worked > 0)
  {
    worker +=
      "<div  style='vertical-align:top;display:inline-block;margin-right:2px;overflow:auto;overflow-x:hidden;height:" +
      Math.min(Object.keys(List).length * 23, getStatsWindowHeight() - 70) +
      "px;'><table class='darkTable' align=center>" +
        "<tr><th colspan=5 style='font-weight:bold'>" +
        "" + I18N("gt.dxccBox.Worked") + " (" + worked + ")</th>" +
        "<tr><th align=left>" + I18N("gt.dxccBox.Name") + "</th>" +
        "<th>" + I18N("gt.dxccBox.Flag") + "</th>" +
        "<th align=left>" + I18N("gt.dxccBox.DXCC") + "</th></tr>";
    Object.keys(List)
      .sort()
      .forEach(function (key, i)
      {
        var rowStyle = List[key].confirmed ? "" : "background-clip:content-box;box-shadow: 0 0 8px 3px inset; cursor:pointer ";
        var rowAttributes = List[key].confirmed ? "" : "onclick='searchWorked(" + List[key].dxcc + ", \"" + band + "\", \"" + mode + "\");'";

        worker += "<tr><td align=left style='color:#ff0;" + rowStyle + "' " + rowAttributes + ">" + key + "</td>";
        worker += "<td align='center' style='margin:0;padding:0'><img style='padding-top:3px' src='img/flags/16/" + List[key].flag + "'></td>";
        worker += "<td align=left style='color:cyan;' >" + List[key].dxcc + "</td>";
      });
    worker += "</table></div>";
  }
  if (confirmed > 0)
  {
    worker +=
      "<div  style='padding:0px;vertical-align:top;display:inline-block;margin-right:2px;overflow:auto;overflow-x:hidden;height:" +
      Math.min(Object.keys(ListConfirmed).length * 23, getStatsWindowHeight() - 70) +
        "px;'><table class='darkTable' align=center>" +
        "<tr><th colspan=5 style='font-weight:bold'>" + I18N("gt.dxccBox.Confirmed") +
        " (" + confirmed + ")</th>" +
        "<tr><th align=left>" + I18N("gt.dxccBox.Name") + "</th>" +
        "<th>" + I18N("gt.dxccBox.Flag") + "</th>" +
        "<th align=left>" + I18N("gt.dxccBox.DXCC") + "</th></tr>";
    Object.keys(ListConfirmed)
      .sort()
      .forEach(function (key, i)
      {
        worker += "<tr><td align=left style='color:#ff0;' >" + key + "</td>";
        worker += "<td align='center' style='margin:0;padding:0'><img style='padding-top:3px' src='img/flags/16/" +
          ListConfirmed[key].flag + "'></td>";
        worker += "<td align=left style='color:cyan;' >" + ListConfirmed[key].dxcc + "</td>";
      });
    worker += "</table></div>";
  }
  if (needed > 0)
  {
    worker +=
      "<div  style='vertical-align:top;display:inline-block;overflow:auto;overflow-x:hidden;height:" +
      Math.min(Object.keys(ListNotWorked).length * 23, getStatsWindowHeight() - 70) +
        "px;'><table class='darkTable' align=center>" +
        "<tr><th colspan=3 style='font-weight:bold'>" + I18N("gt.dxccBox.Needed") +
        " (" + needed + ")</th>" +
        "<tr><th align=left>" + I18N("gt.dxccBox.Name") + "</th>" +
        "<th>" + I18N("gt.dxccBox.Flag") + "</th>" +
        "<th align=left>" + I18N("gt.dxccBox.DXCC") + "</th></tr>";
    Object.keys(ListNotWorked)
      .sort()
      .forEach(function (key, i)
      {
        worker += "<tr><td align=left style='color:#ff0;' >" + key + "</td>";
        worker += "<td align='center' style='margin:0;padding:0'><img style='padding-top:3px' src='img/flags/16/" + ListNotWorked[key].flag + "'></td>";
        worker += "<td align=left style='color:cyan;' >" + ListNotWorked[key].dxcc + "</td>";
      });
    worker += "</table></div>";
  }
  setStatsDiv("dxccListDiv", worker);
}

function showZonesBox()
{
  var worker = getCurrentBandModeHTML();

  worker += "<div style='vertical-align:top;display:inline-block;margin-right:8px;overflow:auto;overflow-x:hidden;color:cyan;'>" + "<b>" + I18N("gt.CQZoneBox.Worked") + "</b><br/>";
  worker += displayItemList(GT.cqZones, "#FFFFFF");
  worker += "</div>";

  worker += "<div style='vertical-align:top;display:inline-block;margin-right:8px;overflow:auto;overflow-x:hidden;color:cyan;'>" + "<b>" + I18N("gt.ITUZoneBox.Worked") + "</b><br/>";
  worker += displayItemList(GT.ituZones, "#FFFFFF");
  worker += "</div>";

  worker += "<div style='vertical-align:top;display:inline-block;margin-right:8px;overflow:auto;overflow-x:hidden;color:cyan;'><b>" + I18N("gt.WASWACBox.WAC") + "</b><br/>";
  worker += displayItemList(GT.wacZones, "#90EE90");
  worker += "</div>";

  setStatsDiv("zonesListDiv", worker);
}

function showWASPlusBox()
{
  var worker = getCurrentBandModeHTML();

  worker += "<div style='vertical-align:top;display:inline-block;margin-right:8px;overflow:auto;overflow-x:hidden;color:cyan;'<b>" + I18N("gt.WASWACBox.WAS") + "</b><br/>";
  worker += displayItemList(GT.wasZones, "#00DDDD");
  worker += "</div>";

  worker += "<div style='vertical-align:top;display:inline-block;margin-right:8px;overflow:auto;overflow-x:hidden;color:cyan;'><b>" + I18N("gt.WASWACBox.WACP") + "</b><br/>";
  worker += displayItemList(GT.wacpZones, "#FFA500");
  worker += "</div>";

  worker += "<div style='vertical-align:top;display:inline-block;margin-right:8px;overflow:auto;overflow-x:hidden;color:cyan;'><b>" + I18N("gt.viewInfo.us48Data") + "</b><br/>";
  worker += displayItemList(GT.us48Data, "#DDDD00");
  worker += "</div>";

  setStatsDiv("wasPlusListDiv", worker);
}

function displayItemList(table, color)
{
  var worked = 0;
  var needed = 0;
  var confirmed = 0;
  for (var key in table)
  {
    if (table[key].worked == true)
    {
      worked++;
    }
    if (table[key].confirmed == true)
    {
      confirmed++;
    }
    if (table[key].confirmed == false && table[key].worked == false)
    {
      needed++;
    }
  }
  var worker =
    "<div style='color:white;vertical-align:top;display:inline-block;margin-right:8px;overflow:auto;overflow-x:hidden;height:" +
    Math.min(
      Object.keys(table).length * 23 + (23 + 45),
      getStatsWindowHeight() - 12
    ) +
    "px;'>";
  worker += "<table class='darkTable' align=center>";
  worker +=
    "<tr><th style='font-weight:bold'>" + I18N("gt.displayItemsList.Worked") + " (" + worked + ")</th></tr>";
  worker +=
    "<tr><th style='font-weight:bold'>" + I18N("gt.displayItemsList.Confirmed") + " (" + confirmed + ")</th></tr>";
  worker +=
    "<tr><th style='font-weight:bold'>" + I18N("gt.displayItemsList.Needed") + " (" + needed + ")</th></tr>";
  worker += "<tr><th align=left>Name</th></tr>";

  var confirmed = "";
  var bold = "text-shadow: 0px 0px 1px black;";
  var unconf = "background-clip:content-box;box-shadow: 0 0 8px 3px inset ";

  Object.keys(table)
    .sort()
    .forEach(function (key, i)
    {
      var style;
      var name;
      if (typeof table[key].name !== "undefined" && table[key].name != key)
      {
        name = key + " / " + table[key].name;
      }
      else
      {
        name = key;
      }
      if (table[key].confirmed == true)
      {
        style = "color:" + color + ";" + confirmed;
      }
      else if (table[key].worked == true)
      {
        style = "color:" + color + ";" + unconf;
      }
      else
      {
        // needed
        style = "color:#000000;background-color:" + color + ";" + bold;
      }
      worker +=
        "<tr><td align=left style='" + style + "'>" + name + "</td></tr>";
    });
  worker += "</table></div>";
  return worker;
}

function showWPXBox()
{
  var worker = getCurrentBandModeHTML();

  var band = GT.appSettings.gtBandFilter == "auto" ? GT.appSettings.myBand : GT.appSettings.gtBandFilter.length == 0 ? "" : GT.appSettings.gtBandFilter;
  var mode = GT.appSettings.gtModeFilter == "auto" ? GT.appSettings.myMode : GT.appSettings.gtModeFilter.length == 0 ? "" : GT.appSettings.gtModeFilter;

  if (mode == "Digital") { mode = "dg"; }
  if (mode == "Phone") { mode = "ph"; }

  var modifier = String(band) + String(mode);
  var worked = 0;
  var confirmed = 0;
  var List = {};
  var ListConfirmed = {};

  for (var key in GT.tracker.worked.px)
  {
    if (typeof GT.tracker.worked.px[key] == "string" && key + modifier in GT.tracker.worked.px)
    {
      List[key] = key;
    }
  }

  for (var key in GT.tracker.confirmed.px)
  {
    if (typeof GT.tracker.confirmed.px[key] == "string" && key + modifier in GT.tracker.confirmed.px)
    {
      ListConfirmed[key] = key;
    }
  }

  worked = Object.keys(List).length;
  confirmed = Object.keys(ListConfirmed).length;

  if (worked > 0)
  {
    worker +=
      "<div  style='vertical-align:top;display:inline-block;margin-right:8px;overflow:auto;overflow-x:hidden;color:cyan;'>" +
        "<b>" + I18N("gt.WPXBox.worked") + " (<font color='#fff'>" +
      worked +
      "</font>)</b><br/>";
    worker +=
      "<div  style='color:white;vertical-align:top;display:inline-block;margin-right:8px;overflow:auto;overflow-x:hidden;height:" +
      Math.min(worked * 23 + 45, getStatsWindowHeight() - 6) +
      "px;'><table class='darkTable' align=center>";
    Object.keys(List)
      .sort()
      .forEach(function (key, i)
      {
        worker +=
          "<tr><td align=left style='color:#ff0;' >" +
          formatCallsign(key) +
          "</td><td style='color:#0ff;'>" +
          formatCallsign(GT.QSOhash[GT.tracker.worked.px[key]].DEcall) +
          "</td></tr>";
      });

    worker += "</table></div>";
    worker += "</div>";
  }

  if (confirmed > 0)
  {
    worker +=
      "<div  style='vertical-align:top;display:inline-block;margin-right:8px;overflow:auto;overflow-x:hidden;color:cyan;'>" +
        "<b>" + I18N("gt.WPXBox.confirmed") + " (<font color='#fff'>" +
      confirmed +
      "</font>)</b><br/>";
    worker +=
      "<div  style='color:white;vertical-align:top;display:inline-block;margin-right:8px;overflow:auto;overflow-x:hidden;height:" +
      Math.min(confirmed * 23 + 45, getStatsWindowHeight() - 6) +
      "px;'><table class='darkTable' align=center>";
    Object.keys(ListConfirmed)
      .sort()
      .forEach(function (key, i)
      {
        worker +=
          "<tr><td align=left style='color:#ff0;' >" +
          formatCallsign(key) +
          "</td><td style='color:#0ff;'>" +
          formatCallsign(GT.QSOhash[GT.tracker.confirmed.px[key]].DEcall) +
          "</td></tr>";
      });

    worker += "</table></div>";
    worker += "</div>";
  }

  setStatsDiv("wpxListDiv", worker);
}

function showRootInfoBox()
{
  if (GT.statsWindowInitialized)
  {
    electron.ipcRenderer.send("toggleWin", "gt_stats");
  }
}

function showSettingsBox()
{
  if (rootSettingsDiv.style.display == "inline-block")
  {
    updateRunningProcesses();
    rootSettingsDiv.style.display = "none";
  }
  else
  {
    updateRunningProcesses();
    helpDiv.style.display = "none";
    GT.helpShow = false;
    rootSettingsDiv.style.display = "inline-block";
  }
}

function toggleBaWindow()
{
  if (GT.baWindowHandle == null)
  {
    openBaWindow(true);
  }
  else
  {
    electron.ipcRenderer.send("toggleWin", "gt_bandactivity");
  }
}

function openBaWindow(show = true)
{
  if (GT.baWindowHandle == null)
  {
    GT.baWindowHandle = window.open("gt_bandactivity.html","gt_bandactivity");
  }
  else if (GT.baWindowInitialized)
  {
    show ? electron.ipcRenderer.send("showWin", "gt_bandactivity") : electron.ipcRenderer.send("hideWin", "gt_bandactivity");
  }
}

function openAlertWindow(show = true)
{
  if (GT.alertWindowHandle == null)
  {
    GT.alertWindowHandle = window.open("gt_alert.html", "gt_alert");
  }
  else if (GT.alertWindowInitialized)
  {
    show ? electron.ipcRenderer.send("showWin", "gt_alert") : electron.ipcRenderer.send("hideWin", "gt_alert");
  }
}

function openLookupWindow(show = false)
{
  if (GT.mapSettings.offlineMode == true) return;

  if (GT.lookupWindowHandle == null)
  {
    GT.lookupWindowHandle = window.open("gt_lookup.html","gt_lookup");
  }
  else if (GT.lookupWindowInitialized == true)
  {
    show ? electron.ipcRenderer.send("showWin", "gt_lookup") : electron.ipcRenderer.send("hideWin", "gt_lookup");
  }
}

function toggleLookupWindow()
{
  if (GT.lookupWindowInitialized == true)
  {
    electron.ipcRenderer.send("toggleWin", "gt_lookup");
  }
}

function openInfoTab(evt, tabName, callFunc, callObj)
{
  openStatsWindow();

  if (GT.statsWindowInitialized)
  {
    // Declare all variables
    var i, infoTabcontent, infoTablinks;
    // Get all elements with class="infoTabcontent" and hide them
    infoTabcontent = GT.statsWindowHandle.window.document.getElementsByClassName(
      "infoTabcontent"
    );
    for (i = 0; i < infoTabcontent.length; i++)
    {
      infoTabcontent[i].style.display = "none";
    }
    // Get all elements with class="infoTablinks" and remove the class "active"
    infoTablinks = GT.statsWindowHandle.window.document.getElementsByClassName(
      "infoTablinks"
    );
    for (i = 0; i < infoTablinks.length; i++)
    {
      infoTablinks[i].className = infoTablinks[i].className.replace(
        " active",
        ""
      );
    }
    // Show the current tab, and add an "active" class to the button that opened the tab

    GT.statsWindowHandle.window.document.getElementById(tabName).style.display = "block";

    if (evt)
    {
      evt = GT.statsWindowHandle.window.document.getElementById(evt);
    }
    if (evt)
    {
      if (typeof evt.currentTarget != "undefined")
      {
        evt.currentTarget.className += " active";
      }
      else
      {
        evt.className += " active";
      }
    }

    if (callFunc)
    {
      if (callObj) callFunc(callObj);
      else callFunc();
    }
  }
}

function openSettingsTab(evt, tabName)
{
  // Declare all variables
  var i, settingsTabcontent, settingsTablinks;
  // Get all elements with class="settingsTabcontent" and hide them
  settingsTabcontent = document.getElementsByClassName("settingsTabcontent");
  for (i = 0; i < settingsTabcontent.length; i++)
  {
    settingsTabcontent[i].style.display = "none";
  }
  // Get all elements with class="settingsTablinks" and remove the class "active"
  settingsTablinks = document.getElementsByClassName("settingsTablinks");
  for (i = 0; i < settingsTablinks.length; i++)
  {
    settingsTablinks[i].className = settingsTablinks[i].className.replace(
      " active",
      ""
    );
  }
  displayAlerts();
  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(tabName).style.display = "block";
  if (typeof evt.currentTarget != "undefined") { evt.currentTarget.className += " active"; }
  else evt.className += " active";
}

function toggleGridMode()
{
  GT.appSettings.sixWideMode ^= 1;
  modeImg.src = GT.maidenheadModeImageArray[GT.appSettings.sixWideMode];
  clearTempGrids();
  redrawGrids();
}

function newStatObject()
{
  var statObject = {};
  statObject.worked = 0;
  statObject.confirmed = 0;
  statObject.worked_bands = {};
  statObject.confirmed_bands = {};
  statObject.worked_modes = {};
  statObject.confirmed_modes = {};
  statObject.worked_types = {};
  statObject.confirmed_types = {};
  return statObject;
}

function newStatCountObject()
{
  var statCountObject = {};

  statCountObject.worked = 0;
  statCountObject.confirmed = 0;
  statCountObject.worked_bands = {};
  statCountObject.confirmed_bands = {};
  statCountObject.worked_modes = {};
  statCountObject.confirmed_modes = {};
  statCountObject.worked_types = {};
  statCountObject.confirmed_types = {};

  statCountObject.worked_high = 0;
  statCountObject.confirmed_high = 0;
  statCountObject.worked_high_key = null;
  statCountObject.confirmed_high_key = null;

  return statCountObject;
}

function newDistanceObject(start = 0)
{
  var distance = {};
  distance.worked_unit = start;
  distance.worked_hash = "";
  distance.confirmed_unit = start;
  distance.confirmed_hash = null;
  return distance;
}

GT.statBoxTimer = null;

function showStatBox(resize)
{
  var count = Object.keys(GT.QSOhash).length;

  if (typeof resize != "undefined" && resize)
  {
    setStatsDivHeight("statViewDiv", getStatsWindowHeight() + 29 + "px");
    return;
  }

  if (GT.statBoxTimer) nodeTimers.clearTimeout(GT.statBoxTimer);

  if (count > 0)
  {
    setStatsDiv(
      "statViewDiv",
      "&nbsp;<br/>" + I18N("gt.statBox.NoEntries") + "<br/>&nbsp;"
    );
    setStatsDivHeight("statViewDiv", "auto");
    GT.statBoxTimer = nodeTimers.setTimeout(renderStatsBox, 250);
  }
  else
  {
    setStatsDiv(
      "statViewDiv",
      "&nbsp;<br/>" + I18N("gt.statBox.NoEntries") + "<br/>&nbsp;"
    );
    setStatsDivHeight("statViewDiv", "auto");
  }
}

function getTypeFromMode(mode)
{
  if (mode in GT.modes)
  {
    if (GT.modes[mode] == true) return "Digital";
    else if (GT.modes_phone[mode] == true) return "Phone";
    else if (mode == "CW") return "CW";
  }
  return "Other";
}

function workObject(obj, count, band, mode, type, didConfirm)
{
  obj.worked++;
  obj.worked_bands[band] = ~~obj.worked_bands[band] + 1;
  obj.worked_modes[mode] = ~~obj.worked_modes[mode] + 1;

  if (!count)
  {
    obj.worked_types.Mixed = ~~obj.worked_modes.Mixed + 1;

    if (type) obj.worked_types[type] = ~~obj.worked_modes[type] + 1;
  }

  if (didConfirm)
  {
    obj.confirmed++;
    obj.confirmed_bands[band] = ~~obj.confirmed_bands[band] + 1;
    obj.confirmed_modes[mode] = ~~obj.confirmed_modes[mode] + 1;

    if (!count)
    {
      obj.confirmed_types.Mixed = ~~obj.confirmed_types.Mixed + 1;
      if (type) obj.confirmed_types[type] = ~~obj.confirmed_types[type] + 1;
    }
  }
  return obj;
}

function renderStatsBox()
{
  var worker = "";
  var scoreSection = "Initial";
  try
  {
    var dxccInfo = {};
    var cqZones = {};
    var ituZones = {};
    var wasZones = {};
    var wacpZones = {};
    var wacZones = {};
    var countyData = {};
    var gridData = {};
    var wpxData = {};
    var callData = {};

    var long_distance = newDistanceObject();
    var short_distance = newDistanceObject(100000);
    long_distance.band = {};
    long_distance.mode = {};
    long_distance.type = {};
    short_distance.band = {};
    short_distance.mode = {};
    short_distance.type = {};

    var modet = {};
    modet.Mixed = newStatCountObject();
    modet.Digital = newStatCountObject();
    modet.Phone = newStatCountObject();
    modet.CW = newStatCountObject();
    modet.Other = newStatCountObject();

    var details = {};
    details.callsigns = {};

    details.oldest = timeNowSec() + 86400;
    details.newest = 0;

    scoreSection = "QSO";

    for (var i in GT.QSOhash)
    {
      var finalGrid = GT.QSOhash[i].grid;
      var didConfirm = GT.QSOhash[i].confirmed;
      var band = GT.QSOhash[i].band;
      var mode = GT.QSOhash[i].mode;
      var state = GT.QSOhash[i].state;
      var cont = GT.QSOhash[i].cont;
      var finalDxcc = GT.QSOhash[i].dxcc;
      var cnty = GT.QSOhash[i].cnty;
      var ituz = GT.QSOhash[i].ituz;
      var cqz = GT.QSOhash[i].cqz;
      var wpx = GT.QSOhash[i].px;
      var call = GT.QSOhash[i].DXcall;
      var who = GT.QSOhash[i].DEcall;
      var type = getTypeFromMode(mode);

      if (!(who in callData)) callData[who] = newStatObject();

      workObject(callData[who], false, band, mode, type, didConfirm);

      details.callsigns[call] = ~~details.callsigns[call] + 1;

      if (GT.QSOhash[i].time < details.oldest) { details.oldest = GT.QSOhash[i].time; }
      if (GT.QSOhash[i].time > details.newest) { details.newest = GT.QSOhash[i].time; }

      workObject(modet.Mixed, true, band, mode, type, didConfirm);

      if (mode in GT.modes)
      {
        if (GT.modes[mode] == true)
        {
          workObject(modet.Digital, true, band, mode, type, didConfirm);
        }
        else if (GT.modes_phone[mode] == true)
        {
          workObject(modet.Phone, true, band, mode, type, didConfirm);
        }
        else if (mode == "CW")
        {
          workObject(modet.CW, true, band, mode, type, didConfirm);
        }
        else workObject(modet.Other, true, band, mode, type, didConfirm);
      }
      else workObject(modet.Other, true, band, mode, type, didConfirm);

      if (state != null && isKnownCallsignDXCC(finalDxcc))
      {
        if (state in GT.StateData)
        {
          let name = state;

          if (name in GT.wasZones)
          {
            if (!(name in wasZones)) wasZones[name] = newStatObject();

            workObject(wasZones[name], false, band, mode, type, didConfirm);
          }
          else if (name in GT.wacpZones)
          {
            if (!(name in wacpZones)) wacpZones[name] = newStatObject();

            workObject(wacpZones[name], false, band, mode, type, didConfirm);
          }
        }
      }

      if (wpx != null)
      {
        if (!(wpx in wpxData)) wpxData[wpx] = newStatObject();

        workObject(wpxData[wpx], false, band, mode, type, didConfirm);
      }

      if (cnty != null)
      {
        if (cnty in GT.cntyToCounty)
        {
          if (!(cnty in countyData)) countyData[cnty] = newStatObject();

          workObject(countyData[cnty], false, band, mode, type, didConfirm);
        }
      }
      if (cont != null)
      {
        if (cont in GT.shapeData)
        {
          var name = GT.shapeData[cont].properties.name;
          if (name in GT.wacZones)
          {
            if (!(name in wacZones)) wacZones[name] = newStatObject();

            workObject(wacZones[name], false, band, mode, type, didConfirm);
          }
        }
      }

      if (finalGrid.length > 0)
      {
        LL = squareToCenter(finalGrid);
        unit = parseInt(MyCircle.distance(GT.myLat, GT.myLon, LL.a, LL.o, distanceUnit.value) * MyCircle.validateRadius(distanceUnit.value));

        if (unit > long_distance.worked_unit)
        {
          long_distance.worked_unit = unit;
          long_distance.worked_hash = i;
        }

        if (!(band in long_distance.band)) { long_distance.band[band] = newDistanceObject(); }
        if (!(mode in long_distance.mode)) { long_distance.mode[mode] = newDistanceObject(); }
        if (!(type in long_distance.type)) { long_distance.type[type] = newDistanceObject(); }

        if (unit > long_distance.mode[mode].worked_unit)
        {
          long_distance.mode[mode].worked_unit = unit;
          long_distance.mode[mode].worked_hash = i;
        }

        if (unit > long_distance.band[band].worked_unit)
        {
          long_distance.band[band].worked_unit = unit;
          long_distance.band[band].worked_hash = i;
        }

        if (unit > long_distance.type[type].worked_unit)
        {
          long_distance.type[type].worked_unit = unit;
          long_distance.type[type].worked_hash = i;
        }

        if (didConfirm)
        {
          if (unit > long_distance.confirmed_unit)
          {
            long_distance.confirmed_unit = unit;
            long_distance.confirmed_hash = i;
          }
          if (unit > long_distance.mode[mode].confirmed_unit)
          {
            long_distance.mode[mode].confirmed_unit = unit;
            long_distance.mode[mode].confirmed_hash = i;
          }
          if (unit > long_distance.band[band].confirmed_unit)
          {
            long_distance.band[band].confirmed_unit = unit;
            long_distance.band[band].confirmed_hash = i;
          }
          if (unit > long_distance.type[type].confirmed_unit)
          {
            long_distance.type[type].confirmed_unit = unit;
            long_distance.type[type].confirmed_hash = i;
          }
        }

        if (unit > 0)
        {
          if (unit < short_distance.worked_unit)
          {
            short_distance.worked_unit = unit;
            short_distance.worked_hash = i;
          }

          if (!(band in short_distance.band)) { short_distance.band[band] = newDistanceObject(100000); }
          if (!(mode in short_distance.mode)) { short_distance.mode[mode] = newDistanceObject(100000); }
          if (!(type in short_distance.type)) { short_distance.type[type] = newDistanceObject(100000); }

          if (unit < short_distance.mode[mode].worked_unit)
          {
            short_distance.mode[mode].worked_unit = unit;
            short_distance.mode[mode].worked_hash = i;
          }
          if (unit < short_distance.band[band].worked_unit)
          {
            short_distance.band[band].worked_unit = unit;
            short_distance.band[band].worked_hash = i;
          }
          if (unit < short_distance.type[type].worked_unit)
          {
            short_distance.type[type].worked_unit = unit;
            short_distance.type[type].worked_hash = i;
          }
          if (didConfirm)
          {
            if (unit < short_distance.confirmed_unit)
            {
              short_distance.confirmed_unit = unit;
              short_distance.confirmed_hash = i;
            }
            if (unit < short_distance.mode[mode].confirmed_unit)
            {
              short_distance.mode[mode].confirmed_unit = unit;
              short_distance.mode[mode].confirmed_hash = i;
            }
            if (unit < short_distance.band[band].confirmed_unit)
            {
              short_distance.band[band].confirmed_unit = unit;
              short_distance.band[band].confirmed_hash = i;
            }
            if (unit < short_distance.type[type].confirmed_unit)
            {
              short_distance.type[type].confirmed_unit = unit;
              short_distance.type[type].confirmed_hash = i;
            }
          }
        }
      }

      if (finalDxcc > 0)
      {
        if (!(GT.dxccToAltName[finalDxcc] in dxccInfo)) { dxccInfo[GT.dxccToAltName[finalDxcc]] = newStatObject(); }

        workObject(
          dxccInfo[GT.dxccToAltName[finalDxcc]],
          false,
          band,
          mode,
          type,
          didConfirm
        );
      }

      if (cqz && cqz.length > 0)
      {
        var name = GT.cqZones[cqz].name;
        if (!(name in cqZones)) cqZones[name] = newStatObject();

        workObject(cqZones[name], false, band, mode, type, didConfirm);
      }

      if (ituz && ituz.length > 0)
      {
        if (!(ituz in ituZones)) ituZones[ituz] = newStatObject();

        workObject(ituZones[ituz], false, band, mode, type, didConfirm);
      }

      if (finalGrid.length > 0)
      {
        var gridCheck = finalGrid.substr(0, 4);

        if (!(gridCheck in gridData)) gridData[gridCheck] = newStatObject();

        workObject(gridData[gridCheck], false, band, mode, type, didConfirm);
      }
    }

    scoreSection = "Stats";

    var stats = {};
    var output = {};

    dxccInfo.order = 1;
    stats.DXCC = dxccInfo;
    stats.GRID = gridData;
    stats.CQ = cqZones;
    stats.ITU = ituZones;
    stats.WAC = wacZones;
    stats.WAS = wasZones;
    stats.WACP = wacpZones;
    stats.USC = countyData;
    stats.WPX = wpxData;
    stats.WRFA = callData;

    for (i in stats)
    {
      output[i] = newStatCountObject();

      for (var key in stats[i])
      {
        if (stats[i][key].worked)
        {
          output[i].worked++;
          if (stats[i][key].worked > output[i].worked_high)
          {
            output[i].worked_high = stats[i][key].worked;
            output[i].worked_high_key = key;
          }
        }
        if (stats[i][key].confirmed)
        {
          output[i].confirmed++;
          if (stats[i][key].confirmed > output[i].confirmed_high)
          {
            output[i].confirmed_high = stats[i][key].confirmed;
            output[i].confirmed_high_key = key;
          }
        }

        for (var band in stats[i][key].worked_bands)
        {
          output[i].worked_bands[band] = ~~output[i].worked_bands[band] + 1;
        }

        for (var band in stats[i][key].confirmed_bands)
        {
          output[i].confirmed_bands[band] = ~~output[i].confirmed_bands[band] + 1;
        }

        for (var mode in stats[i][key].worked_modes)
        {
          output[i].worked_modes[mode] = ~~output[i].worked_modes[mode] + 1;
        }

        for (var mode in stats[i][key].confirmed_modes)
        {
          output[i].confirmed_modes[mode] = ~~output[i].confirmed_modes[mode] + 1;
        }

        for (var type in stats[i][key].worked_types)
        {
          output[i].worked_types[type] = ~~output[i].worked_types[type] + 1;
        }

        for (var type in stats[i][key].confirmed_types)
        {
          output[i].confirmed_types[type] = ~~output[i].confirmed_types[type] + 1;
        }
      }

      stats[i] = null;
    }

    scoreSection = "Modes";

    output.MIXED = modet.Mixed;
    output.DIGITAL = modet.Digital;
    output.PHONE = modet.Phone;
    output.CW = modet.CW;
    output.Other = modet.Other;

    for (var i in output)
    {
      output[i].worked_band_count = Object.keys(output[i].worked_bands).length;
      output[i].confirmed_band_count = Object.keys(
        output[i].confirmed_bands
      ).length;
      output[i].worked_mode_count = Object.keys(output[i].worked_modes).length;
      output[i].confirmed_mode_count = Object.keys(
        output[i].confirmed_modes
      ).length;
      output[i].worked_type_count = Object.keys(output[i].worked_types).length;
      output[i].confirmed_type_count = Object.keys(
        output[i].confirmed_types
      ).length;
    }

    var TypeNames = {
      0: ["MIXED", I18N("gt.typeNames.Mixed"), ""],
      1: ["DIGITAL", I18N("gt.typeNames.Digital"), ""],
      2: ["PHONE", I18N("gt.typeNames.Phone"), ""],
      3: ["CW", I18N("gt.typeNames.CW"), ""],
      4: ["Other", I18N("gt.typeNames.Other"), ""]
    };

    var AwardNames = {
      0: ["WRFA", I18N("gt.awardNames.WRFA"), "WRFA", "yellow"],
      1: ["GRID", I18N("gt.awardNames.Grid"), "GSA", "cyan"],
      2: ["DXCC", I18N("gt.awardNames.DXCC"), "DXWA", "orange"],
      3: ["CQ", I18N("gt.awardNames.CQ"), "WAZ", "lightgreen"],
      4: ["ITU", I18N("gt.awardNames.ITU"), "ITUz", "#DD44DD"],
      5: ["WAC", I18N("gt.awardNames.WAC"), "WAC", "cyan"],
      6: ["WAS", I18N("gt.awardNames.WAS"), "WAS", "lightblue"],
      7: ["USC", I18N("gt.awardNames.USC"), "USA-CA", "orange"],
      8: ["WPX", I18N("gt.awardNames.WPX"), "WPX", "yellow"],
      9: ["WACP", "CA Provinces", "WACP", "lightblue"]
    };

    worker = "<font color='cyan'>";

    worker += "<h1>" + I18N("gt.logbook.title") + "</h1>";

    worker += "<table style='display:inline-table;margin:5px;' class='darkTable'>";

    var ws = "";
    if (Object.keys(details.callsigns).length > 1) ws = "s";
    worker +=
      "<tr><td>Callsign" +
      ws +
      "</td><td style='color:yellow' ><b>" +
      Object.keys(details.callsigns).sort().join(", ") +
      "</b></td></tr>";
    worker +=
      "<tr><td>" + I18N("gt.logbook.firstContact") + "</td><td style='color:white' >" +
      userTimeString(details.oldest * 1000) +
      "</td></tr>";
    worker +=
      "<tr><td>" + I18N("gt.logbook.lastContact") + "</td><td style='color:white' >" +
      userTimeString(details.newest * 1000) +
      "</td></tr>";
    worker += "</table>";
    worker += "</br>";
    worker += "<h1>" + I18N("gt.logbook.scoreCard") + "</h1>";
    worker += "<table style='display:inline-table;margin:5px;' class='darkTable'>";
    worker += "<tr><th>" + I18N("gt.logbook.topScore") + "</th>" + "<th style='color:yellow'>" + I18N("gt.logbook.worked") + "</th>" + "<th style='color:lightgreen'>" + I18N("gt.logbook.confirmed") + "</th></tr>";

    for (var key in AwardNames)
    {
      scoreSection = "Award " + AwardNames[key][1];
      var infoObject = output[AwardNames[key][0]];
      worker += "<tr><td style='color:white'>" + AwardNames[key][1] + "</td>";
      worker +=
        "<td style='color:" +
        AwardNames[key][3] +
        "'>" +
        infoObject.worked_high_key +
        "<font color='white'> (" +
        infoObject.worked_high +
        ")</font></td>";

      if (infoObject.confirmed_high_key)
      {
        worker +=
          "<td style='color:" +
          AwardNames[key][3] +
          "'>" +
          infoObject.confirmed_high_key +
          "<font color='white'> (" +
          infoObject.confirmed_high +
          ")</font></td>";
      }
      else worker += "<td></td>";

      worker += "</tr>";
    }

    scoreSection = "Long Distance";

    worker += "<tr><td style='color:white'>" + I18N("gt.score.LongDist") + "</td>";
    worker +=
      "<td style='color:lightgreen'>" +
      long_distance.worked_unit +
      " " +
      distanceUnit.value.toLowerCase();
    worker +=
      "<font style='color:yellow' > " +
      GT.QSOhash[long_distance.worked_hash].DEcall +
      "</font>";
    worker +=
      "<font style='color:orange' > " +
      GT.QSOhash[long_distance.worked_hash].grid +
      "</font></td>";

    if (long_distance.confirmed_hash && long_distance.confirmed_unit > 0)
    {
      worker +=
        "<td style='color:lightgreen'>" +
        long_distance.confirmed_unit +
        " " +
        distanceUnit.value.toLowerCase();
      worker +=
        "<font style='color:yellow' > " +
        GT.QSOhash[long_distance.confirmed_hash].DEcall +
        "</font>";
      worker +=
        "<font style='color:orange' > " +
        GT.QSOhash[long_distance.confirmed_hash].grid +
        "</font></td>";
    }
    else worker += "<td></td>";

    scoreSection = "Short Distance";

    worker += "<tr><td style='color:white' >" + I18N("gt.score.ShortDist") + "</td>";
    worker +=
      "<td style='color:lightblue'>" +
      short_distance.worked_unit +
      " " +
      distanceUnit.value.toLowerCase();
    worker +=
      "<font style='color:yellow' > " +
      GT.QSOhash[short_distance.worked_hash].DEcall +
      "</font>";
    worker +=
      "<font style='color:orange' > " +
      GT.QSOhash[short_distance.worked_hash].grid +
      "</font></td>";

    if (short_distance.confirmed_hash && short_distance.confirmed_unit > 0)
    {
      worker +=
        "<td style='color:lightblue'>" +
        short_distance.confirmed_unit +
        " " +
        distanceUnit.value.toLowerCase();
      worker +=
        "<font style='color:yellow' > " +
        GT.QSOhash[short_distance.confirmed_hash].DEcall +
        "</font>";
      worker +=
        "<font style='color:orange' > " +
        GT.QSOhash[short_distance.confirmed_hash].grid +
        "</font></td>";
    }
    else worker += "<td></td>";

    worker += "</tr>";
    worker += "</table>";
    worker += "</br>";
    worker += "<h1>" + I18N("gt.AwardTypes") + "</h1>";

    scoreSection = "Award Types";
    for (var key in AwardNames)
    {
      worker += createStatTable(
        AwardNames[key][1],
        output[AwardNames[key][0]],
        AwardNames[key][2]
      );
    }

    worker += "<br/>";

    scoreSection = "Mode Types";

    worker += "<h1>" + I18N("gt.ModeTypes") + "</h1>";
    for (var key in TypeNames)
    {
      worker += createStatTable(
        TypeNames[key][1],
        output[TypeNames[key][0]],
        TypeNames[key][2]
      );
    }

    worker += "<br/>";

    worker += "<h1>" + I18N("gt.Distances") + "</h1>";
    scoreSection = "Distances";
    worker += createDistanceTable(long_distance, I18N("gt.LongestDist"));
    worker += createDistanceTable(short_distance, I18N("gt.ShortestDist"));
    worker += "<br/>";
  }
  catch (e)
  {
    worker +=
      "<br/> In Section: " +
      scoreSection +
      "<br/>" + I18N("gt.scorecardError");
  }

  setStatsDiv("statViewDiv", worker);
  setStatsDivHeight("statViewDiv", getStatsWindowHeight() + 29 + "px");
}

function createDistanceTable(obj, name)
{
  var worker =
    "<table style='display:inline-table;margin:5px;' class='darkTable'>";
  worker +=
    "<tr><th colspan = 3 align=left style='font-size:15px;color:cyan;'>" +
    name +
    "</th></tr>";
  worker +=
    "<tr><td></td><td><font  color='yellow'>" + I18N("gt.distanceTable.Worked") +
      "</font></td><td colspan=2 ><font color='lightgreen'>" + I18N("gt.distanceTable.Confirmed") + "</font></td></tr>";
  worker += "<tr><td align=center><font color='lightgreen'>" + I18N("gt.distanceTable.Bands") + "</font></td>";
  worker += "<td align=left><table class='subtable'>";
  var keys = Object.keys(obj.band).sort(numberSort);
  for (var key in keys)
  {
    var grid = GT.QSOhash[obj.band[keys[key]].worked_hash].grid;
    var call = GT.QSOhash[obj.band[keys[key]].worked_hash].DEcall;
    worker +=
      "<tr><td align=right>" +
      keys[key] +
      "</td><td style='color:lightgreen' align=left>(" +
      obj.band[keys[key]].worked_unit +
      " " +
      distanceUnit.value.toLowerCase() +
      ")</td>";
    worker +=
      "<td style='color:yellow;cursor:pointer' align=left onclick='window.opener.startLookup(\"" +
      call +
      "\",\"" +
      grid +
      "\");' >" +
      call +
      "</td>";
    worker += "<td style='color:orange' align=left>" + grid + "</td>";
    worker += "</tr>";
  }
  worker += "</table></td>";
  worker += "<td align=left><table class='subtable'>";
  for (var key in keys)
  {
    if (keys[key] in obj.band && obj.band[keys[key]].confirmed_hash)
    {
      var grid = GT.QSOhash[obj.band[keys[key]].confirmed_hash].grid;
      var call = GT.QSOhash[obj.band[keys[key]].confirmed_hash].DEcall;
      worker +=
        "<tr><td align=right>" +
        keys[key] +
        "</td><td style='color:lightgreen' align=left>(" +
        obj.band[keys[key]].confirmed_unit +
        " " +
        distanceUnit.value.toLowerCase() +
        ")</td>";
      worker +=
        "<td style='color:yellow;cursor:pointer' align=left onclick='window.opener.startLookup(\"" +
        call +
        "\",\"" +
        grid +
        "\");'>" +
        call +
        "</td>";
      worker += "<td style='color:orange' align=left>" + grid + "</td>";
      worker += "</tr>";
    }
    else worker += "<tr><td>&nbsp;</td></tr>";
  }

  worker += "</table></td>";
  worker += "</tr>";
  worker += "<tr><td align=center><font color='orange'>" + I18N("gt.distanceTable.Modes") + "</font></td>";
  worker += "<td align=left><table class='subtable'>";
  keys = Object.keys(obj.mode).sort();
  for (var key in keys)
  {
    var grid = GT.QSOhash[obj.mode[keys[key]].worked_hash].grid;
    var call = GT.QSOhash[obj.mode[keys[key]].worked_hash].DEcall;
    worker +=
      "<tr><td align=right>" +
      keys[key] +
      "</td><td style='color:lightgreen' align=left>(" +
      obj.mode[keys[key]].worked_unit +
      " " +
      distanceUnit.value.toLowerCase() +
      ")</td>";
    worker +=
      "<td style='color:yellow;cursor:pointer' align=left  onclick='window.opener.startLookup(\"" +
      call +
      "\",\"" +
      grid +
      "\");' >" +
      call +
      "</td>";
    worker += "<td style='color:orange' align=left>" + grid + "</td>";
    worker += "</tr>";
  }
  worker += "</table></td>";
  worker += "<td align=left><table class='subtable'>";
  for (var key in keys)
  {
    if (keys[key] in obj.mode && obj.mode[keys[key]].confirmed_hash)
    {
      var grid = GT.QSOhash[obj.mode[keys[key]].confirmed_hash].grid;
      var call = GT.QSOhash[obj.mode[keys[key]].confirmed_hash].DEcall;
      worker +=
        "<tr><td align=right>" +
        keys[key] +
        "</td><td style='color:lightgreen' align=left>(" +
        obj.mode[keys[key]].confirmed_unit +
        " " +
        distanceUnit.value.toLowerCase() +
        ")</td>";
      worker +=
        "<td style='color:yellow;cursor:pointer' align=left onclick='window.opener.startLookup(\"" +
        call +
        "\",\"" +
        grid +
        "\");' >" +
        call +
        "</td>";
      worker += "<td style='color:orange' align=left>" + grid + "</td>";
      worker += "</tr>";
    }
    else worker += "<tr><td>&nbsp;</td></tr>";
  }
  worker += "</table></td>";
  worker += "</tr>";
  worker += "<tr><td align=center><font color='#DD44DD'>" + I18N("gt.distanceTable.Types") + "</font></td>";
  worker += "<td align=left><table class='subtable'>";
  keys = Object.keys(obj.type).sort();
  for (var key in keys)
  {
    var grid = GT.QSOhash[obj.type[keys[key]].worked_hash].grid;
    var call = GT.QSOhash[obj.type[keys[key]].worked_hash].DEcall;
    worker +=
      "<tr><td align=right>" +
      keys[key] +
      "</td><td style='color:lightgreen' align=left>(" +
      obj.type[keys[key]].worked_unit +
      " " +
      distanceUnit.value.toLowerCase() +
      ")</td>";
    worker +=
      "<td style='color:yellow;cursor:pointer' align=left onclick='window.opener.startLookup(\"" +
      call +
      "\",\"" +
      grid +
      "\");' >" +
      call +
      "</td>";
    worker += "<td style='color:orange' align=left>" + grid + "</td>";
    worker += "</tr>";
  }
  worker += "</table></td>";
  worker += "<td align=left><table class='subtable'>";
  for (var key in keys)
  {
    if (keys[key] in obj.type && obj.type[keys[key]].confirmed_hash)
    {
      var grid = GT.QSOhash[obj.type[keys[key]].confirmed_hash].grid;
      var call = GT.QSOhash[obj.type[keys[key]].confirmed_hash].DEcall;
      worker +=
        "<tr><td align=right>" +
        keys[key] +
        "</td><td style='color:lightgreen' align=left>(" +
        obj.type[keys[key]].confirmed_unit +
        " " +
        distanceUnit.value.toLowerCase() +
        ")</td>";
      worker +=
        "<td style='color:yellow;cursor:pointer' align=left onclick='window.opener.startLookup(\"" +
        call +
        "\",\"" +
        grid +
        "\");' >" +
        call +
        "</td>";
      worker += "<td style='color:orange' align=left>" + grid + "</td>";
      worker += "</tr>";
    }
    else worker += "<tr><td>&nbsp;</td></tr>";
  }
  worker += "</table></td>";
  worker += "</tr>";
  worker += "</table>";
  return worker;
}

function numberSort(a, b)
{
  // cut off 'm' from 80m or 70cm
  var metersA = a.slice(0, -1);
  var metersB = b.slice(0, -1);

  // if last letter is c we have a centimeter band, multiply value with 0.01
  if (metersA.slice(-1) == "c")
  {
    metersA = 0.01 * parseInt(metersA);
  }
  else
  {
    metersA = parseInt(metersA);
  }
  if (metersB.slice(-1) == "c")
  {
    metersB = 0.01 * parseInt(metersB);
  }
  else
  {
    metersA = parseInt(metersA);
  }
  if (metersA > metersB) return 1;
  if (metersB > metersA) return -1;
  return 0;
}

function createStatTable(title, infoObject, awardName)
{
  var wc1Table = "";

  if (infoObject.worked)
  {
    wc1Table =
      "<table style='display:inline-table;margin:5px;' class='darkTable'>";
    wc1Table +=
      "<tr><th colspan = 3 align=left style='font-size:15px;color:cyan;'>" +
      title +
      "</th></tr>";
    var award = "<th></th>";

    wc1Table +=
      "<tr>" +
      award +
      "<td><font  color='yellow'>" + I18N("gt.statTable.Worked") + "</font> <font color='white'>(" +
      infoObject.worked +
      ")</font></td><td colspan=2 ><font  color='lightgreen'>" + I18N("gt.statTable.Confirmed") + "</font> <font color='white'>(" +
      infoObject.confirmed +
      ")</font></td></tr>";

    wc1Table +=
      "<tr><td align=center><font color='lightgreen'>" + I18N("gt.statTable.Bands") + "</font></td>";

    wc1Table += "<td align=left><table class='subtable'>";
    var keys = Object.keys(infoObject.worked_bands).sort(numberSort);
    for (var key in keys)
    {
      wc1Table +=
        "<tr><td align=right>" +
        keys[key] +
        "</td><td align=left> <font color='white'>(" +
        infoObject.worked_bands[keys[key]] +
        ")</font></td></tr>";
    }

    wc1Table += "</table></td>";
    wc1Table += "<td align=left><table class='subtable'>";

    for (var key in keys)
    {
      if (keys[key] in infoObject.confirmed_bands)
      {
        wc1Table +=
          "<tr><td align=right>" +
          keys[key] +
          "</td><td align=left> <font color='white'>(" +
          infoObject.confirmed_bands[keys[key]] +
          ")</font></td></tr>";
      }
      else wc1Table += "<tr><td>&nbsp;</td></tr>";
    }
    wc1Table += "</table></td>";
    wc1Table += "</tr>";

    wc1Table += "<tr>";
    wc1Table += "<td align=center><font color='orange'>" + I18N("gt.statTable.Modes") + "</font></td>";
    wc1Table += "<td align=left><table class='subtable'>";
    keys = Object.keys(infoObject.worked_modes).sort();
    for (var key in keys)
    {
      wc1Table +=
        "<tr><td align=right>" +
        keys[key] +
        "</td><td align=left> <font color='white'>(" +
        infoObject.worked_modes[keys[key]] +
        ")</font></td></tr>";
    }

    wc1Table += "</table></td>";

    wc1Table += "<td align=left><table class='subtable'>";

    for (var key in keys)
    {
      if (keys[key] in infoObject.confirmed_modes)
      {
        wc1Table +=
          "<tr><td align=right>" +
          keys[key] +
          "</td><td align=left> <font color='white'>(" +
          infoObject.confirmed_modes[keys[key]] +
          ")</font></td></tr>";
      }
      else wc1Table += "<tr><td>&nbsp;</td></tr>";
    }

    wc1Table += "</table></td>";
    wc1Table += "</tr>";

    if (infoObject.worked_type_count > 0)
    {
      wc1Table += "<tr>";
      wc1Table += "<td align=center><font color='#DD44DD'>" + I18N("gt.statTable.Types") + "</font></td>";
      wc1Table += "<td align=left><table class='subtable'>";
      var keys = Object.keys(infoObject.worked_types).sort();
      for (var key in keys)
      {
        wc1Table +=
          "<tr><td align=right>" +
          keys[key] +
          "</td><td align=left> <font color='white'>(" +
          infoObject.worked_types[keys[key]] +
          ") " +
          "</font></td></tr>";
      }

      wc1Table += "</table></td>";

      wc1Table += "<td align=left><table class='subtable'>";

      for (var key in keys)
      {
        if (keys[key] in infoObject.confirmed_types)
        {
          wc1Table +=
            "<tr><td align=right>" +
            keys[key] +
            "</td><td align=left> <font color='white'>(" +
            infoObject.confirmed_types[keys[key]] +
            ") " +
            "</font></td></tr>";
        }
        else wc1Table += "<tr><td>&nbsp;</td></tr>";
      }

      wc1Table += "</table></td>";
      wc1Table += "</tr>";
    }

    wc1Table += "</table>";
  }

  return wc1Table;
}

function validatePropMode(propMode)
{
  if (GT.appSettings.gtPropFilter == "mixed") return true;

  return GT.appSettings.gtPropFilter == propMode;
}

function validateMapBandAndMode(band, mode)
{
  if ((GT.appSettings.gtBandFilter.length == 0 || (GT.appSettings.gtBandFilter == "auto" ? GT.appSettings.myBand == band : GT.appSettings.gtBandFilter == band)))
  {
    if (GT.appSettings.gtModeFilter.length == 0) return true;

    if (GT.appSettings.gtModeFilter == "auto") return GT.appSettings.myMode == mode;

    if (GT.appSettings.gtModeFilter == "Digital")
    {
      if (mode in GT.modes && GT.modes[mode]) return true;
      return false;
    }
    if (GT.appSettings.gtModeFilter == "Phone")
    {
      if (mode in GT.modes_phone && GT.modes_phone[mode]) return true;
      return false;
    }

    if (GT.appSettings.gtModeFilter == "CW" && mode == "CW") return true;

    return GT.appSettings.gtModeFilter == mode;
  }
  else
  {
    return false;
  }
}

function redrawLiveGrids(honorAge = true)
{
  for (var i in GT.liveCallsigns)
  {
    if (GT.appSettings.gridViewMode != 2 && validateMapBandAndMode(GT.liveCallsigns[i].band, GT.liveCallsigns[i].mode) && (honorAge == false || (honorAge == true && GT.timeNow - GT.liveCallsigns[i].age <= gridDecay.value)))
    {
      qthToBox(GT.liveCallsigns[i].grid, GT.liveCallsigns[i].DEcall, false, false, GT.liveCallsigns[i].DXcall, GT.liveCallsigns[i].band, GT.liveCallsigns[i].wspr, i, false);
    }
  }
  if (honorAge == false)
  {
    for (var i in GT.liveGrids)
    {
      GT.liveGrids[i].age = GT.timeNow;
    }
  }
  else
  {
    dimGridsquare();
  }
}

function redrawGrids()
{
  if (GT.appSettings.gridViewMode == 2) removePaths();
  clearGrids();
  clearQsoGrids();

  GT.QSLcount = 0;
  GT.QSOcount = 0;

  for (var i in GT.QSOhash)
  {
    var finalGrid = GT.QSOhash[i].grid;
    var worked = GT.QSOhash[i].worked;
    var didConfirm = GT.QSOhash[i].confirmed;
    var band = GT.QSOhash[i].band;
    var mode = GT.QSOhash[i].mode;
    GT.QSOcount++;
    if (didConfirm) GT.QSLcount++;

    if (validateMapBandAndMode(GT.QSOhash[i].band, GT.QSOhash[i].mode) && validatePropMode(GT.QSOhash[i].propMode))
    {
      if (GT.appSettings.gridViewMode > 1)
      {
        if (finalGrid.length > 0)
        {
          qthToQsoBox(
            GT.QSOhash[i].grid,
            i,
            false,
            GT.QSOhash[i].DXcall,
            GT.QSOhash[i].worked,
            GT.QSOhash[i].confirmed,
            GT.QSOhash[i].band
          );
        }
        for (var vucc in GT.QSOhash[i].vucc_grids)
        {
          qthToQsoBox(
            GT.QSOhash[i].vucc_grids[vucc],
            i,
            false,
            GT.QSOhash[i].DXcall,
            GT.QSOhash[i].worked,
            GT.QSOhash[i].confirmed,
            GT.QSOhash[i].band
          );
        }
      }

      var state = GT.QSOhash[i].state;
      var cont = GT.QSOhash[i].cont;
      var finalDxcc = GT.QSOhash[i].dxcc;
      var cnty = GT.QSOhash[i].cnty;
      var ituz = GT.QSOhash[i].ituz;
      var cqz = GT.QSOhash[i].cqz;

      if (state != null && isKnownCallsignDXCC(finalDxcc))
      {
        if (state in GT.StateData)
        {
          let name = state;
          if (name in GT.wasZones)
          {
            GT.wasZones[name].worked |= worked;
            if (worked)
            {
              GT.wasZones[name].worked_bands[band] = ~~GT.wasZones[name].worked_bands[band] + 1;
              GT.wasZones[name].worked_modes[mode] = ~~GT.wasZones[name].worked_modes[mode] + 1;
            }

            GT.wasZones[name].confirmed |= didConfirm;
            if (didConfirm)
            {
              GT.wasZones[name].confirmed_bands[band] = ~~GT.wasZones[name].confirmed_bands[band] + 1;
              GT.wasZones[name].confirmed_modes[mode] = ~~GT.wasZones[name].confirmed_modes[mode] + 1;
            }
          }
          else if (name in GT.wacpZones)
          {
            GT.wacpZones[name].worked |= worked;
            if (worked)
            {
              GT.wacpZones[name].worked_bands[band] = ~~GT.wacpZones[name].worked_bands[band] + 1;
              GT.wacpZones[name].worked_modes[mode] = ~~GT.wacpZones[name].worked_modes[mode] + 1;
            }

            GT.wacpZones[name].confirmed |= didConfirm;
            if (didConfirm)
            {
              GT.wacpZones[name].confirmed_bands[band] = ~~GT.wacpZones[name].confirmed_bands[band] + 1;
              GT.wacpZones[name].confirmed_modes[mode] = ~~GT.wacpZones[name].confirmed_modes[mode] + 1;
            }
          }
        }
      }

      if (cnty != null)
      {
        if (cnty in GT.cntyToCounty)
        {
          GT.countyData[cnty].worked |= worked;
          if (worked)
          {
            GT.countyData[cnty].worked_bands[band] = ~~GT.countyData[cnty].worked_bands[band] + 1;
            GT.countyData[cnty].worked_modes[mode] = ~~GT.countyData[cnty].worked_modes[mode] + 1;
          }

          GT.countyData[cnty].confirmed |= didConfirm;
          if (didConfirm)
          {
            GT.countyData[cnty].confirmed_bands[band] = ~~GT.countyData[cnty].confirmed_bands[band] + 1;
            GT.countyData[cnty].confirmed_modes[mode] = ~~GT.countyData[cnty].confirmed_modes[mode] + 1;
          }
        }
      }
      if (cont != null)
      {
        if (cont in GT.shapeData)
        {
          var name = GT.shapeData[cont].properties.name;

          if (name in GT.wacZones)
          {
            GT.wacZones[name].worked |= worked;
            if (worked)
            {
              GT.wacZones[name].worked_bands[band] = ~~GT.wacZones[name].worked_bands[band] + 1;
              GT.wacZones[name].worked_modes[mode] = ~~GT.wacZones[name].worked_modes[mode] + 1;
            }

            GT.wacZones[name].confirmed |= didConfirm;
            if (didConfirm)
            {
              GT.wacZones[name].confirmed_bands[band] = ~~GT.wacZones[name].confirmed_bands[band] + 1;
              GT.wacZones[name].confirmed_modes[mode] = ~~GT.wacZones[name].confirmed_modes[mode] + 1;
            }
          }
        }
      }

      GT.dxccInfo[finalDxcc].worked |= worked;
      if (worked)
      {
        GT.dxccInfo[finalDxcc].worked_bands[band] = ~~GT.dxccInfo[finalDxcc].worked_bands[band] + 1;
        GT.dxccInfo[finalDxcc].worked_modes[mode] = ~~GT.dxccInfo[finalDxcc].worked_modes[mode] + 1;
      }

      GT.dxccInfo[finalDxcc].confirmed |= didConfirm;
      if (didConfirm)
      {
        GT.dxccInfo[finalDxcc].confirmed_bands[band] = ~~GT.dxccInfo[finalDxcc].confirmed_bands[band] + 1;
        GT.dxccInfo[finalDxcc].confirmed_modes[mode] = ~~GT.dxccInfo[finalDxcc].confirmed_modes[mode] + 1;
      }

      if (cqz && cqz.length > 0)
      {
        GT.cqZones[cqz].worked |= worked;
        if (worked)
        {
          GT.cqZones[cqz].worked_bands[band] = ~~GT.cqZones[cqz].worked_bands[band] + 1;
          GT.cqZones[cqz].worked_modes[mode] = ~~GT.cqZones[cqz].worked_modes[mode] + 1;
        }

        GT.cqZones[cqz].confirmed |= didConfirm;
        if (didConfirm)
        {
          GT.cqZones[cqz].confirmed_bands[band] = ~~GT.cqZones[cqz].confirmed_bands[band] + 1;
          GT.cqZones[cqz].confirmed_modes[mode] = ~~GT.cqZones[cqz].confirmed_modes[mode] + 1;
        }
      }

      if (ituz && ituz.length > 0)
      {
        GT.ituZones[ituz].worked |= worked;
        if (worked)
        {
          GT.ituZones[ituz].worked_bands[band] = ~~GT.ituZones[ituz].worked_bands[band] + 1;
          GT.ituZones[ituz].worked_modes[mode] = ~~GT.ituZones[ituz].worked_modes[mode] + 1;
        }

        GT.ituZones[ituz].confirmed |= didConfirm;
        if (didConfirm)
        {
          GT.ituZones[ituz].confirmed_bands[band] = ~~GT.ituZones[ituz].confirmed_bands[band] + 1;
          GT.ituZones[ituz].confirmed_modes[mode] = ~~GT.ituZones[ituz].confirmed_modes[mode] + 1;
        }
      }

      if (finalGrid.length > 0)
      {
        var gridCheck = finalGrid.substr(0, 4);

        if (gridCheck in GT.us48Data)
        {
          GT.us48Data[gridCheck].worked |= worked;

          if (worked)
          {
            GT.us48Data[gridCheck].worked_bands[band] = ~~GT.us48Data[gridCheck].worked_bands[band] + 1;
            GT.us48Data[gridCheck].worked_modes[mode] = ~~GT.us48Data[gridCheck].worked_modes[mode] + 1;
          }

          GT.us48Data[gridCheck].confirmed |= didConfirm;

          if (didConfirm)
          {
            GT.us48Data[gridCheck].confirmed_bands[band] = ~~GT.us48Data[gridCheck].confirmed_bands[band] + 1;
            GT.us48Data[gridCheck].confirmed_modes[mode] = ~~GT.us48Data[gridCheck].confirmed_modes[mode] + 1;
          }
        }
      }

      for (var key in GT.QSOhash[i].vucc_grids)
      {
        var grid = GT.QSOhash[i].vucc_grids[key].substr(0, 4);
        if (grid in GT.us48Data)
        {
          GT.us48Data[grid].worked |= worked;
          if (worked)
          {
            GT.us48Data[grid].worked_bands[band] = ~~GT.us48Data[grid].worked_bands[band] + 1;
            GT.us48Data[grid].worked_modes[mode] = ~~GT.us48Data[grid].worked_modes[mode] + 1;
          }

          GT.us48Data[grid].confirmed |= didConfirm;
          if (didConfirm)
          {
            GT.us48Data[grid].confirmed_bands[band] = ~~GT.us48Data[grid].confirmed_bands[band] + 1;
            GT.us48Data[grid].confirmed_modes[mode] = ~~GT.us48Data[grid].confirmed_modes[mode] + 1;
          }
        }
      }
    }
  }

  for (var layer in GT.viewInfo)
  {
    var search = GT[GT.viewInfo[layer][0]];
    var worked = (confirmed = 0);

    if (layer == 0)
    {
      for (var key in search)
      {
        if (search[key].rectangle.worked) worked++;
        if (search[key].rectangle.confirmed) confirmed++;
      }
      GT.viewInfo[layer][2] = worked;
      GT.viewInfo[layer][3] = confirmed;
    }
    else if (layer == 5)
    {
      for (var key in search)
      {
        if (search[key].geo != "deleted")
        {
          if (search[key].worked) worked++;
          if (search[key].confirmed) confirmed++;
        }
      }
      GT.viewInfo[layer][2] = worked;
      GT.viewInfo[layer][3] = confirmed;
    }
    else
    {
      for (var key in search)
      {
        if (search[key].worked) worked++;
        if (search[key].confirmed) confirmed++;
      }
      GT.viewInfo[layer][2] = worked;
      GT.viewInfo[layer][3] = confirmed;
    }
  }

  redrawLiveGrids(false);
  reloadInfo();
  setHomeGridsquare();
  setTrophyOverlay(GT.currentOverlay);
  updateCountStats();
  redrawParks();
}

function toggleAlertMute()
{
  GT.audioSettings.alertMute ^= 1;
  alertMuteImg.src = GT.alertImageArray[GT.audioSettings.alertMute];
  if (GT.audioSettings.alertMute == 1)
  {
    window.speechSynthesis.cancel();
  }
  saveAudioSettings();
}

function togglePushPinMode()
{
  GT.pushPinMode = !GT.pushPinMode;
  GT.appSettings.pushPinMode = GT.pushPinMode;
  pinImg.src = GT.pinImageArray[GT.pushPinMode == false ? 0 : 1];

  gridModeDiv.style.display = GT.pushPinMode ? "" : "none";

  clearTempGrids();
  redrawGrids();
}

function toggleGtShareEnable()
{
  if (GT.appSettings.gtShareEnable == true)
  {
    GT.appSettings.gtShareEnable = false;
  }
  else GT.appSettings.gtShareEnable = true;

  setGtShareButtons();
  goProcessRoster();
}

function setGtShareButtons()
{
  if (GT.appSettings.gtShareEnable == true && GT.mapSettings.offlineMode == false)
  {
    msgButton.style.display = GT.appSettings.gtMsgEnable ? "" : "none";

    gtFlagButton.style.display = "";
    if (GT.appSettings.gtFlagImgSrc > 0)
    {
      GT.layerVectors.gtflags.setVisible(true);
    }
    else
    {
      GT.layerVectors.gtflags.setVisible(false);
    }
  }
  else
  {
    GT.oamsBandActivityData = null;
    renderBandActivity();

    msgButton.style.display = "none";
    gtFlagButton.style.display = "none";
    GT.layerVectors.gtflags.setVisible(false);
    clearGtFlags();
    // Clear list
    GT.gtFlagPins = Object()
    GT.gtMessages = Object();
    GT.gtUnread = Object();
    GT.gtCallsigns = Object();
    GT.gtSentAwayToCid = Object();

    conditionsButton.style.background = "";
    conditionsButton.innerHTML = "<img src=\"img/conditions.png\" class=\"buttonImg\" />";

    if (GT.chatWindowInitialized)
    {
      try
      {
        showMessaging(false);
        GT.chatWindowHandle.window.allCallDiv.innerHTML = "";
        GT.chatWindowHandle.window.updateCount();
      }
      catch (e)
      {
        console.error(e);
      }
    }
    goProcessRoster();
  }

  gtShareFlagImg.src = GT.gtShareFlagImageArray[GT.appSettings.gtShareEnable == false ? 0 : 1];
}

function setMulticastIp()
{
  GT.appSettings.wsjtIP = multicastIpInput.value;
}

function setMulticastEnable(checkbox)
{
  if (checkbox.checked == true)
  {
    multicastTD.style.display = "";
    if (ValidateMulticast(multicastIpInput))
    {
      GT.appSettings.wsjtIP = multicastIpInput.value;
    }
    else
    {
      GT.appSettings.wsjtIP = "";
    }
  }
  else
  {
    multicastTD.style.display = "none";
    GT.appSettings.wsjtIP = "";
  }
  GT.appSettings.multicast = checkbox.checked;
}

function setUdpForwardEnable(checkbox)
{
  if (checkbox.checked)
  {
    if (
      ValidatePort(
        udpForwardPortInput,
        null,
        CheckForwardPortIsNotReceivePort
      ) &&
      ValidateIPaddress(udpForwardIpInput, null)
    )
    {
      GT.appSettings.wsjtForwardUdpEnable = checkbox.checked;
      return;
    }
  }
  checkbox.checked = false;
  GT.appSettings.wsjtForwardUdpEnable = checkbox.checked;
}

function setGTspotEnable(checkbox)
{
  GT.appSettings.gtSpotEnable = checkbox.checked;

  if (GT.appSettings.gtSpotEnable == false)
  {
    GT.spotCollector = {};
    GT.spotDetailsCollector = {};
    GT.decodeCollector = {};
  }
  GT.gtLiveStatusUpdate = true;
}

function setOamsBandActivity(checkbox)
{
  GT.appSettings.oamsBandActivity = checkbox.checked;

  if (GT.appSettings.oamsBandActivity == false)
  {
    bandActivityNeighborDiv.style.display = "none";
    GT.oamsBandActivityData = null;
  }
  else
  {
    bandActivityNeighborDiv.style.display = "";
    oamsBandActivityCheck();
  }
  renderBandActivity();
}

function setOamsBandActivityNeighbors(checkbox)
{
  GT.appSettings.oamsBandActivityNeighbors = checkbox.checked;
  oamsBandActivityCheck();
}

function setOamsSimplepush(checkbox)
{
  GT.msgSettings.msgSimplepush = checkbox.checked;
  simplePushDiv.style.display = GT.msgSettings.msgSimplepush == true ? "" : "none";
  GT.localStorage.msgSettings = JSON.stringify(GT.msgSettings);
}

function setOamsSimplepushChat(checkbox)
{
  GT.msgSettings.msgSimplepushChat = checkbox.checked;
  // One must be checked, otherwise why is the service enabled?
  if (GT.msgSettings.msgSimplepushChat == false && GT.msgSettings.msgSimplepushRoster == false)
  {
    GT.msgSettings.msgSimplepushRoster = msgSimplepushRoster.checked = true;
  }
  GT.localStorage.msgSettings = JSON.stringify(GT.msgSettings);
}

function setOamsSimplepushRoster(checkbox)
{
  GT.msgSettings.msgSimplepushRoster = checkbox.checked;
  // One must be checked, otherwise why is the service enabled?
  if (GT.msgSettings.msgSimplepushRoster == false && GT.msgSettings.msgSimplepushChat == false)
  {
    GT.msgSettings.msgSimplepushChat = msgSimplepushChat.checked = true;
  }
  GT.localStorage.msgSettings = JSON.stringify(GT.msgSettings);
}

function setOamsPushover(checkbox)
{
  GT.msgSettings.msgPushover = checkbox.checked;
  pushOverDiv.style.display = GT.msgSettings.msgPushover == true ? "" : "none";
  GT.localStorage.msgSettings = JSON.stringify(GT.msgSettings);
}

function setOamsPushoverChat(checkbox)
{
  GT.msgSettings.msgPushoverChat = checkbox.checked;
  // One must be checked, otherwise why is the service enabled?
  if (GT.msgSettings.msgPushoverChat == false && GT.msgSettings.msgPushoverRoster == false)
  {
    GT.msgSettings.msgPushoverRoster = msgPushoverRoster.checked = true;
  }
  GT.localStorage.msgSettings = JSON.stringify(GT.msgSettings);
}

function setOamsPushoverRoster(checkbox)
{
  GT.msgSettings.msgPushoverRoster = checkbox.checked;
  // One must be checked, otherwise why is the service enabled?
  if (GT.msgSettings.msgPushoverRoster == false && GT.msgSettings.msgPushoverChat == false)
  {
    GT.msgSettings.msgPushoverChat = msgPushoverChat.checked = true;
  }
  GT.localStorage.msgSettings = JSON.stringify(GT.msgSettings);
}

function setMsgEnable(checkbox)
{
  GT.appSettings.gtMsgEnable = checkbox.checked;
  if (GT.appSettings.gtShareEnable == true)
  {
    if (GT.appSettings.gtMsgEnable == true) { msgButton.style.display = ""; }
    else
    {
      msgButton.style.display = "none";
      if (GT.chatWindowInitialized)
      {
        showMessaging(false);
      }
    }
  }
  goProcessRoster();
  GT.gtLiveStatusUpdate = true;
  setMsgSettingsView();
}

function newMessageSetting(whichSetting)
{
  if (whichSetting.id in GT.msgSettings)
  {
    GT.msgSettings[whichSetting.id] = whichSetting.value;
    GT.localStorage.msgSettings = JSON.stringify(GT.msgSettings);
    setMsgSettingsView();
  }
}

function downloadAcknowledgements()
{
  if (GT.mapSettings.offlineMode == false)
  {
    getBuffer(
      "https://storage.googleapis.com/gt_app/acknowledgements.json",
      updateAcks,
      null,
      "http",
      80
    );

    // check again tomorrow
    nodeTimers.setTimeout(downloadAcknowledgements, 86400000);
  }
  else
  {
    // check in 5 minutes, maybe they went online
    nodeTimers.setTimeout(downloadAcknowledgements, 300000);
  }
}

GT.non_us_bands = [
  "630m",
  "160m",
  "80m",
  "60m",
  "40m",
  "30m",
  "20m",
  "17m",
  "15m",
  "12m",
  "10m",
  "6m",
  "4m",
  "2m"
];

GT.us_bands = [
  "630m",
  "160m",
  "80m",
  "60m",
  "40m",
  "30m",
  "20m",
  "17m",
  "15m",
  "12m",
  "10m",
  "6m",
  "2m"
];

function renderBandActivity()
{
  var buffer = "";
  if (typeof GT.bandActivity.lines[GT.appSettings.myMode] != "undefined" || GT.oamsBandActivityData != null)
  {
    var lines = (GT.appSettings.myMode in GT.bandActivity.lines) ? GT.bandActivity.lines[GT.appSettings.myMode] : [];
    var bands = (GT.myDXCC in GT.callsignDatabaseUSplus) ? GT.us_bands : GT.non_us_bands;
    var bandData = {};
    var maxValue = 0;

    for (var i = 0; i < bands.length; i++)
    {
      bandData[bands[i]] = { pskScore: 0, pskSpots: 0, pskTx: 0, pskRx: 0, oamsRxSpots: 0, oamsTxSpots: 0, oamsTx: 0, oamsRx: 0, oamsDecodes: 0, oamsScore: 0 };
    }

    for (var x = 0; x < lines.length; x++)
    {
      var firstChar = lines[x].charCodeAt(0);
      if (firstChar != 35 && lines[x].length > 1)
      {
        // doesn't begins with # and has something
        var values = lines[x].trim().split(" ");
        var band = formatBand(Number(Number(values[0]) / 1000000));

        if (band in bandData)
        {
          var place = bandData[band];

          place.pskScore += Number(values[1]);
          place.pskSpots += Number(values[2]);
          place.pskTx += Number(values[3]);
          place.pskRx += Number(values[4]);
          if (maxValue < place.pskScore) maxValue = place.pskScore;
          if (maxValue < place.pskSpots) maxValue = place.pskSpots;
        }
      }
    }

    if (GT.appSettings.gtShareEnable == true && GT.appSettings.oamsBandActivity == true && GT.oamsBandActivityData)
    {
      for (const grid in GT.oamsBandActivityData)
      {
        for (const band in GT.oamsBandActivityData[grid])
        {
          if (band in bandData)
          {
            var place = bandData[band];
            var data = GT.oamsBandActivityData[grid][band];

            place.oamsScore ??= 0;
            place.oamsDecodes += data.d;
            place.oamsRxSpots += data.rS;
            place.oamsTxSpots += data.tS;
            place.oamsTx += data.t;
            place.oamsRx += data.r;

            if (data.r > 0)
            {
              place.oamsScore += parseInt((data.d > data.rS) ? (data.d / data.r) + (data.t > 0 ? data.tS / data.t : 0) : (data.rS / data.r) + (data.t > 0 ? data.tS / data.t : 0));
            }
            else
            {
              place.oamsScore += parseInt(data.t > 0 ? data.tS / data.t : 0);
            }
            if (maxValue < place.oamsScore) maxValue = place.oamsScore;
          }
        }
      }
    }

    let scaleFactor = 1.0;
    if (maxValue > 26)
    {
      scaleFactor = 26 / maxValue;
    }
    for (const band in bandData)
    {
      let blockMyBand = (band == GT.appSettings.myBand) ? " class='myBand' " : "";
      let title;
      let blueBarValue;

      if (GT.appSettings.gtShareEnable == true && GT.appSettings.oamsBandActivity == true)
      {
        title = "OAMS\n";
        title += "\tScore: " + bandData[band].oamsScore + "\n\tDecodes: " + bandData[band].oamsDecodes + "\n\tTX-Spots: " + bandData[band].oamsTxSpots + "\n\tRX-Spots: " + bandData[band].oamsRxSpots + "\n\tTx: " + bandData[band].oamsTx + "\tRx: " + bandData[band].oamsRx;
        title += "\nPSK-Reporter\n";
        title += "\tScore: " + bandData[band].pskScore + "\n\tSpots: " + bandData[band].pskSpots + "\n\tTx: " + bandData[band].pskTx + "\tRx: " + bandData[band].pskRx;
        blueBarValue = (bandData[band].oamsScore * scaleFactor + 1);
      }
      else
      {
        title = "Score: " + bandData[band].pskScore + "\nSpots: " + bandData[band].pskSpots + "\nTx: " + bandData[band].pskTx + "\tRx: " + bandData[band].pskRx;
        blueBarValue = (bandData[band].pskSpots * scaleFactor + 1);
      }

      buffer += "<div title='" + title + "' style='display:inline-block;margin:1px;' class='aBand'>";
      buffer += "<div style='height: " + (bandData[band].pskScore * scaleFactor + 1) + "px;' class='barTx'></div>"; buffer += "<div style='height: " + blueBarValue + "px;' class='barRx'></div>";
      buffer += "<div style='font-size:10px' " + blockMyBand + ">" + parseInt(band) + "</div>";
      buffer += "</div>";
    }
  }
  else
  {
    buffer = "..no data yet..";
  }
  graphDiv.innerHTML = buffer;
  if (GT.baWindowInitialized == true)
  {
    GT.baWindowHandle.window.graphDiv.innerHTML = buffer;
  }
}

function pskBandActivityCallback(buffer, flag)
{
  var result = String(buffer);
  if (result.indexOf("frequency score") > -1)
  {
    // looks good so far
    GT.bandActivity.lines[GT.appSettings.myMode] = result.split("\n");
    GT.bandActivity.lastUpdate[GT.appSettings.myMode] = GT.timeNow + 600;
    GT.localStorage.bandActivity = JSON.stringify(GT.bandActivity);
  }

  renderBandActivity();
}
/* FIXME ******************************************************************************
   Should we somewhere in settings, have a checkbox to enable / disable PSK spots
   specifically? We can disable the overall spots, both PSK and OAMS, and OAMS has a
   checkbox in the OAMS tab. I'm thinking for the situation where I only want to
   pull in OAMS spots and not PSK reporter's spots.

   Answer: this the Band Activity, not PSK Spots, different API. But we can revisit as
   we now have OAMS Band Activity - Tag
   ************************************************************************************
*/
function pskGetBandActivity()
{
  if (GT.mapSettings.offlineMode == true) return;
  if (typeof GT.bandActivity.lastUpdate[GT.appSettings.myMode] == "undefined")
  {
    GT.bandActivity.lastUpdate[GT.appSettings.myMode] = 0;
  }

  if (GT.appSettings.myMode.length > 0 && GT.appSettings.myGrid.length > 0 && GT.timeNow > GT.bandActivity.lastUpdate[GT.appSettings.myMode])
  {
    getBuffer(
      "https://pskreporter.info/cgi-bin/psk-freq.pl?mode=" + GT.appSettings.myMode + "&grid=" + GT.appSettings.myGrid.substr(0, 4) + "&cb=" + timeNowSec(),
      pskBandActivityCallback,
      null,
      "https",
      443
    );
  }

  renderBandActivity();

  if (GT.pskBandActivityTimerHandle != null)
  {
    nodeTimers.clearInterval(GT.pskBandActivityTimerHandle);
  }

  GT.pskBandActivityTimerHandle = nodeTimers.setInterval(pskGetBandActivity, 601000); // every 20 minutes, 1 second
}

function getIniFromApp(appName)
{
  var result = {};
  result.port = -1;
  result.ip = "";
  result.MyCall = "NOCALL";
  result.MyGrid = "";
  result.MyBand = "";
  result.MyMode = "";
  result.LogPath = "";
  result.N1MMServer = "";
  result.N1MMServerPort = 0;
  result.BroadcastToN1MM = false;
  result.appName = appName;
  var wsjtxCfgPath = "";
  var logPath = "";
  var appData = electron.ipcRenderer.sendSync("getPath","appData");

  if (GT.platform == "windows")
  {
    let basename = path.basename(appData);
    if (basename != "Local")
    {
      appData = appData.replace(basename, "Local");
    }

    wsjtxCfgPath = path.join(appData, appName, appName + ".ini");
    logPath = path.join(appData, appName, "wsjtx_log.adi" );
  }
  else if (GT.platform == "mac")
  {
    wsjtxCfgPath =  path.join(process.env.HOME, "Library/Preferences/WSJT-X.ini");
    logPath = path.join(process.env.HOME, "Library/Application Support/WSJT-X/wsjtx_log.adi");
  }
  else
  {
    wsjtxCfgPath = path.join(process.env.HOME, ".config/" + appName + ".ini");
    logPath = path.join(process.env.HOME, ".local/share/" + appName, "wsjtx_log.adi");
  }
  if (fs.existsSync(wsjtxCfgPath))
  {
    var fileBuf = fs.readFileSync(wsjtxCfgPath, "ascii");
    var fileArray = fileBuf.split("\n");
    for (var key in fileArray) fileArray[key] = fileArray[key].trim();
    result.LogPath = logPath;
    for (var x = 0; x < fileArray.length; x++)
    {
      var indexOfPort = fileArray[x].indexOf("UDPServerPort=");
      if (indexOfPort == 0)
      {
        var portSplit = fileArray[x].split("=");
        result.port = portSplit[1];
      }
      indexOfPort = fileArray[x].indexOf("UDPServer=");
      if (indexOfPort == 0)
      {
        var portSplit = fileArray[x].split("=");
        result.ip = portSplit[1];
      }
      indexOfPort = fileArray[x].indexOf("MyCall=");
      if (indexOfPort == 0)
      {
        var portSplit = fileArray[x].split("=");
        result.MyCall = portSplit[1];
      }
      indexOfPort = fileArray[x].indexOf("MyGrid=");
      if (indexOfPort == 0)
      {
        var portSplit = fileArray[x].split("=");
        result.MyGrid = portSplit[1].substr(0, 6);
      }
      indexOfPort = fileArray[x].indexOf("Mode=");
      if (indexOfPort == 0)
      {
        var portSplit = fileArray[x].split("=");
        result.MyMode = portSplit[1];
      }
      indexOfPort = fileArray[x].indexOf("DialFreq=");
      if (indexOfPort == 0)
      {
        var portSplit = fileArray[x].split("=");
        result.MyBand = formatBand(Number(portSplit[1] / 1000000));
      }
      indexOfPort = fileArray[x].indexOf("N1MMServerPort=");
      if (indexOfPort == 0)
      {
        var portSplit = fileArray[x].split("=");
        result.N1MMServerPort = portSplit[1];
      }
      indexOfPort = fileArray[x].indexOf("N1MMServer=");
      if (indexOfPort == 0)
      {
        var portSplit = fileArray[x].split("=");
        result.N1MMServer = portSplit[1];
      }
      indexOfPort = fileArray[x].indexOf("BroadcastToN1MM=");
      if (indexOfPort == 0)
      {
        var portSplit = fileArray[x].split("=");
        result.BroadcastToN1MM = portSplit[1] == "true";
      }
    }
  }
  else
  {
    result = null;
  }
  return result;
}

function checkRunningProcesses()
{
  var child_process = require("child_process");
  var list = GT.platform == "windows" ? child_process.execFileSync("tasklist.exe") : child_process.execFileSync("ps", ["-aef"]);

  GT.wsjtxProcessRunning = list.indexOf("wsjtx") > -1;
}

function updateRunningProcesses()
{
  try
  {
    checkRunningProcesses();
  }
  catch (e)
  {
    GT.wsjtxProcessRunning = false;
  }
  runningAppsDiv.innerHTML = "WSJT-X ";
  if (GT.wsjtxProcessRunning == true) runningAppsDiv.innerHTML += " - up - ";
  else runningAppsDiv.innerHTML += " - ? - ";
  GT.wsjtxIni = getIniFromApp("WSJT-X");
  if (GT.wsjtxIni && GT.wsjtxIni.port > -1)
  {
    runningAppsDiv.innerHTML += "<b>(" + GT.wsjtxIni.ip + " / " + GT.wsjtxIni.port + ")</b> ";
  }
  else runningAppsDiv.innerHTML += "<b>(?)</b> ";
}

function updateBasedOnIni()
{
  var which = null;
  var count = 0;
  if (GT.wsjtxProcessRunning)
  {
    count++;
  }

  // UdpPortNotSet
  if (GT.appSettings.wsjtUdpPort == 0 && count < 2)
  {
    if (GT.wsjtxProcessRunning || count == 1)
    {
      which = GT.wsjtxIni;
    }

    if (which != null && which.port > -1)
    {
      GT.appSettings.wsjtUdpPort = which.port;
      GT.appSettings.wsjtIP = which.ip;
    }

    if (which == null)
    {
      GT.appSettings.wsjtUdpPort = 2237;
      GT.appSettings.wsjtIP = "127.0.0.1";
    }

    if (ipToInt(GT.appSettings.wsjtIP) >= ipToInt("224.0.0.0") && ipToInt(GT.appSettings.wsjtIP) < ipToInt("240.0.0.0"))
    {
      GT.appSettings.multicast = true;
    }
    else
    {
      GT.appSettings.multicast = false;
    }
  }
  // Which INI do we load?
  if (GT.appSettings.wsjtUdpPort > 0)
  {
    which = GT.wsjtxIni;

    if (which != null)
    {
      GT.appSettings.myCall = which.MyCall;
      GT.appSettings.myGrid = GT.appSettings.myRawGrid = which.MyGrid;
      GT.lastBand = GT.appSettings.myBand;
      GT.lastMode = GT.appSettings.myMode;
      GT.wsjtxLogPath = which.LogPath;
    }

    if (which != null && which.BroadcastToN1MM == true && GT.N1MMSettings.enable == true)
    {
      if (which.N1MMServer == GT.N1MMSettings.ip && which.N1MMServerPort == GT.N1MMSettings.port)
      {
        buttonN1MMCheckBox.checked = GT.N1MMSettings.enable = false;
        GT.localStorage.N1MMSettings = JSON.stringify(GT.N1MMSettings);
        alert(which.appName + " N1MM Logger+ is enabled with same settings, disabled GridTracker N1MM logger");
      }
    }

    if (which != null)
    {
      if (GT.appSettings.wsjtIP == "")
      {
        GT.appSettings.wsjtIP = which.ip;
      }
    }
  }
}

function CheckReceivePortIsNotForwardPort(value)
{
  if (udpForwardIpInput.value == "127.0.0.1" && udpForwardPortInput.value == value && GT.appSettings.wsjtIP == "" && udpForwardEnable.checked)
  {
    return false;
  }

  return true;
}

function CheckForwardPortIsNotReceivePort(value)
{
  if (udpForwardIpInput.value == "127.0.0.1" && udpPortInput.value == value && GT.appSettings.wsjtIP == "")
  {
    return false;
  }

  return true;
}

function setForwardIp()
{
  GT.appSettings.wsjtForwardUdpIp = udpForwardIpInput.value;
  if (ValidatePort(udpPortInput, null, CheckReceivePortIsNotForwardPort))
  {
    setUdpPort();
  }
  ValidatePort(udpForwardPortInput, null, CheckForwardPortIsNotReceivePort);
}

function setForwardPort()
{
  GT.appSettings.wsjtForwardUdpPort = udpForwardPortInput.value;
  ValidateIPaddress(udpForwardIpInput, null);
  if (ValidatePort(udpPortInput, null, CheckReceivePortIsNotForwardPort))
  {
    setUdpPort();
  }
}

function validIpKeys(value)
{
  if (value == 46) return true;
  return value >= 48 && value <= 57;
}

function validNumberKeys(value)
{
  return value >= 48 && value <= 57;
}

function validateNumAndLetter(input)
{
  if (/\d/.test(input) && /[A-Z]/.test(input)) return true;
  else return false;
}

function validCallsignsKeys(value)
{
  if (value == 44) return true;
  if (value >= 47 && value <= 57) return true;
  if (value >= 65 && value <= 90) return true;
  return value >= 97 && value <= 122;
}

function validGridKeys(value)
{
  if (value == 44) return true;
  if (value >= 48 && value <= 57) return true;
  if (value >= 65 && value <= 90) return true;
  return value >= 97 && value <= 122;
}

function ValidateCallsigns(inputText)
{
  inputText.value = inputText.value.toUpperCase();
  var callsigns = inputText.value.split(",");
  var passed = false;
  for (var call in callsigns)
  {
    if (callsigns[call].length > 0)
    {
      if (/\d/.test(callsigns[call]) && /[A-Z]/.test(callsigns[call]))
      {
        passed = true;
      }
      else
      {
        passed = false;
        break;
      }
    }
    else
    {
      passed = false;
      break;
    }
  }

  if (passed)
  {
    inputText.style.color = "#FF0";
    inputText.style.backgroundColor = "green";
  }
  else
  {
    inputText.style.color = "#000";
    inputText.style.backgroundColor = "yellow";
  }
  return passed;
}

function ValidateGrids(inputText)
{
  inputText.value = inputText.value.toUpperCase();
  var grids = inputText.value.split(",");
  var passed = false;
  for (var grid in grids)
  {
    if (grids[grid].length == 4)
    {
      if (/\d/.test(grids[grid]) && /[A-Z]/.test(grids[grid]))
      {
        passed = true;
      }
      else
      {
        passed = false;
        break;
      }
    }
    else
    {
      passed = false;
      break;
    }
  }

  if (passed)
  {
    inputText.style.color = "#FF0";
    inputText.style.backgroundColor = "green";
  }
  else
  {
    inputText.style.color = "#000";
    inputText.style.backgroundColor = "yellow";
  }
  return passed;
}

function ValidateCallsign(inputText, validDiv)
{
  addError.innerHTML = "";
  if (inputText.value.length > 0)
  {
    var passed = false;
    inputText.value = inputText.value.toUpperCase();
    if (/\d/.test(inputText.value) || /[A-Z]/.test(inputText.value))
    {
      passed = true;
    }
    if (passed)
    {
      inputText.style.color = "#FF0";
      inputText.style.backgroundColor = "green";
      if (validDiv) validDiv.innerHTML = "Valid!";
      return true;
    }
    else
    {
      inputText.style.color = "#000";
      inputText.style.backgroundColor = "yellow";
      if (validDiv) validDiv.innerHTML = "Invalid!";
      return false;
    }
  }
  else
  {
    inputText.style.color = "#000";
    inputText.style.backgroundColor = "yellow";
    if (validDiv) validDiv.innerHTML = "Invalid!";
    return false;
  }
}

function ValidateGridsquareOnly4(inputText, validDiv)
{
  addError.innerHTML = "";
  if (inputText.value.length == 4)
  {
    var gridSquare = "";
    var LETTERS = inputText.value.substr(0, 2).toUpperCase();
    var NUMBERS = inputText.value.substr(2, 2).toUpperCase();
    if (/^[A-R]+$/.test(LETTERS) && /^[0-9]+$/.test(NUMBERS))
    {
      gridSquare = LETTERS + NUMBERS;
    }
    if (gridSquare != "")
    {
      inputText.style.color = "#FF0";
      inputText.style.backgroundColor = "green";
      inputText.value = gridSquare;
      if (validDiv) validDiv.innerHTML = "Valid!";
      return true;
    }
    else
    {
      inputText.style.color = "#FFF";
      inputText.style.backgroundColor = "red";
      if (validDiv) validDiv.innerHTML = "Invalid!";
      return false;
    }
  }
  else
  {
    inputText.style.color = "#000";
    inputText.style.backgroundColor = "yellow";
    if (validDiv) validDiv.innerHTML = "Valid!";
    return true;
  }
}

function ValidateGridsquare(inputText, validDiv)
{
  if (inputText.value.length == 4 || inputText.value.length == 6)
  {
    var gridSquare = "";
    var LETTERS = inputText.value.substr(0, 2).toUpperCase();
    var NUMBERS = inputText.value.substr(2, 2).toUpperCase();
    if (/^[A-R]+$/.test(LETTERS) && /^[0-9]+$/.test(NUMBERS))
    {
      gridSquare = LETTERS + NUMBERS;
    }
    if (inputText.value.length > 4)
    {
      var LETTERS_SUB = inputText.value.substr(4, 2);
      gridSquare = "";
      if (
        /^[A-R]+$/.test(LETTERS) &&
        /^[0-9]+$/.test(NUMBERS) &&
        /^[A-Xa-x]+$/.test(LETTERS_SUB)
      )
      {
        gridSquare = LETTERS + NUMBERS + LETTERS_SUB;
      }
    }
    if (gridSquare != "")
    {
      inputText.style.color = "#FF0";
      inputText.style.backgroundColor = "green";
      inputText.value = gridSquare;
      if (validDiv) validDiv.innerHTML = "Valid!";
      return true;
    }
    else
    {
      inputText.style.color = "#FFF";
      inputText.style.backgroundColor = "red";
      if (validDiv) validDiv.innerHTML = "Invalid!";
      return false;
    }
  }
  else
  {
    inputText.style.color = "#FFF";
    inputText.style.backgroundColor = "red";
    if (validDiv) validDiv.innerHTML = "Invalid!";
    return false;
  }
}

function ipToInt(ip)
{
  return ip
    .split(".")
    .map((octet, index, array) =>
    {
      return parseInt(octet) * Math.pow(256, array.length - index - 1);
    })
    .reduce((prev, curr) =>
    {
      return prev + curr;
    });
}

function ValidateMulticast(inputText)
{
  var ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (inputText.value.match(ipformat))
  {
    if (inputText.value != "0.0.0.0" && inputText.value != "255.255.255.255")
    {
      var ipInt = ipToInt(inputText.value);
      if (ipInt >= ipToInt("224.0.0.0") && ipInt < ipToInt("240.0.0.0"))
      {
        if (ipInt > ipToInt("224.0.0.255"))
        {
          inputText.style.color = "black";
          inputText.style.backgroundColor = "yellow";
        }
        else
        {
          inputText.style.color = "#FF0";
          inputText.style.backgroundColor = "green";
        }
        return true;
      }
      else
      {
        inputText.style.color = "#FFF";
        inputText.style.backgroundColor = "red";
        return false;
      }
    }
    else
    {
      inputText.style.color = "#FFF";
      inputText.style.backgroundColor = "red";
      return false;
    }
  }
  else
  {
    inputText.style.color = "#FFF";
    inputText.style.backgroundColor = "red";
    return false;
  }
}

function ValidateIPaddress(inputText, checkBox)
{
  var ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (inputText.value.match(ipformat))
  {
    if (inputText.value != "0.0.0.0" && inputText.value != "255.255.255.255")
    {
      inputText.style.color = "#FF0";
      inputText.style.backgroundColor = "green";
      return true;
    }
    else
    {
      inputText.style.color = "#FFF";
      inputText.style.backgroundColor = "red";
      if (checkBox) checkBox.checked = false;
      return false;
    }
  }
  else
  {
    inputText.style.color = "#FFF";
    inputText.style.backgroundColor = "red";
    if (checkBox) checkBox.checked = false;
    return false;
  }
}

function ValidatePort(inputText, checkBox, callBackCheck)
{
  var value = Number(inputText.value);
  if (value > 1023 && value < 65536)
  {
    if (callBackCheck && !callBackCheck(value))
    {
      inputText.style.color = "#FFF";
      inputText.style.backgroundColor = "red";
      if (checkBox) checkBox.checked = false;
      return false;
    }
    else
    {
      inputText.style.color = "#FF0";
      inputText.style.backgroundColor = "green";
      return true;
    }
  }
  else
  {
    inputText.style.color = "#FFF";
    inputText.style.backgroundColor = "red";
    if (checkBox) checkBox.checked = false;
    return false;
  }
}

function workingCallsignEnableChanged(ele)
{
  GT.appSettings.workingCallsignEnable = ele.checked;
  applyCallsignsAndDateDiv.style.display = "";
}

function workingGridEnableChanged(ele)
{
  GT.appSettings.workingGridEnable = ele.checked;
  applyCallsignsAndDateDiv.style.display = "";
}

function workingDateEnableChanged(ele)
{
  GT.appSettings.workingDateEnable = ele.checked;
  applyCallsignsAndDateDiv.style.display = "";
}

function workingDateChanged()
{
  if (workingTimeValue.value.length == 0)
  {
    workingTimeValue.value = "00:00";
  }
  if (workingDateValue.value.length == 0)
  {
    workingDateValue.value = "1970-01-01";
  }

  var fields = workingDateValue.value.split("-");
  var time = workingTimeValue.value.split(":");

  GT.appSettings.workingDate =
    Date.UTC(
      parseInt(fields[0]),
      parseInt(fields[1]) - 1,
      parseInt(fields[2]),
      parseInt(time[0]),
      parseInt(time[1]),
      0
    ) / 1000;
  displayWorkingDate();
  if (GT.appSettings.workingDateEnable)
  {
    applyCallsignsAndDateDiv.style.display = "";
  }
}

function displayWorkingDate()
{
  var date = new Date(GT.appSettings.workingDate * 1000);
  workingDateString.innerHTML = dateToString(date);
}

function workingCallsignsChanged(ele)
{
  let tempWorkingCallsigns = {};
  let callsigns = ele.value.split(",");
  for (let call in callsigns)
  {
    tempWorkingCallsigns[callsigns[call]] = true;
  }
  if (callsigns.length > 0)
  {
    GT.appSettings.workingCallsigns = Object.assign({}, tempWorkingCallsigns);
    if (GT.appSettings.workingCallsignEnable) { applyCallsignsAndDateDiv.style.display = ""; }
  }
  else applyCallsignsAndDateDiv.style.display = "none";
}

function workingGridsChanged(ele)
{
  let tempWorkingGrids = {};
  let grids = ele.value.split(",");
  for (let grid in grids)
  {
    tempWorkingGrids[grids[grid]] = true;
  }
  if (grids.length > 0)
  {
    GT.appSettings.workingGrids = Object.assign({}, tempWorkingGrids);
    if (GT.appSettings.workingGridEnable) { applyCallsignsAndDateDiv.style.display = ""; }
  }
  else applyCallsignsAndDateDiv.style.display = "none";
}

function applyCallsignsAndDates()
{
  clearAndLoadQSOs();
  applyCallsignsAndDateDiv.style.display = "none";
}

function selectElementContents(el)
{
  if (document.createRange && window.getSelection)
  {
    var range = document.createRange();
    var sel = window.getSelection();
    sel.removeAllRanges();
    range.selectNodeContents(el);
    sel.addRange(range);
    var text = sel.toString();
    text = text.replace(/\t/g, ",");
    sel.removeAllRanges();
    selectNodeDiv.innerText = text;
    range.selectNodeContents(selectNodeDiv);
    sel.addRange(range);
    document.execCommand("copy");
    sel.removeAllRanges();
    selectNodeDiv.innerText = "";
  }
}

function loadMaidenHeadData()
{
  GT.dxccInfo = require(path.join(GT.GTappData, "mh-root-prefixed.json"));

  for (var key in GT.dxccInfo)
  {
    GT.dxccToAltName[GT.dxccInfo[key].dxcc] = GT.dxccInfo[key].name;
    GT.dxccToADIFName[GT.dxccInfo[key].dxcc] = GT.dxccInfo[key].aname;
    GT.altNameToDXCC[GT.dxccInfo[key].name] = GT.dxccInfo[key].dxcc;
    GT.dxccToCountryCode[GT.dxccInfo[key].dxcc] = GT.dxccInfo[key].cc;

    for (var x = 0; x < GT.dxccInfo[key].prefix.length; x++)
    {
      GT.prefixToMap[GT.dxccInfo[key].prefix[x]] = key;
    }
    delete GT.dxccInfo[key].prefix;

    for (var x = 0; x < GT.dxccInfo[key].direct.length; x++)
    {
      GT.directCallToDXCC[GT.dxccInfo[key].direct[x]] = GT.dxccInfo[key].dxcc;
    }
    delete GT.dxccInfo[key].direct;

    for (var val in GT.dxccInfo[key].prefixCQ)
    {
      GT.prefixToCQzone[val] = GT.dxccInfo[key].prefixCQ[val];
    }
    delete GT.dxccInfo[key].prefixCQ;

    for (var val in GT.dxccInfo[key].prefixITU)
    {
      GT.prefixToITUzone[val] = GT.dxccInfo[key].prefixITU[val];
    }
    delete GT.dxccInfo[key].prefixITU;

    for (var val in GT.dxccInfo[key].directCQ)
    {
      GT.directCallToCQzone[val] = GT.dxccInfo[key].directCQ[val];
    }
    delete GT.dxccInfo[key].directCQ;

    for (var val in GT.dxccInfo[key].directITU)
    {
      GT.directCallToITUzone[val] = GT.dxccInfo[key].directITU[val];
    }
    delete GT.dxccInfo[key].directITU;

    for (var x = 0; x < GT.dxccInfo[key].mh.length; x++)
    {
      if (!(GT.dxccInfo[key].mh[x] in GT.gridToDXCC)) { GT.gridToDXCC[GT.dxccInfo[key].mh[x]] = Array(); }
      GT.gridToDXCC[GT.dxccInfo[key].mh[x]].push(GT.dxccInfo[key].dxcc);
    }

    if (GT.dxccInfo[key].dxcc != 291) { delete GT.dxccInfo[key].mh; }
  }

  let dxccGeo = requireJson("data/dxcc.json");
  for (var key in dxccGeo.features)
  {
    var dxcc = dxccGeo.features[key].properties.dxcc_entity_code;
    GT.dxccInfo[dxcc].geo = dxccGeo.features[key];
  }

  let countyData = requireJson("data/counties.json");

  for (var id in countyData)
  {
    if (!(countyData[id].properties.st in GT.stateToCounty)) { GT.stateToCounty[countyData[id].properties.st] = Array(); }
    GT.stateToCounty[countyData[id].properties.st].push(id);

    var cnty = countyData[id].properties.st + "," + replaceAll(countyData[id].properties.n, " ", "").toUpperCase();

    if (!(cnty in GT.cntyToCounty)) { GT.cntyToCounty[cnty] = toProperCase(countyData[id].properties.n); }

    GT.countyData[cnty] = {};
    GT.countyData[cnty].geo = countyData[id];
    GT.countyData[cnty].worked = false;
    GT.countyData[cnty].confirmed = false;

    GT.countyData[cnty].worked_bands = {};
    GT.countyData[cnty].confirmed_bands = {};
    GT.countyData[cnty].worked_modes = {};
    GT.countyData[cnty].confirmed_modes = {};

    for (var x in countyData[id].properties.z)
    {
      var zipS = String(countyData[id].properties.z[x]);
      if (!(zipS in GT.zipToCounty))
      {
        GT.zipToCounty[zipS] = Array();
      }
      GT.zipToCounty[zipS].push(cnty);
    }
  }

  GT.shapeData = requireJson("data/shapes.json");
  GT.StateData = requireJson("data/state.json");

  for (var key in GT.StateData)
  {
    for (var x = 0; x < GT.StateData[key].mh.length; x++)
    {
      if (!(GT.StateData[key].mh[x] in GT.gridToState)) { GT.gridToState[GT.StateData[key].mh[x]] = Array(); }
      GT.gridToState[GT.StateData[key].mh[x]].push(GT.StateData[key].postal);
    }
  }

  GT.phonetics = requireJson("data/phone.json");
  GT.enums = requireJson("data/enums.json");

  for (var key in GT.dxccInfo)
  {
    if (GT.dxccInfo[key].pp != "" && GT.dxccInfo[key].geo != "deleted")
    {
      GT.enums[GT.dxccInfo[key].dxcc] = GT.dxccInfo[key].name;
    }
    if (key == 291)
    {
      // US Mainland
      for (var mh in GT.dxccInfo[key].mh)
      {
        var sqr = GT.dxccInfo[key].mh[mh];

        GT.us48Data[sqr] = {};
        GT.us48Data[sqr].name = sqr;
        GT.us48Data[sqr].worked = false;
        GT.us48Data[sqr].confirmed = false;
        GT.us48Data[sqr].worked_bands = {};
        GT.us48Data[sqr].confirmed_bands = {};
        GT.us48Data[sqr].worked_modes = {};
        GT.us48Data[sqr].confirmed_modes = {};
      }
      delete GT.dxccInfo[key].mh;
    }
  }

  GT.cqZones = requireJson("data/cqzone.json");
  GT.ituZones = requireJson("data/ituzone.json");

  for (var key in GT.StateData)
  {
    if (key.substr(0, 3) == "US-")
    {
      var shapeKey = key.substr(3, 2);
      var name = key;

      if (shapeKey in GT.shapeData)
      {
        GT.wasZones[name] = {};
        GT.wasZones[name].name = GT.StateData[key].name;
        GT.wasZones[name].geo = GT.shapeData[shapeKey];
        GT.wasZones[name].worked = false;
        GT.wasZones[name].confirmed = false;

        GT.wasZones[name].worked_bands = {};
        GT.wasZones[name].confirmed_bands = {};
        GT.wasZones[name].worked_modes = {};
        GT.wasZones[name].confirmed_modes = {};
      }
    }
    else if (key.substr(0, 3) == "CA-")
    {
      var shapeKey = key.substr(3, 2);
      var name = key;

      if (shapeKey in GT.shapeData)
      {
        GT.wacpZones[name] = {};
        GT.wacpZones[name].name = GT.StateData[key].name;
        GT.wacpZones[name].geo = GT.shapeData[shapeKey];
        GT.wacpZones[name].worked = false;
        GT.wacpZones[name].confirmed = false;

        GT.wacpZones[name].worked_bands = {};
        GT.wacpZones[name].confirmed_bands = {};
        GT.wacpZones[name].worked_modes = {};
        GT.wacpZones[name].confirmed_modes = {};
      }
    }
  }

  for (var key in GT.shapeData)
  {
    if (GT.shapeData[key].properties.type == "Continent")
    {
      var name = GT.shapeData[key].properties.name;
      GT.wacZones[name] = {};
      GT.wacZones[name].geo = GT.shapeData[key];

      GT.wacZones[name].worked = false;
      GT.wacZones[name].confirmed = false;

      GT.wacZones[name].worked_bands = {};
      GT.wacZones[name].confirmed_bands = {};
      GT.wacZones[name].worked_modes = {};
      GT.wacZones[name].confirmed_modes = {};
    }
  }



  var langDxcc = requireJson("i18n/" + GT.appSettings.locale + "-dxcc.json");
  if (langDxcc)
  {
    for (const dxcc in langDxcc)
    {
      if (dxcc in GT.dxccInfo)
      {
        GT.dxccInfo[dxcc].name = langDxcc[dxcc];
        GT.dxccToAltName[dxcc] = langDxcc[dxcc];
      }
    }
  }

  var langState = requireJson("i18n/" + GT.appSettings.locale + "-state.json");
  if (langState)
  {
    for (const state in langState)
    {
      if (state in GT.StateData)
      {
        GT.StateData[state].name = langState[state];
      }
    }
  }

  // Pass running data set to workers as needed.
  initAdifWorker();
}

GT.timezoneLayer = null;

function toggleTimezones()
{
  GT.mapSettings.timezonesEnable ^= 1;
  displayTimezones();
}

function displayTimezones()
{
  timezoneImg.style.filter = GT.mapSettings.timezonesEnable == 1 ? "" : "grayscale(1)";

  if (GT.mapSettings.timezonesEnable == 1)
  {
    if (GT.timezoneLayer == null)
    {
      GT.timezoneLayer = createGeoJsonLayer(
        "tz",
        path.resolve(resourcesPath, "data/combined-now.json"),
        "#000088FF",
        0.5
      );
      GT.map.addLayer(GT.timezoneLayer);
      GT.timezoneLayer.setVisible(false);
    }
    if (GT.currentOverlay == 0)
    {
      GT.timezoneLayer.setVisible(true);
    }
  }
  else
  {
    if (GT.timezoneLayer != null)
    {
      GT.timezoneLayer.getSource().clear();
      GT.map.removeLayer(GT.timezoneLayer);
      GT.timezoneLayer = null;
    }
  }
}

function drawAllGrids()
{
  if (GT.mapSettings.showAllGrids == false)
  {
    GT.layerSources.lineGrids.clear();
    GT.layerSources.longGrids.clear();
    GT.layerSources.bigGrids.clear();
    return;
  }

  let borderColor = "#000";
  let borderWeight = 0.5;

  for (let x = -178; x < 181; x += 2)
  {
    let points = [[x, -85], [x, 85]];

    if (x % 20 == 0) GT.useTransform ? borderWeight = 0.75 : borderWeight = 1.25;
    else borderWeight = 0.25;

    let newGridBox = lineString(points, 100);

    let featureStyle = new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: borderColor,
        width: borderWeight
      })
    });
    newGridBox.setStyle(featureStyle);

    GT.layerSources.lineGrids.addFeature(newGridBox);
  }

  for (let x = -85; x < 85; x++)
  {
    if (x % 10 == 0) GT.useTransform ? borderWeight = 0.75 : borderWeight = 1.25;
    else borderWeight = 0.25;

    if (GT.useTransform)
    {
      for (let y = -180; y < 180; y += 2)
      {
        let points = [[y, x], [y + 2, x]];
        let newGridBox = lineString(points, 10);

        let featureStyle = new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: borderColor,
            width: borderWeight
          })
        });
        newGridBox.setStyle(featureStyle);
        GT.layerSources.lineGrids.addFeature(newGridBox);
      }
    }
    else
    {
      let points = [[-180, x], [180, x]];
      let newGridBox = lineString(points);

      let featureStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: borderColor,
          width: borderWeight
        })
      });
      newGridBox.setStyle(featureStyle);
      GT.layerSources.lineGrids.addFeature(newGridBox);
    }
  }

  let font4String = GT.useTransform ? "normal 12px sans-serif" : "normal 16px sans-serif";
  let font2String = GT.useTransform ? "normal 16px sans-serif" : "normal 22px sans-serif";

  for (let x = 65; x < 83; x++)
  {
    for (let y = 65; y < 83; y++)
    {
      for (let a = 0; a < 10; a++)
      {
        for (let b = 0; b < 10; b++)
        {
          let LL = squareToLatLong(
            String.fromCharCode(x) +
            String.fromCharCode(y) +
            String(a) +
            String(b)
          );
          let Lat = LL.la2 - (LL.la2 - LL.la1) / 2;
          let Lon = LL.lo2 - (LL.lo2 - LL.lo1) / 2;
          let point = ol.proj.fromLonLat([Lon, Lat]);
          let feature = new ol.Feature({
            geometry: new ol.geom.Point(point)
          });

          let featureStyle = new ol.style.Style({
            text: new ol.style.Text({
              fill: new ol.style.Fill({ color: "#000" }),
              font: font4String,
              stroke: new ol.style.Stroke({
                color: "#88888888",
                width: 1
              }),
              text:
                String.fromCharCode(x) +
                String.fromCharCode(y) +
                String(a) +
                String(b),
              offsetY: 1
            })
          });
          feature.setStyle(featureStyle);
          if (GT.useTransform)
          {
            feature.getGeometry().transform("EPSG:3857", GT.mapSettings.projection);
          }
          GT.layerSources.longGrids.addFeature(feature);
        }
      }

      let LL = twoWideToLatLong(String.fromCharCode(x) + String.fromCharCode(y));
      let Lat = LL.la2 - (LL.la2 - LL.la1) / 2;
      let Lon = LL.lo2 - (LL.lo2 - LL.lo1) / 2;
      let point = ol.proj.fromLonLat([Lon, Lat]);
      feature = new ol.Feature(new ol.geom.Point(point));

      featureStyle = new ol.style.Style({
        text: new ol.style.Text({
          fill: new ol.style.Fill({ color: "#000" }),
          font: font2String,
          stroke: new ol.style.Stroke({
            color: "#88888888",
            width: 2
          }),
          text: String.fromCharCode(x) + String.fromCharCode(y)
        })
      });
      feature.setStyle(featureStyle);
      if (GT.useTransform)
      {
        feature.getGeometry().transform("EPSG:3857", GT.mapSettings.projection);
      }
      GT.layerSources.bigGrids.addFeature(feature);
    }
  }
}

function updateAcks(buffer)
{
  try
  {
    GT.acknowledgedCalls = JSON.parse(buffer);
    donateButton.style.display = (GT.appSettings.myCall in GT.acknowledgedCalls) ? "none" : "";
  }
  catch (e)
  {
    // can't write, somethings broke
  }
}

function mailThem(address)
{
  window.open("mailto:" + address, "_blank");
}

function openSite(address)
{
  window.open(address, "_blank");
}

function closeUpdateToDateDiv()
{
  upToDateDiv.style.display = "none";
  main.style.display = "block";
}

function cancelVersion()
{
  main.style.display = "block";
  versionDiv.style.display = "none";
}

function getBuffer(file_url, callback, flag, mode, port, cache = null)
{
  var http = require(mode);
  var fileBuffer = null;
  var options = null;

  options = {
    host: NodeURL.parse(file_url).host, // eslint-disable-line node/no-deprecated-api
    port: port,
    followAllRedirects: true,
    path: NodeURL.parse(file_url).path, // eslint-disable-line node/no-deprecated-api
    headers: { "User-Agent": gtUserAgent, "x-user-agent": gtUserAgent }
  };

  http.get(options, function (res)
  {
    // var fsize = res.headers["content-length"];
    var cookies = null;
    if (typeof res.headers["set-cookie"] != "undefined") { cookies = res.headers["set-cookie"]; }
    res
      .on("data", function (data)
      {
        if (fileBuffer == null) fileBuffer = data;
        else fileBuffer += data;
      })
      .on("end", function ()
      {
        if (typeof callback == "function")
        {
          // Call it, since we have confirmed it is callable
          callback(fileBuffer, flag, cache);
        }
      })
      .on("error", function (e)
      {
        console.error("getBuffer " + file_url + " error: " + e.message);
      });
  });
}

function getPostBuffer(
  file_url,
  callback,
  flag,
  mode,
  port,
  theData,
  timeoutMs,
  timeoutCallback,
  who
)
{
  var querystring = require("querystring");
  var postData = querystring.stringify(theData);
  var http = require(mode);
  var fileBuffer = null;
  var options = {
    host: NodeURL.parse(file_url).host, // eslint-disable-line node/no-deprecated-api
    port: port,
    path: NodeURL.parse(file_url).path, // eslint-disable-line node/no-deprecated-api
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": postData.length,
      "User-Agent": gtUserAgent,
      "x-user-agent": gtUserAgent
    }
  };
  var req = http.request(options, function (res)
  {
    // var fsize = res.headers["content-length"];
    var cookies = null;
    if (typeof res.headers["set-cookie"] != "undefined") { cookies = res.headers["set-cookie"]; }
    res
      .on("data", function (data)
      {
        if (fileBuffer == null) fileBuffer = data;
        else fileBuffer += data;
      })
      .on("end", function ()
      {
        if (typeof callback == "function")
        {
          // Call it, since we have confirmed it is callable
          callback(fileBuffer, flag);
        }
      })
      .on("error", function ()
      {
        if (typeof errorCallback == "function")
        {
          errorCallback();
        }
      });
  });
  if (typeof timeoutMs == "number" && timeoutMs > 0)
  {
    req.on("socket", function (socket)
    {
      socket.setTimeout(timeoutMs);
      socket.on("timeout", function ()
      {
        req.abort();
      });
    });
    req.on("error", function (err) // eslint-disable-line node/handle-callback-err
    {
      if (typeof timeoutCallback == "function")
      {
        timeoutCallback(
          file_url,
          callback,
          flag,
          mode,
          port,
          theData,
          timeoutMs,
          timeoutCallback,
          who
        );
      }
      else if (typeof callback == "function")
      {
        // Call it, since we have confirmed it is callable
        callback(null, null);
      }
    });
  }
  req.write(postData);
  req.end();
}

function loadMapSettings()
{
  graylineValue.value = GT.mapSettings.graylineOpacity;
  showDarknessTd.innerHTML = parseInt(graylineValue.value * 100) + "%";
  pathWidthTd.innerHTML = pathWidthValue.value = GT.appSettings.pathWidthWeight;
  qrzPathWidthTd.innerHTML = qrzPathWidthValue.value = GT.appSettings.qrzPathWidthWeight;

  mapTransValue.value = GT.mapSettings.mapTrans;
  mapTransChange();

  gridDecay.value = GT.appSettings.gridsquareDecayTime;
  changeGridDecay();

  pathColorValue.value = GT.mapSettings.pathColor;
  qrzPathColorValue.value = GT.mapSettings.qrzPathColor;
  brightnessValue.value = GT.mapSettings.mapOpacity;
  nightBrightnessValue.value = GT.mapSettings.nightMapOpacity;

  nightPathColorValue.value = GT.mapSettings.nightPathColor;
  nightQrzPathColorValue.value = GT.mapSettings.nightQrzPathColor;

  mouseOverValue.checked = GT.mapSettings.mouseOver;
  mergeOverlayValue.checked = GT.mapSettings.mergeOverlay;

  offlineImg.src = GT.mapImageArray[GT.mapSettings.offlineMode ? 0 : 1];

  mapSelect.value = GT.mapSettings.mapIndex;
  mapNightSelect.value = GT.mapSettings.nightMapIndex;

  animateValue.checked = GT.mapSettings.animate;
  animateSpeedValue.value = 21 - GT.mapSettings.animateSpeed;
  setAnimateView();
  splitQSLValue.checked = GT.mapSettings.splitQSL;
  fitQRZvalue.checked = GT.mapSettings.fitQRZ;
  qrzDxccFallbackValue.checked = GT.mapSettings.qrzDxccFallback;
  CqHiliteValue.checked = GT.mapSettings.CQhilite;
  focusRigValue.checked = GT.mapSettings.focusRig;
  haltAllOnTxValue.checked = GT.mapSettings.haltAllOnTx;

  trafficDecode.checked = GT.mapSettings.trafficDecode;

  setSpotImage();

  timezoneImg.style.filter = GT.mapSettings.timezonesEnable == 1 ? "" : "grayscale(1)";
  radarImg.style.filter = GT.mapSettings.usNexrad ? "" : "grayscale(1)";
  predImg.src = GT.predImageArray[GT.mapSettings.predMode];
  predImg.style.filter = GT.mapSettings.predMode > 0 ? "" : "grayscale(1)";
  gridOverlayImg.style.filter = GT.mapSettings.showAllGrids ? "" : "grayscale(1)";

  GT.bandToColor = JSON.parse(JSON.stringify(GT.pskColors));

  setGridOpacity();
  setMapColors();
  setNightMapColors();

  if (GT.appSettings.myGrid.length > 3)
  {
    let LL = squareToCenter(GT.appSettings.myGrid);
    GT.mapSettings.latitude = GT.myLat = LL.a;
    GT.mapSettings.longitude = GT.myLon = LL.o;
  }
}

function changeDistanceUnit()
{
  GT.appSettings.distanceUnit = distanceUnit.value;
  GT.scaleLine.setUnits(GT.scaleUnits[GT.appSettings.distanceUnit]);
  goProcessRoster();
}

function changeMapNightPathValues()
{
  GT.mapSettings.nightPathColor = nightPathColorValue.value;
  GT.mapSettings.nightQrzPathColor = nightQrzPathColorValue.value;
  setNightMapColors();
  styleAllFlightPaths();
  saveMapSettings();
}

function changeMapNightValues()
{
  GT.mapSettings.nightMapIndex = mapNightSelect.value;
  GT.mapSettings.nightMapOpacity = nightBrightnessValue.value;

  saveMapSettings();
  changeMapLayer();
}

function setMapColors()
{
  var pathColor = pathColorValue.value == 0 ? "#000" : pathColorValue.value == 361 ? "#FFF" : "hsl(" + pathColorValue.value + ", 100%, 50%)";
  if (pathColorValue.value != 0)
  {
    pathColorDiv.style.color = "#000";
    pathColorDiv.style.backgroundColor = pathColor;
  }
  else
  {
    pathColorDiv.style.color = "#FFF";
    pathColorDiv.style.backgroundColor = pathColor;
  }

  pathColor = qrzPathColorValue.value == 0 ? "#000" : qrzPathColorValue.value == 361 ? "#FFF" : "hsl(" + qrzPathColorValue.value + ", 100%, 50%)";
  if (qrzPathColorValue.value != 0)
  {
    qrzPathColorDiv.style.color = "#000";
    qrzPathColorDiv.style.backgroundColor = pathColor;
  }
  else
  {
    qrzPathColorDiv.style.color = "#FFF";
    qrzPathColorDiv.style.backgroundColor = pathColor;
  }
}

function setNightMapColors()
{
  var pathColor = GT.mapSettings.nightPathColor == 0 ? "#000" : GT.mapSettings.nightPathColor == 361 ? "#FFF" : "hsl(" + GT.mapSettings.nightPathColor + ", 100%, 50%)";
  if (GT.mapSettings.nightPathColor != 0)
  {
    pathNightColorDiv.style.color = "#000";
    pathNightColorDiv.style.backgroundColor = pathColor;
  }
  else
  {
    pathNightColorDiv.style.color = "#FFF";
    pathNightColorDiv.style.backgroundColor = pathColor;
  }

  pathColor = GT.mapSettings.nightQrzPathColor == 0 ? "#000" : GT.mapSettings.nightQrzPathColor == 361 ? "#FFF" : "hsl(" + GT.mapSettings.nightQrzPathColor + ", 100%, 50%)";
  if (GT.mapSettings.nightQrzPathColor != 0)
  {
    pathNightQrzColorDiv.style.color = "#000";
    pathNightQrzColorDiv.style.backgroundColor = pathColor;
  }
  else
  {
    pathNightQrzColorDiv.style.color = "#FFF";
    pathNightQrzColorDiv.style.backgroundColor = pathColor;
  }
}

function changeOfflineMap()
{
  GT.mapSettings.offlineMapIndex = offlineMapSelect.value;
  changeMapLayer();
}

function changeOfflineNightMap()
{
  GT.mapSettings.offlineNightMapIndex = offlineMapNightSelect.value;
  changeMapLayer();
}

function changeMapValues()
{
  GT.mapSettings.mapOpacity = brightnessValue.value;
  GT.mapSettings.mapIndex = mapSelect.value;
  if (GT.appSettings.gtFlagImgSrc > 0 && GT.mapSettings.offlineMode == false && GT.appSettings.gtShareEnable == true)
  {
    GT.layerVectors.gtflags.setVisible(true);
  }
  else
  {
    GT.layerVectors.gtflags.setVisible(false);
  }

  saveMapSettings();

  changeMapLayer();
}

function setLegendGrid(name, newColor)
{
  document.getElementById(name + "gridValue").value = newColor;
}

function setLegendGridSettings()
{
  for (var key in GT.legendColors)
  {
    setLegendGrid(key, GT.legendColors[key]);
  }
}

function resetLegendColors()
{
  for (var key in def_legendColors)
  {
    GT.legendColors[key] = def_legendColors[key];
  }

  setLegendGridSettings();
  saveLegendColors();
  redrawGrids();
}

GT.redrawFromLegendTimeoutHandle = null;
function changeLegendColor(source)
{
  var newColor = source.value;

  var name = source.id.replace("gridValue", "");

  GT.legendColors[name] = newColor;

  if (GT.redrawFromLegendTimeoutHandle != null)
  {
    nodeTimers.clearTimeout(GT.redrawFromLegendTimeoutHandle);
  }
  GT.redrawFromLegendTimeoutHandle = nodeTimers.setTimeout(redrawGrids, 500);
}

function changeMapLayer()
{
  GT.map.removeLayer(GT.tileLayer);
  let maps, index, mapOpacity;

  if (GT.mapSettings.offlineMode)
  {
    maps = GT.offlineMapsLayer;
    if (GT.mapSettings.nightMapEnable && GT.nightTime)
    {
      index = GT.mapSettings.offlineNightMapIndex;
      mapOpacity = Number(GT.mapSettings.nightMapOpacity);
    }
    else
    {
      index = GT.mapSettings.offlineMapIndex;
      mapOpacity = Number(GT.mapSettings.mapOpacity);
    }

    mapApiKeyTr.style.display = "none";
    nightMapApiKeyTr.style.display = "none";
  }
  else
  {
    maps = GT.mapsLayer;
    if (GT.mapSettings.nightMapEnable && GT.nightTime)
    {
      index = GT.mapSettings.nightMapIndex;
      mapOpacity = Number(GT.mapSettings.nightMapOpacity);
    }
    else
    {
      index = GT.mapSettings.mapIndex;
      mapOpacity = Number(GT.mapSettings.mapOpacity);
    }

    if ("keyId" in GT.maps[GT.mapSettings.nightMapIndex])
    {
      nightMapApiKeyTr.style.display = "";
      nightMapApiKeyApplyDiv.style.display = "none";
      nightMapApiKeyInput.value = GT.mapSettings.apiKeys[GT.maps[GT.mapSettings.nightMapIndex].keyId];
      ValidateText(nightMapApiKeyInput);
    }
    else
    {
      nightMapApiKeyTr.style.display = "none";
    }

    if ("keyId" in GT.maps[GT.mapSettings.mapIndex])
    {
      mapApiKeyTr.style.display = "";
      mapApiKeyApplyDiv.style.display = "none";
      mapApiKeyInput.value = GT.mapSettings.apiKeys[GT.maps[GT.mapSettings.mapIndex].keyId];
      ValidateText(mapApiKeyInput);
    }
    else
    {
      mapApiKeyTr.style.display = "none";
    }
  }

  if (GT.maps[index].sourceType == "Group")
  {
    ProcessGroupMapSource(index);
    GT.tileLayer = new ol.layer.Group({ layers: maps[index] });
  }
  else
  {
    GT.tileLayer = new ol.layer.Tile({ source: maps[index] });
  }

  GT.tileLayer.setOpacity(mapOpacity);
  GT.map.getLayers().insertAt(0, GT.tileLayer);
}

function voiceChangedValue()
{
  GT.audioSettings.speechVoice = Number(alertVoiceInput.value) + 1;
  changeSpeechValues();
}

function timedGetVoices()
{
  voicesDiv.innerHTML = "";
  GT.voices = window.speechSynthesis.getVoices();
  if (GT.voices.length > 0)
  {
    var newSelect = document.createElement("select");
    newSelect.id = "alertVoiceInput";
    newSelect.title = "Select Voice";
    for (var i = 0; i < GT.voices.length; i++)
    {
      var option = document.createElement("option");
      option.value = i;
      option.text = GT.voices[i].name;
      if (GT.voices[i].default)
      {
        option.selected = true;
      }
      newSelect.appendChild(option);
    }
    newSelect.oninput = voiceChangedValue;
    voicesDiv.appendChild(newSelect);

    if (GT.audioSettings.speechVoice > 0)
    {
      alertVoiceInput.value = GT.audioSettings.speechVoice - 1;
    }
  }
  GT.speechAvailable = true;
}

function initSpeech()
{
  window.speechSynthesis.onvoiceschanged = function ()
  {
    nodeTimers.setTimeout(timedGetVoices, 3000);
  };
  var msg = new SpeechSynthesisUtterance("\n");
  msg.lang = GT.localeString;
  window.speechSynthesis.speak(msg);
}

function initSoundCards()
{
  navigator.mediaDevices.ondevicechange = (event) =>
  {
    updateSoundCards();
  }
  updateSoundCards();
  setAudioView();
  loadAlerts();
}

function updateSoundCards()
{
  navigator.mediaDevices
    .enumerateDevices()
    .then(gotAudioDevices)
    .catch(errorCallback);
}

function errorCallback(e) { }

function gotAudioDevices(deviceInfos)
{
  soundCardDiv.innerHTML = "";
  let newSelect = document.createElement("select");
  newSelect.id = "soundCardInput";
  newSelect.title = "Select Sound Card";

  for (let i = 0; i !== deviceInfos.length; ++i)
  {
    let deviceInfo = deviceInfos[i];
    if (deviceInfo.kind == "audiooutput")
    {
      let option = document.createElement("option");
      option.value = deviceInfo.deviceId;

      option.text = deviceInfo.label || "Speaker " + (newSelect.length + 1);
      newSelect.appendChild(option);
    }
  }
  newSelect.oninput = soundCardChangedValue;
  soundCardDiv.appendChild(newSelect);
  soundCardInput.value = GT.soundCard;
}

function soundCardChangedValue()
{
  GT.appSettings.soundCard = GT.soundCard = soundCardInput.value;
  playTestFile();
  saveAppSettings();
}

function setPins()
{
  GT.colorLeafletPins = {};
  GT.colorLeafletQPins = {};
  GT.colorLeafletQPins.worked = {};
  GT.colorLeafletQPins.confirmed = {};
  for (var i = 0; i < GT.colorBands.length; i++)
  {
    var pin = new ol.style.Icon({
      src: "img/pin/" + GT.colorBands[i] + ".png",
      anchorYUnits: "pixels",
      anchorXUnits: "pixels",
      anchor: [5, 18]
    });
    GT.colorLeafletPins[GT.colorBands[i]] = pin;
    pin = new ol.style.Icon({
      src: "img/pin/" + GT.colorBands[i] + "w.png",
      anchorYUnits: "pixels",
      anchorXUnits: "pixels",
      anchor: [5, 18]
    });
    GT.colorLeafletQPins.worked[GT.colorBands[i]] = pin;
    pin = new ol.style.Icon({
      src: "img/pin/" + GT.colorBands[i] + "q.png",
      anchorYUnits: "pixels",
      anchorXUnits: "pixels",
      anchor: [5, 18]
    });
    GT.colorLeafletQPins.confirmed[GT.colorBands[i]] = pin;
  }
}

function changeClearOnCQ()
{
  GT.appSettings.clearOnCQ = clearOnCQ.checked;
  saveAppSettings();
}

function loadViewSettings()
{
  gtBandFilter.value = GT.appSettings.gtBandFilter;
  gtModeFilter.value = GT.appSettings.gtModeFilter;
  gtPropFilter.value = GT.appSettings.gtPropFilter;
  distanceUnit.value = GT.appSettings.distanceUnit;
  languageLocale.value = GT.appSettings.locale;
  N1MMIpInput.value = GT.N1MMSettings.ip;
  N1MMPortInput.value = GT.N1MMSettings.port;
  buttonN1MMCheckBox.checked = GT.N1MMSettings.enable;
  ValidatePort(N1MMPortInput, buttonN1MMCheckBox, null);
  ValidateIPaddress(N1MMIpInput, buttonN1MMCheckBox, null);

  log4OMIpInput.value = GT.log4OMSettings.ip;
  log4OMPortInput.value = GT.log4OMSettings.port;
  buttonLog4OMCheckBox.checked = GT.log4OMSettings.enable;
  ValidatePort(log4OMPortInput, buttonLog4OMCheckBox, null);
  ValidateIPaddress(log4OMIpInput, buttonLog4OMCheckBox, null);

  acLogIpInput.value = GT.acLogSettings.ip;
  acLogPortInput.value = GT.acLogSettings.port;
  buttonacLogCheckBox.checked = GT.acLogSettings.enable;
  ValidatePort(acLogPortInput, buttonacLogCheckBox, null);
  ValidateIPaddress(acLogIpInput, buttonacLogCheckBox, null);

  dxkLogIpInput.value = GT.dxkLogSettings.ip;
  dxkLogPortInput.value = GT.dxkLogSettings.port;
  buttondxkLogCheckBox.checked = GT.dxkLogSettings.enable;
  ValidatePort(dxkLogPortInput, buttondxkLogCheckBox, null);
  ValidateIPaddress(dxkLogIpInput, buttondxkLogCheckBox, null);

  hrdLogbookIpInput.value = GT.HRDLogbookLogSettings.ip;
  hrdLogbookPortInput.value = GT.HRDLogbookLogSettings.port;
  buttonHrdLogbookCheckBox.checked = GT.HRDLogbookLogSettings.enable;
  ValidatePort(hrdLogbookPortInput, buttonHrdLogbookCheckBox, null);
  ValidateIPaddress(hrdLogbookIpInput, buttonHrdLogbookCheckBox, null);

  pstrotatorIpInput.value = GT.pstrotatorSettings.ip;
  pstrotatorPortInput.value = GT.pstrotatorSettings.port;
  pstrotatorCheckBox.checked = GT.pstrotatorSettings.enable;
  ValidatePort(pstrotatorPortInput, pstrotatorCheckBox, null);
  ValidateIPaddress(pstrotatorIpInput, pstrotatorCheckBox, null);

  spotHistoryTimeValue.value = parseInt(
    GT.receptionSettings.viewHistoryTimeSec / 60
  );
  spotHistoryTimeTd.innerHTML =
    "Max Age: " + toDHM(Number(GT.receptionSettings.viewHistoryTimeSec));

  spotPathsValue.checked = GT.receptionSettings.viewPaths;
  spotPathColorValue.value = GT.receptionSettings.pathColor;
  spotNightPathColorValue.value = GT.receptionSettings.pathNightColor;
  spotWidthTd.innerHTML = spotWidthValue.value = GT.receptionSettings.spotWidth;

  spotMergeValue.checked = GT.receptionSettings.mergeSpots;

  lookupOnTx.checked = GT.appSettings.lookupOnTx;
  lookupCallookPreferred.checked = GT.appSettings.lookupCallookPreferred;
  lookupCloseLog.checked = GT.appSettings.lookupCloseLog;
  lookupMerge.checked = GT.appSettings.lookupMerge;
  lookupMissingGrid.checked = GT.appSettings.lookupMissingGrid;

  clearOnCQ.checked = GT.appSettings.clearOnCQ;

  lookupMissingGridDiv.style.display = GT.appSettings.lookupMerge ? "" : "none";
  spotPathWidthDiv.style.display = GT.receptionSettings.viewPaths ? "" : "none";
  gridModeDiv.style.display = GT.pushPinMode ? "" : "none";

  spotPathChange();
  setLegendGridSettings();
}

function loadMsgSettings()
{
  msgEnable.checked = GT.appSettings.gtMsgEnable;
  GTspotEnable.checked = GT.appSettings.gtSpotEnable;

  oamsBandActivity.checked = GT.appSettings.oamsBandActivity;
  oamsBandActivityNeighbors.checked = GT.appSettings.oamsBandActivityNeighbors;
  setOamsBandActivity(oamsBandActivity);

  setSpotImage();

  for (var key in GT.msgSettings)
  {
    document.getElementById(key).value = GT.msgSettings[key];
  }

  msgSimplepush.checked = GT.msgSettings.msgSimplepush;
  msgSimplepushChat.checked = GT.msgSettings.msgSimplepushChat;
  msgSimplepushRoster.checked = GT.msgSettings.msgSimplepushRoster;

  msgPushover.checked = GT.msgSettings.msgPushover;
  msgPushoverChat.checked = GT.msgSettings.msgPushoverChat;
  msgPushoverRoster.checked = GT.msgSettings.msgPushoverRoster;

  ValidateText(msgAwayText);
  setMsgSettingsView();
}

function setMsgSettingsView()
{
  msgSettingsDiv.style.display = msgEnable.checked ? "" : "none";

  if (GT.msgSettings.msgAlertSelect > 0)
  {
    msgFrequencySelectDiv.style.display = "";
    if (GT.msgSettings.msgAlertSelect == 1)
    {
      msgAlertWord.style.display = "";
      msgAlertMedia.style.display = "none";
      ValidateText(msgAlertWord);
    }
    if (GT.msgSettings.msgAlertSelect == 2)
    {
      msgAlertWord.style.display = "none";
      msgAlertMedia.style.display = "";
    }
  }
  else
  {
    msgFrequencySelectDiv.style.display = "none";
    msgAlertWord.style.display = "none";
    msgAlertMedia.style.display = "none";
  }

  msgAwayTextDiv.style.display = (GT.msgSettings.msgAwaySelect > 0) ? "" : "none";
  simplePushDiv.style.display = GT.msgSettings.msgSimplepush ? "" : "none";
  pushOverDiv.style.display = GT.msgSettings.msgPushover ? "" : "none";

  ValidateText(msgSimplepushApiKey);
  ValidateText(msgPushoverUserKey);
  ValidateText(msgPushoverToken);
}

function loadAdifSettings()
{
  qslAuthority.value = GT.appSettings.qslAuthority;
  qsoItemsPerPageTd.innerHTML = qsoItemsPerPageValue.value = GT.appSettings.qsoItemsPerPage;

  workingCallsignEnable.checked = GT.appSettings.workingCallsignEnable;
  workingCallsignsValue.value = Object.keys(
    GT.appSettings.workingCallsigns
  ).join(",");

  ValidateCallsigns(workingCallsignsValue);

  workingGridEnable.checked = GT.appSettings.workingGridEnable;
  workingGridsValue.value = Object.keys(
    GT.appSettings.workingGrids
  ).join(",");

  ValidateGrids(workingGridsValue);

  workingDateEnable.checked = GT.appSettings.workingDateEnable;
  displayWorkingDate();

  if (GT.platform == "mac")
  {
    selectTQSLButton.style.display = "none";
  }

  for (var key in GT.adifLogSettings.menu)
  {
    var value = GT.adifLogSettings.menu[key];
    var where = key + "Div";
    if (document.getElementById(key) != null)
    {
      document.getElementById(key).checked = value;
      if (value == true)
      {
        document.getElementById(where).style.display = "";
      }
      else
      {
        document.getElementById(where).style.display = "none";
      }
    }
    else
    {
      delete GT.adifLogSettings.menu[key];
    }
  }
  for (var key in GT.adifLogSettings.startup)
  {
    if (document.getElementById(key) != null) { document.getElementById(key).checked = GT.adifLogSettings.startup[key]; }
  }
  for (var key in GT.adifLogSettings.nickname)
  {
    if (document.getElementById(key) != null)
    {
      document.getElementById(key).checked = GT.adifLogSettings.nickname[key];
      if (key == "nicknameeQSLCheckBox")
      {
        if (document.getElementById(key).checked == true)
        {
          eQSLNickname.style.display = "";
        }
        else
        {
          eQSLNickname.style.display = "none";
        }
      }
    }
  }
  for (var key in GT.adifLogSettings.text)
  {
    if (document.getElementById(key) != null)
    {
      document.getElementById(key).value = GT.adifLogSettings.text[key];
      ValidateText(document.getElementById(key));
    }
  }
  for (var key in GT.adifLogSettings.qsolog)
  {
    if (document.getElementById(key) != null)
    {
      document.getElementById(key).checked = GT.adifLogSettings.qsolog[key];
      if (key == "logLOTWqsoCheckBox")
      {
        if (document.getElementById(key).checked == true)
        {
          lotwUpload.style.display = "";
          trustedTestButton.style.display = "";
        }
        else
        {
          lotwUpload.style.display = "none";
          trustedTestButton.style.display = "none";
        }
      }
    }
  }
  if (clubCall.value == "" && GT.appSettings.myRawCall != "NOCALL")
  {
    clubCall.value = GT.appSettings.myRawCall;
    ValidateText(clubCall);
    GT.localStorage.adifLogSettings = JSON.stringify(GT.adifLogSettings);
  }

  try
  {
    findTrustedQSLPaths();
  }
  catch (e)
  {
    if (logLOTWqsoCheckBox.checked == true)
    {
      alert("Unable to access LoTW TrustedQSL (TQSL) due to OS permissions\nLogging to LoTW disabled for this session\nRun as administrator or allow file access to GridTracker if problem persists");
      logLOTWqsoCheckBox.checked = false;
    }
  }
  select = document.getElementById("CloudlogStationProfile");
  select.options.length = 0;
  var opt = document.createElement("option");
  opt.value = GT.adifLogSettings.text.CloudlogStationProfileID;
  opt.innerHTML = GT.adifLogSettings.text.CloudlogStationProfileName;
  select.appendChild(opt);
  CloudLogValidateURL(true);
  setAdifStartup(loadAdifCheckBox);
  ValidateQrzApi(qrzApiKey);
}

function startupButtonsAndInputs()
{
  try
  {
    GT.pushPinMode = !(GT.appSettings.pushPinMode == true);
    togglePushPinMode();
    udpForwardEnable.checked = GT.appSettings.wsjtForwardUdpEnable;
    multicastEnable.checked = GT.appSettings.multicast;

    gtGridViewMode.value = GT.appSettings.gridViewMode;
    graylineImg.src = GT.GraylineImageArray[GT.appSettings.graylineImgSrc];
    gtFlagImg.src = GT.gtFlagImageArray[GT.appSettings.gtFlagImgSrc % 2];
    gtShareFlagImg.src = GT.gtShareFlagImageArray[GT.appSettings.gtShareEnable == false ? 0 : 1];

    alertMuteImg.src = GT.alertImageArray[GT.audioSettings.alertMute];
    modeImg.src = GT.maidenheadModeImageArray[GT.appSettings.sixWideMode];

    if (GT.appSettings.myGrid.length > 0)
    {
      homeQTHInput.value = GT.appSettings.myGrid.substr(0, 6);
      if (ValidateGridsquare(homeQTHInput, null)) setCenterGridsquare();
    }
    ValidateCallsign(alertValueInput, null);

    if (GT.mapSettings.offlineMode == true)
    {
      conditionsButton.style.display = "none";
      buttonPsk24CheckBoxDiv.style.display = "none";
      buttonQRZCheckBoxDiv.style.display = "none";
      buttonLOTWCheckBoxDiv.style.display = "none";
      buttonClubCheckBoxDiv.style.display = "none";
      gtFlagButton.style.display = "none";
      gtShareButton.style.display = "none";
      msgButton.style.display = "none";
      donateButton.style.display = "none";
      bandActivityDiv.style.display = "none";
      buttonSpotsBoxDiv.style.display = "none";
      potaButton.style.display = "none";
      lookupButton.style.display = "none";
      radarButton.style.display = "none";
      mapSelect.style.display = "none";
      mapNightSelect.style.display = "none";
    }
    else
    {
      offlineMapSelect.style.display = "none";
      offlineMapNightSelect.style.display = "none";
    }

    setGtShareButtons();
  }
  catch (e)
  {
    console.error(e);
  }
}

function startupEventsAndTimers()
{
  document.addEventListener("keydown", onMyKeyDown, true);
  document.addEventListener("keyup", onMyKeyUp, false);

  // Clock timer update every second
  nodeTimers.setInterval(displayTime, 1000);
  nodeTimers.setInterval(reportDecodes, 60000);
  nodeTimers.setInterval(oamsBandActivityCheck, 300000);
}

GT.finishedLoading = false;
function postInit()
{
  let section = "mapViewFilters";
  try
  {
    displayMapViewFilters();
    section = "DrawAllGrids";
    drawAllGrids();
    section = "Spots";
    redrawSpots();
    section = "SettingsExportCheck";
    checkForSettings();
    section = "UDPListenerForward";
    updateForwardListener();
    section = "LastTraffic";
    addLastTraffic("GridTracker2</br>" + gtShortVersion);
    section = "NexradInit";
    displayNexrad();
    section = "PredictionInit";
    predInit();
    section = "PredictionLayer";
    displayPredLayer();
    section = "TimezonesLayer";
    displayTimezones();

    if (String(gtVersion) != String(GT.startVersion))
    {
      // section = "ShowUpdate";
      // Version changed, lets come up with something new here
    }
    GT.finishedLoading = true;

    section = "inputRanges";
    var x = document.querySelectorAll("input[type='range']");
    for (var i = 0; i < x.length; i++)
    {
      if (x[i].title.length > 0) x[i].title += "\n";
      x[i].title += "(Use Arrow Keys For Smaller Increments)";
    }

    section = "DataBreakout";
    initPopupWindow();
    section = "LookupWindow";
    openLookupWindow(false);
    section = "BaWindow";
    openBaWindow(false);
    section = "AlertWindow";
    openAlertWindow(false);
    section = "ConditionsWindow";
    openConditionsWindow(false);
    section = "ChatWindow";
    showMessaging(false);
    section = "RosterWindow";
    openCallRosterWindow(false);
  }
  catch (e)
  {
    alert("!Init Failed Section!: " + section + "\nPlease report failed section");
  }

  bigctyDiv.style.display = "inline-block";

  buttonPanelInit();
  displayMouseTrack();

  projectionImg.style.filter = GT.mapSettings.projection == "AEQD" ? "" : "grayscale(1)";

  nodeTimers.setInterval(removeFlightPathsAndDimSquares, 2000);
}

GT.defaultButtons = [];
GT.movingButton = null;

function buttonPanelInit()
{
  buttonsDiv.addEventListener("mouseleave", buttonPanelMouseLeave);
  buttonsDiv.addEventListener("wheel", buttonPanelWheelMove);

  let iconButtons = buttonsDiv.querySelectorAll(".iconButton");

  for (let i = 0; i < iconButtons.length; i++)
  {
    GT.defaultButtons[i] = iconButtons[i].id;
    iconButtons[i].addEventListener("contextmenu", buttonPanelRightClick);
    iconButtons[i].addEventListener("click", buttonPanelMouseLeave);
  }

  if (GT.appSettings.buttonPanelOrder.length > 0)
  {
    // First make sure that all the saved buttons exist.
    var i = GT.appSettings.buttonPanelOrder.length;
    while (i--)
    {
      if (document.getElementById(GT.appSettings.buttonPanelOrder[i]) == null)
      {
        GT.appSettings.buttonPanelOrder.splice(i, 1);
      }
    }

    for (let i = 0; i < GT.defaultButtons.length; i++)
    {
      if (GT.appSettings.buttonPanelOrder.indexOf(GT.defaultButtons[i]) == -1)
      {
        GT.appSettings.buttonPanelOrder.unshift(GT.defaultButtons[i]);
      }
    }

    setButtonPanelOrder(GT.appSettings.buttonPanelOrder);
  }
  else
  {
    GT.appSettings.buttonPanelOrder = [...GT.defaultButtons];
  }
}

function setButtonPanelOrder(which)
{
  let buttonObjects = {};
  let iconButtons = buttonsDiv.querySelectorAll(".iconButton");

  // Save a point to each button element so we don't destroy it
  for (let i = 0; i < iconButtons.length; i++)
  {
    buttonObjects[iconButtons[i].id] = iconButtons[i];
  }

  // Clear the button panel
  while (buttonsDiv.lastElementChild)
  {
    buttonsDiv.removeChild(buttonsDiv.lastElementChild);
  }

  // Append each button by its order
  for (let i = 0; i < which.length; i++)
  {
    buttonsDiv.appendChild(buttonObjects[which[i]]);
  }
  saveButtonOrder();
}

function buttonPanelRightClick(event)
{
  if (GT.movingButton == null && event.shiftKey == true)
  {
    event.preventDefault();
    GT.movingButton = this;
    this.className = "iconButtonMoving";
    return false;
  }
  else if (GT.movingButton == this)
  {
    // cancel
    event.preventDefault();
    this.className = "iconButton";
    GT.movingButton = null;
    return false;
  }
  else if (GT.movingButton)
  {
    // Our target is *this*
    event.preventDefault();
    GT.movingButton.className = "iconButton";

    elementSwap(GT.movingButton, this);
    GT.movingButton = null;

    saveButtonOrder();
    return false;
  }
}

function buttonPanelMouseLeave()
{
  if (GT.movingButton)
  {
    GT.movingButton.className = "iconButton";
    GT.movingButton = null;
  }
}

function buttonPanelWheelMove(event)
{
  if (GT.movingButton)
  {
    const delta = Math.sign(event.deltaY);
    (delta == -1) ? panelLeftArrow() : panelRightArrow();
  }
}

function panelLeftArrow()
{
  let element = GT.movingButton.previousElementSibling;
  while (element && element.style.display == "none")
  {
    element = element.previousElementSibling;
  }
  if (element)
  {
    GT.movingButton = elementSwap(GT.movingButton, element);
    saveButtonOrder();
  }
}

function panelRightArrow()
{
  let element = GT.movingButton.nextElementSibling;
  while (element && element.style.display == "none")
  {
    element = element.nextElementSibling;
  }
  if (element)
  {
    GT.movingButton = elementSwap(GT.movingButton, element);
    saveButtonOrder();
  }
}

function elementSwap(node1, node2)
{
  const afterNode1 = node1.previousElementSibling
  const afterNode2 = node2.nextElementSibling;
  const parent = node2.parentNode;
  node1.replaceWith(node2);
  if (afterNode2)
  {
    if (afterNode2 == node1)
    {
      parent.insertBefore(node1, afterNode1);
    }
    else
    {
      parent.insertBefore(node1, afterNode2);
    }
  }
  else
  {
    parent.appendChild(node1);
  }
  return node1;
}

function saveButtonOrder()
{
  let iconButtons = buttonsDiv.querySelectorAll("[class^='iconButton']");
  GT.appSettings.buttonPanelOrder = [];
  for (let i = 0; i < iconButtons.length; i++)
  {
    GT.appSettings.buttonPanelOrder[i] = iconButtons[i].id;
  }
}

document.addEventListener("dragover", function (event)
{
  event.preventDefault();
});

document.addEventListener("drop", function (event)
{
  event.preventDefault();
  if (GT.finishedLoading == true) dropHandler(event);
});

GT.startupTable = [
  [loadI18n, "Loading Locales", "gt.startupTable.loadi18n"],
  [qsoBackupFileInit, "QSO Backup Initialized", "gt.startupTable.qsoBackup"],
  [callsignServicesInit, "Callsign Services Initialized", "gt.startupTable.callsigns"],
  [loadMapSettings, "Map Settings Initialized", "gt.startupTable.mapSettings"],
  [initMap, "Loaded Map", "gt.startupTable.loadMap"],
  [setPins, "Created Pins", "gt.startupTable.setPins"],
  [loadViewSettings, "Loaded View Settings", "gt.startupTable.viewSettings"],
  [loadMsgSettings, "Loaded Messaging Settings", "gt.startupTable.msgSettings"],
  [setFileSelectors, "Set File Selectors", "gt.startupTable.fileSelectors"],
  [loadMaidenHeadData, "Loaded Maidenhead Dataset", "gt.startupTable.maidenheadData"],
  [updateRunningProcesses, "Updated Running Processes", "gt.startupTable.updateProcesses"],
  [updateBasedOnIni, "Updated from WSJT-X", "gt.startupTable.updateINI"],
  [loadAdifSettings, "Loaded ADIF Settings", "gt.startupTable.loadADIF"],
  [startupButtonsAndInputs, "Buttons and Inputs Initialized", "gt.startupTable.initButtons"],
  [initSpeech, "Speech Initialized", "gt.startupTable.initSpeech"],
  [initSoundCards, "Sounds Initialized", "gt.startupTable.initSounds"],
  [loadPortSettings, "Loaded Network Settings", "gt.startupTable.loadPorts"],
  [loadLookupDetails, "Callsign Lookup Details Loaded", "gt.startupTable.loadLookup"],
  [renderLocale, "Rendering Locale", "gt.startupTable.loadi18n"],
  [startupEventsAndTimers, "Set Events and Timers", "gt.startupTable.eventTimers"],
  [registerHotKeys, "Registered Hotkeys", "gt.startupTable.regHotkeys"],
  [gtChatSystemInit, "Chat System Initialized", "gt.startupTable.initOams"],
  [initPota, "POTA Initialized", "gt.startupTable.loadPOTA"],
  [downloadAcknowledgements, "Contributor Acknowledgements Loaded", "gt.startupTable.getAcks"],
  [postInit, "Finalizing System", "gt.startupTable.postInit"],
  [undefined, "Completed", "gt.startupEngine.completed"]
];

function init()
{
  aboutVersionText.innerHTML = gtShortVersion;
  GT.currentDay = parseInt(timeNowSec() / 86400);

  mediaCheck();

  startupDiv.style.display = "block";
  startupStatusDiv.innerHTML = "Starting...";
  nodeTimers.setTimeout(startupEngine, 32);
}

function startupEngine()
{
  if (GT.startupTable.length > 0)
  {
    var funcInfo = GT.startupTable.shift();
    funcInfo[0] && funcInfo[0]();
    startupStatusDiv.innerHTML = funcInfo[1];
    nodeTimers.setTimeout(startupEngine, 32);
  }
  else
  {
    startupDiv.style.display = "none";
    main.style.display = "block";
    GT.map.updateSize();

    setTimeout(endStartup, 500);
  }
}

function refreshI18NStrings()
{
  GT.startupTable.forEach(function (item)
  {
    if (item[2].length > 0) item[1] = I18N(item[2]);
  })
}

function directoryInput(what)
{
  GT.appSettings.savedAppData = what.files[0].path;
  init();
}

function endStartup()
{
  openStatsWindow(false);
  if (loadPsk24CheckBox.checked == true) grabPsk24();
  startupAdifLoadCheck();
}

function loadPortSettings()
{
  multicastEnable.checked = GT.appSettings.multicast;
  multicastIpInput.value = GT.appSettings.wsjtIP;
  setMulticastEnable(multicastEnable);
  udpPortInput.value = GT.appSettings.wsjtUdpPort;
  ValidatePort(udpPortInput, null, CheckReceivePortIsNotForwardPort);
  udpForwardPortInput.value = GT.appSettings.wsjtForwardUdpPort;
  ValidatePort(udpForwardPortInput, null, CheckForwardPortIsNotReceivePort);
  udpForwardIpInput.value = GT.appSettings.wsjtForwardUdpIp;
  ValidateIPaddress(udpForwardIpInput, null);
  udpForwardEnable.checked = GT.appSettings.wsjtForwardUdpEnable;
  setUdpForwardEnable(udpForwardEnable);
}

GT.wsjtCurrentPort = -1;
GT.wsjtUdpServer = null;
GT.wsjtUdpSocketReady = false;
GT.wsjtUdpSocketError = false;
GT.qtToSplice = 0;

function decodeQUINT8(byteArray)
{
  GT.qtToSplice = 1;
  return byteArray[0];
}

function encodeQBOOL(byteArray, offset, value)
{
  return byteArray.writeUInt8(value, offset);
}

function decodeQUINT32(byteArray)
{
  GT.qtToSplice = 4;
  return byteArray.readUInt32BE(0);
}

function encodeQUINT32(byteArray, offset, value)
{
  if (value == -1) value = 4294967295;
  return byteArray.writeUInt32BE(value, offset);
}

function decodeQINT32(byteArray)
{
  GT.qtToSplice = 4;
  return byteArray.readInt32BE(0);
}

function encodeQINT32(byteArray, offset, value)
{
  return byteArray.writeInt32BE(value, offset);
}

function decodeQUINT64(byteArray)
{
  var value = 0;
  for (var i = 0; i < 8; i++)
  {
    value = value * 256 + byteArray[i];
  }
  GT.qtToSplice = 8;
  return value;
}

function encodeQUINT64(byteArray, offset, value)
{
  var breakOut = Array();
  for (var i = 0; i < 8; i++)
  {
    breakOut[i] = value & 0xff;
    value >>= 8;
  }
  for (var i = 0; i < 8; i++)
  {
    offset = encodeQBOOL(byteArray, offset, breakOut[7 - i]);
  }
  return offset;
}

function decodeQUTF8(byteArray)
{
  var utf8_len = decodeQUINT32(byteArray);
  var result = "";
  byteArray = byteArray.slice(GT.qtToSplice);
  if (utf8_len == 0xffffffff) utf8_len = 0;
  else result = byteArray.slice(0, utf8_len);
  GT.qtToSplice = utf8_len + 4;
  return result.toString();
}

function encodeQUTF8(byteArray, offset, value)
{
  offset = encodeQUINT32(byteArray, offset, value.length);
  var wrote = byteArray.write(value, offset, value.length);
  return wrote + offset;
}

function decodeQDOUBLE(byteArray)
{
  GT.qtToSplice = 8;
  return byteArray.readDoubleBE(0);
}

function encodeQDOUBLE(byteArray, offset, value)
{
  return byteArray.writeDoubleBE(value, offset);
}

GT.forwardUdpServer = null;

function updateForwardListener()
{
  if (GT.forwardUdpServer != null)
  {
    GT.forwardUdpServer.close();
  }
  if (GT.closing == true) return;

  var dgram = require("dgram");
  GT.forwardUdpServer = dgram.createSocket({
    type: "udp4",
    reuseAddr: true
  });

  GT.forwardUdpServer.on("listening", function () { });
  GT.forwardUdpServer.on("error", function ()
  {
    GT.forwardUdpServer.close();
    GT.forwardUdpServer = null;
  });
  GT.forwardUdpServer.on("message", function (originalMessage, remote)
  {
    // Decode enough to get the rig-name, so we know who to send to
    var message = Object.assign({}, originalMessage);
    var newMessage = {};
    newMessage.magic_key = decodeQUINT32(message);
    message = message.slice(GT.qtToSplice);
    if (newMessage.magic_key == 0xadbccbda)
    {
      newMessage.schema_number = decodeQUINT32(message);
      message = message.slice(GT.qtToSplice);
      newMessage.type = decodeQUINT32(message);
      message = message.slice(GT.qtToSplice);
      newMessage.Id = decodeQUTF8(message);
      message = message.slice(GT.qtToSplice);

      var instanceId = newMessage.Id;
      if (instanceId in GT.instances)
      {
        wsjtUdpMessage(
          originalMessage,
          originalMessage.length,
          GT.instances[instanceId].remote.port,
          GT.instances[instanceId].remote.address
        );
      }
    }
  });
  GT.forwardUdpServer.bind(0);
}

function sendForwardUdpMessage(msg, length, port, address)
{
  if (GT.forwardUdpServer)
  {
    GT.forwardUdpServer.send(msg, 0, length, port, address);
  }
}

function wsjtUdpMessage(msg, length, port, address)
{
  if (GT.wsjtUdpServer)
  {
    GT.wsjtUdpServer.send(msg, 0, length, port, address);
  }
}

function checkWsjtxListener()
{
  if (GT.wsjtUdpServer == null || (GT.wsjtUdpSocketReady == false && GT.wsjtUdpSocketError == true))
  {
    GT.wsjtCurrentPort = -1;
    GT.wsjtCurrentIP = "none";
  }
  updateWsjtxListener(GT.appSettings.wsjtUdpPort);
}

GT.instances = {};
GT.instancesIndex = Array();

GT.activeInstance = "";
GT.activeIndex = 0;

GT.currentID = null;
GT.lastWsjtMessageByPort = {};

function updateWsjtxListener(port)
{
  if (port == GT.wsjtCurrentPort && GT.appSettings.wsjtIP == GT.wsjtCurrentIP) { return; }
  if (GT.wsjtUdpServer != null)
  {
    if (multicastEnable.checked == true && GT.appSettings.wsjtIP != "")
    {
      try
      {
        GT.wsjtUdpServer.dropMembership(GT.appSettings.wsjtIP);
      }
      catch (e)
      {
        console.error(e);
      }
    }
    GT.wsjtUdpServer.close();
    GT.wsjtUdpServer = null;
    GT.wsjtUdpSocketReady = false;
  }
  if (GT.closing == true) return;
  GT.wsjtUdpSocketError = false;
  var dgram = require("dgram");
  GT.wsjtUdpServer = dgram.createSocket({
    type: "udp4",
    reuseAddr: true
  });
  if (multicastEnable.checked == true && GT.appSettings.wsjtIP != "")
  {
    GT.wsjtUdpServer.on("listening", function ()
    {
      var address = GT.wsjtUdpServer.address();
      GT.wsjtUdpServer.setBroadcast(true);
      GT.wsjtUdpServer.setMulticastTTL(3);
      var interfaces = os.networkInterfaces();
      for (var i in interfaces)
      {
        for (var x in interfaces[i])
        {
          if (interfaces[i][x].family == "IPv4")
          {
            GT.wsjtUdpServer.addMembership(GT.appSettings.wsjtIP, interfaces[i][x].address);
            console.log("Adding Multicast to: " + interfaces[i][x].address);
          }
        }
      }
      GT.wsjtUdpSocketReady = true;
    });
  }
  else
  {
    GT.appSettings.multicast = false;
    GT.wsjtCurrentIP = GT.appSettings.wsjtIP = "";
    GT.wsjtUdpServer.on("listening", function ()
    {
      GT.wsjtUdpServer.setBroadcast(true);
      GT.wsjtUdpSocketReady = true;
    });
  }
  GT.wsjtUdpServer.on("error", function ()
  {
    GT.wsjtUdpServer.close();
    GT.wsjtUdpServer = null;
    GT.wsjtUdpSocketReady = false;
    GT.wsjtUdpSocketError = true;
  });

  GT.wsjtUdpServer.on("message", function (message, remote)
  {
    if (!(remote.port in GT.lastWsjtMessageByPort))
    {
      GT.lastWsjtMessageByPort[remote.port] = Buffer.from([0x01]);
    }

    let testBuffer = Buffer.from(message);
    if (testBuffer.equals(GT.lastWsjtMessageByPort[remote.port]))
    {
      return;
    }

    GT.lastWsjtMessageByPort[remote.port] = testBuffer;

    if (typeof udpForwardEnable != "undefined" && udpForwardEnable.checked == true)
    {
      sendForwardUdpMessage(
        message,
        message.length,
        udpForwardPortInput.value,
        udpForwardIpInput.value
      );
    }

    var newMessage = {};
    newMessage.magic_key = decodeQUINT32(message);
    message = message.slice(GT.qtToSplice);
    if (newMessage.magic_key == 0xadbccbda)
    {
      newMessage.schema_number = decodeQUINT32(message);
      message = message.slice(GT.qtToSplice);
      newMessage.type = decodeQUINT32(message);
      message = message.slice(GT.qtToSplice);
      newMessage.Id = decodeQUTF8(message);
      message = message.slice(GT.qtToSplice);

      var instanceId = newMessage.Id;
      if (!(instanceId in GT.instances))
      {
        GT.instances[instanceId] = {};
        GT.instances[instanceId].valid = false;
        GT.instancesIndex.push(instanceId);
        GT.instances[instanceId].intId = GT.instancesIndex.length - 1;
        GT.instances[instanceId].crEnable = true;
        GT.instances[instanceId].oldStatus = null;
        GT.instances[instanceId].status = null;
        if (GT.instancesIndex.length > 1)
        {
          multiRigCRDiv.style.display = "inline-block";
          haltTXDiv.style.display = "inline-block";
        }
        updateRosterInstances();
      }
      var notify = false;
      if (GT.instances[instanceId].open == false) notify = true;
      GT.instances[instanceId].open = true;
      GT.instances[instanceId].remote = remote;

      if (notify) updateRosterInstances();

      if (newMessage.type == 1)
      {
        newMessage.event = "Status";
        newMessage.Frequency = decodeQUINT64(message);
        newMessage.Band = formatBand(Number(newMessage.Frequency / 1000000));
        message = message.slice(GT.qtToSplice);
        newMessage.MO = decodeQUTF8(message);
        message = message.slice(GT.qtToSplice);
        newMessage.DXcall = decodeQUTF8(message);
        message = message.slice(GT.qtToSplice);
        newMessage.Report = decodeQUTF8(message);
        message = message.slice(GT.qtToSplice);
        newMessage.TxMode = decodeQUTF8(message);
        message = message.slice(GT.qtToSplice);
        newMessage.TxEnabled = decodeQUINT8(message);
        message = message.slice(GT.qtToSplice);
        newMessage.Transmitting = decodeQUINT8(message);
        message = message.slice(GT.qtToSplice);
        newMessage.Decoding = decodeQUINT8(message);
        message = message.slice(GT.qtToSplice);
        newMessage.RxDF = decodeQINT32(message);
        message = message.slice(GT.qtToSplice);
        newMessage.TxDF = decodeQINT32(message);
        message = message.slice(GT.qtToSplice);
        newMessage.DEcall = decodeQUTF8(message);
        message = message.slice(GT.qtToSplice);
        newMessage.DEgrid = decodeQUTF8(message);
        message = message.slice(GT.qtToSplice);
        newMessage.DXgrid = decodeQUTF8(message);
        message = message.slice(GT.qtToSplice);
        newMessage.TxWatchdog = decodeQUINT8(message);
        message = message.slice(GT.qtToSplice);
        newMessage.Submode = decodeQUTF8(message);
        message = message.slice(GT.qtToSplice);
        newMessage.Fastmode = decodeQUINT8(message);
        message = message.slice(GT.qtToSplice);

        if (message.length > 0)
        {
          newMessage.SopMode = decodeQUINT8(message);
          message = message.slice(GT.qtToSplice);
        }
        else
        {
          newMessage.SopMode = -1;
        }
        if (message.length > 0)
        {
          newMessage.FreqTol = decodeQINT32(message);
          message = message.slice(GT.qtToSplice);
        }
        else
        {
          newMessage.FreqTol = -1;
        }
        if (message.length > 0)
        {
          newMessage.TRP = decodeQINT32(message);
          message = message.slice(GT.qtToSplice);
        }
        else
        {
          newMessage.TRP = -1;
        }
        if (message.length > 0)
        {
          newMessage.ConfName = decodeQUTF8(message);
          message = message.slice(GT.qtToSplice);
        }
        else
        {
          newMessage.ConfName = null;
        }
        if (message.length > 0)
        {
          newMessage.TxMessage = decodeQUTF8(message);
          message = message.slice(GT.qtToSplice);
        }
        else
        {
          newMessage.TxMessage = null;
        }
        GT.instances[instanceId].oldStatus = GT.instances[instanceId].status;
        GT.instances[instanceId].status = newMessage;
        GT.instances[instanceId].valid = true;
      }
      if (GT.instances[instanceId].valid == true)
      {
        if (newMessage.type == 2)
        {
          newMessage.event = "Decode";
          newMessage.NW = decodeQUINT8(message);
          message = message.slice(GT.qtToSplice);
          newMessage.TM = decodeQUINT32(message);
          message = message.slice(GT.qtToSplice);
          newMessage.SR = decodeQINT32(message);
          message = message.slice(GT.qtToSplice);
          newMessage.DT = decodeQDOUBLE(message);
          message = message.slice(GT.qtToSplice);
          newMessage.DF = decodeQUINT32(message);
          message = message.slice(GT.qtToSplice);
          newMessage.MO = decodeQUTF8(message);
          message = message.slice(GT.qtToSplice);
          newMessage.Msg = decodeQUTF8(message);
          message = message.slice(GT.qtToSplice);
          newMessage.LC = decodeQUINT8(message);
          message = message.slice(GT.qtToSplice);
          newMessage.OA = decodeQUINT8(message);
          message = message.slice(GT.qtToSplice);
          newMessage.OF = GT.instances[instanceId].status.Frequency;
          newMessage.OC = GT.instances[instanceId].status.DEcall;
          newMessage.OG = GT.instances[instanceId].status.DEgrid;
          newMessage.OM = GT.instances[instanceId].status.MO;
          newMessage.OB = GT.instances[instanceId].status.Band;
          newMessage.SP = GT.instances[instanceId].status.SopMode;
        }
        if (newMessage.type == 3)
        {
          newMessage.event = "Clear";
        }
        if (newMessage.type == 5)
        {
          newMessage.event = "QSO Logged";
          newMessage.DateOff = decodeQUINT64(message);
          message = message.slice(GT.qtToSplice);
          newMessage.TimeOff = decodeQUINT32(message);
          message = message.slice(GT.qtToSplice);
          newMessage.timespecOff = decodeQUINT8(message);
          message = message.slice(GT.qtToSplice);
          if (newMessage.timespecOff == 2)
          {
            newMessage.offsetOff = decodeQINT32(message);
            message = message.slice(GT.qtToSplice);
          }
          newMessage.DXCall = decodeQUTF8(message);
          message = message.slice(GT.qtToSplice);
          newMessage.DXGrid = decodeQUTF8(message);
          message = message.slice(GT.qtToSplice);
          newMessage.Frequency = decodeQUINT64(message);
          message = message.slice(GT.qtToSplice);
          newMessage.MO = decodeQUTF8(message);
          message = message.slice(GT.qtToSplice);
          newMessage.ReportSend = decodeQUTF8(message);
          message = message.slice(GT.qtToSplice);
          newMessage.ReportRecieved = decodeQUTF8(message);
          message = message.slice(GT.qtToSplice);
          newMessage.TXPower = decodeQUTF8(message);
          message = message.slice(GT.qtToSplice);
          newMessage.Comments = decodeQUTF8(message);
          message = message.slice(GT.qtToSplice);
          newMessage.Name = decodeQUTF8(message);
          message = message.slice(GT.qtToSplice);
          newMessage.DateOn = decodeQUINT64(message);
          message = message.slice(GT.qtToSplice);
          newMessage.TimeOn = decodeQUINT32(message);
          message = message.slice(GT.qtToSplice);
          newMessage.timespecOn = decodeQUINT8(message);
          message = message.slice(GT.qtToSplice);
          if (newMessage.timespecOn == 2)
          {
            newMessage.offsetOn = decodeQINT32(message);
            message = message.slice(GT.qtToSplice);
          }
          if (message.length > 0)
          {
            newMessage.Operatorcall = decodeQUTF8(message);
            message = message.slice(GT.qtToSplice);
          }
          else newMessage.Operatorcall = "";

          if (message.length > 0)
          {
            newMessage.Mycall = decodeQUTF8(message);
            message = message.slice(GT.qtToSplice);
          }
          else newMessage.Mycall = "";

          if (message.length > 0)
          {
            newMessage.Mygrid = decodeQUTF8(message);
            message = message.slice(GT.qtToSplice);
          }
          else newMessage.Mygrid = "";

          if (message.length > 0)
          {
            newMessage.ExchangeSent = decodeQUTF8(message);
            message = message.slice(GT.qtToSplice);
          }
          else newMessage.ExchangeSent = "";

          if (message.length > 0)
          {
            newMessage.ExchangeReceived = decodeQUTF8(message);
            message = message.slice(GT.qtToSplice);
          }
          else newMessage.ExchangeReceived = "";
        }
        if (newMessage.type == 6)
        {
          newMessage.event = "Close";
        }
        if (newMessage.type == 10)
        {
          newMessage.event = "WSPRDecode";
          newMessage.NW = decodeQUINT8(message);
          message = message.slice(GT.qtToSplice);
          newMessage.TM = decodeQUINT32(message);
          message = message.slice(GT.qtToSplice);
          newMessage.SR = decodeQINT32(message);
          message = message.slice(GT.qtToSplice);
          newMessage.DT = decodeQDOUBLE(message);
          message = message.slice(GT.qtToSplice);
          newMessage.Frequency = decodeQUINT64(message);
          message = message.slice(GT.qtToSplice);
          newMessage.Drift = decodeQINT32(message);
          message = message.slice(GT.qtToSplice);
          newMessage.Callsign = decodeQUTF8(message);
          message = message.slice(GT.qtToSplice);
          newMessage.Grid = decodeQUTF8(message);
          message = message.slice(GT.qtToSplice);
          newMessage.Power = decodeQINT32(message);
          message = message.slice(GT.qtToSplice);
          newMessage.OA = decodeQUINT8(message);
          message = message.slice(GT.qtToSplice);
          newMessage.OF = GT.instances[instanceId].status.Frequency;
          newMessage.OC = GT.instances[instanceId].status.DEcall;
          newMessage.OG = GT.instances[instanceId].status.DEgrid;
          newMessage.OM = GT.instances[instanceId].status.MO;
          newMessage.OB = GT.instances[instanceId].status.Band;
        }
        if (newMessage.type == 12)
        {
          newMessage.event = "ADIF";
          newMessage.ADIF = decodeQUTF8(message);
          message = message.slice(GT.qtToSplice);
        }

        if (newMessage.type in GT.wsjtHandlers)
        {
          newMessage.remote = remote;
          newMessage.instance = instanceId;

          lastMsgTimeDiv.innerHTML = I18N("gt.newMesg.Recvd") + newMessage.Id;

          GT.wsjtHandlers[newMessage.type](newMessage);
          GT.lastTimeSinceMessageInSeconds = parseInt(Date.now() / 1000);
        }
      }
    }
  });
  GT.wsjtUdpServer.bind(port);
  GT.wsjtCurrentPort = port;
  GT.wsjtCurrentIP = GT.appSettings.wsjtIP;
}

function loadLookupDetails()
{
  lookupService.value = GT.appSettings.lookupService;
  if (lookupService.value == "QRZ")
  {
    lookupLogin.value = GT.appSettings.lookupLoginQrz;
    lookupPassword.value = GT.appSettings.lookupPasswordQrz;
  }
  if (lookupService.value == "QRZCQ")
  {
    lookupLogin.value = GT.appSettings.lookupLoginCq;
    lookupPassword.value = GT.appSettings.lookupPasswordCq;
  }
  if (lookupService.value == "HAMQTH")
  {
    lookupLogin.value = GT.appSettings.lookupLoginQth;
    lookupPassword.value = GT.appSettings.lookupPasswordQth;
  }
  ValidateText(lookupLogin);
  ValidateText(lookupPassword);
  if (lookupService.value == "CALLOOK") { lookupCredentials.style.display = "none"; }
  else lookupCredentials.style.display = "block";
}

function lookupValueChanged(what)
{
  if (GT.appSettings.lookupService != lookupService.value)
  {
    GT.lastLookupCallsign = "";
    if (lookupService.value == "QRZ")
    {
      lookupLogin.value = GT.appSettings.lookupLoginQrz;
      lookupPassword.value = GT.appSettings.lookupPasswordQrz;
    }
    if (lookupService.value == "QRZCQ")
    {
      lookupLogin.value = GT.appSettings.lookupLoginCq;
      lookupPassword.value = GT.appSettings.lookupPasswordCq;
    }
    if (lookupService.value == "HAMQTH")
    {
      lookupLogin.value = GT.appSettings.lookupLoginQth;
      lookupPassword.value = GT.appSettings.lookupPasswordQth;
    }
  }
  GT.appSettings.lookupService = lookupService.value;
  GT.appSettings.lookupCallookPreferred = lookupCallookPreferred.checked;
  lookupQrzTestResult.innerHTML = "";
  GT.qrzLookupSessionId = null;
  if (lookupService.value == "CALLOOK") { lookupCredentials.style.display = "none"; }
  else lookupCredentials.style.display = "block";
  if (ValidateText(lookupLogin) && ValidateText(lookupPassword))
  {
    if (lookupService.value == "QRZ")
    {
      GT.appSettings.lookupLoginQrz = lookupLogin.value;
      GT.appSettings.lookupPasswordQrz = lookupPassword.value;
    }
    if (lookupService.value == "QRZCQ")
    {
      GT.appSettings.lookupLoginCq = lookupLogin.value;
      GT.appSettings.lookupPasswordCq = lookupPassword.value;
    }
    if (lookupService.value == "HAMQTH")
    {
      GT.appSettings.lookupLoginQth = lookupLogin.value;
      GT.appSettings.lookupPasswordQth = lookupPassword.value;
    }
  }
}
GT.lastLookupCallsign = "";
GT.lookupTimeout = null;

function lookupCallsign(callsign, gridPass, useCache = true)
{
  if (GT.mapSettings.offlineMode == true && useCache == false) return;
  GT.lastLookupCallsign = callsign;

  if (GT.lookupWindowInitialized)
  {
    GT.lookupWindowHandle.window.lookupCallsignInput.value = callsign;
    lookupValidateCallByElement("lookupCallsignInput");
  }
  if (GT.lookupTimeout != null)
  {
    nodeTimers.clearTimeout(GT.lookupTimeout);
    GT.lookupTimeout = null;
  }
  GT.lookupTimeout = nodeTimers.setTimeout(searchLogForCallsign, 500, callsign);

  if (useCache)
  {
    getLookupCachedObject(
      callsign,
      gridPass,
      cacheLookupObject,
      continueWithLookup
    );
  }
  else continueWithLookup(callsign, gridPass);
}

function continueWithLookup(callsign, gridPass)
{
  setLookupDiv(
    "lookupInfoDiv",
    "Looking up <font color='cyan'>" + callsign + "</font>, please wait..."
  );

  if (GT.appSettings.lookupCallookPreferred)
  {
    var dxcc = callsignToDxcc(callsign);
    var where;
    var ccode = 0;
    if (dxcc in GT.dxccToAltName)
    {
      where = GT.dxccToAltName[dxcc];
      ccode = GT.dxccInfo[dxcc].ccode;
    }
    else where = "Unknown";
    if (ccode == 840)
    {
      getBuffer(
        "https://callook.info/" + callsign + "/json",
        callookResults,
        gridPass,
        "https",
        443,
        true
      );
    }
  }
  if (GT.appSettings.lookupService != "CALLOOK")
  {
    GT.qrzLookupCallsign = callsign;
    GT.qrzLookupGrid = gridPass;
    if (
      GT.qrzLookupSessionId == null ||
      timeNowSec() - GT.sinceLastLookup > 3600
    )
    {
      GT.qrzLookupSessionId = null;
      GT.sinceLastLookup = timeNowSec();
      GetSessionID(null, true);
    }
    else
    {
      GT.sinceLastLookup = timeNowSec();
      GetLookup(true);
    }
  }
  else
  {
    var dxcc = callsignToDxcc(callsign);
    var where;
    var ccode = 0;
    if (dxcc in GT.dxccToAltName)
    {
      where = GT.dxccToAltName[dxcc];
      ccode = GT.dxccInfo[dxcc].ccode;
    }
    else where = "Unknown";
    if (ccode == 840)
    {
      getBuffer(
        "https://callook.info/" + callsign + "/json",
        callookResults,
        gridPass,
        "https",
        443,
        true
      );
    }
    else
    {
      var worker =
        "<center>" + I18N("gt.callookDX1") +
          "<br/>" + I18N("gt.callookDX2") +
          "<br/>" + I18N("gt.callookDX3") + "<br/>";
      worker +=
        "<br/>" + I18N("gt.callookDX4") + " <font color='orange'> " +
        callsign +
        "</font> " + I18N("gt.callookDX5") + " <font color='yellow'> " +
        where +
        "</font><br/>";
      worker +=
        "<br/><br/>" + I18N("gt.callookDX6") + "<br/>";
      worker += I18N("gt.callookDX7") + "<br/></center>";

      setLookupDiv("lookupInfoDiv", worker);
    }
  }
}
function callookResults(buffer, gridPass)
{
  var results = JSON.parse(buffer);
  if (typeof results.status != "undefined")
  {
    if (results.status == "VALID")
    {
      var callObject = {};
      var dxcc = callsignToDxcc(results.current.callsign);
      if (dxcc in GT.dxccToAltName) callObject.land = GT.dxccToAltName[dxcc];
      callObject.type = results.type;
      callObject.call = results.current.callsign;
      callObject.dxcc = dxcc;
      callObject.email = "";
      callObject.class = results.current.operClass;
      callObject.aliases = results.previous.callsign;
      callObject.trustee =
        results.trustee.callsign +
        (results.trustee.name.length > 0 ? "; " + results.trustee.name : "");
      callObject.name = results.name;
      callObject.fname = "";
      callObject.addr1 = results.address.line1;
      callObject.addr2 = results.address.line2;
      callObject.addrAttn = results.address.attn;
      callObject.lat = results.location.latitude;
      callObject.lon = results.location.longitude;
      callObject.grid = results.location.gridsquare;
      callObject.efdate = results.otherInfo.grantDate;
      callObject.expdate = results.otherInfo.expiryDate;
      callObject.frn = results.otherInfo.frn;
      callObject.bio = 0;
      callObject.image = "";
      callObject.country = "United States";
      if (gridPass) callObject.gtGrid = gridPass;
      callObject.source =
        "<tr><td>Source</td><td><font color='orange'><b><div style='cursor:pointer' onClick='window.opener.openSite(\"https://callook.info/" +
        results.current.callsign +
        "\");'>C A L L O O K</div></b></font></td></tr>";
      cacheLookupObject(callObject, gridPass, true);
    }
    else if (results.status == "INVALID")
    {
      setLookupDiv("lookupInfoDiv", "Invalid Lookup");
    }
    else
    {
      setLookupDiv("lookupInfoDiv", "Server is down for maintenance");
    }
  }
  else setLookupDiv("lookupInfoDiv", "Unknown Lookup Error");
}
GT.qrzLookupSessionId = null;
GT.qrzLookupCallsign = "";
GT.qrzLookupGrid = "";
GT.sinceLastLookup = 0;

function GetSessionID(resultTd, useCache)
{
  if (GT.mapSettings.offlineMode == true) return;
  if (resultTd != null) resultTd.innerHTML = "Testing";
  if (GT.appSettings.lookupService == "QRZCQ")
  {
    getBuffer(
      "https://ssl.qrzcq.com/xml?username=" +
      GT.appSettings.lookupLoginCq +
      "&password=" +
      encodeURIComponent(GT.appSettings.lookupPasswordCq) +
      "&agent=GridTracker1.18",
      qrzGetSessionCallback,
      resultTd,
      "https",
      443,
      useCache
    );
  }
  else if (GT.appSettings.lookupService == "QRZ")
  {
    getBuffer(
      "https://xmldata.qrz.com/xml/current/?username=" +
      GT.appSettings.lookupLoginQrz +
      ";password=" +
      encodeURIComponent(GT.appSettings.lookupPasswordQrz),
      qrzGetSessionCallback,
      resultTd,
      "https",
      443,
      useCache
    );
  }
  else
  {
    getBuffer(
      "https://www.hamqth.com/xml.php?u=" +
      GT.appSettings.lookupLoginQth +
      "&p=" +
      encodeURIComponent(GT.appSettings.lookupPasswordQth),
      hamQthGetSessionCallback,
      resultTd,
      "https",
      443,
      useCache
    );
  }
}

function hamQthGetSessionCallback(buffer, resultTd)
{
  var oParser = new DOMParser();
  var oDOM = oParser.parseFromString(buffer, "text/xml");
  var result = "";
  if (oDOM != null)
  {
    var json = XML2jsobj(oDOM.documentElement);
    if (json.hasOwnProperty("session"))
    {
      if (json.session.hasOwnProperty("session_id"))
      {
        result = "<font color='green'>Valid</font>";
        GT.qrzLookupSessionId = json.session.session_id;
      }
      else
      {
        result = "<font color='red'>" + json.session.error + "</font>";
        GT.qrzLookupSessionId = null;
      }
    }
    else
    {
      result = "<font color='red'>Invalid Response</font>";
      GT.qrzLookupSessionId = null;
    }
  }
  else
  {
    result = "<font color='red'>Unknown Error</font>";
    GT.qrzLookupSessionId = null;
  }
  if (resultTd == null)
  {
    // It's a true session Request
    SessionResponse(GT.qrzLookupSessionId, result);
  }
  else
  {
    GT.qrzLookupSessionId = null;
    resultTd.innerHTML = result;
  }
}

function qrzGetSessionCallback(buffer, resultTd, useCache)
{
  var oParser = new DOMParser();
  var oDOM = oParser.parseFromString(buffer, "text/xml");
  var result = "";
  if (oDOM != null)
  {
    var json = XML2jsobj(oDOM.documentElement);
    if (json.hasOwnProperty("Session"))
    {
      if (json.Session.hasOwnProperty("Key"))
      {
        result = "<font color='green'>Valid</font>";
        GT.qrzLookupSessionId = json.Session.Key;
      }
      else
      {
        result = "<font color='red'>" + json.Session.Error + "</font>";
        GT.qrzLookupSessionId = null;
      }
    }
    else
    {
      result = "<font color='red'>Invalid Response</font>";
      GT.qrzLookupSessionId = null;
    }
  }
  else
  {
    result = "<font color='red'>Unknown Error</font>";
    GT.qrzLookupSessionId = null;
  }
  if (resultTd == null)
  {
    // It's a true session Request
    SessionResponse(GT.qrzLookupSessionId, result, useCache);
  }
  else resultTd.innerHTML = result;
}

function SessionResponse(newKey, result, useCache)
{
  // for QRZCQ.com as well
  if (newKey == null)
  {
    setLookupDiv("lookupInfoDiv", result, useCache);
  }
  else
  {
    GetLookup(useCache);
  }
}

function GetLookup(useCache)
{
  if (GT.appSettings.lookupService == "QRZCQ")
  {
    getBuffer(
      "https://ssl.qrzcq.com/xml?s=" +
      GT.qrzLookupSessionId +
      "&callsign=" +
      GT.qrzLookupCallsign +
      "&agent=GridTracker",
      qrzLookupResults,
      GT.qrzLookupGrid,
      "https",
      443,
      useCache
    );
  }
  else if (GT.appSettings.lookupService == "QRZ")
  {
    getBuffer(
      "http://xmldata.qrz.com/xml/current/?s=" +
      GT.qrzLookupSessionId +
      ";callsign=" +
      GT.qrzLookupCallsign,
      qrzLookupResults,
      GT.qrzLookupGrid,
      "http",
      80,
      useCache
    );
  }
  else
  {
    getBuffer(
      "https://www.hamqth.com/xml.php?id=" +
      GT.qrzLookupSessionId +
      "&callsign=" +
      GT.qrzLookupCallsign +
      "&prg=GridTracker",
      qthHamLookupResults,
      GT.qrzLookupGrid,
      "https",
      443,
      useCache
    );
  }
}

function qthHamLookupResults(buffer, gridPass, useCache)
{
  var oParser = new DOMParser();
  var oDOM = oParser.parseFromString(buffer, "text/xml");
  var result = "";
  if (oDOM != null)
  {
    var json = XML2jsobj(oDOM.documentElement);
    if (json.hasOwnProperty("search"))
    {
      if (gridPass) json.search.gtGrid = gridPass;
      json.search.source =
        "<tr><td>Source</td><td><font color='orange'><b><div style='cursor:pointer' onClick='window.opener.openSite(\"https://www.hamqth.com/" +
        json.search.callsign.toUpperCase() +
        "\");'>HamQTH</div></b></font></td></tr>";

      cacheLookupObject(json.search, gridPass, true);
    }
    else
    {
      GT.qrzLookupSessionId = null;
      setLookupDiv(
        "lookupInfoDiv",
        "<br/><b>" + I18N("gt.lookup.NoResult") + "</b><br/><br/>"
      );
    }
  }
  else
  {
    setLookupDiv("lookupInfoDiv", buffer);
    GT.qrzLookupSessionId = null;
  }
}

function qrzLookupResults(buffer, gridPass, useCache)
{
  var oParser = new DOMParser();
  var oDOM = oParser.parseFromString(buffer, "text/xml");
  var result = "";
  if (oDOM != null)
  {
    var json = XML2jsobj(oDOM.documentElement);
    if (json.hasOwnProperty("Callsign"))
    {
      var call = "";
      if (json.Callsign.hasOwnProperty("callsign"))
      {
        json.Callsign.call = lookup.callsign;
        delete json.Callsign.callsign;
      }
      if (json.Callsign.hasOwnProperty("call")) call = json.Callsign.call;
      if (GT.appSettings.lookupService == "QRZ")
      {
        json.Callsign.source =
          "<tr><td>Source</td><td><font color='orange'><b><div style='cursor:pointer' onClick='window.opener.openSite(\"https://www.qrz.com/lookup?callsign=" +
          call +
          "\");'>QRZ.com</div></b></font></td></tr>";
      }
      else
      {
        json.Callsign.source =
          "<tr><td>Source</td><td><font color='orange'><b><div style='cursor:pointer' onClick='window.opener.openSite(\"https://www.qrzcq.com/call/" +
          call +
          "\");'>QRZCQ.com</div></b></font></td></tr>";
      }
      if (gridPass) json.Callsign.gtGrid = gridPass;
      cacheLookupObject(json.Callsign, gridPass, true);
    }
    else
    {
      setLookupDiv(
        "lookupInfoDiv",
        "<br/><b>" + I18N("gt.lookup.NoResult") + "</b><br/><br/>"
      );
      GT.qrzLookupSessionId = null;
    }
  }
  else
  {
    setLookupDiv("lookupInfoDiv", buffer);
    GT.qrzLookupSessionId = null;
  }
}

GT.lastLookupAddress = null;

function startupApplication()
{
  init();
}

GT.lookupCache = {};

function addLookupObjectToCache(lookupObject)
{
  GT.lookupCache[lookupObject.call] = lookupObject;
}

function getLookupCachedObject(call, gridPass, resultFunction = null, noResultFunction = null, callObject = null)
{
  if (call in GT.lookupCache)
  {
    let lookupObject = GT.lookupCache[call];
    if (callObject != null)
    {
      callObject.cnty = lookupObject.cnty;
      if (callObject.cnty in GT.countyData)
      {
        callObject.qual = true;
      }
      else
      {
        callObject.cnty = null;
        callObject.qual = false;
      }
      return;
    }
    if (resultFunction)
    {
      resultFunction(lookupObject, gridPass, false);
    }
  }
  else if (noResultFunction)
  {
    noResultFunction(call, gridPass);
  }
}

function cacheLookupObject(lookup, gridPass, cacheable = false)
{
  if (!("cnty" in lookup))
  {
    lookup.cnty = null;
  }

  if (lookup.hasOwnProperty("callsign"))
  {
    lookup.call = lookup.callsign;
    delete lookup.callsign;
  }

  lookup.call = lookup.call.toUpperCase();

  if (lookup.hasOwnProperty("latitude"))
  {
    lookup.lat = lookup.latitude;
    delete lookup.latitude;
  }
  if (lookup.hasOwnProperty("longitude"))
  {
    lookup.lon = lookup.longitude;
    delete lookup.longitude;
  }
  if (lookup.hasOwnProperty("locator"))
  {
    lookup.grid = lookup.locator;
    delete lookup.locator;
  }
  if (lookup.hasOwnProperty("website"))
  {
    lookup.url = lookup.website;
    delete lookup.website;
  }
  if (lookup.hasOwnProperty("web"))
  {
    lookup.url = lookup.web;
    delete lookup.web;
  }
  if (lookup.hasOwnProperty("qslpic"))
  {
    lookup.image = lookup.qslpic;
    delete lookup.qslpic;
  }
  if (lookup.hasOwnProperty("picture"))
  {
    lookup.image = lookup.picture;
    delete lookup.picture;
  }
  if (lookup.hasOwnProperty("address"))
  {
    lookup.addr1 = lookup.address;
    delete lookup.address;
  }
  if (lookup.hasOwnProperty("adr_city"))
  {
    lookup.addr2 = lookup.adr_city;
    delete lookup.adr_city;
  }
  if (lookup.hasOwnProperty("city"))
  {
    lookup.addr2 = lookup.city;
    delete lookup.city;
  }
  if (lookup.hasOwnProperty("itu"))
  {
    lookup.ituzone = lookup.itu;
    delete lookup.itu;
  }
  if (lookup.hasOwnProperty("cq"))
  {
    lookup.cqzone = lookup.cq;
    delete lookup.cq;
  }
  if (lookup.hasOwnProperty("adif"))
  {
    lookup.dxcc = lookup.adif;
    delete lookup.adif;
  }
  if (!lookup.hasOwnProperty("dxcc"))
  {
    lookup.dxcc = callsignToDxcc(lookup.call.toUpperCase());
  }
  if (lookup.hasOwnProperty("adr_name"))
  {
    lookup.name = lookup.adr_name;
    delete lookup.adr_name;
  }
  if (lookup.hasOwnProperty("adr_street1"))
  {
    lookup.addr1 = lookup.adr_street1;
    delete lookup.adr_street1;
  }
  if (lookup.hasOwnProperty("us_state"))
  {
    lookup.state = lookup.us_state;
    delete lookup.us_state;
  }
  if (lookup.hasOwnProperty("oblast"))
  {
    lookup.state = lookup.oblast;
    delete lookup.oblast;
  }
  if (lookup.hasOwnProperty("district"))
  {
    lookup.state = lookup.district;
    delete lookup.district;
  }
  if (lookup.hasOwnProperty("adr_zip"))
  {
    lookup.zip = lookup.adr_zip;
    delete lookup.adr_zip;
  }
  if (lookup.hasOwnProperty("adr_country"))
  {
    lookup.country = lookup.adr_country;
    delete lookup.adr_country;
  }
  if (lookup.hasOwnProperty("us_county"))
  {
    lookup.county = lookup.us_county;
    delete lookup.us_county;
  }
  if (lookup.hasOwnProperty("qsldirect"))
  {
    lookup.mqsl = lookup.qsldirect;
    delete lookup.qsldirect;
  }
  if (lookup.hasOwnProperty("qsl"))
  {
    lookup.bqsl = lookup.qsl;
    delete lookup.qsl;
  }
  if (lookup.hasOwnProperty("utc_offset"))
  {
    lookup.GMTOffset = lookup.utc_offset;
    delete lookup.utc_offset;
  }

  if (lookup.hasOwnProperty("land"))
  {
    lookup.country = lookup.land;
    delete lookup.land;
  }

  if ("grid" in lookup)
  {
    lookup.grid = lookup.grid.toUpperCase();
  }

  if (lookup.hasOwnProperty("state") && lookup.hasOwnProperty("county"))
  {
    var foundCounty = false;

    if (lookup.cnty == null)
    {
      lookup.county = lookup.state + ", " + lookup.county;
      lookup.cnty = replaceAll(lookup.county.toUpperCase(), " ", "");
    }

    if (lookup.cnty in GT.countyData)
    {
      for (const hash in GT.liveCallsigns)
      {
        if (GT.liveCallsigns[hash].DEcall == lookup.call && GT.liveCallsigns[hash].state == "US-" + lookup.state)
        {
          GT.liveCallsigns[hash].cnty = lookup.cnty;
          GT.liveCallsigns[hash].qual = true;
          GT.liveCallsigns[hash].cntys = 0;
          foundCounty = true;
        }
      }
      if (foundCounty)
      {
        goProcessRoster();
      }
    }
    else
    {
      lookup.cnty = null;
    }
  }

  lookup.name = joinSpaceIf(
    getLookProp(lookup, "fname"),
    getLookProp(lookup, "name")
  );
  lookup.fname = "";

  if (cacheable)
  {
    lookup.cached = timeNowSec();
    addLookupObjectToCache(lookup);
  }

  displayLookupObject(lookup, gridPass, !cacheable);
}

function displayLookupObject(lookup, gridPass, fromCache = false)
{
  var worker = "";
  var thisCall = getLookProp(lookup, "call").toUpperCase();

  worker +=
    "<table title='Click to copy address to clipboard' onclick='setClipboardFromLookup();' style='cursor:pointer' >";
  worker += "<tr>";
  worker += "<td style='font-size:36pt;color:cyan;font-weight:bold'>";
  worker += formatCallsign(getLookProp(lookup, "call").toUpperCase());
  worker += "</td>";
  worker += "<td align='center' style='margin:0;padding:0'>";
  if (lookup.dxcc > 0 && lookup.dxcc in GT.dxccInfo)
  {
    worker +=
      "<img style='padding-top:4px' src='img/flags/24/" +
      GT.dxccInfo[lookup.dxcc].flag +
      "'>";
  }
  worker += "</td>";
  worker += "<td rowspan=6>";
  var image = getLookProp(lookup, "image");
  if (image.length > 0)
  {
    worker += "<img style='border:1px solid gray' class='roundBorder' width='220px' src='" + image + "'>";
  }
  worker += "</td>";
  worker += "</tr>";

  GT.lastLookupAddress = "";
  if (getLookProp(lookup, "addrAttn").length > 0)
  {
    worker += "<tr>";
    worker += "<td>";
    worker += getLookProp(lookup, "addrAttn");
    GT.lastLookupAddress += getLookProp(lookup, "addrAttn") + "\n";
    worker += "</td>";
    worker += "</tr>";
  }
  worker += "<tr>";
  worker += "<td>";
  worker += "<b>" + getLookProp(lookup, "name") + "</b>";
  GT.lastLookupAddress += getLookProp(lookup, "name") + "\n";
  worker += "</td>";
  worker += "</tr>";
  worker += "<tr>";
  worker += "<td>";
  worker += getLookProp(lookup, "addr1");
  GT.lastLookupAddress += getLookProp(lookup, "addr1") + "\n";
  worker += "</td>";
  worker += "</tr>";
  worker += "<tr>";
  worker += "<td>";
  worker += joinCommaIf(
    getLookProp(lookup, "addr2"),
    joinSpaceIf(getLookProp(lookup, "state"), getLookProp(lookup, "zip"))
  );
  GT.lastLookupAddress +=
    joinCommaIf(
      getLookProp(lookup, "addr2"),
      joinSpaceIf(getLookProp(lookup, "state"), getLookProp(lookup, "zip"))
    ) + "\n";
  worker += "</td>";
  worker += "</tr>";
  worker += "<tr>";
  worker += "<td>";
  var country = getLookProp(lookup, "country");
  worker += country;
  GT.lastLookupAddress += country + "\n";

  worker += "</td>";
  worker += "</tr>";
  worker += "<tr>";
  worker += "<td>";
  var email = getLookProp(lookup, "email");
  if (email.length > 0)
  {
    worker +=
      "<div style='cursor:pointer;font-weight:bold;vertical-align:top' onclick='window.opener.mailThem(\"" +
      email +
      "\");'>" +
      email +
      "</div>";
    GT.lastLookupAddress += email + "\n";
  }

  worker += "</td>";
  worker += "</tr>";
  worker += "</table>";
  var card =
    "<div class='mapItem' id='callCard' style='top:0;padding:4px;'>" +
    worker +
    "</div>";
  worker = "";
  worker += "<table align='center' class='bioTable' >";
  worker += "<tr><th colspan=2>Details</th></tr>";
  if (getLookProp(lookup, "url").length > 0)
  {
    worker += "<tr>";
    worker += "<td>Website</td>";
    worker += "<td  >";
    worker +=
      "<font color='orange'><b><div style='cursor:pointer' onClick='window.opener.openSite(\"" +
      getLookProp(lookup, "url") +
      "\");' >Link</div></b></font>";
    worker += "</td>";
    worker += "</tr>";
  }
  if (Number(getLookProp(lookup, "bio")) > 0)
  {
    worker += "<tr>";
    worker += "<td>Biography</td>";
    worker += "<td>";
    worker +=
      "<font color='orange'><b><div style='cursor:pointer' onClick='window.opener.openSite(\"https://www.qrz.com/db/" +
      getLookProp(lookup, "call") +
      "\");'>Link</div></b></font>";
    worker += "</td>";
    worker += "</tr>";
  }

  for (const cid in GT.gtCallsigns[thisCall])
  {
    if (cid in GT.gtFlagPins && GT.gtFlagPins[cid].canmsg == true)
    {
      worker += "<tr style='cursor:pointer' onClick='window.opener.showMessaging(true, \"" + cid + "\")'><td>" + I18N("rosterColumns.OAMS.user") + "</td><td><img height='13px' style='margin-bottom:-2px;' src='img/gt_chat.png' /></td></tr>";
      break;
    }
  }

  worker += makeRow("Type", lookup, "type");
  worker += makeRow("Class", lookup, "class");
  worker += makeRow("Codes", lookup, "codes");
  worker += makeRow("QTH", lookup, "qth");
  var dates = joinIfBothWithDash(
    getLookProp(lookup, "efdate"),
    getLookProp(lookup, "expdate")
  );
  if (dates.length > 0)
  {
    worker += "<tr><td>Effective Dates</td><td>" + dates + "</td></tr>";
  }
  var Aliases = joinCommaIf(
    getLookProp(lookup, "aliases"),
    getLookProp(lookup, "p_call")
  );
  if (Aliases.length > 0)
  {
    worker +=
      "<tr title='" +
      Aliases +
      "' ><td>Aliases</td><td>" +
      Aliases +
      "</td></tr>";
  }
  worker += makeRow("Polish OT", lookup, "plot");
  worker += makeRow("German DOK", lookup, "dok");
  worker += makeYesNoRow("DOK is Sonder-DOK", lookup, "sondok");
  // worker += makeRow("DXCC", lookup, "dxcc");
  worker +=
    "<tr><td>DXCC</td><td>" +
    getLookProp(lookup, "dxcc") + " - " + GT.dxccToAltName[getLookProp(lookup, "dxcc")] +
    "</td></tr>";
  worker += makeRow("CQ zone", lookup, "cqzone");
  worker += makeRow("ITU zone", lookup, "ituzone");
  worker += makeRow("IOTA", lookup, "iota");
  worker += makeRow("FIPS", lookup, "fips");
  worker += makeRow("FRN", lookup, "frn");
  worker += makeRow("Timezone", lookup, "TimeZone");
  worker += makeRow("GMT Offset", lookup, "GMTOffset");
  worker += makeRow("County", lookup, "county");
  worker += makeRow("Latitude", lookup, "lat");
  worker += makeRow("Longitude", lookup, "lon");
  if (getLookProp(lookup, "lat").length > 0 && getLookProp(lookup, "lon").length > 0)
  {
    worker += "<tr><td>Distance</td><td style='color:cyan'>" +
      parseInt(
        MyCircle.distance(
          GT.myLat,
          GT.myLon,
          Number(lookup.lat), Number(lookup.lon),
          distanceUnit.value
        ) * MyCircle.validateRadius(distanceUnit.value)
      ) + distanceUnit.value.toLowerCase() + "</td></tr>";
    var bearing = parseInt(MyCircle.bearing(GT.myLat, GT.myLon, Number(lookup.lat), Number(lookup.lon)));
    worker += "<tr><td>Azimuth</td><td style='color:yellow'>" + bearing + "&deg;</td></tr>";
  }
  worker += makeRow("Grid", lookup, "grid", true);
  if (
    getLookProp(lookup, "gtGrid").length > 0 &&
    getLookProp(lookup, "gtGrid").toUpperCase() !=
    getLookProp(lookup, "grid").toUpperCase()
  )
  {
    worker += makeRow("GT Grid", lookup, "gtGrid");
  }

  worker += makeRow("Born", lookup, "born");
  worker += makeYesNoRow("LoTW", lookup, "lotw");
  worker += makeYesNoRow("eQSL", lookup, "eqsl");
  worker += makeYesNoRow("Bureau QSL", lookup, "bqsl");
  worker += makeYesNoRow("Mail Direct QSL", lookup, "mqsl");
  worker += makeRow("QSL Via", lookup, "qsl_via");
  worker += makeRow("QRZ Admin", lookup, "user");
  worker += makeRow("Prefix", lookup, "prefix");
  worker += lookup.source;

  if (GT.callsignLookups.lotwUseEnable == true && thisCall in GT.lotwCallsigns)
  {
    lookup.ulotw =
      "&#10004; (" +
      userDayString(GT.lotwCallsigns[thisCall] * 86400 * 1000) +
      ")";
    worker += makeRow("LoTW Member", lookup, "ulotw");
  }
  if (GT.callsignLookups.eqslUseEnable == true && thisCall in GT.eqslCallsigns)
  {
    lookup.ueqsl = "&#10004;";
    worker += makeRow("eQSL Member", lookup, "ueqsl");
  }
  if (GT.callsignLookups.oqrsUseEnable == true && thisCall in GT.oqrsCallsigns)
  {
    lookup.uoqrs = "&#10004;";
    worker += makeRow("ClubLog OQRS", lookup, "uoqrs");
  }

  if (fromCache)
  {
    worker += "<tr><td>Cached</td><td>Yes</td></tr>";
  }

  worker += "</table>";
  var details =
    "<div class='mapItem' id='callDetails' style='padding:4px;'>" +
    worker +
    "</div>";

  var genMessage =
    "<tr><td colspan=2><div title=\"Clear\" class=\"button\" onclick=\"window.opener.clearLookup();\" >Clear</div> <div title=\"Generate Messages\" class=\"button\" onclick=\"window.opener.setCallAndGrid('" +
    getLookProp(lookup, "call") +
    "','" +
    getLookProp(lookup, "grid") +
    "');\">Generate Messages</div></td></tr>";

  setLookupDiv(
    "lookupInfoDiv",
    "<table align='center'><tr><td>" +
    card +
    "</td><td>" +
    details +
    "</td></tr>" +
    genMessage +
    "</table>"
  );
  setLookupDivHeight("lookupBoxDiv", getLookupWindowHeight() + "px");
}

function clearLookup()
{
  if (GT.lookupWindowInitialized)
  {
    GT.lookupWindowHandle.window.lookupCallsignInput.value = "";
    lookupValidateCallByElement("lookupCallsignInput");
    setLookupDiv("lookupLocalDiv", "");
    setLookupDiv("lookupInfoDiv", "");
    setLookupDivHeight("lookupBoxDiv", getLookupWindowHeight() + "px");
  }
}

function addTextToClipboard(data)
{
  navigator.clipboard.writeText(data);
}

function makeYesNoRow(first, object, key)
{
  var value = getLookProp(object, key);
  if (value.length > 0)
  {
    var test = value.toUpperCase();
    if (test == "Y") return "<tr><td>" + first + "</td><td>Yes</td></tr>";
    if (test == "N") return "<tr><td>" + first + "</td><td>No</td></tr>";
    if (test == "?") return "";
    return (
      "<tr><td>" +
      first +
      "</td><td>" +
      (object[key] == 1 ? "Yes" : "No") +
      "</td></tr>"
    );
  }
  return "";
}

function makeRow(first, object, key, clip = false)
{
  var value = getLookProp(object, key);
  if (value.length > 0)
  {
    if (clip)
    {
      return (
        "<tr><td>" +
        first +
        "</td><td title='Copy to clipboard' style='cursor:pointer;color:cyan;font-weight: bold;' onClick='addTextToClipboard(\"" +
        object[key].substr(0, 45) +
        "\")'>" +
        object[key].substr(0, 45) +
        "</td></tr>"
      );
    }
    else
    {
      return (
        "<tr><td>" +
        first +
        "</td><td>" +
        object[key].substr(0, 45) +
        "</td></tr>"
      );
    }
  }
  return "";
}

function getLookProp(object, key)
{
  return object.hasOwnProperty(key) ? object[key] : "";
}

function joinSpaceIf(camera1, camera2)
{
  if (camera1.length > 0 && camera2.length > 0) return camera1 + " " + camera2;
  if (camera1.length > 0) return camera1;
  if (camera2.length > 0) return camera2;
  return "";
}

function joinCommaIf(camera1, camera2)
{
  if (camera1.length > 0 && camera2.length > 0)
  {
    if (camera1.indexOf(",") > -1) return camera1 + " " + camera2;
    else return camera1 + ", " + camera2;
  }
  if (camera1.length > 0) return camera1;
  if (camera2.length > 0) return camera2;
  return "";
}

function joinIfBothWithDash(camera1, camera2)
{
  if (camera1.length > 0 && camera2.length > 0) { return camera1 + " / " + camera2; }
  return "";
}

function startLookup(call, grid)
{
  if (call == "-") return;
  if (grid == "-") grid = "";

  openLookupWindow(true);

  lookupCallsign(call, grid);
}

function searchLogForCallsign(call)
{
  setLookupDiv("lookupLocalDiv", "");
  var list = Object.values(GT.QSOhash)
    .filter(function (value)
    {
      return value.DEcall == call;
    })
    .sort(GT.appSettings.myBandCompare);

  var worker = "";

  if (call in GT.acknowledgedCalls)
  {
    worker = "<h3>" + I18N("gt.lookup.acks") + " " + formatCallsign(call) + " <img class='lookupAckBadge' src='" + GT.acknowledgedCalls[call].badge + "'> " + GT.acknowledgedCalls[call].message + "</h3>";
  }

  var work = {};
  var conf = {};
  var lastTime = 0;
  var lastRow = null;
  var dxcc = (list.length > 0 ? list[0].dxcc : callsignToDxcc(call));

  for (row in list)
  {
    var what = list[row].band + "," + list[row].mode;
    if (list[row].time > lastTime)
    {
      lastRow = row;
      lastTime = list[row].time;
    }
    if (list[row].confirmed)
    {
      conf[what] = GT.pskColors[list[row].band];
      if (what in work) delete work[what];
    }
    else if (!(what in conf)) work[what] = GT.pskColors[list[row].band];
  }
  worker += "<div class='mapItemNoSize'><table align='center' class='darkTable'>";
  if (Object.keys(work).length > 0)
  {
    worker += "<tr><th style='color:yellow'>Worked</th><td>";
    var k = Object.keys(work).sort();
    for (var key in k)
    {
      worker += "<font color='#" + work[k[key]] + "'>" + k[key] + " </font>";
    }
    worker += "</td></tr>";
  }
  if (Object.keys(conf).length > 0)
  {
    worker += "<tr><th style='color:lightgreen'>Confirmed</th><td>";
    var k = Object.keys(conf).sort();
    for (var key in k)
    {
      worker += "<font color='#" + conf[k[key]] + "'>" + k[key] + " </font>";
    }
    worker += "</td></tr>";
  }
  if (lastRow)
  {
    worker += "<tr><th style='color:cyan'>Last QSO</th><td>";
    worker += "<font color='#" + GT.pskColors[list[lastRow].band] + "'>" + list[lastRow].band + "," + list[lastRow].mode + " </font> " + userTimeString(list[lastRow].time * 1000);
    worker += "</td></tr>";
  }

  worker += "<tr><th style='color:orange'>" + GT.dxccToAltName[dxcc] + " (" + GT.dxccInfo[dxcc].pp + ")</th><td>";
  for (var band in GT.colorBands)
  {
    if (String(dxcc) + "|" + GT.colorBands[band] in GT.tracker.worked.dxcc)
    {
      var strike = "";
      if (String(dxcc) + "|" + GT.colorBands[band] in GT.tracker.confirmed.dxcc) { strike = "text-decoration: underline overline;"; }
      worker += "<div style='" + strike + "display:inline-block;color:#" + GT.pskColors[GT.colorBands[band]] + "'>" + GT.colorBands[band] + "</div>&nbsp;";
    }
  }

  worker += "</td></tr></table></div>";
  setLookupDiv("lookupLocalDiv", worker);
}

function startGenMessages(call, grid, instance = null)
{
  if (call == "-") return;
  if (grid == "-") grid = "";

  setCallAndGrid(call, grid, instance);
}

function is_dir(path)
{
  try
  {
    var stat = fs.lstatSync(path);
    return stat.isDirectory();
  }
  catch (e)
  {
    // lstatSync throws an error if path doesn't exist, which isn't an error so don't send it to console
    return false;
  }
}

function mediaCheck()
{
  GT.GTappData = path.join(electron.ipcRenderer.sendSync("getPath","userData"), "Ginternal");
  GT.appData = path.join(electron.ipcRenderer.sendSync("getPath", "userData"), "Documents");

  GT.scriptDir = path.join(GT.appData, "scripts");

  try
  {
    var tryDirectory = "";
    var userdirs = [
      GT.GTappData,
      GT.appData,
      GT.scriptDir
    ];
    for (var dir of userdirs)
    {
      if (!fs.existsSync(dir))
      {
        tryDirectory = dir;
        fs.mkdirSync(dir);
      }
    }
  }
  catch (e)
  {
    alert("Unable to create or access " + tryDirectory + " folder.\r\nPermission violation, GT cannot continue");
  }

  GT.GTappData += GT.dirSeperator;
  GT.scriptDir += GT.dirSeperator;

  GT.qsoLogFile = path.join(GT.appData, "GridTracker_QSO.adif");
  GT.LoTWLogFile = path.join(GT.appData, "LogbookOfTheWorld.adif");
  GT.QrzLogFile = path.join(GT.appData, "qrz.adif");
  GT.clublogLogFile = path.join(GT.appData, "clublog.adif");

  logEventMedia.appendChild(newOption("none", "None"));
  msgAlertMedia.appendChild(newOption("none", "Select File"));
  alertMediaSelect.appendChild(newOption("none", "Select File"));
  huntCallsignNotifyMedia.appendChild(newOption("none", "Select File"));
  huntGridNotifyMedia.appendChild(newOption("none", "Select File"));
  huntDXCCNotifyMedia.appendChild(newOption("none", "Select File"));
  huntCQzNotifyMedia.appendChild(newOption("none", "Select File"));
  huntITUzNotifyMedia.appendChild(newOption("none", "Select File"));
  huntStatesNotifyMedia.appendChild(newOption("none", "Select File"));
  huntRosterNotifyMedia.appendChild(newOption("none", "Select File"));

  var mediaFiles = fs.readdirSync(GT.gtMediaDir);

  mediaFiles.forEach((filename) =>
  {
    var noExt = path.parse(filename).name;
    logEventMedia.appendChild(newOption(filename, noExt));
    alertMediaSelect.appendChild(newOption(filename, noExt));
    huntCallsignNotifyMedia.appendChild(newOption(filename, noExt));
    huntGridNotifyMedia.appendChild(newOption(filename, noExt));
    huntDXCCNotifyMedia.appendChild(newOption(filename, noExt));
    huntCQzNotifyMedia.appendChild(newOption(filename, noExt));
    huntITUzNotifyMedia.appendChild(newOption(filename, noExt));
    huntStatesNotifyMedia.appendChild(newOption(filename, noExt));
    huntRosterNotifyMedia.appendChild(newOption(filename, noExt));
    msgAlertMedia.appendChild(newOption(filename, noExt));
  });

  GT.modes = requireJson("data/modes.json");
  for (var key in GT.modes)
  {
    gtModeFilter.appendChild(newOption(key));
  }

  GT.modes_phone = requireJson("data/modes-phone.json");

  initQSOdata();
  GT.QSOhash = {};
  GT.QSLcount = 0;
  GT.QSOcount = 0;


  try
  {
    let fileExists = fs.existsSync(GT.GTappData + "internal_qso.json");
    if (fileExists == true && GT.startVersion > 1240831)
    {
      var data = require(GT.GTappData + "internal_qso.json");
      GT.tracker = data.tracker;
      GT.myQsoGrids = data.myQsoGrids;
      GT.myQsoCalls = data.myQsoCalls;
      GT.QSOhash = data.g_QSOhash;

      for (const i in GT.QSOhash)
      {
        GT.QSOcount++;
        if (GT.QSOhash[i].confirmed) GT.QSLcount++;
      }
      fs.unlinkSync(GT.GTappData + "internal_qso.json");
    }
    else if (fileExists == true)
    {
      fs.unlinkSync(GT.GTappData + "internal_qso.json");
    }

    loadReceptionReports();
  }
  catch (e)
  {
  }
}

function newOption(value, text)
{
  if (typeof text == "undefined") text = value;
  var option = document.createElement("option");
  option.value = value;
  option.text = text;
  return option;
}

GT.rosterSpot = false;
function setRosterSpot(enabled)
{
  GT.rosterSpot = enabled;
}

function saveReceptionReports()
{
  try
  {
    fs.writeFileSync(
      GT.GTappData + "spots.json",
      JSON.stringify(GT.receptionReports)
    );
  }
  catch (e)
  {
    console.error(e);
  }
}

function loadReceptionReports()
{
  try
  {
    var clear = true;
    if (fs.existsSync(GT.GTappData + "spots.json"))
    {
      GT.receptionReports = require(GT.GTappData + "spots.json");
      if (timeNowSec() - GT.receptionReports.lastDownloadTimeSec <= 86400) { clear = false; }
    }

    if (clear == true)
    {
      GT.receptionReports = {
        lastDownloadTimeSec: 0,
        lastSequenceNumber: "0",
        spots: {}
      };
    }
  }
  catch (e)
  {
    GT.receptionReports = {
      lastDownloadTimeSec: 0,
      lastSequenceNumber: "0",
      spots: {}
    };
  }
}

function pskSpotCheck(timeSec)
{
  if (GT.mapSettings.offlineMode == true) return;

  if (GT.appSettings.myCall == null || GT.appSettings.myCall == "NOCALL" || GT.appSettings.myCall == "") return;

  if (
    (GT.spotView > 0 || GT.rosterSpot) &&
    (GT.receptionReports.lastDownloadTimeSec < GT.lastTrasmissionTimeSec) &&
    (
      timeSec - GT.receptionReports.lastDownloadTimeSec > PSKREPORTER_INTERVAL_IN_SECONDS ||
      GT.receptionReports.lastDownloadTimeSec > timeSec
    )
  )
  {
    GT.receptionReports.lastDownloadTimeSec = timeSec;
    GT.localStorage.receptionSettings = JSON.stringify(GT.receptionSettings);
    spotRefreshDiv.innerHTML = "…refreshing…";
    getBuffer(
      `https://retrieve.pskreporter.info/query?rronly=1&lastseqno=${GT.receptionReports.lastSequenceNumber}` +
      `&senderCallsign=${encodeURIComponent(GT.appSettings.myRawCall)}` +
      `&appcontact=${encodeURIComponent(`GT-${gtVersionStr}`)}`,
      pskSpotResults,
      null,
      "https",
      443
    );
  }
  else if (GT.spotView > 0)
  {
    if (
      GT.lastTrasmissionTimeSec < GT.receptionReports.lastDownloadTimeSec &&
      (timeSec - GT.receptionReports.lastDownloadTimeSec) > PSKREPORTER_INTERVAL_IN_SECONDS
    )
    {
      spotRefreshDiv.innerHTML = "No recent TX";
    }
    else
    {
      spotRefreshDiv.innerHTML =
        "Refresh: " +
        toDHMS(Number(PSKREPORTER_INTERVAL_IN_SECONDS - (timeSec - GT.receptionReports.lastDownloadTimeSec)));
    }
  }
}

function pskSpotResults(buffer, flag)
{
  var oParser = new DOMParser();
  var oDOM = oParser.parseFromString(buffer, "text/xml");
  var result = "";
  if (oDOM != null)
  {
    var json = XML2jsobj(oDOM.documentElement);
    if ("lastSequenceNumber" in json)
    {
      GT.receptionReports.lastSequenceNumber = json.lastSequenceNumber.value;

      if ("receptionReport" in json)
      {
        for (const key in json.receptionReport)
        {
          if (typeof json.receptionReport[key].frequency != "undefined" && typeof json.receptionReport[key].sNR != "undefined")
          {
            var report;
            var call = json.receptionReport[key].receiverCallsign;
            var mode = json.receptionReport[key].mode;
            var grid = json.receptionReport[key].receiverLocator.substr(0, 6);
            if (grid.length < 4) { continue; }
            var band = formatBand(Number(parseInt(json.receptionReport[key].frequency) / 1000000));
            var hash = call + mode + band;

            if (hash in GT.receptionReports.spots)
            {
              report = GT.receptionReports.spots[hash];
              if (parseInt(json.receptionReport[key].flowStartSeconds) < report.when) { continue; }
            }
            else
            {
              report = GT.receptionReports.spots[hash] = {};
              report.call = call;
              report.band = band;
              report.grid = grid.toUpperCase();
              report.mode = mode;
            }
            if (typeof json.receptionReport[key].receiverCallsign != "undefined")
            {
              report.dxcc = callsignToDxcc(json.receptionReport[key].receiverCallsign);
            }
            else report.dxcc = -1;
            report.when = parseInt(json.receptionReport[key].flowStartSeconds);
            report.snr = json.receptionReport[key].sNR;
            report.freq = parseInt(json.receptionReport[key].frequency);

            var SNR = parseInt((parseInt(report.snr) + 25) * 9);
            if (SNR > 255) SNR = 255;
            if (SNR < 0) SNR = 0;
            report.color = SNR;
            report.source = "P";
          }
        }
      }
    }
  }

  GT.receptionReports.lastDownloadTimeSec = timeNowSec();

  GT.localStorage.receptionSettings = JSON.stringify(GT.receptionSettings);

  redrawSpots();
  if (GT.rosterSpot) goProcessRoster();
}

GT.oamsSpotTimeout = null;

function addNewOAMSSpot(cid, db, frequency, band, mode)
{
  if (GT.oamsSpotTimeout !== null)
  {
    nodeTimers.clearTimeout(GT.oamsSpotTimeout);
    GT.oamsSpotTimeout = null;
  }

  var report;
  var call = GT.gtFlagPins[cid].call;
  var grid = GT.gtFlagPins[cid].grid.substr(0, 6);
  var hash = call + mode + band;

  if (hash in GT.receptionReports.spots)
  {
    report = GT.receptionReports.spots[hash];
  }
  else
  {
    report = GT.receptionReports.spots[hash] = {};
    report.call = call;
    report.band = band;
    report.grid = grid;
    report.mode = mode;
  }

  report.dxcc = GT.gtFlagPins[cid].dxcc;
  report.when = timeNowSec();
  report.snr = Number(db);
  report.freq = frequency;

  var SNR = parseInt((parseInt(report.snr) + 25) * 9);
  if (SNR > 255) SNR = 255;
  if (SNR < 0) SNR = 0;
  report.color = SNR;
  report.source = "O";
  GT.oamsSpotTimeout = nodeTimers.setTimeout(redrawSpots, 250);
}

function spotFeature(center)
{
  return new ol.Feature(
    ol.geom.Polygon.circular(center, 30000, 63).transform(
      "EPSG:4326",
      GT.mapSettings.projection
    )
  );
}

GT.spotTotalCount = 0;

function createSpot(report, key, fromPoint, addToLayer = true)
{
  try
  {
    var LL = squareToCenter(report.grid);

    if (isNaN(LL.a))
    {
      // Bad value in grid, don't map //
      return;
    }

    var spot = spotFeature([LL.o, LL.a]);

    var colorNoAlpha = "#" + GT.bandToColor[report.band];
    var colorAlpha = intAlphaToRGB(colorNoAlpha, report.color);
    var spotColor = colorAlpha;

    var workingColor = GT.mapSettings.nightMapEnable && GT.nightTime ? GT.receptionSettings.pathNightColor : GT.receptionSettings.pathColor;

    if (workingColor != -1)
    {
      var testColor = workingColor < 1 ? "#0000000" : workingColor == 361 ? "#FFFFFF" : "hsla(" + workingColor + ", 100%, 50%," + report.color / 255 + ")";
      if (workingColor < 1 || workingColor == 361)
      {
        spotColor = intAlphaToRGB(testColor.substr(0, 7), report.color);
      }
      else
      {
        spotColor = testColor;
      }
    }

    featureStyle = new ol.style.Style({
      fill: new ol.style.Fill({
        color: spotColor
      }),
      stroke: new ol.style.Stroke({
        color: "#000000FF",
        width: 0.25
      })
    });
    spot.setStyle(featureStyle);
    spot.spot = key;
    spot.set("prop", "spot");
    spot.size = 6; // Mouseover detection
    GT.layerSources.pskSpots.addFeature(spot);

    var toPoint = ol.proj.fromLonLat([LL.o, LL.a]);

    var lonLat = new ol.geom.Point(toPoint);

    var pointFeature = new ol.Feature({
      geometry: lonLat,
      weight: report.color / 255 // e.g. temperature
    });

    if (GT.useTransform)
    {
      pointFeature.getGeometry().transform("EPSG:3857", GT.mapSettings.projection);
    }

    GT.layerSources.pskHeat.addFeature(pointFeature);

    if (GT.receptionSettings.viewPaths && GT.receptionSettings.spotWidth > 0)
    {
      var strokeWeight = GT.receptionSettings.spotWidth;

      var flightColor =
        workingColor == -1
          ? colorNoAlpha + "BB"
          : GT.mapSettings.nightMapEnable && GT.nightTime
            ? GT.spotNightFlightColor
            : GT.spotFlightColor;

      flightFeature(
        [fromPoint, toPoint],
        {
          weight: strokeWeight,
          color: flightColor,
          steps: 75
        },
        "pskFlights",
        false
      );
    }
  }
  catch (err)
  {
    console.error("Unexpected error inside createSpot", report, err)
  }
}

function redrawSpots()
{
  var shouldSave = false;
  var now = timeNowSec();
  GT.spotTotalCount = 0;
  GT.layerSources.pskSpots.clear();
  GT.layerSources.pskFlights.clear();
  GT.layerSources.pskHop.clear();
  GT.layerSources.pskHeat.clear();

  var fromPoint = getPoint(GT.appSettings.myRawGrid);

  if (GT.receptionSettings.mergeSpots == false)
  {
    var spot = iconFeature(fromPoint, GT.gtFlagIcon, 100, "homeFlag");
    GT.layerSources.pskSpots.addFeature(spot);
  }

  for (var key in GT.receptionReports.spots)
  {
    report = GT.receptionReports.spots[key];

    if ((now - report.when > 86400) || (report.grid.length < 4))
    {
      delete GT.receptionReports.spots[key];
      shouldSave = true;
      continue;
    }

    if (validateMapBandAndMode(report.band, report.mode))
    {
      if (now - report.when <= GT.receptionSettings.viewHistoryTimeSec)
      {
        createSpot(report, key, fromPoint);
        GT.spotTotalCount++;
      }
    }
  }
  if (shouldSave)
  {
    saveReceptionReports();
  }

  updateSpotCountDiv();
}

function updateSpotCountDiv()
{
  spotCountDiv.innerHTML = "Spots: " + GT.spotTotalCount;
}

GT.spotFlightColor = "#FFFFFFBB";
GT.spotNightFlightColor = "#FFFFFFBB";

function changeSpotValues()
{
  GT.receptionSettings.viewHistoryTimeSec = parseInt(spotHistoryTimeValue.value) * 60;
  spotHistoryTimeTd.innerHTML = "Max Age: " + toDHM(Number(GT.receptionSettings.viewHistoryTimeSec));
  GT.receptionSettings.viewPaths = spotPathsValue.checked;

  if (GT.receptionSettings.viewPaths)
  {
    spotPathWidthDiv.style.display = "inline-block";
  }
  else
  {
    spotPathWidthDiv.style.display = "none";
  }

  GT.receptionSettings.mergeSpots = spotMergeValue.checked;
  GT.localStorage.receptionSettings = JSON.stringify(GT.receptionSettings);

  setTrophyOverlay(GT.currentOverlay);
  updateSpotView();
  if (GT.rosterSpot) goProcessRoster();
}

function mapTransChange()
{
  GT.mapSettings.mapTrans = mapTransValue.value;

  mapTransTd.innerHTML = String(100 - parseInt(((GT.mapSettings.mapTrans * 255) / 255) * 100)) + "%";
  mapSettingsDiv.style.backgroundColor = "rgba(0,0,0, " + GT.mapSettings.mapTrans + ")";
}

function spotPathChange()
{
  GT.receptionSettings.pathColor = spotPathColorValue.value;
  var pathColor = GT.receptionSettings.pathColor < 1
    ? "#000"
    : GT.receptionSettings.pathColor == 361
      ? "#FFF"
      : "hsl(" + GT.receptionSettings.pathColor + ", 100%, 50%)";

  if (GT.receptionSettings.pathColor > 0)
  {
    spotPathColorDiv.style.color = "#000";
    spotPathColorDiv.style.backgroundColor = pathColor;
  }
  else
  {
    spotPathColorDiv.style.color = "#FFF";
    spotPathColorDiv.style.backgroundColor = pathColor;
  }
  if (GT.receptionSettings.pathColor == -1) { spotPathInfoTd.innerHTML = "PSK-Reporter Palette"; }
  else spotPathInfoTd.innerHTML = "";

  GT.spotFlightColor =
    GT.receptionSettings.pathColor < 1
      ? "#0000000BB"
      : GT.receptionSettings.pathColor == 361
        ? "#FFFFFFBB"
        : "hsla(" + GT.receptionSettings.pathColor + ", 100%, 50%,0.73)";

  GT.receptionSettings.pathNightColor = spotNightPathColorValue.value;
  var pathNightColor =
    GT.receptionSettings.pathNightColor < 1
      ? "#000"
      : GT.receptionSettings.pathNightColor == 361
        ? "#FFF"
        : "hsl(" + GT.receptionSettings.pathNightColor + ", 100%, 50%)";
  if (GT.receptionSettings.pathNightColor > 0)
  {
    spotNightPathColorDiv.style.color = "#000";
    spotNightPathColorDiv.style.backgroundColor = pathNightColor;
  }
  else
  {
    spotNightPathColorDiv.style.color = "#FFF";
    spotNightPathColorDiv.style.backgroundColor = pathNightColor;
  }
  if (GT.receptionSettings.pathNightColor == -1) { spotNightPathInfoTd.innerHTML = "PSK-Reporter Palette"; }
  else spotNightPathInfoTd.innerHTML = "";

  GT.spotNightFlightColor =
    GT.receptionSettings.pathNightColor < 1
      ? "#0000000BB"
      : GT.receptionSettings.pathNightColor == 361
        ? "#FFFFFFBB"
        : "hsla(" + GT.receptionSettings.pathNightColor + ", 100%, 50%,0.73)";

  spotWidthTd.innerHTML = GT.receptionSettings.spotWidth = spotWidthValue.value;

  GT.localStorage.receptionSettings = JSON.stringify(GT.receptionSettings);
}

function toggleSpotOverGrids()
{
  spotMergeValue.checked = spotMergeValue.checked != true;
  changeSpotValues();
  redrawSpots();
}

function toggleMergeOverlay()
{
  mergeOverlayValue.checked = mergeOverlayValue.checked != true;
  changeMergeOverlayValue();
}

function toggleSpotPaths()
{
  var spotPaths = spotPathsValue.checked == true ? 1 : 0;
  spotPaths ^= 1;
  spotPathsValue.checked = spotPaths == 1;
  GT.receptionSettings.viewPaths = spotPathsValue.checked;
  GT.localStorage.receptionSettings = JSON.stringify(GT.receptionSettings);

  if (GT.receptionSettings.viewPaths)
  {
    spotPathWidthDiv.style.display = "inline-block";
  }
  else
  {
    spotPathWidthDiv.style.display = "none";
  }
  redrawSpots();
}

function setSpotImage()
{
  spotsButtonImg.src = GT.spotImageArray[GT.spotView];
  spotsButtonImg.style.filter = (GT.spotView == 0) ? "grayscale(1)" : "";
}

function cycleSpotsView()
{
  GT.spotView++;
  GT.spotView %= 3;

  GT.appSettings.spotView = GT.spotView;
  setSpotImage();

  setTrophyOverlay(GT.currentOverlay);
  updateSpotView();
}

function toggleCRScript()
{
  GT.crScript ^= 1;
  GT.appSettings.crScript = GT.crScript;
  if (GT.crScript == 1)
  {
    addLastTraffic("<font style='color:lightgreen'>Call Roster Script Enabled</font>");
  }
  else
  {
    addLastTraffic("<font style='color:yellow'>Call Roster Script Disabled</font>");
  }
  goProcessRoster();
}

function updateSpotView(leaveCount = true)
{
  if (GT.spotView > 0)
  {
    if (GT.receptionSettings.mergeSpots == false)
    {
      for (var key in GT.layerVectors)
      {
        GT.layerVectors[key].setVisible(false);
      }
    }
    if (GT.spotView == 1)
    {
      GT.layerVectors.pskSpots.setVisible(true);
      GT.layerVectors.pskFlights.setVisible(true);
      GT.layerVectors.pskHop.setVisible(true);
      GT.layerVectors.pskHeat.setVisible(false);
    }
    else
    {
      GT.layerVectors.pskSpots.setVisible(false);
      GT.layerVectors.pskFlights.setVisible(false);
      GT.layerVectors.pskHop.setVisible(false);
      GT.layerVectors.pskHeat.setVisible(true);
    }

    spotsDiv.style.display = "block";
    if (leaveCount == false) spotRefreshDiv.innerHTML = "&nbsp;";
  }
  else
  {
    GT.layerVectors.pskSpots.setVisible(false);
    GT.layerVectors.pskFlights.setVisible(false);
    GT.layerVectors.pskHop.setVisible(false);
    GT.layerVectors.pskHeat.setVisible(false);
    spotsDiv.style.display = "none";
    spotRefreshDiv.innerHTML = "&nbsp;";
  }
}

function gotoDonate()
{
  window.open("https://gridtracker.org/donations/");
}

function getSpotTime(hash)
{
  if (hash in GT.receptionReports.spots)
  {
    return GT.receptionReports.spots[hash];
  }
  else return { when: 0, snr: 0 };
}

function setGridOpacity()
{
  opacityValue.value = GT.mapSettings.gridAlpha;
  showOpacityTd.innerHTML = parseInt((GT.mapSettings.gridAlpha / 255) * 100) + "%";
  GT.gridAlpha = parseInt(GT.mapSettings.gridAlpha).toString(16);
}

function changeGridOpacity()
{
  GT.mapSettings.gridAlpha = opacityValue.value;
  showOpacityTd.innerHTML = parseInt((GT.mapSettings.gridAlpha / 255) * 100) + "%";
  GT.gridAlpha = parseInt(GT.mapSettings.gridAlpha).toString(16);
  saveMapSettings();
}

function currentTimeStampString()
{
  var now = new Date();
  return (
    now.getFullYear() +
    "-" +
    (now.getMonth() + 1) +
    "-" +
    now.getDate() +
    " " +
    padNumber(now.getHours()) +
    "." +
    padNumber(now.getMinutes()) +
    "." +
    padNumber(now.getSeconds())
  );
}

function showNativeFolder(fn)
{
  nw.Shell.showItemInFolder(decodeURI(fn));
}

function refreshSpotsNoTx()
{
  redrawSpots();
}

GT.PredLayer = null;
GT.predLayerTimeout = null;
GT.epiTimeValue = 0;

function changePredOpacityValue()
{
  predOpacityTd.innerHTML = GT.mapSettings.predOpacity = predOpacityValue.value;
  if (GT.PredLayer != null)
  {
    GT.PredLayer.setOpacity(Number(GT.mapSettings.predOpacity));
  }
}

function changeEpiTimeValue()
{
  GT.epiTimeValue = epiTimeValue.value;
  epiTimeOffsetTd.innerHTML = ((GT.epiTimeValue > 0) ? "+" + GT.epiTimeValue : GT.epiTimeValue) + "h";
  predLayerRefreh();
}

function getCurrentPredURL()
{
  let where = "";
  let now = timeNowSec();
  let timeOut = 0;
  if (GT.mapSettings.predMode < 3)
  {
    timeOut = 901 * 1000;
    where = GT.mapSettings.predMode == 1 ? "https://tagloomis.com/muf/img/muf.png?" : "https://tagloomis.com/muf/img/fof2.png?";
    where += String(now - (now % 900));
  }
  else if (GT.mapSettings.predMode == 3)
  {
    timeOut = (3601 - (now % 3600)) * 1000;
    now = now + (GT.epiTimeValue * 3600);
    now = now - (now % 3600);
    where = "https://tagloomis.com/epi/img/" + now + ".jpg";
    epiTimeTd.innerHTML = "<font color='lightblue'>" + userTimeString(now * 1000) + "</font>";
  }
  else if (GT.mapSettings.predMode == 4)
  {
    timeOut = 361 * 1000;
    where = "https://tagloomis.com/auf/img/auf.png?" + String(now - (now % 360));
    getAufTimes(now - (now % 360));
  }
  if (GT.predLayerTimeout != null)
  {
    nodeTimers.clearTimeout(GT.predLayerTimeout);
    GT.predLayerTimeout = null;
  }
  if (timeOut > 0)
  {
    GT.predLayerTimeout = nodeTimers.setTimeout(predLayerRefreh, timeOut);
  }
  return where;
}

function createPredSource()
{
  return new ol.source.XYZ({
    url: getCurrentPredURL(),
    attributions: GT.mapSettings.predMode < 3 ? "<a href='https://prop.kc2g.com/acknowledgments/' target='_blank' title='Visit prop.kc2g.com'>KC2G</a>" : GT.mapSettings.predMode == 3 ? "<a href='https://www.propquest.co.uk/about.php' target='_blank' title='Visit PROPquest.co.uk'>PROPquest</a>" : "<a href='https://www.swpc.noaa.gov/products/aurora-30-minute-forecast' target='_blank' title='Visit NOAA'>NOAA</a>",
    minZoom: 0,
    maxZoom: 0
  });
}

function createPredLayer()
{
  var layerVector = new ol.layer.Tile({
    source: createPredSource(),
    opacity: Number(GT.mapSettings.predOpacity),
    visible: true,
    zIndex: 0
  });

  layerVector.set("name", "Pred");

  return layerVector;
}

function cyclePredLayer()
{
  GT.mapSettings.predMode = (GT.mapSettings.predMode + 1) % 5;
  displayPredLayer();
  saveMapSettings();
}

function predInit()
{
  GT.predViews = Array();
  GT.predViews[1] = { mufTitle, mufBarTr, mufRangeTr };
  GT.predViews[2] = { fof2Title, fof2BarTr, fof2RangeTr }
  GT.predViews[3] = { epiTitle, epiTimeTr, epiTimeOffsetTr, epiBarTr, epiRangeTr };
  GT.predViews[4] = { aufTitle, aufForTimeTr, aufPercentTr, aufBarTr, aufRangeTr };
}

function displayPredLayer()
{
  predButton.style.display = (GT.mapSettings.offlineMode == true) ? "none" : "";
  if (GT.mapSettings.predMode > 0 && GT.mapSettings.offlineMode == false)
  {
    predDiv.style.display = "block";
    for (var viewIndex in GT.predViews)
    {
      for (var html in GT.predViews[viewIndex])
      {
        GT.predViews[viewIndex][html].style.display = viewIndex == GT.mapSettings.predMode ? "" : "none";
      }
    }

    predLayerRefreh();
  }
  else
  {
    predDiv.style.display = "none";
    if (GT.predLayerTimeout != null)
    {
      nodeTimers.clearTimeout(GT.predLayerTimeout);
      GT.predLayerTimeout = null;
    }
    if (GT.PredLayer)
    {
      GT.map.removeLayer(GT.PredLayer);
      GT.PredLayer = null;
    }
  }
  predImg.src = GT.predImageArray[GT.mapSettings.predMode];
  predImg.style.filter = GT.mapSettings.predMode > 0 ? "" : "grayscale(1)";
  predOpacityTd.innerHTML = predOpacityValue.value = GT.mapSettings.predOpacity;
}

function predLayerRefreh()
{
  if (GT.mapSettings.predMode > 0 && GT.mapSettings.offlineMode == false)
  {
    let oldLayer = null;
    if (GT.PredLayer)
    {
      oldLayer = GT.PredLayer;
      GT.PredLayer = null;
    }

    GT.PredLayer = createPredLayer();
    GT.map.addLayer(GT.PredLayer);
    if (oldLayer)
    {
      GT.map.removeLayer(oldLayer);
    }
  }
}

function getAufTimes(now)
{
  getBuffer(
    "https://tagloomis.com/auf/img/auf.json?" + String(now),
    handleAufTimesResponse,
    null,
    "https",
    443
  );
}

function handleAufTimesResponse(data)
{
  let text = String(data);
  let json = JSON.parse(text);
  if (json && "f" in json)
  {
    aufForTimeTd.innerHTML = userTimeString(Date.parse(json.f));
  }
}

GT.KColors = [
  "#0F0",
  "#0F0",
  "#0F0",
  "#0F0",
  "#0F0",
  "#FF0",
  "#FC0",
  "#F90",
  "#F00",
  "#F00"
];

function handleKpIndexJSON(json)
{
  if (json && typeof json == "object")
  {
    let K = parseInt(json[1]);
    let geoStorm = "";
    if (K > 5)
    {
      let speed = 13 - K;
      geoStorm = "animation: geoStorm " + speed + "s ease-in-out infinite alternate;";
    }

    let preK = json[0];
    let curK = json[1];
    let trend = (preK == curK ? "" : preK < curK ? "▲" : "▼");

    conditionsButton.style = geoStorm + "height:32px;width:32px;vertical-align:bottom;background:radial-gradient(" + GT.KColors[K] + ", #000)";
    conditionsButton.innerHTML = "<div style='display:block'><font style='text-shadow:1px 1px 2px #000;color: #0FF;'>Kp</font><br/><font style='font-weight:bold;font-size:16px;text-shadow:1px 1px 1px #000;color: #FFF;'>" + K + "<font style='font-weight:normal;font-size:10px'>" + trend + "</font></font><div>";
  }
}

function saveGridTrackerSettings()
{
  let filename = path.join(GT.GTappData, "settings.json");
  try
  {
    const orderedSettings = Object.keys(GT.localStorage).sort(Intl.Collator().compare).reduce(
      (obj, key) =>
      {
        obj[key] = GT.localStorage[key];
        return obj;
      },
      {}
    );

    fs.writeFileSync(filename, JSON.stringify(orderedSettings, null, 2));

  }
  catch (e)
  {
    alert("Failure to write to : " + filename);
  }
}

nodeTimers.setInterval(refreshSpotsNoTx, 300000);
