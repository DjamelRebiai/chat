"use client"

import { useEffect, useRef, useState } from "react"
import type { Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react"

interface VideoCallModalProps {
  callData: any
  socket: Socket | null
  onClose: () => void
  isCaller?: boolean
}

export default function VideoCallModal({ callData, socket, onClose, isCaller }: VideoCallModalProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const [accepted, setAccepted] = useState<boolean>(!!isCaller)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  useEffect(() => {
    let mounted = true

    let onOffer: any = null
    let onAnswer: any = null
    let onIce: any = null

    const initializeCall = async () => {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: isVideoEnabled,
          audio: true,
        })

        if (!mounted) return

        localStreamRef.current = localStream

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream
        }

        const configuration = {
          iceServers: [
            { urls: ["stun:stun.l.google.com:19302"] },
            { urls: ["stun:stun1.l.google.com:19302"] },
            { urls: ["stun:stun2.l.google.com:19302"] },
            { urls: ["stun:stun3.l.google.com:19302"] },
          ],
        }

        const pc = new RTCPeerConnection(configuration)
        peerConnectionRef.current = pc

        // add local tracks
        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream))

        pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0]
          }
        }

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            try {
              socket?.emit("webrtc_ice_candidate", {
                candidate: event.candidate,
                conversationId: callData.conversationId,
                senderId: (typeof window !== 'undefined' && localStorage.getItem('user')) ? JSON.parse(localStorage.getItem('user')||'{}').id : null,
              })
            } catch (e) {
              console.warn('[pc.onicecandidate] emit error', e)
            }
          }
        }

  // Signaling handlers
  onOffer = async (data: any) => {
          try {
            if (!data || data.conversationId !== callData.conversationId) return
            const senderId = data.senderId
            const myId = (typeof window !== 'undefined' && localStorage.getItem('user')) ? JSON.parse(localStorage.getItem('user')||'{}').id : null
            if (senderId && myId && senderId === myId) return // ignore our own

            // set remote description and create answer
            await pc.setRemoteDescription({ type: data.type || 'offer', sdp: data.sdp })
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            socket?.emit('webrtc_answer', {
              conversationId: callData.conversationId,
              sdp: answer.sdp,
              type: answer.type,
              senderId: myId,
            })
          } catch (e) {
            console.warn('[onOffer]', e)
          }
        }

  onAnswer = async (data: any) => {
          try {
            if (!data || data.conversationId !== callData.conversationId) return
            const senderId = data.senderId
            const myId = (typeof window !== 'undefined' && localStorage.getItem('user')) ? JSON.parse(localStorage.getItem('user')||'{}').id : null
            if (senderId && myId && senderId === myId) return // ignore our own
            if (!pc.remoteDescription || pc.remoteDescription.type !== 'answer') {
              await pc.setRemoteDescription({ type: data.type || 'answer', sdp: data.sdp })
            }
          } catch (e) {
            console.warn('[onAnswer]', e)
          }
        }

  onIce = async (data: any) => {
          try {
            if (!data || data.conversationId !== callData.conversationId) return
            const senderId = data.senderId
            const myId = (typeof window !== 'undefined' && localStorage.getItem('user')) ? JSON.parse(localStorage.getItem('user')||'{}').id : null
            if (senderId && myId && senderId === myId) return // ignore our own
            if (data.candidate) {
              await pc.addIceCandidate(data.candidate)
            }
          } catch (e) {
            console.warn('[onIce]', e)
          }
        }

  socket?.on('webrtc_offer', onOffer)
  socket?.on('webrtc_answer', onAnswer)
  socket?.on('webrtc_ice_candidate', onIce)

        // If this client is the caller, create and send the offer
        if (isCaller) {
          try {
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            const myId = (typeof window !== 'undefined' && localStorage.getItem('user')) ? JSON.parse(localStorage.getItem('user')||'{}').id : null
            socket?.emit('webrtc_offer', {
              conversationId: callData.conversationId,
              sdp: offer.sdp,
              type: offer.type,
              senderId: myId,
              callerName: callData.callerName,
            })
          } catch (e) {
            console.warn('[createOffer]', e)
          }
        }

        // cleanup on unmount
        // we remove listeners in the outer cleanup
      } catch (error) {
    // Only initialize the call if the user accepted or is the caller
    if (accepted) initializeCall()
        alert("Unable to access camera/microphone. Please check your permissions.")
      }
    }

    initializeCall()

    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)

    return () => {
      // cleanup
      mounted = false
      const pc = peerConnectionRef.current
      if (pc) pc.close()
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop())
      try {
        if (onOffer) socket?.off('webrtc_offer', onOffer)
        if (onAnswer) socket?.off('webrtc_answer', onAnswer)
        if (onIce) socket?.off('webrtc_ice_candidate', onIce)
      } catch (e) {
        /* ignore */
      }
      clearInterval(timer)
    }
  }, [callData, socket, isVideoEnabled])

  const handleEndCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
    }
    socket?.emit("end_call", { conversationId: callData.conversationId })
    onClose()
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks()
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsVideoEnabled(!isVideoEnabled)
    }
  }

  const formatTime = (seconds: number) => {
  const handleAccept = () => {
    setAccepted(true)
  }

  const handleDecline = () => {
    // inform the room the call was rejected
    socket?.emit('call_rejected', { conversationId: callData.conversationId, senderId: (typeof window !== 'undefined' && localStorage.getItem('user')) ? JSON.parse(localStorage.getItem('user')||'{}').id : null })
    onClose()
  }
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden shadow-2xl">
        <div className="aspect-video flex bg-slate-900">
          <div className="flex-1 relative bg-slate-950">
            <video ref={remoteVideoRef} autoPlay className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded text-white text-sm">
              {callData?.callerName || "Caller"}
            </div>
          </div>
        </div>

        <video
          ref={localVideoRef}
          autoPlay
          muted
          className="absolute bottom-20 right-4 w-32 h-32 bg-slate-900 rounded-lg border-2 border-slate-700 object-cover"
        />

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col items-center gap-4">
          <div className="text-white text-lg font-semibold">{formatTime(callDuration)}</div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={toggleMute}
              className={`rounded-full w-12 h-12 p-0 ${
                isMuted ? "bg-red-600 hover:bg-red-700" : "bg-slate-700 hover:bg-slate-600"
              }`}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </Button>

            <Button
              onClick={toggleVideo}
              className={`rounded-full w-12 h-12 p-0 ${
                !isVideoEnabled ? "bg-red-600 hover:bg-red-700" : "bg-slate-700 hover:bg-slate-600"
              }`}
            >
              {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            </Button>

            <Button onClick={handleEndCall} className="bg-red-600 hover:bg-red-700 rounded-full w-12 h-12 p-0">
              <PhoneOff size={24} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
