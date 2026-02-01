import { NextRequest, NextResponse } from "next/server"
import { unlink } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 })
    }

    // Extract filename from URL
    const filename = url.split("/").pop()
    const filepath = path.join(process.cwd(), "public", "uploads", "pdfs", filename)

    // Check if file exists
    if (existsSync(filepath)) {
      await unlink(filepath)
      return NextResponse.json({ success: true }, { status: 200 })
    } else {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error deleting PDF:", error)
    return NextResponse.json({ error: "Failed to delete PDF" }, { status: 500 })
  }
}
