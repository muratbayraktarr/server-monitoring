"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { AnomalyProvider } from "@/hooks/use-anomalies"

interface DashboardLayoutProps {
  children: ReactNode
}

interface User {
  name: string
  email: string
  phoneNumber: string
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    } catch (error) {
      // Invalid user data
      localStorage.removeItem("user")
      router.push("/login")
    } finally {
      setIsLoading(false)
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <AnomalyProvider>
      <div className="flex min-h-screen flex-col">
        {user && <DashboardHeader user={user} />}
        <div className="flex-1 flex">
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </AnomalyProvider>
  )
}
