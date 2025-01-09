const validSettings = [
  "HRDLogbookLog",
  "N1MM",
  "acLog",
  "adifLog",
  "app",
  "audio",
  "awardTracker",
  "bandActivity",
  "ByBandMode",
  "ignoredCQ",
  "ignoredCalls",
  "ignoredGrid",
  "ignoredDxcc",
  "ignoredCQz",
  "ignoredITUz",
  "callsignLookups",
  "audioAlerts",
  "currentVersion",
  "dxkLog",
  "log4OM",
  "mapMemory",
  "map",
  "msg",
  "reception",
  "roster",
  "customAlerts",
  "startupLogs",
  "trustedQsl",
  "legendColors",
  "pstrotator",
  "importLegacy",
  "defaultsApplied"
];

const def_legendColors = {
  QSO: "#EEEE00",
  QSL: "#EE0000",
  QSX: "#1111EE",
  CQ: "#00FF00",
  CQDX: "#00FFFF",
  QRZ: "#FFFF00",
  QTH: "#FFA600"
};

const def_maps = {
  mapIndex: "Mapnik by OpenStreetMap (Intl)",
  offlineMapIndex: "Satellite by MapTiler (No Labels)(Offline)",
  nightMapIndex: "Dark Gray by Esri (English)",
  offlineNightMapIndex: "Toner by Stamen (No Labels)(Offline)"
};

const k_valid_projections = [ "EPSG:3857", "AEQD" ];

const def_settings = {
  defaultsApplied: true,
  app: {
    chatUUID: "",
    clearOnCQ: false,
    crScript: 0,
    wantedByBandMode: false,
    distanceUnit: "MI",
    graylineImgSrc: 0,
    gridViewMode: 3,
    gridsquareDecayTime: 300,
    gtBandFilter: "",
    gtFlagImgSrc: 0,
    gtModeFilter: "",
    gtPropFilter: "mixed",
    oamsMsgEnable: true,
    offAirServicesEnable: true,
    spottingEnable: true,
    loadAdifAtStartup: false,
    locale: "en",
    lookupLoginCq: "",
    lookupLoginQrz: "",
    lookupLoginQth: "",
    lookupOnTx: false,
    lookupCloseLog: false,
    lookupMerge: true,
    lookupMissingGrid: false,
    lookupPasswordCq: "",
    lookupPasswordQrz: "",
    lookupPasswordQth: "",
    lookupService: "CALLOOK",
    lookupCallookPreferred: false,
    moonTrack: 0,
    mouseTracking: true,
    multicast: false,
    myBand: "OOB",
    myGrid: "",
    myCall: "NOCALL",
    myMode: "",
    myRawCall: "NOCALL",
    myRawFreq: "",
    myRawGrid: "",
    oamsBandActivity: true,
    oamsBandActivityNeighbors: false,
    pathWidthWeight: 1.0,
    potaFeatureEnabled: true,
    potaMapEnabled: false,
    pushPinMode: false,
    qrzPathWidthWeight: 1.2,
    sixWideMode: 0,
    soundCard: "default",
    soundCardName: null,
    soundcards: null,
    warnOnSoundcardsChange: false,
    spotView: 0,
    windowTheme: "dark",
    useLocalTime: 0,
    wsjtForwardUdpEnable: false,
    wsjtForwardUdpIp: "127.0.0.1",
    wsjtForwardUdpPort: 2238,
    wsjtIP: "",
    wsjtUdpPort: 0,
    wsjtLogPath: "",
    workingCallsignEnable: false,
    workingCallsigns: {},
    workingGridEnable: false,
    workingGrids: {},
    workingDateEnable: false,
    workingDate: 0,
    qsoItemsPerPage: 100,
    qslAuthority: "L",
    collapsedMapViewFilters: false,
    logEventMedia: "Ping-coin.mp3",
    buttonPanelOrder: []
  },
  map: {
    animate: true,
    animateSpeed: 4,
    CQhilite: true,
    predMode: 0,
    predOpacity: 0.4,
    predLegend: true,
    spotLegend: true,
    fitQRZ: false,
    focusRig: true,
    gridAlpha: 136,
    haltAllOnTx: true,
    longitude: 0.0,
    latitude: 0.0,
    mapOpacity: 1,
    mapIndex: "Mapnik by OpenStreetMap (Intl)",
    offlineMapIndex: "Satellite by MapTiler (No Labels)(Offline)",
    mergeOverlay: false,
    mouseOver: true,
    nightMapOpacity: 0.8,
    nightMapEnable: false,
    nightMapIndex: "Dark Gray by Esri (English)",
    offlineNightMapIndex: "Toner by Stamen (No Labels)(Offline)",
    nightPathColor: 361,
    nightQrzPathColor: 1,
    offlineMode: false,
    pathColor: 0,
    qrzDxccFallback: false,
    qrzPathColor: 1,
    graylineOpacity: 0.1,
    splitQSL: true,
    showRangeRings: true,
    rangeRingDistance: 2500,
    rangeRingColor: 0,
    trafficDecode: true,
    usRadar: false,
    timezonesEnable: 0,
    showAllGrids: false,
    trophyOverlay: 0,
    zoom: 4,
    mapTrans: 0.5,
    apiKeys: {},
    projection: "EPSG:3857",
    backgroundColor: {
      "Bathymetric Oceans by GEBCO (No Labels)": "#396ca7",
      "City Lights by NASA (No Labels)": "#000000",
      "Dark Gray by Esri (English)": "#232227",
      "Dark Matter by Carto (English)": "#262626",
      "Dark Matter by Carto (No Labels)": "#262626",
      "HamGames by N0TTL (Intl)(Offline)": "#000000",
      "Humanitarian by OpenStreetMap (Intl)": "#90cccb",
      "Light Gray by Esri (English)": "#d0ced2",
      "Mapnik by OpenStreetMap (Deutsch)": "#aad3df",
      "Mapnik by OpenStreetMap (Intl)": "#aad3df",
      "Mapnik by OpenStreetMap (français)": "#b4d0d0",
      "National Geographic by Esri (English)": "#80b3de",
      "Oceans by Esri (No Labels)": "#94b9e5",
      "Physical by Esri (No Labels)": "#76abcb",
      "Positron by Carto (English)": "#d4dadc",
      "Positron by Carto (No Labels)": "#d4dadc",
      "Satellite by Esri (No Labels)": "#002f45",
      "Satellite by MapTiler (No Labels)(Offline)": "#0e2034",
      "Shaded Relief by Esri (No Labels)": "#9ebcd8",
      "Street by Esri (English)": "#99d9f2",
      "Terrain by Esri (No Labels)": "#63d7db",
      "Toner by Stamen (No Labels)(Offline)": "#000000",
      "Topographical by Esri (English)": "#b8e6fe",
      "Voyager by Carto (English)": "#d5e8eb",
      "Voyager by Carto (No Labels)": "#d5e8eb",
      "天地图 卫星 (Chinese)": "#000000",
      "天地图 地形 (Chinese)": "#000000",
      "天地图 矢量 (Chinese)": "#000000"
    }
  },
  adifLog: {
    menu: {
      buttonAdifCheckBox: false,
      buttonClubCheckBox: false,
      buttonLOTWCheckBox: false,
      buttonQRZCheckBox: false,
      buttonPsk24CheckBox: false
    },
    startup: {
      loadWSJTCheckBox: true,
      loadGTCheckBox: true,
      loadAdifCheckBox: false,
      loadPsk24CheckBox: false,
      loadQRZCheckBox: false,
      loadLOTWCheckBox: false,
      loadClubCheckBox: false
    },
    qsolog: {
      logQRZqsoCheckBox: false,
      logGTqsoCheckBox: true,
      logLOTWqsoCheckBox: false,
      logHRDLOGqsoCheckBox: false,
      logClubqsoCheckBox: false,
      logCloudlogQSOCheckBox: false,
      logeQSLQSOCheckBox: false,
      logHamCQqsoCheckBox: false
    },
    nickname: {
      nicknameeQSLCheckBox: false
    },
    text: {
      lotwLogin: "",
      clubCall: "",
      clubEmail: "",
      clubPassword: "",
      lotwPassword: "",
      lotwTrusted: "",
      lotwStation: "",
      qrzApiKey: "",
      HRDLOGCallsign: "",
      HRDLOGUploadCode: "",
      CloudlogURL: "http://127.0.0.1",
      CloudlogAPI: "",
      CloudlogStationProfileID: "1",
      CloudlogStationProfileName: "",
      eQSLUser: "",
      eQSLPassword: "",
      eQSLNickname: "",
      HamCQApiKey: ""
    },
    lastFetch: {
      lotw_qsl: 0
    }
  },
  msg: {
    msgSimplepush: false,
    msgSimplepushApiKey: "",
    msgSimplepushChat: true,
    msgSimplepushRoster: false,
    msgPushover: false,
    msgPushoverUserKey: "",
    msgPushoverToken: "",
    msgPushoverChat: true,
    msgPushoverRoster: false
  },
  reception: {
    viewHistoryTimeSec: 900,
    pathColor: -1,
    pathNightColor: 361,
    spotWidth: 0.8,
    mergeSpots: true
  },
  N1MM: {
    enable: false,
    port: 2333,
    ip: "127.0.0.1"
  },
  log4OM: {
    enable: false,
    port: 2236,
    ip: "127.0.0.1"
  },
  dxkLog: {
    enable: false,
    port: 52000,
    ip: "127.0.0.1"
  },
  HRDLogbookLog: {
    enable: false,
    port: 7826,
    ip: "127.0.0.1"
  },
  acLog: {
    enable: false,
    port: 1100,
    ip: "127.0.0.1",
    menu: false,
    startup: false,
    qsl: "A",
    connect: false
  },
  trustedQsl: {
    stationFile: "",
    stationFileValid: false,
    binaryFile: "",
    binaryFileValid: false
  },
  callsignLookups: {
    lotwUseEnable: true,
    lotwWeeklyEnable: true,
    lotwLastUpdate: 0,
    eqslUseEnable: true,
    eqslWeeklyEnable: true,
    eqslLastUpdate: 0,
    ulsUseEnable: true,
    ulsWeeklyEnable: true,
    ulsLastUpdate: 0,
    cacUseEnable: true,
    cacWeeklyEnable: true,
    cacLastUpdate: 0,
    oqrsUseEnable: false,
    oqrsWeeklyEnable: false,
    oqrsLastUpdate: 0
  },
  bandActivity: {
    lastUpdate: {},
    lines: {}
  },
  legendColors: {
    QSO: "#EEEE00",
    QSL: "#EE0000",
    QSX: "#1111EE",
    CQ: "#00FF00",
    CQDX: "#00FFFF",
    QRZ: "#FFFF00",
    QTH: "#FFA600"
  },
  pstrotator: {
    enable: false,
    port: 12000,
    ip: "127.0.0.1"
  },
  audio: {
    alertMute: 0,
    speechRate: 1,
    speechPitch: 1,
    speechVolume: 1,
    speechVoice: 0,
    speechPhonetics: true,
    volume: 1
  },
  audioAlerts: {
    rules: {
      everyDecode: false
    },
    wanted: {
      huntCallsign: false,
      huntGrid: false,
      huntDXCC: false,
      huntCQz: false,
      huntDXM: false,
      huntITUz: false,
      huntState: false,
      huntCounty: false,
      huntCont: false,
      huntPX: false,
      huntPOTA: false,
      huntOAMS: false,
      huntWatcher: false,
      huntAward: false,
      huntMultiple: false,
    },
    media: {
      huntCallsignType: "tts",
      huntGridType: "tts",
      huntDXCCType: "tts",
      huntCQzType: "tts",
      huntDXMType: "tts",
      huntITUzType: "tts",
      huntStateType: "tts",
      huntCountyType: "tts",
      huntContType: "tts",
      huntPXType: "tts",
      huntPOTAType: "tts",
      huntOAMSType: "tts",
      huntWatcherType: "tts",
      huntAwardType: "tts",
      huntMultipleType: "tts",

      huntCallsignFileSingle: "none",
      huntGridFileSingle: "none",
      huntDXCCFileSingle: "none",
      huntCQzFileSingle: "none",
      huntDXMSingle: "none",
      huntITUzFileSingle: "none",
      huntStateFileSingle: "none",
      huntCountyFileSingle: "none",
      huntContFileSingle: "none",
      huntPXFileSingle: "none",
      huntPOTAFileSingle: "none",
      huntOAMSFileSingle: "none",
      huntWatcherFileSingle: "none",
      huntAwardFileSingle: "none",
      huntMultipleFileSingle: "none",

      huntCallsignFileMulti: "none",
      huntGridFileMulti: "none",
      huntDXCCFileMulti: "none",
      huntCQzFileMulti: "none",
      huntDXMMulti: "none",
      huntITUzFileMulti: "none",
      huntStateFileMulti: "none",
      huntCountyFileMulti: "none",
      huntContFileMulti: "none",
      huntPXFileMulti: "none",
      huntPOTAFileMulti: "none",
      huntOAMSFileMulti: "none",
      huntWatcherFileMulti: "none",
      huntAwardFileMulti: "none",
      huntMultipleFileMulti: "none",

      huntCallsignSpeechSingle: "Wanted Callsign",
      huntGridSpeechSingle: "Wanted Grid",
      huntDXCCSpeechSingle: "Wanted DXCC",
      huntCQzSpeechSingle: "Wanted CQ zone",
      huntDXMSpeechSingle: "Wanted DX Marathon",
      huntITUzSpeechSingle: "Wanted I-T-U zone",
      huntStateSpeechSingle: "Wanted State",
      huntCountySpeechSingle: "Wanted County",
      huntContSpeechSingle: "Wanted Continent",
      huntPXSpeechSingle: "Wanted Prefix",
      huntPOTASpeechSingle: "Wanted Park",
      huntOAMSSpeechSingle: "Wanted Ohms User",
      huntWatcherSpeechSingle: "Wanted Watcher",
      huntAwardSpeechSingle: "Wanted Award",
      huntMultipleSpeechSingle: "not visible",

      huntCallsignSpeechMulti: "Many Callsigns",
      huntGridSpeechMulti: "Many Grids",
      huntDXCCSpeechMulti: "Many DXCCs",
      huntCQzSpeechMulti: "Many CQ zones",
      huntDXMSpeechMulti: "Many DX Marathon",
      huntITUzSpeechMulti: "Many I-T-U zones",
      huntStateSpeechMulti: "Many States",
      huntCountySpeechMulti: "Many Counties",
      huntContSpeechMulti: "Many Continents",
      huntPXSpeechMulti: "Many Prefixes",
      huntPOTASpeechMulti: "Many Parks",
      huntOAMSSpeechMulti: "Many Ohms Users",
      huntWatcherSpeechMulti: "Many Watchers",
      huntAwardSpeechMulti: "Many Awards",
      huntMultipleSpeechMulti: "Many Wanted Entities",
    }
  },
  customAlerts: {},
  mapMemory: [],
  startupLogs: [],
  awardTracker: {},
  ignoredCQ: {},
  ignoredCalls: {},
  ignoredGrid: {},
  ignoredDxcc: {},
  ignoredCQz: {},
  ignoredITUz: {},
  roster: {
    onlyHits: false,
    requireGrid: false,
    wantMaxDT: false,
    wantMinDB: false,
    wantMinFreq: false,
    wantMaxFreq: false,
    wantRRCQ: false,
    maxDT: 0.5,
    minDb: -25,
    minFreq: 0,
    maxFreq: 3500,
    noMyDxcc: false,
    onlyMyDxcc: false,
    cqOnly: false,
    usesLoTW: false,
    maxLoTW: 27,
    useseQSL: false,
    usesOQRS: false,
    onlySpot: false,
    allOnlyNew: false,
    realtime: true,
    logbook: {
      huntNeed: "confirmed",
      referenceNeed: "0",
    },
    wanted: {
      huntCallsign: false,
      huntGrid: true,
      huntDXCC: true,
      huntCQz: false,
      huntITUz: false,
      huntState: true,
      huntCounty: false,
      huntCont: false,
      huntPX: false,
      huntPOTA: false,
      huntOAMS: false,
      huntWatcher: false,
      huntDXM: false,
    },
    columns: {
      Callsign: true,
      Band: false,
      Mode: false,
      Calling: true,
      Rig: false,
      Wanted: false,
      Grid: true,
      Msg: false,
      DXCC: true,
      Flag: true,
      State: true,
      County: false,
      POTA: false,
      Cont: false,
      dB: true,
      Freq: false,
      DT: false,
      Dist: false,
      Azim: false,
      DXM: false,
      CQz: false,
      ITUz: false,
      PX: false,
      LoTW: false,
      eQSL: false,
      OQRS: false,
      Spot: false,
      Life: false,
      OAMS: true,
      Age: true,
      UTC: false
    },
    columnOrder: [
      "Callsign", "Band", "Mode", "Calling", "Rig", "Wanted", "Grid", "Msg",
      "POTA", "DXCC", "Flag", "DXM", "State", "County", "Cont",
      "dB", "Freq", "DT", "Dist", "Azim", 
      "CQz", "ITUz", "PX",
      "LoTW", "eQSL", "OQRS",
      "Life", "Spot", "OAMS", "Age", "UTC"
    ],
    displayFilters: {
      brightness: 100,
      contrast: 100,
      saturate: 100,
      invert: 0,
      sepia: 0,
      huerotate: 0
    },
    controls: true,
    controlsExtended: true,
    compact: false,
    sortColumn: "Age",
    sortReverse: true,
    clearRosterOnBandChange: true,
    rosterAlwaysOnTop: false,
    rosterDelayOnFocus: false,
    rosterDelayTime: 1500,
    rosterTime: 120,
    compactEntity: "DXCC",
    watchers: {}
  },
  ByBandMode: {
    roster: { },
    audioAlerts: { }
  },
};

const def_mapMemory = {
  zoom: -1,
  LoLa: [0, 0],
  bearing: 0
};

const legacySettingsMapping = {
  appSettings: "app",
  awardTracker: "awardTracker",
  bandActivity: "bandActivity",
  callsignLookups: "callsignLookups",
  dxkLogSettings: "dxkLog",
  HRDLogbookLogSettings: "HRDLogbookLog",
  log4OMSettings: "log4OM",
  mapSettings: "map",
  msgSettings: "msg",
  N1MMSettings: "N1MM",
  pstrotatorSettings: "pstrotator",
  rosterSettings: "roster",
  savedAlerts: "customAlerts",
  audioSettings: "audio",
  acLogSettings: "acLog",
  adifLogSettings: "adifLog",
  ignoredCQ: "ignoredCQ",
  blockedCalls: "ignoredCalls",
  blockedGrid: "ignoredGrid",
  blockedDxcc: "ignoredDxcc",
  blockedCQz: "ignoredCQz",
  blockedITUz: "ignoredITUz",
  trustedQslSettings: "trustedQsl",
};

// TODO: Remove me in 2025
function importLegacySettings()
{
  let legacySettingsPath = "";
  let appData = electron.ipcRenderer.sendSync("getPath","appData");

  if (GT.platform == "windows")
  {
    let basename = path.basename(appData);
    if (basename != "Local")
    {
      appData = appData.replace(basename, "Local");
    }
    legacySettingsPath = path.join(appData, "GridTracker/User Data/Default/Ginternal/settings.json");
  }
  else if (GT.platform == "mac")
  {
    legacySettingsPath = path.join(process.env.HOME, "Library/Application Support/GridTracker/Default/Ginternal/settings.json");
  }
  else
  {
    legacySettingsPath = path.join(process.env.HOME, ".config/GridTracker/Default/Ginternal/settings.json");
  }
  if (fs.existsSync(legacySettingsPath))
  {
    try {
      let legacyData = fs.readFileSync(legacySettingsPath, "UTF-8");
      let json = JSON.parse(legacyData);
      for (const key in legacySettingsMapping)
      {
        if (key in json && legacySettingsMapping[key] in GT.settings)
        {
          try {
            let obj = JSON.parse(json[key]);
            if (obj)
            {
              // use unless it's going to be a problem
              GT.settings[legacySettingsMapping[key]] = deepmerge(GT.settings[legacySettingsMapping[key]], obj);
            }
            else
            {
              console.log("Nothing parsed for legacy setting: " + key);
            }
          }
          catch (e)
          {
            logError(e);
          }

        }
        else
        {
          console.log("Missing mapping: " + key, legacySettingsMapping[key]);
        }
      }
    }
    catch (e)
    {
      logError(e);
    }
  }

  // Copy over GridTracker_QSO.adif if it exists and we haven't copied it yet
  // Do not overwrite existing, please
  try {
    let copiedGridTrackerOneAdif = path.join(GT.qsoBackupDir, "GridTrackerV1.adif");
    if (!fs.existsSync(copiedGridTrackerOneAdif))
    {
      let documentsPath = path.join(electron.ipcRenderer.sendSync("getPath","documents"), "GridTracker", "GridTracker_QSO.adif");
      if(fs.existsSync(documentsPath))
      {
        fs.copyFileSync(documentsPath, copiedGridTrackerOneAdif, fs.constants.COPYFILE_EXCL);
      }
      else
      {
        if (documentsPath.indexOf("OneDrive") > 0)
        {
          documentsPath = path.join(documentsPath.replace("OneDrive","."));
          if(fs.existsSync(documentsPath))
          {
            fs.copyFileSync(documentsPath, copiedGridTrackerOneAdif, fs.constants.COPYFILE_EXCL);
          }
        }
      }
    }
  }
  catch (e)
  {
    logError("Error copying old gridtracker log file");
    logError(e);
  }
}