// GridTracker Copyright © 2024 GridTracker.org
// All rights reserved.
// See LICENSE for more information.
GT.phonetics = {};
GT.enums = {};

function loadAlerts()
{
  loadClassicAlertView();

  wantGrid.checked = GT.settings.alerts.requireGrid;

  wantMaxDT.checked = GT.settings.alerts.wantMaxDT;
  wantMinDB.checked = GT.settings.alerts.wantMinDB;
  wantMinFreq.checked = GT.settings.alerts.wantMinFreq;
  wantMaxFreq.checked = GT.settings.alerts.wantMaxFreq;

  maxDTView.innerHTML = maxDT.value = GT.settings.alerts.maxDT;
  minDbView.innerHTML = minDb.value = GT.settings.alerts.minDb;
  minFreqView.innerHTML = minFreq.value = GT.settings.alerts.minFreq;
  maxFreqView.innerHTML = maxFreq.value = GT.settings.alerts.maxFreq;

  cqOnly.checked = GT.settings.alerts.cqOnly;
  noMyDxcc.checked = GT.settings.alerts.noMyDxcc;
  onlyMyDxcc.checked = GT.settings.alerts.onlyMyDxcc;
  noRoundUp.checked = GT.settings.alerts.noRoundUp;
  onlyRoundUp.checked = GT.settings.alerts.onlyRoundUp;
  usesLoTW.checked = GT.settings.alerts.usesLoTW;
  useseQSL.checked = GT.settings.alerts.useseQSL;

  referenceNeed.value = GT.settings.alerts.reference;
  logEventMedia.value = GT.settings.alerts.logEventMedia;
  setAlertVisual();
}

function newLogEventSetting(obj)
{
  GT.settings.alerts.logEventMedia = obj.value;
}

function exceptionValuesChanged()
{
  setAlertVisual();

  GT.settings.alerts.requireGrid = wantGrid.checked;

  GT.settings.alerts.wantMaxDT = wantMaxDT.checked;
  GT.settings.alerts.wantMinDB = wantMinDB.checked;
  GT.settings.alerts.wantMinFreq = wantMinFreq.checked;
  GT.settings.alerts.wantMaxFreq = wantMaxFreq.checked;

  maxDTView.innerHTML = GT.settings.alerts.maxDT = maxDT.value;
  minDbView.innerHTML = GT.settings.alerts.minDb = minDb.value;
  minFreqView.innerHTML = GT.settings.alerts.minFreq = minFreq.value;
  maxFreqView.innerHTML = GT.settings.alerts.maxFreq = maxFreq.value;

  GT.settings.alerts.cqOnly = cqOnly.checked;
  GT.settings.alerts.noMyDxcc = noMyDxcc.checked;
  GT.settings.alerts.onlyMyDxcc = onlyMyDxcc.checked;
  GT.settings.alerts.noRoundUp = noRoundUp.checked;
  GT.settings.alerts.onlyRoundUp = onlyRoundUp.checked;
  GT.settings.alerts.usesLoTW = usesLoTW.checked;
  GT.settings.alerts.useseQSL = useseQSL.checked;

  GT.settings.alerts.reference = referenceNeed.value;
}

function hashMaker(band, mode)
{
  // "Current Band & Mode"
  if (GT.settings.alerts.reference == 0) return band + mode;

  // "Current Band, Any Mode"
  if (GT.settings.alerts.reference == 1) return band;

  // "Current Band, Any Digi Mode"
  if (GT.settings.alerts.reference == 2) return band + "dg";

  // "Current Mode, Any Band"
  if (GT.settings.alerts.reference == 3) return mode;

  // "Any Band, Any Mode"
  if (GT.settings.alerts.reference == 4) return "";

  // "Any Band, Any Digit Mode"
  if (GT.settings.alerts.reference == 5) return "dg";
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

  if (GT.settings.callsignLookups.lotwUseEnable == true)
  { usesLoTWDiv.style.display = "block"; }
  else usesLoTWDiv.style.display = "none";

  if (GT.settings.callsignLookups.eqslUseEnable == true)
  { useseQSLDiv.style.display = "block"; }
  else useseQSLDiv.style.display = "none";
}

function setAudioView()
{
  speechVolume.value = GT.settings.audio.speechVolume;
  speechPitch.value = GT.settings.audio.speechPitch;
  speechRate.value = GT.settings.audio.speechRate;
  speechPhonetics.checked = GT.settings.audio.speechPhonetics;

  speechVolumeTd.innerText = speechVolume.value;
  speechPitchTd.innerText = speechPitch.value;
  speechRateTd.innerText = speechRate.value;

  audioVolume.value = GT.settings.audio.volume;
  audioVolumeTd.innerText = parseInt(audioVolume.value * 100) + "%";
}

function saveAudioSettings()
{

}

function saveAlerts()
{
}

GT.testAudioTimer = null;

function changeAudioValues()
{
  if (GT.testAudioTimer) nodeTimers.clearTimeout(GT.testAudioTimer);

  GT.settings.audio.volume = audioVolume.value;
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

  GT.settings.audio.speechVolume = speechVolume.value;
  GT.settings.audio.speechPitch = speechPitch.value;
  GT.settings.audio.speechRate = speechRate.value;
  GT.settings.audio.speechPhonetics = speechPhonetics.checked;

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

  if (!(newKey in GT.settings.customAlerts))
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
    GT.settings.customAlerts[newKey] = alertItem;

    saveAlerts();
    return true;
  }
  return false; // we have this alert already
}

function deleteAlert(key)
{
  delete GT.settings.customAlerts[key];
  saveAlerts();
  displayAlerts();
}

function resetAlert(key)
{
  GT.settings.customAlerts[key].lastMessage = "";
  GT.settings.customAlerts[key].lastTime = 0;
  GT.settings.customAlerts[key].fired = 0;
  GT.settings.customAlerts[key].needAck = 0;
  displayAlerts();
}

function processAlertMessage(decodeWords, message, band, mode)
{
  if (Object.keys(GT.settings.customAlerts).length == 0)
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
  for (var key in GT.settings.customAlerts)
  {
    var nalert = GT.settings.customAlerts[key];
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
      if (GT.settings.app.myCall.length > 0 && originalMessage.indexOf(GT.settings.app.myCall + " ") == 0)
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
        .setCenter(ol.proj.transform([LL.o, LL.a], "EPSG:4326", GT.settings.map.projection));
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
    if (nAlert.notify == 1) speakQRZString(target, "Calling", GT.settings.app.myCall);
    if (nAlert.notify == 2) displayAlertPopUp("QRZ", null, null);
  }
  nAlert.fired++;
}

function playAlertMediaFile(filename)
{
  if (GT.settings.audio.alertMute == 1) return;

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
  audio.volume = GT.settings.audio.volume;
  audio.play();
}

function stringToPhonetics(string)
{
  var newMsg = "";
  for (var x = 0; x < string.length; x++)
  {
    if (GT.settings.audio.speechPhonetics == true)
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
  if (GT.settings.audio.alertMute == 0)
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
      if (GT.settings.audio.speechVoice > 0)
      { msg.voice = GT.voices[GT.settings.audio.speechVoice - 1]; }
      msg.rate = GT.settings.audio.speechRate;
      msg.pitch = GT.settings.audio.speechPitch;
      msg.volume = GT.settings.audio.speechVolume;
      window.speechSynthesis.speak(msg);
    }
  }
}

function speakAlertString(what, message, target)
{
  if (GT.settings.audio.alertMute == 0)
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
      if (GT.settings.audio.speechVoice > 0)
      { msg.voice = GT.voices[GT.settings.audio.speechVoice - 1]; }
      msg.rate = GT.settings.audio.speechRate;
      msg.pitch = GT.settings.audio.speechPitch;
      msg.volume = GT.settings.audio.speechVolume;
      window.speechSynthesis.speak(msg);
    }
  }
}

function displayAlertPopUp(what, message, target)
{
  if (GT.alertWindowInitialized == false) return;

  var worker = "";
  var acount = 0;

  if (Object.keys(GT.settings.customAlerts).length > 0)
  {
    for (var key in GT.settings.customAlerts)
    {
      if (GT.settings.customAlerts[key].needAck) acount++;
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

    for (var key in GT.settings.customAlerts)
    {
      if (GT.settings.customAlerts[key].needAck)
      {
        worker += "<tr>";
        worker += "<td>" + GT.alertTypeOptions[GT.settings.customAlerts[key].type] + "</td>";
        if (GT.settings.customAlerts[key].type == 0)
        { worker += "<td style='color:yellow'>" + GT.settings.customAlerts[key].value + "</td>"; }
        if (GT.settings.customAlerts[key].type == 2)
        { worker += "<td style='color:red'>" + GT.settings.customAlerts[key].value + "</td>"; }
        if (GT.settings.customAlerts[key].type == 4)
        { worker += "<td style='color:cyan'>" + GT.settings.app.myCall + "</td>"; }
        if (GT.settings.customAlerts[key].type == 5)
        {
          worker +=
            "<td style='color:lightgreen'>" + GT.settings.customAlerts[key].value + "*</td>";
        }
        if (GT.settings.customAlerts[key].type == 6)
        { worker += "<td style='color:pink'>" + GT.settings.customAlerts[key].value + "</td>"; }

        worker += "<td>" + GT.alertValueOptions[GT.settings.customAlerts[key].notify] + "</td>";
        worker += "<td>" + GT.alertRepeatOptions[GT.settings.customAlerts[key].repeat] + "</td>";
        worker +=
          "<td>" +
          (GT.settings.customAlerts[key].shortname.length > 0 ? GT.settings.customAlerts[key].shortname : "-") +
          "</td>";
        worker += "<td>" + (GT.settings.customAlerts[key].fired > 0 ? "Yes" : "No") + "</td>";
        worker +=
          "<td style='color:cyan'>" +
          (GT.settings.customAlerts[key].lastMessage.length > 0
            ? GT.settings.customAlerts[key].lastMessage
            : "-") +
          "</td>";
        ageString = userTimeString(GT.settings.customAlerts[key].lastTime * 1000);
        worker +=
          "<td>" + (GT.settings.customAlerts[key].lastTime > 0 ? ageString : "-") + "</td>";
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
  for (var key in GT.settings.customAlerts)
  {
    GT.settings.customAlerts[key].needAck = 0;
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
    alertValueSelect.innerHTML = "<input id=\"alertValueInput\" disabled=\"true\" type=\"text\" class=\"inputTextValue\" value=\"" + GT.settings.app.myCall + "\" maxlength=\"12\"  size=\"5\" oninput=\"ValidateCallsign(this,null);\" / >";
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

  if (Object.keys(GT.settings.customAlerts).length > 0)
  {
    worker +=
      "<div style='padding-right:8px;overflow:auto;overflow-x:hidden;height:" +
      Math.min(Object.keys(GT.settings.customAlerts).length * 24 + 23, 312) +
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

    for (var key in GT.settings.customAlerts)
    {
      worker += "<tr>";
      worker += "<td>" + GT.alertTypeOptions[GT.settings.customAlerts[key].type] + "</td>";
      if (GT.settings.customAlerts[key].type == 0)
      { worker += "<td style='color:yellow'>" + GT.settings.customAlerts[key].value + "</td>"; }
      if (GT.settings.customAlerts[key].type == 2)
      { worker += "<td style='color:red'>" + GT.settings.customAlerts[key].value + "</td>"; }
      if (GT.settings.customAlerts[key].type == 4)
      { worker += "<td style='color:cyan'>" + GT.settings.app.myCall + "</td>"; }
      if (GT.settings.customAlerts[key].type == 5)
      {
        worker +=
          "<td style='color:lightgreen'>" + GT.settings.customAlerts[key].value + "*</td>";
      }
      if (GT.settings.customAlerts[key].type == 6)
      { worker += "<td style='color:pink'>" + GT.settings.customAlerts[key].value + "</td>"; }

      worker += "<td>" + GT.alertValueOptions[GT.settings.customAlerts[key].notify] + "</td>";
      worker += "<td>" + GT.alertRepeatOptions[GT.settings.customAlerts[key].repeat] + "</td>";
      worker +=
        "<td>" +
        (GT.settings.customAlerts[key].shortname.length > 0 ? GT.settings.customAlerts[key].shortname : "-") +
        "</td>";
      worker += "<td>" + (GT.settings.customAlerts[key].fired > 0 ? "Yes" : "No") + "</td>";
      worker +=
        "<td style='color:cyan'>" +
        (GT.settings.customAlerts[key].lastMessage.length > 0
          ? GT.settings.customAlerts[key].lastMessage
          : "-") +
        "</td>";
      ageString = userTimeString(GT.settings.customAlerts[key].lastTime * 1000);
      worker +=
        "<td>" + (GT.settings.customAlerts[key].lastTime > 0 ? ageString : "-") + "</td>";
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
  for (node in GT.settings.classicAlerts)
  {
    what = document.getElementById(node);
    if (what != null)
    {
      if (what.type == "select-one" || what.type == "text")
      {
        what.value = GT.settings.classicAlerts[node];
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
        what.checked = GT.settings.classicAlerts[node];
      }
    }
  }
}

function wantedChanged(what)
{
  if (what.type == "select-one" || what.type == "text")
  {
    GT.settings.classicAlerts[what.id] = what.value;
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
    GT.settings.classicAlerts[what.id] = what.checked;
  }
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
  if (GT.settings.alerts.cqOnly == true && CQ == false) return didAlert;

  if (GT.settings.alerts.requireGrid == true && callObj.grid.length != 4)
  { return didAlert; }

  if (GT.settings.alerts.wantMinDB == true && message.SR < GT.settings.alerts.minDb)
  { return didAlert; }

  if (
    GT.settings.alerts.wantMaxDT == true &&
    Math.abs(message.DT) > GT.settings.alerts.maxDT
  )
  { return didAlert; }

  if (
    GT.settings.alerts.wantMinFreq == true &&
    message.DF < GT.settings.alerts.minFreq
  )
  { return didAlert; }

  if (
    GT.settings.alerts.wantMaxFreq == true &&
    message.DF > GT.settings.alerts.maxFreq
  )
  { return didAlert; }

  if (DXcall == "CQ RU")
  {
    if (GT.settings.alerts.noRoundUp == true) return didAlert;
  }
  else
  {
    if (GT.settings.alerts.onlyRoundUp == true) return didAlert;
  }

  if (callObj.dxcc == GT.myDXCC)
  {
    if (GT.settings.alerts.noMyDxcc == true) return didAlert;
  }
  else
  {
    if (GT.settings.alerts.onlyMyDxcc == true) return didAlert;
  }

  if (
    GT.settings.callsignLookups.lotwUseEnable == true &&
    GT.settings.alerts.usesLoTW == true
  )
  {
    if (!(callObj.DEcall in GT.lotwCallsigns)) return didAlert;
  }

  if (
    GT.settings.callsignLookups.eqslUseEnable == true &&
    GT.settings.alerts.useseQSL == true
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
