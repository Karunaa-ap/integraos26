const { app, BrowserWindow, dialog, Menu, Tray, shell, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow
let tray

function loadConfig() {
  const configPath = path.join(app.getPath('userData'), 'config.json')
  
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading config:', error)
  }
  
  return {
    device: {
      name: 'Kiosk-1',
      location: 'Not configured'
    },
    serverUrl: null, // Will be set on first launch
    kioskMode: true
  }
}

function saveConfig(config) {
  const configPath = path.join(app.getPath('userData'), 'config.json')
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    console.log('Config saved')
  } catch (error) {
    console.error('Error saving config:', error)
  }
}

function showSetupDialog() {
  return new Promise((resolve) => {
    const setupWindow = new BrowserWindow({
      title: 'IntegraOS Kiosk Setup',
      width: 500,
      height: 400,
      resizable: false,
      frame: true,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    })

    const setupHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          h1 { margin-bottom: 10px; font-size: 24px; text-align: center; }
          .form-group { margin: 20px 0; }
          label { display: block; margin-bottom: 8px; font-weight: 600; }
          input {
            width: 100%;
            padding: 12px;
            font-size: 16px;
            border: none;
            border-radius: 6px;
            box-sizing: border-box;
          }
          button {
            width: 100%;
            background: white;
            color: #667eea;
            border: none;
            padding: 15px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 20px;
            transition: transform 0.2s;
          }
          button:hover { transform: scale(1.02); }
          button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .info {
            background: rgba(255,255,255,0.2);
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 14px;
          }
          .error {
            color: #ffcccb;
            margin-top: 10px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <h1>🖥️ IntegraOS Kiosk Setup</h1>
        <div class="info">
          Enter the IP address of your IntegraOS Server.<br>
          You can find this on the server computer's status window.
        </div>
        <div class="form-group">
          <label>Server IP Address:</label>
          <input 
            type="text" 
            id="serverIP" 
            placeholder="192.168.1.100" 
            value="localhost"
          />
        </div>
        <div class="form-group">
          <label>Kiosk Name (optional):</label>
          <input 
            type="text" 
            id="kioskName" 
            placeholder="Manufacturing Floor - Station 1"
          />
        </div>
        <button onclick="connect()">Connect to Server</button>
        <div id="error" class="error"></div>
        <script>
          const { ipcRenderer } = require('electron')
          
          function connect() {
            const serverIP = document.getElementById('serverIP').value.trim()
            const kioskName = document.getElementById('kioskName').value.trim() || 'Kiosk-1'
            const errorDiv = document.getElementById('error')
            
            if (!serverIP) {
              errorDiv.textContent = 'Please enter a server IP address'
              return
            }
            
            // Disable button
            document.querySelector('button').disabled = true
            errorDiv.textContent = 'Connecting...'
            
            ipcRenderer.send('save-server-config', { serverIP, kioskName })
          }
          
          // Allow Enter key to submit
          document.getElementById('serverIP').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') connect()
          })
          document.getElementById('kioskName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') connect()
          })
        </script>
      </body>
      </html>
    `

    setupWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(setupHTML))

    ipcMain.once('save-server-config', (event, data) => {
      setupWindow.close()
      resolve({
        serverUrl: `https://${data.serverIP}:3443`,
        kioskName: data.kioskName
      })
    })

    setupWindow.on('closed', () => {
      if (!setupWindow.isDestroyed()) {
        resolve(null)
      }
    })
  })
}

function createWindow(config) {
  console.log('Creating kiosk window...')
  console.log('Device: ' + config.device.name)
  console.log('Server: ' + config.serverUrl)
  console.log('Kiosk Mode: ' + config.kioskMode)

  mainWindow = new BrowserWindow({
    title: 'IntegraOS - ' + config.device.name,
    width: 1920,
    height: 1080,
    fullscreen: true,
    kiosk: config.kioskMode,
    frame: !config.kioskMode,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'public', 'favicon.ico')
  })

  // Load from server
  mainWindow.loadURL(config.serverUrl)
  mainWindow.setMenu(null)

  // Grant geolocation permission for weather widget
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'geolocation') {
      callback(true)
    } else {
      callback(false)
    }
  })

  // Handle external links - open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(config.serverUrl)) {
      return { action: 'allow' }
    }
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Also handle navigation to external sites
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(config.serverUrl)) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  // Handle connection errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorDescription)
    
    const errorHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            text-align: center;
            background: #f5f5f5;
          }
          .error-box {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 500px;
            margin: 50px auto;
          }
          h1 { color: #e74c3c; }
          button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px;
          }
          button:hover { opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="error-box">
          <h1>⚠️ Connection Failed</h1>
          <p>Cannot connect to IntegraOS Server at:</p>
          <p><strong>${config.serverUrl}</strong></p>
          <p>Please check:</p>
          <ul style="text-align: left; display: inline-block;">
            <li>Server is running</li>
            <li>IP address is correct</li>
            <li>Network connection is active</li>
          </ul>
          <button onclick="location.reload()">Retry</button>
          <button onclick="require('electron').ipcRenderer.send('reconfigure')">Change Server</button>
        </div>
      </body>
      </html>
    `
    
    mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHTML))
  })

  if (app.isPackaged) {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools()
    })
  }

  mainWindow.on('close', (event) => {
    if (config.kioskMode) {
      const response = dialog.showMessageBoxSync({
        type: 'warning',
        buttons: ['Cancel', 'Exit'],
        title: 'Exit IntegraOS',
        message: 'Are you sure you want to exit?',
        defaultId: 0
      })
      
      if (response === 0) {
        event.preventDefault()
      }
    }
  })

  console.log('Kiosk window created')
}

// Handle reconfigure request
ipcMain.on('reconfigure', async () => {
  if (mainWindow) {
    mainWindow.close()
  }
  
  const setupResult = await showSetupDialog()
  if (setupResult) {
    const config = loadConfig()
    config.serverUrl = setupResult.serverUrl
    config.device.name = setupResult.kioskName
    saveConfig(config)
    createWindow(config)
  } else {
    app.quit()
  }
})

function createTray() {
  const iconPath = path.join(__dirname, 'public', 'favicon.ico')
  
  if (fs.existsSync(iconPath)) {
    tray = new Tray(iconPath)
    
    const contextMenu = Menu.buildFromTemplate([
      { label: 'IntegraOS Kiosk', enabled: false },
      { type: 'separator' },
      {
        label: 'Reconfigure Server',
        click: async () => {
          if (mainWindow) {
            mainWindow.close()
          }
          
          const setupResult = await showSetupDialog()
          if (setupResult) {
            const config = loadConfig()
            config.serverUrl = setupResult.serverUrl
            config.device.name = setupResult.kioskName
            saveConfig(config)
            createWindow(config)
          }
        }
      },
      {
        label: 'Restart',
        click: () => {
          app.relaunch()
          app.exit()
        }
      },
      {
        label: 'Exit',
        click: () => app.quit()
      }
    ])
    
    tray.setToolTip('IntegraOS Kiosk')
    tray.setContextMenu(contextMenu)
  }
}

app.whenReady().then(async () => {
  console.log('IntegraOS Kiosk Starting...')
  console.log('Version: ' + app.getVersion())
  console.log('User Data: ' + app.getPath('userData'))

  try {
    let config = loadConfig()
    createTray()
    
    // If no server configured, show setup dialog
    if (!config.serverUrl) {
      const setupResult = await showSetupDialog()
      
      if (!setupResult) {
        console.log('Setup cancelled')
        app.quit()
        return
      }
      
      config.serverUrl = setupResult.serverUrl
      config.device.name = setupResult.kioskName
      saveConfig(config)
    }
    
    createWindow(config)
    console.log('IntegraOS Kiosk started successfully!')
  } catch (error) {
    console.error('Startup failed:', error)
    dialog.showErrorBox(
      'Startup Error',
      'IntegraOS Kiosk failed to start:\n\n' + error.message
    )
    app.quit()
  }
})

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const config = loadConfig()
    if (config.serverUrl) {
      createWindow(config)
    }
  }
})
