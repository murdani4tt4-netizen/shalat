"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { PRAYER_TIMES, STATUS_LABELS } from "@/lib/types";
import type { AttendanceWithStudent } from "@/lib/types";
import { toast } from "sonner";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Download, Calendar, Filter } from "lucide-react";

export default function LaporanPage() {
  const [data, setData] = useState<AttendanceWithStudent[]>([]);
  const [dateFrom, setDateFrom] = useState(() => format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(() => format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"));
  const [filterPrayer, setFilterPrayer] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [classes, setClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchClasses(); }, []);
  useEffect(() => { fetchData(); }, [dateFrom, dateTo, filterPrayer, filterClass]);

  const fetchClasses = async () => {
    const { data } = await supabase.from("students").select("class").eq("is_active", true).order("class");
    if (data) {
      const unique = [...new Set(data.map((d: any) => d.class))];
      setClasses(unique);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    let query = supabase
      .from("attendance")
      .select(`*, student:students(*), prayer_time:prayer_times(*)`)
      .gte("date", dateFrom)
      .lte("date", dateTo)
      .order("date", { ascending: false });

    if (filterPrayer) query = query.eq("prayer_time_id", filterPrayer);
    if (filterClass) query = query.eq("student.class", filterClass);

    const { data: result } = await query;
    if (result) setData(result as AttendanceWithStudent[]);
    setLoading(false);
  };

  // Summary stats
  const summary = {
    total: data.length,
    hadir: data.filter((d) => d.status === "hadir").length,
    izin: data.filter((d) => d.status === "izin").length,
    sakit: data.filter((d) => d.status === "sakit").length,
    alpha: data.filter((d) => d.status === "alpha").length,
  };

  const exportCSV = () => {
    const headers = ["Tanggal", "Waktu Sholat", "NIM", "Nama", "Kelas", "Status", "Terverifikasi", "Akurasi Wajah"];
    const rows = data.map((d) => [
      d.date,
      d.prayer_time?.name || "",
      d.student?.nim || "",
      d.student?.name || "",
      d.student?.class || "",
      STATUS_LABELS[d.status]?.label || d.status,
      d.verified ? "Ya" : "Tidak",
      d.face_confidence ? `${d.face_confidence}%` : "-",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-absensi-${dateFrom}-sd-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Laporan berhasil diunduh");
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card><CardContent className="py-4 text-center"><p className="text-2xl font-bold">{summary.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><p className="text-2xl font-bold text-emerald-600">{summary.hadir}</p><p className="text-xs text-muted-foreground">Hadir</p></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><p className="text-2xl font-bold text-blue-600">{summary.izin}</p><p className="text-xs text-muted-foreground">Izin</p></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><p className="text-2xl font-bold text-amber-600">{summary.sakit}</p><p className="text-xs text-muted-foreground">Sakit</p></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><p className="text-2xl font-bold text-red-600">{summary.alpha}</p><p className="text-xs text-muted-foreground">Alpha</p></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Dari Tanggal</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Sampai Tanggal</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Waktu Sholat</label>
              <select value={filterPrayer} onChange={(e) => setFilterPrayer(e.target.value)} className="h-10 rounded-md border px-3 text-sm">
                <option value="">Semua</option>
                {PRAYER_TIMES.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Kelas</label>
              <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="h-10 rounded-md border px-3 text-sm">
                <option value="">Semua</option>
                {classes.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" />Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Sholat</TableHead>
                  <TableHead>NIM</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Wajah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">Memuat data...</TableCell></TableRow>
                ) : data.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Tidak ada data</TableCell></TableRow>
                ) : (
                  data.map((d) => {
                    const info = STATUS_LABELS[d.status];
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="text-sm">{format(new Date(d.date), "dd/MM/yy")}</TableCell>
                        <TableCell><Badge variant="outline">{d.prayer_time?.name}</Badge></TableCell>
                        <TableCell>{d.student?.nim}</TableCell>
                        <TableCell className="font-medium">{d.student?.name}</TableCell>
                        <TableCell>{d.student?.class}</TableCell>
                        <TableCell><Badge className={`${info?.color} text-xs`}>{info?.label}</Badge></TableCell>
                        <TableCell>
                          {d.verified ? (
                            <span className="text-xs text-emerald-600">{d.face_confidence}%</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Manual</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}