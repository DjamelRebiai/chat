"use client"

import React, { useState, useEffect, useRef } from "react"
import type { Socket } from "socket.io-client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LogOut, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

interface SidebarProps {
  conversations: any[]
  selectedConversation: string | null
  onSelectConversation: (id: string) => void
  socket: Socket | null
  unreadCounts?: Record<string, number>
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ conversations, selectedConversation, onSelectConversation, socket, unreadCounts, isOpen, onClose }: SidebarProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || ""
  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUsers] = useState<any[]>([])
  const [showUserSearch, setShowUserSearch] = useState(false)
  const router = useRouter()
  const firstButtonRef = React.useRef<HTMLButtonElement>(null)

  // focus management: focus the first interactive element when opening on mobile
  useEffect(() => {
    if (isOpen) {
      // small timeout to allow element to be visible before focusing
      setTimeout(() => firstButtonRef.current?.focus(), 50)
    }
  }, [isOpen])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
  }

  const searchUsers = async (query: string) => {
    if (!query) {
      setUsers([])
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/users/search?query=${query}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      const data = await res.json()
      setUsers(data)
    } catch (error) {
      console.error("Search error:", error)
    }
  }

  const startConversation = (userId: string) => {
    socket?.emit("create_conversation", { userId }, (conversationId: string) => {
      onSelectConversation(conversationId)
      setShowUserSearch(false)
      setSearchTerm("")
    })
  }

  // Build a deduplicated conversation list (keyed by conversation id or participant_id)
  const uniqueConversations = (() => {
    const map = new Map<string, any>()
    for (const c of conversations || []) {
      const key = c.id || c.participant_id || `${c.participantEmail || c.email || 'unknown'}-${c.participant_id || ''}`
      if (!map.has(key)) map.set(key, c)
    }
    return Array.from(map.values())
  })()

  return (
    <>
      {/* Backdrop for mobile when open */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div
        id="mobile-sidebar"
        role="dialog"
        aria-label="Navigation menu"
        aria-modal={isOpen}
        className={`bg-slate-800 border-r border-slate-700 flex flex-col w-72 z-50 transform transition-transform duration-300 ease-in-out shadow-lg
          ${isOpen ? 'translate-x-0 fixed left-0 top-0 bottom-0' : '-translate-x-full md:translate-x-0 md:relative'}`}
      >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">ChatFlow</h1>
            <p className="text-xs text-slate-400">Fast & secure messaging</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              ref={firstButtonRef}
              size="sm" 
              variant="ghost" 
              onClick={() => setShowUserSearch(!showUserSearch)} 
              className="border-transparent"
              aria-label="Add new conversation"
            >
              <Plus size={18} />
            </Button>
            {/* no mobile close button when sidebar is always visible */}
          </div>
        </div>

        {showUserSearch && (
          <div className="mt-4">
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                searchUsers(e.target.value)
              }}
              className="bg-slate-700/50 border-slate-600 w-full"
            />
            <div className="space-y-2 max-h-44 overflow-y-auto mt-2">
              {users.map((u) => (
                <Card
                  key={u.id}
                  className="bg-slate-700/50 border-slate-600 p-3 cursor-pointer hover:bg-slate-700 transition flex items-center gap-3"
                  onClick={() => startConversation(u.id)}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm text-white">{u.username?.charAt(0)?.toUpperCase()}</div>
                  <div className="truncate">
                    <p className="font-medium truncate">{u.username}</p>
                    <p className="text-sm text-slate-400 truncate">{u.email}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {uniqueConversations.map((conv) => {
          // Determine display name more robustly.
          // server usually provides `participantName`, but fall back to other fields or derive from conversation id.
          let primary =
            conv.participantName ||
            conv.participant_name ||
            conv.username ||
            conv.name ||
            conv.participantEmail ||
            conv.participant_email ||
            ''
          if (!primary) {
            // try email aliases
            primary = conv.email || conv.participantEmail || conv.participant_email || ''
          }
          if (!primary) {
            // attempt to derive from conversation id 'min_max' and local user id
            try {
              const rawId = conv.id || ''
              if (typeof window !== 'undefined') {
                const me = JSON.parse(localStorage.getItem('user') || '{}')
                if (rawId && rawId.includes('_') && me && me.id) {
                  const parts = rawId.split('_')
                  const otherId = parts[0] == String(me.id) ? parts[1] : parts[0]
                  primary = `User ${otherId}`
                }
              }
            } catch (e) {
              /* ignore */
            }
          }
          if (!primary) primary = 'Unknown'

          const secondary = conv.lastMessage && String(conv.lastMessage).trim() !== '' ? conv.lastMessage : (conv.participantEmail || conv.email || 'No messages')
          const initial = primary ? String(primary).charAt(0).toUpperCase() : 'U'

          return (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                selectedConversation === conv.id ? "bg-blue-600/60" : "hover:bg-slate-700"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-sm text-white">{initial}</div>
              <div className="min-w-0">
                <p className="font-medium truncate">{primary}</p>
                <p className="text-sm text-slate-400 truncate">{secondary}</p>
              </div>
              {typeof unreadCounts !== 'undefined' && unreadCounts[conv.id] ? (
                <div className="ml-auto">
                  <div className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-semibold">{unreadCounts[conv.id]}</div>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="p-4 border-t border-slate-700">
        <Button onClick={handleLogout} variant="outline" className="w-full border-slate-600 bg-transparent">
          <LogOut size={18} />
          <span className="ml-2">Logout</span>
        </Button>
      </div>
    </div>
    </>
  )
}
