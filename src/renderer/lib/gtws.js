// GridTracker Copyright © 2024 GridTracker.org
// All rights reserved.
// See LICENSE for more information.

GT.gtEngineInterval = null;
GT.chatRecvFunctions = {
  uuid: gtChatSetUUID,
  list: gtChatNewList,
  info: gtChatUpdateCall,
  drop: gtChatRemoveCall,
  mesg: gtChatMessage,
  o: gtSpotMessage,
  ba: bandActivityReply,
  Kp: kpIndexMessage,
  denied: oamsDisable
};

GT.oamsDenied = false;

var ChatState = Object();
ChatState.none = -1;
ChatState.idle = 0;
ChatState.connect = 1;
ChatState.connecting = 2;
ChatState.connected = 3;
ChatState.waitUUID = 7;
ChatState.status = 4;
ChatState.closed = 5;
ChatState.error = 6;

GT.gtStateToFunction = {
  "-1": gtSetIdle,
  0: gtCanConnect,
  1: gtConnectChat,
  2: gtConnecting,
  3: gtChatSendUUID,
  4: gtStatusCheck,
  5: gtInError,
  6: gtClosedSocket,
  7: gtWaitUUID
};

GT.gtChatSocket = null;
GT.gtFlagPins = Object();
GT.gtMessages = Object();
GT.gtUnread = Object();
GT.gtCallsigns = Object();


GT.gtState = ChatState.none;
GT.gtStatusCount = 0;
GT.gtStatusTime = 500;
GT.gtMaxChatMessages = 100;
GT.gtNeedUsersList = true;
GT.gtUuidValid = false;

GT.gtLiveStatusUpdate = false;
GT.oamsBandActivityData = null;

var myChatId = 0;

var myRoom = 0;

GT.gtCurrentMessageCount = 0;

function gtConnectChat()
{
  if (GT.gtChatSocket != null)
  {
    // we should start over
    GT.gtState = ChatState.error;
    return;
  }

  var rnd = parseInt(Math.random() * 10) + 18360;
  try
  {
    GT.gtState = ChatState.connecting;
    GT.gtChatSocket = new WebSocket("ws://oams.space:" + rnd);
  }
  catch (e)
  {
    GT.gtState = ChatState.error;
    return;
  }

  GT.gtChatSocket.onopen = function ()
  {
    GT.gtState = ChatState.connected;
  };

  GT.gtChatSocket.onmessage = function (evt)
  {
    if (GT.settings.app.offAirServicesEnable == true)
    {
      let jsmesg = false;
      try
      {
        jsmesg = JSON.parse(evt.data);
      }
      catch (err)
      {
        // bad message, dumping client
        GT.gtState = ChatState.error;
        return;
      }
      if (!("type" in jsmesg))
      {
        GT.gtState = ChatState.error;
        return;
      }

      if (jsmesg.type in GT.chatRecvFunctions)
      {
        GT.chatRecvFunctions[jsmesg.type](jsmesg);
      }
      else
      {
        // Not fatal!
        // console.log("Unknown oams message '" + jsmesg.type + "' ignoring");
      }
    }
  };

  GT.gtChatSocket.onerror = function ()
  {
    this.close();
    GT.gtChatSocket = null;
    GT.gtState = ChatState.error;
  };

  GT.gtChatSocket.onclose = function ()
  {
    GT.gtChatSocket = null;
    GT.gtState = ChatState.closed;
  };
}

function gtConnecting() {}

function gtInError()
{
  closeGtSocket();
}

function gtChatSendClose()
{
  msg = Object();
  msg.type = "close";
  msg.uuid = GT.settings.app.chatUUID;

  sendGtJson(JSON.stringify(msg));
}

function closeGtSocket()
{
  if (GT.gtChatSocket != null)
  {
    gtChatSendClose();

    GT.gtChatSocket.close();
    GT.gtChatSocket = null;
    GT.gtState = ChatState.none;
  }
  else GT.gtState = ChatState.none;
}

function gtClosedSocket()
{
  if (GT.gtChatSocket != null)
  {
    GT.gtChatSocket.close();
    GT.gtChatSocket = null;
  }
  GT.gtState = ChatState.none;
}

// Connect 30 seconds after startup
GT.lastConnectAttempt = parseInt(Date.now() / 1000) - 30;

function gtCanConnect()
{
  GT.lastConnectAttempt = timeNowSec();
  GT.gtState = ChatState.connect;
}

function gtSetIdle()
{
  if (timeNowSec() - GT.lastConnectAttempt >= 30)
  {
    GT.gtStatusCount = 0;
    GT.gtNeedUsersList = true;
    GT.gtState = ChatState.idle;
    GT.lastGtStatus = "";
  }
  GT.gtUuidValid = false;
}

function gtStatusCheck()
{
  if (GT.gtStatusCount > 0)
  {
    GT.gtStatusCount--;
  }
  if (GT.gtStatusCount == 0 || GT.gtLiveStatusUpdate == true)
  {
    if (GT.gtLiveStatusUpdate == true)
    {
      GT.gtLiveStatusUpdate = false;
    }
    else
    {
      GT.lastGtStatus = "";
      GT.gtStatusCount = GT.gtStatusTime;
    }
    gtChatSendStatus();
  }
  if (GT.gtNeedUsersList == true)
  {
    GT.gtNeedUsersList = false;
    gtChatGetList();
  }
}

function sendGtJson(json, isUUIDrequest = false)
{
  if (GT.settings.app.offAirServicesEnable == true && GT.gtChatSocket != null)
  {
    if (GT.gtChatSocket.readyState == WebSocket.OPEN && (isUUIDrequest || GT.gtUuidValid))
    {
      GT.gtChatSocket.send(json);
    }
    else
    {
      if (GT.gtChatSocket.readyState == WebSocket.CLOSED)
      {
        GT.gtState = ChatState.closed;
      }
    }
  }
}

GT.lastGtStatus = "";

function gtChatSendStatus()
{
  var msg = Object();
  msg.type = "status";
  msg.uuid = GT.settings.app.chatUUID;

  msg.call = GT.settings.app.myCall;
  msg.grid = GT.settings.app.myRawGrid;
  msg.freq = GT.settings.app.myRawFreq;
  msg.mode = GT.settings.app.myMode;
  msg.band = GT.settings.app.myBand;
  msg.src = "GT";
  msg.canmsg = GT.settings.app.oamsMsgEnable;
  msg.o = GT.settings.app.spottingEnable == true ? 1 : 0;
  msg = JSON.stringify(msg);

  if (msg != GT.lastGtStatus)
  {
    sendGtJson(msg);
    GT.lastGtStatus = msg;
  }
}

function gtChatSendSpots(spotsObject, detailsObject)
{
  let msg = Object();
  msg.type = "o";
  msg.uuid = GT.settings.app.chatUUID;
  msg.o = spotsObject;
  msg.d = detailsObject;

  sendGtJson(JSON.stringify(msg));
}

function gtChatSendDecodes(instancesObject)
{
  let msg = Object();
  msg.type = "d";
  msg.uuid = GT.settings.app.chatUUID;
  msg.i = instancesObject;
  sendGtJson(JSON.stringify(msg));
}

function oamsBandActivityCheck()
{
  if (GT.settings.app.oamsBandActivity == true && GT.settings.app.myGrid.length >= 4)
  {
    let grid = GT.settings.app.myGrid.substring(0, 4).toUpperCase();
    if (GT.settings.app.oamsBandActivityNeighbors == true)
    {
      gtChatSendBandActivityRequest(squareToNeighbors(grid));
    }
    else
    {
      gtChatSendBandActivityRequest([grid]);
    }
  }
}

function gtChatSendBandActivityRequest(gridArray)
{
  msg = Object();
  msg.type = "ba";
  msg.uuid = GT.settings.app.chatUUID;
  msg.ga = gridArray;
  sendGtJson(JSON.stringify(msg));
}

function bandActivityReply(jsmesg)
{
  GT.oamsBandActivityData = jsmesg.r;
  renderBandActivity();
}

function kpIndexMessage(jsmesg)
{
  handleKpIndexJSON(jsmesg.i);
}

function oamsDisable(jsmesg)
{
  // Denied access from OAMS
  // Do not attempt to connect again this session
  GT.oamsDenied = true;
  closeGtSocket();
}

function gtChatRemoveCall(jsmesg)
{
  var id = jsmesg.id;
  var cid = jsmesg.cid;

  if (cid in GT.gtFlagPins)
  {
    if (id in GT.gtFlagPins[cid].ids)
    {
      delete GT.gtFlagPins[cid].ids[id];
    }
    
    if (Object.keys(GT.gtFlagPins[cid].ids).length == 0)
    {
      delete GT.gtCallsigns[GT.gtFlagPins[cid].call][cid];

      if (GT.gtFlagPins[cid].pin != null)
      {
        // remove pin from map here
        if (GT.layerSources.gtflags.hasFeature(GT.gtFlagPins[cid].pin))
        { GT.layerSources.gtflags.removeFeature(GT.gtFlagPins[cid].pin); }
        delete GT.gtFlagPins[cid].pin;
        GT.gtFlagPins[cid].pin = null;
      }
      GT.gtFlagPins[cid].live = false;
      notifyNoChat(cid);
      if (!(cid in GT.gtMessages))
      {
        if (Object.keys(GT.gtCallsigns[GT.gtFlagPins[cid].call]).length == 0)
        {
          delete GT.gtCallsigns[GT.gtFlagPins[cid].call];
        }
        delete GT.gtFlagPins[cid];
      }

      updateChatWindow(cid);
    }
  }
}

function gtChatUpdateCall(jsmesg)
{
  var id = jsmesg.id;
  var cid = jsmesg.cid;

  if (cid in GT.gtFlagPins)
  {
    GT.gtFlagPins[cid].ids[id] = true;
    // Did they move grid location?
    if (jsmesg.grid != GT.gtFlagPins[cid].grid && GT.gtFlagPins[cid].pin != null)
    {
      // remove pin from map here
      if (GT.layerSources.gtflags.hasFeature(GT.gtFlagPins[cid].pin))
      { GT.layerSources.gtflags.removeFeature(GT.gtFlagPins[cid].pin); }
      delete GT.gtFlagPins[cid].pin;
      GT.gtFlagPins[cid].pin = null;
    }
    // Changed callsign?
    if (GT.gtFlagPins[cid].call != jsmesg.call)
    {
      delete GT.gtCallsigns[GT.gtFlagPins[cid].call][cid];
    }
  }
  else
  {
    GT.gtFlagPins[cid] = Object();
    GT.gtFlagPins[cid].pin = null;
    GT.gtFlagPins[cid].ids = Object();
    GT.gtFlagPins[cid].ids[id] = true;
  }

  GT.gtFlagPins[cid].cid = jsmesg.cid;
  GT.gtFlagPins[cid].call = jsmesg.call;
  GT.gtFlagPins[cid].fCall = formatCallsign(jsmesg.call);
  GT.gtFlagPins[cid].grid = jsmesg.grid;
  GT.gtFlagPins[cid].freq = jsmesg.freq;
  GT.gtFlagPins[cid].band = jsmesg.band;
  GT.gtFlagPins[cid].mode = jsmesg.mode;
  GT.gtFlagPins[cid].src = jsmesg.src;
  GT.gtFlagPins[cid].canmsg = jsmesg.canmsg;
  GT.gtFlagPins[cid].o = jsmesg.o;
  GT.gtFlagPins[cid].dxcc = callsignToDxcc(jsmesg.call);
  GT.gtFlagPins[cid].live = true;
  // Make a pin here
  if (GT.gtFlagPins[cid].pin == null)
  {
    makeGtPin(GT.gtFlagPins[cid]);
    if (GT.gtFlagPins[cid].pin != null)
    {
      GT.layerSources.gtflags.addFeature(GT.gtFlagPins[cid].pin);
    }
  }

  if (!(GT.gtFlagPins[cid].call in GT.gtCallsigns))
  {
    // Can happen when a user changes callsign
    GT.gtCallsigns[GT.gtFlagPins[cid].call] = {};
  }
  GT.gtCallsigns[GT.gtFlagPins[cid].call][cid] = true;

  updateChatWindow(cid);
}

function gtChatGetList()
{
  msg = Object();
  msg.type = "list";
  msg.uuid = GT.settings.app.chatUUID;

  sendGtJson(JSON.stringify(msg));
}

function redrawPins()
{
  clearGtFlags();
  for (cid in GT.gtFlagPins)
  {
    if (GT.gtFlagPins[cid].pin != null)
    {
      delete GT.gtFlagPins[cid].pin;
      GT.gtFlagPins[cid].pin = null;
    }

    makeGtPin(GT.gtFlagPins[cid]);

    if (GT.gtFlagPins[cid].pin != null)
    {
      GT.layerSources.gtflags.addFeature(GT.gtFlagPins[cid].pin);
    }
  }
}

function makeGtPin(obj)
{
  try
  {
    if (obj.pin)
    {
      if (GT.layerSources.gtflags.hasFeature(obj.pin))
      {
        GT.layerSources.gtflags.removeFeature(obj.pin);
      }
      delete obj.pin;
      obj.pin = null;
    }
    
    if (obj.src != "GT") return;
    
    if (typeof obj.grid == "undefined" || obj.grid == null) return;

    if (obj.grid.length != 4 && obj.grid.length != 6) return;

    if (validateGridFromString(obj.grid) == false) return;

    if (!validateMapBandAndMode(obj.band, obj.mode))
    {
      return;
    }

    var LL = squareToCenter(obj.grid);
    obj.pin = iconFeature(ol.proj.fromLonLat([LL.o, LL.a]), GT.gtFlagIcon, 100, "gtFlag");
    obj.pin.key = obj.cid;
    obj.pin.isGtFlag = true;
    obj.pin.size = 1;
  }
  catch (e) {}
}

function gtChatNewList(jsmesg)
{
  clearGtFlags();

  // starting clean if we're getting a new chat list
  GT.gtFlagPins = Object()
  GT.gtMessages = Object();
  GT.gtUnread = Object();
  GT.gtCallsigns = Object();


  for (var key in jsmesg.data.calls)
  {
    var cid = jsmesg.data.cid[key];
    var id = jsmesg.data.id[key];
    if (id != myChatId)
    {
      if (cid in GT.gtFlagPins)
      {
        GT.gtFlagPins[cid].ids[id] = true;
      }
      else
      {
        GT.gtFlagPins[cid] = Object();
        GT.gtFlagPins[cid].ids = Object();
        GT.gtFlagPins[cid].ids[id] = true;
        GT.gtFlagPins[cid].pin = null;
      }

      GT.gtFlagPins[cid].call = jsmesg.data.calls[key];
      GT.gtFlagPins[cid].fCall = formatCallsign(GT.gtFlagPins[cid].call);
      GT.gtFlagPins[cid].grid = jsmesg.data.grid[key];
      GT.gtFlagPins[cid].freq = jsmesg.data.freq[key];
      GT.gtFlagPins[cid].band = jsmesg.data.band[key];
      GT.gtFlagPins[cid].mode = jsmesg.data.mode[key];
      GT.gtFlagPins[cid].src = jsmesg.data.src[key];
      GT.gtFlagPins[cid].cid = cid;
      GT.gtFlagPins[cid].canmsg = jsmesg.data.canmsg[key];
      GT.gtFlagPins[cid].o = jsmesg.data.o[key];
      GT.gtFlagPins[cid].dxcc = callsignToDxcc(GT.gtFlagPins[cid].call);
      GT.gtFlagPins[cid].live = true;

      if (!(GT.gtFlagPins[cid].call in GT.gtCallsigns))
      {
        GT.gtCallsigns[GT.gtFlagPins[cid].call] = Object();
      }

      GT.gtCallsigns[GT.gtFlagPins[cid].call][cid] = true;

      makeGtPin(GT.gtFlagPins[cid]);

      if (GT.gtFlagPins[cid].pin != null)
      {
        GT.layerSources.gtflags.addFeature(GT.gtFlagPins[cid].pin);
      }
    }
  }

  updateChatWindow();

  oamsBandActivityCheck();
}

function appendToHistory(cid, jsmesg)
{
  if (!(cid in GT.gtMessages))
  {
    GT.gtMessages[cid] = Object();
    GT.gtMessages[cid].history = Array();
  }

  GT.gtMessages[cid].history.push(jsmesg);
  while (GT.gtMessages[cid].history.length > GT.gtMaxChatMessages)
  {
    GT.gtMessages[cid].history.shift();
  }
}

function htmlEntities(str)
{
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sendSimplePushMessage(jsmesg)
{
  const url = "https://api.simplepush.io/send";
  let data = {
    key: GT.settings.msg.msgSimplepushApiKey,
    title: "GT Chat - " + formatCallsign(GT.settings.app.myCall),
    msg: formatCallsign(jsmesg.call) + ": " + jsmesg.msg
  };
  getPostBuffer(
    url,
    null, // callback,
    null,
    "https",
    443,
    data,
    5000
  );
}

function sendPushOverMessage(jsmesg, test = false)
{
  const url = "https://api.pushover.net/1/messages.json";
  let data = {
    user: GT.settings.msg.msgPushoverUserKey,
    token: GT.settings.msg.msgPushoverToken,
    title:
        "GT Chat - " + formatCallsign(GT.settings.app.myCall),
    message: formatCallsign(jsmesg.call) + ": " + jsmesg.msg
  };
  getPostBuffer(
    url,
    PushoverReply, // callback,
    test,
    "https",
    443,
    data,
    5000 // timeoutMs,
  );
}

function PushoverReply(data, isTest)
{
  if (isTest)
  {
    var result = "Unknown Error";
    var color = "#F00";
    var responseJson = JSON.parse(data);

    if (typeof responseJson != "undefined" && typeof responseJson.status != "undefined")
    {
      if (responseJson.status == 1)
      {
        // {"status":1,"request":"1d5ace84-c2e4-4b19-a051-5ac4c9671170"}
        color = "#FFF";
        result = "Passed!";
      }
      else if (responseJson.status == 0)
      {
        color = "#FF0";
        if (typeof responseJson.user != "undefined")
        {
          // {"user":"invalid","errors":["user identifier is not a valid user, group, or subscribed user key, see https://pushover.net/api#identifiers"],"status":0,"request":"3ef45ac6-38d6-47db-b7aa-7731e8ac0fcb"}
          result = "User Key Invalid";
        }
        else if (typeof responseJson.token != "undefined")
        {
          //  {"token":"invalid","errors":["application token is invalid, see https://pushover.net/api"],"status":0,"request":"10629fe4-1e37-4c0f-a123-4585a3fb2aea"}
          result = "API Token Invalid";
        }
        else
        {
          result = "Unknown Response";
        }
      }
      else
      {
        result = "Unknown Status";
      }
    }

    pushOverTestResultsDiv.innerHTML = result;
    pushOverTestResultsDiv.style.color = color;
  }
}

function gtChatMessage(jsmesg)
{
  if (GT.settings.app.oamsMsgEnable == true)
  {
    var cid = jsmesg.cid;
    jsmesg.when = Date.now();
    try
    {
      jsmesg.msg = new Buffer.from(jsmesg.msg, "base64").toString("utf8"); // eslint-disable-line new-cap
      jsmesg.msg = htmlEntities(jsmesg.msg);
    }
    catch (e)
    {
      jsmesg.msg = "Corrupt message received";
    }

    if (jsmesg.call != null && jsmesg.call != "" && jsmesg.call != "NOCALL")
    {
      appendToHistory(cid, jsmesg);
      GT.gtUnread[cid] = true;
      GT.gtCurrentMessageCount++;

      if (newChatMessage(cid, jsmesg) == false)
      {
        // Only notify if you're not in active chat with them.
        if (GT.settings.msg.msgSimplepush && GT.settings.msg.msgSimplepushChat && GT.settings.msg.msgSimplepushApiKey != null)
        {
          sendSimplePushMessage(jsmesg);
        }
        if (GT.settings.msg.msgPushover && GT.settings.msg.msgPushoverChat && GT.settings.msg.msgPushoverUserKey != null &&
            GT.settings.msg.msgPushoverToken != null)
        {
          sendPushOverMessage(jsmesg);
        }
      }
    }
  }
}

function gtSendMessage(message, who)
{
  msg = Object();
  msg.type = "mesg";
  msg.uuid = GT.settings.app.chatUUID;
  msg.cid = who;
  msg.msg = new Buffer.from(message).toString("base64"); // eslint-disable-line new-cap
  sendGtJson(JSON.stringify(msg));
  msg.msg = htmlEntities(message);
  msg.id = 0;
  msg.when = Date.now();
  appendToHistory(who, msg);
}

function gtChatSendUUID()
{
  var msg = Object();
  msg.type = "uuid";
  if (GT.settings.app.chatUUID != "")
  {
    msg.uuid = GT.settings.app.chatUUID;
  }
  else
  {
    msg.uuid = null;
  }

  msg.call = GT.settings.app.myCall;
  msg.ver = "v" + gtVersionStr;

  sendGtJson(JSON.stringify(msg), true);
  GT.gtState = ChatState.waitUUID;
}

function gtWaitUUID()
{
  // console.log("waiting for UUID from OAMS");
}

function gtChatSetUUID(jsmesg)
{
  GT.settings.app.chatUUID = jsmesg.uuid;
  myChatId = jsmesg.id;

  GT.gtUuidValid = true;
  gtChatSendStatus();
  GT.gtLiveStatusUpdate = false;
  GT.gtStatusCount = GT.gtStatusTime;
  GT.gtState = ChatState.status;
}

GT.getEngineWasRunning = false;

function gtChatStateMachine()
{
  if (GT.settings.app.offAirServicesEnable == true && GT.settings.map.offlineMode == false && GT.settings.app.myCall.length > 2 && GT.settings.app.myCall != "NOCALL" && GT.oamsDenied == false)
  {
    var now = timeNowSec();
    GT.gtStateToFunction[GT.gtState]();

    if (Object.keys(GT.gtUnread).length > 0 && now % 2 == 0)
    {
      msgImg.style.webkitFilter = "invert(1)";
    }
    else msgImg.style.webkitFilter = "";

    GT.getEngineWasRunning = true;
  }
  else
  {
    if (GT.getEngineWasRunning == true)
    {
      GT.getEngineWasRunning = false;
      closeGtSocket();
      GT.lastGtStatus = "";
    }
  }
}

function gtSpotMessage(jsmesg)
{
  if (jsmesg.cid in GT.gtFlagPins)
  {
    let frequency, band, mode;
    if (jsmesg.ex != null)
    {
      frequency = Number(jsmesg.ex[0]);
      band = formatBand(Number(frequency / 1000000));
      mode = String(jsmesg.ex[1]).toUpperCase();
    }
    else
    {
      frequency = GT.gtFlagPins[jsmesg.cid].freq;
      band = GT.gtFlagPins[jsmesg.cid].band;
      mode = GT.gtFlagPins[jsmesg.cid].mode;
    }

    if (isNaN(frequency)) return;

    addNewOAMSSpot(jsmesg.cid, jsmesg.db, frequency, band, mode);
  }
}

function gtChatSystemInit()
{
  GT.gtEngineInterval = nodeTimers.setInterval(gtChatStateMachine, 1000);
}

function showGtFlags()
{
  if (GT.settings.app.gtFlagImgSrc > 0)
  {
    if (GT.settings.map.offlineMode == false)
    {
      redrawPins();
      GT.layerVectors.gtflags.setVisible(true);
    }
    else
    {
      GT.layerVectors.gtflags.setVisible(false);
    }
  }
  else GT.layerVectors.gtflags.setVisible(false);
}

function clearGtFlags()
{
  GT.layerSources.gtflags.clear();
}

function toggleGtMap()
{
  GT.settings.app.gtFlagImgSrc += 1;
  GT.settings.app.gtFlagImgSrc %= 2;
  gtFlagImg.src = GT.gtFlagImageArray[GT.settings.app.gtFlagImgSrc];
  if (GT.spotView > 0 && GT.settings.reception.mergeSpots == false) return;
  if (GT.settings.app.gtFlagImgSrc > 0)
  {
    redrawPins();
    GT.layerVectors.gtflags.setVisible(true);
  }
  else
  {
    GT.layerVectors.gtflags.setVisible(false);
  }
}

function notifyNoChat(id)
{
  if (GT.chatWindowInitialized)
  {
    try
    {
      GT.chatWindowHandle.window.notifyNoChat(id);
    }
    catch (e) {}
  }
}

function updateChatWindow(id = null)
{
  if (GT.chatWindowInitialized)
  {
    try
    {
      if (id)
      {
        GT.chatWindowHandle.window.updateCallsign(id);
      }
      else
      {
        GT.chatWindowHandle.window.updateEverything();
      }
    }
    catch (e) {}
  }
}

function newChatMessage(id, jsmesg)
{
  var hasFocus = false;

  if (GT.chatWindowInitialized)
  {
    try
    {
      hasFocus = GT.chatWindowHandle.window.newChatMessage(id, jsmesg);
      GT.chatWindowHandle.window.messagesRedraw();
    }
    catch (e) {}
  }
  return hasFocus;
}

function oamsCanMsg()
{
  return (GT.settings.map.offlineMode == false && GT.settings.app.offAirServicesEnable == true && GT.settings.app.oamsMsgEnable == true);
}