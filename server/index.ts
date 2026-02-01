import express from "express"
import http from "http"
import https from "https"
import fs from "fs"
import path from "path"
import cors from "cors"
import Database from "better-sqlite3"
import multer from "multer"
import { networkInterfaces } from "os"

const app = express()
const HTTP_PORT = process.env.HTTP_PORT || 3001
const HTTPS_PORT = process.env.HTTPS_PORT || 3443

// Middleware
app.use(cors())
app.use(express.json({ limit: "50mb" }))

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// Get full state
app.get("/api/state", (req, res) => {
  try {
    const row = db.prepare("SELECT data FROM state WHERE id = 1").get() as { data: string } | undefined
    if (row) {
      res.json(JSON.parse(row.data))
    } else {
      res.json(null)
    }
  } catch (error) {
    console.error("[Server] Error getting state:", error)
    res.status(500).json({ error: "Failed to get state" })
  }
})

// Save full state
app.post("/api/state", (req, res) => {
  try {
    const deviceId = (req.headers["x-device-id"] as string) || "unknown"
    const timestamp = Date.now()

    // Add metadata to state
    const stateWithMetadata = {
      ...req.body,
      lastModified: timestamp,
      modifiedBy: deviceId,
    }

    const stateData = JSON.stringify(stateWithMetadata)

    console.log(`[Server] Saving state from device: ${deviceId} at ${new Date(timestamp).toISOString()}`)

    db.prepare(`
      INSERT INTO state (id, data, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET data = ?, updated_at = CURRENT_TIMESTAMP
    `).run(stateData, stateData)

    console.log("[Server] State saved successfully")

    res.json({ success: true, lastModified: timestamp })
  } catch (error) {
    console.error("[Server] Error saving state:", error)
    res.status(500).json({ error: "Failed to save state" })
  }
})

const uploadsDir = path.join(__dirname, "uploads", "pdfs")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    cb(null, `${uniqueSuffix}-${file.originalname}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true)
    } else {
      cb(new Error("Only PDF files are allowed"))
    }
  },
})

app.use("/uploads/pdfs", express.static(uploadsDir))

// Upload PDF
app.post("/api/upload-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    // Return the URL path to access the file
    const fileUrl = `/uploads/pdfs/${req.file.filename}`

    console.log(`[Server] PDF uploaded: ${req.file.filename}`)

    res.json({ url: fileUrl })
  } catch (error) {
    console.error("[Server] Error uploading PDF:", error)
    res.status(500).json({ error: "Failed to upload PDF" })
  }
})

// Delete PDF
app.delete("/api/delete-pdf", async (req, res) => {
  try {
    const { url } = req.body
    if (!url) {
      return res.status(400).json({ error: "Missing URL" })
    }

    // Extract filename from URL path
    const filename = path.basename(url)
    const filePath = path.join(uploadsDir, filename)

    // Check if file exists and delete it
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`[Server] PDF deleted: ${filename}`)
      res.json({ success: true })
    } else {
      console.warn(`[Server] PDF not found: ${filename}`)
      res.status(404).json({ error: "File not found" })
    }
  } catch (error) {
    console.error("[Server] Error deleting PDF:", error)
    res.status(500).json({ error: "Failed to delete PDF" })
  }
})

app.post("/api/devices/register", (req, res) => {
  try {
    const { deviceId, deviceName } = req.body
    if (!deviceId || !deviceName) {
      return res.status(400).json({ error: "Missing deviceId or deviceName" })
    }

    db.prepare(`
      INSERT INTO devices (id, name, last_seen, created_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET 
        name = ?,
        last_seen = CURRENT_TIMESTAMP
    `).run(deviceId, deviceName, deviceName)

    res.json({ success: true })
  } catch (error) {
    console.error("[Server] Error registering device:", error)
    res.status(500).json({ error: "Failed to register device" })
  }
})

app.patch("/api/devices/:deviceId", (req, res) => {
  try {
    const { deviceId } = req.params
    const { deviceName } = req.body

    if (!deviceName) {
      return res.status(400).json({ error: "Missing deviceName" })
    }

    db.prepare(`
      UPDATE devices 
      SET name = ?, last_seen = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(deviceName, deviceId)

    res.json({ success: true })
  } catch (error) {
    console.error("[Server] Error updating device:", error)
    res.status(500).json({ error: "Failed to update device" })
  }
})

app.get("/api/devices", (req, res) => {
  try {
    const devices = db
      .prepare(`
      SELECT id, name, last_seen, created_at 
      FROM devices 
      ORDER BY last_seen DESC
    `)
      .all()

    res.json(devices)
  } catch (error) {
    console.error("[Server] Error getting devices:", error)
    res.status(500).json({ error: "Failed to get devices" })
  }
})

// Initialize SQLite database
const dbPath = path.join(__dirname, "integra-data.db")
const db = new Database(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pdfs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    pinned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS custom_apps (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    to_device TEXT NOT NULL,
    from_device TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data TEXT,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    from_device TEXT NOT NULL,
    to_device TEXT NOT NULL,
    text TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS signaling_messages (
    id TEXT PRIMARY KEY,
    from_device TEXT NOT NULL,
    to_device TEXT NOT NULL,
    type TEXT NOT NULL,
    data TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    position TEXT NOT NULL,
    hire_date TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS training_records (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    training_id TEXT NOT NULL,
    training_type TEXT NOT NULL,
    completed_date TEXT NOT NULL,
    expiry_date TEXT,
    score INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
  );
`)

// Get messages
app.get("/api/messages", (req, res) => {
  try {
    console.log("[Server] GET /api/messages - Fetching all messages")

    const messages = db
      .prepare(`
        SELECT id, from_device as "from", to_device as "to", text, timestamp
        FROM messages 
        ORDER BY timestamp DESC 
        LIMIT 1000
      `)
      .all()

    console.log(`[Server] Found ${messages.length} messages`)
    res.json({ messages })
  } catch (error) {
    console.error("[Server] Error getting messages:", error)
    res.status(500).json({ messages: [] })
  }
})

// Send message
app.post("/api/messages", (req, res) => {
  try {
    const { id, from, to, text, timestamp } = req.body

    console.log("[Server] POST /api/messages - Saving message:", { id, from, to, text })

    if (!id || !from || !to || !text || !timestamp) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    db.prepare(`
      INSERT INTO messages (id, from_device, to_device, text, timestamp, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(id, from, to, text, timestamp)

    console.log("[Server] Message saved successfully")

    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    db.prepare(`
      INSERT INTO notifications (id, to_device, from_device, type, title, message, created_at)
      VALUES (?, ?, ?, 'message', 'New Message', ?, CURRENT_TIMESTAMP)
    `).run(notificationId, to, from, text)

    console.log(`[Server] Notification sent to device ${to}`)

    res.json({ success: true })
  } catch (error) {
    console.error("[Server] Error saving message:", error)
    res.status(500).json({ success: false, error: "Failed to save message" })
  }
})

app.post("/api/notifications", (req, res) => {
  try {
    const { toDevice, fromDevice, type, title, message, data } = req.body

    if (!toDevice || !fromDevice || !type || !title) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    db.prepare(`
      INSERT INTO notifications (id, to_device, from_device, type, title, message, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(notificationId, toDevice, fromDevice, type, title, message || null, data ? JSON.stringify(data) : null)

    console.log(`[Server] Notification sent: ${type} from ${fromDevice} to ${toDevice}`)

    res.json({ success: true, notificationId })
  } catch (error) {
    console.error("[Server] Error creating notification:", error)
    res.status(500).json({ error: "Failed to create notification" })
  }
})

app.get("/api/notifications/:deviceId", (req, res) => {
  try {
    const { deviceId } = req.params
    const { unreadOnly } = req.query

    let query = "SELECT * FROM notifications WHERE to_device = ?"
    const params: any[] = [deviceId]

    if (unreadOnly === "true") {
      query += " AND read = 0"
    }

    query += " ORDER BY created_at DESC LIMIT 50"

    const notifications = db.prepare(query).all(...params)

    // Parse JSON data field
    const parsedNotifications = notifications.map((n: any) => ({
      ...n,
      data: n.data ? JSON.parse(n.data) : null,
      read: Boolean(n.read),
    }))

    res.json(parsedNotifications)
  } catch (error) {
    console.error("[Server] Error fetching notifications:", error)
    res.status(500).json({ error: "Failed to fetch notifications" })
  }
})

app.patch("/api/notifications/:notificationId/read", (req, res) => {
  try {
    const { notificationId } = req.params

    db.prepare("UPDATE notifications SET read = 1 WHERE id = ?").run(notificationId)

    res.json({ success: true })
  } catch (error) {
    console.error("[Server] Error marking notification as read:", error)
    res.status(500).json({ error: "Failed to mark notification as read" })
  }
})

app.delete("/api/notifications/:notificationId", (req, res) => {
  try {
    const { notificationId } = req.params

    db.prepare("DELETE FROM notifications WHERE id = ?").run(notificationId)

    res.json({ success: true })
  } catch (error) {
    console.error("[Server] Error deleting notification:", error)
    res.status(500).json({ error: "Failed to delete notification" })
  }
})

app.get("/api/signaling", (req, res) => {
  try {
    const { deviceId } = req.query

    if (!deviceId) {
      return res.status(400).json({ error: "Missing deviceId" })
    }

    // Get all signaling messages for this device
    const messages = db
      .prepare(`
        SELECT * FROM signaling_messages 
        WHERE to_device = ? 
        ORDER BY created_at ASC
      `)
      .all(deviceId)

    // Parse JSON data field
    const parsedMessages = messages.map((m: any) => ({
      id: m.id,
      from: m.from_device,
      to: m.to_device,
      type: m.type,
      data: m.data ? JSON.parse(m.data) : null,
      timestamp: m.timestamp,
    }))

    // Delete the messages after retrieving them (they've been consumed)
    if (parsedMessages.length > 0) {
      const ids = parsedMessages.map((m) => m.id)
      const placeholders = ids.map(() => "?").join(",")
      db.prepare(`DELETE FROM signaling_messages WHERE id IN (${placeholders})`).run(...ids)
    }

    res.json({ messages: parsedMessages })
  } catch (error) {
    console.error("[Server] Error getting signaling messages:", error)
    res.status(500).json({ messages: [] })
  }
})

app.post("/api/signaling", (req, res) => {
  try {
    const { id, from, to, type, data, timestamp } = req.body

    if (!id || !from || !to || !type || !data) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    db.prepare(`
      INSERT INTO signaling_messages (id, from_device, to_device, type, data, timestamp, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(id, from, to, type, JSON.stringify(data), timestamp)

    console.log(`[Server] Signaling message saved: ${type} from ${from} to ${to}`)

    res.json({ success: true })
  } catch (error) {
    console.error("[Server] Error saving signaling message:", error)
    res.status(500).json({ success: false, error: "Failed to save signaling message" })
  }
})

app.get("/api/employees", (req, res) => {
  try {
    const employees = db
      .prepare(`
        SELECT id, name, department, position, hire_date as hireDate, created_at as createdAt
        FROM employees 
        ORDER BY name ASC
      `)
      .all()

    res.json(employees)
  } catch (error) {
    console.error("[Server] Error getting employees:", error)
    res.status(500).json({ error: "Failed to get employees" })
  }
})

app.post("/api/employees", (req, res) => {
  try {
    const { id, name, department, position, hireDate, createdAt } = req.body

    if (!id || !name || !department || !position || !hireDate) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    db.prepare(`
      INSERT INTO employees (id, name, department, position, hire_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, department, position, hireDate, createdAt || Date.now())

    console.log(`[Server] Employee created: ${name}`)
    res.json({ success: true })
  } catch (error) {
    console.error("[Server] Error creating employee:", error)
    res.status(500).json({ error: "Failed to create employee" })
  }
})

app.put("/api/employees/:id", (req, res) => {
  try {
    const { id } = req.params
    const { name, department, position, hireDate } = req.body

    if (!name || !department || !position || !hireDate) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    db.prepare(`
      UPDATE employees 
      SET name = ?, department = ?, position = ?, hire_date = ?
      WHERE id = ?
    `).run(name, department, position, hireDate, id)

    console.log(`[Server] Employee updated: ${id}`)
    res.json({ success: true })
  } catch (error) {
    console.error("[Server] Error updating employee:", error)
    res.status(500).json({ error: "Failed to update employee" })
  }
})

app.delete("/api/employees/:id", (req, res) => {
  try {
    const { id } = req.params

    db.prepare("DELETE FROM employees WHERE id = ?").run(id)
    db.prepare("DELETE FROM training_records WHERE employee_id = ?").run(id)

    console.log(`[Server] Employee deleted: ${id}`)
    res.json({ success: true })
  } catch (error) {
    console.error("[Server] Error deleting employee:", error)
    res.status(500).json({ error: "Failed to delete employee" })
  }
})

app.get("/api/training-records", (req, res) => {
  try {
    const records = db
      .prepare(`
        SELECT 
          id, 
          employee_id as employeeId, 
          training_id as trainingId, 
          training_type as trainingType,
          completed_date as completedDate,
          expiry_date as expiryDate,
          score,
          notes
        FROM training_records 
        ORDER BY completed_date DESC
      `)
      .all()

    res.json(records)
  } catch (error) {
    console.error("[Server] Error getting training records:", error)
    res.status(500).json({ error: "Failed to get training records" })
  }
})

app.post("/api/training-records", (req, res) => {
  try {
    const { id, employeeId, trainingId, trainingType, completedDate, expiryDate, score, notes } = req.body

    if (!id || !employeeId || !trainingId || !trainingType || !completedDate) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    db.prepare(`
      INSERT INTO training_records (id, employee_id, training_id, training_type, completed_date, expiry_date, score, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, employeeId, trainingId, trainingType, completedDate, expiryDate || null, score || null, notes || null)

    console.log(`[Server] Training record created for employee: ${employeeId}`)
    res.json({ success: true })
  } catch (error) {
    console.error("[Server] Error creating training record:", error)
    res.status(500).json({ error: "Failed to create training record" })
  }
})

app.delete("/api/training-records/:id", (req, res) => {
  try {
    const { id } = req.params

    db.prepare("DELETE FROM training_records WHERE id = ?").run(id)

    console.log(`[Server] Training record deleted: ${id}`)
    res.json({ success: true })
  } catch (error) {
    console.error("[Server] Error deleting training record:", error)
    res.status(500).json({ error: "Failed to delete training record" })
  }
})

const httpServer = http.createServer(app)
httpServer.listen(HTTP_PORT, () => {
  console.log(`[Integra Server] HTTP server running on http://localhost:${HTTP_PORT}`)
  console.log(`[Integra Server] Database: ${dbPath}`)
})

const certPath = path.join(__dirname, "certs")
if (!fs.existsSync(certPath)) {
  fs.mkdirSync(certPath, { recursive: true })
}

const keyPath = path.join(certPath, "key.pem")
const certFilePath = path.join(certPath, "cert.pem")

// Function to get all local IP addresses dynamically
function getLocalIPAddresses(): string {
  const ips: string[] = ['127.0.0.1']
  const nets = networkInterfaces()
  
  for (const name of Object.keys(nets)) {
    const netList = nets[name]
    if (netList) {
      for (const net of netList) {
        // Skip internal (loopback) and non-IPv4 addresses
        if (net.family === 'IPv4' && !net.internal) {
          ips.push(net.address)
        }
      }
    }
  }
  
  return ips.map(ip => `IP:${ip}`).join(',')
}

// Check if certificates exist, if not, create self-signed ones
if (!fs.existsSync(keyPath) || !fs.existsSync(certFilePath)) {
  console.log("[Integra Server] Generating self-signed SSL certificates...")
  const { execSync } = require("child_process")
  try {
    const subjectAltName = `DNS:localhost,${getLocalIPAddresses()}`
    console.log(`[Integra Server] Certificate will include: ${subjectAltName}`)

    execSync(
      `openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certFilePath}" -days 365 -nodes -subj "/CN=localhost" -addext "subjectAltName=${subjectAltName}"`,
      { stdio: "inherit" }
    )
    console.log("[Integra Server] SSL certificates generated successfully")
  } catch (error) {
    console.error("[Integra Server] Failed to generate SSL certificates:", error)
    console.error("[Integra Server] HTTPS will not be available")
  }
}

// Start HTTPS server if certificates exist
if (fs.existsSync(keyPath) && fs.existsSync(certFilePath)) {
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certFilePath),
  }

  const httpsServer = https.createServer(httpsOptions, app)
  httpsServer.listen(HTTPS_PORT, () => {
    console.log(`[Integra Server] HTTPS server running on https://localhost:${HTTPS_PORT}`)
    console.log(`[Integra Server] Use HTTPS for camera/microphone access`)
    console.log(`[Integra Server] Note: Self-signed certificate - browsers will show security warning`)
  })
} else {
  console.warn("[Integra Server] HTTPS not available - SSL certificates not found")
  console.warn("[Integra Server] Camera/microphone features will not work without HTTPS")
}