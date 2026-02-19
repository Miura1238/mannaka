// src/app/api/pair/status/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { deviceId } = await req.json();
    if (!deviceId) return NextResponse.json({ error: "deviceId required" }, { status: 400 });

    // ✅ ここがポイント：複数行あっても落ちないように limit(1)
    const { data: membersLatest, error: mErr } = await supabaseAdmin
      .from("pair_members")
      .select("pair_id, role, created_at")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (mErr) throw mErr;

    const latest = membersLatest?.[0];
    if (!latest?.pair_id) return NextResponse.json({ hasPair: false }, { status: 200 });

    // ✅ pairs に統一
    const { data: pair, error: pErr } = await supabaseAdmin
      .from("pairs")
      .select("id, code, expires_at")
      .eq("id", latest.pair_id)
      .maybeSingle();

    if (pErr) throw pErr;
    if (!pair) return NextResponse.json({ hasPair: false }, { status: 200 });

    const { data: members, error: msErr } = await supabaseAdmin
      .from("pair_members")
      .select("device_id, role, created_at")
      .eq("pair_id", pair.id)
      .order("created_at", { ascending: true });

    if (msErr) throw msErr;

    return NextResponse.json({ hasPair: true, pair, members: members ?? [] }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
