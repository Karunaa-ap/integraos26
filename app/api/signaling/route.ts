import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const SIGNALING_FILE = path.join(DATA_DIR, "signaling.json")

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

// Read signaling messages from file
async function readSignalingMessages() {
  try {
    await ensureDataDir()
    const data = await fs.readFile(SIGNALING_FILE, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    // If file doesn't exist or is invalid, return empty array
    return []
  }
}

// Write signaling messages to file
async function writeSignalingMessages(messages: any[]) {
  try {
    await ensureDataDir()
    await fs.writeFile(SIGNALING_FILE, JSON.stringify(messages, null, 2))
  } catch (error) {
    console.error("[v0] Error writing signaling messages:", error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const deviceId = searchParams.get("deviceId")

    if (!deviceId) {
      return NextResponse.json({ error: "Device ID required" }, { status: 400 })
    }

    const messages = await readSignalingMessages()

    // Filter messages for this device
    const deviceMessages = messages.filter((msg: any) => msg.to === deviceId)

    // Remove retrieved messages from the file
    const remainingMessages = messages.filter((msg: any) => msg.to !== deviceId)
    await writeSignalingMessages(remainingMessages)

    return NextResponse.json(deviceMessages)
  } catch (error) {
    console.error("[v0] Error in GET /api/signaling:", error)
    return NextResponse.json({ error: "Failed to get signaling messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { from, to, type, data } = body

    if (!from || !to || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const messages = await readSignalingMessages()

    // Add new message
    messages.push({
      from,
      to,
      type,
      data,
      timestamp: Date.now(),
    })

    await writeSignalingMessages(messages)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in POST /api/signaling:", error)
    return NextResponse.json({ error: "Failed to send signaling message" }, { status: 500 })
  }
}
