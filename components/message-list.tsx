"use client"

import { useEffect, useRef, forwardRef } from "react"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { Volume2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Message {
  id: string
  content: string
  type: "text" | "image" | "file" | "voice" | "video"
  sender_id: number
  senderName?: string
  created_at: string
  file_name?: string
}

type Props = {
  messages: Message[]
  preventAutoScroll?: boolean
}

const MessageList = forwardRef<HTMLDivElement, Props>(function MessageList({ messages, preventAutoScroll }, forwardedRef) {
  const internalRef = useRef<HTMLDivElement | null>(null)
  const containerRef = (forwardedRef as any) || internalRef
  const prevLenRef = useRef<number>(0)
  const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {}

  // Scroll handling:
  // - On initial load or when messages are replaced, jump to bottom (auto)
  // - When new messages are appended (messages length increases), smoothly scroll to bottom
  // - Respect media loading: if images/videos load and the user was at bottom, keep them at bottom
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const prev = prevLenRef.current
    const curr = messages ? messages.length : 0

    const isAtBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 50

    // Defer to next frame so layout has settled (helps with images/media)
    const doScroll = () => {
      if (preventAutoScroll) {
        // If parent requested no auto scroll (e.g. we're prepending older messages), do nothing here
        prevLenRef.current = curr
        return
      }
      if (curr > prev) {
        // new messages appended -> smooth scroll
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
      } else {
        // initial load or replacement -> jump to bottom
        container.scrollTo({ top: container.scrollHeight, behavior: "auto" })
      }
      prevLenRef.current = curr
    }

    // If currently at bottom, scroll after layout settle
    if (isAtBottom || curr !== prev) {
      requestAnimationFrame(() => {
        // small timeout to allow images to contribute to scrollHeight
        setTimeout(doScroll, 50)
      })
    } else {
      // don't change user's scroll position if they are reading older messages
      prevLenRef.current = curr
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, preventAutoScroll])

  const playVoiceMessage = (url: string) => {
    const audio = new Audio(url)
    audio.play()
  }

  return (
    // full height scrollable list; parent controls available height
  <div ref={containerRef as any} className="h-full overflow-y-auto p-4 pb-24 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
      {messages.map((message) => {
        const isOwn = message.sender_id === currentUser.id

        return (
          <div key={message.id} className={`flex items-end ${isOwn ? "justify-end" : "justify-start"}`}>
            {!isOwn && (
              <div className="flex-shrink-0 mr-3">
                <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm text-white">
                  {message.senderName ? message.senderName.charAt(0).toUpperCase() : "U"}
                </div>
              </div>
            )}

            <div className={`rounded-lg px-4 py-2 max-w-[70%] break-words ${
              isOwn ? "bg-blue-600/80 text-white" : "bg-slate-800/60 text-slate-100"
            }`}>
              {!isOwn && <p className="text-xs font-semibold text-slate-300 mb-1">{message.senderName}</p>}

              {message.type === "text" && <p className="whitespace-pre-wrap">{message.content}</p>}

              {message.type === "image" && (
                <Image
                  src={message.content || "/placeholder.svg"}
                  alt="Shared image"
                  width={300}
                  height={300}
                  className="rounded max-w-full h-auto"
                  crossOrigin="anonymous"
                  onLoad={() => {
                    // if user is near bottom, keep them at bottom after image loads
                    const container = (containerRef as any).current
                    if (!container) return
                    const isAtBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 50
                    if (isAtBottom) container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
                  }}
                />
              )}

              {message.type === "video" && (
                <video
                  src={message.content}
                  controls
                  className="rounded max-w-full h-auto max-h-64"
                  crossOrigin="anonymous"
                  onLoadedData={() => {
                    const container = (containerRef as any).current
                    if (!container) return
                    const isAtBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 50
                    if (isAtBottom) container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
                  }}
                />
              )}

              {message.type === "voice" && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" className="bg-slate-700/30" onClick={() => playVoiceMessage(message.content)}>
                    <Volume2 size={16} />
                  </Button>
                  <span className="text-xs text-slate-400">Voice message</span>
                </div>
              )}

              {message.type === "file" && (
                <a href={message.content} className="text-blue-300 hover:underline flex items-center gap-2 text-sm" download>
                  <Download size={16} />
                  {message.file_name || "Download file"}
                </a>
              )}

              <p className="text-xs text-slate-400 mt-2 text-right">{new Date(message.created_at).toLocaleTimeString()}</p>
            </div>

            {isOwn && (
              <div className="flex-shrink-0 ml-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm text-white">Y</div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
})

export default MessageList
