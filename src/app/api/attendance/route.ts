import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, prayer_time_id, status, verified, face_confidence } = body;

    if (!student_id || !prayer_time_id) {
      return NextResponse.json({ error: "student_id and prayer_time_id are required" }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];

    // Check if already recorded
    const { data: existing } = await supabase
      .from("attendance")
      .select("id")
      .eq("student_id", student_id)
      .eq("prayer_time_id", prayer_time_id)
      .eq("date", today)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Already recorded today" }, { status: 409 });
    }

    const { data, error } = await supabase.from("attendance").insert({
      student_id,
      prayer_time_id,
      date: today,
      status: status || "hadir",
      verified: verified || false,
      face_confidence: face_confidence || null,
    }).select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const prayerTimeId = searchParams.get("prayer_time_id");

  let query = supabase
    .from("attendance")
    .select(`*, student:students(name, nim, class), prayer_time:prayer_times(name)`)
    .eq("date", date);

  if (prayerTimeId) {
    query = query.eq("prayer_time_id", prayerTimeId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}