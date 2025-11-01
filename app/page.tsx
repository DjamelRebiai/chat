"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export default function LandingPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      setIsAuthenticated(true)
      router.push("/chat")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            ChatFlow
          </div>
          <div className="space-x-4">
            <Link href="/login">
              <Button variant="outline" className="border-slate-600 bg-transparent">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-blue-600 hover:bg-blue-700">Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Connect with Anyone,{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Anywhere</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Real-time chat with text, images, video calls, and voice messages. Built for modern communication.
          </p>
          <div className="flex gap-4 justify-center pt-8">
            <Link href="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-slate-600 bg-transparent">
              Learn More
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          {[
            {
              title: "Real-time Messaging",
              description: "Instant message delivery with Socket.io technology",
              icon: "💬",
            },
            {
              title: "Voice & Video Calls",
              description: "Crystal clear peer-to-peer calls using WebRTC",
              icon: "📞",
            },
            {
              title: "Media Sharing",
              description: "Share images, videos, and voice messages instantly",
              icon: "📸",
            },
          ].map((feature, i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700 p-6">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
