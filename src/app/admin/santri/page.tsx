"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import type { Student } from "@/lib/types";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, Camera, UserPlus, Users } from "lucide-react";

export default function SantriPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<Student[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", nim: "", class: "", gender: "L" as "L" | "P",
    parent_name: "", parent_phone: "",
  });

  useEffect(() => { fetchStudents(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    if (!q) { setFiltered(students); return; }
    setFiltered(students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.nim.toLowerCase().includes(q) || s.class.toLowerCase().includes(q)
    ));
  }, [search, students]);

  const fetchStudents = async () => {
    const { data } = await supabase.from("students").select("*").order("class").order("name");
    if (data) { setStudents(data); setFiltered(data); }
  };

  const openAddDialog = () => {
    setForm({ name: "", nim: "", class: "", gender: "L", parent_name: "", parent_phone: "" });
    setEditingStudent(null);
    setShowAddDialog(true);
  };

  const openEditDialog = (student: Student) => {
    setForm({
      name: student.name, nim: student.nim, class: student.class,
      gender: student.gender, parent_name: student.parent_name || "", parent_phone: student.parent_phone || "",
    });
    setEditingStudent(student);
    setShowAddDialog(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.nim || !form.class) {
      toast.error("Nama, NIM, dan Kelas wajib diisi");
      return;
    }

    if (editingStudent) {
      const { error } = await supabase.from("students").update({
        name: form.name, nim: form.nim, class: form.class, gender: form.gender,
        parent_name: form.parent_name, parent_phone: form.parent_phone,
      }).eq("id", editingStudent.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Data santri berhasil diperbarui");
    } else {
      const { error } = await supabase.from("students").insert({
        name: form.name, nim: form.nim, class: form.class, gender: form.gender,
        parent_name: form.parent_name, parent_phone: form.parent_phone,
        face_registered: false, is_active: true,
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Santri baru berhasil ditambahkan");
    }
    setShowAddDialog(false);
    fetchStudents();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Santri berhasil dihapus");
    setDeletingId(null);
    fetchStudents();
  };

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari santri..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={openAddDialog} className="bg-emerald-700 hover:bg-emerald-800 text-white">
          <Plus className="w-4 h-4 mr-2" />Tambah Santri
        </Button>
      </div>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-10">No</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>NIM</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>L/P</TableHead>
                  <TableHead>Wajah</TableHead>
                  <TableHead>No. Ortu</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((student, i) => (
                  <TableRow key={student.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.nim}</TableCell>
                    <TableCell><Badge variant="outline">{student.class}</Badge></TableCell>
                    <TableCell>{student.gender === "L" ? "L" : "P"}</TableCell>
                    <TableCell>
                      {student.face_registered ? (
                        <Badge className="bg-emerald-100 text-emerald-700">Terdaftar</Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">Belum</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{student.parent_phone || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => router.push(`/admin/santri/${student.id}/face-register`)}
                          title="Registrasi Wajah"
                        >
                          <Camera className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(student)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => setDeletingId(student.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      Tidak ada data santri
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStudent ? "Edit Santri" : "Tambah Santri Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Nama Lengkap *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama lengkap santri" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">NIM *</label>
                <Input value={form.nim} onChange={(e) => setForm({ ...form, nim: e.target.value })} placeholder="Nomor Induk" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kelas *</label>
                <Input value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} placeholder="Contoh: 7A" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Jenis Kelamin</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value as "L" | "P" })}
                  className="w-full h-10 rounded-md border px-3 text-sm"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">No. HP Orang Tua</label>
                <Input value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} placeholder="628xxxxxxxxxx" />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Nama Orang Tua</label>
                <Input value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} placeholder="Nama orang tua/wali" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white" onClick={handleSave}>
                {editingStudent ? "Simpan Perubahan" : "Tambah Santri"}
              </Button>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Batal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Santri?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Data santri dan seluruh riwayat absensinya akan dihapus secara permanen.
          </p>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => deletingId && handleDelete(deletingId)}>Hapus</Button>
            <Button variant="outline" onClick={() => setDeletingId(null)}>Batal</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}