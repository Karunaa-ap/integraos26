"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { IntegraHeader } from "@/components/integra/header"
import { AnnouncementTicker } from "@/components/integra/announcement-ticker"
import { WeatherWidget } from "@/components/integra/widgets/weather-widget"

import { NoticeBoardWidget } from "@/components/integra/widgets/notice-board-widget"
import { CommunicationApp } from "@/components/integra/communication-app"
import { ServerConfig } from "@/components/integra/server-config"
import { getDefaultState, type IntegraState, type App, type Notice, type LayoutItem } from "@/lib/integra-state"
import { apiClient } from "@/lib/api-client"
import { LogoSettingsSynced } from "@/components/integra/settings/logo-settings-synced"  // ✅ ADD






export default function IntegraOS() {
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false)
  const [setupServerUrl, setSetupServerUrl] = useState("")
  const [setupDeviceName, setSetupDeviceName] = useState("")
  const [deviceNameInput, setDeviceNameInput] = useState("")
  const [setupError, setSetupError] = useState("")
  const [testingConnection, setTestingConnection] = useState(false)

  const [state, setState] = useState<IntegraState | null>(null)
  const [isRotated, setIsRotated] = useState(false)
  const [openModal, setOpenModal] = useState<string | null>(null)
  const [selectedApp, setSelectedApp] = useState<App | null>(null)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)
  const [passcodeInput, setPasscodeInput] = useState("")
  const [passcodeError, setPasscodeError] = useState("")
  const [isEditingMainBoard, setIsEditingMainBoard] = useState(false)
  const [editingLayout, setEditingLayout] = useState<LayoutItem[]>([])
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null)

  const [serverConnected, setServerConnected] = useState(false)
const [showFormManager, setShowFormManager] = useState(false)
  const [showServerConfig, setShowServerConfig] = useState(false)


  
const [safetyFormView, setSafetyFormView] = useState<"list" | "create" | "view">("list")
const [safetyFormSubmissions, setSafetyFormSubmissions] = useState<any[]>(() => {
  if (typeof window === 'undefined') return []
  const saved = localStorage.getItem("safety_induction_forms")
  return saved ? JSON.parse(saved) : []
})
const [selectedFormSubmission, setSelectedFormSubmission] = useState<any | null>(null)
const [formSearchTerm, setFormSearchTerm] = useState("")

// ADD THIS RIGHT HERE:
const [formData, setFormData] = useState({
  fullName: "",
  position: "",
  phoneNumber: "",
  emergencyContact: "",
  methodItems: [
    { id: "m1", name: "List the hazards", date: "", done: false },
    { id: "m2", name: "Walk around factory and show hazards and:\n• a. First aid location\n• b. Location of PPE\n• c. Exits\n• d. Toilets\n• e. Supervisor's office\n• f. Lunch room – KEEP IT CLEAN!\n• g. K4.0\n• h. Light guards\n• i. the work centres\n• j. the 5S allocations", date: "", done: false },
    { id: "m3", name: "Explain returning items to zones", date: "", done: false },
    { id: "m4", name: "Ask for questions", date: "", done: false },
    { id: "m5", name: "Fill in the 'Training of Flexible Team Members' document", date: "", done: false }
  ],
  hazardsItems: [
    { id: "h1", name: "Fork lift", date: "", done: false },
    { id: "h2", name: "Sharp edges on metal components", date: "", done: false },
    { id: "h3", name: "Dropping heavy things on feet", date: "", done: false },
    { id: "h4", name: "Use of PPE in powder coating", date: "", done: false },
    { id: "h5", name: "Noise of turrets", date: "", done: false },
    { id: "h6", name: "Movement of turret and light guards", date: "", done: false },
    { id: "h7", name: "Loading/unloading parts on a pallet", date: "", done: false },
    { id: "h8", name: "Jamming fingers and heads on press brakes", date: "", done: false },
    { id: "h9", name: "Moving large components about", date: "", done: false },
    { id: "h10", name: "Welding flash and electricity", date: "", done: false },
    { id: "h11", name: "Linishing dust, noise and particles", date: "", done: false },
    { id: "h12", name: "Hand tool safety", date: "", done: false },
    { id: "h13", name: "Laser Welding and use of PPE", date: "", done: false },
    { id: "h14", name: "Lifting heavy things", date: "", done: false }
  ],
  safetyMeasuresItems: [
    { id: "s1", name: "High visibility vests, jackets, shirts", date: "", done: false },
    { id: "s2", name: "Protective footwear", date: "", done: false },
    { id: "s3", name: "Eye protection", date: "", done: false },
    { id: "s4", name: "Gloves that prevent cuts", date: "", done: false },
    { id: "s5", name: "Hearing protection (muffs and plugs)", date: "", done: false }
  ],
  signature: "",
  signatureDate: ""
})

  const [lastSyncedTimestamp, setLastSyncedTimestamp] = useState<number>(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showCustomAppForm, setShowCustomAppForm] = useState<string | null>(null)

  

  const PREDEFINED_SKILLS = [
  "Everything",
  "Software", 
  "Forklift",
  "First Aid",
  "Walkie Stacker",
  "Turret Punch",
  "Laser",
  "Unloading Tasks in Profiling",
  "P2 Panel Folding",
  "Press Brakes",
  "Clinching",
  "Spotwelder",
  "Welding (MIG + TIG)",
  "Powder Coating",
  "Assembly",
  "Material Handling and Packaging",
  "6S",
  "Design",
  "Supervisor",
  "Marketing",
  "Laser Welding"
]

  const [customAppForm, setCustomAppForm] = useState({
  name: "",
  url: "",
  icon: "fa-globe",
  iconType: "fontawesome" as "fontawesome" | "image", // NEW
  iconImage: "" as string, // NEW - for base64 image
  iconSize: 96,
  description: "",
  type: "app" as "app" | "local",
})

  const [newAnnouncement, setNewAnnouncement] = useState("")

  const [newNoticeForm, setNewNoticeForm] = useState({
    title: "",
    url: "",
  })

  const [uploadingPDF, setUploadingPDF] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [deviceRegistrationStatus, setDeviceRegistrationStatus] = useState<{
    isRegistered: boolean
    lastChecked: number | null
  }>({
    isRegistered: false,
    lastChecked: null,
  })



  // --- Training Module State ---
  const [employees, setEmployees] = useState<any[]>([])
  const [trainingRecords, setTrainingRecords] = useState<any[]>([])
  const [trainingView, setTrainingView] = useState<"documents" | "forms" | "employees" | "matrix">("documents")
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null)
  const [newEmployeeForm, setNewEmployeeForm] = useState({
    name: "",
    department: "",
    position: "",
    hireDate: "",
   skills: [] as string[],
  })
  const [selectedEmployeeForTraining, setSelectedEmployeeForTraining] = useState<string | null>(null)
  const [newTrainingRecordForm, setNewTrainingRecordForm] = useState({
    trainingId: "",
    trainingType: "document" as "document" | "form",
    completedDate: "",
    expiryDate: "",

  })
  
  // --- End Training Module State ---

  useEffect(() => {
  console.log("[v0] Checking setup status...")
  const setupComplete = localStorage.getItem("integra_setup_complete")
  console.log("[v0] Setup complete:", setupComplete)

  if (!setupComplete) {
    console.log("[v0] First time setup required - showing setup screen")
    setIsFirstTimeSetup(true)

    const generatedName = `Device-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    setSetupDeviceName(generatedName)
    setDeviceNameInput(generatedName)
  } else {
    console.log("[v0] Setup already complete - loading from server")
    loadFromServer()
  }
}, [])


useEffect(() => {
  if (!state?.theme) return

  const cssVarMap: Record<string, string> = {
    primary: "--primary",
    secondary: "--secondary",
    accent: "--accent",
    background: "--background",
    text: "--foreground",
    font: "--font-sans",
    logo: "--logo-url",
    headerColor: "--header-color"
  }

  Object.entries(state.theme).forEach(([key, value]) => {
    const cssVar = cssVarMap[key]
    if (cssVar) document.documentElement.style.setProperty(cssVar, value)
  })
}, [state?.theme])  // ✅ No localStorage.setItem!

  useEffect(() => {
    if (openModal === "training" && serverConnected) {
      loadTrainingData()
    }
  }, [openModal, serverConnected])

  // Reset form data when switching views
useEffect(() => {
  if (safetyFormView === "create") {
    setFormData({
      fullName: "",
      position: "",
      phoneNumber: "",
      emergencyContact: "",
      methodItems: [
        { id: "m1", name: "List the hazards", date: "", done: false },
        { id: "m2", name: "Walk around factory and show hazards and:\n• a. First aid location\n• b. Location of PPE\n• c. Exits\n• d. Toilets\n• e. Supervisor's office\n• f. Lunch room – KEEP IT CLEAN!\n• g. K4.0\n• h. Light guards\n• i. the work centres\n• j. the 5S allocations", date: "", done: false },
        { id: "m3", name: "Explain returning items to zones", date: "", done: false },
        { id: "m4", name: "Ask for questions", date: "", done: false },
        { id: "m5", name: "Fill in the 'Training of Flexible Team Members' document", date: "", done: false }
      ],
      hazardsItems: [
        { id: "h1", name: "Fork lift", date: "", done: false },
        { id: "h2", name: "Sharp edges on metal components", date: "", done: false },
        { id: "h3", name: "Dropping heavy things on feet", date: "", done: false },
        { id: "h4", name: "Use of PPE in powder coating", date: "", done: false },
        { id: "h5", name: "Noise of turrets", date: "", done: false },
        { id: "h6", name: "Movement of turret and light guards", date: "", done: false },
        { id: "h7", name: "Loading/unloading parts on a pallet", date: "", done: false },
        { id: "h8", name: "Jamming fingers and heads on press brakes", date: "", done: false },
        { id: "h9", name: "Moving large components about", date: "", done: false },
        { id: "h10", name: "Welding flash and electricity", date: "", done: false },
        { id: "h11", name: "Linishing dust, noise and particles", date: "", done: false },
        { id: "h12", name: "Hand tool safety", date: "", done: false },
        { id: "h13", name: "Laser Welding and use of PPE", date: "", done: false },
        { id: "h14", name: "Lifting heavy things", date: "", done: false }
      ],
      safetyMeasuresItems: [
        { id: "s1", name: "High visibility vests, jackets, shirts", date: "", done: false },
        { id: "s2", name: "Protective footwear", date: "", done: false },
        { id: "s3", name: "Eye protection", date: "", done: false },
        { id: "s4", name: "Gloves that prevent cuts", date: "", done: false },
        { id: "s5", name: "Hearing protection (muffs and plugs)", date: "", done: false }
      ],
      signature: "",
      signatureDate: ""
    })
  } else if (safetyFormView === "view" && selectedFormSubmission) {
    setFormData(selectedFormSubmission.formData)
  }
}, [safetyFormView, selectedFormSubmission])
const loadFromServer = async () => {
  const isConnected = await apiClient.healthCheck()
  setServerConnected(isConnected)

  const lastUserRole = localStorage.getItem('integra_last_user_role') || 'shop_floor'

  if (isConnected) {
    const serverState = await apiClient.getState()
    if (serverState) {
      console.log("[v0] Loading state from server:", {
        serverTimestamp: serverState.lastModified,
        customApps: serverState.allAvailableApps.filter(a => a.isCustom).length,
        notices: serverState.noticeBoardItems.length
      })
      
      const restoredUser = serverState.users[lastUserRole] || serverState.users.shop_floor
      
      setState({
        ...serverState,
        currentUser: restoredUser,
        editingLayoutForRole: null,
        pendingRoleChange: null,
      })
      setLastSyncedTimestamp(serverState.lastModified || 0)
    } else {
      const initialState = getDefaultState()
      const restoredUser = initialState.users[lastUserRole] || initialState.users.shop_floor
      initialState.currentUser = restoredUser
      setState(initialState)

      const { currentUser, editingLayoutForRole, pendingRoleChange, ...syncedData } = initialState
      await apiClient.saveState(syncedData)
    }
  } else {
    const initialState = getDefaultState()
    const restoredUser = initialState.users[lastUserRole] || initialState.users.shop_floor
    initialState.currentUser = restoredUser
    setState(initialState)
  }
}
const handleFirstTimeSetup = async () => {
    if (!setupDeviceName.trim()) {
      setSetupError("Please enter a device name")
      return
    }

    setTestingConnection(true)
    setSetupError("")

    try {
      // Test connection to built-in API routes
      const isConnected = await apiClient.healthCheck()

      if (isConnected) {
        const deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${Math.random().toString(36).substring(2, 5)}`

        // Store in sessionStorage instead of localStorage so each tab gets unique ID
        sessionStorage.setItem("integra_session_id", deviceId)
        localStorage.setItem("integra_device_id", deviceId)
        localStorage.setItem("integra_device_name", setupDeviceName.trim())

        console.log("[v0] [SETUP] Registering device:", { deviceId, deviceName: setupDeviceName.trim() })

        // Register device with server
        const registerResult = await apiClient.registerDevice(deviceId, setupDeviceName.trim())
        console.log("[v0] [SETUP] Device registration result:", registerResult)

        // Mark setup as complete
        localStorage.setItem("integra_setup_complete", "true")
        setIsFirstTimeSetup(false)
        setServerConnected(true)

        // Load state from server
        await loadFromServer()
      } else {
        setSetupError("Could not connect to server. Please make sure the app is running.")
      }
    } catch (error) {
      console.error("[v0] [SETUP] Error during setup:", error)
      setSetupError("Failed to connect to server. Please make sure the app is running.")
    } finally {
      setTestingConnection(false)
    }
  }

  useEffect(() => {
    if (!serverConnected || !state) return

    console.log("[v0] Starting sync polling - current lastSyncedTimestamp:", lastSyncedTimestamp)

    // Poll for updates every 3 seconds
    syncIntervalRef.current = setInterval(async () => {
      if (isSyncing) {
        console.log("[v0] Skipping sync - already syncing")
        return
      }

      setIsSyncing(true)
      try {
        const serverState = await apiClient.getState()

        if (serverState && serverState.lastModified) {
          const deviceId = localStorage.getItem("integra_device_id")

          console.log("[v0] Sync check:", {
            serverTimestamp: serverState.lastModified,
            localTimestamp: lastSyncedTimestamp,
            serverDevice: serverState.modifiedBy,
            localDevice: deviceId,
            isNewer: serverState.lastModified > lastSyncedTimestamp,
            isDifferentDevice: serverState.modifiedBy !== deviceId,
          })
if (serverState.lastModified > lastSyncedTimestamp && serverState.modifiedBy !== deviceId) {
  console.log("[v0] ✅ Syncing state from server - updated by:", serverState.modifiedBy)
  console.log("[v0] Server timestamp:", serverState.lastModified, "Local timestamp:", lastSyncedTimestamp)
  
  setState((prevState) => {
    if (!prevState) return serverState
    
    // CRITICAL: Only sync if we haven't made recent changes
    const timeSinceLastSave = Date.now() - lastSyncedTimestamp
    if (timeSinceLastSave < 5000) {
      console.log("[v0] ⏭️ Skipping sync - recent local changes detected")
      return prevState
    }
    
    return {
      ...serverState,
      currentUser: prevState.currentUser,
      editingLayoutForRole: prevState.editingLayoutForRole,
      pendingRoleChange: prevState.pendingRoleChange,
    }
  })
  
  setLastSyncedTimestamp(serverState.lastModified)
} else if (serverState.lastModified > lastSyncedTimestamp) {
            console.log("[v0] ⏭️ Skipping sync - change was from this device")
          } else {
            console.log("[v0] ⏭️ Skipping sync - local state is up to date")
          }
        }
      } catch (error) {
        console.error("[v0] ❌ Error syncing state:", error)
      } finally {
        setIsSyncing(false)
      }
    }, 3000)

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [serverConnected, state, lastSyncedTimestamp, isSyncing])

useEffect(() => {
  // Save immediately - NO debounce delay
  if (!state || !serverConnected) return

  // Clear existing timeout
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current)
  }

  saveTimeoutRef.current = setTimeout(async () => {
    console.log("[v0] 💾 Saving state to server...", {
      customApps: state.allAvailableApps.filter(a => a.isCustom).length,
      notices: state.noticeBoardItems.length,
      announcements: state.announcements.length
    })

    const { currentUser, editingLayoutForRole, pendingRoleChange, ...syncedData } = state

    const result = await apiClient.saveState(syncedData)
    if (result.success && result.lastModified) {
      setLastSyncedTimestamp(result.lastModified)
      console.log("[v0] ✅ State saved successfully at:", new Date(result.lastModified).toLocaleTimeString(), {
        timestamp: result.lastModified
      })
    } else {
      console.error("[v0] ❌ Failed to save state:", result)
    }
  }, 100) // Changed from 500ms to 100ms - MUCH FASTER!

  return () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
  }
}, [state, serverConnected])
  useEffect(() => {
    const checkDeviceRegistration = async () => {
      const deviceId = localStorage.getItem("integra_device_id")
      if (!deviceId || !serverConnected) return

      const devices = await apiClient.getDevices()
      const isRegistered = devices.some((d: any) => d.deviceId === deviceId)

      console.log("[v0] [DEVICE CHECK] Device registration status:", {
        deviceId,
        isRegistered,
        totalDevices: devices.length,
      })

      setDeviceRegistrationStatus({
        isRegistered,
        lastChecked: Date.now(),
      })
    }

    if (serverConnected) {
      checkDeviceRegistration()
    }
  }, [serverConnected])

  const handleReRegisterDevice = async () => {
    const deviceId = localStorage.getItem("integra_device_id")
    const deviceName = localStorage.getItem("integra_device_name")

    if (!deviceId || !deviceName) {
      alert("Device information not found. Please complete setup again.")
      localStorage.removeItem("integra_setup_complete")
      window.location.reload()
      return
    }

    console.log("[v0] [RE-REGISTER] Re-registering device:", { deviceId, deviceName })

    const result = await apiClient.registerDevice(deviceId, deviceName)
    console.log("[v0] [RE-REGISTER] Registration result:", result)

    if (result) {
      setDeviceRegistrationStatus({
        isRegistered: true,
        lastChecked: Date.now(),
      })
      alert("Device re-registered successfully!")
    } else {
      alert("Failed to re-register device. Please check server connection.")
    }
  }

  const handleResetDevice = () => {
    if (
      confirm(
        "Are you sure you want to reset this device? This will clear all device settings and require setup again.",
      )
    ) {
      console.log("[v0] Resetting device...")

      // Clear all device-related localStorage items
      localStorage.removeItem("integra_setup_complete")
      localStorage.removeItem("integra_device_id")
      localStorage.removeItem("integra_device_name")
      localStorage.removeItem("integra_server_url")

      // Clear session storage as well
      sessionStorage.removeItem("integra_session_id")

      console.log("[v0] Device reset complete - reloading page")

      // Reload the page to show setup screen
      window.location.reload()
    }
  }

  // --- Training Module Functions ---
  const loadTrainingData = async () => {
    const [employeesData, recordsData] = await Promise.all([apiClient.getEmployees(), apiClient.getTrainingRecords()])
    setEmployees(employeesData)
    setTrainingRecords(recordsData)
  }

  const handleAddEmployee = async () => {
  // Permission check: Only Administrator can add employees
  if (state.currentUser.role !== "administrator") {
    alert("Only administrators can add employees")
    return
  }
  
  if (
    !newEmployeeForm.name ||
    !newEmployeeForm.department ||
    !newEmployeeForm.position ||
    !newEmployeeForm.hireDate
  ) {
    alert("Please fill in all required fields")
    return
  }

  const newEmployee = {
    id: `emp_${Date.now()}`,
    ...newEmployeeForm,
    createdAt: Date.now(),
    skills: newEmployeeForm.skills || [],
  }

  const success = await apiClient.createEmployee(newEmployee)
  if (success) {
    await loadTrainingData()
    setNewEmployeeForm({ 
      name: "", 
      department: "", 
      position: "", 
      hireDate: "",
      skills: []  // FIXED: Added inside the object
    })
  } else {
    alert("Failed to add employee")
  }
}

  const handleUpdateEmployee = async () => {
  // Permission check: Only Administrator can edit employees
  if (state.currentUser.role !== "administrator") {
    alert("Only administrators can edit employees")
    return
  }

  if (!editingEmployee) return

  const success = await apiClient.updateEmployee(editingEmployee.id, {
    name: editingEmployee.name,
    department: editingEmployee.department,
    position: editingEmployee.position,
    hireDate: editingEmployee.hireDate,
  })

  if (success) {
    await loadTrainingData()
    setEditingEmployee(null)
  } else {
    alert("Failed to update employee")
  }
}

  const handleDeleteEmployee = async (id: string) => {
  // Permission check: Only Administrator can delete employees
  if (state.currentUser.role !== "administrator") {
    alert("Only administrators can delete employees")
    return
  }

  if (!confirm("Are you sure you want to delete this employee? All training records will also be deleted.")) return

  const success = await apiClient.deleteEmployee(id)
  if (success) {
    await loadTrainingData()
  } else {
    alert("Failed to delete employee")
  }
}

  const handleAddTrainingRecord = async () => {
  // Permission check: Only Administrator and Manager can add training records
  if (state.currentUser.role !== "administrator" && state.currentUser.role !== "manager") {
    alert("Only administrators and managers can add training records")
    return
  }

  if (!selectedEmployeeForTraining || !newTrainingRecordForm.trainingId || !newTrainingRecordForm.completedDate) {
    alert("Please fill in all required fields")
    return
  }

  const newRecord = {
    id: `record_${Date.now()}`,
    employeeId: selectedEmployeeForTraining,
    trainingId: newTrainingRecordForm.trainingId,
    trainingType: newTrainingRecordForm.trainingType,
    completedDate: newTrainingRecordForm.completedDate,
    expiryDate: newTrainingRecordForm.expiryDate || undefined,
  }

  const success = await apiClient.createTrainingRecord(newRecord)
  if (success) {
    await loadTrainingData()
    setSelectedEmployeeForTraining(null)
    setNewTrainingRecordForm({
      trainingId: "",
      trainingType: "document",
      completedDate: "",
      expiryDate: "",
      score: "",
      notes: "",
    })
  } else {
    alert("Failed to add training record")
  }
}

   const handleDeleteTrainingRecord = async (id: string) => {
  // Permission check: Only Administrator and Manager can delete training records
  if (state.currentUser.role !== "administrator" && state.currentUser.role !== "manager") {
    alert("Only administrators and managers can delete training records")
    return
  }

  if (!confirm("Are you sure you want to delete this training record?")) return

  const success = await apiClient.deleteTrainingRecord(id)
  if (success) {
    await loadTrainingData()
  } else {
    alert("Failed to delete training record")
  }
}

  const getEmployeeTrainingStatus = (employeeId: string, trainingId: string) => {
    return trainingRecords.find((r) => r.employeeId === employeeId && r.trainingId === trainingId)
  }

  const getAllTrainings = () => {
    return [
      ...state.training.documents.map((d) => ({ ...d, type: "document" as const })),
      ...state.training.forms.map((f) => ({ ...f, type: "form" as const })),
    ]
  }
  // --- End Training Module Functions ---

  if (isFirstTimeSetup) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background p-4">
        <div className="bg-popover border border-border rounded-2xl shadow-2xl w-full max-w-lg p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-server text-primary text-4xl"></i>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Welcome to Integra OS</h2>
            <p className="text-muted-foreground">Set up your device by entering the server address and a device name</p>
          </div>

          <div className="space-y-6">
  <div>
    <label className="block text-sm font-semibold text-foreground mb-2">
      Device Name <span className="text-destructive">*</span>
    </label>
    <input
      type="text"
      value={deviceNameInput}   // 🔥 LOCAL STATE (fast)
      onChange={(e) => {
        setDeviceNameInput(e.target.value)   // instant typing
        setSetupError("")
      }}
      onBlur={() => {
        setSetupDeviceName(deviceNameInput.trim())  // save only when finished
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          setSetupDeviceName(deviceNameInput.trim())
          handleFirstTimeSetup()
        }
      }}
      placeholder="e.g., Shop Floor Tablet 1"
      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-lg"
      autoFocus
      disabled={testingConnection}
    />
    <p className="text-xs text-muted-foreground mt-2">
      <i className="fas fa-info-circle mr-1"></i>
      Give this device a unique name to identify it
    </p>
  </div>

  {setupError && (
    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-start gap-2">
      <i className="fas fa-exclamation-triangle mt-0.5"></i>
      <span>{setupError}</span>
    </div>
  )}
</div>


            <button
              onClick={handleFirstTimeSetup}
              disabled={testingConnection || !setupDeviceName.trim()}
              className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testingConnection ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Connecting...
                </>
              ) : (
                <>
                  <i className="fas fa-check-circle mr-2"></i>
                  Get Started
                </>
              )}
            </button>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                This configuration will be saved and you won't need to enter it again on this device.
              </p>
            </div>
          </div>
        </div>
    )
  }

  if (!state || !state.currentUser) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="text-foreground text-2xl">Loading Integra OS...</div>
          {!serverConnected && (
            <button
              onClick={() => setShowServerConfig(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <i className="fas fa-server mr-2"></i>
              Configure Server
            </button>
          )}
        </div>
      </div>
    )
  }

  const canManage = state.currentUser.role === "administrator" || state.currentUser.role === "manager"
  const isAdmin = state.currentUser.role === "administrator"
  const canManageTraining = state.currentUser.role === "administrator" || state.currentUser.role === "manager"
  const roleForLayout = state.editingLayoutForRole || state.currentUser.role
const layoutItems = isEditingMainBoard
  ? editingLayout
  : state.layouts[roleForLayout] || [];


 const handleUserChange = (role: string) => {
  const targetUser = state.users[role]
  if (targetUser.passcode) {
    setState({ ...state, pendingRoleChange: role })
    setOpenModal("passcode")
  } else {
    localStorage.setItem('integra_last_user_role', role) // ✅ ADD THIS LINE
    setState({ ...state, currentUser: targetUser, editingLayoutForRole: null })
    setIsEditingMainBoard(false)
  }
}

  const handlePasscodeSubmit = () => {
  if (!state.pendingRoleChange) return

  const targetUser = state.users[state.pendingRoleChange]
  if (passcodeInput === targetUser.passcode) {
    localStorage.setItem('integra_last_user_role', state.pendingRoleChange)
    
    setState({ ...state, currentUser: targetUser, pendingRoleChange: null, editingLayoutForRole: null })
    setOpenModal(null)
    setPasscodeInput("")
    setPasscodeError("")
    setIsEditingMainBoard(false)
  } else {
    setPasscodeError("Incorrect passcode. Please try again.")
    setPasscodeInput("")
  }
}

  const handlePasscodeCancel = () => {
    setState({ ...state, pendingRoleChange: null })
    setOpenModal(null)
    setPasscodeInput("")
    setPasscodeError("")
  }

  const handleAppClick = (app: App) => {
    if (isEditingMainBoard) return
    if (app.type === "widget") return

    if (app.id.startsWith("custom_")) {
      window.open(app.url, "_blank")
      return
    }

    if (app.id === "job_tracking") {
    setSelectedApp(app)
    setOpenModal("fulcrum")
    return
  }

    if (!app.modalId && app.url) {
      window.open(app.url, "_blank")
      return
    }


    setSelectedApp(app)
    setOpenModal(app.modalId || "app")
  }

  const handleNoticeClick = (notice: Notice) => {
    setSelectedNotice(notice)
    setOpenModal("notice-pdf")
  }

  const handleAddNotice = async () => {
  // Permission check: Only Administrator and Manager can add notices
  if (state.currentUser.role !== "administrator" && state.currentUser.role !== "manager") {
    alert("Only administrators and managers can add notices")
    return
  }

  if (!newNoticeForm.title.trim() || !selectedFile) {
    alert("Please provide a title and select a PDF file")
    return
  }

  setUploadingPDF(true)
  setIsSyncing(true) // STOP syncing during upload

  try {
    const pdfUrl = await apiClient.uploadPdf(selectedFile)
    if (!pdfUrl) {
      throw new Error("Upload failed")
    }

    const newNotice: Notice = {
      id: `notice_${Date.now()}`,
      title: newNoticeForm.title.trim(),
      url: pdfUrl,
      pinned: false,
    }

    const updatedState = {
      ...state,
      noticeBoardItems: [...state.noticeBoardItems, newNotice],
    }

    setState(updatedState)

    // Force immediate save to server
    const { currentUser, editingLayoutForRole, pendingRoleChange, ...syncedData } = updatedState
    const result = await apiClient.saveState(syncedData)
    if (result.success && result.lastModified) {
      setLastSyncedTimestamp(result.lastModified)
      console.log("[v0] ✅ Notice saved to server!")
    }

    setNewNoticeForm({ title: "", url: "" })
    setSelectedFile(null)
    
    alert("Notice uploaded successfully!")
  } catch (error) {
    console.error("Error uploading PDF:", error)
    alert("Failed to upload PDF. Please try again.")
  } finally {
    setUploadingPDF(false)
    setTimeout(() => setIsSyncing(false), 1000) // Resume syncing after 1 second
  }
}

const handleRemoveNotice = async (noticeId: string) => {
  // Permission check: Only Administrator and Manager can remove notices
  if (state.currentUser.role !== "administrator" && state.currentUser.role !== "manager") {
    alert("Only administrators and managers can remove notices")
    return
  }

  if (!confirm("Are you sure you want to remove this notice?")) return

  const notice = state.noticeBoardItems.find((n) => n.id === noticeId)
  if (!notice) return

  setIsSyncing(true) // STOP syncing during delete

  try {
    await apiClient.deletePdf(notice.url)

    const updatedState = {
      ...state,
      noticeBoardItems: state.noticeBoardItems.filter((n) => n.id !== noticeId),
    }

    setState(updatedState)

    // Force immediate save
    const { currentUser, editingLayoutForRole, pendingRoleChange, ...syncedData } = updatedState
    const result = await apiClient.saveState(syncedData)
    if (result.success && result.lastModified) {
      setLastSyncedTimestamp(result.lastModified)
      console.log("[v0] ✅ Notice removed from server!")
    }

    setTimeout(() => setIsSyncing(false), 1000)
  } catch (error) {
    console.error("Error deleting PDF:", error)
    alert("Failed to delete PDF. The notice will be removed from the list.")
    
    const updatedState = {
      ...state,
      noticeBoardItems: state.noticeBoardItems.filter((n) => n.id !== noticeId),
    }
    
    setState(updatedState)
    
    // Still save even if PDF delete failed
    const { currentUser, editingLayoutForRole, pendingRoleChange, ...syncedData } = updatedState
    await apiClient.saveState(syncedData)
    
    setTimeout(() => setIsSyncing(false), 1000)
  }
}

  const handleTogglePin = async (noticeId: string) => {
  // Permission check: Only Administrator and Manager can pin/unpin notices
  if (state.currentUser.role !== "administrator" && state.currentUser.role !== "manager") {
    alert("Only administrators and managers can pin/unpin notices")
    return
  }

  const notice = state.noticeBoardItems.find((n) => n.id === noticeId)
  if (!notice) return

  // Check if we're trying to pin and already have 4 pinned
  const pinnedCount = state.noticeBoardItems.filter((n) => n.pinned).length
  if (!notice.pinned && pinnedCount >= 4) {
    alert("You can only pin up to 4 notices at a time. Unpin another notice first.")
    return
  }

  setIsSyncing(true) // STOP syncing during pin/unpin

  const updatedState = {
    ...state,
    noticeBoardItems: state.noticeBoardItems.map((n) => (n.id === noticeId ? { ...n, pinned: !n.pinned } : n)),
  }

  setState(updatedState)

  // Force immediate save
  const { currentUser, editingLayoutForRole, pendingRoleChange, ...syncedData } = updatedState
  const result = await apiClient.saveState(syncedData)
  if (result.success && result.lastModified) {
    setLastSyncedTimestamp(result.lastModified)
    console.log("[v0] ✅ Pin status saved to server!")
  }

  setTimeout(() => setIsSyncing(false), 1000)
}

  const handleOpenLayoutEditor = () => {
    const roleToEdit = state.currentUser.role
    setState({ ...state, editingLayoutForRole: roleToEdit })
    const currentLayout = state.layouts[roleToEdit] || []
    setEditingLayout(JSON.parse(JSON.stringify(currentLayout))) // Deep copy
    setIsEditingMainBoard(true)
  }

  const handleSwitchEditingRole = (role: string) => {
    setState({ ...state, editingLayoutForRole: role })
    const newLayout = state.layouts[role] || []
    setEditingLayout(JSON.parse(JSON.stringify(newLayout))) // Deep copy
  }
const handleSaveLayout = async () => {
  const roleToEdit = state.editingLayoutForRole || state.currentUser.role
  
  const updatedState = {
    ...state,
    layouts: {
      ...state.layouts,
      [roleToEdit]: editingLayout,
    },
    editingLayoutForRole: null,
  }
  
  // Save to local state
  setState(updatedState)
  
  // Save to API
  try {
    await apiClient.saveState(updatedState)
    console.log('Layout saved successfully')
  } catch (error) {
    console.error('Failed to save layout:', error)
    alert('Failed to save layout changes. Please try again.')
  }
  
  setIsEditingMainBoard(false)
  setEditingLayout([])
}
  const handleCancelLayoutEdit = () => {
    setState({ ...state, editingLayoutForRole: null }) // Clear editingLayoutForRole on cancel
    setIsEditingMainBoard(false)
    setEditingLayout([])
    setDraggedItemId(null)
    setDraggedOverIndex(null)
  }
const handleMainBoardDragStart = (itemId: string, e?: React.DragEvent | React.TouchEvent) => {
  setDraggedItemId(itemId)
}

const handleMainBoardDragOver = (e: React.DragEvent, index: number) => {
  e.preventDefault()
  setDraggedOverIndex(index)
}

const handleMainBoardDragLeave = () => {
  setDraggedOverIndex(null)
}

const handleMainBoardDrop = (targetIndex: number) => {
  if (draggedItemId === null) return

  const currentLayout = isEditingMainBoard 
    ? editingLayout 
    : state.layouts[state.currentUser.role]

  const draggedIndex = currentLayout.findIndex((item) => item.id === draggedItemId)
  if (draggedIndex === -1) return

  const newLayout = [...currentLayout]
  const [draggedItem] = newLayout.splice(draggedIndex, 1)
  newLayout.splice(targetIndex, 0, draggedItem)

  if (isEditingMainBoard) {
    setEditingLayout(newLayout)
  } else {
    setState({
      ...state,
      layouts: {
        ...state.layouts,
        [state.currentUser.role]: newLayout
      }
    })
  }

  setDraggedItemId(null)
  setDraggedOverIndex(null)
}

const handleMainBoardDragEnd = () => {
  setDraggedItemId(null)
  setDraggedOverIndex(null)
}

const handleChangeSize = (itemId: string, dimension: "col" | "row", delta: number) => {
  setEditingLayout((prev) =>
    prev.map((item) => {
      if (item.id === itemId) {
        const newSize = Math.max(1, Math.min(4, item.size[dimension] + delta))
        return {
          ...item,
          size: { ...item.size, [dimension]: newSize },
        }
      }
      return item
    }),
  )
}

const handleAddToLayout = (appId: string) => {
  const app = state.allAvailableApps.find((a) => a.id === appId)
  if (!app) return

  const alreadyInLayout = editingLayout.some((item) => item.id === appId)
  if (alreadyInLayout) return

  const newItem = {
    id: appId,
    size: app.type === "widget" ? { col: 2, row: 2 } : { col: 1, row: 1 },
  }

  // Add to current editing layout
  setEditingLayout((prev) => [...prev, newItem])
}
  const handleRemoveFromLayout = (itemId: string) => {
    setEditingLayout((prev) => prev.filter((item) => item.id !== itemId))
  }

const handleCreateCustomApp = async () => {
  if (!customAppForm.name || !customAppForm.url) {
    alert("Please fill in all required fields")
    return
  }

  // Validate icon based on type
  if (customAppForm.iconType === "fontawesome" && !customAppForm.icon) {
    alert("Please enter a FontAwesome icon class")
    return
  }
  if (customAppForm.iconType === "image" && !customAppForm.iconImage) {
    alert("Please upload an icon image")
    return
  }

  setIsSyncing(true) // STOP syncing during app creation

  const newApp: App = {
    id: `custom_${Date.now()}`,
    name: customAppForm.name,
    icon: customAppForm.iconType === "fontawesome" ? customAppForm.icon : "",
    iconType: customAppForm.iconType,
    iconSize: customAppForm.iconSize || 96,
    customIcon: customAppForm.iconType === "image" ? customAppForm.iconImage : null,
    url: customAppForm.url,
    description: customAppForm.description,
    roles: ["administrator", "manager", "shop_floor"],
    type: customAppForm.type,
    modalId: "app",
    isCustom: true,
  }

  const newLayoutItem = {
    id: newApp.id,
    size: { col: 1, row: 1 },
  }

  const updatedState = {
    ...state,
    allAvailableApps: [...state.allAvailableApps, newApp],
    layouts: {
      ...state.layouts,
      administrator: [...state.layouts.administrator, newLayoutItem],
      manager: [...state.layouts.manager, newLayoutItem],
      shop_floor: [...state.layouts.shop_floor, newLayoutItem],
    },
  }

  setState(updatedState)

  // Force immediate save using the UPDATED state
  const { currentUser, editingLayoutForRole, pendingRoleChange, ...syncedData } = updatedState
  
  const result = await apiClient.saveState(syncedData)
  if (result.success && result.lastModified) {
    setLastSyncedTimestamp(result.lastModified)
    console.log("[v0] ✅ Custom app saved to server!")
  }

  // Reset form
  setCustomAppForm({
    name: "",
    url: "",
    icon: "fa-globe",
    iconType: "fontawesome",
    iconImage: "",
    iconSize: 96,
    description: "",
    type: "app",
  })
  setShowCustomAppForm(null)

  setTimeout(() => setIsSyncing(false), 1000)
}

const handleDeleteCustomApp = async (appId: string) => {
  if (!confirm("Are you sure you want to delete this custom app?")) return

  setIsSyncing(true) // STOP syncing during delete

  const updatedState = {
    ...state,
    allAvailableApps: state.allAvailableApps.filter((app) => app.id !== appId),
    // Also remove from all layouts
    layouts: Object.fromEntries(
      Object.entries(state.layouts).map(([role, layout]) => [role, layout.filter((item) => item.id !== appId)]),
    ),
  }

  setState(updatedState)

  // Force immediate save
  const { currentUser, editingLayoutForRole, pendingRoleChange, ...syncedData } = updatedState
  
  const result = await apiClient.saveState(syncedData)
  if (result.success && result.lastModified) {
    setLastSyncedTimestamp(result.lastModified)
    console.log("[v0] ✅ Custom app deleted from server!")
  }

  setTimeout(() => setIsSyncing(false), 1000)
}

  const handleAddAnnouncement = () => {
    if (!newAnnouncement.trim()) return
    setState({
      ...state,
      announcements: [...state.announcements, newAnnouncement.trim()],
    })
    setNewAnnouncement("")
  }

  const handleRemoveAnnouncement = (index: number) => {
    setState({
      ...state,
      announcements: state.announcements.filter((_, i) => i !== index),
    })
  }

  const renderWidget = (app: App) => {
    switch (app.id) {
      case "weather_widget":
        return <WeatherWidget iconColor={state.config.iconColor} />
      

      case "notice_widget":
        return (
          <NoticeBoardWidget
            iconColor={state.config.iconColor}
            notices={state.noticeBoardItems}
            onNoticeClick={handleNoticeClick}
            onManageClick={() => setOpenModal("notice-management")}
            canManage={canManage}
          />
        )
      default:
        return null
    }
  }

  const renderAppTile = (layoutItem: (typeof layoutItems)[0], index: number) => {
  const app = state.allAvailableApps.find((a) => a.id === layoutItem.id)
  if (!app) return null

  const colSpan = `col-span-${layoutItem.size.col}`
  const rowSpan = `row-span-${layoutItem.size.row}`
  const isDragging = draggedItemId === layoutItem.id
  const isDraggedOver = draggedOverIndex === index

  if (app.type === "widget") {
    return (
      <div
        key={app.id}
        draggable={true}
        onDragStart={() => handleMainBoardDragStart(layoutItem.id)}
        onDragOver={(e) => handleMainBoardDragOver(e, index)}
        onDrop={() => handleMainBoardDrop(index)}
        onDragEnd={handleMainBoardDragEnd}
        onTouchStart={() => isEditingMainBoard && handleMainBoardDragStart(layoutItem.id)}
        className={`relative ${colSpan} ${rowSpan} rounded-2xl border ${state.config.tileColor} border-border overflow-hidden shadow-sm transition-all ${
          isEditingMainBoard ? "cursor-move" : "cursor-grab active:cursor-grabbing"
        } ${isDragging ? "opacity-50 scale-95" : ""} ${isDraggedOver ? "ring-4 ring-primary" : ""} ${
          isEditingMainBoard ? "ring-2 ring-primary/30" : ""
        }`}
      >
    
  {renderWidget(app)}
        
{isEditingMainBoard && (
  <>
    {/* Floating label - shows on hover */}
    <div className="absolute top-3 left-3 bg-gradient-to-r from-primary to-primary/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
      <span className="text-sm font-semibold text-white">{app.name}</span>
    </div>
    
    {/* Simple delete button - shows on hover */}
    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all">
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleRemoveFromLayout(layoutItem.id)
        }}
        className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
        title="Remove widget"
      >
        <i className="fas fa-trash text-sm"></i>
      </button>
    </div>
  </>
)}
</div>
    )
  }

return (
    <div
      key={app.id}
      draggable={isEditingMainBoard}
      onDragStart={() => handleMainBoardDragStart(layoutItem.id)}
      onDragOver={(e) => handleMainBoardDragOver(e, index)}
      onDrop={() => handleMainBoardDrop(index)}
      onDragEnd={handleMainBoardDragEnd}
      onClick={() => !isEditingMainBoard && handleAppClick(app)}
      style={{
        gridColumnEnd: `span ${layoutItem.size.col}`,
        gridRowEnd: `span ${layoutItem.size.row}`,
      }}
      className={`group touch-feedback relative rounded-2xl border ${state.config.tileColor} border-border
        ${isEditingMainBoard ? "cursor-move" : "cursor-pointer"}
        hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 shadow-sm
        ${isDragging ? "opacity-50 scale-95 rotate-2" : ""}
        ${isDraggedOver ? "ring-4 ring-primary/50 scale-105" : ""}
        ${isEditingMainBoard ? "ring-2 ring-primary/20 hover:ring-primary/40" : ""}
      `}
    >
<div className="h-full p-2 flex flex-col items-center justify-center gap-1 text-center">
       <div 
  style={{ 
    width: `${(app.iconSize || 96) + 16}px`, 
    height: `${(app.iconSize || 96) + 16}px` 
  }}
  className={`rounded-full bg-secondary flex items-center justify-center flex-shrink-0 transition-transform ${
    isEditingMainBoard ? "group-hover:scale-110" : ""
  }`}>
         {app.customIcon ? (
  <img 
    src={app.customIcon} 
    alt={app.name} 
    style={{ width: `${app.iconSize || 96}px`, height: `${app.iconSize || 96}px` }}
    className="object-contain" 
  />
) : (
  <i className={`fas ${app.icon || "fa-globe"} ${state.config.iconColor} text-2xl`}></i>
)}
        </div>
        <span className="font-semibold text-sm text-foreground leading-tight line-clamp-2 px-1">{app.name}</span>
      </div>

      {isEditingMainBoard && (
        <>
          {/* Elegant minimal overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40 backdrop-blur-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
            <div className="bg-white/98 backdrop-blur-sm rounded-xl shadow-xl p-3 flex flex-col gap-2 border border-gray-200">
              
              {/* Width Control */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 w-12">Width</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleChangeSize(layoutItem.id, "col", -1)
                  }}
                  className="w-7 h-7 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  <i className="fas fa-minus text-xs"></i>
                </button>
                <span className="w-6 text-center text-sm font-semibold text-gray-700">{layoutItem.size.col}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleChangeSize(layoutItem.id, "col", 1)
                  }}
                  className="w-7 h-7 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  <i className="fas fa-plus text-xs"></i>
                </button>
              </div>

              {/* Height Control */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 w-12">Height</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleChangeSize(layoutItem.id, "row", -1)
                  }}
                  className="w-7 h-7 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  <i className="fas fa-minus text-xs"></i>
                </button>
                <span className="w-6 text-center text-sm font-semibold text-gray-700">{layoutItem.size.row}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleChangeSize(layoutItem.id, "row", 1)
                  }}
                  className="w-7 h-7 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  <i className="fas fa-plus text-xs"></i>
                </button>
              </div>

              {/* Subtle divider */}
              <div className="h-px bg-gray-200 my-1"></div>

              {/* Minimal delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveFromLayout(layoutItem.id)
                }}
                className="w-full py-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center justify-center gap-1.5 text-sm font-medium"
              >
                <i className="fas fa-trash text-xs"></i>
                Remove
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
  return (
   <div
  className={`
    ${state.config.backgroundColor}
    h-screen overflow-hidden flex flex-col
    screen-rotate-root
    ${isRotated ? "screen-rotated" : ""}
  `}
>

      <IntegraHeader
        currentUser={state.currentUser}
        users={state.users}
        onUserChange={handleUserChange}
        onOpenSettings={() => setOpenModal("settings")}
        onOpenAddApp={() => setOpenModal("app-store")}
        onOpenEditLayout={handleOpenLayoutEditor}
        onRotateScreen={() => setIsRotated(!isRotated)}
        isRotated={isRotated}
        canManage={canManage}
        isAdmin={isAdmin}
        onOpenTimeClock={() => window.open("https://integrasystems.fulcrumpro.com/timeclock/#/", "_blank")}
          theme={state?.theme} 
      />

      <AnnouncementTicker
        announcements={state.announcements}
        onEdit={() => setOpenModal("announcements")}
        canManage={canManage}
    headerColor={state?.theme?.headerColor || '#0891b2'}
      />

      <main className="flex-grow p-8 sm:p-10 lg:p-14 overflow-y-auto">
        <div className="flex justify-between items-start mb-10">
          <div className="flex-1">
            <h2 
  className="text-4xl lg:text-5xl font-semibold text-foreground mb-3" 
  style={{ fontFamily: state?.theme?.font }}
>
  {isEditingMainBoard ? (
    <span className="flex items-center gap-4">
      <i className="fas fa-edit text-primary"></i>
      Editing Layout: {state.users[state.editingLayoutForRole || state.currentUser.role]?.name}
    </span>
  ) : (
    state.config.appLibraryTitle
  )}
</h2>
            <p className="text-lg text-muted-foreground">
              {isEditingMainBoard
                ? "Drag apps to reorder, use controls to resize, then save your changes"
                : state.config.appLibrarySubtitle}
            </p>

            {isEditingMainBoard && canManage && (
              <div className="mt-6 flex items-center gap-4 flex-wrap">
                <span className="text-base font-semibold text-foreground">Editing layout for:</span>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => handleSwitchEditingRole("administrator")}
                    className={`touch-target touch-feedback px-6 py-3 rounded-xl font-semibold text-base transition-all ${
                      state.editingLayoutForRole === "administrator"
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-card text-foreground border border-border hover:bg-muted"
                    }`}
                  >
                    <i className="fas fa-user-shield mr-2"></i>
                    Administrator
                  </button>
                  <button
                    onClick={() => handleSwitchEditingRole("manager")}
                    className={`touch-target touch-feedback px-6 py-3 rounded-xl font-semibold text-base transition-all ${
                      state.editingLayoutForRole === "manager"
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-card text-foreground border border-border hover:bg-muted"
                    }`}
                  >
                    <i className="fas fa-user-tie mr-2"></i>
                    Manager
                  </button>
                  <button
                    onClick={() => handleSwitchEditingRole("shop_floor")}
                    className={`touch-target touch-feedback px-6 py-3 rounded-xl font-semibold text-base transition-all ${
                      state.editingLayoutForRole === "shop_floor"
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-card text-foreground border border-border hover:bg-muted"
                    }`}
                  >
                    <i className="fas fa-user-hard-hat mr-2"></i>
                    Shop Floor Operator
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] auto-rows-[150px] gap-8 lg:gap-10">
          {layoutItems.map((item, index) => renderAppTile(item, index))}
        </div>

        {isEditingMainBoard && (
          <div className="mt-10">
            <button
              onClick={() => setOpenModal("app-store")}
              className="touch-target touch-feedback w-full py-6 border-2 border-dashed border-primary/50 rounded-2xl text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-4 font-semibold text-lg"
            >
              <i className="fas fa-plus-circle text-3xl"></i>
              Add App to Layout
            </button>
          </div>
        )}
      </main>

     
{isEditingMainBoard && (
  <div className="fixed bottom-10 left-10 right-10 bg-popover border-2 border-primary rounded-full shadow-2xl px-8 py-5 flex items-center justify-center gap-6 z-40">
    {/* Cancel Button */}
    <button
      onClick={handleCancelLayoutEdit}
      className="touch-target touch-feedback px-8 py-3 bg-muted text-muted-foreground rounded-full hover:bg-muted/80 transition-colors font-semibold text-base"
    >
      <i className="fas fa-times mr-2"></i>
      Cancel
    </button>

    {/* Divider */}
    <div className="h-10 w-px bg-border"></div>

    {/* Customize Theme Button (Admins & Managers Only) */}
    {["administrator", "manager"].includes(state.currentUser.role) && (
      <>
        <button
          onClick={() => setOpenModal("theme")}
          className="touch-target touch-feedback px-8 py-3 border-2 border-primary text-primary rounded-full hover:bg-primary hover:text-white transition-colors font-semibold text-base"
        >
          <i className="fas fa-palette mr-2"></i>
          Customize Theme
        </button>
        <div className="h-10 w-px bg-border"></div>
      </>
    )}

    {/* Save Button */}
    <button
      onClick={handleSaveLayout}
      className="touch-target touch-feedback px-8 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors font-semibold text-base"
    >
      <i className="fas fa-save mr-2"></i>
      Save Layout
    </button>
  </div>
)}


      {/* Passcode Modal */}
      {openModal === "passcode" && state.pendingRoleChange && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-popover border border-border rounded-2xl shadow-2xl w-full max-w-md p-8">
            <div className="text-center mb-6">
              <i className="fas fa-lock text-primary text-4xl mb-4"></i>
              <h3 className="text-2xl font-bold text-popover-foreground mb-2">Enter Passcode</h3>
              <p className="text-muted-foreground">Switching to: {state.users[state.pendingRoleChange]?.name}</p>
            </div>

            <div className="space-y-4">
              <input
                type="password"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePasscodeSubmit()}
                placeholder="Enter passcode"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />

              {passcodeError && (
                <div className="text-destructive text-sm text-center">
                  <i className="fas fa-exclamation-circle mr-2"></i>
                  {passcodeError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handlePasscodeCancel}
                  className="flex-1 px-4 py-3 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasscodeSubmit}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {openModal === "settings" && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-popover border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-popover">
              <div className="flex items-center gap-4">
                <i className="fas fa-cog text-primary text-2xl"></i>
                <h3 className="text-2xl font-bold text-popover-foreground">Settings</h3>
              </div>
              <button
                onClick={() => setOpenModal(null)}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="p-4 bg-card border border-border rounded-xl">
                <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <i className="fas fa-tablet-alt text-primary"></i>
                  Device Settings
                </h4>
                {isAdmin && (
  <div className="p-4 bg-card border border-border rounded-xl">
    <LogoSettingsSynced 
      state={state}
      setState={setState}
      setLastSyncedTimestamp={setLastSyncedTimestamp}
      setIsSyncing={setIsSyncing}
    />
  </div>
)}
        <div className="space-y-6">
  {/* Device Name */}
  <div className="bg-background/50 backdrop-blur-sm p-5 rounded-xl border border-border hover:border-primary/50 transition-all">
    <label className="block text-sm font-bold text-foreground mb-3 flex items-center gap-2">
      <i className="fas fa-tag text-primary"></i>
      Device Name
    </label>
    <input
  type="text"
  defaultValue={localStorage.getItem("integra_device_name") || ""}
  onBlur={(e) => {
    const newName = e.target.value
    localStorage.setItem("integra_device_name", newName)
    const deviceId = localStorage.getItem("integra_device_id")
    if (deviceId) {
      apiClient.updateDeviceName(deviceId, newName)
    }
  }}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.currentTarget.blur()
    }
  }}
  className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl text-foreground text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
  placeholder="Enter device name"
/>
    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
      <i className="fas fa-info-circle"></i>
      This name identifies this device on the network
    </p>
  </div>

  {/* Device ID */}
  <div className="bg-background/50 backdrop-blur-sm p-5 rounded-xl border border-border">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary/10 rounded-lg">
        <i className="fas fa-fingerprint text-primary text-xl"></i>
      </div>
      <div className="flex-1">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          Device ID
        </div>
        <code className="text-sm text-foreground font-mono bg-muted px-3 py-1 rounded-lg">
          {localStorage.getItem("integra_device_id")?.substring(0, 24)}...
        </code>
      </div>
    </div>
  </div>

  {/* Reset Button */}
  <div className="pt-4 border-t-2 border-border">
    <button
      onClick={handleResetDevice}
      className="w-full px-6 py-4 bg-gradient-to-r from-red-500/10 to-red-600/10 text-red-600 dark:text-red-400 border-2 border-red-500/30 rounded-xl hover:from-red-500/20 hover:to-red-600/20 hover:border-red-500/50 transition-all font-bold text-base flex items-center justify-center gap-3 group shadow-sm hover:shadow-md"
    >
      <div className="p-2 bg-red-500/20 rounded-lg group-hover:scale-110 transition-transform">
        <i className="fas fa-redo text-lg"></i>
      </div>
      <span>Reset Device Registration</span>
    </button>
    <p className="text-xs text-center text-muted-foreground mt-3 flex items-center justify-center gap-2">
      <i className="fas fa-exclamation-triangle text-yellow-600"></i>
      This will clear device settings and show the setup screen again
    </p>
  </div>
</div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">App Library Title</label>
                <input
                  type="text"
                  value={state.config.appLibraryTitle}
                  onChange={(e) => setState({ ...state, config: { ...state.config, appLibraryTitle: e.target.value } })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">App Library Subtitle</label>
                <input
                  type="text"
                  value={state.config.appLibrarySubtitle}
                  onChange={(e) =>
                    setState({ ...state, config: { ...state.config, appLibrarySubtitle: e.target.value } })
                  }
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">User Passcodes</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-32 text-muted-foreground">Administrator:</span>
                    <input
                      type="text"
                      value={state.users.administrator.passcode || ""}
                      onChange={(e) =>
                        setState({
                          ...state,
                          users: {
                            ...state.users,
                            administrator: { ...state.users.administrator, passcode: e.target.value },
                          },
                        })
                      }
                      className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-32 text-muted-foreground">Manager:</span>
                    <input
                      type="text"
                      value={state.users.manager.passcode || ""}
                      onChange={(e) =>
                        setState({
                          ...state,
                          users: { ...state.users, manager: { ...state.users.manager, passcode: e.target.value } },
                        })
                      }
                      className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

 {openModal === "theme" && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl shadow-lg p-6 w-[420px] space-y-4">
      <h2 className="text-xl font-semibold text-gray-700">Customize Integra OS</h2>

      <div className="space-y-3">
        <label className="block">
          Primary Color:
          <input
            type="color"
            value={state?.theme?.primary || '#0067b8'}
            onChange={(e) => {
              const updatedState = {
                ...state,
                theme: { ...state.theme, primary: e.target.value }
              }
              setState(updatedState)
            }}
            className="ml-2"
          />
        </label>

        <label className="block">
          Header/Announcement Bar Color:
          <input
            type="color"
            value={state?.theme?.headerColor || '#0891b2'}
            onChange={(e) => {
              const updatedState = {
                ...state,
                theme: { ...state.theme, headerColor: e.target.value }
              }
              setState(updatedState)
            }}
            className="ml-2"
          />
        </label>

        <label className="block">
          Background Color:
          <input
            type="color"
            value={state?.theme?.background || '#f5f9ff'}
            onChange={(e) => {
              const updatedState = {
                ...state,
                theme: { ...state.theme, background: e.target.value }
              }
              setState(updatedState)
            }}
            className="ml-2"
          />
        </label>

        <label className="block">
          Font Family:
          <select
            value={state?.theme?.font || 'Inter, sans-serif'}
            onChange={(e) => {
              const updatedState = {
                ...state,
                theme: { ...state.theme, font: e.target.value }
              }
              setState(updatedState)
            }}
            className="mt-1 border rounded-md p-1"
          >
            <option value="Inter, sans-serif">Inter</option>
            <option value="Poppins, sans-serif">Poppins</option>
            <option value="Roboto, sans-serif">Roboto</option>
          </select>
        </label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <button
          onClick={() => setOpenModal(null)}
          className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            setIsSyncing(true)
            
            const { currentUser, editingLayoutForRole, pendingRoleChange, ...syncedData } = state
            const result = await apiClient.saveState(syncedData)
            if (result.success && result.lastModified) {
              setLastSyncedTimestamp(result.lastModified)
              console.log("[v0] ✅ Theme saved to server!")
            }
            
            setOpenModal(null)
            setTimeout(() => setIsSyncing(false), 1000)
          }}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}


      {/* App Store Modal - Enhanced with custom app creation */}
      {openModal === "app-store" && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-popover border border-border rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-popover z-10">
        <div className="flex items-center gap-4">
          <i className="fas fa-store text-primary text-2xl"></i>
          <h3 className="text-2xl font-bold text-popover-foreground">App Store</h3>
        </div>
        <button
          onClick={() => {
            setOpenModal(null)
            setShowCustomAppForm(null)
          }}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <i className="fas fa-times text-2xl"></i>
        </button>
      </div>
            

            <div className="p-6">
  {isAdmin && !showCustomAppForm && (
    <div className="mb-6 flex gap-3">
      <button
        onClick={() => {
          setShowCustomAppForm("web")
          setCustomAppForm({ ...customAppForm, type: "app" })
        }}
        className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold flex items-center justify-center gap-2"
      >
        <i className="fas fa-plus-circle"></i>
        Add Web Link App
      </button>
      <button
        onClick={() => {
          setShowCustomAppForm("local")
          setCustomAppForm({ ...customAppForm, type: "local" })
        }}
        className="flex-1 py-3 px-4 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-semibold flex items-center justify-center gap-2"
      >
        <i className="fas fa-desktop"></i>
        Add Local App
      </button>
    </div>
  )}

  {showCustomAppForm && (
  <div className="mb-6 p-6 bg-card border border-border rounded-xl">
    <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
      <i className={`fas ${showCustomAppForm === "web" ? "fa-link" : "fa-desktop"}`}></i>
      {showCustomAppForm === "web" ? "Create Web Link App" : "Create Local App"}
    </h4>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          App Name <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={customAppForm.name}
          onChange={(e) => setCustomAppForm({ ...customAppForm, name: e.target.value })}
          placeholder="e.g., Company Portal"
          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
                    <div>
  <label className="block text-sm font-semibold text-foreground mb-2">
    {showCustomAppForm === "web" ? "URL" : "Path/URL"} <span className="text-destructive">*</span>
  </label>
  <input
    type="text"
    value={customAppForm.url}
    onChange={(e) => setCustomAppForm({ ...customAppForm, url: e.target.value })}
    placeholder={
      showCustomAppForm === "web"
        ? "https://example.com"
        : "http://192.168.1.100:8080 or C:\\Program Files\\App"
    }
    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
  />
</div>
<div>
  <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
  <textarea
    value={customAppForm.description}
    onChange={(e) => setCustomAppForm({ ...customAppForm, description: e.target.value })}
    placeholder="Brief description of the app"
    rows={2}
    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
  />
</div>

<div>
  <label className="block text-sm font-semibold text-foreground mb-2">
    Icon Type
  </label>
  <div className="flex gap-3 mb-3">
    <button
      type="button"
      onClick={() => setCustomAppForm({ ...customAppForm, iconType: "fontawesome" })}
      className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
        customAppForm.iconType === "fontawesome"
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      <i className="fas fa-font mr-2"></i>
      FontAwesome
    </button>
    <button
      type="button"
      onClick={() => setCustomAppForm({ ...customAppForm, iconType: "image" })}
      className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
        customAppForm.iconType === "image"
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      <i className="fas fa-image mr-2"></i>
      Custom Image
    </button>
  </div>
  
  {customAppForm.iconType === "fontawesome" ? (
    <>
      <label className="block text-sm font-semibold text-foreground mb-2">
        Icon (FontAwesome class)
      </label>
      <div className="flex gap-2 mb-2">
        <input
        type="text"
        value={customAppForm.icon}
        onChange={(e) => setCustomAppForm({ ...customAppForm, icon: e.target.value })}
        placeholder="fa-globe"
        className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
        <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
        <i className={`fas ${customAppForm.icon} ${state.config.iconColor} text-xl`}></i>
        </div>
      </div>
      <a
        href="https://fontawesome.com/search?o=r&m=free"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-semibold"
      >
        <i className="fas fa-external-link-alt"></i>
        Browse All Free Icons
      </a>
      <p className="text-xs text-muted-foreground mt-2">
        Click the button above to browse thousands of icons, then copy the icon class (like "fa-globe") and paste it here
      </p>
    </>
  ) : (
    <>
  <label className="block text-sm font-semibold text-foreground mb-2">
    Upload Icon Image (PNG, JPG, SVG)
  </label>
  <div className="flex gap-2">
    <label className="flex-1 cursor-pointer">
      <div className="w-full px-4 py-3 bg-background border-2 border-dashed border-border rounded-lg text-center hover:border-primary transition-colors">
        {customAppForm.iconImage ? (
          <div className="flex items-center justify-center gap-2">
            <i className="fas fa-check-circle text-primary"></i>
            <span>Image uploaded</span>
          </div>
        ) : (
              <div>
  <i className="fas fa-cloud-upload-alt text-2xl mb-2 block text-muted-foreground"></i>
  <span className="text-muted-foreground">Click to upload image</span>
</div>
        )}
      </div>
      <input
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = () => {
              setCustomAppForm({
                ...customAppForm,
                iconImage: reader.result as string,
              })
            }
            reader.readAsDataURL(file)
          }
        }}
        className="hidden"
      />
    </label>
   {customAppForm.iconImage && (
  <div className="bg-secondary rounded-lg flex items-center justify-center overflow-hidden p-2" 
       style={{ 
         width: `${(customAppForm.iconSize || 96) + 16}px`, 
         height: `${(customAppForm.iconSize || 96) + 16}px` 
       }}>
    <img
      src={customAppForm.iconImage}
      alt="Icon preview"
      style={{ 
        width: `${customAppForm.iconSize || 96}px`, 
        height: `${customAppForm.iconSize || 96}px` 
      }}
      className="object-contain"
    />
  </div>
)}
  </div>
      <p className="text-xs text-muted-foreground mt-2">
        Upload a square image (recommended 256x256px or similar). PNG with transparency works best.
      </p>
      {customAppForm.iconImage && (
  <div className="mt-4 space-y-2">
    <label className="text-sm font-medium">
      Icon Size: {customAppForm.iconSize || 48}px
    </label>
    <input
      type="range"
      min="64"
      max="256"
      value={customAppForm.iconSize || 96}
      onChange={(e) => {
        setCustomAppForm({
          ...customAppForm,
          iconSize: parseInt(e.target.value),
        })
      }}
      className="w-full"
    />
    <div className="flex justify-between text-xs text-muted-foreground">
      <span>64px (Small)</span>
      <span>256px (Large)</span>
    </div>
  </div>
)}
    </>
  )}
</div>

<div className="flex gap-3 pt-2">
  <button
    onClick={() => {
      setShowCustomAppForm(null)
      setCustomAppForm({
        name: "",
        url: "",
        icon: "fa-globe",
        iconType: "fontawesome",
        iconImage: "",
        iconSize: 96, 
        description: "",
        type: "app",
      })
    }}
    className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors font-semibold"
  >
    Cancel
  </button>
  <button
    onClick={handleCreateCustomApp}
    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
  >
    <i className="fas fa-check mr-2"></i>
    Create App
  </button>
</div>

                  </div>
                </div>
              )}

              {!showCustomAppForm && (
                <>
                  <p className="text-muted-foreground mb-6">
                    {isEditingMainBoard
                      ? "Click on an app to add it to your layout"
                      : "Browse available applications for your workspace"}
                  </p>

                  {state.allAvailableApps.some((app) => app.isCustom) && (
                    <>
                      <h4 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                        <i className="fas fa-star text-primary"></i>
                        Custom Apps
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {state.allAvailableApps
                          .filter((app) => app.isCustom)
                          .map((app) => {
                            const inLayout = isEditingMainBoard && editingLayout.some((item) => item.id === app.id)
                            return (
                             <div
  key={app.id}
  className={`p-4 bg-card border border-border rounded-lg transition-all ${
    isEditingMainBoard
      ? inLayout
        ? "cursor-pointer hover:shadow-lg hover:border-destructive opacity-75"
        : "cursor-pointer hover:shadow-lg hover:border-primary"
      : ""
  }`}
>
                                <div className="flex items-start gap-4">
  <div
    onClick={() => {
      if (!isEditingMainBoard) return
      if (inLayout) {
        handleRemoveFromLayout(app.id)
      } else {
        handleAddToLayout(app.id)
      }
    }}
    className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden"
  >
   {app.customIcon ? (
  <img
    src={app.customIcon}
    alt={app.name}
    style={{ width: `${app.iconSize || 96}px`, height: `${app.iconSize || 96}px` }}
    className="object-contain rounded-md"
  />
) : (
  <i className={`fas ${app.icon || "fa-globe"} ${state.config.iconColor} text-xl`}></i>
)}
  </div>

                                  <div
                                  onClick={() => {
  if (!isEditingMainBoard) return
  if (inLayout) {
    handleRemoveFromLayout(app.id)
  } else {
    handleAddToLayout(app.id)
  }
}}
                                    className="flex-1"
                                  >
                                    <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                                      {app.name}
                                      {inLayout && <i className="fas fa-check text-primary text-sm"></i>}
                                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                                        {app.type === "local" ? "Local" : "Web"}
                                      </span>
                                    </h4>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {app.description || "Custom application"}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">{app.url}</p>
                                  </div>
                                  {isAdmin && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteCustomApp(app.id)
                                      }}
                                      className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                      title="Delete custom app"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </>
                  )}

                  <h4 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                    <i className="fas fa-th text-primary"></i>
                    Built-in Apps
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {state.allAvailableApps
                       .filter((app) => {
  const roleToEdit = state.editingLayoutForRole || state.currentUser.role
  // If Administrator is editing layouts, show ALL apps
  if (isEditingMainBoard && state.currentUser.role === "administrator") {
    return !app.isCustom
  }
  // Otherwise filter by role
  return !app.isCustom && app.roles.includes(roleToEdit)
})
                      .map((app) => {
                        const inLayout = isEditingMainBoard && editingLayout.some((item) => item.id === app.id)
                        return (
                          <div
                            key={app.id}
                           onClick={() => {
  if (!isEditingMainBoard) return
  if (inLayout) {
    handleRemoveFromLayout(app.id)
  } else {
    handleAddToLayout(app.id)
  }
}}
                            className={`p-4 bg-card border border-border rounded-lg transition-all ${
  isEditingMainBoard
    ? inLayout
      ? "cursor-pointer hover:shadow-lg hover:border-destructive opacity-75"
      : "cursor-pointer hover:shadow-lg hover:border-primary"
    : ""
}`}
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                <i className={`fas ${app.icon} ${state.config.iconColor} text-xl`}></i>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                                  {app.name}
                                  {inLayout && <i className="fas fa-check text-primary text-sm"></i>}
                                </h4>
                                <p className="text-sm text-muted-foreground mb-2">{app.description}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <i className="fas fa-users"></i>
                                  <span>{app.roles.join(", ")}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

     

      {/* App Modal */}
      {openModal === "app" && selectedApp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-popover border border-border rounded-2xl shadow-2xl w-11/12 h-5/6 flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-4">
                <i className={`fas ${selectedApp.icon} ${state.config.iconColor} text-2xl`}></i>
                <h3 className="text-xl font-bold text-popover-foreground">{selectedApp.name}</h3>
              </div>
              <button
                onClick={() => setOpenModal(null)}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>
            <div className="p-2 flex-grow">
              <iframe
                src={selectedApp.url}
                className="w-full h-full border-0 rounded-b-xl"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                allow="fullscreen"
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {openModal === "communication" && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-popover border border-border rounded-2xl shadow-2xl w-11/12 h-5/6 flex flex-col overflow-hidden">
            <CommunicationApp
              currentUser={state.currentUser.name}
              deviceId={localStorage.getItem("integra_device_id") || ""}
              onClose={() => setOpenModal(null)}
            />
          </div>
        </div>
      )}

      {/* Time Clock Modal - REMOVED, now opens in new tab */}

      {openModal === "notice-pdf" && selectedNotice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-popover border border-border rounded-2xl shadow-2xl w-11/12 h-5/6 flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-4">
                <i className="fas fa-file-pdf text-destructive text-2xl"></i>
                <h3 className="text-xl font-bold text-popover-foreground">{selectedNotice.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedNotice.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="touch-target touch-feedback px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold text-sm"
                  title="Open in new tab"
                >
                  <i className="fas fa-external-link-alt mr-2"></i>
                  Open in New Tab
                </a>
                <button
                  onClick={() => setOpenModal(null)}
                  className="touch-target touch-feedback p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <i className="fas fa-times text-2xl"></i>
                </button>
              </div>
            </div>
            <div className="p-2 flex-grow relative">
              <object
                data={`${selectedNotice.url}#toolbar=0&navpanes=0&scrollbar=0`}
                type="application/pdf"
                className="w-full h-full rounded-b-xl"
              >
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center p-8">
                  <i className="fas fa-file-pdf text-destructive text-6xl"></i>
                  <p className="text-foreground text-lg font-semibold">Unable to display PDF in browser</p>
                  <p className="text-muted-foreground">
                    Your browser may not support embedded PDFs or the file may be blocked.
                  </p>
                  <a
                    href={selectedNotice.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="touch-target touch-feedback px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                  >
                    <i className="fas fa-external-link-alt mr-2"></i>
                    Open PDF in New Tab
                  </a>
                  <a
                    href={selectedNotice.url}
                    download
                    className="touch-target touch-feedback px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-semibold"
                  >
                    <i className="fas fa-download mr-2"></i>
                    Download PDF
                  </a>
                </div>
              </object>
            </div>
          </div>
        </div>
      )}

      {/* Announcements Management Modal */}
      {openModal === "announcements" && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-popover border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-popover">
              <div className="flex items-center gap-4">
                <i className="fas fa-bullhorn text-primary text-2xl"></i>
                <h3 className="text-2xl font-bold text-popover-foreground">Manage Announcements</h3>
              </div>
              <button
                onClick={() => setOpenModal(null)}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Add New Announcement</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAnnouncement}
                    onChange={(e) => setNewAnnouncement(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddAnnouncement()}
                    placeholder="Type your announcement here..."
                    className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleAddAnnouncement}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">Current Announcements</label>
                {state.announcements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="fas fa-inbox text-4xl mb-3 block"></i>
                    <p>No announcements yet. Add one above!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {state.announcements.map((announcement, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg group hover:border-primary/50 transition-colors"
                      >
                        <i className="fas fa-bullhorn text-primary"></i>
                        <span className="flex-1 text-foreground">{announcement}</span>
                        <button
                          onClick={() => handleRemoveAnnouncement(index)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-destructive hover:bg-destructive/10 rounded transition-all"
                          title="Remove announcement"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {openModal === "notice-management" && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-popover border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-popover z-10">
              <div className="flex items-center gap-4">
                <i className="fas fa-thumbtack text-primary text-2xl"></i>
                <h3 className="text-2xl font-bold text-popover-foreground">Manage Notice Board</h3>
              </div>
              <button
                onClick={() => setOpenModal(null)}
                className="touch-target touch-feedback p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="p-6 bg-card border border-border rounded-xl">
                <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <i className="fas fa-plus-circle text-primary"></i>
                  Upload New PDF Notice
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Notice Title <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={newNoticeForm.title}
                      onChange={(e) => setNewNoticeForm({ ...newNoticeForm, title: e.target.value })}
                      placeholder="e.g., Safety Protocol Update"
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      PDF File <span className="text-destructive">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex-1 cursor-pointer">
                        <div
                          className={`w-full px-4 py-3 bg-background border-2 border-dashed rounded-lg text-center transition-colors ${
                            selectedFile
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          }`}
                        >
                          {selectedFile ? (
                            <div className="flex items-center justify-center gap-2 text-foreground">
                              <i className="fas fa-file-pdf text-destructive"></i>
                              <span className="font-medium">{selectedFile.name}</span>
                              <span className="text-sm text-muted-foreground">
                                ({(selectedFile.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">
                              <i className="fas fa-cloud-upload-alt text-2xl mb-2 block"></i>
                              <span>Click to select PDF file</span>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>
                      {selectedFile && (
                        <button
                          onClick={() => setSelectedFile(null)}
                          className="touch-target touch-feedback p-3 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          title="Remove file"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a PDF file from your computer (max 10MB)
                    </p>
                  </div>
                  <button
                    onClick={handleAddNotice}
                    disabled={uploadingPDF || !newNoticeForm.title.trim() || !selectedFile}
                    className="touch-target touch-feedback w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingPDF ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-upload mr-2"></i>
                        Upload Notice
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Current Notices List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <i className="fas fa-list text-primary"></i>
                    All Notices
                  </h4>
                  <span className="text-sm text-muted-foreground">
                    {state.noticeBoardItems.filter((n) => n.pinned).length} / 4 pinned
                  </span>
                </div>

                {state.noticeBoardItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground bg-card border border-border rounded-lg">
                    <i className="fas fa-inbox text-4xl mb-3 block"></i>
                    <p>No notices yet. Upload one above!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {state.noticeBoardItems.map((notice) => (
                      <div
                        key={notice.id}
                        className={`p-4 bg-card border rounded-lg transition-all ${
                          notice.pinned ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <button
                            onClick={() => handleTogglePin(notice.id)}
                            className={`touch-target touch-feedback p-3 rounded-lg transition-all flex-shrink-0 ${
                              notice.pinned
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-primary/20"
                            }`}
                            title={notice.pinned ? "Pin to widget" : "Unpin from widget"}
                          >
                            <i className={`fas fa-thumbtack text-xl ${notice.pinned ? "" : "rotate-45"}`}></i>
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h5 className="font-semibold text-foreground flex items-center gap-2">
                                <i className="fas fa-file-pdf text-destructive"></i>
                                {notice.title}
                                {notice.pinned && (
                                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Pinned</span>
                                )}
                              </h5>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleNoticeClick(notice)}
                                className="touch-target touch-feedback text-sm px-3 py-1.5 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors"
                              >
                                <i className="fas fa-eye mr-1"></i>
                                Preview
                              </button>
                              <button
                                onClick={() => handleRemoveNotice(notice.id)}
                                className="touch-target touch-feedback text-sm px-3 py-1.5 bg-destructive/20 text-destructive rounded hover:bg-destructive hover:text-destructive-foreground transition-colors"
                              >
                                <i className="fas fa-trash mr-1"></i>
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showServerConfig && (
        <ServerConfig
          onClose={() => setShowServerConfig(false)}
          onConnect={async () => {
            const isConnected = await apiClient.healthCheck()
            setServerConnected(isConnected)
            if (isConnected) {
              const serverState = await apiClient.getState()
              if (serverState) {
                setState(serverState)
                // Update lastSyncedTimestamp on connect
                setLastSyncedTimestamp(serverState.lastModified || 0)
              }
            }
            setShowServerConfig(false)
          }}
        />
      )}

      {/* Training Modal */}
      {openModal === "training" && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-popover border border-border rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-4">
                <i className="fas fa-chalkboard-teacher text-primary text-2xl"></i>
                <h3 className="text-2xl font-bold text-popover-foreground">Employee Training</h3>
              </div>
              <button
                onClick={() => {
                  setOpenModal(null)
                  setTrainingView("documents")
                }}
              
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>

            <div className="flex border-b border-border">
              <button
                onClick={() => setTrainingView("documents")}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  trainingView === "documents"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <i className="fas fa-file-pdf mr-2"></i>
                Training Documents
              </button>
              <button
                onClick={() => setTrainingView("forms")}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  trainingView === "forms"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <i className="fas fa-clipboard-list mr-2"></i>
                Training Forms
              </button>
              <button
                onClick={() => setTrainingView("employees")}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  trainingView === "employees"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <i className="fas fa-users mr-2"></i>
                Employees
              </button>
              <button
                onClick={() => setTrainingView("matrix")}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  trainingView === "matrix"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <i className="fas fa-table mr-2"></i>
                Skills Matrix
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                          {trainingView === "documents" && (
                <div className="space-y-4">
                  {/* Upload Section - Only for Managers and Admins */}
                  {canManageTraining && (
                    <div className="p-6 bg-card border border-border rounded-xl mb-6">
                      <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <i className="fas fa-upload text-primary"></i>
                        Upload Training Document
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            Document Title <span className="text-destructive">*</span>
                          </label>
                          <input
                            type="text"
                            value={newNoticeForm.title}
                            onChange={(e) => setNewNoticeForm({ ...newNoticeForm, title: e.target.value })}
                            placeholder="e.g., Safety Training Manual"
                            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            PDF File <span className="text-destructive">*</span>
                          </label>
                          <div className="flex items-center gap-3">
                            <label className="flex-1 cursor-pointer">
                              <div
                                className={`w-full px-4 py-3 bg-background border-2 border-dashed rounded-lg text-center transition-colors ${
                                  selectedFile
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                                }`}
                              >
                                {selectedFile ? (
                                  <div className="flex items-center justify-center gap-2 text-foreground">
                                    <i className="fas fa-file-pdf text-destructive"></i>
                                    <span className="font-medium">{selectedFile.name}</span>
                                    <span className="text-sm text-muted-foreground">
                                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                                    </span>
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground">
                                    <i className="fas fa-cloud-upload-alt text-2xl mb-2 block"></i>
                                    <span>Click to select PDF file</span>
                                  </div>
                                )}
                              </div>
                              <input
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                className="hidden"
                              />
                            </label>
                            {selectedFile && (
                              <button
                                onClick={() => setSelectedFile(null)}
                                className="p-3 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                title="Remove file"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            if (!newNoticeForm.title.trim() || !selectedFile) {
                              alert("Please provide a title and select a PDF file")
                              return
                            }
                            setUploadingPDF(true)
                            try {
                              const pdfUrl = await apiClient.uploadPdf(selectedFile)
                              if (!pdfUrl) {
                                throw new Error("Upload failed")
                              }
                              const newDoc = {
                                id: `doc_${Date.now()}`,
                                title: newNoticeForm.title.trim(),
                                url: pdfUrl,
                              }
                              setState({
                                ...state,
                                training: {
                                  ...state.training,
                                  documents: [...state.training.documents, newDoc],
                                },
                              })
                              setNewNoticeForm({ title: "", url: "" })
                              setSelectedFile(null)
                              alert("Training document uploaded successfully!")
                            } catch (error) {
                              console.error("Error uploading PDF:", error)
                              alert("Failed to upload PDF. Please try again.")
                            } finally {
                              setUploadingPDF(false)
                            }
                          }}
                          disabled={uploadingPDF || !newNoticeForm.title.trim() || !selectedFile}
                          className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploadingPDF ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-upload mr-2"></i>
                              Upload Training Document
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Documents List - Viewable by Everyone */}
                  <h4 className="text-lg font-bold text-foreground mb-4">Training Documents</h4>
                  {state.training.documents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-card border border-border rounded-lg">
                      <i className="fas fa-inbox text-4xl mb-3 block"></i>
                      <p>No training documents available</p>
                      {canManageTraining && <p className="text-sm mt-2">Upload your first document above!</p>}
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {state.training.documents.map((doc) => (
                        <div key={doc.id} className="p-4 bg-card border border-border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <i className="fas fa-file-pdf text-destructive text-xl"></i>
                              <span className="font-semibold text-foreground">{doc.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                              >
                                <i className="fas fa-external-link-alt mr-2"></i>
                                Open
                              </a>
                              {canManageTraining && (
                                <button
                                  onClick={async () => {
                                    if (!confirm("Are you sure you want to delete this training document?")) return
                                    try {
                                      await apiClient.deletePdf(doc.url)
                                      setState({
                                        ...state,
                                        training: {
                                          ...state.training,
                                          documents: state.training.documents.filter((d) => d.id !== doc.id),
                                        },
                                      })
                                    } catch (error) {
                                      console.error("Error deleting PDF:", error)
                                      alert("Failed to delete document.")
                                    }
                                  }}
                                  className="px-3 py-2 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors text-sm"
                                  title="Delete document"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
{trainingView === "forms" && (
  <>
    {/* Safety Forms Manager - List View */}
    {safetyFormView === "list" && (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-bold text-foreground">Safety Induction Forms</h4>
          <button
            onClick={() => setSafetyFormView("create")}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            New Form
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-primary/10 rounded-lg p-4">
            <div className="text-3xl font-bold text-primary">{safetyFormSubmissions.length}</div>
            <div className="text-primary text-sm">Total Forms</div>
          </div>
          <div className="bg-primary/10 rounded-lg p-4">
            <div className="text-3xl font-bold text-primary">
              {safetyFormSubmissions.filter(s => {
                const submissionDate = new Date(s.completedDate)
                const now = new Date()
                return submissionDate.getMonth() === now.getMonth() && submissionDate.getFullYear() === now.getFullYear()
              }).length}
            </div>
            <div className="text-primary text-sm">This Month</div>
          </div>
          <div className="bg-primary/10 rounded-lg p-4">
            <div className="text-3xl font-bold text-primary">100%</div>
            <div className="text-primary text-sm">Completion Rate</div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              value={formSearchTerm}
              onChange={(e) => setFormSearchTerm(e.target.value)}
              placeholder="Search by employee name or position..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Forms List */}
        {safetyFormSubmissions.filter(s =>
          s.employeeName.toLowerCase().includes(formSearchTerm.toLowerCase()) ||
          (s.position && s.position.toLowerCase().includes(formSearchTerm.toLowerCase()))
        ).length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-clipboard-list text-4xl text-gray-400"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Forms Yet</h3>
            <p className="text-gray-500 mb-6">Create your first safety induction form to get started</p>
            <button
              onClick={() => setSafetyFormView("create")}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              <i className="fas fa-plus mr-2"></i>
              Create First Form
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {safetyFormSubmissions
              .filter(s =>
                s.employeeName.toLowerCase().includes(formSearchTerm.toLowerCase()) ||
                (s.position && s.position.toLowerCase().includes(formSearchTerm.toLowerCase()))
              )
              .map((submission) => (
                <div key={submission.id} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all hover:border-primary/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/20 p-4 rounded-full">
                        <i className="fas fa-user-check text-2xl text-primary"></i>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{submission.employeeName}</h3>
                        <p className="text-gray-600">{submission.position || "No position specified"}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <i className="fas fa-calendar"></i>
                            <span>{new Date(submission.completedDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <i className="fas fa-user-clock"></i>
                            <span>{new Date(submission.completedDate).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        <i className="fas fa-check-circle mr-1"></i>
                        Completed
                      </span>
                      <button
                        onClick={() => {
                          setSelectedFormSubmission(submission)
                          setSafetyFormView("view")
                        }}
                        className="p-3 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                        title="View Form"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this form submission?")) {
                            const updated = safetyFormSubmissions.filter(s => s.id !== submission.id)
                            setSafetyFormSubmissions(updated)
                            localStorage.setItem("safety_induction_forms", JSON.stringify(updated))
                          }
                        }}
                        className="p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title="Delete Form"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => setTrainingView("documents")}
          className="mt-6 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Training Documents
        </button>
      </div>
    )}

    {/* Create/View Form */}
    {(safetyFormView === "create" || safetyFormView === "view") && (
      <div className="bg-white rounded-lg shadow-xl p-8 max-h-[calc(90vh-200px)] overflow-y-auto">
        {/* Header */}
        <div className="mb-8 pb-6 border-b-2 border-primary">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-white p-3 rounded-lg">
                <i className="fas fa-hard-hat text-2xl"></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-primary">Safety Induction Standard</h1>
                <p className="text-gray-600">HRM-SafetyInductionStandard-WI-00</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSafetyFormView("list")
                setSelectedFormSubmission(null)
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <i className="fas fa-times text-2xl text-gray-600"></i>
            </button>
          </div>
          <div className="flex gap-8 text-sm text-gray-600">
            <div><strong>Date:</strong> {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>

        {/* Inductee Details */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-primary mb-4 pb-2 border-b-2 border-primary">Inductee Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name: <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                disabled={safetyFormView === "view"}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Position:</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                disabled={safetyFormView === "view"}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number:</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                disabled={safetyFormView === "view"}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Emergency Contact Person and Number:</label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                disabled={safetyFormView === "view"}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Method Section */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-primary mb-4 pb-2 border-b-2 border-primary">Method</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-primary/80 text-white">
                <th className="border border-gray-300 p-2 text-left">Name</th>
                <th className="border border-gray-300 p-2 w-40">Date</th>
                <th className="border border-gray-300 p-2 w-24">Done?</th>
              </tr>
            </thead>
            <tbody>
              {formData.methodItems.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="border border-gray-300 p-3">
                    <div className="whitespace-pre-line">{`${index + 1}. ${item.name}`}</div>
                  </td>
                  <td className="border border-gray-300 p-2">
                    <input
                      type="date"
                      value={item.date}
                      onChange={(e) => {
                        const newItems = formData.methodItems.map(i => i.id === item.id ? { ...i, date: e.target.value } : i)
                        setFormData({ ...formData, methodItems: newItems })
                      }}
                      disabled={safetyFormView === "view"}
                      className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                    />
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={(e) => {
                        const newItems = formData.methodItems.map(i => i.id === item.id ? { ...i, done: e.target.checked } : i)
                        setFormData({ ...formData, methodItems: newItems })
                      }}
                      disabled={safetyFormView === "view"}
                      className="w-5 h-5 cursor-pointer disabled:cursor-not-allowed"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hazards Section */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-primary mb-4 pb-2 border-b-2 border-primary">Hazards</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-primary/80 text-white">
                <th className="border border-gray-300 p-2 text-left">Name</th>
                <th className="border border-gray-300 p-2 w-40">Date</th>
                <th className="border border-gray-300 p-2 w-24">Done?</th>
              </tr>
            </thead>
            <tbody>
              {formData.hazardsItems.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="border border-gray-300 p-3">
                    <div className="whitespace-pre-line">{`${index + 1}. ${item.name}`}</div>
                  </td>
                  <td className="border border-gray-300 p-2">
                    <input
                      type="date"
                      value={item.date}
                      onChange={(e) => {
                        const newItems = formData.hazardsItems.map(i => i.id === item.id ? { ...i, date: e.target.value } : i)
                        setFormData({ ...formData, hazardsItems: newItems })
                      }}
                      disabled={safetyFormView === "view"}
                      className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                    />
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={(e) => {
                        const newItems = formData.hazardsItems.map(i => i.id === item.id ? { ...i, done: e.target.checked } : i)
                        setFormData({ ...formData, hazardsItems: newItems })
                      }}
                      disabled={safetyFormView === "view"}
                      className="w-5 h-5 cursor-pointer disabled:cursor-not-allowed"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Safety Measures Section */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-primary mb-4 pb-2 border-b-2 border-primary">Safety Measures</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-primary/80 text-white">
                <th className="border border-gray-300 p-2 text-left">Name</th>
                <th className="border border-gray-300 p-2 w-40">Date</th>
                <th className="border border-gray-300 p-2 w-24">Done?</th>
              </tr>
            </thead>
            <tbody>
              {formData.safetyMeasuresItems.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="border border-gray-300 p-3">
                    <div className="whitespace-pre-line">{`${index + 1}. ${item.name}`}</div>
                  </td>
                  <td className="border border-gray-300 p-2">
                    <input
                      type="date"
                      value={item.date}
                      onChange={(e) => {
                        const newItems = formData.safetyMeasuresItems.map(i => i.id === item.id ? { ...i, date: e.target.value } : i)
                        setFormData({ ...formData, safetyMeasuresItems: newItems })
                      }}
                      disabled={safetyFormView === "view"}
                      className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                    />
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={(e) => {
                        const newItems = formData.safetyMeasuresItems.map(i => i.id === item.id ? { ...i, done: e.target.checked } : i)
                        setFormData({ ...formData, safetyMeasuresItems: newItems })
                      }}
                      disabled={safetyFormView === "view"}
                      className="w-5 h-5 cursor-pointer disabled:cursor-not-allowed"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signature */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-primary mb-4 pb-2 border-b-2 border-primary">Signature</h3>
          <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-300">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Inductee Signature: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.signature}
              onChange={(e) => setFormData({ ...formData, signature: e.target.value, signatureDate: new Date().toISOString() })}
              disabled={safetyFormView === "view"}
              placeholder="Type your full name as signature"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-xl disabled:bg-gray-100"
              style={{ fontFamily: "'Brush Script MT', cursive" }}
            />
            {formData.signatureDate && (
              <p className="text-sm text-gray-600 mt-2">
                Signed on: {new Date(formData.signatureDate).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Buttons for Create Mode */}
        {safetyFormView === "create" && (
          <div className="flex justify-end gap-4 pt-6 border-t-2 border-gray-200">
            <button
              onClick={() => setSafetyFormView("list")}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!formData.fullName || !formData.signature) {
                  alert("Please fill in Employee Name and Signature before saving")
                  return
                }
                const newSubmission = {
                  id: `form-${Date.now()}`,
                  employeeName: formData.fullName,
                  position: formData.position,
                  completedDate: new Date().toISOString(),
                  formData: formData,
                  status: "completed"
                }
                const updated = [...safetyFormSubmissions, newSubmission]
                setSafetyFormSubmissions(updated)
                localStorage.setItem("safety_induction_forms", JSON.stringify(updated))
                setSafetyFormView("list")
                alert("Safety Induction Form saved successfully!")
              }}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold flex items-center gap-2"
            >
              <i className="fas fa-save"></i>
              Save Form
            </button>
          </div>
        )}

        {/* Back Button for View Mode */}
        {safetyFormView === "view" && (
          <div className="flex justify-start pt-6 border-t-2 border-gray-200">
            <button
              onClick={() => {
                setSafetyFormView("list")
                setSelectedFormSubmission(null)
              }}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to List
            </button>
          </div>
        )}
      </div>
    )}
  </>

)}
  
    

              {trainingView === "employees" && (
                <div className="space-y-6">
                  {isAdmin ? (
                  <div className="p-6 bg-card border border-border rounded-xl">
                    <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                      <i className="fas fa-user-plus text-primary"></i>
                      {editingEmployee ? "Edit Employee" : "Add New Employee"}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Name <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={editingEmployee ? editingEmployee.name : newEmployeeForm.name}
                          onChange={(e) =>
                            editingEmployee
                              ? setEditingEmployee({ ...editingEmployee, name: e.target.value })
                              : setNewEmployeeForm({ ...newEmployeeForm, name: e.target.value })
                          }
                          placeholder="John Doe"
                          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Department <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={editingEmployee ? editingEmployee.department : newEmployeeForm.department}
                          onChange={(e) =>
                            editingEmployee
                              ? setEditingEmployee({ ...editingEmployee, department: e.target.value })
                              : setNewEmployeeForm({ ...newEmployeeForm, department: e.target.value })
                          }
                          placeholder="Production"
                          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Position <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={editingEmployee ? editingEmployee.position : newEmployeeForm.position}
                          onChange={(e) =>
                            editingEmployee
                              ? setEditingEmployee({ ...editingEmployee, position: e.target.value })
                              : setNewEmployeeForm({ ...newEmployeeForm, position: e.target.value })
                          }
                          placeholder="Machine Operator"
                          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Hire Date <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="date"
                          value={editingEmployee ? editingEmployee.hireDate : newEmployeeForm.hireDate}
                          onChange={(e) =>
                            editingEmployee
                              ? setEditingEmployee({ ...editingEmployee, hireDate: e.target.value })
                              : setNewEmployeeForm({ ...newEmployeeForm, hireDate: e.target.value })
                          }
                          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Skills <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                          <div className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground min-h-[100px] max-h-[200px] overflow-y-auto">
                            <div className="flex flex-wrap gap-2">
                              {PREDEFINED_SKILLS.map((skill) => {
                                const isSelected = editingEmployee
                                  ? editingEmployee.skills?.includes(skill)
                                  : newEmployeeForm.skills.includes(skill)
                                
                                return (
                                  <button
                                    key={skill}
                                    type="button"
                                    onClick={() => {
                                      if (editingEmployee) {
                                        const currentSkills = editingEmployee.skills || []
                                        setEditingEmployee({
                                          ...editingEmployee,
                                          skills: isSelected
                                            ? currentSkills.filter((s) => s !== skill)
                                            : [...currentSkills, skill]
                                        })
                                      } else {
                                        setNewEmployeeForm({
                                          ...newEmployeeForm,
                                          skills: isSelected
                                            ? newEmployeeForm.skills.filter((s) => s !== skill)
                                            : [...newEmployeeForm.skills, skill]
                                        })
                                      }
                                    }}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                      isSelected
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                    }`}
                                  >
                                    {skill}
                                    {isSelected && <i className="fas fa-check ml-2"></i>}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Click skills to add/remove them for this employee
                        </p>
                      </div>
                      
                    </div>
                    <div className="flex gap-3 mt-4">
                      
           
                 
                      {editingEmployee && (
                        <button
                          onClick={() => setEditingEmployee(null)}
                          className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors font-semibold"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
                        className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                      >
                        <i className={`fas ${editingEmployee ? "fa-save" : "fa-plus"} mr-2`}></i>
                        {editingEmployee ? "Update Employee" : "Add Employee"}
                      </button>
                    </div>
                               </div>
                     ) : (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-700 dark:text-yellow-400">
        <i className="fas fa-lock mr-2"></i>
        Only administrators can add or edit employees
      </div>
      
    )}
              

                  <div>
                    <h4 className="text-lg font-bold text-foreground mb-4">All Employees ({employees.length})</h4>
                    {employees.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground bg-card border border-border rounded-lg">
                        <i className="fas fa-users text-4xl mb-3 block"></i>
                        <p>No employees yet. Add one above!</p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {employees.map((employee) => (
                          <div key={employee.id} className="p-4 bg-card border border-border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-semibold text-foreground text-lg mb-1">{employee.name}</h5>
                                <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                                  <div>
                                    <i className="fas fa-building mr-1"></i>
                                    {employee.department}
                                  </div>
                                  <div>
                                    <i className="fas fa-briefcase mr-1"></i>
                                    {employee.position}
                                  </div>
                                  <div>
                                    <i className="fas fa-calendar mr-1"></i>
                                    Hired: {new Date(employee.hireDate).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="mt-2 text-sm">
                                  <span className="text-primary font-semibold">
                                    {trainingRecords.filter((r) => r.employeeId === employee.id).length}
                                  </span>
                                  <span className="text-muted-foreground"> training records</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedEmployeeForTraining(employee.id)
                                    setNewTrainingRecordForm({
                                      trainingId: "",
                                      trainingType: "document",
                                      completedDate: new Date().toISOString().split("T")[0],
                                      expiryDate: "",
                                      score: "",
                                      notes: "",
                                    })
                                  }}
                                  className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                                  title="Add training"
                                >
                                  <i className="fas fa-plus mr-1"></i>
                                  Training
                                </button>
                                <button
                                  onClick={() => setEditingEmployee(employee)}
                                  className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm"
                                  title="Edit employee"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button
                                  onClick={() => handleDeleteEmployee(employee.id)}
                                  className="px-3 py-2 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors text-sm"
                                  title="Delete employee"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
{trainingView === "matrix" && (
  <div className="space-y-4">
    <div className="flex items-center justify-between mb-4">
      <h4 className="text-lg font-bold text-foreground">Skills Matrix</h4>
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-muted-foreground">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-muted rounded"></div>
          <span className="text-muted-foreground">Not Assigned</span>
        </div>
      </div>
    </div>

    {employees.length === 0 ? (
      <div className="text-center py-8 text-muted-foreground bg-card border border-border rounded-lg">
        <i className="fas fa-table text-4xl mb-3 block"></i>
        <p>Add employees to view the skills matrix</p>
      </div>
    ) : (() => {
        // Get all unique skills from all employees
        const allAssignedSkills = Array.from(
          new Set(employees.flatMap(emp => emp.skills || []))
        ).sort()

        if (allAssignedSkills.length === 0) {
          return (
            <div className="text-center py-8 text-muted-foreground bg-card border border-border rounded-lg">
              <i className="fas fa-table text-4xl mb-3 block"></i>
              <p>No skills assigned yet. Add skills to employees to see them here.</p>
            </div>
          )
        }

        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-3 text-left font-semibold text-foreground sticky left-0 bg-muted z-10 min-w-[200px]">
                    Employee
                  </th>
                  {allAssignedSkills.map((skill) => (
                    <th
                      key={skill}
                      className="border border-border p-3 text-left font-semibold text-foreground min-w-[180px]"
                    >
                      <div className="flex items-center gap-2">
                        <i className="fas fa-certificate text-primary"></i>
                        <span>{skill}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-muted/50">
                    <td className="border border-border p-3 font-semibold text-foreground sticky left-0 bg-popover">
                      <div>
                        <div>{employee.name}</div>
                        <div className="text-xs text-muted-foreground">{employee.position}</div>
                      </div>
                    </td>
                    {allAssignedSkills.map((skill) => {
                      const hasSkill = employee.skills?.includes(skill)
                      
                      return (
                        <td
                          key={skill}
                          className={`border border-border p-3 text-center ${
                            hasSkill ? "bg-green-500/20" : "bg-muted/30"
                          }`}
                        >
                          {hasSkill ? (
                            <div className="text-sm">
                              <i className="fas fa-check-circle text-green-600 text-2xl"></i>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">
                              <i className="fas fa-minus text-xl"></i>
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })()
    }
  </div>
)}

</div>
          </div>
        </div>
      )}

      {/* Add Training Record Modal */}
      {selectedEmployeeForTraining && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-popover border border-border rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-4">
                <i className="fas fa-certificate text-primary text-2xl"></i>
                <h3 className="text-2xl font-bold text-popover-foreground">Add Training Record</h3>
              </div>
              <button
                onClick={() => {
                  setSelectedEmployeeForTraining(null)
                  setNewTrainingRecordForm({
                    trainingId: "",
                    trainingType: "document",
                    completedDate: "",
                    expiryDate: "",
                    score: "",
                    notes: "",
                  })
                }}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Employee</label>
                <div className="px-4 py-2 bg-muted border border-border rounded-lg text-foreground">
                  {employees.find((e) => e.id === selectedEmployeeForTraining)?.name}
                </div>
              </div>

{/* 🔹 Existing Training Records */}
<div>
  <label className="block text-sm font-semibold text-foreground mb-2">
    Existing Training Records
  </label>

  {(() => {
    const recordsForEmployee =
      trainingRecords?.filter(
        (r) => r.employeeId === selectedEmployeeForTraining
      ) || []

    if (recordsForEmployee.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No training records yet for this employee.
        </p>
      )
    }

    return (
      <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3 bg-muted/40">
        {recordsForEmployee.map((record) => {
          const trainings =
            record.trainingType === "document"
              ? state.training.documents
              : state.training.forms

          const training = trainings.find((t) => t.id === record.trainingId)

          return (
            <div
              key={record.id}
              className="flex items-start justify-between gap-3 text-sm bg-background rounded-md px-3 py-2"
            >
              {/* Left: training info */}
              <div>
                <div className="font-semibold">
                  {training?.title || "Unknown training"}
                </div>

                <div className="text-muted-foreground text-xs">
                  Type: {record.trainingType === "document" ? "Document" : "Form"}
                </div>

                <div className="text-muted-foreground text-xs">
                  Completed:{" "}
                  {new Date(record.completedDate).toLocaleDateString()}
                  {record.expiryDate && (
                    <>
                      {" • "}
                      Expires:{" "}
                      {new Date(record.expiryDate).toLocaleDateString()}
                    </>
                  )}
                </div>
              </div>

              {/* Right: actions */}
              <div className="flex items-center gap-2">
                {record.trainingType === "document" && training?.url && (
                  <button
                    onClick={() => {
                      setSelectedNotice({
                        id: training.id,
                        title: training.title,
                        url: training.url,
                        pinned: false,
                      })
                      setOpenModal("notice-pdf")
                    }}
                    className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    View
                  </button>
                )}

                {canManageTrainingRecords && (
                  <button
                    onClick={() => handleDeleteTrainingRecord(record.id)}
                    className="px-2 py-1 text-xs bg-destructive/10 text-destructive rounded-md hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  })()}
</div>



{/* 🔹 Training Type block stays exactly where it is */}
<div>
  <label className="block text-sm font-semibold text-foreground mb-2">
    Training Type <span className="text-destructive">*</span>
  </label>
  <select
    value={newTrainingRecordForm.trainingType}
    onChange={(e) =>
      setNewTrainingRecordForm({
        ...newTrainingRecordForm,
        trainingType: e.target.value as "document" | "form",
        trainingId: "",
      })
    }
    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
  >
    <option value="document">Training Document</option>
    <option value="form">Training Form</option>
  </select>
</div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Training Type <span className="text-destructive">*</span>
                </label>
                <select
                  value={newTrainingRecordForm.trainingType}
                  onChange={(e) =>
                    setNewTrainingRecordForm({
                      ...newTrainingRecordForm,
                      trainingType: e.target.value as "document" | "form",
                      trainingId: "",
                    })
                  }
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="document">Training Document</option>
                  <option value="form">Training Form</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Training <span className="text-destructive">*</span>
                </label>
                <select
                  value={newTrainingRecordForm.trainingId}
                  onChange={(e) => setNewTrainingRecordForm({ ...newTrainingRecordForm, trainingId: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select training...</option>
                  {(newTrainingRecordForm.trainingType === "document"
                    ? state.training.documents
                    : state.training.forms
                  ).map((training) => (
                    <option key={training.id} value={training.id}>
                      {training.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Completed Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    value={newTrainingRecordForm.completedDate}
                    onChange={(e) =>
                      setNewTrainingRecordForm({ ...newTrainingRecordForm, completedDate: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={newTrainingRecordForm.expiryDate}
                    onChange={(e) => setNewTrainingRecordForm({ ...newTrainingRecordForm, expiryDate: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>



              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setSelectedEmployeeForTraining(null)
                    setNewTrainingRecordForm({
                      trainingId: "",
                      trainingType: "document",
                      completedDate: "",
                      expiryDate: "",
                    })
                  }}
                  className="flex-1 px-4 py-3 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTrainingRecord}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add Training Record
                </button>
              </div>
            </div>
          </div>
        
        </div>

      )}
     {/* Time Clock Modal */}
{openModal === "timeclock" && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-popover border border-border rounded-2xl shadow-2xl w-11/12 h-5/6 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border bg-popover">
        <div className="flex items-center gap-4">
          <i className="fas fa-clock text-primary text-2xl"></i>
          <h3 className="text-xl font-bold text-popover-foreground">Time Clock</h3>
        </div>

        <button
          onClick={() => setOpenModal(null)}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <i className="fas fa-times text-2xl"></i>
        </button>
      </div>

      {/* Iframe container */}
      <div className="flex-grow w-full h-full bg-background">
        <iframe
          src="https://integrasystems.fulcrumpro.com/timeclock/#/"
          className="w-full h-full border-0"
          sandbox="
            allow-same-origin
            allow-scripts
            allow-forms
            allow-popups
            allow-popups-to-escape-sandbox
            allow-modals
          "
          allow="fullscreen"
        ></iframe>
      </div>
    </div>
  </div>
)}

{/* Fulcrum Modal */}
{openModal === "fulcrum" && selectedApp && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-popover border border-border rounded-2xl shadow-2xl w-11/12 h-5/6 flex flex-col">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div className="flex items-center gap-4">
          <i className={`fas ${selectedApp.icon} text-primary text-2xl`}></i>
          <h3 className="text-xl font-bold text-popover-foreground">{selectedApp.name}</h3>
        </div>
        <button
          onClick={() => setOpenModal(null)}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <i className="fas fa-times text-2xl"></i>
        </button>
      </div>
      <div className="p-2 flex-grow">
        <iframe
          src={selectedApp.url}
          className="w-full h-full border-0 rounded-b-xl"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
          allow="fullscreen"
        ></iframe>
      </div>
    </div>
  </div>
)}
    </div>
  )
  }
  



