"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { ROLE_LABELS, type UserRole } from "@/lib/types";
import type { AppUser } from "@/lib/types";
import { toast } from "sonner";
import { Plus, Edit, Trash2, ShieldCheck } from "lucide-react";

interface DbUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  assigned_class: string | null;
  is_active: boolean;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<DbUser | null>(null);
  const [form, setForm] = useState({
    username: "", password: "", name: "", role: "piket" as UserRole, assigned_class: "",
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); fetchClasses(); }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from("users").select("*").order("role").order("name");
    if (data) setUsers(data);
  };

  const fetchClasses = async () => {
    const { data } = await supabase.from("students").select("class").eq("is_active", true);
    if (data) setClasses([...new Set(data.map((d: any) => d.class))]);
  };

  const openAdd = () => {
    setForm({ username: "", password: "", name: "", role: "piket", assigned_class: "" });
    setEditingUser(null);
    setShowDialog(true);
  };

  const openEdit = (u: DbUser) => {
    setForm({ username: u.username, password: "", name: u.name, role: u.role, assigned_class: u.assigned_class || "" });
    setEditingUser(u);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.username) { toast.error("Nama dan username wajib"); return; }

    if (editingUser) {
      const updates: any = { name: form.name, role: form.role, assigned_class: form.assigned_class || null };
      if (form.password) updates.password = form.password;
      const { error } = await supabase.from("users").update(updates).eq("id", editingUser.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Pengguna diperbarui");
    } else {
      if (!form.password) { toast.error("Password wajib diisi untuk pengguna baru"); return; }
      const { error } = await supabase.from("users").insert({
        username: form.username, password: form.password, name: form.name,
        role: form.role, assigned_class: form.assigned_class || null,
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Pengguna ditambahkan");
    }
    setShowDialog(false);
    fetchUsers();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Pengguna dihapus");
    setDeletingId(null);
    fetchUsers();
  };

  const getRoleBadge = (role: UserRole) => {
    const info = ROLE_LABELS[role];
    const colors: Record<UserRole, string> = {
      admin: "bg-purple-100 text-purple-800",
      piket: "bg-blue-100 text-blue-800",
      wali_kelas: "bg-emerald-100 text-emerald-800",
      guru_wali: "bg-amber-100 text-amber-800",
    };
    return <Badge className={`${colors[role]} text-xs`}>{info.icon} {info.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Kelola Pengguna</h2>
          <p className="text-sm text-muted-foreground">4 role: Admin, Guru Piket, Wali Kelas, Guru Wali</p>
        </div>
        <Button onClick={openAdd} className="bg-emerald-700 hover:bg-emerald-800 text-white">
          <Plus className="w-4 h-4 mr-2" />Tambah Pengguna
        </Button>
      </div>

      {/* Role Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.entries(ROLE_LABELS) as [UserRole, typeof ROLE_LABELS[UserRole]][]).map(([role, info]) => (
          <Card key={role} className="border-0 shadow-sm">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <span className="text-2xl">{info.icon}</span>
              <div>
                <p className="font-medium text-sm">{info.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{info.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Username</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Kelas Ditugaskan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-sm">{u.username}</TableCell>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{getRoleBadge(u.role)}</TableCell>
                  <TableCell>{u.assigned_class || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={u.is_active ? "default" : "secondary"} className={u.is_active ? "bg-emerald-100 text-emerald-700" : ""}>
                      {u.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(u)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeletingId(u.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada pengguna</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingUser ? "Edit Pengguna" : "Tambah Pengguna"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username *</label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="username" disabled={!!editingUser} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password {editingUser ? "(kosongkan jika tidak diubah)" : "*"}</label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••" />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Nama Lengkap *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama lengkap" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role *</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className="w-full h-10 rounded-md border px-3 text-sm">
                  {(Object.entries(ROLE_LABELS) as [UserRole, typeof ROLE_LABELS[UserRole]][]).map(([role, info]) => (
                    <option key={role} value={role}>{info.icon} {info.label}</option>
                  ))}
                </select>
              </div>
              {(form.role === "wali_kelas") && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kelas yang Diampu</label>
                  <select value={form.assigned_class} onChange={(e) => setForm({ ...form, assigned_class: e.target.value })} className="w-full h-10 rounded-md border px-3 text-sm">
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white" onClick={handleSave}>
                {editingUser ? "Simpan" : "Tambah"}
              </Button>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Batal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Hapus Pengguna?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Pengguna akan dihapus secara permanen.</p>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => deletingId && handleDelete(deletingId)}>Hapus</Button>
            <Button variant="outline" onClick={() => setDeletingId(null)}>Batal</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}