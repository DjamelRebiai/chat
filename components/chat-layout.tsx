"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { io, type Socket } from "socket.io-client"
import Sidebar from "./sidebar"
import ChatWindow from "./chat-window"
import TopBar from "./top-bar"
import VideoCallModal from "./video-call-modal"

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "https://chat-server-pwt7.onrender.com"

export default function ChatLayout() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [user, setUser] = useState<any>(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [callData, setCallData] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)

  // initialize sidebar visibility based on screen width (show on md+)
  useEffect(() => {
    function update() {
      try {
        const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768
        setSidebarOpen(isDesktop)
      } catch (e) {}
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token: localStorage.getItem("token") },
      reconnection: true,
      reconnectionDelay: 1000,
    })

    newSocket.on("connect", () => {
      console.log("Connected to socket")
      newSocket.emit("get_conversations", (data: any) => {
        setConversations(data || [])
      })
    })

    newSocket.on("conversation_list", (data) => {
      setConversations(data || [])
    })

    // Global new_message handler for notifications / unread counts
    newSocket.on('new_message', (message: any) => {
      try {
        // if message is for current selected conversation, UI will also receive it via ChatWindow
        if (message.conversation_id !== selectedConversation) {
          setUnreadCounts((prev) => ({ ...prev, [message.conversation_id]: (prev[message.conversation_id] || 0) + 1 }))
          // optional toast notification
          // show a small toast notification
          try {
            toast((message.senderName || 'Someone') + ': ' + (typeof message.content === 'string' ? message.content.slice(0, 80) : '[attachment]'))
          } catch (e) {
            console.log('[notify] message', message)
          }
        }
      } catch (e) {
        console.warn('[new_message handler] ', e)
      }
    })

    // Typing indicator relay: handled in ChatWindow per conversation
    newSocket.on('typing', (data) => {
      // We don't handle globally here; ChatWindow listens locally for typing events
    })

    newSocket.on("incoming_call", (data) => {
      setCallData(data)
      setIsCallActive(true)
    })

    newSocket.on("call_rejected", () => {
      setIsCallActive(false)
      setCallData(null)
      toast.error('Call was declined')
    })

    newSocket.on("call_ended", () => {
      setIsCallActive(false)
      setCallData(null)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  // Clear unread count when selecting a conversation
  useEffect(() => {
    if (!selectedConversation) return
    setUnreadCounts((prev) => {
      const copy = { ...prev }
      delete copy[selectedConversation]
      return copy
    })
  }, [selectedConversation])

  return (
    // overflow-hidden ensures the page itself doesn't scroll; each panel handles its own scrolling
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      <Sidebar
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={(id: string) => {
          setSelectedConversation(id)
          // close sidebar on mobile after selecting a conversation
          if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false)
        }}
        socket={socket}
        unreadCounts={unreadCounts}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <TopBar
              conversation={conversations.find((c) => c.id === selectedConversation)}
              onCallClick={() => {
                // open local caller UI immediately
                const caller = user || JSON.parse(localStorage.getItem('user') || '{}')
                const cd = { conversationId: selectedConversation, callerId: caller?.id, callerName: caller?.username }
                setCallData(cd)
                setIsCallActive(true)
                socket?.emit("initiate_call", { conversationId: selectedConversation })
              }}
              onToggleSidebar={() => setSidebarOpen((s) => !s)}
              isOpen={sidebarOpen}
            />
            <ChatWindow conversationId={selectedConversation} socket={socket} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-slate-400">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
      {isCallActive && (
        <VideoCallModal
          callData={callData}
          socket={socket}
          onClose={() => setIsCallActive(false)}
          isCaller={(user && callData && user.id === callData.callerId) || false}
        />
      )}
    </div>
  )
}
