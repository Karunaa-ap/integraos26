"use client"

import { useState } from 'react'
import Image from 'next/image'
import { apiClient } from '@/lib/api-client'

interface LogoSettingsSyncedProps {
  state: any
  setState: (state: any) => void
  setLastSyncedTimestamp: (timestamp: number) => void
  setIsSyncing: (syncing: boolean) => void
}

export function LogoSettingsSynced({ 
  state, 
  setState, 
  setLastSyncedTimestamp,
  setIsSyncing 
}: LogoSettingsSyncedProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setMessage('File too large. Maximum size is 2MB.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!preview && !state?.theme?.logoWidth) {
      setMessage('No changes to save')
      return
    }

    setUploading(true)
    setMessage('')
    setIsSyncing(true)

    try {
      const updatedState = {
        ...state,
        theme: {
          ...state.theme,
          logo: preview || state.theme.logo,
          logoWidth: state.theme.logoWidth || 240,
          logoAlt: state.theme.logoAlt || 'Company Logo'
        }
      }

      setState(updatedState)

      const { currentUser, editingLayoutForRole, pendingRoleChange, ...syncedData } = updatedState
      const result = await apiClient.saveState(syncedData)

      if (result.success && result.lastModified) {
        setLastSyncedTimestamp(result.lastModified)
        setMessage('✅ Logo saved and synced to all devices!')
        setPreview(null)
        console.log("[v0] ✅ Logo synced to server!")
      } else {
        setMessage('❌ Failed to save logo')
      }
    } catch (error) {
      console.error('Save error:', error)
      setMessage('❌ Error saving logo')
    } finally {
      setUploading(false)
      setTimeout(() => setIsSyncing(false), 1000)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <i className="fas fa-image text-primary"></i>
          Company Logo
        </h4>

        <div className="bg-muted p-6 rounded-lg mb-4">
          <p className="text-sm font-semibold mb-3">Current Logo</p>
          <div className="bg-white p-4 rounded inline-block">
            <Image 
              src={preview || state?.theme?.logo || '/integra-logo.png'} 
              alt={state?.theme?.logoAlt || 'Company Logo'}
              width={state?.theme?.logoWidth || 240}
              height={state?.theme?.logoWidth || 240}
              className="object-contain"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">
            Upload New Logo
          </label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            onChange={handleFileChange}
            className="block w-full text-sm text-muted-foreground
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-primary file:text-primary-foreground
              hover:file:bg-primary/90 file:cursor-pointer"
          />
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG, SVG • Max 2MB • Will sync to all devices instantly
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">
            Logo Size: {state?.theme?.logoWidth || 240}px
          </label>
          <input
            type="range"
            value={state?.theme?.logoWidth || 240}
            onChange={(e) => {
              const updatedState = {
                ...state,
                theme: {
                  ...state.theme,
                  logoWidth: parseInt(e.target.value)
                }
              }
              setState(updatedState)
            }}
            min="100"
            max="400"
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>100px (Small)</span>
            <span>400px (Large)</span>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm ${
            message.includes('✅') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={uploading}
          className="w-full py-3 px-6 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Syncing...
            </>
          ) : (
            <>
              <i className="fas fa-cloud-upload-alt"></i>
              Save & Sync Logo
            </>
          )}
        </button>
      </div>
    </div>
  )
}