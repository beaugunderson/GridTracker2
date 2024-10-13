function sendAlerts(callRoster, rosterSettings)
{
  let dirPath = window.opener.GT.scriptDir;
  let scriptExists = false;
  let script = "cr-alert.sh";

  let shouldAlert = 0;

  for (const entry in callRoster)
  {
    let callObj = callRoster[entry].callObj;

    // if it's not visible in the roster, we don't want to send a report with it, 
    // otherwise the entire roster will be sent out, including all the ones that were filtered by exceptions
    if (callRoster[entry].tx == false) continue;

    let call = callObj.DEcall;
    CR.scriptReport[call] = Object.assign({}, callObj);
    CR.scriptReport[call].dxccName = window.opener.GT.dxccToAltName[callObj.dxcc];
    CR.scriptReport[call].distance = (callObj.distance > 0) ? parseInt(callObj.distance * MyCircle.validateRadius(window.opener.distanceUnit.value)) : 0;

    delete CR.scriptReport[call].DEcall;
    delete CR.scriptReport[call].style;
    delete CR.scriptReport[call].wspr;
    delete CR.scriptReport[call].qso;
    delete CR.scriptReport[call].instance;

    if (callObj.alerted == false && callObj.shouldAlert == true)
    {
      callObj.alerted = true;
      shouldAlert++;
    }

    callObj.shouldAlert = false;
  }

  // NOTE: Ring alerts if needed
  try
  {
    if (fs.existsSync(dirPath))
    {
      if (window.opener.GT.platform == "windows")
      {
        script = "cr-alert.bat";
      }
      if (fs.existsSync(path.join(dirPath, script)))
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
    }
  }
  catch (e) {}

  if (shouldAlert > 0)
  {
    if (scriptExists && window.opener.GT.crScript == 1)
    {
      try
      {
        fs.writeFileSync(path.join(dirPath, "cr-alert.json"), JSON.stringify(CR.scriptReport, null, 2), { flush: true });

        let thisProc = path.join(dirPath, script);
        let cp = require("child_process");
        let child = cp.spawn(thisProc, [], {
          detached: true,
          cwd: dirPath,
          stdio: ["ignore", "ignore", "ignore"]
        });
        child.unref();
      }
      catch (e)
      {
        conosle.log(e);
      }
    }
    if (window.opener.GT.settings.msg.msgPushover && window.opener.GT.settings.msg.msgPushoverRoster)
    {
      sendPushOverAlert(parseCRJson(CR.scriptReport));
    }
    if (window.opener.GT.settings.msg.msgSimplepush && window.opener.GT.settings.msg.msgSimplepushRoster)
    {
      sendSimplePushMessage(parseCRJson(CR.scriptReport));
    }
    CR.scriptReport = Object();
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
    if (data[callsign].shouldAlert === true && data[callsign].alerted === false)
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
