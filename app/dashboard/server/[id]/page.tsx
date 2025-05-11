"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Server,
  Database,
  Globe,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive,
  MemoryStickIcon as Memory,
  Activity,
  Layers,
  Box,
  Search,
} from "lucide-react"

interface ServerData {
  id: string
  name: string
  type: "web" | "database" | "application" | "storage"
  status: "online" | "offline" | "warning"
  uptime: string
  ip: string
  location: string
  hasAlerts: boolean
  specs: {
    cpu: string
    ram: string
    storage: string
    os: string
  }
  metrics: {
    cpuUsage: number
    ramUsage: number
    diskUsage: number
    networkIn: number
    networkOut: number
  }
}

interface HardwareDetails {
  depolama: string
  bellek: string
  islemci: string
}

interface Application {
  id: string
  name: string
  icon: string
  status: "running" | "stopped" | "error"
  version: string
  port: number
}

export default function ServerDetailPage() {
  const params = useParams()
  const serverId = params.id as string
  const [server, setServer] = useState<ServerData | null>(null)
  const [hardwareDetails, setHardwareDetails] = useState<HardwareDetails | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Define standard applications
  const standardApps = [
    { id: "1", name: "Docker", icon: "box", status: "running", version: "24.0.5", port: 2375 },
    { id: "2", name: "Tomcat", icon: "server", status: "running", version: "10.1.13", port: 8080 },
    { id: "3", name: "System", icon: "layers", status: "running", version: "", port: 0 },
    { id: "4", name: "Nginx", icon: "globe", status: "running", version: "1.25.1", port: 80 },
    { id: "5", name: "Elasticsearch", icon: "search", status: "running", version: "8.11.1", port: 9200 },
    { id: "6", name: "MySQL", icon: "database", status: "running", version: "8.0.33", port: 3306 },
  ]

  useEffect(() => {
    const fetchServerDetails = async () => {
      setIsLoading(true)
      try {
        // First, fetch the list of servers to get the name and IP
        const serversResponse = await fetch("https://murat.inseres.com/sunucu/ipAdresleri", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        const serversResult = await serversResponse.json()

        // Find the server by ID (index)
        const serverEntries = Object.entries(serversResult.data || {})
        if (serverEntries.length >= Number.parseInt(serverId) && Number.parseInt(serverId) > 0) {
          const index = Number.parseInt(serverId) - 1
          const [ip, name] = serverEntries[index]

          // Next, fetch the hardware details with the server IP
          const hardwareResponse = await fetch("https://murat.inseres.com/sunucu/sunucuDonanimDetay", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ip }),
          })

          const hardwareResult = await hardwareResponse.json()

          // Set default hardware details if data is null
          const defaultHardwareDetails = {
            islemci: "Bilgi alınamadı",
            bellek: "Bilgi alınamadı",
            depolama: "Bilgi alınamadı",
          }

          // Store hardware details (use default if data is null)
          setHardwareDetails(hardwareResult.data || defaultHardwareDetails)

          // Generate random status
          const statuses = ["online", "warning", "offline"]
          const randomStatusIndex = Math.floor(Math.random() * 10)
          const status = randomStatusIndex < 7 ? "online" : randomStatusIndex < 9 ? "warning" : "offline"

          // Generate random server type
          const types = ["web", "database", "application", "storage"]
          const type = types[Math.floor(Math.random() * types.length)]

          // Create the server object with real IP, name, and hardware details
          const mockServer: ServerData = {
            id: serverId,
            name: name as string,
            type,
            status,
            uptime: status === "offline" ? "0%" : "99.8%",
            ip,
            location: ["İstanbul", "Ankara", "İzmir"][Math.floor(Math.random() * 3)],
            hasAlerts: status === "warning",
            specs: {
              cpu: hardwareResult.data?.islemci || "Bilgi alınamadı",
              ram: hardwareResult.data?.bellek || "Bilgi alınamadı",
              storage: hardwareResult.data?.depolama || "Bilgi alınamadı",
              os: "Ubuntu 22.04 LTS",
            },
            metrics: {
              cpuUsage: Math.floor(Math.random() * 60) + 20,
              ramUsage: Math.floor(Math.random() * 60) + 20,
              diskUsage: Math.floor(Math.random() * 40) + 30,
              networkIn: Math.floor(Math.random() * 100) + 50,
              networkOut: Math.floor(Math.random() * 80) + 20,
            },
          }

          setServer(mockServer)

          // Set standard applications with random status for some
          const appsWithStatus = standardApps.map((app) => ({
            ...app,
            status: Math.random() > 0.8 ? "error" : Math.random() > 0.9 ? "stopped" : "running",
          }))

          setApplications(appsWithStatus)
        } else {
          console.error("Server not found")
        }
      } catch (error) {
        console.error("Error fetching server details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchServerDetails()
  }, [serverId])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
      case "running":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" /> Çalışıyor
          </Badge>
        )
      case "offline":
      case "stopped":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <Clock className="h-3 w-3 mr-1" /> Durduruldu
          </Badge>
        )
      case "warning":
      case "error":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" /> Hata
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" /> Bilinmiyor
          </Badge>
        )
    }
  }

  const getAppIcon = (icon: string) => {
    switch (icon) {
      case "globe":
        return <Globe className="h-5 w-5" />
      case "database":
        return <Database className="h-5 w-5" />
      case "server":
        return <Server className="h-5 w-5" />
      case "search":
        return <Search className="h-5 w-5" />
      case "box":
        return <Box className="h-5 w-5" />
      case "layers":
        return <Layers className="h-5 w-5" />
      default:
        return <Server className="h-5 w-5" />
    }
  }

  if (isLoading || !server || !hardwareDetails) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{server.name}</h1>
        {getStatusBadge(server.status)}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Kullanımı</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{server.metrics.cpuUsage}%</div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full ${
                  server.metrics.cpuUsage > 80
                    ? "bg-red-500"
                    : server.metrics.cpuUsage > 60
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{ width: `${server.metrics.cpuUsage}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RAM Kullanımı</CardTitle>
            <Memory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{server.metrics.ramUsage}%</div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full ${
                  server.metrics.ramUsage > 80
                    ? "bg-red-500"
                    : server.metrics.ramUsage > 60
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{ width: `${server.metrics.ramUsage}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Kullanımı</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{server.metrics.diskUsage}%</div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full ${
                  server.metrics.diskUsage > 80
                    ? "bg-red-500"
                    : server.metrics.diskUsage > 60
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{ width: `${server.metrics.diskUsage}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ağ Trafiği</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{server.metrics.networkIn} MB/s</div>
            <p className="text-xs text-muted-foreground">
              Gelen: {server.metrics.networkIn} MB/s | Giden: {server.metrics.networkOut} MB/s
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sunucu Bilgileri</CardTitle>
          <CardDescription>Sunucu donanım ve yazılım özellikleri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-2">Donanım Özellikleri</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">İşlemci:</span>
                  <span>{hardwareDetails.islemci}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bellek:</span>
                  <span>{hardwareDetails.bellek}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Depolama:</span>
                  <span>{hardwareDetails.depolama}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Yazılım Özellikleri</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">İşletim Sistemi:</span>
                  <span>{server.specs.os}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IP Adresi:</span>
                  <span>{server.ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Konum:</span>
                  <span>{server.location}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uygulamalar</CardTitle>
          <CardDescription>Sunucuda çalışan uygulamalar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {applications.map((app) => (
              <Link href={`/dashboard/server/${serverId}/app/${app.id}`} key={app.id}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-2">
                      {getAppIcon(app.icon)}
                      <CardTitle className="text-lg font-medium">{app.name}</CardTitle>
                    </div>
                    {getStatusBadge(app.status)}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {app.id !== "3" && (
                        <>
                          <div className="flex flex-col">
                            <span className="text-gray-500">Versiyon</span>
                            <span>{app.version}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-500">Port</span>
                            <span>{app.port}</span>
                          </div>
                        </>
                      )}
                      {app.id === "3" && (
                        <div className="flex flex-col col-span-2">
                          <span className="text-gray-500">Açıklama</span>
                          <span>Sistem bilgileri ve açık portlar</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
