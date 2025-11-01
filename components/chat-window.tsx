"use client"

import type { Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Paperclip, Mic, X } from "lucide-react"
import { toast } from "sonner"
import type React from "react"
import { useEffect, useState, useRef } from "react"
import MessageList from "./message-list"

interface ChatWindowProps {
  conversationId: string
  socket: Socket | null
}

export default function ChatWindow({ conversationId, socket }: ChatWindowProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || ""
  const [messages, setMessages] = useState<any[]>([])
  const [messageText, setMessageText] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasOlder, setHasOlder] = useState(true)
  const [isPrepending, setIsPrepending] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<any>(null)
  const audioChunksRef = useRef<any[]>([])
  const messageListRef = useRef<HTMLDivElement | null>(null)
  const [otherTyping, setOtherTyping] = useState<string | null>(null)
  const typingTimeoutRef = useRef<any>(null)

  useEffect(() => {
    if (!socket) return

    // Load message history (paginated: latest N)
    const pageSize = 30
    socket.emit("get_messages", { conversationId, limit: pageSize }, (data: any) => {
      setMessages(data || [])
      setHasOlder(Array.isArray(data) ? data.length === pageSize : false)
      setIsLoading(false)
    })

    socket.on("new_message", (message: any) => {
      if (message.conversation_id === conversationId) {
        setMessages((prev) => [...prev, message])
      }
    })

    // Listen for typing events from other users
    socket.on('typing', (data: any) => {
      try {
        if (!data) return
        if (data.conversationId !== conversationId) return
        if (data.userId === (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')||'{}').id : null)) return
        if (data.typing) {
          setOtherTyping(data.username || 'Someone')
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(() => setOtherTyping(null), 2500)
        } else {
          setOtherTyping(null)
        }
      } catch (e) {
        console.warn('[typing handler]', e)
      }
    })

    return () => {
      socket.off("new_message")
      socket.off('typing')
    }
  }, [conversationId, socket])

  // attach scroll handler to messageListRef to detect when user scrolls to top to load older messages
  useEffect(() => {
    const el = messageListRef.current
    if (!el || !socket) return

    const handler = () => {
      try {
        if (el.scrollTop < 120 && hasOlder && !loadingOlder) {
          // load older messages
          loadOlderMessages()
        }
      } catch (e) {
        console.warn('[scroll handler]', e)
      }
    }

    el.addEventListener('scroll', handler)
    return () => el.removeEventListener('scroll', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageListRef.current, hasOlder, loadingOlder, socket])

  const loadOlderMessages = () => {
    if (!socket || loadingOlder || messages.length === 0) return
    const firstMsg = messages[0]
    if (!firstMsg) return
    setLoadingOlder(true)
    setIsPrepending(true)
    const prevScrollHeight = messageListRef.current?.scrollHeight || 0
    const pageSize = 30

    socket.emit('get_messages', { conversationId, before: firstMsg.created_at, limit: pageSize }, (older: any[]) => {
      try {
        if (Array.isArray(older) && older.length > 0) {
          setMessages((prev) => [...older, ...prev])
          // after DOM updates, adjust scrollTop to preserve viewport
          requestAnimationFrame(() => {
            const el = messageListRef.current
            if (!el) return
            const newScrollHeight = el.scrollHeight
            el.scrollTop = newScrollHeight - prevScrollHeight
            setTimeout(() => setIsPrepending(false), 50)
          })
        }
        setHasOlder(!(older.length < pageSize))
      } catch (e) {
        console.warn('[loadOlderMessages callback]', e)
      } finally {
        setLoadingOlder(false)
        // ensure we stop prepending flag in case of empty result
        setIsPrepending(false)
      }
    })
  }

  const sendMessage = () => {
    if (!messageText.trim() || !socket) return

    socket.emit("send_message", {
      conversationId,
      content: messageText,
      type: "text",
    })

    setMessageText("")
  }

  // Emit typing events (debounced)
  const emitTyping = (isTyping: boolean) => {
    try {
      if (!socket) return
      socket.emit('typing', { conversationId, typing: isTyping })
    } catch (e) {
      console.warn('[emitTyping]', e)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    for (const file of files) {
      const formData = new FormData()
      formData.append("file", file)

      try {
        const res = await fetch(`${API_URL}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: formData,
        })

        const data = await res.json()

        if (!res.ok) {
          toast.error(data.message || "Upload failed")
          continue
        }

        if (socket) {
          const messageType = file.type.startsWith("image")
            ? "image"
            : file.type.startsWith("video")
              ? "video"
              : file.type.startsWith("audio")
                ? "voice"
                : "file"

          socket.emit("send_message", {
            conversationId,
            content: data.url,
            type: messageType,
            fileName: file.name,
          })
          toast.success("File uploaded successfully")
        }
      } catch (error) {
        toast.error("Upload failed")
      }
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const formData = new FormData()
        formData.append("file", audioBlob, `voice_${Date.now()}.webm`)

        try {
          const res = await fetch(`${API_URL}/api/upload`, {
            method: "POST",
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            body: formData,
          })

          const data = await res.json()

          if (!res.ok) {
            toast.error("Voice upload failed")
            return
          }

          if (socket) {
            socket.emit("send_message", {
              conversationId,
              content: data.url,
              type: "voice",
              fileName: `voice_${Date.now()}.webm`,
            })
            toast.success("Voice message sent")
          }
        } catch (error) {
          toast.error("Voice upload failed")
        }

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      const interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

      // Auto-stop after 60 seconds
      const timeout = setTimeout(() => {
        mediaRecorder.stop()
        setIsRecording(false)
        clearInterval(interval)
      }, 60000)

      // Store interval and timeout for cleanup
      mediaRecorderRef.current.interval = interval
      mediaRecorderRef.current.timeout = timeout
    } catch (error) {
      toast.error("Microphone access denied")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(mediaRecorderRef.current.interval)
      clearTimeout(mediaRecorderRef.current.timeout)
      setRecordingTime(0)
    }
  }

  // handle input change with typing emit
  const handleInputChange = (val: string) => {
    setMessageText(val)
    if (!socket) return
    // signal typing true, then debounce signaling false
    emitTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false)
    }, 2000)
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-900 h-full">
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-400">Loading messages...</p>
        </div>
      ) : (
        <>
          <div className="flex-1 min-h-0">
            {/* MessageList is the scrollable area (single scroll container). Keep only one scrollable element to avoid layout jumps */}
            <div className="h-full">
              <MessageList ref={messageListRef} messages={messages} preventAutoScroll={isPrepending} />
            </div>
          </div>

          {/* Input area is fixed at the bottom of the ChatWindow and does not scroll with messages */}
          <div className="flex-none border-t border-slate-700 p-3 bg-slate-900 sticky bottom-0 z-10">
            {isRecording && (
              <div className="flex items-center gap-3 bg-red-500/20 px-4 py-2 rounded border border-red-500/50 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm text-red-300">Recording: {recordingTime}s</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  value={messageText}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="bg-slate-800/60 border-slate-700 rounded-full h-12 px-4"
                  disabled={isRecording}
                />
                {otherTyping && <p className="text-xs text-slate-400 mt-1">{otherTyping} is typing...</p>}
              </div>

              <label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                />
                <Button size="icon" variant="ghost" className="border-transparent" asChild disabled={isRecording}>
                  <Paperclip size={18} />
                </Button>
              </label>

              {isRecording ? (
                <Button onClick={stopRecording} className="bg-red-600 hover:bg-red-700 w-10 h-10 flex items-center justify-center">
                  <X size={18} />
                </Button>
              ) : (
                <Button onClick={startRecording} variant="ghost" className="border-transparent w-10 h-10 flex items-center justify-center">
                  <Mic size={18} />
                </Button>
              )}

              <Button onClick={sendMessage} className="bg-blue-600 hover:bg-blue-700 w-12 h-12 flex items-center justify-center" disabled={isRecording}>
                <Send size={18} />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
