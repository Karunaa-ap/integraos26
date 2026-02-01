// API client for communicating with local server

import type { IntegraSyncedData } from "./integra-state"

const getApiBaseUrl = () => {
  // Always use relative URLs in the browser to work with the current domain
  if (typeof window !== "undefined") {
    return ""
  }
  // Server-side rendering fallback
  return ""
}

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getApiBaseUrl()
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`)
      return response.ok
    } catch (error) {
      console.error("[API] Health check failed:", error)
      return false
    }
  }

  async getState(): Promise<IntegraSyncedData | null> {
    try {
      console.log("[v0] [Client] Fetching state from:", `${this.baseUrl}/api/state`)
      const response = await fetch(`${this.baseUrl}/api/state`)
      if (!response.ok) throw new Error("Failed to get state")
      const state = await response.json()
      console.log("[v0] [Client] State fetched:", state ? "success" : "null")
      return state
    } catch (error) {
      console.error("[v0] [Client] Error getting state:", error)
      return null
    }
  }

  async saveState(state: IntegraSyncedData): Promise<{ success: boolean; lastModified?: number }> {
    try {
      const deviceId =
        typeof window !== "undefined" ? localStorage.getItem("integra_device_id") || "unknown" : "unknown"

      console.log("[v0] [Client] Saving state from device:", deviceId)

      const response = await fetch(`${this.baseUrl}/api/state`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": deviceId,
        },
        body: JSON.stringify(state),
      })

      if (!response.ok) throw new Error("Failed to save state")
      const result = await response.json()
      console.log("[v0] [Client] Save result:", result)
      return result
    } catch (error) {
      console.error("[v0] [Client] Error saving state:", error)
      return { success: false }
    }
  }

  async uploadPdf(file: File): Promise<string | null> {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`${this.baseUrl}/api/upload-pdf`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to upload PDF")
      const data = await response.json()

      return data.url
    } catch (error) {
      console.error("[API] Error uploading PDF:", error)
      return null
    }
  }

  async deletePdf(url: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/delete-pdf`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      return response.ok
    } catch (error) {
      console.error("[API] Error deleting PDF:", error)
      return false
    }
  }

  async registerDevice(deviceId: string, deviceName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/devices/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, deviceName }),
      })
      return response.ok
    } catch (error) {
      console.error("[API] Error registering device:", error)
      return false
    }
  }

  async updateDeviceName(deviceId: string, deviceName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/devices/${deviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceName }),
      })
      return response.ok
    } catch (error) {
      console.error("[API] Error updating device name:", error)
      return false
    }
  }

  async getDevices(): Promise<any[]> {
    try {
      console.log("[v0] [API Client] Fetching devices from:", `${this.baseUrl}/api/devices`)
      const response = await fetch(`${this.baseUrl}/api/devices`)
      if (!response.ok) {
        console.error("[v0] [API Client] Failed to fetch devices, status:", response.status)
        throw new Error("Failed to get devices")
      }
      const devices = await response.json()
      console.log("[v0] [API Client] Received devices:", devices)
      return devices
    } catch (error) {
      console.error("[v0] [API Client] Error getting devices:", error)
      return []
    }
  }

  async getMessages(): Promise<any[]> {
    try {
      console.log("[v0] [API Client] Fetching messages from:", `${this.baseUrl}/api/messages`)
      const response = await fetch(`${this.baseUrl}/api/messages`)
      if (!response.ok) {
        console.error("[v0] [API Client] Failed to fetch messages, status:", response.status)
        throw new Error("Failed to get messages")
      }
      const data = await response.json()
      console.log("[v0] [API Client] Received messages:", data.messages?.length || 0)
      return data.messages || []
    } catch (error) {
      console.error("[v0] [API Client] Error getting messages:", error)
      return []
    }
  }

  async sendMessage(message: any): Promise<boolean> {
    try {
      console.log("[v0] [API Client] Sending message to:", `${this.baseUrl}/api/messages`)
      console.log("[v0] [API Client] Message data:", message)
      const response = await fetch(`${this.baseUrl}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      })
      const result = response.ok
      console.log("[v0] [API Client] Send message result:", result)
      return result
    } catch (error) {
      console.error("[v0] [API Client] Error sending message:", error)
      return false
    }
  }

  async getSignalingMessages(deviceId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/signaling?deviceId=${deviceId}`)
      if (!response.ok) throw new Error("Failed to get signaling messages")
      return await response.json()
    } catch (error) {
      console.error("[API] Error getting signaling messages:", error)
      return []
    }
  }

  async sendSignalingMessage(message: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/signaling`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      })
      return response.ok
    } catch (error) {
      console.error("[API] Error sending signaling message:", error)
      return false
    }
  }

  async sendNotification(
    toDevice: string,
    fromDevice: string,
    type: string,
    title: string,
    message?: string,
    data?: any,
  ): Promise<boolean> {
    try {
      console.log("[v0] [API Client] Sending notification:", { toDevice, fromDevice, type, title })
      const response = await fetch(`${this.baseUrl}/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toDevice, fromDevice, type, title, message, data }),
      })
      return response.ok
    } catch (error) {
      console.error("[v0] [API Client] Error sending notification:", error)
      return false
    }
  }

  async getNotifications(deviceId: string, unreadOnly = false): Promise<any[]> {
    try {
      const url = `${this.baseUrl}/api/notifications?deviceId=${deviceId}${unreadOnly ? "&unreadOnly=true" : ""}`
      console.log("[v0] [API Client] Fetching notifications from:", url)
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to get notifications")
      return await response.json()
    } catch (error) {
      console.error("[v0] [API Client] Error getting notifications:", error)
      return []
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      })
      return response.ok
    } catch (error) {
      console.error("[v0] [API Client] Error marking notification as read:", error)
      return false
    }
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/${notificationId}`, {
        method: "DELETE",
      })
      return response.ok
    } catch (error) {
      console.error("[v0] [API Client] Error deleting notification:", error)
      return false
    }
  }

  async getEmployees(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/employees`)
      if (!response.ok) throw new Error("Failed to get employees")
      return await response.json()
    } catch (error) {
      console.error("[API] Error getting employees:", error)
      return []
    }
  }

  async createEmployee(employee: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employee),
      })
      return response.ok
    } catch (error) {
      console.error("[API] Error creating employee:", error)
      return false
    }
  }

  async updateEmployee(id: string, employee: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employee),
      })
      return response.ok
    } catch (error) {
      console.error("[API] Error updating employee:", error)
      return false
    }
  }

  async deleteEmployee(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/employees/${id}`, {
        method: "DELETE",
      })
      return response.ok
    } catch (error) {
      console.error("[API] Error deleting employee:", error)
      return false
    }
  }

  async getTrainingRecords(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/training-records`)
      if (!response.ok) throw new Error("Failed to get training records")
      return await response.json()
    } catch (error) {
      console.error("[API] Error getting training records:", error)
      return []
    }
  }

  async createTrainingRecord(record: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/training-records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      })
      return response.ok
    } catch (error) {
      console.error("[API] Error creating training record:", error)
      return false
    }
  }

  async deleteTrainingRecord(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/training-records/${id}`, {
        method: "DELETE",
      })
      return response.ok
    } catch (error) {
      console.error("[API] Error deleting training record:", error)
      return false
    }
  }

  setServerUrl(url: string) {
    console.log("[API] setServerUrl called but ignored - using relative URLs")
  }

  getServerUrl(): string {
    return this.baseUrl || window.location.origin
  }
}

export const apiClient = new ApiClient()
