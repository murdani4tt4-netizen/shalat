import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentName, prayerName, status, parentPhone, confidence } = body;

    if (!parentPhone) {
      return NextResponse.json({ success: false, message: "No parent phone" }, { status: 400 });
    }

    // Get WhatsApp settings from database
    const { data: settings } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["whatsapp_api_key", "whatsapp_device_id", "school_name", "whatsapp_enabled"]);

    if (!settings || settings.length === 0) {
      return NextResponse.json({ success: false, message: "WhatsApp not configured" });
    }

    const settingsMap: Record<string, string> = {};
    settings.forEach((s: any) => { settingsMap[s.key] = s.value; });

    if (settingsMap.whatsapp_enabled === "false") {
      return NextResponse.json({ success: false, message: "WhatsApp disabled" });
    }

    const apiKey = settingsMap.whatsapp_api_key || process.env.FONNTE_API_KEY;
    const deviceId = settingsMap.whatsapp_device_id || process.env.FONNTE_DEVICE_ID;
    const schoolName = settingsMap.school_name || process.env.NEXT_PUBLIC_SCHOOL_NAME || "Pesantren";

    if (!apiKey) {
      return NextResponse.json({ success: false, message: "WhatsApp API key not configured" });
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const dateStr = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    const statusEmoji = status === "Hadir" ? "✅" : status === "Izin" ? "📋" : status === "Sakit" ? "🏥" : "❌";

    const message = `السلام عليكم ورحمة الله

*NOTIFIKASI ABSENSI SHOLAT*
🏫 ${schoolName}

👤 *${studentName}*
🕌 Sholat: *${prayerName}*
📅 Tanggal: ${dateStr}
🕐 Waktu: ${timeStr} WIB
${statusEmoji} Status: *${status.toUpperCase()}*
${confidence ? `🎯 Akurasi Wajah: ${confidence}%` : ""}

_Ini adalah pesan otomatis dari sistem absensi sholat._`;

    // Send via Fonnte API
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({
        target: parentPhone.startsWith("0") ? "62" + parentPhone.substring(1) : parentPhone,
        message,
        deviceId: deviceId || undefined,
      }),
    });

    const result = await response.json();
    console.log("WhatsApp API response:", result);

    return NextResponse.json({
      success: true,
      message: "WhatsApp notification sent",
      detail: result,
    });
  } catch (error: any) {
    console.error("WhatsApp API error:", error);
    return NextResponse.json({
      success: false,
      message: error.message,
    }, { status: 500 });
  }
}
