"use client"

import { Button } from "@/components/ui/button"
import { Phone, Video, MoreVertical, Settings, LogOut, Menu, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface TopBarProps {
  conversation: any
  onCallClick: () => void
  onToggleSidebar?: () => void
  isOpen?: boolean
}

export default function TopBar({ conversation, onCallClick, onToggleSidebar, isOpen }: TopBarProps) {
  const router = useRouter()

  const [theme, setTheme] = useState<string>(typeof window !== 'undefined' ? localStorage.getItem('chat_theme') || 'blue' : 'blue')
  const [isRtl, setIsRtl] = useState<boolean>(typeof window !== 'undefined' ? (localStorage.getItem('chat_dir') === 'rtl') : false)

  if (!conversation) return null

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
  }

  useEffect(() => {
    // apply saved theme
    try {
      const t = localStorage.getItem('chat_theme') || 'blue'
      applyTheme(t)
      const dir = localStorage.getItem('chat_dir') || 'ltr'
      document.documentElement.dir = dir
    } catch (e) {
      console.warn('[theme apply]', e)
    }
  }, [])

  function applyTheme(name: string) {
    const root = document.documentElement
    if (!root) return
    if (name === 'green') {
      root.style.setProperty('--primary', '#10b981')
      root.style.setProperty('--primary-foreground', '#ffffff')
      root.style.setProperty('--sidebar-primary', '#059669')
    } else {
      // default blue
      root.style.setProperty('--primary', '#2563eb')
      root.style.setProperty('--primary-foreground', '#ffffff')
      root.style.setProperty('--sidebar-primary', '#0ea5e9')
    }
    localStorage.setItem('chat_theme', name)
    setTheme(name)
  }

  function toggleRtl() {
    const newDir = !isRtl ? 'rtl' : 'ltr'
    document.documentElement.dir = newDir
    localStorage.setItem('chat_dir', newDir)
    setIsRtl(!isRtl)
  }

  return (
    <div className="border-b border-slate-700 bg-slate-800/60 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Toggle sidebar (visible on all sizes) */}
        <Button
          size="icon"
          variant="ghost"
          className="border-transparent mr-1"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          aria-expanded={!!isOpen}
          aria-controls="mobile-sidebar"
        >
          {isOpen ? <X size={18} /> : <Menu size={18} />}
        </Button>
        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-lg font-semibold">{conversation.participantName?.charAt(0)}</div>
        <div>
          <h2 className="text-lg font-semibold text-white">{conversation.participantName}</h2>
          <p className="text-xs text-slate-400">Online</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="icon" variant="ghost" className="border-transparent hover:bg-slate-700/40">
          <Phone size={18} />
        </Button>
        <Button size="icon" variant="ghost" className="border-transparent hover:bg-slate-700/40" onClick={onCallClick}>
          <Video size={18} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="border-transparent hover:bg-slate-700/40">
              <MoreVertical size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
            <DropdownMenuItem className="text-slate-300 focus:bg-slate-700">
              <Settings size={16} className="mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => applyTheme('blue')} className="text-slate-300 focus:bg-slate-700">
              Theme: Blue
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => applyTheme('green')} className="text-slate-300 focus:bg-slate-700">
              Theme: Green
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleRtl} className="text-slate-300 focus:bg-slate-700">
              {isRtl ? 'Disable RTL' : 'Enable RTL'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:bg-slate-700">
              <LogOut size={16} className="mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
