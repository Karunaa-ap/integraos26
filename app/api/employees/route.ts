import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const EMPLOYEES_FILE = path.join(DATA_DIR, "training-employees.json")

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

if (!fs.existsSync(EMPLOYEES_FILE)) {
  fs.writeFileSync(EMPLOYEES_FILE, JSON.stringify([]))
}

function readEmployees() {
  const data = fs.readFileSync(EMPLOYEES_FILE, "utf-8")
  return JSON.parse(data)
}

function writeEmployees(employees: any[]) {
  fs.writeFileSync(EMPLOYEES_FILE, JSON.stringify(employees, null, 2))
}

export async function GET() {
  try {
    const employees = readEmployees()
    return NextResponse.json(employees)
  } catch (error) {
    console.error("[API] Error getting employees:", error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const employee = await request.json()
    console.log("[API] Creating employee:", employee)
    
    const employees = readEmployees()
    employees.push(employee)
    writeEmployees(employees)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error creating employee:", error)
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 })
  }
}
