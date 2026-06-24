"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Save, Database, Bell, Shield } from "lucide-react";

export default function PengaturanPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from("settings").select("*");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((s: any) => { map[s.key] = s.value; });
      setSettings(map);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const updates = Object.entries(settings).map(([key, value]) =>
      supabase.from("settings").update({ value }).eq("key", key)
    );
    await Promise.all(updates);
    toast.success("Pengaturan berhasil disimpan");
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* School Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5" />Informasi Sekolah
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Sekolah / Pesantren</Label>
            <Input
              value={settings.school_name || ""}
              onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
              placeholder="Nama institusi"
            />
          </div>
        </CardContent>
      </Card>

      {/* Face Recognition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="w-5 h-5" />Pengenalan Wajah
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Threshold Kecocokan Wajah</Label>
            <Input
              type="number"
              step="0.05"
              min="0.3"
              max="1.0"
              value={settings.face_threshold || "0.6"}
              onChange={(e) => setSettings({ ...settings, face_threshold: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Semakin rendah nilai, semakin ketat validasi. Rekomendasi: 0.5 - 0.7
            </p>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5" />Notifikasi WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>API Key (Fonnte)</Label>
            <Input
              type="password"
              value={settings.whatsapp_api_key || ""}
              onChange={(e) => setSettings({ ...settings, whatsapp_api_key: e.target.value })}
              placeholder="Masukkan API key Fonnte"
            />
          </div>
          <div className="space-y-2">
            <Label>Device ID (Fonnte)</Label>
            <Input
              value={settings.whatsapp_device_id || ""}
              onChange={(e) => setSettings({ ...settings, whatsapp_device_id: e.target.value })}
              placeholder="Device ID Fonnte"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Dapatkan API key dan Device ID dari <a href="https://fonnte.com" target="_blank" className="text-emerald-600 underline" rel="noreferrer">fonnte.com</a>
          </p>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={loading} className="bg-emerald-700 hover:bg-emerald-800 text-white">
        <Save className="w-4 h-4 mr-2" />{loading ? "Menyimpan..." : "Simpan Pengaturan"}
      </Button>
    </div>
  );
}