function sendAlerts()
{
  CR.alertTimer = null;
  const callRoster = CR.callRoster;
  let scriptPath = window.opener.GT.scriptPath;
  let dirPath = path.dirname(scriptPath);
  let scriptExists = false;
  let shouldRosterAlert = 0;
  let shouldAudioAlert = 0;
  let audioAlertCounts = { ...AUDIO_ALERT_HUNT_ZERO };
  let scriptReport = {};

  for (const entry in callRoster)
  {
    const callObj = callRoster[entry].callObj;

    // if it's not visible in the roster, we don't want to send a report with it, 
    // otherwise the entire roster will be sent out, including all the ones that were filtered by exceptions
    if (callRoster[entry].tx == false) continue;

    let call = callObj.DEcall;
    scriptReport[call] = Object.assign({}, callObj);
    scriptReport[call].dxccName = window.opener.GT.dxccToAltName[callObj.dxcc];
    scriptReport[call].distance = (callObj.distance > 0) ? parseInt(callObj.distance * MyCircle.validateRadius(window.opener.distanceUnit.value)) : 0;

    delete scriptReport[call].DEcall;
    delete scriptReport[call].style;
    delete scriptReport[call].wspr;
    delete scriptReport[call].qso;
    delete scriptReport[call].instance;

    if (callObj.rosterAlerted == false && callObj.shouldRosterAlert == true)
    {
      callObj.rosterAlerted = true;
      shouldRosterAlert++;
    }
    callObj.shouldRosterAlert = false;

    if (callObj.audioAlerted == false && callObj.shouldAudioAlert == true)
      {
        callObj.audioAlerted = true;
        for (const key in callObj.audioAlertReason)
        {
          audioAlertCounts[key] += callObj.audioAlertReason[key];
        }
        shouldAudioAlert++;
      }
    callObj.shouldAudioAlert = false;
  }

  if (shouldAudioAlert > 0)
  {
    let multi = 0;
    for (const key in audioAlertCounts)
    {
      if (audioAlertCounts[key] > 0)
      {
        multi++;
      }
    }
    audioAlertCounts.huntMulti = multi;
    window.opener.processAudioAlertsFromRoster(audioAlertCounts);
  }

  // NOTE: Ring alerts if needed
  if (shouldRosterAlert > 0)
  {
    if (window.opener.GT.settings.msg.msgPushover && window.opener.GT.settings.msg.msgPushoverRoster)
    {
      sendPushOverAlert(parseCRJson(scriptReport));
    }
    if (window.opener.GT.settings.msg.msgSimplepush && window.opener.GT.settings.msg.msgSimplepushRoster)
    {
      sendSimplePushMessage(parseCRJson(scriptReport));
    }

    try
    {
      if (fs.existsSync(scriptPath))
      {
        scriptExists = true;
        scriptIcon.innerHTML = "<div class='buttonScript' onclick='window.opener.toggleCRScript();'>"
          + (window.opener.GT.crScript == 1
          ? `<font color='lightgreen'>${I18N("sendAlerts.scriptEnabled")}</font>`
          : `<font color='yellow'>${I18N("sendAlerts.scriptDisabled")}</font>`) + "</div>";
        scriptIcon.style.display = "block";
      }
      else
      {
        scriptIcon.style.display = "none";
      }
  
      if (scriptExists && window.opener.GT.crScript == 1)
      {
        fs.writeFileSync(path.join(dirPath, "cr-alert.json"), JSON.stringify(scriptReport, null, 2), { flush: true });
        electron.ipcRenderer.send("spawnScript", scriptPath);
      }
    }
    catch (e) {
    }
  }
}

function sendSimplePushMessage(message)
{
  const url = "https://api.simplepush.io/send";
  let data = {
    key: window.opener.GT.settings.msg.msgSimplepushApiKey,
    title: "GT Alert - " + formatCallsign(window.opener.GT.settings.app.myCall),
    msg: message
  };

  window.opener.GT.getPostBuffer(
    url,
    null, // callback,
    null,
    "https",
    443,
    data,
    5000
  );
}

function sendPushOverAlert(message)
{
  const url = "https://api.pushover.net/1/messages.json";
  let data = {
    user: window.opener.GT.settings.msg.msgPushoverUserKey,
    token: window.opener.GT.settings.msg.msgPushoverToken,
    title: "GT Alert - " + formatCallsign(window.opener.GT.settings.app.myCall),
    message: message
  };

  window.opener.GT.getPostBuffer(
    url,
    null, // callback,
    null,
    "https",
    443,
    data,
    5000
  );
}

function parseCRJson(data)
{
  let message = "";
  for (let callsign in data)
  {
    if (data[callsign].shouldRosterAlert == true && data[callsign].rosterAlerted == false)
    {
      let wanted = " (" + wantedColumnParts(data[callsign]) + ")";

      if (data[callsign].grid)
      {
        if (data[callsign].state)
        {
          message = message + formatCallsign(callsign) + ", " + data[callsign].dxccName + ", " + data[callsign].RSTsent.toString() + ", " + data[callsign].grid + ", " + data[callsign].band + ", " + data[callsign].state + wanted + "\n";
        }
        else
        {
          message = message + formatCallsign(callsign) + ", " + data[callsign].dxccName + ", " + data[callsign].RSTsent.toString() + ", " + data[callsign].grid + ", " + data[callsign].band + wanted + "\n";
        }
      }
      else
      {
        if (!data[callsign].grid)
        {
          if (data[callsign].state)
          {
            message = message + formatCallsign(callsign) + ", " + data[callsign].dxccName + ", " + data[callsign].RSTsent.toString() + ", " + data[callsign].band + ", " + data[callsign].state + wanted + "\n";
          }
          else
          {
            message = message + formatCallsign(callsign) + ", " + data[callsign].dxccName + ", " + data[callsign].RSTsent.toString() + ", " + data[callsign].band + wanted + "\n";
          }
        }
      }
    }
  }
  return message;
}
