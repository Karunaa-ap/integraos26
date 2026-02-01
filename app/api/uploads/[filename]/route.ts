import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import os from 'os'

function getUserDataPath() {
  if (process.env.USER_DATA_PATH) {
    return process.env.USER_DATA_PATH
  }
  return path.join(os.homedir(), '.integraos')
}

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const userDataPath = getUserDataPath()
    const filePath = path.join(userDataPath, 'uploads', params.filename)
    
    const fileBuffer = await readFile(filePath)
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    )
  }
}
