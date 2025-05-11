"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, ChevronDown, LogOut, User, Shield, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAnomalies } from "@/hooks/use-anomalies"

interface DashboardHeaderProps {
  user: {
    name: string
    email: string
    phoneNumber: string
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()
  const { anomalies } = useAnomalies()
  const [notifications, setNotifications] = useState(anomalies.length)

  useEffect(() => {
    setNotifications(anomalies.length)
  }, [anomalies])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="font-bold text-xl text-gray-900">
            Sunucu İzleme Sistemi
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Bildirimler</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {anomalies.length > 0 ? (
                <>
                  {anomalies.map((anomaly, index) => (
                    <DropdownMenuItem key={index} asChild>
                      <Link href={`/dashboard/server/${anomaly.serverId}/anomalies`} className="cursor-pointer">
                        <div className="flex flex-col w-full">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-red-600" />
                            <span className="font-medium">{anomaly.serverName}</span>
                            <Badge variant="outline" className="ml-auto bg-red-50 text-red-700 border-red-200">
                              Anomali
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">{anomaly.serverIp}</div>
                          <div className="text-xs text-red-600 mt-1 flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {anomaly.type === "login" ? "Şüpheli giriş denemeleri" : "Anormal sistem aktivitesi"}
                          </div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard?tab=anomalies" className="cursor-pointer text-center text-sm text-blue-600">
                      Tüm Anomalileri Görüntüle
                    </Link>
                  </DropdownMenuItem>
                </>
              ) : (
                <div className="py-2 px-2 text-sm text-gray-500 text-center">Bildirim bulunmamaktadır</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden md:inline-block">{user.name}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start">
                <span className="font-medium">{user.name}</span>
                <span className="text-sm text-gray-500">{user.email}</span>
                <span className="text-sm text-gray-500">{user.phoneNumber}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Çıkış Yap</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
