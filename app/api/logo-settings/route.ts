import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import path from 'path'
import os from 'os'
import { existsSync } from 'fs'

// Get writable user data directory
function getUserDataPath() {
  if (process.env.USER_DATA_PATH) {
    return process.env.USER_DATA_PATH
  }
  return path.join(os.homedir(), '.integraos')
}

export async function GET() {
  try {
    const userDataPath = getUserDataPath()
    const configPath = path.join(userDataPath, 'logo-config.json')
    
    if (!existsSync(configPath)) {
      // Return default config if file doesn't exist
      return NextResponse.json({
        logoPath: '/integra-logo.png',
        width: 240,
        height: 240,
        alt: 'Company Logo'
      })
    }
    
    const data = await readFile(configPath, 'utf-8')
    return NextResponse.json(JSON.parse(data))
  } catch (error) {
    console.error('Failed to read config:', error)
    return NextResponse.json(
      { error: 'Failed to read config' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('logo') as File | null
    const width = formData.get('width') as string
    const height = formData.get('height') as string
    const alt = formData.get('alt') as string

    const userDataPath = getUserDataPath()
    const uploadsDir = path.join(userDataPath, 'uploads')
    const configPath = path.join(userDataPath, 'logo-config.json')
    
    // Ensure directories exist
    if (!existsSync(userDataPath)) {
      await mkdir(userDataPath, { recursive: true })
    }
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }
    
    // Read existing config
    let existingConfig = {
      logoPath: '/integra-logo.png',
      width: 240,
      height: 240,
      alt: 'Company Logo'
    }
    
    try {
      const existingData = await readFile(configPath, 'utf-8')
      existingConfig = JSON.parse(existingData)
    } catch {
      // Config doesn't exist yet, use defaults
    }
    
    let logoPath = existingConfig.logoPath
    
    // If a new file was uploaded, save it
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      const fileName = `logo-${Date.now()}.png`
      const filePath = path.join(uploadsDir, fileName)
      
      await writeFile(filePath, buffer)
      
      // Return path accessible via API
      logoPath = `/api/uploads/${fileName}`
    }
    
    // Update config
    const config = {
      logoPath,
      width: parseInt(width) || 240,
      height: parseInt(height) || 240,
      alt: alt || 'Company Logo'
    }
    
    await writeFile(configPath, JSON.stringify(config, null, 2))
    
    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload logo' },
      { status: 500 }
    )
  }
}