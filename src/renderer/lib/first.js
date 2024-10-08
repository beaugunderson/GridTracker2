// This file needs to be loaded first for all windows
// No exceptions, if you don't , things will go badly
const electron = require("electron");
const NodeURL = require("url");
const os = require("os");
const nodeTimers = require("timers");
const dns = require("node:dns");
const path = require("path");
const fs = require("fs");
const process = require("process");

try
{
  dns.setDefaultResultOrder("ipv4first");
  dns.promises.setDefaultResultOrder("ipv4first");
}
catch (e)
{
  console.log("Can't set dns IPv4 default order");
}


// Between Dev and App location
const resourcesPath = electron.ipcRenderer.sendSync("getResourcesPath");

function requireJson(filepath)
{
  let where;
  try 
  {
    where = path.resolve(resourcesPath, filepath);
    return require(where);
  }
  catch (e)
  {
    console.log("mild-warning: " + filepath + " not loaded");
  }
  return null;
}

// GridTracker object
var GT = {};
// CallRoster object
var CR = {};

if (document.title.substring(0, 12).trim() == "GridTracker2")
{
  let filename = path.join(electron.ipcRenderer.sendSync("getPath","userData"), "Ginternal", "app-settings.json");
  try
  {
    if (fs.existsSync(filename))
    {
      let data = require(filename);
      if (data)
      {
        GT.settings = data;
      }
      else
      {
        // safety catch
        // In 2025 we remove importLegacy code -Tag
        GT.settings = { importLegacy: true };
      }
    }
    else
    {
      // This should happen only once for new users
      // In 2025 we remove importLegacy code -Tag
      GT.settings = { importLegacy: true };
    }
  }
  catch (e)
  {
    // In 2025 we remove importLegacy code -Tag
    GT.settings = { importLegacy: true };
    console.log(e);
  }
}
else
{
  GT.settings = window.opener.GT.settings;
}

// Zoom Code Below
var s_zoomLevel = 0;
document.addEventListener("keydown", onZoomControlDown, true);

const g_zoomKeys = {
  NumpadSubtract: reduceZoom,
  Minus: reduceZoom,
  NumpadAdd: increaseZoom,
  Equal: increaseZoom,
  Numpad0: resetZoom,
  Digit0: resetZoom
};

electron.ipcRenderer.on('loadZoom', (_event, value) => loadZoomCallback(value));

function loadZoomCallback(zoom)
{
  s_zoomLevel = zoom;
  electron.webFrame.setZoomLevel(s_zoomLevel);
}

function onZoomControlDown(event)
{
  if (event.ctrlKey)
  {
    if (event.code in g_zoomKeys)
    {
      g_zoomKeys[event.code]();
      event.preventDefault();
    }
  }
}

function reduceZoom()
{
  s_zoomLevel -= 0.1;
  setAndSaveZoom();
}

function increaseZoom()
{
  s_zoomLevel += 0.1;
  setAndSaveZoom();
}

function resetZoom()
{
  s_zoomLevel = 0;
  setAndSaveZoom();
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(num, max));
}

function setAndSaveZoom()
{
  s_zoomLevel = clamp(s_zoomLevel, -5, 8);
  s_zoomLevel = parseFloat(s_zoomLevel.toFixed(1));
  electron.webFrame.setZoomLevel(s_zoomLevel);
  electron.ipcRenderer.send("saveZoom", s_zoomLevel);
}
