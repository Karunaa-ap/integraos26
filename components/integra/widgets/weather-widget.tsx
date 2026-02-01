"use client"

import { useState, useEffect } from 'react'

interface WeatherWidgetProps {
  iconColor: string
}

interface WeatherData {
  location: string
  temperature: number
  description: string
  icon: string
}

export function WeatherWidget({ iconColor }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWeather()
  }, [])

  const fetchWeather = async () => {
    try {
      setLoading(true)
      
      // Get user's location
      if (!navigator.geolocation) {
        throw new Error("Geolocation not supported")
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          
          // Fetch weather data
          const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY || '286891a4ffddf516e46c0db1d8e3221a'
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
          )
          
          if (!response.ok) throw new Error('Weather data fetch failed')
          
          const data = await response.json()
          
          setWeather({
            location: `${data.name}, ${data.sys.country}`,
            temperature: Math.round(data.main.temp),
            description: data.weather[0].description,
            icon: data.weather[0].icon
          })
          setLoading(false)
        },
        (error) => {
          setError("Location access denied")
          setLoading(false)
        }
      )
    } catch (err) {
      setError("Failed to fetch weather")
      setLoading(false)
    }
  }

  const getWeatherIcon = (icon: string) => {
    // Map OpenWeather icons to FontAwesome icons
    const iconMap: { [key: string]: string } = {
      '01d': 'fa-sun',
      '01n': 'fa-moon',
      '02d': 'fa-cloud-sun',
      '02n': 'fa-cloud-moon',
      '03d': 'fa-cloud',
      '03n': 'fa-cloud',
      '04d': 'fa-cloud',
      '04n': 'fa-cloud',
      '09d': 'fa-cloud-showers-heavy',
      '09n': 'fa-cloud-showers-heavy',
      '10d': 'fa-cloud-sun-rain',
      '10n': 'fa-cloud-moon-rain',
      '11d': 'fa-bolt',
      '11n': 'fa-bolt',
      '13d': 'fa-snowflake',
      '13n': 'fa-snowflake',
      '50d': 'fa-smog',
      '50n': 'fa-smog'
    }
    return iconMap[icon] || 'fa-cloud-sun'
  }

  if (loading) {
    return (
      <div className="widget-container">
        <div className="flex items-center gap-2 mb-4">
          <i className={`fas fa-cloud-sun ${iconColor}`}></i>
          <span className="font-semibold">Weather</span>
        </div>
        <div className="text-center flex-grow flex flex-col justify-center">
          <p className="text-lg">Loading weather...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="widget-container">
        <div className="flex items-center gap-2 mb-4">
          <i className={`fas fa-cloud-sun ${iconColor}`}></i>
          <span className="font-semibold">Weather</span>
        </div>
        <div className="text-center flex-grow flex flex-col justify-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="widget-container">
      <div className="flex items-center gap-2 mb-4">
        <i className={`fas fa-cloud-sun ${iconColor}`}></i>
        <span className="font-semibold">Weather</span>
      </div>
      <div className="text-center flex-grow flex flex-col justify-center">
        <h4 className="text-xl font-bold">{weather?.location}</h4>
        <div className="flex items-center justify-center gap-4 my-2">
          <i className={`fas ${getWeatherIcon(weather?.icon || '')} text-5xl opacity-80`}></i>
          <p className="text-4xl font-bold">{weather?.temperature}°C</p>
        </div>
        <p className="text-lg capitalize">{weather?.description}</p>
      </div>
    </div>
  )
}