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

console.log = logErrorString;

function logErrorObject(error)
{
  logErrorString(e.name + ":" + e.message);
}

function logErrorString(errorString)
{
  electron.ipcRenderer.send("log", errorString);
}

window.onerror = function(message, source, lineNumber, colno, error) {
  logErrorString(`${error.stack}`);
};

try
{
  dns.setDefaultResultOrder("ipv4first");
  dns.promises.setDefaultResultOrder("ipv4first");
}
catch (e)
{
  logErrorString("Can't set dns IPv4 default order");
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
    logErrorObject(e);
  }
}
else
{
  GT = window.opener.GT;
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
  Digit0: resetZoom,
  KeyA: selectAll,
  KeyC: copyToClipboard,
  KeyV: pasteFromClipboard
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
      g_zoomKeys[event.code](event);
    }
    event.preventDefault();
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

function isTextInput(element)
{
  return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
}

function selectAll(event)
{
  if (event.target && isTextInput(event.target))
  {
    event.target.focus();
    event.target.select();
  }
}

function copyToClipboard(event)
{
  const selection = window.getSelection();
  event.clipboardData.setData("text", selection.toString());
}

function pasteFromClipboard(event)
{
  let paste = (event.clipboardData || window.clipboardData).getData("text");
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  selection.deleteFromDocument();
  selection.getRangeAt(0).insertNode(document.createTextNode(paste));
  selection.collapseToEnd();
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

function registerCutAndPasteContextMenu()
{
  let inputText = document.getElementsByClassName("inputTextValue");
  for (let x = 0; x < inputText.length; x++)
  {
    inputText[x].addEventListener('contextmenu', (element) => {
      const menu = new Menu();
      menu.append(new MenuItem({ label: I18N("copy"), role: 'copy' }));
      menu.append(new MenuItem({ label: I18N("paste"), role: 'paste' }));
      menu.popup();
    });
  }
}