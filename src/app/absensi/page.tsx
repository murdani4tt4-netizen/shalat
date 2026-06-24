"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { PRAYER_TIMES, STATUS_LABELS } from "@/lib/types";
import type { Student } from "@/lib/types";
import { toast } from "sonner";
import { ArrowLeft, Search, UserCheck, Camera, AlertCircle, CheckCircle2, Users } from "lucide-react";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import { useAppStore } from "@/lib/store";

// Safe wrapper that catches face-api import errors
const FaceScanner = dynamic(() => import("@/components/face-scanner-safe"), { ssr: false });

function AbsensiContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prayerId = searchParams.get("prayer") || "subuh";
  const prayer = PRAYER_TIMES.find((p) => p.id === prayerId) || PRAYER_TIMES[0];
  const [students, setStudents] = useState<Student[]>([]);
  const [filtered, setFiltered] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [today] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [todayAttendance, setTodayAttendance] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualStatus, setManualStatus] = useState<string>("hadir");

  const user = useAppStore((s) => s.user);

  useEffect(() => {
    fetchStudents();
    fetchTodayAttendance();
  }, [prayerId, today]);

  const fetchStudents = async () => {
    let query = supabase
      .from("students")
      .select("*")
      .eq("is_active", true);

    // Wali Kelas: hanya santri kelas yang diampu
    if (user?.role === "wali_kelas" && user.assignedClass) {
      query = query.eq("class", user.assignedClass);
    }

    const { data } = await query.order("class").order("name");
    if (data) {
      setStudents(data);
      setFiltered(data);
    }
  };

  const fetchTodayAttendance = async () => {
    const { data } = await supabase
      .from("attendance")
      .select("student_id, status")
      .eq("prayer_time_id", prayerId)
      .eq("date", today);
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((a: { student_id: string; status: string }) => { map[a.student_id] = a.status; });
      setTodayAttendance(map);
    }
  };

  useEffect(() => {
    const q = search.toLowerCase();
    if (!q) { setFiltered(students); return; }
    setFiltered(
      students.filter(
        (s) => s.name.toLowerCase().includes(q) || s.nim.toLowerCase().includes(q) || s.class.toLowerCase().includes(q)
      )
    );
  }, [search, students]);

  const handleSelectStudent = (student: Student) => {
    if (todayAttendance[student.id]) {
      toast.info(`${student.name} sudah diabsen (${STATUS_LABELS[todayAttendance[student.id]]?.label})`);
      return;
    }
    if (!student.face_registered) {
      toast.warning("Santri ini belum terdaftar wajahnya. Gunakan absensi manual.");
      setSelectedStudent(student);
      setShowManualDialog(true);
      return;
    }
    setSelectedStudent(student);
    setShowScanner(true);
  };

  const handleFaceVerified = async (confidence: number) => {
    if (!selectedStudent) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("attendance").insert({
        student_id: selectedStudent.id,
        prayer_time_id: prayerId,
        date: today,
        status: "hadir",
        verified: true,
        face_confidence: confidence,
      });
      if (error) throw error;

      toast.success(`${selectedStudent.name} - ${prayer.name}: HADIR (Face: ${confidence}%)`);

      // Trigger WhatsApp notification
      try {
        await fetch("/api/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentName: selectedStudent.name,
            prayerName: prayer.name,
            status: "Hadir",
            parentPhone: selectedStudent.parent_phone,
            confidence,
          }),
        });
      } catch {}

      setShowScanner(false);
      setSelectedStudent(null);
      fetchTodayAttendance();
    } catch (err: any) {
      toast.error("Gagal menyimpan absensi: " + err.message);
    }
    setSubmitting(false);
  };

  const handleManualSubmit = async () => {
    if (!selectedStudent) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("attendance").insert({
        student_id: selectedStudent.id,
        prayer_time_id: prayerId,
        date: today,
        status: manualStatus,
        verified: false,
        face_confidence: null,
      });
      if (error) throw error;

      const statusLabel = STATUS_LABELS[manualStatus]?.label || manualStatus;
      toast.success(`${selectedStudent.name} - ${prayer.name}: ${statusLabel}`);

      if (manualStatus !== "hadir" && selectedStudent.parent_phone) {
        try {
          await fetch("/api/whatsapp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentName: selectedStudent.name,
              prayerName: prayer.name,
              status: statusLabel,
              parentPhone: selectedStudent.parent_phone,
              confidence: null,
            }),
          });
        } catch {}
      }

      setShowManualDialog(false);
      setSelectedStudent(null);
      setManualStatus("hadir");
      fetchTodayAttendance();
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + err.message);
    }
    setSubmitting(false);
  };

  const attendanceCount = Object.keys(todayAttendance).length;
  const hadirCount = Object.values(todayAttendance).filter((s) => s === "hadir").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="bg-emerald-700 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Absensi {prayer.name}</h1>
            <p className="text-emerald-200 text-xs">{prayer.nameAr} &middot; {format(new Date(), "dd MMMM yyyy", { locale: { code: "id" } as any })}</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="py-3 px-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">{attendanceCount}</p>
              <p className="text-xs text-muted-foreground">Sudah Absen</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="py-3 px-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">{hadirCount}</p>
              <p className="text-xs text-muted-foreground">Hadir</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="py-3 px-4 text-center">
              <p className="text-2xl font-bold text-gray-500">{students.length - attendanceCount}</p>
              <p className="text-xs text-muted-foreground">Belum Absen</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, NIM, atau kelas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11"
          />
        </div>

        {/* Student List */}
        <div className="space-y-2">
          {filtered.map((student) => {
            const status = todayAttendance[student.id];
            const statusInfo = status ? STATUS_LABELS[status] : null;
            return (
              <Card
                key={student.id}
                className={`border-0 shadow-sm cursor-pointer transition-all hover:shadow-md ${status ? "opacity-70" : "hover:border-emerald-300"}`}
                onClick={() => handleSelectStudent(student)}
              >
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${student.gender === "L" ? "bg-blue-500" : "bg-pink-500"}`}>
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.nim} &middot; Kelas {student.class}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!student.face_registered && (
                      <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">No Face</Badge>
                    )}
                    {statusInfo ? (
                      <Badge className={`${statusInfo.color} text-xs`}>{statusInfo.label}</Badge>
                    ) : (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <Camera className="w-4 h-4" />
                        <span className="text-xs font-medium">Absen</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Tidak ada santri ditemukan</p>
            </div>
          )}
        </div>
      </main>

      {/* Face Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
 <DialogHeader className="sr-only">
            <DialogTitle>Scan Wajah - {selectedStudent?.name}</DialogTitle>
          </DialogHeader>
          <FaceScanner
            studentName={selectedStudent?.name || ""}
            faceDescriptor={selectedStudent?.face_descriptor || null}
            onVerified={handleFaceVerified}
            onCancel={() => setShowScanner(false)}
            loading={submitting}
          />
        </DialogContent>
      </Dialog>

      {/* Manual Attendance Dialog */}
      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Absensi Manual - {selectedStudent?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Santri ini belum terdaftar wajahnya. Pilih status kehadiran secara manual.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {["hadir", "izin", "sakit", "alpha"].map((s) => {
                const info = STATUS_LABELS[s];
                return (
                  <button
                    key={s}
                    onClick={() => setManualStatus(s)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${manualStatus === s ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <span className={`text-sm font-medium ${manualStatus === s ? "text-emerald-700" : "text-gray-600"}`}>{info?.label}</span>
                  </button>
                );
              })}
            </div>
            <Button
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white"
              onClick={handleManualSubmit}
              disabled={submitting}
            >
              {submitting ? "Menyimpan..." : "Simpan Absensi"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AbsensiPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat...</div>}>
      <AbsensiContent />
    </Suspense>
  );
}
