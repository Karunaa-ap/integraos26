import { NextResponse } from "next/server"

const FULCRUM_BASE = "https://integrasystems.fulcrumpro.com/api/v2"

export async function GET() {
  const apiKey = process.env.FULCRUM_API_KEY

  if (!apiKey) {
    console.error("Missing API key")
    return NextResponse.json({ employees: [] })
  }

  try {
    // 🔥 THIS IS THE CORRECT ENDPOINT
    const res = await fetch(`${FULCRUM_BASE}/employees`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json"
      }
    })

    if (!res.ok) {
      const text = await res.text()
      console.error("Fulcrum employee fetch failed:", res.status, text)
      return NextResponse.json({ employees: [] })
    }

    const data = await res.json()
    console.log("[FULCRUM] RAW EMPLOYEES:", data)

    // Map to something your frontend expects
    const employees = data.employees.map((emp: any) => ({
      id: String(emp.id),
      firstName: emp.firstName ?? emp.first_name ?? "",
      lastName: emp.lastName ?? emp.last_name ?? "",
      employeeNumber:
        emp.employeeNumber ??
        emp.badgeNumber ??
        emp.number ??
        emp.externalId ??
        emp.custom_fields?.pin ??
        ""
    }))

    console.log("[FULCRUM] MAPPED EMPLOYEES:", employees)

    return NextResponse.json({ employees })
  } catch (err) {
    console.error("Employee route error:", err)
    return NextResponse.json({ employees: [] })
  }
}
