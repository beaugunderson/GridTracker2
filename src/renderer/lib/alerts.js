// GridTracker Copyright © 2024 GridTracker.org
// All rights reserved.
// See LICENSE for more information.

GT.alerts = Object();
GT.classicAlerts = Object();
GT.phonetics = Object();
GT.enums = Object();
GT.alertSettings = Object();

function loadAlerts()
{

  GT.classicAlerts = loadDefaultsAndMerge("classicAlerts", def_classicAlerts);
  GT.alertSettings = loadDefaultsAndMerge("alertSettings", def_alertSettings);
  GT.alerts = loadDefaultsAndMerge("savedAlerts", def_alerts);

  loadClassicAlertView();

  wantGrid.checked = GT.alertSettings.requireGrid;

  wantMaxDT.checked = GT.alertSettings.wantMaxDT;
  wantMinDB.checked = GT.alertSettings.wantMinDB;
  wantMinFreq.checked = GT.alertSettings.wantMinFreq;
  wantMaxFreq.checked = GT.alertSettings.wantMaxFreq;

  maxDTView.innerHTML = maxDT.value = GT.alertSettings.maxDT;
  minDbView.innerHTML = minDb.value = GT.alertSettings.minDb;
  minFreqView.innerHTML = minFreq.value = GT.alertSettings.minFreq;
  maxFreqView.innerHTML = maxFreq.value = GT.alertSettings.maxFreq;

  cqOnly.checked = GT.alertSettings.cqOnly;
  noMyDxcc.checked = GT.alertSettings.noMyDxcc;
  onlyMyDxcc.checked = GT.alertSettings.onlyMyDxcc;
  noRoundUp.checked = GT.alertSettings.noRoundUp;
  onlyRoundUp.checked = GT.alertSettings.onlyRoundUp;
  usesLoTW.checked = GT.alertSettings.usesLoTW;
  useseQSL.checked = GT.alertSettings.useseQSL;

  referenceNeed.value = GT.alertSettings.reference;
  logEventMedia.value = GT.alertSettings.logEventMedia;
  setAlertVisual();
}

function newLogEventSetting(obj)
{
  GT.alertSettings.logEventMedia = obj.value;
  GT.localStorage.alertSettings = JSON.stringify(GT.alertSettings);
}

function exceptionValuesChanged()
{
  setAlertVisual();

  GT.alertSettings.requireGrid = wantGrid.checked;

  GT.alertSettings.wantMaxDT = wantMaxDT.checked;
  GT.alertSettings.wantMinDB = wantMinDB.checked;
  GT.alertSettings.wantMinFreq = wantMinFreq.checked;
  GT.alertSettings.wantMaxFreq = wantMaxFreq.checked;

  maxDTView.innerHTML = GT.alertSettings.maxDT = maxDT.value;
  minDbView.innerHTML = GT.alertSettings.minDb = minDb.value;
  minFreqView.innerHTML = GT.alertSettings.minFreq = minFreq.value;
  maxFreqView.innerHTML = GT.alertSettings.maxFreq = maxFreq.value;

  GT.alertSettings.cqOnly = cqOnly.checked;
  GT.alertSettings.noMyDxcc = noMyDxcc.checked;
  GT.alertSettings.onlyMyDxcc = onlyMyDxcc.checked;
  GT.alertSettings.noRoundUp = noRoundUp.checked;
  GT.alertSettings.onlyRoundUp = onlyRoundUp.checked;
  GT.alertSettings.usesLoTW = usesLoTW.checked;
  GT.alertSettings.useseQSL = useseQSL.checked;

  GT.alertSettings.reference = referenceNeed.value;

  GT.localStorage.alertSettings = JSON.stringify(GT.alertSettings);
}

function hashMaker(band, mode)
{
  // "Current Band & Mode"
  if (GT.alertSettings.reference == 0) return band + mode;

  // "Current Band, Any Mode"
  if (GT.alertSettings.reference == 1) return band;

  // "Current Band, Any Digi Mode"
  if (GT.alertSettings.reference == 2) return band + "dg";

  // "Current Mode, Any Band"
  if (GT.alertSettings.reference == 3) return mode;

  // "Any Band, Any Mode"
  if (GT.alertSettings.reference == 4) return "";

  // "Any Band, Any Digit Mode"
  if (GT.alertSettings.reference == 5) return "dg";
}

function setAlertVisual()
{
  if (wantMaxDT.checked == true)
  {
    maxDT.style.display = "block";
    maxDTView.style.display = "block";
  }
  else
  {
    maxDT.style.display = "none";
    maxDTView.style.display = "none";
  }
  if (wantMinDB.checked == true)
  {
    minDb.style.display = "block";
    minDbView.style.display = "block";
  }
  else
  {
    minDb.style.display = "none";
    minDbView.style.display = "none";
  }
  if (wantMinFreq.checked == true)
  {
    minFreq.style.display = "block";
    minFreqView.style.display = "block";
  }
  else
  {
    minFreq.style.display = "none";
    minFreqView.style.display = "none";
  }
  if (wantMaxFreq.checked == true)
  {
    maxFreq.style.display = "block";
    maxFreqView.style.display = "block";
  }
  else
  {
    maxFreq.style.display = "none";
    maxFreqView.style.display = "none";
  }

  if (GT.callsignLookups.lotwUseEnable == true)
  { usesLoTWDiv.style.display = "block"; }
  else usesLoTWDiv.style.display = "none";

  if (GT.callsignLookups.eqslUseEnable == true)
  { useseQSLDiv.style.display = "block"; }
  else useseQSLDiv.style.display = "none";
}

function setAudioView()
{
  speechVolume.value = GT.audioSettings.speechVolume;
  speechPitch.value = GT.audioSettings.speechPitch;
  speechRate.value = GT.audioSettings.speechRate;
  speechPhonetics.checked = GT.audioSettings.speechPhonetics;

  speechVolumeTd.innerText = speechVolume.value;
  speechPitchTd.innerText = speechPitch.value;
  speechRateTd.innerText = speechRate.value;

  audioVolume.value = GT.audioSettings.volume;
  audioVolumeTd.innerText = parseInt(audioVolume.value * 100) + "%";
}

function saveAudioSettings()
{
  GT.localStorage.audioSettings = JSON.stringify(GT.audioSettings);
}

function saveAlerts()
{
  GT.localStorage.savedAlerts = JSON.stringify(GT.alerts);
  GT.localStorage.classicAlerts = JSON.stringify(GT.classicAlerts);
  GT.localStorage.alertSettings = JSON.stringify(GT.alertSettings);
}

GT.testAudioTimer = null;

function changeAudioValues()
{
  if (GT.testAudioTimer) nodeTimers.clearTimeout(GT.testAudioTimer);

  GT.audioSettings.volume = audioVolume.value;
  audioVolumeTd.innerText = parseInt(audioVolume.value * 100) + "%";

  GT.testAudioTimer = nodeTimers.setTimeout(playTestFile, 200);
  saveAudioSettings();
}

function playTestFile()
{
  playAlertMediaFile("Sysenter-7.mp3");
}

function changeSpeechValues()
{
  window.speechSynthesis.cancel();

  GT.audioSettings.speechVolume = speechVolume.value;
  GT.audioSettings.speechPitch = speechPitch.value;
  GT.audioSettings.speechRate = speechRate.value;
  GT.audioSettings.speechPhonetics = speechPhonetics.checked;

  speechVolumeTd.innerText = speechVolume.value;
  speechPitchTd.innerText = speechPitch.value;
  speechRateTd.innerText = speechRate.value;

  saveAudioSettings();
}

function addNewAlert()
{
  var error = "<font color='green'>Added</font>";
  var valid = true;
  var filename = "";
  var shortname = "";
  if (alertNotifySelect.value == 0)
  {
    if (alertMediaSelect.value == "none")
    {
      valid = false;
      error = I18N("alerts.addNew.SelectFile");
    }
    else
    {
      filename = alertMediaSelect.value;
      shortname = alertMediaSelect.selectedOptions[0].innerText;
    }
  }
  if (valid)
  {
    if (alertTypeSelect.value == 0 || alertTypeSelect.value == 5)
    {
      valid = ValidateCallsign(alertValueInput, null);
      if (!valid)
      {
        error = "Invalid Callsign";
      }
    }
  }
  if (valid)
  {
    valid = addAlert(
      alertValueInput.value,
      alertTypeSelect.value,
      alertNotifySelect.value,
      alertRepeatSelect.value,
      filename,
      shortname
    );
    if (!valid)
    {
      error = "Duplicate!";
    }
  }
  addError.innerHTML = error;
  displayAlerts();
}

function addAlert(value, type, notify, repeat, filename, shortname)
{
  var newKey = unique(value + type + notify + repeat + filename);

  if (!(newKey in GT.alerts))
  {
    var alertItem = Object();
    alertItem.value = value;
    alertItem.type = type;
    alertItem.notify = notify;
    alertItem.repeat = repeat;
    alertItem.filename = filename;
    alertItem.shortname = shortname;
    alertItem.lastMessage = "";
    alertItem.lastTime = 0;
    alertItem.fired = 0;
    alertItem.needAck = 0;
    GT.alerts[newKey] = alertItem;

    saveAlerts();
    return true;
  }
  return false; // we have this alert already
}

function deleteAlert(key)
{
  delete GT.alerts[key];
  saveAlerts();
  displayAlerts();
}

function resetAlert(key)
{
  GT.alerts[key].lastMessage = "";
  GT.alerts[key].lastTime = 0;
  GT.alerts[key].fired = 0;
  GT.alerts[key].needAck = 0;
  displayAlerts();
}

function processAlertMessage(decodeWords, message, band, mode)
{
  if (Object.keys(GT.alerts).length == 0)
  {
    // no alerts, don't bother
    return false;
  }
  else
  {
    var CQ = false;
    var validQTH = false;
    var theirGrid = null;
    var msgDEcallsign = "";
    var found_callsign = null;

    // Grab the last word in the decoded message
    var grid = decodeWords[decodeWords.length - 1].trim();
    if (grid.length == 4)
    {
      // maybe it's a grid
      var LETTERS = grid.substr(0, 2);
      var NUMBERS = grid.substr(2, 2);

      if (/^[A-R]+$/.test(LETTERS) && /^[0-9]+$/.test(NUMBERS))
      {
        theirGrid = LETTERS + NUMBERS;

        if (theirGrid != "RR73")
        {
          validQTH = true;
        }
        else
        {
          theirGrid = null;
          validQTH = false;
        }
      }
    }

    if (validQTH) msgDEcallsign = decodeWords[decodeWords.length - 2].trim();
    if (validQTH == false && decodeWords.length == 3)
    { msgDEcallsign = decodeWords[decodeWords.length - 2].trim(); }
    if (validQTH == false && decodeWords.length == 2)
    { msgDEcallsign = decodeWords[decodeWords.length - 1].trim(); }
    if (decodeWords[0] == "CQ")
    {
      CQ = true;
    }
    if (decodeWords.length >= 3 && CQ == true && validQTH == false)
    {
      if (validateNumAndLetter(decodeWords[decodeWords.length - 1].trim()))
      { msgDEcallsign = decodeWords[decodeWords.length - 1].trim(); }
      else msgDEcallsign = decodeWords[decodeWords.length - 2].trim();
    }

    if (decodeWords.length >= 4 && CQ == false)
    {
      msgDEcallsign = decodeWords[1];
    }

    var okayToAlert = true;

    if (msgDEcallsign + band + mode in GT.liveCallsigns)
    { found_callsign = GT.liveCallsigns[msgDEcallsign + band + mode]; }

    if (okayToAlert == true)
    { return checkAlerts(msgDEcallsign, theirGrid, message, found_callsign); }
  }
  return false;
}

function checkAlerts(
  DEcallsign,
  grid,
  originalMessage,
  callsignRecord,
  band,
  mode
)
{
  var hadAlert = false;
  for (var key in GT.alerts)
  {
    var nalert = GT.alerts[key];
    if (nalert.type == 0)
    {
      // callsign exatch match
      if (DEcallsign == nalert.value)
      {
        handleAlert(nalert, DEcallsign, originalMessage, callsignRecord);
        hadAlert = true;
      }
    }
    else if (grid && nalert.type == 2)
    {
      // gridsquare
      if (!(DEcallsign + band + mode in GT.tracker.worked.call) && grid.indexOf(nalert.value) == 0)
      {
        handleAlert(nalert, DEcallsign, originalMessage, callsignRecord, grid);
        hadAlert = true;
      }
    }
    else if (nalert.type == 4)
    {
      // QRZ
      if (GT.appSettings.myCall.length > 0 && originalMessage.indexOf(GT.appSettings.myCall + " ") == 0)
      {
        handleAlert(nalert, DEcallsign, originalMessage, callsignRecord, grid);
        hadAlert = true;
      }
    }
    else if (nalert.type == 5)
    {
      // callsign partial
      if (!(DEcallsign + band + mode in GT.tracker.worked.call) && DEcallsign.indexOf(nalert.value) == 0)
      {
        handleAlert(nalert, DEcallsign, originalMessage, callsignRecord, grid);
        hadAlert = true;
      }
    }
    else if (nalert.type == 6)
    {
      // callsign regex
      try
      {
        if (
          !(DEcallsign + band + mode in GT.tracker.worked.call) &&
          DEcallsign.match(nalert.value)
        )
        {
          handleAlert(nalert, DEcallsign, originalMessage, callsignRecord, grid);
          hadAlert = true;
        }
      }
      catch (e) {}
    }
  }
  if (hadAlert)
  {
    displayAlerts();
    return true;
  }
  return false;
}

function handleAlert(nAlert, target, lastMessage, callsignRecord, grid)
{
  if (nAlert.fired > 0 && nAlert.repeat == 0) return;

  if (nAlert.fired == 1 && nAlert.repeat == 1) return;

  nAlert.lastMessage = lastMessage;
  nAlert.lastTime = timeNowSec();

  if (nAlert.notify == 3 && callsignRecord != null && grid)
  {
    var LL = squareToCenter(grid);

    if (!isNaN(LL.a))
    {
      GT.map
        .getView()
        .setCenter(ol.proj.transform([LL.o, LL.a], "EPSG:4326", GT.mapSettings.projection));
    }
  }

  if (nAlert.notify == 2) nAlert.needAck = 1;

  if (nAlert.type == 0 || nAlert.type == 5 || nAlert.type == 6)
  {
    if (nAlert.notify == 0) playAlertMediaFile(nAlert.filename);
    if (nAlert.notify == 1) speakAlertString("Callsign", target, null);
    if (nAlert.notify == 2) displayAlertPopUp("Seeking", target, null);
  }

  if (nAlert.type == 2)
  {
    if (nAlert.notify == 0) playAlertMediaFile(nAlert.filename);
    if (nAlert.notify == 1) speakAlertString("Grid square", grid, null);
    if (nAlert.notify == 2) displayAlertPopUp("Gridsquare", grid, target);
  }

  if (nAlert.type == 4)
  {
    if (nAlert.notify == 0) playAlertMediaFile(nAlert.filename);
    if (nAlert.notify == 1) speakQRZString(target, "Calling", GT.appSettings.myCall);
    if (nAlert.notify == 2) displayAlertPopUp("QRZ", null, null);
  }
  nAlert.fired++;
}

function playAlertMediaFile(filename)
{
  if (GT.audioSettings.alertMute == 1) return;

  // check if this is an alert stored with an older version of GT
  // which has a full file path given.
  if (path.isAbsolute(filename) && !fs.existsSync(filename))
  {
    // full alert file name stored with old GT version referencing
    // the user media dir. determine basename of the file and try
    // constructing the path
    filename = path.basename(filename);
  }
  // construct the path from the user media dir or
  // fall back on the global media dir
  var fpath = path.join(GT.userMediaDir, filename);
  if (!fs.existsSync(fpath)) fpath = path.join(GT.gtMediaDir, filename);

  var audio = document.createElement("audio");
  audio.src = "file://" + fpath;
  audio.setSinkId(GT.soundCard);
  audio.volume = GT.audioSettings.volume;
  audio.play();
}

function stringToPhonetics(string)
{
  var newMsg = "";
  for (var x = 0; x < string.length; x++)
  {
    if (GT.audioSettings.speechPhonetics == true)
    { newMsg += GT.phonetics[string.substr(x, 1)]; }
    else
    {
      if (string.substr(x, 1) == " ") newMsg += ", ";
      else newMsg += string.substr(x, 1);
    }

    if (x != string.length - 1) newMsg += " ";
  }
  return newMsg;
}

function speakQRZString(caller, words, you)
{
  if (GT.audioSettings.alertMute == 0)
  {
    var sCaller = "";
    var sYou = "";
    if (caller) sCaller = stringToPhonetics(caller);
    if (you) sYou = stringToPhonetics(you);

    if (GT.speechAvailable)
    {
      var speak = sCaller.trim() + ", " + words.trim() + ", " + sYou.trim();
      var msg = new SpeechSynthesisUtterance(speak);
      msg.lang = GT.localeString;
      if (GT.audioSettings.speechVoice > 0)
      { msg.voice = GT.voices[GT.audioSettings.speechVoice - 1]; }
      msg.rate = GT.audioSettings.speechRate;
      msg.pitch = GT.audioSettings.speechPitch;
      msg.volume = GT.audioSettings.speechVolume;
      window.speechSynthesis.speak(msg);
    }
  }
}

function speakAlertString(what, message, target)
{
  if (GT.audioSettings.alertMute == 0)
  {
    var sMsg = "";
    var sTarget = "";
    if (message) sMsg = stringToPhonetics(message);
    if (target) sTarget = stringToPhonetics(target);

    if (GT.speechAvailable)
    {
      var speak = what.trim() + ", " + sMsg.trim() + ", " + sTarget.trim();
      var msg = new SpeechSynthesisUtterance(speak);
      msg.lang = GT.localeString;
      if (GT.audioSettings.speechVoice > 0)
      { msg.voice = GT.voices[GT.audioSettings.speechVoice - 1]; }
      msg.rate = GT.audioSettings.speechRate;
      msg.pitch = GT.audioSettings.speechPitch;
      msg.volume = GT.audioSettings.speechVolume;
      window.speechSynthesis.speak(msg);
    }
  }
}

function displayAlertPopUp(what, message, target)
{
  if (GT.alertWindowInitialized == false) return;

  var worker = "";
  var acount = 0;

  if (Object.keys(GT.alerts).length > 0)
  {
    for (var key in GT.alerts)
    {
      if (GT.alerts[key].needAck) acount++;
    }

    worker +=
      "<div id='tableDiv' style='overflow:hidden;'>";

    worker += "<table align='center' class='darkTable' >";

    worker += "<tr>";
    worker += "<th>Type</th>";
    worker += "<th>Value</th>";
    worker += "<th>Notify</th>";
    worker += "<th>Repeat</th>";
    worker += "<th>Filename</th>";
    worker += "<th>Alerted</th>";
    worker += "<th>Last Message</th>";
    worker += "<th>When</th>";
    worker += "</tr>";

    for (var key in GT.alerts)
    {
      if (GT.alerts[key].needAck)
      {
        worker += "<tr>";
        worker += "<td>" + GT.alertTypeOptions[GT.alerts[key].type] + "</td>";
        if (GT.alerts[key].type == 0)
        { worker += "<td style='color:yellow'>" + GT.alerts[key].value + "</td>"; }
        if (GT.alerts[key].type == 2)
        { worker += "<td style='color:red'>" + GT.alerts[key].value + "</td>"; }
        if (GT.alerts[key].type == 4)
        { worker += "<td style='color:cyan'>" + GT.appSettings.myCall + "</td>"; }
        if (GT.alerts[key].type == 5)
        {
          worker +=
            "<td style='color:lightgreen'>" + GT.alerts[key].value + "*</td>";
        }
        if (GT.alerts[key].type == 6)
        { worker += "<td style='color:pink'>" + GT.alerts[key].value + "</td>"; }

        worker += "<td>" + GT.alertValueOptions[GT.alerts[key].notify] + "</td>";
        worker += "<td>" + GT.alertRepeatOptions[GT.alerts[key].repeat] + "</td>";
        worker +=
          "<td>" +
          (GT.alerts[key].shortname.length > 0 ? GT.alerts[key].shortname : "-") +
          "</td>";
        worker += "<td>" + (GT.alerts[key].fired > 0 ? "Yes" : "No") + "</td>";
        worker +=
          "<td style='color:cyan'>" +
          (GT.alerts[key].lastMessage.length > 0
            ? GT.alerts[key].lastMessage
            : "-") +
          "</td>";
        ageString = userTimeString(GT.alerts[key].lastTime * 1000);
        worker +=
          "<td>" + (GT.alerts[key].lastTime > 0 ? ageString : "-") + "</td>";
        worker += "</tr>";
      }
    }
    worker += "</table>";
    worker += "</div>";
  }

  GT.alertWindowHandle.window.alertPopListDiv.innerHTML = worker;
  GT.alertWindowHandle.resizeTo(parseInt(GT.alertWindowHandle.window.alertsPopDiv.offsetWidth) + 20, parseInt(GT.alertWindowHandle.window.alertsPopDiv.offsetHeight) + 44);

  openAlertWindow(true);
}

function ackAlerts()
{
  for (var key in GT.alerts)
  {
    GT.alerts[key].needAck = 0;
  }
}

function alertTypeChanged()
{
  addError.innerHTML = "";
  if (alertTypeSelect.value == 0 || alertTypeSelect.value == 5)
  {
    alertValueSelect.innerHTML ="<input id=\"alertValueInput\" type=\"text\" class=\"inputTextValue\" maxlength=\"12\"  size=\"5\" oninput=\"ValidateCallsign(this,null);\" / >";
    ValidateCallsign(alertValueInput, null);
  }
  else if (alertTypeSelect.value == 2)
  {
    alertValueSelect.innerHTML = "<input id=\"alertValueInput\" type=\"text\" class=\"inputTextValue\"  maxlength=\"6\" size=\"3\" oninput=\"ValidateGridsquareOnly4(this,null);\" / >";
    ValidateGridsquareOnly4(alertValueInput, null);
  }
  else if (alertTypeSelect.value == 4)
  {
    alertValueSelect.innerHTML = "<input id=\"alertValueInput\" disabled=\"true\" type=\"text\" class=\"inputTextValue\" value=\"" + GT.appSettings.myCall + "\" maxlength=\"12\"  size=\"5\" oninput=\"ValidateCallsign(this,null);\" / >";
    ValidateCallsign(alertValueInput, null);
  }
  else if (alertTypeSelect.value == 6)
  {
    alertValueSelect.innerHTML = "<input id=\"alertValueInput\" type=\"text\" class=\"inputTextValue\" size=\"12\" value=\"^\" oninput=\"ValidateText(this);\" / >";
    ValidateText(alertValueInput);
  }
}

function alertNotifyChanged(who = "")
{
  addError.innerHTML = "";

  if (alertNotifySelect.value == 0)
  {
    alertMediaSelect.style.display = "block";
    if (who == "media")
    {
      playAlertMediaFile(alertMediaSelect.value);
    }
  }
  else
  {
    alertMediaSelect.style.display = "none";
  }
}

GT.alertTypeOptions = Array();

GT.alertTypeOptions["0"] = "Call (exact)";
GT.alertTypeOptions["1"] = "Deprecated";
GT.alertTypeOptions["2"] = "Grid";
GT.alertTypeOptions["3"] = "Deprecated";
GT.alertTypeOptions["4"] = "QRZ";
GT.alertTypeOptions["5"] = "Call (partial)";
GT.alertTypeOptions["6"] = "Call (regex)";

GT.alertValueOptions = Array();
GT.alertValueOptions["0"] =
  "<img title='Audio File' style='margin:-1px;margin-bottom:-4px;padding:0px' src='img/icon_audio_16.png'>";
GT.alertValueOptions["1"] = "TTS";
GT.alertValueOptions["2"] = "PopUp";
GT.alertValueOptions["3"] = "MapCenter";

GT.alertRepeatOptions = Array();

GT.alertRepeatOptions["0"] = "No";
GT.alertRepeatOptions["1"] = "Once";
GT.alertRepeatOptions["2"] = "Inf";
GT.alertRepeatOptions["3"] = "Inf(Session)";

function displayAlerts()
{
  var worker = "";

  if (Object.keys(GT.alerts).length > 0)
  {
    worker +=
      "<div style='padding-right:8px;overflow:auto;overflow-x:hidden;height:" +
      Math.min(Object.keys(GT.alerts).length * 24 + 23, 312) +
      "px;'>";

    worker += "<table align='center' class='darkTable' >";

    worker += "<tr>";
    worker += "<th>Type</th>";
    worker += "<th>Value</th>";
    worker += "<th>Notify</th>";
    worker += "<th>Repeat</th>";
    worker += "<th>Filename</th>";
    worker += "<th>Alerted</th>";
    worker += "<th>Last Message</th>";
    worker += "<th>When</th>";
    worker += "<th>Reset</th>";
    worker += "<th>Delete</th>";
    worker += "</tr>";

    for (var key in GT.alerts)
    {
      worker += "<tr>";
      worker += "<td>" + GT.alertTypeOptions[GT.alerts[key].type] + "</td>";
      if (GT.alerts[key].type == 0)
      { worker += "<td style='color:yellow'>" + GT.alerts[key].value + "</td>"; }
      if (GT.alerts[key].type == 2)
      { worker += "<td style='color:red'>" + GT.alerts[key].value + "</td>"; }
      if (GT.alerts[key].type == 4)
      { worker += "<td style='color:cyan'>" + GT.appSettings.myCall + "</td>"; }
      if (GT.alerts[key].type == 5)
      {
        worker +=
          "<td style='color:lightgreen'>" + GT.alerts[key].value + "*</td>";
      }
      if (GT.alerts[key].type == 6)
      { worker += "<td style='color:pink'>" + GT.alerts[key].value + "</td>"; }

      worker += "<td>" + GT.alertValueOptions[GT.alerts[key].notify] + "</td>";
      worker += "<td>" + GT.alertRepeatOptions[GT.alerts[key].repeat] + "</td>";
      worker +=
        "<td>" +
        (GT.alerts[key].shortname.length > 0 ? GT.alerts[key].shortname : "-") +
        "</td>";
      worker += "<td>" + (GT.alerts[key].fired > 0 ? "Yes" : "No") + "</td>";
      worker +=
        "<td style='color:cyan'>" +
        (GT.alerts[key].lastMessage.length > 0
          ? GT.alerts[key].lastMessage
          : "-") +
        "</td>";
      ageString = userTimeString(GT.alerts[key].lastTime * 1000);
      worker +=
        "<td>" + (GT.alerts[key].lastTime > 0 ? ageString : "-") + "</td>";
      worker +=
        "<td style='cursor:pointer' onclick='resetAlert(\"" +
        key +
        "\")'><img src='img/reset_24x48.png' style='height:17px;margin:-1px;margin-bottom:-3px;padding:0px' ></td>";
      worker +=
        "<td style='cursor:pointer' onclick='deleteAlert(\"" +
        key +
        "\")'><img src='img/trash_24x48.png' style='height:17px;margin:-1px;margin-bottom:-3px;padding:0px'></td>";
      worker += "</tr>";
    }
    worker += "</table>";
    worker += "</div>";
  }
  alertListDiv.innerHTML = worker;
}

function loadClassicAlertView()
{
  for (node in GT.classicAlerts)
  {
    what = document.getElementById(node);
    if (what != null)
    {
      if (what.type == "select-one" || what.type == "text")
      {
        what.value = GT.classicAlerts[node];
        if (what.id.endsWith("Notify"))
        {
          var mediaNode = document.getElementById(what.id + "Media");
          var wordNode = document.getElementById(what.id + "Word");
          if (what.value == "0")
          {
            mediaNode.style.display = "block";
            wordNode.style.display = "none";
          }
          else
          {
            mediaNode.style.display = "none";
            wordNode.style.display = "block";
          }
        }
        if (what.type == "text")
        {
          ValidateText(what);
        }
      }
      else if (what.type == "checkbox")
      {
        what.checked = GT.classicAlerts[node];
      }
    }
  }
}

function wantedChanged(what)
{
  if (what.type == "select-one" || what.type == "text")
  {
    GT.classicAlerts[what.id] = what.value;
    if (what.id.endsWith("Notify"))
    {
      var mediaNode = document.getElementById(what.id + "Media");
      var wordNode = document.getElementById(what.id + "Word");
      if (what.value == "0")
      {
        mediaNode.style.display = "block";
        wordNode.style.display = "none";
      }
      else
      {
        mediaNode.style.display = "none";
        wordNode.style.display = "block";
      }
    }
    if (what.id.endsWith("Media"))
    {
      if (what.value != "none") playAlertMediaFile(what.value);
    }
  }
  else if (what.type == "checkbox")
  {
    GT.classicAlerts[what.id] = what.checked;
  }
  GT.localStorage.classicAlerts = JSON.stringify(GT.classicAlerts);
}

GT.classic_alert_count_template = {
  huntCallsign: 0,
  huntGrid: 0,
  huntDXCC: 0,
  huntCQz: 0,
  huntITUz: 0,
  huntStates: 0
};

GT.classic_alert_counts = Object.assign({}, GT.classic_alert_count_template);

GT.classic_alert_functions = {
  huntCallsign: alertCheckCallsign,
  huntGrid: alertCheckGrid,
  huntDXCC: alertCheckDXCC,
  huntCQz: alertCheckCQz,
  huntITUz: alertCheckITUz,
  huntStates: alertCheckStates
};

GT.classic_alert_words = {
  huntCallsign: "Call",
  huntGrid: "Grid",
  huntDXCC: "DXCC",
  huntCQz: "CQ Zone",
  huntITUz: "I-T-U Zone",
  huntStates: "State"
};

function processClassicAlerts()
{
  for (key in GT.classic_alert_counts)
  {
    if (
      document.getElementById(key).checked == true &&
      GT.classic_alert_counts[key] > 0
    )
    {
      var notify = document.getElementById(key + "Notify").value;
      if (notify == "0")
      {
        var media = document.getElementById(key + "Notify" + "Media").value;
        if (media != "none") playAlertMediaFile(media);
      }
      else if (notify == "1")
      {
        speakAlertString(
          document.getElementById(key + "Notify" + "Word").value
        );
      }
    }
  }
  GT.classic_alert_counts = Object.assign({}, GT.classic_alert_count_template);
}

function checkClassicAlerts(CQ, callObj, message, DXcall)
{
  var didAlert = false;
  if (GT.alertSettings.cqOnly == true && CQ == false) return didAlert;

  if (GT.alertSettings.requireGrid == true && callObj.grid.length != 4)
  { return didAlert; }

  if (GT.alertSettings.wantMinDB == true && message.SR < GT.alertSettings.minDb)
  { return didAlert; }

  if (
    GT.alertSettings.wantMaxDT == true &&
    Math.abs(message.DT) > GT.alertSettings.maxDT
  )
  { return didAlert; }

  if (
    GT.alertSettings.wantMinFreq == true &&
    message.DF < GT.alertSettings.minFreq
  )
  { return didAlert; }

  if (
    GT.alertSettings.wantMaxFreq == true &&
    message.DF > GT.alertSettings.maxFreq
  )
  { return didAlert; }

  if (DXcall == "CQ RU")
  {
    if (GT.alertSettings.noRoundUp == true) return didAlert;
  }
  else
  {
    if (GT.alertSettings.onlyRoundUp == true) return didAlert;
  }

  if (callObj.dxcc == GT.myDXCC)
  {
    if (GT.alertSettings.noMyDxcc == true) return didAlert;
  }
  else
  {
    if (GT.alertSettings.onlyMyDxcc == true) return didAlert;
  }

  if (
    GT.callsignLookups.lotwUseEnable == true &&
    GT.alertSettings.usesLoTW == true
  )
  {
    if (!(callObj.DEcall in GT.lotwCallsigns)) return didAlert;
  }

  if (
    GT.callsignLookups.eqslUseEnable == true &&
    GT.alertSettings.useseQSL == true
  )
  {
    if (!(callObj.DEcall in GT.eqslCallsigns)) return didAlert;
  }

  if (DXcall == "CQ DX" && callObj.dxcc == GT.myDXCC) return didAlert;

  if (
    callObj.DEcall + hashMaker(callObj.band, callObj.mode) in
    GT.tracker.worked.call
  )
  { return didAlert; }

  for (key in GT.classic_alert_functions)
  {
    if (document.getElementById(key).checked == true)
    {
      var alerted = GT.classic_alert_functions[key](key, callObj);
      if (alerted == true) didAlert = true;
      GT.classic_alert_counts[key] += alerted;
    }
  }

  return didAlert;
}

function alertCheckCallsign(key, callObj)
{
  var status = document.getElementById(key + "Need").value;

  if (
    status == "worked" &&
    callObj.DEcall + hashMaker(callObj.band, callObj.mode) in
      GT.tracker.worked.call
  )
  { return 0; }
  if (
    status == "confirmed" &&
    callObj.DEcall + hashMaker(callObj.band, callObj.mode) in
      GT.tracker.confirmed.call
  )
  { return 0; }

  return 1;
}

function alertCheckGrid(key, callObj)
{
  var status = document.getElementById(key + "Need").value;
  if (callObj.grid.length == 0) return 0;

  if (
    status == "worked" &&
    callObj.grid + hashMaker(callObj.band, callObj.mode) in
      GT.tracker.worked.grid
  )
  { return 0; }
  if (
    status == "confirmed" &&
    callObj.grid + hashMaker(callObj.band, callObj.mode) in
      GT.tracker.confirmed.grid
  )
  { return 0; }

  return 1;
}

function alertCheckDXCC(key, callObj)
{
  var status = document.getElementById(key + "Need").value;

  if (
    status == "worked" &&
    String(callObj.dxcc) + "|" + hashMaker(callObj.band, callObj.mode) in
      GT.tracker.worked.dxcc
  )
  { return 0; }
  if (
    status == "confirmed" &&
    String(callObj.dxcc) + "|" + hashMaker(callObj.band, callObj.mode) in
      GT.tracker.confirmed.dxcc
  )
  { return 0; }

  return 1;
}

function alertCheckCQz(key, callObj)
{
  var status = document.getElementById(key + "Need").value;
  
  if (status == "worked" && callObj.cqz + "|" + hashMaker(callObj.band, callObj.mode) in GT.tracker.worked.cqz) return 0;

  if (status == "confirmed" && callObj.cqz + "|" + hashMaker(callObj.band, callObj.mode) in GT.tracker.confirmed.cqz) return 0;

  return 1;
}

function alertCheckITUz(key, callObj)
{
  var status = document.getElementById(key + "Need").value;

  if (status == "worked" && callObj.ituz + "|" + hashMaker(callObj.band, callObj.mode) in GT.tracker.worked.ituz) return 0;

  if (status == "confirmed" && callObj.ituz + "|" + hashMaker(callObj.band, callObj.mode) in GT.tracker.confirmed.ituz) return 0;

  return 1;
}

function alertCheckStates(key, callObj)
{
  if (callObj.dxcc == 291 || callObj.dxcc == 110 || callObj.dxcc == 6)
  {
    if (callObj.state in GT.StateData)
    {
      var hash = callObj.state + hashMaker(callObj.band, callObj.mode);
      var status = document.getElementById(key + "Need").value;

      if (status == "worked" && hash in GT.tracker.worked.state) return 0;

      if (status == "confirmed" && hash in GT.tracker.confirmed.state) return 0;

      return 1;
    }
    return 0;
  }
  return 0;
}
