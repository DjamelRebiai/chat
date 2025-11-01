"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ChatLayout from "@/components/chat-layout"

export default function ChatPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    setIsAuthenticated(true)
  }, [router])

  if (!isAuthenticated) return null

  return <ChatLayout />
}
