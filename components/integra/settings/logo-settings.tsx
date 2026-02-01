"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface LogoConfig {
  logoPath: string
  width: number
  alt: string
}

export function LogoSettings() {
  const [config, setConfig] = useState<LogoConfig>({
    logoPath: '/integra-logo.png',
    width: 240,
    alt: 'Company Logo'
  })
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/logo-settings')
      const data = await res.json()
      setConfig(data)
    } catch (error) {
      console.error('Failed to fetch config:', error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploading(true)
    setMessage('')

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('width', config.width.toString())
      formData.set('alt', config.alt)
      
      const res = await fetch('/api/logo-settings', {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        setConfig(data.config)
        setPreview(null)
        setMessage('Logo settings saved successfully!')
        
        // Reload page to show new logo
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setMessage('Failed to save logo settings')
      }
    } catch (error) {
      console.error('Save error:', error)
      setMessage('Error saving logo settings')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Logo Settings</h2>
      
      <form onSubmit={handleSave} className="space-y-6">
        {/* Current Logo Preview */}
        <div className="bg-muted p-6 rounded-lg">
          <p className="text-sm font-semibold mb-3">Current Logo</p>
          <div className="bg-white p-4 rounded inline-block">
            <Image 
              src={preview || config.logoPath} 
              alt={config.alt}
              width={config.width}
              height={config.width}
              className="object-contain"
            />
          </div>
        </div>

        {/* Upload New Logo */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Upload New Logo
          </label>
          <input
            type="file"
            name="logo"
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
            Supported formats: PNG, JPG, SVG
          </p>
        </div>

        {/* Width Only */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Logo Size (pixels)
          </label>
          <input
            type="number"
            name="width"
            value={config.width}
            onChange={(e) => setConfig({ ...config, width: parseInt(e.target.value) || 240 })}
            min="50"
            max="500"
            className="w-full px-4 py-2 border border-border rounded-lg"
          />
          <input
            type="range"
            value={config.width}
            onChange={(e) => setConfig({ ...config, width: parseInt(e.target.value) })}
            min="50"
            max="500"
            className="w-full mt-2"
          />
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Save Button */}
        <button
          type="submit"
          disabled={uploading}
          className="w-full py-3 px-6 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Saving...' : 'Save Logo Settings'}
        </button>
      </form>
    </div>
  )
}