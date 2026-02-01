import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const RECORDS_FILE = path.join(DATA_DIR, "training-records.json")

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

if (!fs.existsSync(RECORDS_FILE)) {
  fs.writeFileSync(RECORDS_FILE, JSON.stringify([]))
}

function readRecords() {
  const data = fs.readFileSync(RECORDS_FILE, "utf-8")
  return JSON.parse(data)
}

function writeRecords(records: any[]) {
  fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2))
}

export async function GET() {
  try {
    const records = readRecords()
    return NextResponse.json(records)
  } catch (error) {
    console.error("[API] Error getting training records:", error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const record = await request.json()
    const records = readRecords()
    records.push(record)
    writeRecords(records)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error creating training record:", error)
    return NextResponse.json({ error: "Failed to create training record" }, { status: 500 })
  }
}
