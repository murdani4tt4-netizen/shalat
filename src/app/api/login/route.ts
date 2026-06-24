import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, message: "Username dan password wajib diisi" }, { status: 400 });
    }

    // Try Supabase users table first
    try {
      const { data: dbUser, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .eq("is_active", true)
        .single();

      if (dbUser && !error) {
        return NextResponse.json({
          success: true,
          token: Buffer.from(`${username}:${Date.now()}`).toString("base64"),
          user: {
            id: dbUser.id,
            username: dbUser.username,
            name: dbUser.name,
            role: dbUser.role,
            assignedClass: dbUser.assigned_class,
            assignedStudents: dbUser.assigned_students,
          },
        });
      }
    } catch {}

    // Fallback: env-based admin (backward compat)
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (username === adminUsername && password === adminPassword) {
      return NextResponse.json({
        success: true,
        token: Buffer.from(`${username}:${Date.now()}`).toString("base64"),
        user: {
          id: "env-admin",
          username,
          name: "Administrator",
          role: "admin",
          assignedClass: null,
          assignedStudents: null,
        },
      });
    }

    return NextResponse.json({ success: false, message: "Username atau password salah" }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }
}
