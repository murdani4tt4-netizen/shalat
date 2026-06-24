"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import type { Student } from "@/lib/types";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// Safe wrapper that catches face-api import errors
const FaceRegister = dynamic(() => import("@/components/face-register-safe"), { ssr: false });

export default function FaceRegisterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [capturedDescriptor, setCapturedDescriptor] = useState<number[] | null>(null);

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const fetchStudent = async () => {
    const { data } = await supabase.from("students").select("*").eq("id", id).single();
    if (data) setStudent(data);
    setLoading(false);
  };

  const handleFaceCaptured = (descriptor: number[]) => {
    setCapturedDescriptor(descriptor);
  };

  const handleSave = async () => {
    if (!capturedDescriptor || !student) return;
    setSaving(true);
    const { error } = await supabase.from("students").update({
      face_descriptor: capturedDescriptor,
      face_registered: true,
    }).eq("id", student.id);
    if (error) {
      toast.error("Gagal menyimpan data wajah: " + error.message);
    } else {
      toast.success("Wajah berhasil didaftarkan untuk " + student.name);
      router.push("/admin/santri");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!student) {
    return <div className="text-center py-20 text-muted-foreground">Santri tidak ditemukan</div>;
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />Kembali
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registrasi Wajah</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${student.gender === "L" ? "bg-blue-500" : "bg-pink-500"}`}>
              {student.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium">{student.name}</p>
              <p className="text-sm text-muted-foreground">{student.nim} &middot; Kelas {student.class}</p>
            </div>
            {student.face_registered && (
              <Badge className="bg-emerald-100 text-emerald-700 ml-auto">Sudah Terdaftar</Badge>
            )}
          </div>

          {!capturedDescriptor ? (
            <FaceRegister onCapture={handleFaceCaptured} onCancel={() => router.back()} />
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <p className="font-medium text-emerald-700">Wajah berhasil diambil!</p>
              <p className="text-sm text-muted-foreground">3 foto telah diproses. Klik simpan untuk menyimpan.</p>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white">
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Simpan Data Wajah"}
                </Button>
                <Button variant="outline" onClick={() => setCapturedDescriptor(null)}>Ambil Ulang</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
