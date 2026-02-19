// app/api/pair/join/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { code, deviceId } = await req.json();

    if (!code || !deviceId) {
      return NextResponse.json({ error: "code and deviceId required" }, { status: 400 });
    }

    // コード一致 & 期限内のpairを探す
    const now = new Date().toISOString();
    const { data: pair, error: pairErr } = await supabaseAdmin
      .from("pairs")
      .select("id, code, expires_at")
      .eq("code", String(code))
      .gt("expires_at", now)
      .maybeSingle();

    if (pairErr) throw pairErr;
    if (!pair) {
      return NextResponse.json({ error: "invalid_or_expired_code" }, { status: 404 });
    }

    // すでに参加してたらOK（重複防止）
    const { data: existing, error: exErr } = await supabaseAdmin
      .from("pair_members")
      .select("id")
      .eq("pair_id", pair.id)
      .eq("device_id", deviceId)
      .maybeSingle();

    if (exErr) throw exErr;

    if (!existing) {
      const { error: insErr } = await supabaseAdmin
        .from("pair_members")
        .insert([{ pair_id: pair.id, device_id: deviceId, role: "member" }]);

      if (insErr) throw insErr;
    }

    return NextResponse.json({ pairId: pair.id }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
