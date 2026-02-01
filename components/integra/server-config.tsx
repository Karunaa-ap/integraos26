"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"

interface ServerConfigProps {
  onClose: () => void
  onConnect: () => void
}

export function ServerConfig({ onClose, onConnect }: ServerConfigProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    setIsChecking(true)
    const connected = await apiClient.healthCheck()
    setIsConnected(connected)
    setIsChecking(false)
  }

  const handleRefresh = async () => {
    await checkConnection()
    if (isConnected) {
      onConnect()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground">Server Status</h2>
          <p className="text-sm text-muted-foreground mt-1">Check connection to Integra OS server</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border">
            <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">
                {isChecking ? "Checking connection..." : isConnected ? "Connected" : "Not connected"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {isConnected ? "Server is running and accessible" : "Cannot reach the server"}
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <div className="text-xs text-muted-foreground space-y-2">
              <p>
                <i className="fas fa-info-circle mr-2"></i>
                The app uses built-in API routes
              </p>
              <p>
                <i className="fas fa-globe mr-2"></i>
                Server URL: <span className="font-mono">{window.location.origin}</span>
              </p>
            </div>
          </div>

          <button
            onClick={checkConnection}
            disabled={isChecking}
            className="w-full px-4 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            <i className="fas fa-sync mr-2"></i>
            Refresh Connection
          </button>
        </div>

        <div className="p-6 border-t border-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleRefresh}
            disabled={!isConnected}
            className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <i className="fas fa-check mr-2"></i>
            Sync Now
          </button>
        </div>
      </div>
    </div>
  )
}
