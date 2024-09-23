// GridTracker Copyright © 2024 GridTracker.org
// All rights reserved.
// See LICENSE for more information.

GT.selectStartupLink = null;

function dragOverHandler(ev)
{
  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
}

function dropHandler(ev)
{
  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
  if (ev.dataTransfer.items)
  {
    // Use DataTransferItemList interface to access the file(s)
    for (var i = 0; i < ev.dataTransfer.items.length; i++)
    {
      // If dropped items aren't files, reject them
      Entry = ev.dataTransfer.items[i].webkitGetAsEntry();
      if (Entry && "isFile" in Entry && Entry.isFile == true)
      {
        var filename = ev.dataTransfer.items[i].getAsFile().path;
        var test = filename.toLowerCase();
        var valid = test.endsWith(".adi")
          ? true
          : test.endsWith(".adif")
            ? true
            : test.endsWith(".log")
              ? true
              : !!test.endsWith(".txt");
        if (valid && fs.existsSync(filename))
        {
          addLogToStartupList(ev.dataTransfer.items[i].getAsFile());
        }
      }
    }
  }
}

function dateToISO8601(dString, tZone)
{
  var retDate = "";
  var tZone = (typeof tZone !== "undefined") ? tZone : "Z";
  var dateParts = dString.match(/(\d{4}-\d{2}-\d{2})(\s+(\d{2}:\d{2}:\d{2}))?/);

  if (dateParts !== null)
  {
    retDate = dateParts[1]
    if ((typeof dateParts[3]) !== "undefined")
    {
      retDate += "T" + dateParts[3] + ".000" + tZone;
    }
    else
    {
      retDate += "T00:00:00.000" + tZone;
    }
  }

  return retDate;
}

GT.confSrcNames = {
  C: "Clublog",
  e: "eQSL",
  L: "LoTW",
  Q: "QRZ.com",
  O: "Other"
};

GT.adifLogCount = 0;

GT.adifWorkerCallbacks = {
  loaded: initAdifComplete,
  parsed: adifParseComplete,
  parsedLive: adifParseLiveComplete,
  cleared: clearComplete
};

GT.adifWorker = new Worker("./lib/adifWorker.js");

GT.adifWorker.onmessage = function(event)
{
  if ("type" in event.data)
  {
    if (event.data.type in GT.adifWorkerCallbacks)
    {
      GT.adifWorkerCallbacks[event.data.type](event.data);
    }
    else console.log("adifWorkerCallback: unknown event type : " + event.data.type);
  }
  else console.log("adifWorkerCallback: no event type");
};

function initAdifWorker()
{
  var task = {};
  task.type = "init";
  task.dxccInfo = GT.dxccInfo;
  task.dxccToCountryCode = GT.dxccToCountryCode;
  task.directCallToDXCC = GT.directCallToDXCC;
  task.directCallToITUzone = GT.directCallToITUzone;
  task.directCallToCQzone = GT.directCallToCQzone;
  task.prefixToITUzone = GT.prefixToITUzone;
  task.prefixToCQzone = GT.prefixToCQzone;
  task.prefixToMap = GT.prefixToMap;
  task.gridToState = GT.gridToState;
  task.cqZones = GT.cqZones;
  task.ituZones = GT.ituZones;
  task.wacZones = GT.wacZones;
  task.modes = GT.modes;
  task.modes_phone = GT.modes_phone;
  task.QSOhash = GT.QSOhash;
  GT.adifWorker.postMessage(task);
}

function initAdifComplete()
{
  console.log("Adif Worker Initialized");
}

function clearAdifWorkerQSO(clearFiles, nextFunc = null)
{
  var task = {};
  task.type = "clear";
  task.clearFiles = clearFiles;
  task.nextFunc = nextFunc;
  GT.adifWorker.postMessage(task);
}

function clearComplete(task)
{
  clearQSOcallback(task.clearFiles, task.nextFunc);
}

function onAdiLoadComplete(rawAdiBuffer, nextFunc = null, liveLog = false)
{
  clearOrLoadButton.style.display = "none";
  busyDiv.style.display = "block";

  var task = {};
  task.type = "parse";
  task.appSettings = GT.appSettings;
  task.lotw_qso = GT.adifLogSettings.lastFetch.lotw_qso;
  task.lotw_qsl = GT.adifLogSettings.lastFetch.lotw_qsl;
  task.liveLog = liveLog;

  task.nextFunc = nextFunc;

  if (typeof rawAdiBuffer == "object")
  {
    console.log("ADIF buffer is an object!");
    return;
  }
  else task.rawAdiBuffer = rawAdiBuffer;

  GT.adifLogCount++;
  GT.adifWorker.postMessage(task);

  rawAdiBuffer = null;

  GT.fileSelector.setAttribute("type", "");
  GT.fileSelector.setAttribute("type", "file");
  GT.fileSelector.setAttribute("accept", "*");
  GT.fileSelector.value = null;
}

function adifParseLiveComplete(task)
{
  GT.adifLogCount--;
  GT.QSOhash[task.details.hash] = task.details;

  var currentYear = new Date().getFullYear();
  trackQSO(GT.QSOhash[task.details.hash], currentYear);
  applyQSOs(null);
}

function adifParseComplete(task)
{
  GT.adifLogCount--;
  GT.QSOhash = task.QSOhash;

  GT.myQsoCalls = { ...GT.myQsoCalls, ...task.myQsoCalls };
  GT.myQsoGrids = { ...GT.myQsoGrids, ...task.myQsoGrids };

  if (task.lotwTimestampUpdated == true)
  {
    GT.adifLogSettings.lastFetch.lotw_qso = parseInt(Math.max(task.lotw_qso, GT.adifLogSettings.lastFetch.lotw_qso));
    GT.adifLogSettings.lastFetch.lotw_qsl = parseInt(Math.max(task.lotw_qsl, GT.adifLogSettings.lastFetch.lotw_qsl));
    saveLogSettings();
  }

  stateCheck();
  refreshQSOs();

  qsoGridsFound.innerHTML = "Found: " + Object.keys(GT.myQsoGrids).join(",");
  qsoCallsignsFound.innerHTML = "Found: " + Object.keys(GT.myQsoCalls).join(",");

  if (task.nextFunc != null)
  {
    if (typeof window[task.nextFunc] == "function")
    {
      window[task.nextFunc]();
    }
    else
    {
      console.log("adifParseComplete: nextFunc not a function: " + task.nextFunc);
    }
  }
}

function clubLogCallback(buffer, flag, cookie)
{
  var rawAdiBuffer = String(buffer);
  if (rawAdiBuffer.indexOf("Invalid login") > -1)
  {
    if (flag) clubTestResult.innerHTML = "Invalid";
  }
  else if (buffer == null)
  {
    if (flag) clubTestResult.innerHTML = "Unknown Error";
  }
  else
  {
    if (flag) clubTestResult.innerHTML = "Passed";
    else
    {
      tryToWriteAdifToDocFolder("clublog.adif", rawAdiBuffer);

      onAdiLoadComplete(rawAdiBuffer);
    }
  }
}

GT.isGettingClub = false;
function grabClubLog(test)
{
  if (fs.existsSync(GT.clublogLogFile) && getFilesizeInBytes(GT.clublogLogFile) > 0)
  {
    fs.readFile(GT.clublogLogFile, "utf-8", handleAdifLoad);
  }

  if (GT.isGettingClub == false)
  {
    if (test) clubTestResult.innerHTML = "Testing";

    var postData = {
      email: clubEmail.value,
      password: clubPassword.value,
      call: clubCall.value
    };
    getAPostBuffer(
      "https://clublog.org/getadif.php",
      clubLogCallback,
      test,
      "https",
      443,
      postData,
      ClubLogImg,
      "GT.isGettingClub"
    );
  }
}

function tryToWriteAdifToDocFolder(filename, buffer, append = false)
{
  var finalFile = GT.appData + GT.dirSeperator + filename;
  try
  {
    if (append == false)
    {
      fs.writeFileSync(finalFile, buffer);
      return buffer;
    }
    else
    {
      fs.appendFileSync(finalFile, buffer);
      return buffer;
    }
  }
  catch (e)
  {
    return false;
  }
}

function addZero(i)
{
  if (i < 10)
  {
    i = "0" + i;
  }
  return i;
}

function getUTCStringForLoTW(d)
{
  var Y = d.getUTCFullYear();
  var M = addZero(d.getUTCMonth() + 1);
  var D = addZero(d.getUTCDate());
  var h = addZero(d.getUTCHours());
  var m = addZero(d.getUTCMinutes());
  var s = addZero(d.getUTCSeconds());
  return Y + "-" + M + "-" + D + " " + h + ":" + m + ":" + s;
}

function lotwCallback(buffer, flag, cookies, url)
{
  var rawAdiBuffer = String(buffer);
  if (rawAdiBuffer.indexOf("password incorrect") > -1)
  {
    if (flag)
    {
      lotwTestResult.innerHTML = "Invalid";
    }
  }
  else
  {
    if (flag)
    {
      lotwTestResult.innerHTML = "Passed";
    }
    else
    {
      var shouldAppend = true;
      var adiFileName = "LogbookOfTheWorld.adif";
      var eorRegEx = new RegExp("<EOR>", "i");
      var nextFunc = null;

      if (url.indexOf("qso_qsl=no") != -1)
      {
        nextFunc = "grabLoTWQSL";
      }
      // don't write just an empty <EOH> only result
      if (rawAdiBuffer.search(eorRegEx) > 0)
      {
        rawAdiBuffer = tryToWriteAdifToDocFolder(adiFileName, rawAdiBuffer, shouldAppend);
      }

      onAdiLoadComplete(rawAdiBuffer, nextFunc);
    }
  }
}

function tryToDeleteLog(filename)
{
  var finalFile = GT.appData + GT.dirSeperator + filename;
  try
  {
    if (fs.existsSync(finalFile))
    {
      fs.unlinkSync(finalFile);
    }
  }
  catch (e) {}
}

GT.lotwCount = 0;

GT.isGettingLOTW = false;
GT.lotwTest = false;

function grabLOtWLog(test)
{
  var lastQSLDateString = "";

  if (test == true && GT.isGettingLOTW == false)
  {
    lotwTestResult.innerHTML = "Testing";
    lastQSLDateString = "&qso_qsosince=2100-01-01";

    // Fetch Test Results
    getABuffer(
      "https://lotw.arrl.org/lotwuser/lotwreport.adi?login=" +
      lotwLogin.value +
      "&password=" +
      encodeURIComponent(lotwPassword.value) +
      "&qso_query=1&qso_qsl=no&qso_qsldetail=yes&qso_withown=yes" +
      lastQSLDateString,
      lotwCallback,
      test,
      "https",
      443,
      lotwLogImg,
      "GT.isGettingLOTW",
      150000
    );
  }

  if (test == false)
  {
    loadLoTWLogFile();
  }
}

function grabLoTWQSO()
{
  var qsoDate = new Date(GT.adifLogSettings.lastFetch.lotw_qso);
  var qsoDateAsString = getUTCStringForLoTW(qsoDate);

  if (GT.isGettingLOTW == false)
  {
    // Fetch QSOs
    lastQSLDateString = "&qso_qsorxsince=" + qsoDateAsString;
    getABuffer(
      "https://lotw.arrl.org/lotwuser/lotwreport.adi?login=" +
      lotwLogin.value +
      "&password=" +
      encodeURIComponent(lotwPassword.value) +
      ((GT.appSettings.workingGridEnable == true) ? "&qso_mydetail=yes" : "") +
      "&qso_query=1&qso_qsl=no&qso_qsldetail=yes&qso_withown=yes" +
      lastQSLDateString,
      lotwCallback,
      false,
      "https",
      443,
      lotwLogImg,
      "GT.isGettingLOTW",
      120000
    );
  }
}

function grabLoTWQSL()
{
  var qsoDate = new Date(GT.adifLogSettings.lastFetch.lotw_qsl);
  var qsoDateAsString = getUTCStringForLoTW(qsoDate);

  // Don't grab if the last QSL was less than 5 minutes ago
  if (GT.isGettingLOTW == false)
  {
    lastQSLDateString = "&qso_qslsince=" + qsoDateAsString;
    getABuffer(
      "https://lotw.arrl.org/lotwuser/lotwreport.adi?login=" +
      lotwLogin.value +
      "&password=" +
      encodeURIComponent(lotwPassword.value) +
      ((GT.appSettings.workingGridEnable == true) ? "&qso_mydetail=yes" : "") +
      "&qso_query=1&qso_qsl=yes&qso_qsldetail=yes&qso_withown=yes" +
      lastQSLDateString,
      lotwCallback,
      false,
      "https",
      443,
      lotwLogImg,
      "GT.isGettingLOTW",
      120000
    );
  }
}

function qrzCallback(buffer, flag)
{
  if (buffer.indexOf("invalid api key") > -1)
  {
    if (flag) qrzTestResult.innerHTML = "Invalid";
  }
  else
  {
    if (flag)
    {
      qrzTestResult.innerHTML = "Passed";
    }
    else
    {
      var htmlString = String(buffer).replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    
      tryToWriteAdifToDocFolder("qrz.adif", htmlString);

      onAdiLoadComplete(htmlString);
    }
  }
}

GT.isGettingQRZCom = false;
function grabQrzComLog(test)
{
  if (fs.existsSync(GT.QrzLogFile) && getFilesizeInBytes(GT.QrzLogFile) > 0)
  {
    fs.readFile(GT.QrzLogFile, "utf-8", handleAdifLoad);
  }

  if (GT.isGettingQRZCom == false)
  {
    var action = "FETCH";
    if (test)
    {
      qrzTestResult.innerHTML = "Testing";
      action = "STATUS";
    }

    getABuffer(
      "https://logbook.qrz.com/api?KEY=" +
        qrzApiKey.value +
        "&ACTION=" +
        action,
      qrzCallback,
      test,
      "https",
      443,
      qrzLogImg,
      "GT.isGettingQRZCom",
      null
    );
  }
}

function ValidateQrzApi(inputText)
{
  inputText.value = inputText.value.toUpperCase().trim();
  if (inputText.value.length == 19)
  {
    var passed = false;
    var dashcount = 0;
    for (var i = 0; i < inputText.value.length; i++)
    {
      if (inputText.value[i] == "-") dashcount++;
    }
    if (dashcount == 3)
    {
      passed = true;
    }
    if (passed)
    {
      inputText.style.color = "#FF0";
      inputText.style.backgroundColor = "green";

      return true;
    }
    else
    {
      inputText.style.color = "white";
      inputText.style.backgroundColor = "red";
      return false;
    }
  }
  else
  {
    inputText.style.color = "white";
    inputText.style.backgroundColor = "red";

    return false;
  }
}

function ValidateText(inputText)
{
  if (inputText.value.length > 0)
  {
    inputText.style.color = "#FF0";
    inputText.style.backgroundColor = "green";
    return true;
  }
  else
  {
    inputText.style.color = "white";
    inputText.style.backgroundColor = "red";
    return false;
  }
}

function adifMenuCheckBoxChanged(what)
{
  GT.adifLogSettings.menu[what.id] = what.checked;
  var menuItem = what.id + "Div";
  if (what.checked == true)
  {
    document.getElementById(menuItem).style.display = "inline-block";
  }
  else
  {
    document.getElementById(menuItem).style.display = "none";
  }

  GT.localStorage.adifLogSettings = JSON.stringify(GT.adifLogSettings);

  if (what == buttonAdifCheckBox) setAdifStartup(loadAdifCheckBox);
}

function adifStartupCheckBoxChanged(what)
{
  GT.adifLogSettings.startup[what.id] = what.checked;
  GT.localStorage.adifLogSettings = JSON.stringify(GT.adifLogSettings);

  if (what == loadAdifCheckBox) setAdifStartup(loadAdifCheckBox);
}

function adifLogQsoCheckBoxChanged(what)
{
  GT.adifLogSettings.qsolog[what.id] = what.checked;
  if (what.id == "logLOTWqsoCheckBox")
  {
    if (what.checked == true)
    {
      lotwUpload.style.display = "inline-block";
      trustedTestButton.style.display = "inline-block";
    }
    else
    {
      lotwUpload.style.display = "none";
      trustedTestButton.style.display = "none";
    }
  }
  GT.localStorage.adifLogSettings = JSON.stringify(GT.adifLogSettings);
}

function adifNicknameCheckBoxChanged(what)
{
  GT.adifLogSettings.nickname[what.id] = what.checked;
  if (what.id == "nicknameeQSLCheckBox")
  {
    if (what.checked == true)
    {
      eQSLNickname.style.display = "inline-block";
    }
    else
    {
      eQSLNickname.style.display = "none";
    }
  }
  GT.localStorage.adifLogSettings = JSON.stringify(GT.adifLogSettings);
}

function adifTextValueChange(what)
{
  what.value = what.value.trim();
  GT.adifLogSettings.text[what.id] = what.value;
  GT.localStorage.adifLogSettings = JSON.stringify(GT.adifLogSettings);
}

GT.fileSelector = document.createElement("input");
GT.fileSelector.setAttribute("type", "file");
GT.fileSelector.setAttribute("accept", "*");
GT.fileSelector.onchange = function ()
{
  if (this.files && this.files[0])
  {
    addLogToStartupList(this.files[0], GT.fileSelector);
  }
};

function addLogToStartupList(fileObject, selector = null)
{
  loadAdifCheckBox.checked = true;
  adifStartupCheckBoxChanged(loadAdifCheckBox);

  fs.readFile(fileObject.path, "utf-8", handleAdifLoad);
  
  for (var i in GT.startupLogs)
  {
    if (fileObject.path == GT.startupLogs[i].file)
    {
      addLastTraffic("<font color='white'>Dupe</font> <font color='orange'>" + fileObject.name + "</font>");
      return;
    }
  }

  var newObject = Object();
  newObject.name = fileObject.name;
  newObject.file = fileObject.path;
  GT.startupLogs.push(newObject);
  GT.localStorage.startupLogs = JSON.stringify(GT.startupLogs);

  setAdifStartup(loadAdifCheckBox);

  addLastTraffic("<font color='white'>Added</font> <font color='cyan'>" + fileObject.name + "</font>");
}

function adifLoadDialog()
{
  GT.fileSelector.click();
  return false;
}

GT.startupFileSelector = document.createElement("input");
GT.startupFileSelector.setAttribute("type", "file");
GT.startupFileSelector.setAttribute("accept", "*");
GT.startupFileSelector.onchange = function ()
{
  if (this.files && this.files[0])
  {
    addLogToStartupList(this.files[0], GT.startupFileSelector);
  }
};

function start_and_end(str)
{
  if (str.length > 31)
  {
    return (
      str.substr(0, 16) + " ... " + str.substr(str.length - 15, str.length)
    );
  }
  return str;
}

function setFileSelectors()
{
  GT.selectStartupLink = document.getElementById("selectAdifButton");
  GT.selectStartupLink.onclick = function ()
  {
    GT.startupFileSelector.click();
    return false;
  };

  selectTqsl = document.getElementById("selectTQSLButton");
  selectTqsl.onclick = function ()
  {
    GT.tqslFileSelector.click();
    return false;
  };
  lotwUpload.prepend(selectTqsl);
}

GT.tqslFileSelector = document.createElement("input");
GT.tqslFileSelector.setAttribute("type", "file");
GT.tqslFileSelector.setAttribute("accept", "*");
GT.tqslFileSelector.onchange = function ()
{
  if (this.files && this.files[0])
  {
    GT.trustedQslSettings.binaryFile = this.files[0].path;
    if (
      fs.existsSync(GT.trustedQslSettings.binaryFile) &&
      (GT.trustedQslSettings.binaryFile.endsWith("tqsl.exe") ||
        GT.trustedQslSettings.binaryFile.endsWith("tqsl"))
    )
    {
      GT.trustedQslSettings.binaryFileValid = true;
    }
    else GT.trustedQslSettings.binaryFileValid = false;

    if (GT.trustedQslSettings.binaryFileValid == true)
    {
      tqslFileDiv.style.backgroundColor = "blue";
    }
    else
    {
      tqslFileDiv.style.backgroundColor = "red";
    }

    tqslFileDiv.innerHTML = "<b>" + start_and_end(this.files[0].path) + "</b>";
    GT.localStorage.trustedQslSettings = JSON.stringify(GT.trustedQslSettings);
  }
};

function loadGtQSOLogFile()
{
  if (fs.existsSync(GT.qsoLogFile))
  {
    fs.readFile(GT.qsoLogFile, "utf-8", handleAdifLoad);
  }
}

function getFilesizeInBytes(filename)
{
  var stats = fs.statSync(filename);
  var fileSizeInBytes = stats.size;
  return fileSizeInBytes;
}

function loadLoTWLogFile()
{
  if (fs.existsSync(GT.LoTWLogFile) && getFilesizeInBytes(GT.LoTWLogFile) > 0)
  {
    fs.readFile(GT.LoTWLogFile, "utf-8", handleAdifLoadLocalLoTW);
  }
  else
  {
    if (GT.appSettings.workingDateEnable == true && GT.appSettings.workingDate > 0)
    {
      GT.adifLogSettings.lastFetch.lotw_qso = GT.appSettings.workingDate * 1000;
      GT.adifLogSettings.lastFetch.lotw_qsl = GT.appSettings.workingDate * 1000;
    }
    else
    {
      // We have no history, so our dates are not valid any more
      GT.adifLogSettings.lastFetch.lotw_qso = 0;
      GT.adifLogSettings.lastFetch.lotw_qsl = 0;
    }
    grabLoTWQSO();
  }
}

function loadWsjtLogFile()
{
  if (fs.existsSync(GT.wsjtxLogPath))
  {
    fs.readFile(GT.wsjtxLogPath, "utf-8", handleAdifLoad);
  }
}

function findTrustedQSLPaths()
{
  var base = null;

  if (GT.trustedQslSettings.stationFileValid == true)
  {
    // double check the presence of the station_data;
    if (!fs.existsSync(GT.trustedQslSettings.stationFile))
    {
      GT.trustedQslSettings.stationFileValid = false;
    }
  }
  if (GT.trustedQslSettings.stationFileValid == false)
  {
    if (GT.platform == "windows")
    {
      base = process.env.APPDATA + "\\TrustedQSL\\station_data";
      if (fs.existsSync(base))
      {
        GT.trustedQslSettings.stationFile = base;
        GT.trustedQslSettings.stationFileValid = true;
      }
      else
      {
        base = process.env.LOCALAPPDATA + "\\TrustedQSL\\station_data";
        if (fs.existsSync(base))
        {
          GT.trustedQslSettings.stationFile = base;
          GT.trustedQslSettings.stationFileValid = true;
        }
      }
    }
    else
    {
      base = process.env.HOME + "/.tqsl/station_data";
      if (fs.existsSync(base))
      {
        GT.trustedQslSettings.stationFile = base;
        GT.trustedQslSettings.stationFileValid = true;
      }
    }
  }
  if (GT.trustedQslSettings.stationFileValid == true)
  {
    var validate = false;
    var option = document.createElement("option");
    option.value = "";
    option.text = "Select a Station";
    lotwStation.appendChild(option);

    var buffer = fs.readFileSync(GT.trustedQslSettings.stationFile, "UTF-8");
    parser = new DOMParser();
    xmlDoc = parser.parseFromString(buffer, "text/xml");
    var x = xmlDoc.getElementsByTagName("StationData");
    for (var i = 0; i < x.length; i++)
    {
      option = document.createElement("option");
      option.value = x[i].getAttribute("name");
      option.text = x[i].getAttribute("name");
      if (option.value == GT.adifLogSettings.text.lotwStation)
      {
        option.selected = true;
        validate = true;
      }
      lotwStation.appendChild(option);
    }
    if (validate)
    {
      ValidateText(lotwStation);
    }
  }

  if (GT.trustedQslSettings.binaryFileValid == true)
  {
    // double check the presence of the TrustedQSL binary;
    if (!fs.existsSync(GT.trustedQslSettings.binaryFile))
    {
      GT.trustedQslSettings.binaryFileValid = false;
    }
  }
  if (GT.trustedQslSettings.binaryFileValid == false || GT.platform == "mac")
  {
    if (GT.platform == "windows")
    {
      base = process.env["ProgramFiles(x86)"] + "\\TrustedQSL\\tqsl.exe";
      if (fs.existsSync(base))
      {
        GT.trustedQslSettings.binaryFile = base;
        GT.trustedQslSettings.binaryFileValid = true;
      }
    }
    else if (GT.platform == "mac")
    {
      base = "/Applications/TrustedQSL/tqsl.app/Contents/MacOS/tqsl";
      if (fs.existsSync(base))
      {
        GT.trustedQslSettings.binaryFile = base;
        GT.trustedQslSettings.binaryFileValid = true;
      }
      else
      {
        base =
          process.env.HOME +
          "/Applications/TrustedQSL/tqsl.app/Contents/MacOS/tqsl";
        if (fs.existsSync(base))
        {
          GT.trustedQslSettings.binaryFile = base;
          GT.trustedQslSettings.binaryFileValid = true;
        }
        else
        {
          base =
            process.env.HOME + "/Applications/tqsl.app/Contents/MacOS/tqsl";
          if (fs.existsSync(base))
          {
            GT.trustedQslSettings.binaryFile = base;
            GT.trustedQslSettings.binaryFileValid = true;
          }
          else
          {
            base = "/Applications/tqsl.app/Contents/MacOS/tqsl";
            if (fs.existsSync(base))
            {
              GT.trustedQslSettings.binaryFile = base;
              GT.trustedQslSettings.binaryFileValid = true;
            }
            else
            {
              base =
                process.env.HOME +
                "/Desktop/TrustedQSL/tqsl.app/Contents/MacOS/tqsl";
              if (fs.existsSync(base))
              {
                GT.trustedQslSettings.binaryFile = base;
                GT.trustedQslSettings.binaryFileValid = true;
              }
              else
              {
                base =
                  process.env.HOME +
                  "/Applications/Ham Radio/tqsl.app/Contents/MacOS/tqsl";
                if (fs.existsSync(base))
                {
                  GT.trustedQslSettings.binaryFile = base;
                  GT.trustedQslSettings.binaryFileValid = true;
                }
              }
            }
          }
        }
      }
    }
    else if (GT.platform == "linux")
    {
      base = "/usr/bin/tqsl";
      if (fs.existsSync(base))
      {
        GT.trustedQslSettings.binaryFile = base;
        GT.trustedQslSettings.binaryFileValid = true;
      }
      else
      {
        base = "/usr/local/bin/tqsl";
        if (fs.existsSync(base))
        {
          GT.trustedQslSettings.binaryFile = base;
          GT.trustedQslSettings.binaryFileValid = true;
        }
      }
    }
  }
  GT.localStorage.trustedQslSettings = JSON.stringify(GT.trustedQslSettings);
}

function startupAdifLoadFunction()
{
  for (var i in GT.startupLogs)
  {
    try
    {
      if (fs.existsSync(GT.startupLogs[i].file))
      {
        fs.readFile(GT.startupLogs[i].file, "utf-8", handleAdifLoad);
      }
    }
    catch (e) {}
  }
}

function handleAdifLoad(err, data)
{
  onAdiLoadComplete(data);
  if (err)
  {
    console.log("File Read Error: " + err);
  }
}

function handleAdifLoadLocalLoTW(err, data)
{
  onAdiLoadComplete(data, "grabLoTWQSO");
  if (err)
  {
    console.log("File Read Error: " + err);
  }
}

function setAdifStartup(checkbox)
{
  if (GT.trustedQslSettings.binaryFile == null)
  { GT.trustedQslSettings.binaryFile = ""; }

  if (
    GT.trustedQslSettings.binaryFile.endsWith("tqsl.exe") ||
    GT.trustedQslSettings.binaryFile.endsWith("tqsl")
  )
  {
    GT.trustedQslSettings.binaryFileValid = true;
  }
  else GT.trustedQslSettings.binaryFileValid = false;

  if (GT.trustedQslSettings.binaryFileValid == true)
  {
    tqslFileDiv.style.backgroundColor = "blue";
  }
  else
  {
    tqslFileDiv.style.backgroundColor = "red";
  }
  tqslFileDiv.innerHTML =
    "<b>" + start_and_end(GT.trustedQslSettings.binaryFile) + "</b>";

  if (buttonAdifCheckBox.checked || loadAdifCheckBox.checked)
  {
    var worker = "";
    if (GT.startupLogs.length > 0)
    {
      worker += "<table class='darkTable'>";
      for (var i in GT.startupLogs)
      {
        worker += "<tr title='" +
          GT.startupLogs[i].file +
          "'><td>" +
          GT.startupLogs[i].name +
          "</td><td onclick='removeStartupLog(" +
          i +
          ")'><img src='img/trash_24x48.png' style='height:17px;margin:-1px;margin-bottom:-3px;padding:0px;cursor:pointer'></td></tr>";
      }
      worker += "</table>";
    }
    else
    {
      worker = "No file(s) selected";
    }
    startupLogFileDiv.innerHTML = worker;
    selectFileOnStartupDiv.style.display = "block";
  }
  else
  {
    startupLogFileDiv.innerHTML = "No file(s) selected";
    GT.startupFileSelector.setAttribute("type", "");
    GT.startupFileSelector.setAttribute("type", "file");
    GT.startupFileSelector.setAttribute("accept", "*");
    GT.startupFileSelector.value = null;
    selectFileOnStartupDiv.style.display = "none";
  }
}

function removeStartupLog(i)
{
  if (i in GT.startupLogs)
  {
    GT.startupLogs.splice(i, 1);
    GT.localStorage.startupLogs = JSON.stringify(GT.startupLogs);
    setAdifStartup(loadAdifCheckBox);
  }
}

function startupAdifLoadCheck()
{
  logEventMedia.value = GT.alertSettings.logEventMedia;
 
  loadWsjtLogFile();

  if (loadGTCheckBox.checked == true) loadGtQSOLogFile();

  if (loadAdifCheckBox.checked == true && GT.startupLogs.length > 0) startupAdifLoadFunction();

  if (GT.mapSettings.offlineMode == false)
  {
    if (loadLOTWCheckBox.checked == true) grabLOtWLog(false);

    if (loadQRZCheckBox.checked == true) grabQrzComLog(false);

    if (loadClubCheckBox.checked == true) grabClubLog(false);
  }
}

function getABuffer(file_url, callback, flag, mode, port, imgToGray, stringOfFlag, timeoutX)
{
  var http = require(mode);
  var fileBuffer = null;
  var options = null;

  options = {
    host: NodeURL.parse(file_url).host, // eslint-disable-line node/no-deprecated-api
    port: port,
    path: NodeURL.parse(file_url).path, // eslint-disable-line node/no-deprecated-api
    method: "get"
  };

  if (typeof stringOfFlag != "undefined") window[stringOfFlag] = true;
  if (typeof imgToGray != "undefined")
  {
    imgToGray.parentNode.style.background =
      "linear-gradient(grey 0%, black 0% 100% )";
    imgToGray.style.webkitFilter = "invert(100%) grayscale(1)";
  }

  var req = http.request(options, function (res)
  {
    var fsize = res.headers["content-length"];
    var cookies = null;
    if (typeof res.headers["set-cookie"] != "undefined")
    { cookies = res.headers["set-cookie"]; }

    res
      .on("data", function (data)
      {
        if (fileBuffer == null) fileBuffer = data;
        else fileBuffer += data;

        if (typeof imgToGray != "undefined")
        {
          var percent = 0;
          if (fsize > 0) percent = parseInt((fileBuffer.length / fsize) * 100);
          else percent = parseInt(((fileBuffer.length / 100000) * 100) % 100);
          imgToGray.parentNode.style.background =
            "linear-gradient(grey " +
            percent +
            "%, black " +
            Number(percent + 10) +
            "% 100% )";
        }
      })
      .on("end", function ()
      {
        if (typeof stringOfFlag != "undefined")
        {
          window[stringOfFlag] = false;
        }
        if (typeof imgToGray != "undefined")
        {
          imgToGray.parentNode.style.background = "";
          imgToGray.style.webkitFilter = "";
        }
        if (typeof callback == "function")
        {
          // Call it, since we have confirmed it is callable
          callback(fileBuffer, flag, cookies, file_url);
        }
      })
      .on("error", function ()
      {
        if (typeof stringOfFlag != "undefined")
        {
          window[stringOfFlag] = false;
        }
        if (typeof imgToGray != "undefined")
        {
          imgToGray.parentNode.style.background = "";
          imgToGray.style.webkitFilter = "";
        }
      });
  });

  req.on("socket", function (socket)
  {
    socket.setTimeout(120000);
    socket.on("timeout", function ()
    {
      req.abort();
    });
  });

  req.on("error", function ()
  {
    if (typeof stringOfFlag != "undefined")
    {
      window[stringOfFlag] = false;
    }
    if (typeof imgToGray != "undefined")
    {
      imgToGray.parentNode.style.background = "";
      imgToGray.style.webkitFilter = "";
    }
  });

  req.end();
}

function getAPostBuffer(
  file_url,
  callback,
  flag,
  mode,
  port,
  theData,
  imgToGray,
  stringOfFlag
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
      "Content-Length": postData.length
    }
  };

  window[stringOfFlag] = true;

  if (typeof imgToGray != "undefined")
  {
    imgToGray.parentNode.style.background =
      "linear-gradient(grey 0%, black 0% 100% )";
    imgToGray.style.webkitFilter = "invert(100%) grayscale(1)";
  }

  var req = http.request(options, function (res)
  {
    var fsize = res.headers["content-length"];
    var cookies = null;
    if (typeof res.headers["set-cookie"] != "undefined")
    { cookies = res.headers["set-cookie"]; }

    res
      .on("data", function (data)
      {
        if (fileBuffer == null) fileBuffer = data;
        else fileBuffer += data;

        if (typeof imgToGray != "undefined")
        {
          var percent = 0;
          if (fsize > 0) percent = parseInt((fileBuffer.length / fsize) * 100);
          else percent = parseInt(((fileBuffer.length / 100000) * 100) % 100);

          imgToGray.parentNode.style.background =
            "linear-gradient(grey " +
            percent +
            "%, black " +
            Number(percent + 10) +
            "% 100% )";
        }
      })
      .on("end", function ()
      {
        if (typeof callback == "function")
        {
          // Call it, since we have confirmed it is callable
          callback(fileBuffer, flag, cookies);
          window[stringOfFlag] = false;
          if (typeof imgToGray != "undefined")
          {
            imgToGray.parentNode.style.background = "";
            imgToGray.style.webkitFilter = "";
          }
        }
      })
      .on("error", function ()
      {
        window[stringOfFlag] = false;
        if (typeof imgToGray != "undefined")
        {
          imgToGray.parentNode.style.background = "";
          imgToGray.style.webkitFilter = "";
        }
      });
  });

  req.on("socket", function (socket)
  {
    socket.setTimeout(120000);
    socket.on("timeout", function ()
    {
      req.abort();
    });
  });

  req.on("error", function (err) // eslint-disable-line node/handle-callback-err
  {
    window[stringOfFlag] = false;
    if (typeof imgToGray != "undefined")
    {
      imgToGray.parentNode.style.background = "";
      imgToGray.style.webkitFilter = "";
    }
  });

  req.write(postData);
  req.end();
}

function sendUdpMessage(msg, length, port, address)
{
  var dgram = require("dgram");
  var socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
  socket.send(msg, 0, length, port, address, (err) => // eslint-disable-line node/handle-callback-err
  {
    socket.close();
  });
}

function sendTcpMessage(msg, length, port, address)
{
  var net = require("net");
  var client = new net.Socket();
  client.setTimeout(30000);
  client.connect(port, address, function ()
  {
    client.write(Buffer.from(msg, "utf-8"));
  });

  client.on("close", function () {});
}

function valueToAdiField(field, value)
{
  var adi = "<" + field + ":";
  adi += Buffer.byteLength(String(value)) + ">";
  adi += String(value) + " ";
  return adi;
}

function pad(value)
{
  if (value < 10)
  {
    return "0" + value;
  }
  else
  {
    return value;
  }
}

function HMSfromMilli(milli)
{
  var seconds = parseInt(milli / 1000);
  var days = Math.floor(seconds / (3600 * 24));
  seconds -= days * 3600 * 24;
  var hrs = Math.floor(seconds / 3600);
  seconds -= hrs * 3600;
  var mnts = Math.floor(seconds / 60);
  seconds -= mnts * 60;

  val = String(pad(hrs)) + String(pad(mnts)) + String(pad(seconds));
  return String(val);
}

function colonHMSfromMilli(milli)
{
  var seconds = parseInt(milli / 1000);
  var days = Math.floor(seconds / (3600 * 24));
  seconds -= days * 3600 * 24;
  var hrs = Math.floor(seconds / 3600);
  seconds -= hrs * 3600;
  var mnts = Math.floor(seconds / 60);
  seconds -= mnts * 60;

  val = String(pad(hrs)) + ":" + String(pad(mnts)) + ":" + String(pad(seconds));
  return String(val);
}

function colonHMSfromSeconds(secondsIn)
{
  var seconds = secondsIn;
  var days = Math.floor(seconds / (3600 * 24));
  seconds -= days * 3600 * 24;
  var hrs = Math.floor(seconds / 3600);
  seconds -= hrs * 3600;
  var mnts = Math.floor(seconds / 60);
  seconds -= mnts * 60;

  val = String(pad(hrs)) + ":" + String(pad(mnts)) + ":" + String(pad(seconds));
  return String(val);
}

function convertToDate(julian)
{
  var DAY = 86400000;
  var HALF_DAY = DAY / 2;
  var UNIX_EPOCH_JULIAN_DATE = 2440587.5;
  var UNIX_EPOCH_JULIAN_DAY = 2440587;
  return new Date((Number(julian) - UNIX_EPOCH_JULIAN_DATE) * DAY);
}

const CLk = "25bc718451a71954cb6d0d1b50541dd45d4ba148";

GT.lastReport = "";

GT.oldStyleLogMessage = null;

function oldSendToLogger()
{
  var newMessage = Object.assign({}, GT.oldStyleLogMessage);

  var band = formatBand(Number(newMessage.Frequency / 1000000));

  if (
    newMessage.DXGrid.length == 0 &&
    newMessage.DXCall + band + newMessage.MO in GT.liveCallsigns
  )
  {
    newMessage.DXGrid = GT.liveCallsigns[
      newMessage.DXCall + band + newMessage.MO
    ].grid.substr(0, 4);
  }

  var report = "<EOH>";

  report += valueToAdiField(
    "BAND",
    formatBand(Number(newMessage.Frequency / 1000000))
  );
  report += valueToAdiField("CALL", newMessage.DXCall.toUpperCase());
  report += valueToAdiField(
    "FREQ",
    Number(newMessage.Frequency / 1000000).toFixed(6)
  );
  report += valueToAdiField("MODE", newMessage.MO.toUpperCase());
  var date = convertToDate(parseInt(newMessage.DateOn));
  var dataString =
    date.getUTCFullYear() +
    ("0" + (date.getUTCMonth() + 1)).slice(-2) +
    ("0" + date.getUTCDate()).slice(-2);
  report += valueToAdiField("QSO_DATE", dataString);
  report += valueToAdiField("TIME_ON", HMSfromMilli(newMessage.TimeOn));

  date = convertToDate(parseInt(newMessage.DateOff));
  dataString =
    date.getUTCFullYear() +
    ("0" + (date.getUTCMonth() + 1)).slice(-2) +
    ("0" + date.getUTCDate()).slice(-2);
  report += valueToAdiField("QSO_DATE_OFF", dataString);
  report += valueToAdiField("TIME_OFF", HMSfromMilli(newMessage.TimeOff));

  report += valueToAdiField("RST_RCVD", newMessage.ReportRecieved);
  report += valueToAdiField("RST_SENT", newMessage.ReportSend);
  report += valueToAdiField("TX_PWR", parseInt(newMessage.TXPower));
  report += valueToAdiField("GRIDSQUARE", newMessage.DXGrid);

  if (newMessage.Comments.length > 0)
  { report += valueToAdiField("COMMENT", newMessage.Comments); }

  if (newMessage.Name.length > 0)
  { report += valueToAdiField("NAME", newMessage.Name); }

  if (newMessage.Operatorcall.length > 0)
  {
    report += valueToAdiField("OPERATOR", newMessage.Operatorcall);
  }

  if (newMessage.Mycall.length > 0)
  {
    report += valueToAdiField("STATION_CALLSIGN", newMessage.Mycall);
  }
  else if (GT.appSettings.myCall != "NOCALL" && GT.appSettings.myCall.length > 0)
  { report += valueToAdiField("STATION_CALLSIGN", GT.appSettings.myCall); }

  if (newMessage.Mygrid.length > 0)
  {
    report += valueToAdiField("MY_GRIDSQUARE", newMessage.Mygrid);
  }
  else if (GT.appSettings.myGrid.length > 1)
  { report += valueToAdiField("MY_GRIDSQUARE", GT.appSettings.myGrid); }

  report += "<EOR>";

  sendToLogger(report);
}

GT.adifLookupMap = {
  name: "NAME",
  iota: "IOTA",
  sota: "SOTA_REF",
  continent: "CONT",
  cqzone: "CQZ",
  ituzone: "ITUZ",
  email: "EMAIL",
  state: "STATE",
  county: "CNTY"
};

function sendToLogger(ADIF)
{
  var regex = new RegExp("<EOH>", "i");
  var record = parseADIFRecord(ADIF.split(regex)[1]);
  var localMode = record.MODE;

  if (localMode == "MFSK" && "SUBMODE" in record)
  {
    localMode = record.SUBMODE;
  }

  var localHash = record.CALL + record.BAND + localMode;
  if ((!("GRIDSQUARE" in record) || record.GRIDSQUARE.length == 0) && localHash in GT.liveCallsigns)
  {
    record.GRIDSQUARE = GT.liveCallsigns[localHash].grid.substr(0, 4);
  }

  if (GT.appSettings.potaEnabled == 1 && localHash in GT.liveCallsigns && GT.liveCallsigns[localHash].pota)
  {
    if (GT.liveCallsigns[localHash].pota != "?-????")
    {
      record.POTA_REF = GT.liveCallsigns[localHash].pota;
    }
  }

  if ("TX_PWR" in record)
  {
    record.TX_PWR = String(parseInt(record.TX_PWR));
  }

  if (
    (!("STATION_CALLSIGN" in record) ||
      record.STATION_CALLSIGN.length == 0) &&
    GT.appSettings.myCall != "NOCALL" &&
    GT.appSettings.myCall.length > 0
  )
  {
    record.STATION_CALLSIGN = GT.appSettings.myCall;
  }

  if (
    (!("MY_GRIDSQUARE" in record) || record.MY_GRIDSQUARE.length == 0) &&
    GT.appSettings.myGrid.length > 1
  )
  {
    record.MY_GRIDSQUARE = GT.appSettings.myGrid;
  }

  if (!("DXCC" in record))
  {
    var dxcc = callsignToDxcc(record.CALL);
    if (dxcc == -1) dxcc = 0;
    record.DXCC = String(dxcc);
  }

  // Tag: This is going to bite us in the butt later, but leaving it alone.
  if (!("COUNTRY" in record) && Number(record.DXCC) > 0)
  {
    record.COUNTRY = GT.dxccToADIFName[Number(record.DXCC)];
  }

  if (GT.appSettings.lookupMerge == true && record.CALL in GT.lookupCache)
  {
    var lookup = GT.lookupCache[record.CALL];
    for (var key in lookup)
    {
      if (key in GT.adifLookupMap)
      {
        record[GT.adifLookupMap[key]] = lookup[key];
      }
    }
    if ("GRIDSQUARE" in record && "grid" in lookup)
    {
      if (record.GRIDSQUARE.substr(0, 4) == lookup.grid.substr(0, 4))
      {
        record.GRIDSQUARE = lookup.grid;
      }
    }
    if (GT.appSettings.lookupMissingGrid && "grid" in lookup && (!("GRIDSQUARE" in record) || record.GRIDSQUARE.length == 0))
    {
      record.GRIDSQUARE = lookup.grid;
    }
  }

  finishSendingReport(record, localMode);
}

function finishSendingReport(record, localMode)
{
  var report = "";
  for (const key in record)
  {
    if (record[key] == null)
    {
      delete record[key];
      continue;
    }
    if (key != "POTA_REF")
    {
      report += "<" + key + ":" + Buffer.byteLength(record[key]) + ">" + record[key] + " ";
    }
  }
  report += "<EOR>";

  var reportNoPotaNoStateNoCnty = "";
  for (const key in record)
  {
    if (key != "POTA_REF" && key != "STATE" && key != "CNTY")
    {
      reportNoPotaNoStateNoCnty += "<" + key + ":" + Buffer.byteLength(record[key]) + ">" + record[key] + " ";
    }
  }
  reportNoPotaNoStateNoCnty += "<EOR>";
  
  // this report is for internal use ONLY!
  var reportWithPota = "";
  for (const key in record)
  {
    reportWithPota += "<" + key + ":" + Buffer.byteLength(record[key]) + ">" + record[key] + " ";
  }
  reportWithPota += "<EOR>";

  // Full record dupe check
  if (report != GT.lastReport)
  {
    GT.lastReport = report;
    
    if (GT.appSettings.potaEnabled == 1 && "POTA_REF" in record)
    {
      reportPotaQSO(record);
      addLastTraffic("<font style='color:white'>Spotted to POTA</font>");
    }

    if (GT.N1MMSettings.enable == true && GT.N1MMSettings.port > 1024 && GT.N1MMSettings.ip.length > 4)
    {
      sendUdpMessage(
        report,
        report.length,
        parseInt(GT.N1MMSettings.port),
        GT.N1MMSettings.ip
      );
      addLastTraffic("<font style='color:white'>Logged to N1MM</font>");
    }

    if (GT.log4OMSettings.enable == true && GT.log4OMSettings.port > 1024 && GT.log4OMSettings.ip.length > 4)
    {
      sendUdpMessage(
        "ADD " + report,
        report.length + 4,
        parseInt(GT.log4OMSettings.port),
        GT.log4OMSettings.ip
      );
      addLastTraffic("<font style='color:white'>Logged to Log4OM</font>");
    }

    try
    {
      onAdiLoadComplete(reportWithPota, null, true);
    }
    catch (e)
    {
      addLastTraffic("<font style='color:red'>Exception Internal Log</font>");
    }
    try
    {
      // Log worthy
      if (logGTqsoCheckBox.checked == true)
      {
        fs.appendFileSync(GT.qsoLogFile, reportWithPota + "\r\n");
        addLastTraffic(
          "<font style='color:white'>Logged to GridTracker backup</font>"
        );
      }
    }
    catch (e)
    {
      console.log(e);
      addLastTraffic("<font style='color:red'>Exception GridTracker backup</font>");
    }

    try
    {
      sendQrzLogEntry(reportNoPotaNoStateNoCnty);
    }
    catch (e)
    {
      addLastTraffic("<font style='color:red'>Exception QRZ Log</font>");
    }

    try
    {
      sendClubLogEntry(report);
    }
    catch (e)
    {
      addLastTraffic("<font style='color:red'>Exception ClubLog Log</font>");
    }

    try
    {
      sendHrdLogEntry(report);
    }
    catch (e)
    {
      addLastTraffic("<font style='color:red'>Exception HrdLog.net Log</font>");
    }

    try
    {
      sendCloudlogEntry(report);
    }
    catch (e)
    {
      addLastTraffic("<font style='color:red'>Exception Cloudlog Log</font>");
    }

    if (GT.acLogSettings.enable == true && GT.acLogSettings.port > 0 && GT.acLogSettings.ip.length > 4)
    {
      try
      {
        sendACLogMessage(record, GT.acLogSettings.port, GT.acLogSettings.ip);
        addLastTraffic("<font style='color:white'>Logged to N3FJP</font>");
      }
      catch (e)
      {
        addLastTraffic("<font style='color:red'>Exception N3FJP Log</font>");
      }
    }

    if (GT.dxkLogSettings.enable == true && GT.dxkLogSettings.port > 0 && GT.dxkLogSettings.ip.length > 4)
    {
      try
      {
        let DXreport = "";
        for (const key in record)
        {
          if ("MY_GRIDSQUARE" in record)
          {
            record.MY_GRIDSQUARE = record.MY_GRIDSQUARE.substr(0, 6);
          }
          if ("GRIDSQUARE" in record)
          {
            record.GRIDSQUARE = record.GRIDSQUARE.substr(0, 6);
          }
          if (key != "POTA_REF")
          {
            DXreport += "<" + key + ":" + Buffer.byteLength(record[key]) + ">" + record[key] + " ";
          }
        }
        DXreport += "<EOR>";

        sendDXKeeperLogMessage(DXreport, GT.dxkLogSettings.port, GT.dxkLogSettings.ip);
        addLastTraffic("<font style='color:white'>Logged to DXKeeper</font>");
      }
      catch (e)
      {
        addLastTraffic("<font style='color:red'>Exception DXKeeper Log</font>");
      }
    }

    if (GT.HRDLogbookLogSettings.enable == true && GT.HRDLogbookLogSettings.port > 0 && GT.HRDLogbookLogSettings.ip.length > 4)
    {
      try
      {
        sendHRDLogbookEntry(record, GT.HRDLogbookLogSettings.port, GT.HRDLogbookLogSettings.ip);
        addLastTraffic("<font style='color:white'>Logged to HRD Logbook</font>");
      }
      catch (e)
      {
        addLastTraffic("<font style='color:red'>Exception HRD Log</font>");
      }
    }

    try
    {
      sendLotwLogEntry(report);
    }
    catch (e)
    {
      addLastTraffic("<font style='color:red'>Exception LoTW Log</font>");
    }

    try
    {
      sendHamCQEntry(report);
    }
    catch (e)
    {
      addLastTraffic("<font style='color:red'>Exception HamCQ Log</font>");
    }

    if (logeQSLQSOCheckBox.checked == true && (nicknameeQSLCheckBox.checked == false || (nicknameeQSLCheckBox.checked == true && eQSLNickname.value.trim().length > 0)))
    {
      if (nicknameeQSLCheckBox.checked == true)
      {
        record.APP_EQSL_QTH_NICKNAME = eQSLNickname.value.trim();
      }
      let eQSLreport = "";
      for (var key in record)
      {
        eQSLreport += "<" + key + ":" + Buffer.byteLength(record[key]) + ">" + record[key] + " ";
      }
      eQSLreport += "<EOR>";

      try
      {
        sendeQSLEntry(eQSLreport);
      }
      catch (e)
      {
        addLastTraffic("<font style='color:red'>Exception eQSL Log</font>");
      }
    }

    try
    {
      alertLogMessage();
    }
    catch (e)
    {
      addLastTraffic("<font style='color:red'>Exception Alert Log</font>");
    }

    if (lookupCloseLog.checked == true)
    {
      try
      {
        openLookupWindow(false);
      }
      catch (e)
      {
        addLastTraffic("<font style='color:red'>Exception Hide Lookup</font>");
      }
    }
  }

  return report;
}

function alertLogMessage()
{
  if (logEventMedia.value != "none")
  {
    playAlertMediaFile(logEventMedia.value);
  }
}

function eqslCallback(buffer, flag)
{
  var result = String(buffer);
  if (flag)
  {
    if (result.indexOf("No such Username/Password found") != -1)
    {
      eQSLTestResult.innerHTML = "Bad<br/>Password<br/>or<br/>Nickname";
      logeQSLQSOCheckBox.checked = false;
      adifLogQsoCheckBoxChanged(logeQSLQSOCheckBox);
    }
    else if (result.indexOf("No such Callsign found") != -1)
    {
      eQSLTestResult.innerHTML = "Unknown<br/>Callsign";
      logeQSLQSOCheckBox.checked = false;
      adifLogQsoCheckBoxChanged(logeQSLQSOCheckBox);
    }
    else if (result.indexOf("Your ADIF log file has been built") > -1 || result.indexOf("You have no log entries") > -1)
    {
      eQSLTestResult.innerHTML = "Passed";
    }
    else if (result.indexOf("specify the desired User by using the QTHNickname") != -1)
    {
      eQSLTestResult.innerHTML = "QTH Nickname<br/>Needed";
    }
    else
    {
      eQSLTestResult.innerHTML = "Unknown<br/>Error";
      logeQSLQSOCheckBox.checked = false;
      adifLogQsoCheckBoxChanged(logeQSLQSOCheckBox);
    }
  }
  else
  {
    if (result.indexOf("Error: No match on eQSL_User/eQSL_Pswd") != -1)
    {
      addLastTraffic(
        "<font style='color:red'>Fail log eQSL.cc (credentials)</font>"
      );
    }
    if (
      result.indexOf("specify the desired User by using the QTHNickname") != -1
    )
    {
      addLastTraffic(
        "<font style='color:red'>Fail log eQSL.cc (nickname)</font>"
      );
    }
    else if (result.indexOf("Result: 0 out of 1 records") != -1)
    {
      addLastTraffic("<font style='color:red'>Fail log eQSL.cc (dupe)</font>");
    }
    else if (result.indexOf("Result: 1 out of 1 records added") != -1)
    {
      addLastTraffic("<font style='color:white'>Logged to eQSL.cc</font>");
    }
    else
    {
      addLastTraffic("<font style='color:red'>Fail log eQSL.cc (?)</font>");
    }
  }
}

function eQSLTest(test)
{
  if (GT.mapSettings.offlineMode == true) return;

  eQSLTestResult.innerHTML = "Testing";

  var fUrl =
    "https://www.eQSL.cc/qslcard/DownloadInBox.cfm?UserName=" +
    encodeURIComponent(eQSLUser.value) +
    "&Password=" +
    encodeURIComponent(eQSLPassword.value) +
    "&RcvdSince=2020101";

  if (nicknameeQSLCheckBox.checked == true)
  { fUrl += "&QTHNickname=" + encodeURIComponent(eQSLNickname.value); }
  getABuffer(fUrl, eqslCallback, true, "https", 443);
}

function sendeQSLEntry(report)
{
  if (GT.mapSettings.offlineMode == true) return;

  var pid = "GridTracker";
  var pver = String(gtVersion);
  var header = "<PROGRAMID:" + pid.length + ">" + pid + "\r\n";
  header += "<PROGRAMVERSION:" + pver.length + ">" + pver + "\r\n";
  header += "<EOH>\r\n";
  var eReport = encodeURIComponent(header + report);
  var fUrl =
    "https://www.eQSL.cc/qslcard/importADIF.cfm?ADIFData=" +
    eReport +
    "&EQSL_USER=" +
    encodeURIComponent(eQSLUser.value) +
    "&EQSL_PSWD=" +
    encodeURIComponent(eQSLPassword.value);

  getABuffer(fUrl, eqslCallback, false, "https", 443);
}

function testTrustedQSL(test)
{
  if (GT.mapSettings.offlineMode == true)
  {
    lotwTestResult.innerHTML = "Currently<br/>offline";
    return;
  }

  if (
    logLOTWqsoCheckBox.checked == true &&
    GT.trustedQslSettings.binaryFileValid == true &&
    GT.trustedQslSettings.stationFileValid == true &&
    lotwStation.value.length > 0
  )
  {
    lotwTestResult.innerHTML = "Testing Upload";

    var child_process = require("child_process");
    var options = Array();
    options.push("-q");
    options.push("-v");

    child_process.execFile(
      GT.trustedQslSettings.binaryFile,
      options,
      (error, stdout, stderr) =>
      {
        if (error)
        {
          lotwTestResult.innerHTML = "Error encountered";
        }
        lotwTestResult.innerHTML = stderr;
      }
    );
  }
  else
  {
    var worker = "";
    if (GT.trustedQslSettings.binaryFileValid == false)
    { worker += "Invalid tqsl executable<br/>"; }
    if (GT.trustedQslSettings.stationFileValid == false)
    { worker += "TrustQSL not installed<br/>"; }
    if (!ValidateText(lotwTrusted)) worker += "TQSL Password missing<br/>";
    if (!ValidateText(lotwStation)) worker += "Select Station<br/>";
    lotwTestResult.innerHTML = worker;
  }
}
GT.trustTempPath = "";

function sendLotwLogEntry(report)
{
  if (GT.mapSettings.offlineMode == true) return;

  if (
    logLOTWqsoCheckBox.checked == true &&
    GT.trustedQslSettings.binaryFileValid == true &&
    GT.trustedQslSettings.stationFileValid == true &&
    lotwStation.value.length > 0
  )
  {
    var header = "Generated " + userTimeString(null) + " for " + GT.appSettings.myCall + "\r\n\r\n";
    var pid = "GridTracker";
    var pver = String(gtVersion);
    header += "<PROGRAMID:" + pid.length + ">" + pid + "\r\n";
    header += "<PROGRAMVERSION:" + pver.length + ">" + pver + "\r\n";
    header += "<EOH>\r\n";
    var finalLog = header + report + "\r\n";

    GT.trustTempPath = os.tmpdir() + GT.dirSeperator + unique(report) + ".adif";
    fs.writeFileSync(GT.trustTempPath, finalLog);

    var child_process = require("child_process");
    var options = Array();
    options.push("-a");
    options.push("all");
    options.push("-l");
    options.push(lotwStation.value);
    if (lotwTrusted.value.length > 0)
    {
      options.push("-p");
      options.push(lotwTrusted.value);
    }
    options.push("-q");
    options.push("-x");
    options.push("-d");
    options.push("-u");
    options.push(GT.trustTempPath);

    child_process.execFile(
      GT.trustedQslSettings.binaryFile,
      options,
      (error, stdout, stderr) => // eslint-disable-line node/handle-callback-err
      {
        if (stderr.indexOf("Final Status: Success") < 0)
        {
          addLastTraffic("<font style='color:red'>Fail log to TQSL</font>");
        }
        else
        {
          addLastTraffic("<font style='color:white'>Logged to TQSL</font>");
        }
        fs.unlinkSync(GT.trustTempPath);
      }
    );
  }
}

function n1mmLoggerChanged()
{
  GT.N1MMSettings.enable = buttonN1MMCheckBox.checked;
  GT.N1MMSettings.ip = N1MMIpInput.value;
  GT.N1MMSettings.port = N1MMPortInput.value;

  GT.localStorage.N1MMSettings = JSON.stringify(GT.N1MMSettings);
}

function log4OMLoggerChanged()
{
  GT.log4OMSettings.enable = buttonLog4OMCheckBox.checked;
  GT.log4OMSettings.ip = log4OMIpInput.value;
  GT.log4OMSettings.port = log4OMPortInput.value;

  GT.localStorage.log4OMSettings = JSON.stringify(GT.log4OMSettings);
}

function acLogLoggerChanged()
{
  GT.acLogSettings.enable = buttonacLogCheckBox.checked;
  GT.acLogSettings.ip = acLogIpInput.value;
  GT.acLogSettings.port = acLogPortInput.value;

  GT.localStorage.acLogSettings = JSON.stringify(GT.acLogSettings);
}

function dxkLogLoggerChanged()
{
  GT.dxkLogSettings.enable = buttondxkLogCheckBox.checked;
  GT.dxkLogSettings.ip = dxkLogIpInput.value;
  GT.dxkLogSettings.port = dxkLogPortInput.value;

  GT.localStorage.dxkLogSettings = JSON.stringify(GT.dxkLogSettings);
}

function hrdLogbookLoggerChanged()
{
  GT.HRDLogbookLogSettings.enable = buttonHrdLogbookCheckBox.checked;
  GT.HRDLogbookLogSettings.ip = hrdLogbookIpInput.value;
  GT.HRDLogbookLogSettings.port = hrdLogbookPortInput.value;

  GT.localStorage.HRDLogbookLogSettings = JSON.stringify(GT.HRDLogbookLogSettings);
}

function CloudUrlErrorCallback(
  file_url,
  callback,
  flag,
  mode,
  port,
  theData,
  timeoutMs,
  timeoutCallback,
  message
)
{
  CloudlogTestResult.innerHTML = message;
}

function CloudlogSendLogResult(buffer, flag)
{
  if (flag && flag == true)
  {
    if (buffer)
    {
      if (buffer.indexOf("missing api key") > -1)
      {
        CloudlogTestResult.innerHTML = "API Key Invalid";
      }
      else if (buffer.indexOf("created") > -1)
      {
        CloudlogTestResult.innerHTML = "Passed";
      }
      else
      {
        CloudlogTestResult.innerHTML = "Invalid Response";
      }
    }
    else
    {
      CloudlogTestResult.innerHTML = "Invalid Response";
    }
  }
  else
  {
    if (buffer && buffer.indexOf("created") > -1)
    { addLastTraffic("<font style='color:white'>Logged to Cloudlog</font>"); }
    else addLastTraffic("<font style='color:red'>Fail log to Cloudlog</font>");
  }
}

function CloudlogGetProfiles()
{
  CloudLogValidateURL(true);
  CloudlogURL.value = CloudlogURL.value.endsWith("/") ? CloudlogURL.value.slice(0, -1) : CloudlogURL.value;
  if (ValidateText(CloudlogURL) && ValidateText(CloudlogAPI))
  {
    getPostJSONBuffer(
      CloudlogURL.value + "/index.php/api/station_info/" + CloudlogAPI.value,
      CloudlogFillProfiles,
      true,
      "https",
      80,
      null,
      10000,
      CloudUrlErrorCallback,
      "No Response<br/>or</br>Timeout"
    );
  }
  else
  {
    CloudlogTestResult.innerHTML = "Missing Fields</br>Test Aborted";
  }
}

function CloudlogTestApiKey(buffer, flag)
{
  if (flag && flag == true)
  {
    CloudlogTestResult.style.backgroundColor = "black";
    if (buffer)
    {
      parser = new DOMParser();
      xmlDoc = parser.parseFromString(buffer, "text/xml");
      if (xmlDoc.getElementsByTagName("status").length > 0)
      {
        state = xmlDoc.getElementsByTagName("status");
        rights = xmlDoc.getElementsByTagName("rights");
        if (rights[0].childNodes[0].nodeValue == "r")
        {
          CloudlogTestResult.innerHTML = "Read Only!";
          CloudlogTestResult.style.backgroundColor = "red";
        }
        else if (rights[0].childNodes[0].nodeValue == "rw")
        {
          CloudlogTestResult.innerHTML = "OK";
          CloudlogTestResult.style.backgroundColor = "green";
          CloudlogGetProfiles();
        }
      }
      else
      {
        if (xmlDoc.getElementsByTagName("message").length > 0)
        {
          message = xmlDoc.getElementsByTagName("message");
          CloudlogTestResult.innerHTML = "Error: " + message[0].childNodes[0].nodeValue;
          CloudlogTestResult.style.backgroundColor = "red";
        }
      }
    }
    else
    {
      CloudlogTestResult.innerHTML = "Invalid Response";
    }
  }
}

function CloudlogFillProfiles(buffer, flag)
{
  if (flag && flag == true)
  {
    if (buffer)
    {
      select = document.getElementById("CloudlogStationProfile");
      select.options.length = 0;
      jsonData = JSON.parse(buffer);
      for (var i = 0; i < jsonData.length; i++)
      {
        var item = jsonData[i];
        var opt = document.createElement("option");
        opt.value = item.station_id;
        if (item.station_active == 1)
        {
          opt.style.fontWeight = "bold";
        }
        if (item.station_id == GT.adifLogSettings.text.CloudlogStationProfileID)
        {
          opt.style.color = "yellow";
          opt.style.backgroundColor = "green";
          opt.selected = "selected";
        }
        opt.innerHTML = item.station_profile_name + " (" + item.station_id + ")";
        select.appendChild(opt);
      }
    }
    else
    {
      CloudlogTestResult.innerHTML = "Invalid Response";
    }
  }
}

function qrzSendLogResult(buffer, flag)
{
  let error = null;

  if (typeof buffer != "undefined" && buffer != null)
  {
    var data = String(buffer);
    var kv = data.split("&");
    if (kv.length > 0)
    {
      var arrData = Object();
      for (var x in kv)
      {
        var split = kv[x].split("=");
        arrData[split[0]] = split[1];
      }
      if (!("RESULT" in arrData))
      {
        error = "Unknown Response";
        if ("STATUS" in arrData)
        {
          if ("REASON" in arrData)
          {
            error = arrData.REASON;
          }
          if ("EXTENDED" in arrData && arrData.EXTENDED.length > 0)
          {
            error = arrData.EXTENDED;
            if (arrData.EXTENDED.indexOf("outside date range") > -1)
            {
              error = "Logbook Date Range!";
            }
          }
        }
      }
      else if (arrData.RESULT != "OK")
      {
        if (arrData.RESULT == "FAIL" && "REASON" in arrData)
        {
          error = arrData.REASON;
        }
        else if (arrData.RESULT == "AUTH")
        {
          error = "Invalid Auth";
        }
        else
        {
          error = arrData.RESULT;
        }
      }
      else
      {
        addLastTraffic("<font style='color:white'>Logged to QRZ.com</font>");
        return;
      }
    }
    else
    {
      error = "Missing Response";
    }
  }
  else
  {
    error = "No Response";
  }

  if (error != null)
  {
    addLastTraffic("<font style='font-size: smaller; color:orange'>" + error + "</font>");
  }
  addLastTraffic("<font style='color:red'>Failed log to QRZ.com</font>");
}

function postRetryErrorCallaback(
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
  getPostBuffer(
    file_url,
    callback,
    flag,
    mode,
    port,
    theData,
    timeoutMs,
    null,
    who
  );
}

function sendQrzLogEntry(report)
{
  if (GT.mapSettings.offlineMode == true) return;

  if (logQRZqsoCheckBox.checked == true && ValidateQrzApi(qrzApiKey))
  {
    var postData = {
      KEY: qrzApiKey.value,
      ACTION: "INSERT",
      ADIF: report
    };
    getPostBuffer(
      "https://logbook.qrz.com/api",
      qrzSendLogResult,
      null,
      "https",
      443,
      postData,
      30000,
      postRetryErrorCallaback,
      "QRZ.com"
    );
  }
}

function clubLogQsoResult(buffer, flag)
{
  addLastTraffic("<font style='color:white'>Logged to ClubLog.org</font>");
}

function sendClubLogEntry(report)
{
  if (GT.mapSettings.offlineMode == true) return;

  if (logClubqsoCheckBox.checked == true)
  {
    if (typeof nw != "undefined")
    {
      var postData = {
        email: clubEmail.value,
        password: clubPassword.value,
        callsign: clubCall.value,
        adif: report,
        api: CLk
      };

      getPostBuffer(
        "https://clublog.org/realtime.php",
        clubLogQsoResult,
        null,
        "https",
        443,
        postData,
        30000,
        postRetryErrorCallaback,
        "ClubLog.org"
      );
    }
  }
}

function sendCloudlogEntry(report)
{
  if (GT.mapSettings.offlineMode == true) return;

  if (logCloudlogQSOCheckBox.checked == true)
  {
    CloudLogValidateURL(true);
    CloudlogURL.value = CloudlogURL.value.endsWith("/") ? CloudlogURL.value.slice(0, -1) : CloudlogURL.value;
    var postData = { key: CloudlogAPI.value, station_profile_id: CloudlogStationProfile.value, type: "adif", string: report };
    getPostJSONBuffer(
      CloudlogURL.value + "/index.php/api/qso",
      CloudlogSendLogResult,
      null,
      "https",
      80,
      postData,
      10000,
      CloudUrlErrorCallback,
      "Failed to Send"
    );
  }
}

function hrdSendLogResult(buffer, flag)
{
  if (flag && flag == true)
  {
    if (buffer.indexOf("Unknown user") > -1)
    {
      HRDLogTestResult.innerHTML = "Failed";
      logHRDLOGqsoCheckBox.checked = false;
      adifLogQsoCheckBoxChanged(logHRDLOGqsoCheckBox);
    }
    else HRDLogTestResult.innerHTML = "Passed";
  }
  else
  {
    if (buffer != null && buffer.indexOf("Unknown user") == -1)
    { addLastTraffic("<font style='color:white'>Logged to HRDLOG.net</font>"); }
    else
    { addLastTraffic("<font style='color:red'>Fail log to HRDLOG.net</font>"); }
  }
}

function sendHrdLogEntry(report)
{
  if (GT.mapSettings.offlineMode == true) return;

  if (logHRDLOGqsoCheckBox.checked == true)
  {
    if (typeof nw != "undefined")
    {
      var postData = {
        Callsign: HRDLOGCallsign.value,
        Code: HRDLOGUploadCode.value,
        App: "GridTracker " + gtVersion,
        ADIFData: report
      };
      getPostBuffer(
        "https://www.hrdlog.net/NewEntry.aspx",
        hrdSendLogResult,
        null,
        "https",
        443,
        postData,
        30000,
        postRetryErrorCallaback,
        "HRDLog.net"
      );
    }
  }
}

function hrdCredentialTest(test)
{
  if (test && test == true)
  {
    HRDLogTestResult.innerHTML = "Testing";

    var postData = {
      Callsign: HRDLOGCallsign.value,
      Code: HRDLOGUploadCode.value
    };
    getPostBuffer(
      "https://www.hrdlog.net/NewEntry.aspx",
      hrdSendLogResult,
      test,
      "https",
      443,
      postData
    );
  }
}

function CloudLogValidateURL(shouldSaveIfChanged = false)
{
  var initialValue = CloudlogURL.value;
  CloudlogURL.value = CloudlogURL.value.replace("/index.php/api/qso", "")
  if (shouldSaveIfChanged == true && CloudlogURL.value != initialValue)
  {
    GT.adifLogSettings.text.CloudlogURL = CloudlogURL.value;
    saveAdifSettings();
  }
}

function CloudLogProfileChanged(obj)
{
  GT.adifLogSettings.text.CloudlogStationProfileID = obj.options[obj.selectedIndex].value;
  GT.adifLogSettings.text.CloudlogStationProfileName = obj.options[obj.selectedIndex].text;
  saveAdifSettings();
}

function CloudlogTest(test)
{
  if (test && test == true)
  {
    CloudLogValidateURL(true);
    CloudlogURL.value = CloudlogURL.value.endsWith("/") ? CloudlogURL.value.slice(0, -1) : CloudlogURL.value;
    if (ValidateText(CloudlogURL) && ValidateText(CloudlogAPI))
    {
      CloudlogTestResult.innerHTML = "Testing API Key";

      getPostJSONBuffer(
        CloudlogURL.value + "/index.php/api/auth/" + CloudlogAPI.value,
        CloudlogTestApiKey,
        test,
        "https",
        80,
        null,
        10000,
        CloudUrlErrorCallback,
        "No Response<br/>or</br>Timeout"
      );
    }
    else
    {
      CloudlogTestResult.innerHTML = "Missing Fields</br>Test Aborted";
    }
  }
}

function HamCQTest(test)
{
  if (test && test == true)
  {
    HamCQTestResult.innerHTML = "Testing";

    var postData = { key: HamCQApiKey.value };
    getPostJSONBuffer(
      "https://www.hamcq.cn/v1/logbook?from=gridtracker",
      HamCQSendResult,
      test,
      "https",
      443,
      postData,
      10000,
      HamCQErrorCallback,
      "Failed"
    );
  }
}

function HamCQErrorCallback(
  file_url,
  callback,
  flag,
  mode,
  port,
  theData,
  timeoutMs,
  timeoutCallback,
  message
)
{
  HamCQTestResult.innerHTML = message;
}

function HamCQSendResult(buffer, flag)
{
  if (flag && flag == true)
  {
    if (buffer)
    {
      if (buffer.indexOf("Invalid") > -1)
      {
        HamCQTestResult.innerHTML = "Invalid";
      }
      else if (buffer.indexOf("Pass") > -1)
      {
        HamCQTestResult.innerHTML = "Passed";
      }
      else
      {
        HamCQTestResult.innerHTML = "Unknown Error";
      }
    }
    else
    {
      HamCQTestResult.innerHTML = "Resp Err";
    }
  }
}

function sendHamCQEntry(report)
{
  if (GT.mapSettings.offlineMode == true) return;

  if (logHamCQqsoCheckBox.checked == true)
  {
    if (typeof nw != "undefined")
    {
      var postData = {
        key: HamCQApiKey.value,
        app: "GridTracker " + gtVersion,
        adif: report
      };
      getPostBuffer(
        "https://www.hamcq.cn/v1/logbook?from=gridtracker",
        HamCQSendResult,
        null,
        "https",
        443,
        postData,
        30000,
        postRetryErrorCallaback,
        "HamCQ.cn"
      );
    }
  }
}

function getPostJSONBuffer(
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
  try
  {
    var postData = JSON.stringify(theData);
    var protocol = NodeURL.parse(file_url).protocol; // eslint-disable-line node/no-deprecated-api
    var http = require(protocol.replace(":", ""));
    var fileBuffer = null;
    var options = {
      host: NodeURL.parse(file_url).hostname, // eslint-disable-line node/no-deprecated-api
      port: NodeURL.parse(file_url).port, // eslint-disable-line node/no-deprecated-api
      path: NodeURL.parse(file_url).path, // eslint-disable-line node/no-deprecated-api
      method: "post",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": postData.length,
        "User-Agent": gtUserAgent,
        "x-user-agent": gtUserAgent
      }
    };
    var req = http.request(options, function (res)
    {
      var fsize = res.headers["content-length"];
      var cookies = null;
      if (typeof res.headers["set-cookie"] != "undefined")
      { cookies = res.headers["set-cookie"]; }
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
            callback(fileBuffer, flag, cookies);
          }
        })
        .on("error", function () {});
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
            80,
            theData,
            timeoutMs,
            timeoutCallback,
            who
          );
        }
      });
    }
    req.write(postData);
    req.end();
  }
  catch (e)
  {
    if (typeof timeoutCallback != "undefined")
    {
      timeoutCallback(
        file_url,
        callback,
        flag,
        mode,
        80,
        theData,
        timeoutMs,
        timeoutCallback,
        "Invalid Url"
      );
    }
  }
}

function valueToXmlField(field, value)
{
  var adi = "<" + field + ">";
  adi += String(value);
  adi += "</" + field + ">";
  return adi;
}

function aclUpdateControlValue(control, value)
{
  return (
    valueToXmlField(
      "CMD",
      "<UPDATE>" +
        valueToXmlField("CONTROL", control) +
        valueToXmlField("VALUE", value)
    ) + "\r\n"
  );
}

function aclAction(action)
{
  return (
    valueToXmlField("CMD", "<ACTION>" + valueToXmlField("VALUE", action)) +
    "\r\n"
  );
}

function adifField(record, key)
{
  if (key in record) return record[key].trim();
  else return "";
}
function sendACLogMessage(record, port, address)
{
  var report = "";

  report += aclAction("CLEAR");
  report += aclUpdateControlValue("TXTENTRYBAND", adifField(record, "BAND"));
  report += aclUpdateControlValue("TXTENTRYCALL", adifField(record, "CALL"));
  report += aclAction("CALLTAB");
  report += aclUpdateControlValue(
    "TXTENTRYFREQUENCY",
    adifField(record, "FREQ")
  );
  if (adifField(record, "SUBMODE").length > 0)
  {
    report += aclUpdateControlValue(
      "TXTENTRYMODE",
      adifField(record, "SUBMODE")
    );
  }
  else
  { report += aclUpdateControlValue("TXTENTRYMODE", adifField(record, "MODE")); }

  var date = adifField(record, "QSO_DATE");
  var dataString =
    date.substr(0, 4) + "/" + date.substr(4, 2) + "/" + date.substr(6);

  report += aclUpdateControlValue("TXTENTRYDATE", dataString);

  var timeVal = adifField(record, "TIME_ON");
  var whenString =
    timeVal.substr(0, 2) +
    ":" +
    timeVal.substr(2, 2) +
    ":" +
    timeVal.substr(4, 2);
  report += aclUpdateControlValue("TXTENTRYTIMEON", whenString);

  timeVal = adifField(record, "TIME_OFF");
  whenString =
    timeVal.substr(0, 2) +
    ":" +
    timeVal.substr(2, 2) +
    ":" +
    timeVal.substr(4, 2);
  report += aclUpdateControlValue("TXTENTRYTIMEOFF", whenString);

  report += aclUpdateControlValue(
    "TXTENTRYRSTR",
    adifField(record, "RST_RCVD")
  );
  report += aclUpdateControlValue(
    "TXTENTRYRSTS",
    adifField(record, "RST_SENT")
  );
  report += aclUpdateControlValue("TXTENTRYPOWER", adifField(record, "TX_PWR"));
  report += aclUpdateControlValue(
    "TXTENTRYGRID",
    adifField(record, "GRIDSQUARE")
  );
  report += aclUpdateControlValue(
    "TXTENTRYCOMMENTS",
    adifField(record, "COMMENT")
  );
  report += aclUpdateControlValue("TXTENTRYNAMER", adifField(record, "NAME"));
  report += aclUpdateControlValue("TXTENTRYIOTA", adifField(record, "IOTA"));
  report += aclUpdateControlValue(
    "TXTENTRYCONTINENT",
    adifField(record, "CONT")
  );
  report += aclUpdateControlValue("TXTENTRYITUZ", adifField(record, "ITUZ"));
  report += aclUpdateControlValue("TXTENTRYCQZONE", adifField(record, "CQZ"));
  report += aclUpdateControlValue(
    "TXTENTRYCOUNTYR",
    replaceAll(adifField(record, "CNTY"), ", ", ",")
  );

  var sentSpcNum = false;
  if (adifField(record, "SRX").length > 0)
  {
    report += aclUpdateControlValue(
      "TXTENTRYSERIALNOR",
      adifField(record, "SRX")
    );
  }
  else if (adifField(record, "CONTEST_ID").length > 0)
  {
    report += aclUpdateControlValue(
      "TXTENTRYSPCNUM",
      adifField(record, "SRX_STRING")
    );
    sentSpcNum = true;
    report += aclUpdateControlValue(
      "TXTENTRYCLASS",
      adifField(record, "CLASS")
    );
    report += aclUpdateControlValue(
      "TXTENTRYSECTION",
      adifField(record, "ARRL_SECT")
    );
  }

  if (adifField(record, "STATE").length > 0)
  {
    report += aclUpdateControlValue(
      "TXTENTRYSTATE",
      adifField(record, "STATE")
    );
    if (sentSpcNum == false)
    {
      report += aclUpdateControlValue(
        "TXTENTRYSPCNUM",
        adifField(record, "STATE")
      );
    }
  }

  report += aclAction("ENTER");

  sendTcpMessage(report, report.length, port, address);
}

function sendDXKeeperLogMessage(newMessage, port, address)
{
  var report = "";

  report += valueToAdiField("command", "log");
  report += valueToAdiField("parameters", newMessage);
  report += "\r\n";

  sendTcpMessage(report, report.length, Number(port) + 1, address);
}

const myTextEncoder = new TextEncoder();
const myTextDecoder = new TextDecoder();

function parseADIFRecord(adif)
{
  var regex = new RegExp("<EOR>", "i");
  var newLine = adif.split(regex);
  var line = newLine[0].trim(); // Catch the naughty case of someone sending two records at the same time
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
      if (where != -1)
      {
        var fieldName = line.substr(0, where).toUpperCase();
        line = line.substr(fieldName.length + 1);
        var fieldLength = parseInt(line);
        var end = line.indexOf(">");
        if (end > 0)
        {
          line = line.substr(end + 1);
          fieldValue = myTextDecoder.decode(myTextEncoder.encode(line.substr(0)).slice(0, fieldLength))
          line = line.substr(fieldValue.length);
          record[fieldName] = fieldValue;
        }
      }
    }
  }

  return record;
}

function sendHRDLogbookEntry(report, port, address)
{
  var command = "ver\rdb add {";
  var items = Object.assign({}, report);

  items.FREQ = items.FREQ.split(".").join("");

  for (var item in items)
  {
    command += item + "=\"" + items[item] + "\" ";
  }

  command += "}\rexit\r";

  sendTcpMessage(command, command.length, Number(port), address);
}

function pskCallback(buffer, flag)
{
  parsePSKadif(buffer);
}

GT.isGettingPsk = false;

function grabPsk24()
{
  if (GT.isGettingPsk == true) return;

  if (GT.appSettings.myCall.length > 0 && GT.appSettings.myCall != "NOCALL")
  {
    var days = 1;
    if (pskImg.src == 1) days = 7;
    getABuffer(
      "https://pskreporter.info/cgi-bin/pskdata.pl?adif=1&days=" +
        days +
        "&receiverCallsign=" +
        GT.appSettings.myCall.toLowerCase(),
      pskCallback,
      null,
      "https",
      443,
      pskImg,
      "GT.isGettingPsk"
    );
  }
}

function findAdiField(row, field)
{
  var value = "";
  var regex = new RegExp("<" + field + ":", "i");
  var firstSplitArray = row.split(regex);
  if (firstSplitArray && firstSplitArray.length == 2)
  {
    var secondSplitArray = firstSplitArray[1].split(">");
    if (secondSplitArray.length > 1)
    {
      var newLenSearch = secondSplitArray[0].split(":");
      var newLen = newLenSearch[0];
      value = secondSplitArray[1].slice(0, newLen);
    }
  }
  return value;
}

function parsePSKadif(adiBuffer)
{
  var rawAdiBuffer = "";
  if (typeof adiBuffer == "object") rawAdiBuffer = String(adiBuffer);
  else rawAdiBuffer = adiBuffer;

  var activeAdifArray = Array();

  if (rawAdiBuffer.indexOf("PSKReporter") == -1) return;

  if (rawAdiBuffer.length > 1)
  {
    var regex = new RegExp("<EOH>", "ig");
    rawAdiBuffer = replaceAll(rawAdiBuffer, regex, "");
  }

  if (rawAdiBuffer.length > 1)
  {
    var regex = new RegExp("<EOR>", "i");
    activeAdifArray = rawAdiBuffer.split(regex);
  }

  for (var x = 0; x < activeAdifArray.length; x++)
  {
    if (activeAdifArray[x].length > 0)
    {
      var finalMyGrid = findAdiField(
        activeAdifArray[x],
        "MY_GRIDSQUARE"
      ).toUpperCase();
      var finalGrid = findAdiField(
        activeAdifArray[x],
        "GRIDSQUARE"
      ).toUpperCase();
      var finalDXcall = findAdiField(activeAdifArray[x], "CALL");
      var finalDEcall = findAdiField(activeAdifArray[x], "OPERATOR");
      var finalRSTsent = findAdiField(activeAdifArray[x], "APP_PSKREP_SNR");
      var dateVal = findAdiField(activeAdifArray[x], "QSO_DATE");
      var timeVal = findAdiField(activeAdifArray[x], "TIME_ON");
      var finalMode = findAdiField(activeAdifArray[x], "MODE");
      var finalBand = formatBand(Number(findAdiField(activeAdifArray[x], "FREQ")));
      var finalMsg = "-";
      var finalDxcc = Number(findAdiField(activeAdifArray[x], "DXCC"));
      if (finalDxcc == 0)
      {
        if (finalDXcall == GT.appSettings.myCall) finalDxcc = callsignToDxcc(finalDEcall);
        else finalDxcc = callsignToDxcc(finalDXcall);
      }

      finalGrid = finalGrid.substr(0, 6);

      var dateTime = new Date(
        Date.UTC(
          dateVal.substr(0, 4),
          parseInt(dateVal.substr(4, 2)) - 1,
          dateVal.substr(6, 2),
          timeVal.substr(0, 2),
          timeVal.substr(2, 2),
          timeVal.substr(4, 2)
        )
      );
      var finalTime = parseInt(dateTime.getTime() / 1000);
      if (
        finalGrid != "" &&
        finalDXcall != "" &&
        validateGridFromString(finalGrid)
      )
      {
        if (finalDXcall == GT.appSettings.myCall)
        {
          addLiveCallsign(
            finalMyGrid,
            finalDEcall,
            finalDXcall,
            null,
            finalTime,
            finalMsg,
            finalMode,
            finalBand,
            false,
            false,
            finalRSTsent,
            finalDxcc,
            null,
            null,
            null,
            null,
            null
          );
        }
        else if (finalDEcall == GT.appSettings.myCall)
        {
          addLiveCallsign(
            finalGrid,
            finalDXcall,
            "-",
            finalRSTsent,
            finalTime,
            finalMsg,
            finalMode,
            finalBand,
            false,
            false,
            null,
            finalDxcc,
            null,
            null,
            null,
            null,
            null
          );
        }
        else
        {
          addLiveCallsign(
            finalGrid,
            finalDXcall,
            finalDEcall,
            finalRSTsent,
            finalTime,
            finalMsg,
            finalMode,
            finalBand,
            false,
            false,
            null,
            finalDxcc,
            null,
            null,
            null,
            null,
            null
          );
        }
      }
    }
  }
  redrawLiveGrids(false);
  updateCountStats();
}
