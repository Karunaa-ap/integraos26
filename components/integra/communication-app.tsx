"use client"

import { useState, useEffect, useRef } from "react"
import { apiClient } from "@/lib/api-client"

interface CommunicationAppProps {
  currentUser: string
  deviceId: string
  onClose: () => void
}

export function CommunicationApp({ currentUser, deviceId, onClose }: CommunicationAppProps) {
  const [devices, setDevices] = useState<any[]>([])
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<"messages" | "video">("messages")
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isInCall, setIsInCall] = useState(false)
  const [incomingCall, setIncomingCall] = useState<any | null>(null)
  const [callStatus, setCallStatus] = useState("")
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [connectionState, setConnectionState] = useState<string>("new")
  const [isHttps, setIsHttps] = useState(false)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const iceCandidateQueueRef = useRef<any[]>([])


  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsHttps(window.location.protocol === "https:")
      console.log("[v0] [Comms] Protocol:", window.location.protocol, "HTTPS:", window.location.protocol === "https:")
    }
  }, [])

  useEffect(() => {
    console.log("[v0] [Comms] Component mounted, current deviceId:", deviceId)
    fetchDevices()
    const interval = setInterval(fetchDevices, 5000)
    return () => clearInterval(interval)
  }, [deviceId])

  useEffect(() => {
    if (!selectedDevice) return

    console.log("[v0] [Comms] Selected device changed:", selectedDevice)
    fetchMessages()
    const interval = setInterval(fetchMessages, 2000)
    return () => clearInterval(interval)
  }, [selectedDevice])

  useEffect(() => {
    const pollNotifications = async () => {
      try {
        const notifications = await apiClient.getNotifications(deviceId, true)

        for (const notif of notifications) {
          if (notif.type === "call" && !notif.read) {
            console.log("[v0] [Comms] Incoming call notification:", notif)
            setIncomingCall({
              from: notif.from_device,
              fromName: notif.data?.fromName || "Unknown",
              offer: notif.data?.offer,
            })
            await apiClient.markNotificationAsRead(notif.id)
          }
        }
      } catch (error) {
        console.error("[v0] [Comms] Error polling notifications:", error)
      }
    }

    pollNotifications()
    const interval = setInterval(pollNotifications, 2000)
    return () => clearInterval(interval)
  }, [deviceId])

  useEffect(() => {
    const pollSignaling = async () => {
      try {
        const messages = await apiClient.getSignalingMessages(deviceId)

        for (const msg of messages) {
          console.log("[v0] [Comms] Processing signaling message:", msg.type, "from:", msg.from)

          if (msg.type === "answer" && peerConnectionRef.current) {
            if (peerConnectionRef.current.signalingState === "have-local-offer") {
              console.log("[v0] [Comms] Setting remote description (answer)")
              await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(msg.data.answer))
              setConnectionState("connected")

              while (iceCandidateQueueRef.current.length > 0) {
                const candidate = iceCandidateQueueRef.current.shift()
                if (candidate && peerConnectionRef.current) {
                  console.log("[v0] [Comms] Adding queued ICE candidate")
                  await peerConnectionRef.current.addIceCandidate(candidate)
                }
              }
            }
          } else if (msg.type === "ice-candidate" && peerConnectionRef.current) {
            const candidate = new RTCIceCandidate(msg.data.candidate)

            if (peerConnectionRef.current.remoteDescription) {
              console.log("[v0] [Comms] Adding ICE candidate immediately")
              await peerConnectionRef.current.addIceCandidate(candidate)
            } else {
              console.log("[v0] [Comms] Queueing ICE candidate for later")
              iceCandidateQueueRef.current.push(candidate)
            }
          }
        }
      } catch (error) {
        console.error("[v0] [Comms] Error polling signaling:", error)
      }
    }

    const interval = setInterval(pollSignaling, 1000)
    return () => clearInterval(interval)
  }, [deviceId])

  const fetchDevices = async () => {
    console.log("[v0] [Comms] Fetching devices...")
    const allDevices = await apiClient.getDevices()
    console.log("[v0] [Comms] All devices from server:", allDevices)
    console.log("[v0] [Comms] Current deviceId:", deviceId)

    const otherDevices = allDevices.filter((d: any) => {
      const deviceIdentifier = d.id || d.deviceId
      const isCurrentDevice = deviceIdentifier === deviceId
      console.log("[v0] [Comms] Device check:", {
        deviceName: d.name,
        deviceIdentifier,
        currentDeviceId: deviceId,
        isMatch: isCurrentDevice,
        willInclude: !isCurrentDevice,
      })
      return !isCurrentDevice
    })

    console.log("[v0] [Comms] Filtered devices (excluding self):", otherDevices)
    setDevices(otherDevices)
  }

  const fetchMessages = async () => {
    if (!selectedDevice) return

    const deviceIdentifier = selectedDevice.id || selectedDevice.deviceId
    console.log("[v0] [Comms] Fetching messages for device:", deviceIdentifier)
    const allMessages = await apiClient.getMessages()

    const relevantMessages = allMessages.filter(
      (m: any) =>
        (m.from === deviceId && m.to === deviceIdentifier) || (m.from === deviceIdentifier && m.to === deviceId),
    )

    console.log("[v0] [Comms] Relevant messages:", relevantMessages)
    setMessages(relevantMessages)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedDevice) return

    const deviceIdentifier = selectedDevice.id || selectedDevice.deviceId
    const message = {
      id: `msg_${Date.now()}`,
      from: deviceId,
      to: deviceIdentifier,
      text: newMessage.trim(),
      timestamp: Date.now(),
    }

    console.log("[v0] [Comms] Sending message:", message)

    // Optimistic update
    setMessages((prev) => [...prev, message])
    setNewMessage("")

    // Send to server
    const success = await apiClient.sendMessage(message)
    console.log("[v0] [Comms] Message send result:", success)

    // Send notification
    await apiClient.sendNotification(deviceIdentifier, deviceId, "message", "New Message", newMessage.trim())
  }

  const handleStartCall = async () => {
    if (!selectedDevice) return

    if (!isHttps) {
      const httpsUrl = window.location.href.replace("http://", "https://").replace(":3001", ":3443")
      setPermissionError(
        `Camera/microphone requires HTTPS. Please open: ${httpsUrl} (Note: You may need to accept the security warning for the self-signed certificate)`,
      )
      return
    }

    try {
      setPermissionError(null)
      setCallStatus("Requesting camera and microphone access...")

      // Check browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionError("Camera/microphone not supported in this browser")
        return
      }

      console.log("[v0] [Comms] Requesting media permissions...")
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      localStreamRef.current = stream
      console.log("[v0] [Comms] Got local stream with tracks:", stream.getTracks().map(t => ({ 
        kind: t.kind, 
        enabled: t.enabled, 
        readyState: t.readyState,
        id: t.id 
      })))
      
      stream.getTracks().forEach(track => {
        track.enabled = true
        console.log("[v0] [Comms] Enabled track:", track.kind, track.id)
      })

      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (localVideoRef.current) {
        console.log("[v0] [Comms] Setting local video srcObject")
        localVideoRef.current.srcObject = stream
        localVideoRef.current.muted = true
        localVideoRef.current.playsInline = true
        localVideoRef.current.autoplay = true
        localVideoRef.current.volume = 0
        
        try {
          await localVideoRef.current.play()
          console.log("[v0] [Comms] Local video playing - videoWidth:", localVideoRef.current.videoWidth, "videoHeight:", localVideoRef.current.videoHeight)
        } catch (e) {
          console.error("[v0] [Comms] Error playing local video:", e)
        }
      } else {
        console.error("[v0] [Comms] localVideoRef.current is null!")
      }

      setCallStatus("Setting up connection...")

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
        ],
        iceCandidatePoolSize: 10,
      })

      peerConnectionRef.current = pc
      iceCandidateQueueRef.current = []
      remoteStreamRef.current = new MediaStream()
      console.log("[v0] [Comms] Initialized empty remote stream")

      pc.onconnectionstatechange = () => {
        console.log("[v0] [Comms] Connection state:", pc.connectionState)
        setConnectionState(pc.connectionState)
        if (pc.connectionState === "connected") {
          setCallStatus("Connected")
        } else if (pc.connectionState === "failed") {
          setCallStatus("Connection failed")
          setPermissionError("Connection failed. Please try again.")
        }
      }

      pc.oniceconnectionstatechange = () => {
        console.log("[v0] [Comms] ICE connection state:", pc.iceConnectionState)
        if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
          console.log("[v0] [Comms] ICE connection failed/disconnected")
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const deviceIdentifier = selectedDevice.id || selectedDevice.deviceId
          console.log("[v0] [Comms] Sending ICE candidate to:", deviceIdentifier)
          apiClient.sendSignalingMessage({
            id: `ice_${Date.now()}_${Math.random()}`,
            from: deviceId,
            to: deviceIdentifier,
            type: "ice-candidate",
            data: { candidate: event.candidate.toJSON() },
            timestamp: Date.now(),
          })
        } else {
          console.log("[v0] [Comms] ICE gathering complete")
        }
      }

      pc.ontrack = (event) => {
        console.log("[v0] [Comms] *** RECEIVED REMOTE TRACK ***", {
          kind: event.track.kind,
          id: event.track.id,
          enabled: event.track.enabled,
          readyState: event.track.readyState,
          hasStreams: event.streams.length > 0,
          streamIds: event.streams.map(s => s.id)
        })
        
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream()
          console.log("[v0] [Comms] Created new remote stream in ontrack")
        }
        
        const existingTrack = remoteStreamRef.current.getTracks().find(t => t.id === event.track.id)
        if (!existingTrack) {
          remoteStreamRef.current.addTrack(event.track)
          console.log("[v0] [Comms] Added", event.track.kind, "track to remote stream. Total tracks:", remoteStreamRef.current.getTracks().length)
          console.log("[v0] [Comms] Remote stream now has:", remoteStreamRef.current.getTracks().map(t => ({ kind: t.kind, id: t.id, enabled: t.enabled })))
        } else {
          console.log("[v0] [Comms] Track already exists in remote stream, skipping")
        }
        
        if (remoteVideoRef.current && remoteStreamRef.current && remoteStreamRef.current.getTracks().length > 0) {
          console.log("[v0] [Comms] Assigning remote stream to video element")
          console.log("[v0] [Comms] Remote stream tracks:", remoteStreamRef.current.getTracks().map(t => ({ 
            kind: t.kind, 
            enabled: t.enabled, 
            readyState: t.readyState 
          })))
          
          remoteVideoRef.current.srcObject = null
          remoteVideoRef.current.srcObject = remoteStreamRef.current
          remoteVideoRef.current.playsInline = true
          remoteVideoRef.current.autoplay = true
          remoteVideoRef.current.muted = false
          
          remoteVideoRef.current.play()
            .then(() => {
              console.log("[v0] [Comms] ✅ Remote video playing successfully")
              console.log("[v0] [Comms] Video element state:", {
                hasStream: !!remoteVideoRef.current?.srcObject,
                trackCount: (remoteVideoRef.current?.srcObject as MediaStream)?.getTracks().length || 0,
                videoWidth: remoteVideoRef.current?.videoWidth,
                videoHeight: remoteVideoRef.current?.videoHeight,
                paused: remoteVideoRef.current?.paused,
                muted: remoteVideoRef.current?.muted
              })
            })
            .catch((e) => console.error("[v0] [Comms] ❌ Error playing remote video:", e))
        } else {
          console.warn("[v0] [Comms] Cannot assign remote stream - remoteVideoRef:", !!remoteVideoRef.current, "remoteStreamRef:", !!remoteStreamRef.current, "trackCount:", remoteStreamRef.current?.getTracks().length || 0)
        }
      }

      stream.getTracks().forEach((track) => {
        console.log("[v0] [Comms] Adding local track to peer connection:", track.kind, track.id)
        pc.addTrack(track, stream)
      })

      // Create and send offer
      setCallStatus("Calling...")
      console.log("[v0] [Comms] Creating offer...")
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })
      await pc.setLocalDescription(offer)
      console.log("[v0] [Comms] Local description set")

      // Send call notification with offer
      const deviceIdentifier = selectedDevice.id || selectedDevice.deviceId
      await apiClient.sendNotification(
        deviceIdentifier,
        deviceId,
        "call",
        `Incoming call from ${currentUser}`,
        undefined,
        { offer, fromName: currentUser },
      )

      setIsInCall(true)
      setActiveTab("video")
      console.log("[v0] [Comms] Call initiated successfully")
    } catch (error: any) {
      console.error("[v0] [Comms] Error starting call:", error)
      if (error.name === "NotAllowedError") {
        setPermissionError("Camera/microphone permission denied. Please allow access and try again.")
      } else if (error.name === "NotFoundError") {
        setPermissionError("No camera/microphone found on this device.")
      } else if (error.name === "NotSupportedError") {
        setPermissionError("Camera/microphone not supported. Please use HTTPS.")
      } else {
        setPermissionError("Failed to start call: " + error.message)
      }
      handleEndCall()
    }
  }

  const handleEndCall = () => {
    console.log("[v0] [Comms] Ending call...")

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop()
        console.log("[v0] [Comms] Stopped track:", track.kind)
      })
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }

    localStreamRef.current = null
    peerConnectionRef.current = null
    remoteStreamRef.current = null
    iceCandidateQueueRef.current = []
    setIsInCall(false)
    setCallStatus("")
    setConnectionState("new")
  }

  const handleAcceptCall = async () => {
    if (!incomingCall) return

    if (!isHttps) {
      const httpsUrl = window.location.href.replace("http://", "https://").replace(":3001", ":3443")
      setPermissionError(
        `Camera/microphone requires HTTPS. Please open: ${httpsUrl} (Note: You may need to accept the security warning for the self-signed certificate)`,
      )
      setIncomingCall(null)
      return
    }

    try {
      setPermissionError(null)
      console.log("[v0] [Comms] Accepting call from:", incomingCall.from)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      localStreamRef.current = stream

      stream.getTracks().forEach(track => {
        track.enabled = true
        console.log("[v0] [Comms] Local track enabled:", track.kind, "id:", track.id, "ready:", track.readyState)
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      if (localVideoRef.current) {
        console.log("[v0] [Comms] Setting local video srcObject in accept call")
        localVideoRef.current.srcObject = stream
        localVideoRef.current.muted = true
        localVideoRef.current.playsInline = true
        localVideoRef.current.autoplay = true
        localVideoRef.current.volume = 0
        try {
          await localVideoRef.current.play()
          console.log("[v0] [Comms] Local video playing successfully - videoWidth:", localVideoRef.current.videoWidth)
        } catch (e) {
          console.error("[v0] [Comms] Error playing local video:", e)
        }
      } else {
        console.error("[v0] [Comms] localVideoRef.current is null in accept call!")
      }

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
        ],
        iceCandidatePoolSize: 10,
      })

      peerConnectionRef.current = pc
      iceCandidateQueueRef.current = []
      remoteStreamRef.current = new MediaStream()
      console.log("[v0] [Comms] Initialized empty remote stream in accept call")

      pc.onconnectionstatechange = () => {
        console.log("[v0] [Comms] Connection state:", pc.connectionState)
        setConnectionState(pc.connectionState)
      }

      pc.oniceconnectionstatechange = () => {
        console.log("[v0] [Comms] ICE connection state:", pc.iceConnectionState)
        if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
          console.log("[v0] [Comms] ICE connection failed/disconnected")
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("[v0] [Comms] Sending ICE candidate to:", incomingCall.from)
          apiClient.sendSignalingMessage({
            id: `ice_${Date.now()}_${Math.random()}`,
            from: deviceId,
            to: incomingCall.from,
            type: "ice-candidate",
            data: { candidate: event.candidate.toJSON() },
            timestamp: Date.now(),
          })
        }
      }

      pc.ontrack = (event) => {
        console.log("[v0] [Comms] *** RECEIVED REMOTE TRACK (ACCEPT) ***", {
          kind: event.track.kind,
          id: event.track.id,
          enabled: event.track.enabled,
          readyState: event.track.readyState,
          hasStreams: event.streams.length > 0
        })
        
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream()
          console.log("[v0] [Comms] Created new remote stream in ontrack (accept)")
        }
        
        const existingTrack = remoteStreamRef.current.getTracks().find(t => t.id === event.track.id)
        if (!existingTrack) {
          remoteStreamRef.current.addTrack(event.track)
          console.log("[v0] [Comms] Added", event.track.kind, "track to remote stream. Total tracks:", remoteStreamRef.current.getTracks().length)
        }
        
        if (remoteVideoRef.current && remoteStreamRef.current && remoteStreamRef.current.getTracks().length > 0) {
          console.log("[v0] [Comms] Assigning remote stream to video element (accept)")
          
          remoteVideoRef.current.srcObject = null
          remoteVideoRef.current.srcObject = remoteStreamRef.current
          remoteVideoRef.current.playsInline = true
          remoteVideoRef.current.autoplay = true
          remoteVideoRef.current.muted = false
          
          remoteVideoRef.current.play()
            .then(() => {
              console.log("[v0] [Comms] ✅ Remote video playing successfully (accept)")
              console.log("[v0] [Comms] Video state:", {
                hasStream: !!remoteVideoRef.current?.srcObject,
                trackCount: (remoteVideoRef.current?.srcObject as MediaStream)?.getTracks().length || 0,
                videoWidth: remoteVideoRef.current?.videoWidth,
                videoHeight: remoteVideoRef.current?.videoHeight
              })
            })
            .catch((e) => console.error("[v0] [Comms] ❌ Error playing remote video (accept):", e))
        }
      }

      stream.getTracks().forEach((track) => {
        console.log("[v0] [Comms] Adding local track to peer connection:", track.kind, track.id)
        pc.addTrack(track, stream)
      })

      // Set remote description from offer
      console.log("[v0] [Comms] Setting remote description from offer")
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer))

      // Create answer
      console.log("[v0] [Comms] Creating answer")
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      // Send answer
      console.log("[v0] [Comms] Sending answer to:", incomingCall.from)
      await apiClient.sendSignalingMessage({
        id: `answer_${Date.now()}`,
        from: deviceId,
        to: incomingCall.from,
        type: "answer",
        data: { answer },
        timestamp: Date.now(),
      })

      setIsInCall(true)
      setActiveTab("video")
      setIncomingCall(null)
      setSelectedDevice(devices.find((d) => (d.id || d.deviceId) === incomingCall.from))
      console.log("[v0] [Comms] Call accepted successfully")
    } catch (error: any) {
      console.error("[v0] [Comms] Error accepting call:", error)
      if (error.name === "NotAllowedError") {
        setPermissionError("Camera/microphone permission denied")
      } else if (error.name === "NotSupportedError") {
        setPermissionError("Camera/microphone not supported. Please use HTTPS.")
      } else {
        setPermissionError("Failed to accept call: " + error.message)
      }
      handleEndCall()
    }
  }

  const handleDeclineCall = () => {
    setIncomingCall(null)
  }

  const copyHttpsUrl = () => {
    if (typeof window !== "undefined") {
      const httpsUrl = window.location.href.replace("http://", "https://").replace(":3001", ":3443")
      navigator.clipboard.writeText(httpsUrl)
    }
  }

  return (
    <div className="flex h-full">
      {/* Device List Sidebar */}
      <div className="w-80 border-r border-border bg-card p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Devices</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <i className="fas fa-times text-muted-foreground"></i>
          </button>
        </div>

        {!isHttps && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <i className="fas fa-exclamation-triangle text-yellow-500 mt-0.5"></i>
              <div className="flex-1 text-xs">
                <p className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">HTTPS Required for Video</p>
                <p className="text-yellow-600 dark:text-yellow-500 mb-2">
                  Camera/microphone access requires HTTPS. Open the HTTPS URL (port 3443) to use video calls.
                </p>
                <button
                  onClick={copyHttpsUrl}
                  className="px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600 transition-colors"
                >
                  <i className="fas fa-copy mr-1"></i>
                  Copy HTTPS URL
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">This Device</div>
          <div className="font-semibold text-foreground">{currentUser}</div>
          <div className="text-xs text-muted-foreground mt-1 font-mono truncate">{deviceId}</div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {devices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <i className="fas fa-inbox text-4xl mb-2 block"></i>
              <p className="text-sm">No other devices online</p>
              <p className="text-xs mt-2">Open this URL on another device to start communicating</p>
            </div>
          ) : (
            devices.map((device) => {
              const deviceIdentifier = device.id || device.deviceId
              return (
                <button
                  key={deviceIdentifier}
                  onClick={() => setSelectedDevice(device)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    (selectedDevice?.id || selectedDevice?.deviceId) === deviceIdentifier
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <i className="fas fa-desktop"></i>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{device.name}</div>
                      <div className="text-xs opacity-70">
                        <i className="fas fa-circle text-green-500 mr-1"></i>
                        Online
                      </div>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedDevice ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selectedDevice.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    <i className="fas fa-circle text-green-500 mr-1"></i>
                    Online
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab("messages")}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeTab === "messages"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    <i className="fas fa-comments mr-2"></i>
                    Messages
                  </button>
                  <button
                    onClick={() => setActiveTab("video")}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeTab === "video"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    <i className="fas fa-video mr-2"></i>
                    Video Call
                  </button>
                </div>
              </div>
            </div>

            {/* Content Area */}
            {activeTab === "messages" ? (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <i className="fas fa-comments text-4xl mb-2 block"></i>
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs mt-1">Send a message to start the conversation</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.from === deviceId ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.from === deviceId ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                          }`}
                        >
                          <p>{msg.text}</p>
                          <p className="text-xs opacity-70 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <i className="fas fa-paper-plane"></i>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-4 bg-background">
                {permissionError ? (
                  <div className="text-center max-w-md">
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive mb-4">
                      <i className="fas fa-exclamation-triangle text-2xl mb-2 block"></i>
                      <p className="font-semibold">Permission Required</p>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{permissionError}</p>
                    </div>
                    {!isHttps ? (
                      <button
                        onClick={copyHttpsUrl}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <i className="fas fa-copy mr-2"></i>
                        Copy HTTPS URL
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setPermissionError(null)
                          handleStartCall()
                        }}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <i className="fas fa-redo mr-2"></i>
                        Try Again
                      </button>
                    )}
                  </div>
                ) : isInCall ? (
                  <div className="w-full h-full flex flex-col gap-4 max-h-full overflow-hidden">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                      <div className="relative bg-black rounded-lg overflow-hidden h-full min-h-[300px]">
                        <video 
                          ref={remoteVideoRef} 
                          autoPlay 
                          playsInline 
                          muted={false}
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-2 rounded-lg text-white">
                          <i className="fas fa-user mr-2"></i>
                          {selectedDevice.name}
                        </div>
                        <div className="absolute top-4 right-4 bg-black/70 px-3 py-2 rounded-lg text-white text-sm">
                          {connectionState === "connected" ? (
                            <>
                              <i className="fas fa-circle text-green-500 mr-2"></i>Connected
                            </>
                          ) : connectionState === "connecting" ? (
                            <>
                              <i className="fas fa-circle text-yellow-500 mr-2"></i>Connecting...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-circle text-gray-500 mr-2"></i>Waiting...
                            </>
                          )}
                        </div>
                      </div>
                      <div className="relative bg-black rounded-lg overflow-hidden h-full min-h-[300px]">
                        <video 
                          ref={localVideoRef} 
                          autoPlay 
                          playsInline 
                          muted 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-2 rounded-lg text-white">
                          <i className="fas fa-user mr-2"></i>
                          You ({currentUser})
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center items-center gap-4 py-4 bg-background">
                      <button
                        onClick={handleEndCall}
                        className="px-8 py-4 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-lg font-semibold shadow-lg"
                      >
                        <i className="fas fa-phone-slash mr-2"></i>
                        End Call
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <i className="fas fa-video text-6xl text-primary mb-4 block"></i>
                    <h3 className="text-xl font-bold text-foreground mb-2">Call {selectedDevice.name}</h3>
                    <p className="text-muted-foreground mb-6">Start a video call with this device</p>
                    {callStatus && (
                      <p className="text-sm text-muted-foreground mb-4">
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        {callStatus}
                      </p>
                    )}
                    <button
                      onClick={handleStartCall}
                      className="px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-lg font-semibold"
                    >
                      <i className="fas fa-video mr-2"></i>
                      Start Video Call
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <i className="fas fa-comments text-6xl mb-4 block"></i>
              <p className="text-lg">Select a device to start communicating</p>
              <p className="text-sm mt-2">You can send messages and make video calls</p>
            </div>
          </div>
        )}
      </div>

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-popover border border-border rounded-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <i className="fas fa-video text-primary text-6xl mb-4 block animate-pulse"></i>
              <h3 className="text-2xl font-bold text-foreground mb-2">Incoming Call</h3>
              <p className="text-muted-foreground mb-6">{incomingCall.fromName} is calling you</p>
              <div className="flex gap-4">
                <button
                  onClick={handleDeclineCall}
                  className="flex-1 px-6 py-3 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                >
                  <i className="fas fa-phone-slash mr-2"></i>
                  Decline
                </button>
                <button
                  onClick={handleAcceptCall}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <i className="fas fa-phone mr-2"></i>
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
