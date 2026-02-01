const { app, BrowserWindow, dialog, Menu, Tray, shell } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

let mainWindow
let nextServer
let tray

const PORT = 3443


// Allow self-signed certificates for local server
app.commandLine.appendSwitch('ignore-certificate-errors')

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
      name: 'IntegraOS-Server',
      location: 'Main Office'
    },
    license: {
      key: 'TRIAL'
    },
    kioskMode: false,
    serverMode: true
  }
}

function createDataDirectories() {
  const userDataPath = app.getPath('userData')
  const dirs = ['data', 'backups', 'uploads']
  
  for (const dir of dirs) {
    const dirPath = path.join(userDataPath, dir)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
      console.log('Created: ' + dirPath)
    }
  }
}

function getLocalIPAddress() {
  const nets = require('os').networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return 'localhost'
}

function startNextServer() {
  return new Promise((resolve) => {
    console.log('Starting IntegraOS server...')

    let serverPath
    if (app.isPackaged) {
      const possiblePaths = [
        path.join(process.resourcesPath, 'app', 'server.js'),
        path.join(process.resourcesPath, 'server.js'),
        path.join(__dirname, 'server.js'),
        path.join(app.getAppPath(), 'server.js')
      ]
      
      for (const p of possiblePaths) {
        console.log('Checking: ' + p)
        if (fs.existsSync(p)) {
          serverPath = p
          console.log('Found server at: ' + serverPath)
          break
        }
      }
      
      if (!serverPath) {
        console.error('ERROR: Could not find server.js')
        resolve()
        return
      }
    } else {
      serverPath = path.join(__dirname, 'server.js')
    }

    nextServer = spawn('node', [serverPath], {
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: PORT.toString(),
        USER_DATA_PATH: app.getPath('userData')
      },
      stdio: 'pipe'
    })

    let serverReady = false

    nextServer.stdout.on('data', (data) => {
      const output = data.toString()
      console.log('[Server] ' + output)
      
      if ((output.includes('ready') || output.includes('started')) && !serverReady) {
        serverReady = true
        console.log('Server ready')
        resolve()
      }
    })

    nextServer.stderr.on('data', (data) => {
      console.error('[Server Error] ' + data)
    })

    setTimeout(() => {
      if (!serverReady) {
        console.log('Server timeout - proceeding')
        resolve()
      }
    }, 15000)
  })
}

function createWindow(config) {
  console.log('Creating server window...')
  
  const localIP = getLocalIPAddress()
  
  mainWindow = new BrowserWindow({
    title: 'IntegraOS Server',
    width: 600,
    height: 400,
    resizable: false,
    frame: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
        webSecurity: false
    },
    icon: path.join(__dirname, 'public', 'favicon.ico')
  })

  // Create a simple status page
  const statusHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          padding: 40px;
          text-align: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          margin: 0;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        h1 { margin-bottom: 10px; font-size: 28px; }
        .status { 
          background: rgba(255,255,255,0.2); 
          padding: 20px; 
          border-radius: 10px;
          margin: 20px 0;
          backdrop-filter: blur(10px);
        }
        .ip { 
          font-size: 24px; 
          font-weight: bold; 
          color: #fff;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .info { 
          font-size: 14px; 
          opacity: 0.9; 
          margin-top: 10px;
        }
        .button {
          background: white;
          color: #667eea;
          border: none;
          padding: 12px 30px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 20px;
          transition: transform 0.2s;
        }
        .button:hover {
          transform: scale(1.05);
        }
      </style>
    </head>
    <body>
      <h1>✅ IntegraOS Server Running</h1>
      <div class="status">
        <p>Server is active at:</p>
        <div class="ip">https://${localIP}:${PORT}</div>
        <p class="info">Use this address to connect kiosks</p>
      </div>
      <button class="button" onclick="window.location.href='https://${localIP}:${PORT}'">Open Admin Panel</button>
      <p class="info" style="margin-top: 30px;">Keep this window open while kiosks are in use</p>
    </body>
    </html>
  `

  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(statusHTML))
  mainWindow.setMenu(null)

  // Handle "Open Admin Panel" button click
  mainWindow.webContents.on('will-navigate', (event, url) => {
 if (url.includes(':' + PORT)) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  mainWindow.on('close', (event) => {
    const response = dialog.showMessageBoxSync({
      type: 'warning',
      buttons: ['Cancel', 'Exit'],
      title: 'Exit IntegraOS Server',
      message: 'Shutting down the server will disconnect all kiosks.\n\nAre you sure you want to exit?',
      defaultId: 0
    })
    
    if (response === 0) {
      event.preventDefault()
    }
  })

  console.log('Server window created')
}

function createTray() {
  const iconPath = path.join(__dirname, 'public', 'favicon.ico')
  
  if (fs.existsSync(iconPath)) {
    tray = new Tray(iconPath)
    
    const contextMenu = Menu.buildFromTemplate([
      { label: 'IntegraOS Server', enabled: false },
      { type: 'separator' },
      {
        label: 'Open Admin Panel',
        click: () => {
          const localIP = getLocalIPAddress()
          shell.openExternal(`https://${localIP}:${PORT}`)
        }
      },
      {
        label: 'Show Window',
        click: () => {
          if (mainWindow) {
            mainWindow.show()
          }
        }
      },
      { type: 'separator' },
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
    
    tray.setToolTip('IntegraOS Server')
    tray.setContextMenu(contextMenu)
  }
}

app.whenReady().then(async () => {
  console.log('IntegraOS Server Starting...')
  console.log('Version: ' + app.getVersion())
  console.log('User Data: ' + app.getPath('userData'))

  try {
    createDataDirectories()
    const config = loadConfig()
    createTray()
    await startNextServer()
    await new Promise(resolve => setTimeout(resolve, 2000))
    createWindow(config)
    console.log('IntegraOS Server started successfully!')
  } catch (error) {
    console.error('Startup failed:', error)
    dialog.showErrorBox(
      'Startup Error',
      'IntegraOS Server failed to start:\n\n' + error.message
    )
    app.quit()
  }
})

app.on('window-all-closed', () => {
  // Server should keep running even if window is closed
  // Comment out the quit to keep server running in background
  // app.quit()
})

app.on('before-quit', () => {
  if (nextServer) {
    console.log('Stopping server...')
    nextServer.kill()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const config = loadConfig()
    createWindow(config)
  }
})
