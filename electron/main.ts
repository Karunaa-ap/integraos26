import { app, BrowserWindow } from "electron"
import path from "path"
import { spawn, type ChildProcess } from "child_process"

let mainWindow: BrowserWindow | null = null
let serverProcess: ChildProcess | null = null

function startServer() {
  const isDev = !app.isPackaged
  const serverPath = isDev
    ? path.join(__dirname, "../server/index.js")
    : path.join(process.resourcesPath, "server/index.js")

  serverProcess = spawn("node", [serverPath], {
    env: {
      ...process.env,
      SERVER_PORT: "3001",
    },
  })

  serverProcess.stdout?.on("data", (data) => {
    console.log(`[Server] ${data}`)
  })

  serverProcess.stderr?.on("data", (data) => {
    console.error(`[Server Error] ${data}`)
  })

  serverProcess.on("close", (code) => {
    console.log(`[Server] Process exited with code ${code}`)
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, "../public/integra-logo.png"),
    title: "Integra OS",
    autoHideMenuBar: true,
    fullscreen: false,
  })

  const isDev = !app.isPackaged

  if (isDev) {
    setTimeout(() => {
      mainWindow?.loadURL("http://localhost:3000")
    }, 2000)
  } else {
    const indexPath = path.join(__dirname, "../out/index.html")
    mainWindow?.loadFile(indexPath)
  }

  mainWindow.on("closed", () => {
    mainWindow = null
  })
}

app.on("ready", () => {
  startServer()
  createWindow()
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow()
  }
})

app.on("quit", () => {
  if (serverProcess) {
    serverProcess.kill()
  }
})
