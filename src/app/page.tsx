"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center islamic-pattern">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-700 flex items-center justify-center">
            <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-emerald-800">Absensi Sholat</h1>
          <p className="text-emerald-600 mt-2">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center islamic-pattern p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="pt-10 pb-8 px-8 text-center">
          {/* Logo / Icon */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg">
            <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-emerald-800">Absensi Sholat</h1>
          <p className="text-emerald-600 mt-2 text-sm">Sistem Absensi Sholat 5 Waktu Berbasis Face Recognition</p>

          {/* School Name */}
          <p className="text-xs text-muted-foreground mt-1">
            {process.env.NEXT_PUBLIC_SCHOOL_NAME || "Pesantren Al-Hikmah"}
          </p>

          {/* Features */}
          <div className="mt-8 space-y-3 text-left">
            {[
              { icon: "🕐", text: "5 Waktu Sholat (Subuh, Dzuhur, Ashar, Maghrib, Isya)" },
              { icon: "👤", text: "Absensi dengan Scan Wajah" },
              { icon: "📊", text: "Laporan Kehadiran & Rekap Otomatis" },
              { icon: "💬", text: "Notifikasi WhatsApp ke Orang Tua" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-emerald-50/50">
                <span className="text-xl">{f.icon}</span>
                <span className="text-sm text-gray-700">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-8 space-y-3">
            <Button
              onClick={() => router.push("/login")}
              className="w-full h-12 text-base bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Masuk sebagai Admin
            </Button>
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              className="w-full h-12 text-base border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              Mulai Absensi
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">v1.0.0 &middot; Built with Next.js & Supabase</p>
        </CardContent>
      </Card>
    </div>
  );
}
