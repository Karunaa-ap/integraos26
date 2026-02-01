import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const RECORDS_FILE = path.join(DATA_DIR, "training-records.json")

function readRecords() {
  const data = fs.readFileSync(RECORDS_FILE, "utf-8")
  return JSON.parse(data)
}

function writeRecords(records: any[]) {
  fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2))
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const records = readRecords()
    const filtered = records.filter((r: any) => r.id !== params.id)
    writeRecords(filtered)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error deleting training record:", error)
    return NextResponse.json({ error: "Failed to delete training record" }, { status: 500 })
  }
}
