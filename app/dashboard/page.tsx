"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertBar } from "@/components/alert-bar"
import { AnomalyAlert } from "@/components/anomaly-alert"
import { Server, HardDrive, Activity, Clock, CheckCircle, AlertTriangle, Shield } from "lucide-react"

interface ServerData {
  id: string
  name: string
  ip: string
  status: "online" | "offline" | "warning"
  uptime: string
  cpu: number
  memory: number
  disk: number
  lastChecked: string
}

export default function DashboardPage() {
  const [servers, setServers] = useState<ServerData[]>([])
  const [loading, setLoading] = useState(true)
  const [anomalyServers, setAnomalyServers] = useState<string[]>([])

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await fetch("https://murat.inseres.com/sunucu/ipAdresleri", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        const result = await response.json()

        if (result.status === "success") {
          const serverEntries = Object.entries(result.data)
          const serverList = await Promise.all(
            serverEntries.map(async ([ip, name], index) => {
              // Check for anomalies
              try {
                const anomalyResponse = await fetch("https://murat.inseres.com/sunucu/anomaliDatalar", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ ip }),
                })

                const anomalyResult = await anomalyResponse.json()
                if (anomalyResult.status === "success" && anomalyResult.data && anomalyResult.data.length > 0) {
                  setAnomalyServers((prev) => [...prev, (index + 1).toString()])
                }
              } catch (error) {
                console.error("Error checking anomalies:", error)
              }

              // Fetch system metrics
              let cpuUsage = Math.floor(Math.random() * 60) + 10
              let memoryUsage = Math.floor(Math.random() * 70) + 20
              let diskUsage = Math.floor(Math.random() * 80) + 10

              try {
                const metricsResponse = await fetch("https://murat.inseres.com/sunucu/anasayfaSayisalDegerler", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ ip }),
                })

                const metricsResult = await metricsResponse.json()
                if (metricsResult.status === "success" && metricsResult.data && metricsResult.data.length > 0) {
                  const metrics = metricsResult.data[0]
                  cpuUsage = Number(metrics.cpuusage)
                  memoryUsage = Math.round(
                    ((Number(metrics.totalRam) - Number(metrics.freeRam)) / Number(metrics.totalRam)) * 100,
                  )
                  diskUsage = Math.round(
                    ((Number(metrics.diskTotalSpace) - Number(metrics.diskFreeSpace)) /
                      Number(metrics.diskTotalSpace)) *
                      100,
                  )
                }
              } catch (error) {
                console.error("Error fetching metrics:", error)
              }

              return {
                id: (index + 1).toString(),
                name: name as string,
                ip,
                status: cpuUsage > 90 || memoryUsage > 90 ? "warning" : "online",
                uptime: `${Math.floor(Math.random() * 30) + 1} gün`,
                cpu: cpuUsage,
                memory: memoryUsage,
                disk: diskUsage,
                lastChecked: new Date().toLocaleString("tr-TR"),
              }
            }),
          )

          setServers(serverList)
        }
      } catch (error) {
        console.error("Error fetching servers:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchServers()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const onlineServers = servers.filter((server) => server.status === "online").length
  const warningServers = servers.filter((server) => server.status === "warning").length
  const offlineServers = servers.filter((server) => server.status === "offline").length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Sunucu İzleme Paneli</h1>
        <Button>Yenile</Button>
      </div>

      {anomalyServers.length > 0 && (
        <div className="space-y-4">
          {anomalyServers.map((serverId) => (
            <AnomalyAlert
              key={serverId}
              serverId={serverId}
              serverIp={servers.find((s) => s.id === serverId)?.ip || ""}
            />
          ))}
        </div>
      )}

      <AlertBar />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Sunucu</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{servers.length}</div>
            <p className="text-xs text-muted-foreground">
              {onlineServers} çevrimiçi, {warningServers} uyarı, {offlineServers} çevrimdışı
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama CPU Kullanımı</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(servers.reduce((acc, server) => acc + server.cpu, 0) / servers.length)}%
            </div>
            <p className="text-xs text-muted-foreground">Son 24 saat</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Bellek Kullanımı</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(servers.reduce((acc, server) => acc + server.memory, 0) / servers.length)}%
            </div>
            <p className="text-xs text-muted-foreground">Son 24 saat</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Tüm Sunucular</TabsTrigger>
          <TabsTrigger value="online">Çevrimiçi</TabsTrigger>
          <TabsTrigger value="warning">Uyarı</TabsTrigger>
          <TabsTrigger value="offline">Çevrimdışı</TabsTrigger>
          <TabsTrigger value="anomalies" className="bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800">
            <Shield className="h-4 w-4 mr-1" /> Anomaliler ({anomalyServers.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {servers.map((server) => (
              <Link key={server.id} href={`/dashboard/server/${server.id}`}>
                <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">{server.name}</CardTitle>
                    {server.status === "online" ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" /> Çevrimiçi
                      </Badge>
                    ) : server.status === "warning" ? (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Uyarı
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Çevrimdışı
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground mb-2">{server.ip}</div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>CPU</span>
                          <span className={server.cpu > 80 ? "text-red-600" : ""}>{server.cpu}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full ${
                              server.cpu > 80 ? "bg-red-500" : server.cpu > 60 ? "bg-yellow-500" : "bg-green-500"
                            }`}
                            style={{ width: `${server.cpu}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>Bellek</span>
                          <span className={server.memory > 80 ? "text-red-600" : ""}>{server.memory}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full ${
                              server.memory > 80 ? "bg-red-500" : server.memory > 60 ? "bg-yellow-500" : "bg-blue-500"
                            }`}
                            style={{ width: `${server.memory}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>Disk</span>
                          <span className={server.disk > 80 ? "text-red-600" : ""}>{server.disk}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full ${
                              server.disk > 80 ? "bg-red-500" : server.disk > 60 ? "bg-yellow-500" : "bg-purple-500"
                            }`}
                            style={{ width: `${server.disk}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Çalışma: {server.uptime}</span>
                      </div>
                      <div>Son kontrol: {server.lastChecked}</div>
                    </div>
                    {anomalyServers.includes(server.id) && (
                      <div className="mt-2">
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-700 border-red-200 w-full justify-center"
                        >
                          <Shield className="h-3 w-3 mr-1" /> Güvenlik Anomalisi Tespit Edildi
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="online" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {servers
              .filter((server) => server.status === "online")
              .map((server) => (
                <Link key={server.id} href={`/dashboard/server/${server.id}`}>
                  <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-medium">{server.name}</CardTitle>
                      {server.status === "online" ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" /> Çevrimiçi
                        </Badge>
                      ) : server.status === "warning" ? (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Uyarı
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Çevrimdışı
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-2">{server.ip}</div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>CPU</span>
                            <span className={server.cpu > 80 ? "text-red-600" : ""}>{server.cpu}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full ${
                                server.cpu > 80 ? "bg-red-500" : server.cpu > 60 ? "bg-yellow-500" : "bg-green-500"
                              }`}
                              style={{ width: `${server.cpu}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>Bellek</span>
                            <span className={server.memory > 80 ? "text-red-600" : ""}>{server.memory}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full ${
                                server.memory > 80 ? "bg-red-500" : server.memory > 60 ? "bg-yellow-500" : "bg-blue-500"
                              }`}
                              style={{ width: `${server.memory}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>Disk</span>
                            <span className={server.disk > 80 ? "text-red-600" : ""}>{server.disk}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full ${
                                server.disk > 80 ? "bg-red-500" : server.disk > 60 ? "bg-yellow-500" : "bg-purple-500"
                              }`}
                              style={{ width: `${server.disk}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>Çalışma: {server.uptime}</span>
                        </div>
                        <div>Son kontrol: {server.lastChecked}</div>
                      </div>
                      {anomalyServers.includes(server.id) && (
                        <div className="mt-2">
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200 w-full justify-center"
                          >
                            <Shield className="h-3 w-3 mr-1" /> Güvenlik Anomalisi Tespit Edildi
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </TabsContent>
        <TabsContent value="warning" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {servers
              .filter((server) => server.status === "warning")
              .map((server) => (
                <Link key={server.id} href={`/dashboard/server/${server.id}`}>
                  <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-medium">{server.name}</CardTitle>
                      {server.status === "online" ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" /> Çevrimiçi
                        </Badge>
                      ) : server.status === "warning" ? (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Uyarı
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Çevrimdışı
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-2">{server.ip}</div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>CPU</span>
                            <span className={server.cpu > 80 ? "text-red-600" : ""}>{server.cpu}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full ${
                                server.cpu > 80 ? "bg-red-500" : server.cpu > 60 ? "bg-yellow-500" : "bg-green-500"
                              }`}
                              style={{ width: `${server.cpu}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>Bellek</span>
                            <span className={server.memory > 80 ? "text-red-600" : ""}>{server.memory}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full ${
                                server.memory > 80 ? "bg-red-500" : server.memory > 60 ? "bg-yellow-500" : "bg-blue-500"
                              }`}
                              style={{ width: `${server.memory}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>Disk</span>
                            <span className={server.disk > 80 ? "text-red-600" : ""}>{server.disk}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full ${
                                server.disk > 80 ? "bg-red-500" : server.disk > 60 ? "bg-yellow-500" : "bg-purple-500"
                              }`}
                              style={{ width: `${server.disk}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>Çalışma: {server.uptime}</span>
                        </div>
                        <div>Son kontrol: {server.lastChecked}</div>
                      </div>
                      {anomalyServers.includes(server.id) && (
                        <div className="mt-2">
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200 w-full justify-center"
                          >
                            <Shield className="h-3 w-3 mr-1" /> Güvenlik Anomalisi Tespit Edildi
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </TabsContent>
        <TabsContent value="offline" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {servers
              .filter((server) => server.status === "offline")
              .map((server) => (
                <Link key={server.id} href={`/dashboard/server/${server.id}`}>
                  <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-medium">{server.name}</CardTitle>
                      {server.status === "online" ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" /> Çevrimiçi
                        </Badge>
                      ) : server.status === "warning" ? (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Uyarı
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Çevrimdışı
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-2">{server.ip}</div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>CPU</span>
                            <span className={server.cpu > 80 ? "text-red-600" : ""}>{server.cpu}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full ${
                                server.cpu > 80 ? "bg-red-500" : server.cpu > 60 ? "bg-yellow-500" : "bg-green-500"
                              }`}
                              style={{ width: `${server.cpu}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>Bellek</span>
                            <span className={server.memory > 80 ? "text-red-600" : ""}>{server.memory}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full ${
                                server.memory > 80 ? "bg-red-500" : server.memory > 60 ? "bg-yellow-500" : "bg-blue-500"
                              }`}
                              style={{ width: `${server.memory}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>Disk</span>
                            <span className={server.disk > 80 ? "text-red-600" : ""}>{server.disk}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full ${
                                server.disk > 80 ? "bg-red-500" : server.disk > 60 ? "bg-yellow-500" : "bg-purple-500"
                              }`}
                              style={{ width: `${server.disk}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>Çalışma: {server.uptime}</span>
                        </div>
                        <div>Son kontrol: {server.lastChecked}</div>
                      </div>
                      {anomalyServers.includes(server.id) && (
                        <div className="mt-2">
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200 w-full justify-center"
                          >
                            <Shield className="h-3 w-3 mr-1" /> Güvenlik Anomalisi Tespit Edildi
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </TabsContent>
        <TabsContent value="anomalies" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {servers
              .filter((server) => anomalyServers.includes(server.id))
              .map((server) => (
                <Link key={server.id} href={`/dashboard/server/${server.id}/anomalies`}>
                  <Card className="hover:bg-gray-50 transition-colors cursor-pointer border-red-200 bg-red-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-medium">{server.name}</CardTitle>
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                        <Shield className="h-3 w-3 mr-1" /> Anomali
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-2">{server.ip}</div>
                      <div className="p-3 bg-white rounded-md border border-red-200 mb-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-red-700">Güvenlik Anomalisi Tespit Edildi</span>
                        </div>
                        <p className="text-xs text-red-600 mt-1">
                          Şüpheli giriş denemeleri ve anormal sistem aktivitesi tespit edildi.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-white text-red-700 border-red-300 hover:bg-red-100"
                      >
                        <Shield className="h-4 w-4 mr-1" /> Anomali Detaylarını Görüntüle
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
