const fs = require('fs');
const timers = require('timers');
const remoteMain = require('@electron/remote/main');
const { app, Notification, shell, BrowserWindow, ipcMain, Menu, screen, clipboard } = require('electron');
const { autoUpdater } = require('electron-updater');
const { electronApp, optimizer } = require('@electron-toolkit/utils');
const { join } = require('path');

const singleInstanceLock = app.requestSingleInstanceLock();

const isMac = process.platform === 'darwin';

if (!singleInstanceLock) {
  app.quit();
}

// Needed for direct accsess to Menu and MenuItem
remoteMain.initialize();

const template = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            { role: 'about' },
            {
              label: 'Check for updates...',
              click: async () => {
                checkForUpdates();
              },
            },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide', label: 'Hide GridTracker2' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit', label: 'Quit GridTracker2' },
          ],
        },
      ]
    : []),
  {
    label: 'File',
    submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
  },
  {
    label: 'View',
    submenu: [
      // include developer menu items if the app is not packaged
      ...(!app.isPackaged
        ? [{ role: 'reload' }, { role: 'forceReload' }, { role: 'toggleDevTools' }]
        : []),
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  },
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac
        ? [{ type: 'separator' }, { role: 'front' }, { type: 'separator' }, { role: 'window' }]
        : [{ role: 'close' }]),
    ],
  },
  // Add about menu on Windows
  ...(!isMac
    ? [
        {
          label: 'Help',
          submenu: [
            { role: 'about' },
            {
              label: 'Check for updates...',
              click: async () => {
                checkForUpdates();
              },
            },
          ],
        },
      ]
    : []),
];

const menu = Menu.buildFromTemplate(template);

Menu.setApplicationMenu(menu);

// Every window accounted for here
const allowedWindows = {
  GridTracker2: {
    window: null,
    honorVisibility: true,
    boundsUpdateTimer: null,
    tempBounds: {},
    options: { x: 0, y: 0, width: 860, height: 652, show: true, zoom: 0 },
    static: {
      minWidth: 217,
      minHeight: 626,
      icon: join(__dirname, '../renderer/img/gt-icon.png'),
    },
  },
  gt_popup: {
    window: null,
    honorVisibility: false,
    boundsUpdateTimer: null,
    tempBounds: {},
    options: { x: 5, y: 5, width: 200, height: 200, show: false, zoom: 0 },
    static: { minWidth: 100, minHeight: 50 },
  },
  gt_stats: {
    window: null,
    honorVisibility: true,
    boundsUpdateTimer: null,
    tempBounds: {},
    options: { x: 50, y: 50, width: 640, height: 480, show: false, zoom: 0 },
    static: {
      minWidth: 620,
      minHeight: 200,
      icon: join(__dirname, '../renderer/img/stats-button.png'),
    },
  },
  gt_lookup: {
    window: null,
    honorVisibility: true,
    boundsUpdateTimer: null,
    tempBounds: {},
    options: { x: 75, y: 75, width: 680, height: 200, show: false, zoom: 0 },
    static: {
      minWidth: 680,
      minHeight: 200,
      icon: join(__dirname, '../renderer/img/lookup-icon.png'),
    },
  },
  gt_bandactivity: {
    window: null,
    honorVisibility: true,
    boundsUpdateTimer: null,
    tempBounds: {},
    options: { x: 250, y: 250, width: 198, height: 52, show: false, zoom: 0 },
    static: { minWidth: 198, minHeight: 52, frame: false, alwaysOnTop: true, skipTaskbar: true },
  },
  gt_alert: {
    window: null,
    honorVisibility: false,
    boundsUpdateTimer: null,
    tempBounds: {},
    options: { x: 5, y: 5, width: 600, height: 52, show: false, zoom: 0 },
    static: { resizable: false, alwaysOnTop: true },
  },
  gt_conditions: {
    window: null,
    honorVisibility: true,
    boundsUpdateTimer: null,
    tempBounds: {},
    options: { x: 75, y: 75, width: 492, height: 308, show: false, zoom: 0 },
    static: {
      minWidth: 492,
      minHeight: 308,
      icon: join(__dirname, '../renderer/img/conditions.png'),
    },
  },
  gt_chat: {
    window: null,
    honorVisibility: true,
    boundsUpdateTimer: null,
    tempBounds: {},
    options: { x: 55, y: 55, width: 640, height: 300, show: false, zoom: 0 },
    static: { minWidth: 450, minHeight: 140 },
  },
  gt_roster: {
    window: null,
    honorVisibility: true,
    boundsUpdateTimer: null,
    tempBounds: {},
    options: { x: 15, y: 15, width: 1000, height: 500, show: false, zoom: 0 },
    static: {
      minWidth: 390,
      minHeight: 250,
      icon: join(__dirname, '../renderer/img/roster-icon.png'),
    },
  },
};

const asarResourcesPath = join(__dirname, '../../resources');

const gtInternalPath = join(app.getPath('userData'), 'Ginternal');

if (!fs.existsSync(gtInternalPath)) {
  fs.mkdirSync(gtInternalPath);
}

// We will allow updating of this by the user, copy existing into Ginternal
let dxccInfoPath = join(gtInternalPath, 'dxcc-info.json');
if (!fs.existsSync(dxccInfoPath)) {
  fs.copyFileSync(
    join(asarResourcesPath, 'data/dxcc-info.json'),
    dxccInfoPath,
    fs.constants.COPYFILE_EXCL,
  );
}

const windowIdToAllowedWindows = {};

const windowSettingsPath = join(gtInternalPath, 'windows.json');

if (fs.existsSync(windowSettingsPath)) {
  const settings = require(windowSettingsPath);
  for (let windowName in settings) {
    allowedWindows[windowName].options = {
      ...allowedWindows[windowName].options,
      ...settings[windowName],
    };
  }
}

let mainWindowClosing = false;

ipcMain.on('getResourcesPath', (event) => {
  event.returnValue = asarResourcesPath;
});

ipcMain.on('getPath', (event, what) => {
  event.returnValue = app.getPath(what);
});

ipcMain.on('appVersion', (event) => {
  event.returnValue = app.getVersion();
});

ipcMain.on('showWin', (event, what) => {
  if (allowedWindows[what]?.window) {
    allowedWindows[what].window.show();
  }
});

ipcMain.on('hideWin', (event, what) => {
  if (allowedWindows[what]?.window) {
    allowedWindows[what].window.hide();
  }
});

ipcMain.on('toggleWin', (event, what) => {
  if (allowedWindows[what]?.window) {
    if (allowedWindows[what].window.isVisible()) {
      allowedWindows[what].window.hide();
    } else {
      allowedWindows[what].window.show();
    }
  }
});

ipcMain.on('focusWin', (event, what) => {
  if (allowedWindows[what]?.window) {
    allowedWindows[what].window.focus();
  }
});

async function screenshot(window) {
  await window.capturePage().then(image => {
    clipboard.writeImage(image);
  });
}

ipcMain.on('capturePageToClipboard', (event, what) => {
  if (allowedWindows[what]?.window) {
    screenshot(allowedWindows[what].window);
  }
});

ipcMain.on('setAlwaysOnTop', (event, what, value) => {
  if (allowedWindows[what]?.window) {
    allowedWindows[what].window.setAlwaysOnTop(value);
  }
});

ipcMain.on('saveZoom', (event, zoom) => {
  if (event.sender.id in windowIdToAllowedWindows) {
    allowedWindows[windowIdToAllowedWindows[event.sender.id]].options.zoom = zoom;
  }
});

ipcMain.on('restartGridTracker2', (event) => {
  app.relaunch();
  app.exit();
});

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    ...allowedWindows['GridTracker2'].options,
    ...allowedWindows['GridTracker2'].static,
    tabbingIdentifier: 'GridTracker2',
    title: 'GridTracker2',
    show: false,
    backgroundColor: 'black',
    autoHideMenuBar: true,
    enableLargerThanScreen: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: false,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      sandbox: false,
      devTools: !app.isPackaged,
    },
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    if (details.frameName == 'printHotKeys') {
      let options = {
        show: false,
        // for macOS
        tabbingIdentifier: details.frameName,
        // for Windows
        title: details.frameName,
        webPreferences: {
          autoHideMenuBar: true,
          devTools: !app.isPackaged,
        },
      };
      return { action: 'allow', overrideBrowserWindowOptions: options };
    } else if (details.frameName in allowedWindows) {
      let options = {
        ...allowedWindows[details.frameName].options,
        ...allowedWindows[details.frameName].static,
        autoHideMenuBar: true,
        backgroundColor: 'black',
        enableLargerThanScreen: true,
        show: false,
        // for macOS
        tabbingIdentifier: details.frameName,
        // for Windows
        title: details.frameName,
        webPreferences: {
          contextIsolation: false,
          nodeIntegration: true,
          nodeIntegrationInWorker: true,
          preload: join(__dirname, '../preload/index.js'),
          sandbox: false,
          devTools: !app.isPackaged,
        },
      };

      return { action: 'allow', overrideBrowserWindowOptions: options };
    } else {
      shell.openExternal(details.url);
      return { action: 'deny' };
    }
  });

  mainWindow.loadFile(join(__dirname, '../renderer/GridTracker2.html'));
}

function checkForUpdates() {
  autoUpdater.checkForUpdatesAndNotify();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    // Set app user model id for windows
  electronApp.setAppUserModelId('org.gridtracker.GridTracker2');
  app.setAppUserModelId('org.gridtracker.GridTracker2');
  
  if (process.env.DEBUG_AUTO_UPDATING === 'true') {
    const log = require('electron-log');

    log.transports.file.level = 'debug';

    autoUpdater.logger = log;
    autoUpdater.forceDevUpdateConfig = true;
  }

  checkForUpdates();

  // Inital screen count
  displayHandler.initialScreenCount = screen.getAllDisplays().length;

  screen.on('display-added', () => {
    displayHandler.onDisplayAdded();
  });
  screen.on('display-removed', () => {
    displayHandler.onDisplayRemoved();
  });

  app.on('browser-window-created', (_, window) => {
    // window.title works on Windows, window.tabbingIdentifier works on macOS
    const title = isMac ? window.tabbingIdentifier : window.title;

    if (title in allowedWindows) {
      // save the window handle (not the dom handle);
      allowedWindows[title].window = window;
      windowIdToAllowedWindows[window.id] = title;

      // set up events here...
      window.on('ready-to-show', () => {
        if (
          allowedWindows[windowIdToAllowedWindows[window.id]].honorVisibility == true &&
          allowedWindows[windowIdToAllowedWindows[window.id]].options.show == true
        ) {
          window.show();
        }
        // Send this event to first.js, this windows zoom level
        allowedWindows[windowIdToAllowedWindows[window.id]].window.webContents.send(
          'loadZoom',
          allowedWindows[windowIdToAllowedWindows[window.id]].options.zoom,
        );
        // Save the current bounds
        allowedWindows[windowIdToAllowedWindows[window.id]].tempBounds =
          allowedWindows[windowIdToAllowedWindows[window.id]].window.getBounds();
      });

      window.on('close', (event) => {
        // save all window(s) and position(s)
        let bounds = window.getBounds();
        if (window.id != 1) {
          if (mainWindowClosing == false) {
            // save, but don't close
            bounds.show = window.isVisible();
            window.hide();
            allowedWindows[windowIdToAllowedWindows[window.id]].options = {
              ...allowedWindows[windowIdToAllowedWindows[window.id]].options,
              ...bounds,
            };
            event.preventDefault();
          } else {
            // save, and let it close
            bounds.show = window.isVisible();
            allowedWindows[windowIdToAllowedWindows[window.id]].options = {
              ...allowedWindows[windowIdToAllowedWindows[window.id]].options,
              ...bounds,
            };
          }
        } else {
          mainWindowClosing = true;
          // Main window is 1, so really close all the others so we can save their info
          for (const windowId in windowIdToAllowedWindows) {
            if (windowId != 1) {
              allowedWindows[windowIdToAllowedWindows[windowId]].window.close();
            }
          }
          // save!
          allowedWindows['GridTracker2'].options = {
            ...allowedWindows['GridTracker2'].options,
            ...bounds,
          };
        }
      });

      window.on('move', () => {
        if (allowedWindows[windowIdToAllowedWindows[window.id]].boundsUpdateTimer != null) {
          timers.clearTimeout(
            allowedWindows[windowIdToAllowedWindows[window.id]].boundsUpdateTimer,
          );
        }
        allowedWindows[windowIdToAllowedWindows[window.id]].boundsUpdateTimer = timers.setTimeout(
          displayHandler.storeBounds,
          2000,
          windowIdToAllowedWindows[window.id],
        );
      });

      window.on('resize', () => {
        if (allowedWindows[windowIdToAllowedWindows[window.id]].boundsUpdateTimer != null) {
          timers.clearTimeout(
            allowedWindows[windowIdToAllowedWindows[window.id]].boundsUpdateTimer,
          );
        }
        allowedWindows[windowIdToAllowedWindows[window.id]].boundsUpdateTimer = timers.setTimeout(
          displayHandler.storeBounds,
          2000,
          windowIdToAllowedWindows[window.id],
        );
      });

      remoteMain.enable(window.webContents);

      window.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
      });
    } else if (window.id !== 1) {
      console.log(`WARNING: id: "${window.id}"  title: "${title}" not found in allowedWindows`);
    }

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    optimizer.watchWindowShortcuts(window);
  });

  createMainWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  const finalSettings = {};
  for (let window in allowedWindows) {
    finalSettings[window] = allowedWindows[window].options;
  }
  fs.writeFileSync(windowSettingsPath, JSON.stringify(finalSettings, null, 2));
  app.quit();
});

// this could be a class, never done one before if you can believe it.
// it does depend on allowedWindows, so i dunno
// C++ sure, Javascript nope!
const displayHandler = {
  initialScreenCount: 0,
  screenLost: false,
  onDisplayAdded: function () {
    displayHandler.clearAllBoundsTimers();
    if (
      displayHandler.screenLost == true &&
      displayHandler.initialScreenCount == screen.getAllDisplays().length
    ) {
      // Lets restore the positions now
      for (let win in allowedWindows) {
        if (allowedWindows[win].window != null) {
          allowedWindows[win].window.setBounds(allowedWindows[win].tempBounds);
        }
      }
      displayHandler.screenLost = false;
    }
  },
  onDisplayRemoved: function () {
    displayHandler.clearAllBoundsTimers();
    if (displayHandler.initialScreenCount != screen.getAllDisplays().length) {
      displayHandler.screenLost = true;
    }
  },
  clearAllBoundsTimers: function () {
    for (let win in allowedWindows) {
      if (allowedWindows[win].boundsUpdateTimer != null) {
        timers.clearTimeout(allowedWindows[win].boundsUpdateTimer);
        allowedWindows[win].boundsUpdateTimer = null;
      }
    }
  },
  storeBounds: function (windowName) {
    allowedWindows[windowName].tempBounds = allowedWindows[windowName].window.getBounds();
  },
};
