import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Sunucu İzleme Sistemi</CardTitle>
          <CardDescription className="text-lg mt-2">Bitirme Tezi Projesi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Proje Hakkında</h3>
            <p className="text-gray-600">
              Bu proje, Murat Bayraktar ve Özge Beyda Köpüren tarafından bitirme tezi olarak geliştirilmiştir.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Sunucu İzlemenin Önemi</h3>
            <p className="text-gray-600">
              Günümüz dijital dünyasında, sunucuların kesintisiz ve verimli çalışması kritik öneme sahiptir. Sunucu
              izleme sistemleri, potansiyel sorunları önceden tespit ederek, sistem yöneticilerine proaktif müdahale
              imkanı sağlar ve hizmet kesintilerini en aza indirir.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Neden Bu Konu?</h3>
            <p className="text-gray-600">
              Bu bitirme projesi için sunucu izleme konusu seçilmiştir çünkü modern BT altyapılarında sistem
              güvenilirliği ve performansı hayati önem taşımaktadır. Bu proje, gerçek zamanlı izleme, uyarı
              mekanizmaları ve detaylı analiz araçları sunarak, sistem yöneticilerine değerli içgörüler sağlamayı
              amaçlamaktadır.
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <img src="/placeholder.svg?key=e996n" alt="Sunucu İzleme Görseli" className="rounded-lg shadow-md" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild size="lg" className="mt-4">
            <Link href="/login">Sisteme Giriş Yap</Link>
          </Button>
        </CardFooter>
      </Card>

      <footer className="mt-8 text-center text-gray-500">
        <p>© 2025 Murat Bayraktar & Özge Beyda Köpüren</p>
      </footer>
    </div>
  )
}
