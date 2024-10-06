const validSettings = [
  "HRDLogbookLogSettings",
  "N1MMSettings",
  "acLogSettings",
  "adifLogSettings",
  "alertSettings",
  "appSettings",
  "audioSettings",
  "awardTracker",
  "bandActivity",
  "ignoredCQ",
  "ignoredCalls",
  "ignoredGrid",
  "ignoredDxcc",
  "ignoredCQz",
  "ignoredITUz",
  "callsignLookups",
  "classicAlerts",
  "currentVersion",
  "dxkLogSettings",
  "log4OMSettings",
  "mapMemory",
  "mapSettings",
  "msgSettings",
  "receptionSettings",
  "rosterSettings",
  "savedAlerts",
  "startupLogs",
  "trustedQslSettings",
  "legendColors",
  "pstrotatorSettings"
];

const def_appSettings = {
  chatUUID: "",
  clearOnCQ: true,
  crScript: 0,
  distanceUnit: "MI",
  graylineImgSrc: 0,
  gridViewMode: 3,
  gridsquareDecayTime: 300,
  gtBandFilter: "",
  gtFlagImgSrc: 0,
  gtModeFilter: "",
  gtPropFilter: "mixed",
  gtMsgEnable: true,
  gtShareEnable: true,
  gtSpotEnable: true,
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
  moonPath: 0,
  moonTrack: 0,
  mouseTrack: 0,
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
  potaEnabled: 1,
  potaShowMenu: true,
  potaMapEnabled: false,
  pushPinMode: false,
  qrzPathWidthWeight: 1.2,
  sixWideMode: 0,
  savedAppData: null,
  soundCard: "default",
  spotView: 0,
  useLocalTime: 0,
  wsjtForwardUdpEnable: false,
  wsjtForwardUdpIp: "127.0.0.1",
  wsjtForwardUdpPort: 2238,
  wsjtIP: "",
  wsjtUdpPort: 0,
  workingCallsignEnable: false,
  workingCallsigns: {},
  workingGridEnable: false,
  workingGrids: {},
  workingDateEnable: false,
  workingDate: 0,
  qsoItemsPerPage: 100,
  qslAuthority: "L",
  collapsedMapViewFilters: false,
  buttonPanelOrder: []
};

const def_mapSettings = {
  animate: true,
  animateSpeed: 4,
  CQhilite: true,
  predMode: 0,
  predOpacity: 0.4,
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
  trafficDecode: true,
  usNexrad: false,
  timezonesEnable: 0,
  showAllGrids: false,
  trophyOverlay: 0,
  zoom: 4,
  mapTrans: 0.5,
  apiKeys: {},
  projection: "EPSG:3857"
};

const def_adifLogSettings = {
  menu: {
    buttonAdifCheckBox: false,
    buttonClubCheckBox: false,
    buttonLOTWCheckBox: false,
    buttonQRZCheckBox: false,
    buttonPsk24CheckBox: false
  },
  startup: {
    loadAdifCheckBox: false,
    loadPsk24CheckBox: false,
    loadQRZCheckBox: false,
    loadLOTWCheckBox: false,
    loadClubCheckBox: false,
    loadGTCheckBox: true
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
  downloads: {},
  lastFetch: {
    lotw_qso: 0,
    lotw_qsl: 0
  }
};

const def_msgSettings = {
  msgAlertSelect: 1,
  msgAlertWord: "New chat message",
  msgAlertMedia: "none",
  msgFrequencySelect: 0,
  msgActionSelect: 1,
  msgAwaySelect: 0,
  msgAwayText: "I am away from the shack at the moment",
  msgSimplepush: false,
  msgSimplepushApiKey: "",
  msgSimplepushChat: true,
  msgSimplepushRoster: false,
  msgPushover: false,
  msgPushoverUserKey: "",
  msgPushoverToken: "",
  msgPushoverChat: true,
  msgPushoverRoster: false
};

const def_receptionSettings = {
  viewHistoryTimeSec: 900,
  viewPaths: false,
  pathColor: -1,
  pathNightColor: 361,
  spotWidth: 0.8,
  mergeSpots: true
};

const def_N1MMSettings = {
  enable: false,
  port: 2333,
  ip: "127.0.0.1"
};

const def_log4OMSettings = {
  enable: false,
  port: 2236,
  ip: "127.0.0.1"
};

const def_dxkLogSettings = {
  enable: false,
  port: 52000,
  ip: "127.0.0.1"
};

const def_HRDLogbookLogSettings = {
  enable: false,
  port: 7826,
  ip: "127.0.0.1"
};
const def_acLogSettings = {
  enable: false,
  port: 1100,
  ip: "127.0.0.1"
};

const def_trustedQslSettings = {
  stationFile: "",
  stationFileValid: false,
  binaryFile: "",
  binaryFileValid: false
};

const def_callsignLookups = {
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
};

const def_bandActivity = {
  lastUpdate: {},
  lines: {}
};

const def_legendColors = {
  QSO: "#EEEE00",
  QSL: "#EE0000",
  QSX: "#1111EE",
  CQ: "#00FF00",
  CQDX: "#00FFFF",
  QRZ: "#FFFF00",
  QTH: "#FFA600"
};

const def_pstrotatorSettings = {
  enable: false,
  port: 12000,
  ip: "127.0.0.1"
};

const def_audioSettings = {
  alertMute: 0,
  speechRate: 1,
  speechPitch: 1,
  speechVolume: 1,
  speechVoice: 0,
  speechPhonetics: true,
  volume: 1
};

const def_qso = {
  band: "",
  cnty: null,
  confirmed: false,
  confSrcs: {},
  cont: null,
  cqz: "",
  DEcall: "",
  delta: -1,
  digital: false,
  DXcall: "",
  dxcc: -1,
  grid: "",
  IOTA: "",
  ituz: "",
  mode: "",
  msg: "-",
  phone: false,
  pota: null,
  propMode: "",
  px: null,
  qso: true,
  qual: false,
  RSTrecv: "",
  RSTsent: "",
  satName: "",
  state: null,
  time: 0,
  vucc_grids: [],
  worked: false,
  zipcode: null,
  zone: null,
  hash: null
};

const def_mapMemory = {
  zoom: -1,
  LoLa: [0, 0],
  bearing: 0
};

const def_classicAlerts = {
  huntRoster: false,
  huntRosterNotify: 1,
  huntRosterNotifyWord: "New hit",
  huntRosterNotifyMedia: "none",
  huntCallsign: false,
  huntGrid: false,
  huntDXCC: false,
  huntCQz: false,
  huntITUz: false,
  huntStates: false,
  huntCallsignNeed: "worked",
  huntGridNeed: "confirmed",
  huntDXCCNeed: "confirmed",
  huntCQzNeed: "confirmed",
  huntITUzNeed: "confirmed",
  huntStatesNeed: "confirmed",
  huntCallsignNotify: "1",
  huntGridNotify: "1",
  huntDXCCNotify: "1",
  huntCQzNotify: "1",
  huntITUzNotify: "1",
  huntStatesNotify: "1",
  huntCallsignNotifyWord: "Wanted Call",
  huntGridNotifyWord: "Wanted Grid",
  huntDXCCNotifyWord: "Wanted DXCC",
  huntCQzNotifyWord: "Wanted CQ Zone",
  huntITUzNotifyWord: "Wanted I-T-U Zone",
  huntStatesNotifyWord: "Wanted State",
  huntCallsignNotifyMedia: "none",
  huntGridNotifyMedia: "none",
  huntDXCCNotifyMedia: "none",
  huntCQzNotifyMedia: "none",
  huntITUzNotifyMedia: "none",
  huntStatesNotifyMedia: "none"
};

const def_alertSettings = {
  requireGrid: true,
  wantMaxDT: false,
  wantMinDB: false,
  wantMinFreq: false,
  wantMaxFreq: false,
  maxDT: 0.5,
  minDb: -24,
  minFreq: 400,
  maxFreq: 3500,
  noMyDxcc: false,
  onlyMyDxcc: false,
  noRoundUp: false,
  onlyRoundUp: false,
  cqOnly: true,
  usesLoTW: false,
  useseQSL: false,
  reference: 0,
  logEventMedia: "Ping-coin.mp3"
};

const def_alerts = {
  popup: {
    value: "QRZ",
    type: "4",
    notify: "2",
    repeat: "2",
    filename: "",
    shortname: "",
    lastMessage: "",
    lastTime: 0,
    fired: 0,
    needAck: 0
  }
};