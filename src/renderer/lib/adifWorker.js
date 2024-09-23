var GT = {};

importScripts("protos.js");
importScripts("gtCommon.js");

GT.workerFunctions =
{
  init: initGlobals,
  clear: clearQSO,
  parse: onAdiLoadComplete
};

onmessage = (event) =>
{
  if ("type" in event.data)
  {
    if (event.data.type in GT.workerFunctions)
    {
      GT.workerFunctions[event.data.type](event.data);
    }
    else console.log("adifWorker: unknown event type : " + event.data.type);
  }
  else console.log("adifWorker: no event type");
};

function initGlobals(task)
{
  GT.dxccInfo = task.dxccInfo; // null  geo
  for (const key in GT.dxccInfo)
  {
    GT.dxccInfo[key].geo = null;
  }
  GT.dxccToCountryCode = task.dxccToCountryCode;
  GT.directCallToDXCC = task.directCallToDXCC;
  GT.directCallToITUzone = task.directCallToITUzone;
  GT.directCallToCQzone = task.directCallToCQzone;
  GT.prefixToITUzone = task.prefixToITUzone;
  GT.prefixToCQzone = task.prefixToCQzone;
  GT.prefixToMap = task.prefixToMap;
  GT.gridToState = task.gridToState;
  GT.cqZones = task.cqZones;
  for (const key in GT.cqZones)
  {
    GT.cqZones[key].geo = null;
  }
  GT.ituZones = task.ituZones;
  for (const key in GT.ituZones)
  {
    GT.ituZones[key].geo = null;
  }
  GT.wacZones = task.wacZones;
  for (const key in GT.wacZones)
  {
    GT.wacZones[key].geo = null;
  }

  GT.modes = task.modes;
  GT.modes_phone = task.modes_phone;
  GT.QSOhash = task.QSOhash;

  var returnTask = {};
  returnTask.type = "loaded";
  postMessage(returnTask);
}

function clearQSO(task)
{
  GT.QSOhash = {};

  var returnTask = {};
  returnTask.type = "cleared"
  returnTask.clearFiles = task.clearFiles;
  returnTask.nextFunc = task.nextFunc;
  postMessage(returnTask);
}

const myTextEncoder = new TextEncoder();
const myTextDecoder = new TextDecoder();

function onAdiLoadComplete(task)
{
  GT.appSettings = task.appSettings;
  GT.myQsoCalls = {};
  GT.myQsoGrids = {};

  var liveLog = task.liveLog;
  var confirmed = false;
  var rows = 0;
  var lastHash = null;
  var validAdifFile = true;
  var eQSLfile = false;
  var clublogFile = false;
  var lotwTimestampUpdated = false;

  if (task.rawAdiBuffer.indexOf("PSKReporter") > -1) validAdifFile = false;
  if (task.rawAdiBuffer.indexOf("Received eQSLs") > -1) eQSLfile = true;
  if (task.rawAdiBuffer.indexOf("clublog.adif") > -1 || task.rawAdiBuffer.indexOf("ADIF export from Club Log") > -1) clublogFile = true;

  var eorRegEx = new RegExp("<EOR>", "i");

  if (validAdifFile == true && task.rawAdiBuffer.length > 1)
  {
    var startPos = 0;
    var endPos = task.rawAdiBuffer.length;
    while (startPos != endPos)
    {
      let eor = task.rawAdiBuffer.substring(startPos).search(eorRegEx);
      if (eor != -1)
      {
        let row = task.rawAdiBuffer.substring(startPos, startPos + eor);
        startPos += eor + 5; // skip <EOR>
        let object = parseADIFRecordStrict(row);
        let confSource = null;
        let lotwConfirmed = false;
        confirmed = false;
        if (object.APP_LOTW_RXQSO)
        {
          var dRXQSO = Date.parse(object.APP_LOTW_RXQSO);

          if ((isNaN(dRXQSO) == false) && dRXQSO > 0 && dRXQSO > task.lotw_qso)
          {
            // add a second
            dRXQSO += 1000;
            task.lotw_qso = dRXQSO;
            lotwTimestampUpdated = true;
          }
        }
    
        if (object.APP_LOTW_RXQSL)
        {
          var dRXQSL = Date.parse(object.APP_LOTW_RXQSL);
          if ((isNaN(dRXQSL) == false) && dRXQSL > 0 && dRXQSL > task.lotw_qsl)
          {
            // add a second
            dRXQSL += 1000;
            task.lotw_qsl = dRXQSL;
            lotwTimestampUpdated = true;
          }
          lotwConfirmed = true;
        }

        var finalDEcall = "";
        if (object.STATION_CALLSIGN)
        {
          finalDEcall = object.STATION_CALLSIGN.replace("_", "/");
        }
        if (finalDEcall == "")
        {
          finalDEcall = GT.appSettings.myCall;
        }
        GT.myQsoCalls[finalDEcall] = true;

        if (GT.appSettings.workingCallsignEnable && !(finalDEcall in GT.appSettings.workingCallsigns))
        {
          // not in the working callsigns, move to next
          continue;
        }

        var finalTime = 0;

        if (object.QSO_DATE && object.TIME_ON)
        {
          var dateTime = new Date(
            Date.UTC(
              object.QSO_DATE.substr(0, 4),
              parseInt(object.QSO_DATE.substr(4, 2)) - 1,
              object.QSO_DATE.substr(6, 2),
              object.TIME_ON.substr(0, 2),
              object.TIME_ON.substr(2, 2),
              object.TIME_ON.substr(4, 2)
            )
          );

          finalTime = parseInt(dateTime.getTime() / 1000);
        }

        if (GT.appSettings.workingDateEnable && finalTime < GT.appSettings.workingDate)
        {
          // Not after our working date
          continue;
        }

        var myGrid = (object.MY_GRIDSQUARE || "").toUpperCase();
        if (myGrid.length > 3)
        {
          let finalMyGrid = myGrid.substr(0, 4);
          GT.myQsoGrids[finalMyGrid] = true;
          if (GT.appSettings.workingGridEnable && !(finalMyGrid in GT.appSettings.workingGrids))
          {
            // not in the working grids, move to next
            continue;
          }
        }

        var finalDXcall = (object.CALL || "").replace("_", "/");
        var finalGrid = (object.GRIDSQUARE || "").toUpperCase();
        var vuccGrids = (object.VUCC_GRIDS || "").toUpperCase();
        var finalVucc = [];
        var finalRSTsent = (object.RST_SENT || "");
        var finalRSTrecv = (object.RST_RCVD || "");
        var finalBand = (object.BAND || "").toLowerCase();
        if (finalBand == "" || finalBand == "oob")
        {
          finalBand = formatBand(Number(object.FREQ || 0));
        }

        var finalPropMode = (object.PROP_MODE || "").toUpperCase();
        var finalSatName = (object.SAT_NAME || "").toUpperCase();
        var finalCont = (object.CONT || "").toUpperCase();
        if (!(finalCont in GT.wacZones))
        {
          finalCont = null;
        }
        var finalCnty = (object.CNTY || "").toUpperCase();
        if (finalCnty.length == 0)
        {
          finalCnty = null;
        }
        else
        {
          // GT references internally with NO spaces, this is important       
          finalCnty = replaceAll(finalCnty, " ", "");
        }
        var finalMode = (object.MODE || "").toUpperCase();
        var subMode = (object.SUBMODE || "").toUpperCase();
        if (subMode == "FT4" && (finalMode == "MFSK" || finalMode == "DATA"))
        {
          // Internal assigment only
          finalMode = "FT4"
        }
        if (subMode == "Q65" && (finalMode == "MFSK" || finalMode == "DATA"))
        {
          // Internal assigment only
          finalMode = "Q65"
        }
        if (subMode == "JS8" && finalMode == "MFSK")
        {
          // Internal assigment only
          finalMode = "JS8";
        }

        var finalMsg = (object.COMMENT || "");
        var finalQslMsg = (object.QSLMSG || "");
        var finalQslMsgIntl = (object.QSLMSG_INTL || "");
        if (finalQslMsg.length > 1)
        {
          finalMsg = finalQslMsg;
        }
        if (finalQslMsgIntl.length > 1 && finalMsg == "")
        {
          finalMsg = finalQslMsgIntl;
        }

        var finalDxcc = Number(object.DXCC || 0);
        if (finalDxcc == 0)
        {
          finalDxcc = Number(callsignToDxcc(finalDXcall));
        }

        if (!(finalDxcc in GT.dxccInfo))
        {
          finalDxcc = Number(callsignToDxcc(finalDXcall));
        }

        var finalState = (object.STATE || "").toUpperCase();
        if (finalState.length == 0) finalState = null;
        else if (finalDxcc > 0)
        {
          finalState = GT.dxccToCountryCode[finalDxcc] + "-" + finalState;
        }

        var finalCqZone = (object.CQZ || "");
        if (finalCqZone.length == 1)
        {
          finalCqZone = "0" + finalCqZone;
        }

        finalCqZone = String(finalCqZone);

        if (!(finalCqZone in GT.cqZones))
        {
          finalCqZone = null;
        }

        var finalItuZone = (object.ITUZ || "");
        if (finalItuZone.length == 1) finalItuZone = "0" + finalItuZone;

        finalItuZone = String(finalItuZone);

        if (!(finalItuZone in GT.ituZones))
        {
          finalItuZone = null;
        }

        var finalIOTA = (object.IOTA || "").toUpperCase();

        var qrzConfirmed = (object.APP_QRZLOG_STATUS || "").toUpperCase();
        var lotwConfirmed1 = (object.QSL_RCVD || "").toUpperCase();
        var lotw_qsl_rcvd = (object.LOTW_QSL_RCVD || "").toUpperCase();
        var eqsl_qsl_rcvd = (object.EQSL_QSL_RCVD || "").toUpperCase();

        if (qrzConfirmed == "C" || lotw_qsl_rcvd == "Y" || lotw_qsl_rcvd == "V" || lotwConfirmed1 == "Y" || eqsl_qsl_rcvd == "Y" || eqsl_qsl_rcvd == "V" || eQSLfile == true)
        {
          confirmed = true;
          if (qrzConfirmed == "C")
          {
            confSource = "Q";
          }
          else if (eQSLfile == true)
          {
            confSource = "e";
          }
          else if (lotwConfirmed == true)
          {
            confSource = "L";
          }
          else if (clublogFile == true)
          {
            confSource = "C";
          }
          else
          {
            confSource = "O";
          }
        }

        finalGrid = finalGrid.substr(0, 6);
        if (!validateGridFromString(finalGrid)) finalGrid = "";
        if (finalGrid == "" && vuccGrids != "")
        {
          finalVucc = vuccGrids.split(",");
          finalGrid = finalVucc[0];
          finalVucc.shift();
        }
        var isDigital = false;
        var isPhone = false;
        if (finalMode in GT.modes)
        {
          isDigital = GT.modes[finalMode];
        }
        if (finalMode in GT.modes_phone)
        {
          isPhone = GT.modes_phone[finalMode];
        }

        var finalPOTA = (object.POTA_REF || object.POTA || "").toUpperCase();
        if (finalPOTA.length == 0)
        {
          finalPOTA = null;
        }
        
        if (finalDXcall != "")
        {
          lastHash = addQSO(
            finalGrid,
            finalDXcall,
            finalDEcall,
            finalRSTsent,
            finalTime,
            finalMsg,
            finalMode,
            finalBand,
            confirmed,
            finalRSTrecv,
            finalDxcc,
            finalState,
            finalCont,
            finalCnty,
            finalCqZone,
            finalItuZone,
            finalVucc,
            finalPropMode,
            isDigital,
            isPhone,
            finalIOTA,
            finalSatName,
            finalPOTA,
            confSource
          );
        }
        rows++;
      }
      else
      {
        break; // we're done
      }
    }
  }

  // Cam from a live event, we handly differently
  if (liveLog == true && rows == 1 && lastHash != null && confirmed == false)
  {
    var returnTask = {};
    returnTask.type = "parsedLive";
    returnTask.details = GT.QSOhash[lastHash];
  }
  else
  {
    var returnTask = {};
    returnTask.type = "parsed";
    returnTask.QSOhash = GT.QSOhash;
    returnTask.myQsoCalls = GT.myQsoCalls;
    returnTask.myQsoGrids = GT.myQsoGrids;
    returnTask.lotw_qso = task.lotw_qso;
    returnTask.lotw_qsl = task.lotw_qsl;
    returnTask.lotwTimestampUpdated = lotwTimestampUpdated;
    returnTask.nextFunc = task.nextFunc;
  }

  postMessage(returnTask);
}

function addQSO(
  finalGrid,
  finalDXcall,
  finalDEcall,
  finalRSTsent,
  finalTime,
  ifinalMsg,
  mode,
  band,
  confirmed,
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
  finalPOTA = null,
  confSource = null
)
{
  let hash = "";
  let finalMsg = ifinalMsg.trim();
  if (finalMsg.length > 40) finalMsg = finalMsg.substring(0, 40) + "...";

  let details = null;
  let timeMod = finalTime - ((finalTime % 60) + 30);
  hash = unique(finalDXcall + timeMod) + unique(mode + band);
  
  if (hash in GT.QSOhash)
  {
    details = GT.QSOhash[hash];
    let canWrite = (details.confirmed == false || GT.appSettings.qslAuthority == "0" || GT.appSettings.qslAuthority == confSource || !(GT.appSettings.qslAuthority in details.confSrcs));
    if (GT.appSettings.qslAuthority == "1" && confirmed == true)
    {
      // Only unconfirmed can change the grid, state, county
      // This is for DO9KW
      canWrite = false;
    }
    if (finalGrid.length > 0 && finalGrid != details.grid)
    {
      // only touch the grid if it's larger than the last grid && the 4wide is the same
      if (details.grid.length < 6 && (details.grid.substr(0, 4) == finalGrid.substr(0, 4) || details.grid.length == 0))
      {
        details.grid = finalGrid;
        details.field = finalGrid.substring(0, 2);
      }
      else if (details.grid.length != 0 && confirmed == true && canWrite == true)
      {
        details.grid = finalGrid;
        details.field = finalGrid.substring(0, 2);
      }
    }

    if (finalRSTsent.length > 0) details.RSTsent = finalRSTsent;
    if (finalRSTrecv.length > 0) details.RSTrecv = finalRSTrecv;
    if (finalCqZone) details.cqz = finalCqZone;
    if (finalItuZone) details.ituz = finalItuZone;
    if (details.state != null && finalState != null && details.state != finalState && confirmed == true && canWrite == true)
    {
      details.state = finalState;
    }
    else if (details.state == null && finalState != null)
    {
      details.state = finalState;
    }
    if (confirmed == true && finalDxcc > 0) details.dxcc = finalDxcc;
    if (finalDxcc < 1 && details.dxcc > 0) finalDxcc = details.dxcc;
    if (finalCont == null && details.cont) finalCont = details.cont;
    if (details.cnty != null && finalCnty != null && details.cnty != finalCnty && confirmed == true && canWrite == true)
    {
      details.cnty = finalCnty;
    }
    else if (details.cnty == null && finalCnty != null)
    {
      details.cnty = finalCnty;
    }
    if (finalPropMode.length > 0) details.propMode = finalPropMode;
    if (finalVucc.length > 0) details.vucc_grids = finalVucc;
    if (finalIOTA.length > 0) details.IOTA = finalIOTA;
    if (finalSatName.length > 0) details.satName = finalSatName;
    if (finalPOTA) details.pota = finalPOTA;
    if (confirmed == true)
    {
      details.confirmed = true;
      details.confSrcs[confSource] = true;
    }
  }
  else
  {
    details = {};
    details.grid = finalGrid;
    details.field = finalGrid.substring(0, 2);
    details.RSTsent = finalRSTsent;
    details.RSTrecv = finalRSTrecv;
    details.msg = "-";
    details.band = band;
    details.mode = mode;
    details.DEcall = finalDXcall;
    details.DXcall = finalDEcall;
    details.cqz = finalCqZone;
    details.ituz = finalItuZone;
    details.delta = -1;
    details.time = finalTime;
    details.state = finalState;
    details.zipcode = null;
    details.qso = true;
    details.px = null;
    details.zone = null;
    details.cont = null;
    details.cnty = finalCnty;
    details.vucc_grids = finalVucc;
    details.propMode = finalPropMode;
    details.digital = finalDigital;
    details.phone = finalPhone;
    details.IOTA = finalIOTA;
    details.satName = finalSatName;
    details.pota = finalPOTA;
    details.worked = true;
    details.confirmed = confirmed;
    details.confSrcs = {};
   
    if (confirmed == true)
    {
      details.confSrcs[confSource] = true;
    }
  }

  if (finalDxcc < 1) finalDxcc = callsignToDxcc(finalDXcall);
  details.dxcc = finalDxcc;

  if (details.dxcc > 0 && details.px == null)
  {
    details.px = getWpx(finalDXcall);
    if (details.px) { details.zone = Number(details.px.charAt(details.px.length - 1)); }
  }

  var fourGrid = details.grid.substr(0, 4);

  details.cont = finalCont;
  if (finalDxcc > 0)
  {
    details.cont = GT.dxccInfo[finalDxcc].continent;
    if (details.dxcc == 390 && details.zone == 1) details.cont = "EU";
  }

  if (details.cnty && confirmed == true)
  {
    details.qual = true;
  }

  if (details.state == null && fourGrid.length > 0 && isKnownCallsignDXCC(finalDxcc))
  {
    if (fourGrid in GT.gridToState && GT.gridToState[fourGrid].length == 1)
    {
      details.state = GT.gridToState[fourGrid][0];
    }
  }
  
  if (!details.cqz)
  {
    details.cqz = cqZoneFromCallsign(finalDXcall, details.dxcc);
  }
  if (!details.ituz)
  {
    details.ituz = ituZoneFromCallsign(finalDXcall, details.dxcc);
  }

  if (finalMsg.length > 0) details.msg = finalMsg;

  details.hash = hash;

  GT.QSOhash[hash] = details;

  return hash;
}

GT.strictAdif = {
  APP_LOTW_RXQSO: false,
  APP_LOTW_RXQSL: false,
  STATION_CALLSIGN: false,
  QSO_DATE: false,
  TIME_ON: false,
  MY_GRIDSQUARE: false,
  CALL: false,
  GRIDSQUARE: false,
  VUCC_GRIDS: false,
  RST_SENT: false,
  RST_RCVD: false,
  BAND: false,
  FREQ: false,
  PROP_MODE: false,
  SAT_NAME: false,
  CONT: false,
  CNTY: false,
  MODE: false,
  SUBMODE: false,
  COMMENT: true,
  QSLMSG: true,
  QSLMSG_INTL: true,
  DXCC: false,
  STATE: false,
  CQZ: false,
  ITUZ: false,
  IOTA: false,
  APP_QRZLOG_STATUS: false,
  QSL_RCVD: false,
  LOTW_QSL_RCVD: false,
  EQSL_QSL_RCVD: false,
  POTA: false,
  POTA_REF: false,
  OPERATOR: false,
  APP_PSKREP_SNR: false
};

function parseADIFRecordStrict(line)
{
  var record = {};
  while (line.length > 0)
  {
    while (line.charAt(0) != "<" && line.length > 0)
    {
      line = line.substr(1);
    }
    if (line.length > 0)
    {
      line = line.substr(1);
      var where = line.indexOf(":");
      var nextChev = line.indexOf(">");
      if (where != -1 && nextChev > where)
      {
        var fieldName = line.substr(0, where).toUpperCase();
        line = line.substr(fieldName.length + 1);
        var fieldLength = parseInt(line);
        var end = line.indexOf(">");
        if (end > 0 && fieldName in GT.strictAdif)
        {
          line = line.substr(end + 1);
          var fieldValue;
          if (GT.strictAdif[fieldName] == true)
          {
            fieldValue = myTextDecoder.decode(myTextEncoder.encode(line.substr(0)).slice(0, fieldLength));
          }
          else
          {
            fieldValue = line.substr(0, fieldLength);
          }
          line = line.substr(fieldValue.length);
          record[fieldName] = fieldValue;
        }
      }
    }
  }

  return record;
}
