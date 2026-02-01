import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const EMPLOYEES_FILE = path.join(DATA_DIR, "training-employees.json")

function readEmployees() {
  const data = fs.readFileSync(EMPLOYEES_FILE, "utf-8")
  return JSON.parse(data)
}

function writeEmployees(employees: any[]) {
  fs.writeFileSync(EMPLOYEES_FILE, JSON.stringify(employees, null, 2))
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const updates = await request.json()
    const employees = readEmployees()
    const index = employees.findIndex((e: any) => e.id === params.id)
    
    if (index === -1) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }
    
    employees[index] = { ...employees[index], ...updates }
    writeEmployees(employees)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error updating employee:", error)
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const employees = readEmployees()
    const filtered = employees.filter((e: any) => e.id !== params.id)
    writeEmployees(filtered)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error deleting employee:", error)
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 })
  }
}
