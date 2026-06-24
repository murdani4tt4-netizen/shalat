"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { LogIn, Eye, EyeOff, BookOpen } from "lucide-react";

const DEMO_ACCOUNTS = [
  { username: "admin", password: "admin123", role: "Admin", desc: "Akses penuh" },
  { username: "piket1", password: "piket123", role: "Guru Piket", desc: "Absensi semua kelas" },
  { username: "walikelas7a", password: "walikelas123", role: "Wali Kelas 7A", desc: "Absensi kelas 7A" },
  { username: "guruwali1", password: "guruwali123", role: "Guru Wali", desc: "Lihat laporan santri" },
];

export default function LoginPage() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(username, password);
    if (success) {
      toast.success("Login berhasil!");
      router.push("/dashboard");
    } else {
      toast.error("Username atau password salah");
    }
    setLoading(false);
  };

  const handleDemoLogin = async (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setLoading(true);
    const success = await login(u, p);
    if (success) {
      toast.success("Login berhasil!");
      router.push("/dashboard");
    } else {
      toast.error("Gagal login. Pastikan database sudah disetup.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center islamic-pattern p-4">
      <div className="w-full max-w-md space-y-4">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2 pt-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-700 flex items-center justify-center">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-emerald-800">Login</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Masuk ke sistem absensi sholat</p>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" type="text" placeholder="Masukkan username" value={username} onChange={(e) => setUsername(e.target.value)} required className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Masukkan password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white" disabled={loading}>
                {loading ? "Memproses..." : "Masuk"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button onClick={() => router.push("/")} className="text-sm text-muted-foreground hover:text-emerald-700">&larr; Kembali</button>
            </div>
          </CardContent>
        </Card>

        {/* Demo Accounts Card */}
        <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
          <CardContent className="pt-4 pb-4 px-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">Akun Demo</span>
              <span className="text-xs text-muted-foreground">(setelah setup database)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  onClick={() => handleDemoLogin(acc.username, acc.password)}
                  disabled={loading}
                  className="text-left p-2.5 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                >
                  <p className="text-xs font-semibold text-gray-800">{acc.role}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{acc.desc}</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5 font-mono">{acc.username} / {acc.password}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
