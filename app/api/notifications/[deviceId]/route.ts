import { NextResponse } from "next/server"

interface Notification {
  id: string
  deviceId: string
  from_device: string
  type: string
  title: string
  message?: string
  data?: any
  read: boolean
  timestamp: number
}

// In-memory storage
let notifications: Notification[] = []

// GET - Retrieve notifications for a device
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const deviceId = url.searchParams.get("deviceId")
    const unreadOnly = url.searchParams.get("unreadOnly") === "true"

    console.log("[v0] [API] GET /api/notifications - deviceId:", deviceId, "unreadOnly:", unreadOnly)

    if (!deviceId) {
      return NextResponse.json({ error: "Device ID required" }, { status: 400 })
    }

    // Filter notifications for this device
    let deviceNotifications = notifications.filter((n) => n.deviceId === deviceId)

    // Filter unread only if requested
    if (unreadOnly) {
      deviceNotifications = deviceNotifications.filter((n) => !n.read)
    }

    console.log("[v0] [API] Found notifications:", deviceNotifications.length)
    return NextResponse.json(deviceNotifications)
  } catch (error) {
    console.error("[v0] [API] Error getting notifications:", error)
    return NextResponse.json({ error: "Failed to get notifications" }, { status: 500 })
  }
}

// POST - Create new notification
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { toDevice, fromDevice, type, title, message, data } = body

    console.log("[v0] [API] POST /api/notifications - Creating notification")

    const newNotification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deviceId: toDevice,
      from_device: fromDevice,
      type,
      title,
      message,
      data,
      read: false,
      timestamp: Date.now(),
    }

    notifications.push(newNotification)

    // Keep only last 500 notifications
    if (notifications.length > 500) {
      notifications = notifications.slice(-500)
    }

    return NextResponse.json({ success: true, notification: newNotification })
  } catch (error) {
    console.error("[v0] [API] Error creating notification:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

// PATCH - Mark notification as read
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { notificationId } = body

    console.log("[v0] [API] PATCH /api/notifications - Marking as read:", notificationId)

    // Find and mark as read
    const notification = notifications.find((n) => n.id === notificationId)
    if (notification) {
      notification.read = true
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Notification not found" }, { status: 404 })
  } catch (error) {
    console.error("[v0] [API] Error marking notification as read:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
