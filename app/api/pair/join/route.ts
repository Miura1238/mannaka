// src/app/api/pair/join/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { code, deviceId } = await req.json();
    if (!code || !deviceId) {
      return NextResponse.json({ error: "code and deviceId required" }, { status: 400 });
    }

    const now = new Date().toISOString();

    // ✅ pairs に統一
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

    // ✅ 重複しても OK（ユニーク制約あるならここで綺麗になる）
    const { error: insErr } = await supabaseAdmin
      .from("pair_members")
      .upsert(
        { pair_id: pair.id, device_id: deviceId, role: "member" },
        { onConflict: "pair_id,device_id" }
      );

    if (insErr) throw insErr;

    return NextResponse.json({ pairId: pair.id }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
