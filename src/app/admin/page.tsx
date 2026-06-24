"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { PRAYER_TIMES } from "@/lib/types";
import type { Student, Attendance } from "@/lib/types";
import { Users, UserCheck, UserX, Camera, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    faceRegistered: 0,
    todayHadir: 0,
    todayTotal: 0,
  });
  const [todayPerPrayer, setTodayPerPrayer] = useState<Record<string, { hadir: number; total: number }>>({});
  const [today] = useState(() => format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    fetchStats();
  }, [today]);

  const fetchStats = async () => {
    // Total students
    const { count: totalStudents } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Face registered
    const { count: faceRegistered } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("face_registered", true);

    // Today's attendance
    const { data: todayData } = await supabase
      .from("attendance")
      .select("student_id, status, prayer_time_id")
      .eq("date", today);

    const todayTotal = new Set(todayData?.map((a) => a.student_id)).size || 0;
    const todayHadir = todayData?.filter((a) => a.status === "hadir").length || 0;

    // Per prayer
    const prayerStats: Record<string, { hadir: number; total: number }> = {};
    PRAYER_TIMES.forEach((p) => { prayerStats[p.id] = { hadir: 0, total: 0 }; });
    todayData?.forEach((a) => {
      if (prayerStats[a.prayer_time_id]) {
        prayerStats[a.prayer_time_id].total++;
        if (a.status === "hadir") prayerStats[a.prayer_time_id].hadir++;
      }
    });

    setStats({
      totalStudents: totalStudents || 0,
      faceRegistered: faceRegistered || 0,
      todayHadir,
      todayTotal,
    });
    setTodayPerPrayer(prayerStats);
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Santri</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalStudents}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Wajah Terdaftar</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.faceRegistered}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Camera className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hadir Hari Ini</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.todayHadir}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Belum Absen</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{stats.totalStudents - stats.todayTotal}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <UserX className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Prayer Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Kehadiran Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {PRAYER_TIMES.map((prayer) => {
              const data = todayPerPrayer[prayer.id] || { hadir: 0, total: 0 };
              const pct = stats.totalStudents > 0 ? Math.round((data.hadir / stats.totalStudents) * 100) : 0;
              return (
                <div key={prayer.id} className="text-center p-4 rounded-xl bg-gray-50 border">
                  <span className="text-2xl">{prayer.icon}</span>
                  <p className="font-medium mt-2 text-sm">{prayer.name}</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">{data.hadir}</p>
                  <p className="text-xs text-muted-foreground">dari {stats.totalStudents} santri</p>
                  <div className="mt-2">
                    <Badge variant={pct >= 80 ? "default" : pct >= 50 ? "secondary" : "destructive"} className={pct >= 80 ? "bg-emerald-100 text-emerald-700" : ""}>
                      {pct}%
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
